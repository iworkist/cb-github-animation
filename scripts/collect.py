#!/usr/bin/env python3
"""Collect Cloud-Barista GitHub history for the opening loop.

Writes
  data/data.js     window.CB_DATA    : totals, timeline, punch card, repos, releases, people
  data/avatars.js  window.CB_AVATARS : login -> data URI (460px, the largest GitHub serves)

Avatars are embedded as data URIs so the show runs from file:// with no network
(and canvases that draw them stay untainted).

Token: $GITHUB_TOKEN, else `gh auth token`. Standard library only.
"""
import base64
import collections
import datetime as dt
import json
import os
import subprocess
import sys
import time
import urllib.error
import urllib.request

ORG = "cloud-barista"
API = "https://api.github.com"
ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
DATA = os.path.join(ROOT, "data")

# Spider drivers are directories; these are not clouds.
NOT_CLOUDS = {"mock", "docker", "cloudit", "common"}
CLOUD_LABELS = {
    "aws": "AWS", "azure": "Azure", "gcp": "GCP", "alibaba": "Alibaba",
    "tencent": "Tencent", "ibm": "IBM", "openstack": "OpenStack",
    "ncp": "NCP", "nhn": "NHN", "kt": "KT Cloud", "ktclassic": "KT Classic",
    "oracle": "Oracle",
}
# Photos are shown up to 340px (Head Baristas portrait), i.e. 600+ device pixels on a Retina or 4K
# screen. 460 is the largest size GitHub serves, so every avatar is fetched at that size.
AVATAR_PX = 460
BOTS = {"dependabot", "github-actions", "actions-user", "web-flow", "renovate", "imgbotapp", "cb-github-robot",
        "fossabot", "claude", "ghost"}  # automation, an AI assistant, deleted-account placeholder


def token():
    if os.environ.get("GITHUB_TOKEN"):
        return os.environ["GITHUB_TOKEN"]
    return subprocess.check_output(["gh", "auth", "token"], text=True).strip()


TOKEN = token()


def get(path, accept="application/vnd.github+json", raw=False):
    url = path if path.startswith("http") else API + path
    headers = {"User-Agent": "cb-opening-loop"}
    if url.startswith(API):
        headers["Authorization"] = "Bearer " + TOKEN
        headers["Accept"] = accept
    for attempt in range(6):
        try:
            with urllib.request.urlopen(urllib.request.Request(url, headers=headers), timeout=60) as r:
                body = r.read()
                if raw:
                    return body, r.headers.get("Content-Type", "")
                return r.status, (json.loads(body) if body else None), r.headers
        except urllib.error.HTTPError as e:
            if e.code in (403, 429) and attempt < 5:
                reset = int(e.headers.get("X-RateLimit-Reset", time.time() + 30))
                wait = max(5, min(120, reset - time.time()))
                print(f"  rate limited, waiting {wait:.0f}s", file=sys.stderr)
                time.sleep(wait)
                continue
            if e.code in (502, 503, 504) and attempt < 5:
                time.sleep(3 * (attempt + 1))
                continue
            if e.code in (404, 409, 451):  # empty repo, gone, blocked
                return (None, "") if raw else (e.code, None, e.headers)
            raise
        except urllib.error.URLError:
            if attempt < 5:
                time.sleep(3 * (attempt + 1))
                continue
            raise


def paged(path):
    sep = "&" if "?" in path else "?"
    url = f"{path}{sep}per_page=100"
    out = []
    while url:
        status, body, headers = get(url)
        if status != 200 or not body:
            break
        out.extend(body)
        url = None
        for part in (headers.get("Link") or "").split(","):
            if 'rel="next"' in part:
                url = part[part.index("<") + 1:part.index(">")]
    return out


def is_bot(user):
    if not user:
        return True
    login = user.get("login", "")
    return user.get("type") == "Bot" or login.endswith("[bot]") or login.lower() in BOTS


def day(s):
    return s[:10] if s else None


def week_day(ts):
    return dt.datetime.fromtimestamp(ts, dt.timezone.utc).strftime("%Y-%m-%d")


def contributor_stats(repos):
    """stats/contributors answers 202 while GitHub computes it; poll until all are ready."""
    pending = {r["name"] for r in repos if r["size"] > 0}
    result = {}
    for round_ in range(12):
        for name in sorted(pending):
            status, body, _ = get(f"/repos/{ORG}/{name}/stats/contributors")
            if status == 200:
                result[name] = body or []
            elif status == 204 or status in (404, 409):
                result[name] = []
        pending -= set(result)
        if not pending:
            break
        print(f"  waiting for stats: {len(pending)} repos", file=sys.stderr)
        time.sleep(5 + round_ * 3)
    for name in pending:
        result[name] = []
    return result


