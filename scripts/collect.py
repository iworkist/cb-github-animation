#!/usr/bin/env python3
"""Collect Cloud-Barista GitHub data for the opening animation.

Writes:
  data/github.json      raw collected data (for inspection)
  data/data.js          window.CB_GITHUB = {...}  (loaded by index.html, works from file://)
  assets/avatars/*      contributor avatars (so the show runs offline)
  assets/org.png        organization avatar

Everything time-based (monthly activity, first/last contribution per person, first commit per
repo, hour-of-day distribution) is derived from each repo's default-branch commit list, so the
collector does not depend on GitHub's lazily computed statistics endpoints.

Usage:
  python3 scripts/collect.py            # uses `gh auth token` or $GITHUB_TOKEN
  python3 scripts/collect.py --no-avatars
"""
import json
import os
import subprocess
import sys
import time
import urllib.error
import urllib.request
from concurrent.futures import ThreadPoolExecutor
from datetime import datetime, timedelta, timezone

ORG = "cloud-barista"
ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
DATA_DIR = os.path.join(ROOT, "data")
AVATAR_DIR = os.path.join(ROOT, "assets", "avatars")
KST = timezone(timedelta(hours=9))

# Forks of unrelated upstream projects: their contributor lists are not Cloud-Barista people.
EXCLUDE_CONTRIBUTORS_OF = {"cb-tumblebug-dashboard", "cloud-barista.github.com"}
# Automation accounts that commit on behalf of the project.
EXCLUDE_LOGINS = {"cb-github-robot", "cb-spider", "fossabot"}


def token():
    t = os.environ.get("GITHUB_TOKEN")
    if t:
        return t
    try:
        return subprocess.check_output(["gh", "auth", "token"], text=True).strip()
    except Exception:
        return None


TOKEN = token()


def api(path):
    url = path if path.startswith("http") else f"https://api.github.com/{path.lstrip('/')}"
    headers = {"Accept": "application/vnd.github+json", "User-Agent": "cb-opening-collector"}
    if TOKEN:
        headers["Authorization"] = f"Bearer {TOKEN}"
    for attempt in range(8):
        req = urllib.request.Request(url, headers=headers)
        try:
            with urllib.request.urlopen(req, timeout=60) as r:
                if r.status == 204:
                    return None, {}
                body = r.read()
                return (json.loads(body) if body else None), dict(r.headers)
        except urllib.error.HTTPError as e:
            if e.code in (403, 429, 500, 502, 503) and attempt < 7:
                time.sleep(10 * (attempt + 1))
                continue
            if e.code in (404, 409, 451):
                return None, {}
            raise
        except (urllib.error.URLError, TimeoutError):
            if attempt < 7:
                time.sleep(5 * (attempt + 1))
                continue
            raise
    return None, {}


def paged(path):
    out = []
    sep = "&" if "?" in path else "?"
    url = f"https://api.github.com/{path}{sep}per_page=100"
    while url:
        data, headers = api(url)
        if not data:
            break
        out.extend(data)
        url = None
        for part in headers.get("Link", headers.get("link", "")).split(","):
            if 'rel="next"' in part:
                url = part[part.find("<") + 1:part.find(">")]
    return out


def is_bot(login, typ):
    return (typ == "Bot" or login.endswith("[bot]")
            or login in {"actions-user", "github-actions"} or login in EXCLUDE_LOGINS)


