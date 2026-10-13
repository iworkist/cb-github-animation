// Show loop. URL options (for rehearsal and screenshots):
//   ?scene=<id>    start at a scene (title, worldgen, chronicle, spider, tumblebug, inventory,
//                  brewing, stats, heroes, players, together, connect)
//   ?only=<id>     loop a single scene
//   ?t=<sec>       start that many seconds into the first scene
//   ?freeze=<sec>  stop the clock at that scene time
//   ?speed=<x>     play faster or slower
(function () {
  'use strict';
  const q = new URLSearchParams(location.search);
  const canvas = document.getElementById('world');

  function boot() {
    const world = new MC.World(canvas);
    const town = new Village.Town(world);
    const ctx = { world, town };
    const list = Scenes.scenes(ctx);
    const only = q.get('only');
    const order = only ? list.filter(s => s.id === only) : list;
    let si = Math.max(0, order.findIndex(s => s.id === (q.get('scene') || order[0].id)));
    const speed = parseFloat(q.get('speed') || '1');
    const freeze = q.has('freeze') ? parseFloat(q.get('freeze')) : null;
    let st = parseFloat(q.get('t') || '0');
    let scene = null;

    function enter(i) {
      if (scene && scene.exit) scene.exit();
      ctx.labels.clear();
      UI.clear();
      world.particles.clear();
      town.people.forEach(p => { p.pl.group.visible = false; });
      scene = order[i];
      scene.enter();
      document.body.dataset.scene = scene.id;
    }
    enter(si);

    let last = performance.now();
    function frame(now) {
      const dt = Math.max(0, Math.min(0.05, (now - last) / 1000)) * speed;
      last = now;
      if (freeze === null || st < freeze) st = freeze === null ? st + dt : Math.min(freeze, st + dt);
      if (st >= scene.dur) {
        st -= scene.dur;
        si = (si + 1) % order.length;
        enter(si);
      }
      scene.update(st, dt);
      // fade through black between scenes; dim the world behind GUI screens
      const fin = Math.min(1, st / 0.5), fout = Math.min(1, (scene.dur - st) / 0.5);
      UI.fade(1 - Math.min(fin, fout));
      UI.dim(scene.dim || 0);
      ctx.labels.render(world);
      world.update(dt);
      canvas.style.visibility = scene.no3d ? 'hidden' : 'visible';
      if (!scene.no3d) world.render();
      requestAnimationFrame(frame);
    }
    requestAnimationFrame(frame);
    window.SHOW = { world, town, ctx, get scene() { return scene.id; }, get t() { return st; } };
  }

  const fonts = document.fonts ? Promise.all([document.fonts.load('32px Galmuri11'), document.fonts.load('bold 32px Galmuri11')]).catch(() => null) : Promise.resolve();
  Promise.race([fonts, new Promise(r => setTimeout(r, 2500))]).then(() => setTimeout(boot, 30));
})();