def punch_cards(repos):
    """stats/punch_card: commits per (weekday, hour) in each commit's own time zone. Also 202 while computing."""
    pending = {r["name"] for r in repos if r["size"] > 0 and not r["fork"]}
    result = {}
    for round_ in range(12):
        for name in sorted(pending):
            status, body, _ = get(f"/repos/{ORG}/{name}/stats/punch_card")
            if status == 200:
                result[name] = body or []
            elif status == 204 or status in (404, 409):
                result[name] = []
        pending -= set(result)
        if not pending:
            break
        print(f"  waiting for punch cards: {len(pending)} repos", file=sys.stderr)
        time.sleep(5 + round_ * 3)
    return result


def main():
    print("org", file=sys.stderr)
    _, org, _ = get(f"/orgs/{ORG}")
    repos = [r for r in paged(f"/orgs/{ORG}/repos?type=public") if not r["private"]]
    repos.sort(key=lambda r: r["created_at"])

    print("contributor stats", file=sys.stderr)
    stats = contributor_stats(repos)

    people = {}  # login -> record
    weekly = collections.Counter()  # week -> commits (org-wide)

    def person(user):
        login = user["login"]
        if login not in people:
            people[login] = {
                "login": login, "id": user.get("id"), "avatar_url": user.get("avatar_url"),
                "commits": 0, "prs": 0, "first": None, "last": None,
                "repos": collections.Counter(), "years": collections.Counter(),
            }
        return people[login]

    def touch(p, d):
        if p["first"] is None or d < p["first"]:
            p["first"] = d
        if p["last"] is None or d > p["last"]:
            p["last"] = d

    repo_rows = []
    for r in repos:
        name = r["name"]
        # Upstream history isn't ours: forks count from their creation, and history imported
        # from templates (e.g. the Jekyll theme behind the homepage) predates the organisation.
        since = day(r["created_at"]) if r["fork"] else day(org["created_at"])
        commits = 0
        authors = set()
        monthly = collections.Counter()
        for c in stats.get(name, []):
            if is_bot(c.get("author")):
                continue
            p = None
            for w in c["weeks"]:
                if not w["c"]:
                    continue
                d = week_day(w["w"])
                if d < since:
                    continue
                p = p or person(c["author"])
                p["commits"] += w["c"]
                p["repos"][name] += w["c"]
                p["years"][d[:4]] += w["c"]
                touch(p, d)
                weekly[d] += w["c"]
                monthly[d[:7]] += w["c"]
                commits += w["c"]
                authors.add(p["login"])
        repo_rows.append({
            "name": name, "created": day(r["created_at"]), "pushed": day(r["pushed_at"]),
            "stars": r["stargazers_count"], "forks": r["forks_count"], "archived": r["archived"],
            "fork": r["fork"], "lang": r["language"], "desc": r["description"] or "",
            "commits": commits, "authors": len(authors), "prs": 0,
            "monthly": dict(sorted(monthly.items())),
        })
    by_name_commits = {row["name"]: row["commits"] for row in repo_rows}

    print("punch cards", file=sys.stderr)
    # The punch card has no author or date filter (bots, imported template history), so each
    # repo's card is scaled to the human commits counted above: the shape stays, the total matches.
    punch = [[0.0] * 24 for _ in range(7)]  # [weekday 0=Sun][hour]
    for name, cells in punch_cards(repos).items():
        raw = sum(c for _, _, c in cells)
        human = by_name_commits.get(name, 0)
        if not raw or not human:
            continue
        for wd, hr, c in cells:
            punch[wd][hr] += c * human / raw
    punch = [[round(v) for v in row] for row in punch]

    print("pull requests", file=sys.stderr)
    prs = []
    by_name = {row["name"]: row for row in repo_rows}
    for r in repos:
        for pr in paged(f"/repos/{ORG}/{r['name']}/pulls?state=all"):
            if r["fork"] and pr["created_at"] < r["created_at"]:
                continue
            merged = day(pr.get("merged_at"))
            prs.append({"repo": r["name"], "created": day(pr["created_at"]), "merged": merged})
            if merged:
                by_name[r["name"]]["prs"] += 1
                if not is_bot(pr.get("user")):
                    p = person(pr["user"])
                    p["prs"] += 1
                    p["repos"][r["name"]] += 0
                    touch(p, merged)

    print("releases", file=sys.stderr)
    releases = []
    for r in repos:
        for rel in paged(f"/repos/{ORG}/{r['name']}/releases"):
            if rel.get("draft"):
                continue
            releases.append({
                "repo": r["name"], "tag": rel["tag_name"], "name": rel.get("name") or "",
                "date": day(rel.get("published_at") or rel.get("created_at")),
                "pre": bool(rel.get("prerelease")),
            })
    releases.sort(key=lambda x: x["date"] or "")

    print("issues", file=sys.stderr)
    _, issues, _ = get(f"/search/issues?q=org:{ORG}+is:issue&per_page=1")

    print("spider drivers", file=sys.stderr)
    _, drivers, _ = get(f"/repos/{ORG}/cb-spider/contents/cloud-control-manager/cloud-driver/drivers")
    clouds = []
    for d in drivers or []:
        n = d["name"]
        if d["type"] == "dir" and not n.endswith("-plugin") and n not in NOT_CLOUDS:
            clouds.append({"id": n, "label": CLOUD_LABELS.get(n, n.upper())})

    print(f"profiles + avatars ({len(people)})", file=sys.stderr)
    avatars = {}
    for login, p in people.items():
        status, prof, _ = get(f"/users/{login}")
        if status == 200 and prof:
            p["name"] = prof.get("name") or ""
            p["company"] = prof.get("company") or ""
            p["kind"] = prof.get("type")
            p["avatar_url"] = prof.get("avatar_url") or p["avatar_url"]
        if p.get("avatar_url"):
            url = p["avatar_url"] + ("&" if "?" in p["avatar_url"] else "?") + f"s={AVATAR_PX}"
            body, ctype = get(url, raw=True)
            if body:
                ctype = ctype.split(";")[0] or "image/png"
                avatars[login] = f"data:{ctype};base64," + base64.b64encode(body).decode()

    # ---- timeline (monthly, from the org's birth to now) ----
    start = day(org["created_at"])[:7]
    now = dt.date.today().strftime("%Y-%m")
    months = []
    y, m = map(int, start.split("-"))
    while f"{y:04d}-{m:02d}" <= now:
        months.append(f"{y:04d}-{m:02d}")
        m += 1
        if m > 12:
            y, m = y + 1, 1
    mi = {k: i for i, k in enumerate(months)}

    def bucket(d):
        return mi.get(d[:7]) if d else None

    tl = {k: [0] * len(months) for k in ("repos", "commits", "prs", "people", "releases")}
    for row in repo_rows:
        i = bucket(row["created"])
        if i is not None:
            tl["repos"][i] += 1
    for d, c in weekly.items():
        i = bucket(d)
        if i is not None:
            tl["commits"][i] += c
    for pr in prs:
        i = bucket(pr["merged"])
        if i is not None:
            tl["prs"][i] += 1
    for p in people.values():
        i = bucket(p["first"])
        if i is not None:
            tl["people"][i] += 1
    for rel in releases:
        i = bucket(rel["date"])
        if i is not None:
            tl["releases"][i] += 1

    # ---- people, ranked by footprint ----
    rows = []
    for p in people.values():
        if p.get("kind") == "Bot" or not p["first"]:
            continue
        top = [n for n, _ in p["repos"].most_common() if p["repos"][n] > 0][:4]
        rows.append({
            "login": p["login"], "name": p.get("name", ""), "company": p.get("company", ""),
            "org": p.get("kind") == "Organization",
            "commits": p["commits"], "prs": p["prs"], "first": p["first"], "last": p["last"],
            "repos": top, "nrepos": len([1 for v in p["repos"].values() if v >= 0]),
            "years": dict(sorted(p["years"].items())),
        })
    rows.sort(key=lambda r: (-(r["commits"] + r["prs"]), r["login"]))

    coffee = [
        {"tag": r["tag"], "name": r["name"], "date": r["date"]}
        for r in releases if r["repo"] == "cloud-barista" and not r["pre"]
    ]

    out = {
        "generatedAt": dt.datetime.now(dt.timezone.utc).strftime("%Y-%m-%dT%H:%M:%SZ"),
        "org": {"login": ORG, "created": day(org["created_at"]), "publicRepos": org["public_repos"]},
        "totals": {
            "repos": len(repo_rows),
            "people": len(rows),
            "commits": sum(r["commits"] for r in repo_rows),
            "prs": len(prs),
            "mergedPrs": sum(1 for p in prs if p["merged"]),
            "issues": (issues or {}).get("total_count", 0),
            "releases": len(releases),
            "stars": sum(r["stars"] for r in repo_rows),
            "forks": sum(r["forks"] for r in repo_rows),
            "clouds": len(clouds),
        },
        "months": months,
        "timeline": tl,
        "punch": punch,
        "repos": repo_rows,
        "coffee": coffee,
        "releases": [r for r in releases if not r["pre"]],
        "clouds": clouds,
        "people": rows,
    }
    os.makedirs(DATA, exist_ok=True)
    with open(os.path.join(DATA, "data.js"), "w", encoding="utf-8") as f:
        f.write("// Generated by scripts/collect.py — do not edit by hand.\n")
        f.write("window.CB_DATA = ")
        json.dump(out, f, ensure_ascii=False, separators=(",", ":"))
        f.write(";\n")
    with open(os.path.join(DATA, "avatars.js"), "w", encoding="utf-8") as f:
        f.write("// Generated by scripts/collect.py — GitHub avatars as data URIs.\n")
        f.write("window.CB_AVATARS = ")
        # sorted, so a scheduled run with unchanged photos leaves the file byte-identical
        json.dump(avatars, f, separators=(",", ":"), sort_keys=True)
        f.write(";\n")
    t = out["totals"]
    print(json.dumps(t), file=sys.stderr)


if __name__ == "__main__":
    main()