def collect_repo(repo):
    name = repo["name"]
    info = {
        "name": name,
        "description": repo.get("description") or "",
        "created_at": repo["created_at"],
        "pushed_at": repo["pushed_at"],
        "stars": repo["stargazers_count"],
        "forks": repo["forks_count"],
        "archived": repo["archived"],
        "fork": repo["fork"],
        "language": repo.get("language") or "",
        "topics": repo.get("topics") or [],
        "html_url": repo["html_url"],
        "contributors": [],
        "first_commit": None,
    }
    if name in EXCLUDE_CONTRIBUTORS_OF:
        return info

    by_login = {}
    for c in paged(f"repos/{ORG}/{name}/contributors"):
        if is_bot(c["login"], c.get("type")):
            continue
        by_login[c["login"]] = {"login": c["login"], "commits": c["contributions"], "first": None, "last": None}

    monthly = {}
    punch = [[0] * 24 for _ in range(7)]  # [weekday Mon..Sun][hour, KST]
    oldest = None
    for c in paged(f"repos/{ORG}/{name}/commits"):
        date = c["commit"]["author"]["date"]  # UTC, e.g. 2019-05-13T02:51:02Z
        if oldest is None or date < oldest["commit"]["author"]["date"]:
            oldest = c
        if len(c.get("parents") or []) > 1:
            continue  # merge commits are not "work"; matches what GitHub's own graphs count
        login = (c.get("author") or {}).get("login")
        if login not in by_login:
            continue
        day = date[:10]
        monthly[day[:7]] = monthly.get(day[:7], 0) + 1
        p = by_login[login]
        p["first"] = min(p["first"], day) if p["first"] else day
        p["last"] = max(p["last"], day) if p["last"] else day
        local = datetime.fromisoformat(date.replace("Z", "+00:00")).astimezone(KST)
        punch[local.weekday()][local.hour] += 1

    if oldest:
        a = oldest.get("author") or {}
        info["first_commit"] = {
            "sha": oldest["sha"][:7],
            "date": oldest["commit"]["author"]["date"],
            "login": a.get("login"),
            "name": oldest["commit"]["author"]["name"],
            "message": oldest["commit"]["message"].strip().split("\n")[0][:120],
        }
    info["contributors"] = sorted(by_login.values(), key=lambda c: -c["commits"])
    info["monthly"] = monthly
    info["punch"] = punch
    return info


def download_avatar(login, url):
    os.makedirs(AVATAR_DIR, exist_ok=True)
    for ext in ("png", "jpg"):
        p = os.path.join(AVATAR_DIR, f"{login}.{ext}")
        if os.path.exists(p) and os.path.getsize(p) > 0:
            return f"assets/avatars/{login}.{ext}"
    sep = "&" if "?" in url else "?"
    req = urllib.request.Request(f"{url}{sep}s=240", headers={"User-Agent": "cb-opening-collector"})
    try:
        with urllib.request.urlopen(req, timeout=60) as r:
            ctype = r.headers.get("Content-Type", "")
            ext = "jpg" if "jpeg" in ctype else "png"
            p = os.path.join(AVATAR_DIR, f"{login}.{ext}")
            with open(p, "wb") as f:
                f.write(r.read())
            return f"assets/avatars/{login}.{ext}"
    except Exception as e:
        print(f"  ! avatar {login}: {e}", file=sys.stderr)
        return None


def load_previous():
    path = os.path.join(DATA_DIR, "github.json")
    if not os.path.exists(path):
        return None
    with open(path, encoding="utf-8") as f:
        return json.load(f)


