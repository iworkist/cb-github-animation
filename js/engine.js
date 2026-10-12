// Show engine: stage scaling, a pausable show clock, scene contexts, playlist runner, HUD, background.
(function () {
  const STAGE_W = 1920;
  const STAGE_H = 1080;

  class Aborted extends Error {
    constructor() { super("aborted"); this.name = "Aborted"; }
  }

  // ---------- show clock (pausable, speed-scaled) ----------
  const clock = { t: 0, last: performance.now(), paused: false, speed: 1, timers: new Set(), tweens: new Set() };

  function frame(now) {
    const dt = Math.min(now - clock.last, 100);
    clock.last = now;
    if (!clock.paused) {
      clock.t += dt * clock.speed;
      for (const tm of [...clock.timers]) {
        if (clock.t >= tm.at) { clock.timers.delete(tm); tm.resolve(); }
      }
      for (const tw of [...clock.tweens]) {
        const p = Math.min(1, (clock.t - tw.start) / tw.dur);
        tw.fn(tw.ease(p), p);
        if (p >= 1) { clock.tweens.delete(tw); tw.resolve(); }
      }
    }
    requestAnimationFrame(frame);
  }
  requestAnimationFrame(frame);

  const ease = {
    linear: (t) => t,
    out: (t) => 1 - Math.pow(1 - t, 3),
    outExpo: (t) => (t === 1 ? 1 : 1 - Math.pow(2, -10 * t)),
    inOut: (t) => (t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2),
  };
  const EASE_OUT = "cubic-bezier(0.16, 1, 0.3, 1)";

  // ---------- scene context ----------
  function makeCtx(root) {
    const pending = new Set();
    const ctx = {
      root,
      aborted: false,
      wait(ms) {
        if (ctx.aborted) return Promise.reject(new Aborted());
        return new Promise((resolve, reject) => {
          const tm = { at: clock.t + ms, reject };
          tm.resolve = () => { pending.delete(tm); resolve(); };
          clock.timers.add(tm);
          pending.add(tm);
        });
      },
      tween(ms, fn, easing = ease.out) {
        if (ctx.aborted) return Promise.reject(new Aborted());
        return new Promise((resolve, reject) => {
          const tw = { start: clock.t, dur: Math.max(1, ms), fn, ease: easing, reject };
          tw.resolve = () => { pending.delete(tw); resolve(); };
          fn(easing(0), 0);
          clock.tweens.add(tw);
          pending.add(tw);
        });
      },
      // Web Animation scaled to show speed; starts after `delay` ms of show time.
      anim(el, keyframes, opts = {}) {
        if (!el) return null;
        const a = el.animate(keyframes, {
          duration: opts.duration ?? 700,
          delay: opts.delay ?? 0,
          easing: opts.easing ?? EASE_OUT,
          fill: opts.fill ?? "both",
          iterations: opts.iterations ?? 1,
          direction: opts.direction ?? "normal",
        });
        a.playbackRate = clock.speed;
        if (clock.paused) a.pause();
        return a;
      },
      // Fade/slide in a list of elements one after another.
      stagger(els, opts = {}) {
        const each = opts.each ?? 80;
        const from = opts.from ?? { opacity: 0, transform: "translateY(24px)" };
        const to = opts.to ?? { opacity: 1, transform: "none" };
        // fill "backwards": once finished, the element falls back to its own CSS (so later class-based states still apply)
        [...els].forEach((el, i) => ctx.anim(el, [from, to], { duration: opts.duration ?? 700, delay: (opts.delay ?? 0) + i * each, easing: opts.easing, fill: opts.fill ?? "backwards" }));
        return (els.length - 1) * each + (opts.duration ?? 700) + (opts.delay ?? 0);
      },
      countUp(el, to, ms = 1600, fmt = (v) => Math.round(v).toLocaleString("en-US")) {
        return ctx.tween(ms, (p) => { el.textContent = fmt(to * p); }, ease.outExpo);
      },
      abort() {
        ctx.aborted = true;
        for (const p of pending) { clock.timers.delete(p); clock.tweens.delete(p); p.reject(new Aborted()); }
        pending.clear();
      },
    };
    return ctx;
  }

  // ---------- DOM helpers ----------
  function h(tag, attrs, ...children) {
    const el = document.createElement(tag);
    if (typeof attrs === "string") el.className = attrs;
    else if (attrs) {
      for (const [k, v] of Object.entries(attrs)) {
        if (v == null || v === false) continue;
        if (k === "class") el.className = v;
        else if (k === "style" && typeof v === "object") Object.assign(el.style, v);
        else if (k === "html") el.innerHTML = v;
        else if (k.startsWith("--")) el.style.setProperty(k, v);
        else el.setAttribute(k, v);
      }
    }
    for (const c of children.flat(Infinity)) {
      if (c == null || c === false) continue;
      el.append(c instanceof Node ? c : document.createTextNode(String(c)));
    }
    return el;
  }

  function initials(p) {
    const s = (p.name || p.login || "?").trim();
    const parts = s.split(/[\s\-_]+/).filter(Boolean);
    return ((parts[0] || "?")[0] + (parts[1] ? parts[1][0] : "")).toUpperCase();
  }

  function avatar(p, size) {
    const el = h("div", { class: "av", style: { width: size + "px", height: size + "px" } });
    const ini = h("div", { class: "ini", style: { fontSize: Math.round(size * 0.36) + "px" } }, initials(p));
    if (p.avatar) {
      const img = h("img", { src: p.avatar, alt: "", draggable: "false" });
      img.onerror = () => { img.remove(); el.append(ini); };
      el.append(img);
    } else el.append(ini);
    return el;
  }

  // Coffee mug (kind=coffee) or tea cup (kind=tea), liquid colored, with animated steam.
  function cupSVG(liquid, kind = "coffee", { steam = true, stroke = "#f6ede3" } = {}) {
    const s = steam
      ? `<g class="steam" fill="none" stroke="${stroke}" stroke-width="2" stroke-linecap="round" opacity=".8">
           <path d="M24 16c-3-4 3-6 0-10"/><path d="M32 16c-3-4 3-6 0-10"/><path d="M40 16c-3-4 3-6 0-10"/></g>`
      : "";
    const body = kind === "tea"
      ? `<path d="M50 32a6 6 0 0 1 0 11h-3" fill="none" stroke="${stroke}" stroke-width="3" stroke-linecap="round"/>
         <path d="M11 24h40c0 13-9 22-20 22S11 37 11 24z" fill="${liquid}" stroke="${stroke}" stroke-width="3" stroke-linejoin="round"/>
         <path d="M14 24h34" stroke="rgba(255,255,255,.35)" stroke-width="2"/>
         <path d="M6 53c8 4 42 4 50 0" fill="none" stroke="${stroke}" stroke-width="3" stroke-linecap="round"/>`
      : `<path d="M45 28h3a7 7 0 0 1 0 14h-3" fill="none" stroke="${stroke}" stroke-width="3" stroke-linecap="round"/>
         <path d="M14 22h31v19c0 7-5 12-12 12h-7c-7 0-12-5-12-12z" fill="${liquid}" stroke="${stroke}" stroke-width="3" stroke-linejoin="round"/>
         <path d="M16 26h27" stroke="rgba(255,255,255,.35)" stroke-width="2"/>
         <path d="M10 58h44" stroke="${stroke}" stroke-width="3" stroke-linecap="round"/>`;
    return `<svg class="cup" viewBox="0 0 64 64" aria-hidden="true">${s}${body}</svg>`;
  }

  // Large hero illustration: a cup whose steam becomes a cloud.
  let uidN = 0;
  function heroCupSVG() {
    const id = "hc" + (++uidN);
    return `<svg class="cup hero" viewBox="0 0 300 300" aria-hidden="true">
      <defs>
        <linearGradient id="${id}l" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#c98a52"/><stop offset="1" stop-color="#5a321c"/></linearGradient>
        <linearGradient id="${id}c" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#bfe3ff"/><stop offset="1" stop-color="#7cc4ff"/></linearGradient>
      </defs>
      <path class="cloud" d="M96 112c-18 0-30-12-30-27 0-14 11-26 26-27 5-19 22-32 42-32 18 0 33 10 40 26 3-1 7-2 11-2 19 0 34 15 34 33 0 16-13 29-30 29z"
        fill="none" stroke="url(#${id}c)" stroke-width="6" stroke-linejoin="round" stroke-linecap="round"/>
      <g class="steam" fill="none" stroke="#f6ede3" stroke-width="5" stroke-linecap="round" opacity=".75">
        <path d="M120 150c-8-10 8-14 0-26"/><path d="M150 150c-8-10 8-14 0-26"/><path d="M180 150c-8-10 8-14 0-26"/>
      </g>
      <path class="handle" d="M228 182h10a22 22 0 0 1 0 44h-12" fill="none" stroke="#f6ede3" stroke-width="8" stroke-linecap="round"/>
      <path class="body" d="M72 166h158v58c0 24-19 42-42 42h-74c-23 0-42-18-42-42z" fill="url(#${id}l)" stroke="#f6ede3" stroke-width="8" stroke-linejoin="round"/>
      <path class="crema" d="M80 178h142" stroke="#e9b872" stroke-width="6" stroke-linecap="round"/>
      <path class="saucer" d="M48 284h206" stroke="#f6ede3" stroke-width="8" stroke-linecap="round"/>
    </svg>`;
  }

  function frag(html) {
    const t = document.createElement("template");
    t.innerHTML = html.trim();
    return t.content.firstElementChild;
  }

  // ---------- stage scaling ----------
  function fitStage(stage) {
    const s = Math.min(window.innerWidth / STAGE_W, window.innerHeight / STAGE_H);
    stage.style.transform = `translate(${-STAGE_W * s / 2}px, ${-STAGE_H * s / 2}px) scale(${s})`;
  }

  // ---------- background: slow rising "steam" particles ----------
  function startBackground(canvas) {
    const g = canvas.getContext("2d");
    let w = 0, hgt = 0, dpr = 1;
    const parts = [];
    function resize() {
      dpr = Math.min(window.devicePixelRatio || 1, 2);
      w = canvas.clientWidth; hgt = canvas.clientHeight;
      canvas.width = w * dpr; canvas.height = hgt * dpr;
      g.setTransform(dpr, 0, 0, dpr, 0, 0);
    }
    function spawn(initial) {
      return {
        x: Math.random() * w,
        y: initial ? Math.random() * hgt : hgt + 20,
        r: 0.6 + Math.random() * 2.2,
        vy: 0.12 + Math.random() * 0.35,
        sway: Math.random() * Math.PI * 2,
        a: 0.08 + Math.random() * 0.35,
        cool: Math.random() < 0.25,
      };
    }
    resize();
    for (let i = 0; i < 90; i++) parts.push(spawn(true));
    window.addEventListener("resize", resize);
    let last = 0;
    function draw(now) {
      requestAnimationFrame(draw);
      if (now - last < 33) return; // ~30fps is plenty for ambience
      const step = clock.paused ? 0 : Math.min(now - last, 100) / 16.7;
      last = now;
      g.clearRect(0, 0, w, hgt);
      for (let i = 0; i < parts.length; i++) {
        const p = parts[i];
        p.y -= p.vy * step;
        p.sway += 0.01 * step;
        const x = p.x + Math.sin(p.sway) * 18;
        if (p.y < -20) parts[i] = spawn(false);
        const fade = Math.min(1, p.y / (hgt * 0.4));
        g.beginPath();
        g.arc(x, p.y, p.r, 0, Math.PI * 2);
        g.fillStyle = p.cool ? `rgba(160,210,255,${p.a * fade})` : `rgba(240,200,150,${p.a * fade})`;
        g.fill();
      }
    }
    requestAnimationFrame(draw);
  }

  // ---------- HUD ----------
  function makeHud(cfg, sections) {
    const hud = document.getElementById("hud");
    const secEls = sections.map((s) => h("span", { "data-id": s.id }, s.label));
    const clockEl = h("div", "clock");
    hud.append(
      h("div", "brand", h("img", { src: "assets/org.png", alt: "" }), h("span", null, cfg.eventTitle), cfg.edition ? h("span", "sub", cfg.edition) : null),
      h("div", "sections", secEls),
      h("span", "paused", "PAUSED"),
      clockEl,
    );
    if (!cfg.showHud) hud.classList.add("hidden");
    const start = cfg.startTime ? new Date(cfg.startTime) : null;
    function tick() {
      const now = new Date();
      if (start && !isNaN(start)) {
        const ms = start - now;
        if (ms > 0) {
          const s = Math.floor(ms / 1000);
          const hh = Math.floor(s / 3600), mm = Math.floor((s % 3600) / 60), ss = s % 60;
          const t = (hh ? hh + ":" : "") + String(mm).padStart(2, "0") + ":" + String(ss).padStart(2, "0");
          clockEl.innerHTML = `오프닝까지<b>${t}</b>`;
          return;
        }
        clockEl.innerHTML = `<b>곧 시작합니다</b>`;
        return;
      }
      clockEl.innerHTML = `<b>${String(now.getHours()).padStart(2, "0")}:${String(now.getMinutes()).padStart(2, "0")}</b>`;
    }
    tick();
    setInterval(tick, 1000);
    return {
      el: hud,
      setSection(id, accent) {
        secEls.forEach((e) => e.classList.toggle("on", e.dataset.id === id));
        if (accent) hud.style.setProperty("--accent", accent);
      },
      toggle() { hud.classList.toggle("hidden"); },
      setPaused(p) { hud.classList.toggle("is-paused", p); },
    };
  }

  function preloadImages(urls, timeoutMs = 6000) {
    const loads = urls.map((u) => new Promise((res) => { const i = new Image(); i.onload = i.onerror = res; i.src = u; }));
    return Promise.race([Promise.all(loads), new Promise((r) => setTimeout(r, timeoutMs))]);
  }

  // ---------- runner ----------
  async function run({ cfg, playlist, sections, preload }) {
    const stage = document.getElementById("stage");
    fitStage(stage);
    window.addEventListener("resize", () => fitStage(stage));
    startBackground(document.querySelector("#bg canvas"));

    const params = new URLSearchParams(location.search);
    clock.speed = Number(params.get("speed")) || cfg.speed || 1;
    const once = params.has("once");
    const freezeAt = params.has("freeze") ? Number(params.get("freeze")) : null;

    await Promise.all([document.fonts.load('700 40px "Pretendard"').catch(() => {}), preloadImages(preload)]);
    const loading = document.getElementById("loading");
    loading.style.opacity = 0;
    setTimeout(() => loading.remove(), 700);

    const hud = makeHud(cfg, sections);
    let index = 0;
    const startId = params.get("scene");
    if (startId) index = Math.max(0, playlist.findIndex((p) => p.id === startId || p.id.startsWith(startId)));
    let current = null;
    let jumpTo = null;

    function setPaused(p) {
      if (p === clock.paused) return;
      clock.paused = p;
      hud.setPaused(p);
      for (const a of document.getAnimations()) {
        if (p && a.playState === "running") { a.pause(); a._showPaused = true; }
        else if (!p && a._showPaused) { a._showPaused = false; a.play(); }
      }
    }
    function go(delta) {
      if (!current) return;
      jumpTo = (current.index + delta + playlist.length) % playlist.length;
      setPaused(false);
      current.ctx.abort();
    }

    window.addEventListener("keydown", (e) => {
      if (e.key === "ArrowRight" || e.key === "PageDown") go(1);
      else if (e.key === "ArrowLeft" || e.key === "PageUp") go(-1);
      else if (e.key === " ") { e.preventDefault(); setPaused(!clock.paused); }
      else if (e.key === "f" || e.key === "F") {
        if (document.fullscreenElement) document.exitFullscreen();
        else document.documentElement.requestFullscreen().catch(() => {});
      } else if (e.key === "h" || e.key === "H") hud.toggle();
    });

    let idleTimer;
    window.addEventListener("mousemove", () => {
      document.body.classList.remove("idle");
      clearTimeout(idleTimer);
      idleTimer = setTimeout(() => document.body.classList.add("idle"), 2000);
    });
    document.body.classList.add("idle");

    for (;;) {
      const item = playlist[index];
      const root = h("section", `scene ${item.cls || ""}`);
      if (item.accent) {
        root.style.setProperty("--accent", item.accent);
        document.documentElement.style.setProperty("--glow", item.glow || item.accent);
      }
      stage.insertBefore(root, document.getElementById("hud"));
      const ctx = makeCtx(root);
      current = { ctx, index };
      // ?freeze=ms pauses the show at that moment of the scene (for screenshots / rehearsal)
      if (freezeAt != null) ctx.wait(freezeAt).then(() => { setPaused(true); hud.setPaused(false); }, () => {});
      hud.setSection(item.section, item.accent || "var(--crema)");
      let failed = false;
      try {
        await item.run(ctx);
      } catch (err) {
        if (!(err instanceof Aborted)) { console.error(`[show] scene ${item.id} failed`, err); failed = true; }
      }
      ctx.aborted = true;
      // crossfade out while the next scene builds in
      const out = root.animate([{ opacity: 1, filter: "blur(0px)" }, { opacity: 0, filter: "blur(6px)" }], { duration: 700, easing: "ease-in", fill: "forwards" });
      out.finished.then(() => root.remove(), () => root.remove());
      if (failed) await new Promise((r) => setTimeout(r, 800));

      if (jumpTo != null) { index = jumpTo; jumpTo = null; }
      else {
        index = (index + 1) % playlist.length;
        if (once && index === 0) break;
      }
    }
  }

  window.Show = { run, h, avatar, cupSVG, heroCupSVG, frag, ease, Aborted, clock };
})();