def main():
    with_avatars = "--no-avatars" not in sys.argv
    print(f"[1/5] org + repos ({ORG})")
    org, _ = api(f"orgs/{ORG}")
    repos = paged(f"orgs/{ORG}/repos?type=public")
    repos.sort(key=lambda r: r["created_at"])
    print(f"      {len(repos)} repos")

    print("[2/5] contributors + commit history per repo")
    with ThreadPoolExecutor(max_workers=6) as ex:
        repo_infos = list(ex.map(collect_repo, repos))
    org_since = org["created_at"][:10]
    for r in repo_infos:
        # Drop people whose every commit predates the org: history imported from upstream templates/SDKs.
        r["contributors"] = [c for c in r["contributors"] if not c["last"] or c["last"] >= org_since]
        fc = r["first_commit"]
        if fc:
            fc["imported"] = fc["date"][:10] < org_since or r["fork"]
        print(f"      {r['name']:<28} {len(r['contributors']):>3} contributors  {sum(r.get('monthly', {}).values()):>5} commits")

    print("[3/5] releases")
    releases = [
        {"tag": r["tag_name"], "name": r.get("name") or r["tag_name"], "date": (r.get("published_at") or r["created_at"])[:10]}
        for r in paged(f"repos/{ORG}/cloud-barista/releases")
        if not r.get("draft")
    ]
    releases.sort(key=lambda r: r["date"])

    print("[4/5] people")
    people = {}
    for r in repo_infos:
        for c in r["contributors"]:
            p = people.setdefault(c["login"], {"login": c["login"], "commits": 0, "repos": [], "first": None, "last": None})
            p["commits"] += c["commits"]
            p["repos"].append(r["name"])
            for k, pick in (("first", min), ("last", max)):
                if c[k]:
                    p[k] = pick(p[k], c[k]) if p[k] else c[k]
            if not p["first"]:
                # only merge commits on record: fall back to the repo's creation date
                p.setdefault("first_fallback", r["created_at"][:10])

    def fetch_user(login):
        u, _ = api(f"users/{login}")
        return login, u or {}

    with ThreadPoolExecutor(max_workers=8) as ex:
        for login, u in ex.map(fetch_user, list(people)):
            people[login]["name"] = (u.get("name") or "").strip()
            people[login]["avatar_url"] = u.get("avatar_url") or f"https://github.com/{login}.png"
            people[login]["company"] = (u.get("company") or "").strip()
    for p in people.values():
        if not p["first"] and p.get("first_fallback"):
            p["first"] = p["first_fallback"]
        p.pop("first_fallback", None)
    print(f"      {len(people)} unique contributors")

    print("[5/5] avatars")
    if with_avatars:
        with ThreadPoolExecutor(max_workers=12) as ex:
            results = ex.map(lambda p: (p["login"], download_avatar(p["login"], p["avatar_url"])), list(people.values()))
            for login, path in results:
                people[login]["avatar"] = path
        org_avatar = download_avatar("__org__", org["avatar_url"])
        if org_avatar:
            os.replace(os.path.join(ROOT, org_avatar), os.path.join(ROOT, "assets", "org" + os.path.splitext(org_avatar)[1]))

    # Org-wide human commits per month and per weekday/hour; before org creation = imported history.
    activity = {}
    punch = [[0] * 24 for _ in range(7)]
    for r in repo_infos:
        for month, n in r.pop("monthly", {}).items():
            if month >= org_since[:7]:
                activity[month] = activity.get(month, 0) + n
        for d, row in enumerate(r.pop("punch", [])):
            for h, n in enumerate(row):
                punch[d][h] += n

    first_commit = None
    for r in repo_infos:
        fc = r["first_commit"]
        if fc and not fc["imported"] and (first_commit is None or fc["date"] < first_commit["date"]):
            first_commit = {**fc, "repo": r["name"]}

    out = {
        "generated_at": datetime.now(timezone.utc).isoformat(timespec="seconds"),
        "activity": dict(sorted(activity.items())),
        "punch": punch,
        "first_commit": first_commit,
        "org": {
            "login": ORG,
            "name": org.get("name"),
            "created_at": org.get("created_at"),
            "blog": org.get("blog"),
            "public_repos": org.get("public_repos"),
        },
        "releases": releases,
        "repos": repo_infos,
        "people": sorted(people.values(), key=lambda p: -p["commits"]),
    }
    os.makedirs(DATA_DIR, exist_ok=True)
    # Keep the previous files (and their timestamp) when nothing but the timestamp would change,
    # so the daily refresh only commits real changes.
    prev = load_previous()
    if prev and {**prev, "generated_at": None} == {**out, "generated_at": None}:
        print("no changes since", prev.get("generated_at"))
        return
    with open(os.path.join(DATA_DIR, "github.json"), "w", encoding="utf-8") as f:
        json.dump(out, f, ensure_ascii=False, indent=1)
    with open(os.path.join(DATA_DIR, "data.js"), "w", encoding="utf-8") as f:
        f.write("// Generated by scripts/collect.py — do not edit by hand.\n")
        f.write("window.CB_GITHUB = ")
        json.dump(out, f, ensure_ascii=False)
        f.write(";\n")
    print("done ->", os.path.join(DATA_DIR, "data.js"))


if __name__ == "__main__":
    main()
