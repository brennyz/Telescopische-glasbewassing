(function (root) {
  var M = root.Malefiets;

  function createRun(level, pole) {
    return {
      level: level,
      pole: {
        id: pole.id,
        reach: pole.reach,
        speed: pole.speed,
        width: pole.width,
        turbo: pole.turbo,
        grace: pole.grace || 0,
        preview: pole.preview || 0
      },
      x: 0,
      lane: 1,
      laneLock: 0,
      strikes: 0,
      cleaned: 0,
      soap: 0,
      combo: 0,
      status: "run",
      turbo: 0,
      turboCool: 0,
      graceLeft: pole.grace || 0,
      bump: null,
      time: 0,
      fallenT: 0,
      shake: 0,
      washing: false,
      aim: null,
      windows: level.windows.map(function (w) {
        return {
          id: w.id,
          x: w.x,
          lane: w.lane,
          maxDirt: w.maxDirt,
          dirt: w.maxDirt,
          resolved: false,
          sparkle: 0,
          gain: 0
        };
      }),
      bumps: (level.bumps || []).map(function (b) {
        return { x: b.x, windowMs: b.windowMs, armed: false };
      })
    };
  }

  function maxStrikes(run) {
    var base = 2 + (run.pole.grace || 0);
    if (run.level && run.level.index === 0) return base + 3;
    return base;
  }

  function updateRun(run, dt, input) {
    input = input || {};
    if (run.status === "fallen") {
      run.fallenT += dt;
      run.washing = false;
      return run;
    }
    if (run.status !== "run") return run;
    dt = Math.max(0, Math.min(0.05, dt));
    run.time += dt;
    if (run.turbo > 0) run.turbo -= dt;
    if (run.turboCool > 0) run.turboCool -= dt;
    if (run.shake > 0) run.shake -= dt;
    if (run.laneLock > 0) run.laneLock -= dt;

    if (typeof input.laneSet === "number") {
      run.lane = Math.max(0, Math.min(2, input.laneSet));
      run.laneLock = 1.1;
      input.laneSet = null;
    }
    if (input.turbo && run.pole.turbo && run.turbo <= 0 && run.turboCool <= 0) {
      run.turbo = 2.4;
      run.turboCool = 7;
    }

    var slowed = false;
    if (run.bump) {
      slowed = true;
      run.bump.left -= dt;
      if (input.hold || input.washing) run.bump.held = true;
      if (run.bump.left <= 0) {
        if (!run.bump.held) {
          run.strikes += 1;
          run.combo = 0;
          run.shake = 0.45;
        }
        run.bump = null;
      }
    } else {
      for (var b = 0; b < run.bumps.length; b++) {
        var bump = run.bumps[b];
        if (!bump.armed && run.x >= bump.x) {
          bump.armed = true;
          run.bump = { left: bump.windowMs / 1000, held: false, windowMs: bump.windowMs };
          run.shake = 0.25;
          slowed = true;
          break;
        }
      }
    }

    run.x += run.level.speed * dt * (slowed ? 0.35 : 1);

    var nose = run.x + 36;
    var reach = 160 * run.pole.reach;
    var zoneEnd = nose + reach;
    var i;

    for (i = 0; i < run.windows.length; i++) {
      var passed = run.windows[i];
      if (passed.sparkle > 0) passed.sparkle -= dt;
      if (passed.resolved) continue;
      if (passed.x < nose - 6) {
        passed.resolved = true;
        if (passed.dirt > 0.14) {
          if (run.graceLeft > 0) {
            run.graceLeft -= 1;
            run.combo = 0;
          } else {
            run.strikes += 1;
            run.combo = 0;
            run.shake = 0.4;
          }
        } else {
          passed.dirt = 0;
          run.cleaned += 1;
          run.combo += 1;
          var gain = Math.round((7 + run.level.index * 0.35) * (1 + Math.min(run.combo, 12) * 0.08));
          passed.gain = gain;
          run.soap += gain;
          if (passed.sparkle <= 0) passed.sparkle = 0.55;
        }
      }
    }

    if (run.strikes > maxStrikes(run)) {
      run.status = "fallen";
      run.washing = false;
      run.aim = null;
      return run;
    }

    run.washing = !!input.washing;
    run.aim = null;
    if (input.washing) {
      var inZone = [];
      for (i = 0; i < run.windows.length; i++) {
        var win = run.windows[i];
        if (!win.resolved && win.dirt > 0 && win.x >= nose - 4 && win.x <= zoneEnd) inZone.push(win);
      }
      if (inZone.length) {
        var target = null;
        if (run.laneLock > 0) {
          for (i = 0; i < inZone.length; i++) {
            if (inZone[i].lane === run.lane) {
              target = inZone[i];
              break;
            }
          }
        }
        if (!target) {
          target = inZone[0];
          for (i = 1; i < inZone.length; i++) {
            if (inZone[i].x < target.x) target = inZone[i];
          }
          if (run.laneLock <= 0) run.lane = target.lane;
        }
        run.aim = { x: target.x, lane: target.lane };
        var rate = 0.85 * run.pole.speed * (run.turbo > 0 ? 1.85 : 1);
        var before = target.dirt;
        target.dirt = Math.max(0, target.dirt - rate * dt);
        if (before > 0 && target.dirt === 0) target.sparkle = 0.55;
        if (run.pole.width >= 1.5) {
          var laneSpan = run.pole.width >= 2.4 ? 2 : 1;
          for (i = 0; i < inZone.length; i++) {
            var extra = inZone[i];
            if (extra === target) continue;
            if (Math.abs(extra.lane - target.lane) <= laneSpan && Math.abs(extra.x - target.x) < 120) {
              var extraBefore = extra.dirt;
              extra.dirt = Math.max(0, extra.dirt - rate * 0.5 * dt);
              if (extraBefore > 0 && extra.dirt === 0) extra.sparkle = 0.55;
            }
          }
        }
      }
    }

    if (run.windows.length && run.windows.every(function (w) { return w.resolved; })) {
      var last = 0;
      for (i = 0; i < run.windows.length; i++) last = Math.max(last, run.windows[i].x);
      if (run.x > last + 70) run.status = "clear";
    }
    return run;
  }

  function laneY(h, lane) {
    if (lane === 2) return h * 0.28;
    if (lane === 1) return h * 0.46;
    return h * 0.62;
  }

  function hash(n) {
    var x = Math.sin(n * 127.1) * 43758.5453;
    return x - Math.floor(x);
  }

  function render(ctx, w, h, run, riderId) {
    var t = run.time;
    var cam = run.x - w * 0.3;
    var shake = 0;
    if (run.shake > 0) shake = Math.sin(t * 40) * 4 * Math.min(1, run.shake * 3);
    ctx.setTransform(1, 0, 0, 1, 0, 0);
    ctx.clearRect(0, 0, w, h);
    ctx.save();
    ctx.translate(0, shake);
    paintSky(ctx, w, h, run.level.mood, t);
    paintBuildings(ctx, w, h, cam, run.level.mood);
    paintWindows(ctx, w, h, cam, run);
    paintStreet(ctx, w, h, cam);
    var mast = paintScooter(ctx, w, h, run, riderId, t);
    paintPole(ctx, h, run, cam, mast);
    ctx.restore();
  }

  function paintSky(ctx, w, h, mood, t) {
    var sky = ctx.createLinearGradient(0, 0, 0, h);
    if (mood === "nacht") {
      sky.addColorStop(0, "#121826");
      sky.addColorStop(1, "#243044");
    } else if (mood === "regen") {
      sky.addColorStop(0, "#6d7d8a");
      sky.addColorStop(1, "#c5cdd4");
    } else {
      sky.addColorStop(0, "#8ecae6");
      sky.addColorStop(1, "#f6e7c1");
    }
    ctx.fillStyle = sky;
    ctx.fillRect(0, 0, w, h);
    if (mood === "nacht") {
      ctx.fillStyle = "#f4f1ea";
      for (var i = 0; i < 18; i++) {
        ctx.globalAlpha = 0.4 + hash(i + 3) * 0.6;
        ctx.fillRect(hash(i) * w, hash(i + 9) * h * 0.4, 2, 2);
      }
      ctx.globalAlpha = 1;
    }
    if (mood === "regen") {
      ctx.strokeStyle = "rgba(244,241,234,0.45)";
      ctx.lineWidth = 1;
      for (var r = 0; r < 28; r++) {
        var rx = (hash(r) * w + t * 180) % (w + 40) - 20;
        var ry = (hash(r + 2) * h + t * 320) % h;
        ctx.beginPath();
        ctx.moveTo(rx, ry);
        ctx.lineTo(rx - 8, ry + 16);
        ctx.stroke();
      }
    }
  }

  function paintBuildings(ctx, w, h, cam, mood) {
    var ground = h * 0.78;
    var start = Math.floor(cam / 150) - 1;
    var end = start + Math.ceil(w / 150) + 3;
    for (var i = start; i <= end; i++) {
      var bh = h * (0.28 + hash(i + 4) * 0.28);
      var bx = i * 150 - cam;
      var hue = mood === "nacht" ? "#2a3344" : (hash(i) > 0.5 ? "#d9785a" : "#e6d3b3");
      ctx.fillStyle = hue;
      ctx.fillRect(bx, ground - bh, 142, bh);
      ctx.strokeStyle = "#1a1714";
      ctx.lineWidth = 2;
      ctx.strokeRect(bx + 1, ground - bh, 140, bh);
      if (mood === "nacht") {
        ctx.fillStyle = "rgba(246,213,107,0.35)";
        ctx.fillRect(bx + 18, ground - bh + 24, 16, 22);
        ctx.fillRect(bx + 70, ground - bh + 48, 16, 22);
      }
    }
  }

  function paintWindows(ctx, w, h, cam, run) {
    for (var i = 0; i < run.windows.length; i++) {
      var win = run.windows[i];
      var sx = win.x - cam;
      if (sx < -40 || sx > w + 40) continue;
      var sy = laneY(h, win.lane);
      ctx.fillStyle = "#f7fbff";
      ctx.strokeStyle = "#1a1714";
      ctx.lineWidth = 3;
      roundRect(ctx, sx - 18, sy - 22, 36, 44, 3);
      ctx.fill();
      ctx.stroke();
      var dirt = win.dirt / win.maxDirt;
      if (dirt > 0.02) {
        ctx.fillStyle = "rgba(90,70,40," + (0.2 + dirt * 0.55) + ")";
        ctx.fillRect(sx - 14, sy - 18, 28, 36);
        ctx.fillStyle = "rgba(60,45,25,0.7)";
        for (var d = 0; d < 4; d++) {
          if (hash(win.x + d) > dirt) continue;
          ctx.beginPath();
          ctx.arc(sx - 8 + (d % 2) * 12, sy - 8 + Math.floor(d / 2) * 14, 2, 0, Math.PI * 2);
          ctx.fill();
        }
      }
      if (win.sparkle > 0) {
        ctx.globalAlpha = Math.min(1, win.sparkle * 2);
        ctx.strokeStyle = "#f4f1ea";
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.moveTo(sx + 16, sy - 16);
        ctx.lineTo(sx + 24, sy - 24);
        ctx.moveTo(sx + 16, sy - 24);
        ctx.lineTo(sx + 24, sy - 16);
        ctx.stroke();
        ctx.globalAlpha = 1;
      }
    }
  }

  function paintStreet(ctx, w, h, cam) {
    var ground = h * 0.78;
    ctx.fillStyle = "#3e4650";
    ctx.fillRect(0, ground, w, h - ground);
    ctx.strokeStyle = "#d7f25a";
    ctx.lineWidth = 3;
    ctx.setLineDash([18, 16]);
    ctx.beginPath();
    ctx.moveTo(0, ground + 18);
    ctx.lineTo(w, ground + 18);
    ctx.stroke();
    ctx.setLineDash([]);
    ctx.fillStyle = "#1a1714";
    var curb = -((cam * 0.2) % 40);
    for (var x = curb; x < w; x += 40) {
      ctx.fillRect(x, ground - 4, 22, 4);
    }
  }

  function paintScooter(ctx, w, h, run, riderId, t) {
    var ground = h * 0.78;
    var sx = w * 0.28;
    var scale = Math.max(1.4, Math.min(2.4, h / 280));
    var fallen = run.status === "fallen" ? Math.min(0.85, run.fallenT * 1.6) : 0;
    ctx.save();
    ctx.translate(sx, ground);
    ctx.rotate(fallen);
    ctx.scale(scale, scale);
    ctx.fillStyle = "#1a1714";
    ctx.beginPath();
    ctx.arc(-28, -10, 10, 0, Math.PI * 2);
    ctx.arc(26, -10, 10, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = "#f4f1ea";
    ctx.beginPath();
    ctx.arc(-28, -10, 4, 0, Math.PI * 2);
    ctx.arc(26, -10, 4, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = "#e23d2b";
    roundRect(ctx, -34, -28, 62, 16, 6);
    ctx.fill();
    ctx.strokeStyle = "#1a1714";
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.moveTo(16, -28);
    ctx.lineTo(30, -48);
    ctx.stroke();
    ctx.fillStyle = "#13464c";
    roundRect(ctx, -8, -36, 22, 10, 3);
    ctx.fill();
    M.drawRider(ctx, riderId, -2, -34, t);
    ctx.restore();
    return { x: sx + 18 * scale, y: ground - 52 * scale };
  }

  function paintPole(ctx, h, run, cam, mast) {
    var tipX = mast.x + 90 + run.pole.reach * 36;
    var tipY = laneY(h, run.lane);
    if (run.aim) {
      tipX = run.aim.x - cam;
      tipY = laneY(h, run.aim.lane);
    }
    var midX = mast.x + (tipX - mast.x) * 0.46;
    var midY = mast.y + (tipY - mast.y) * 0.46;
    ctx.strokeStyle = "#d7f25a";
    ctx.lineWidth = 6;
    ctx.lineCap = "round";
    ctx.beginPath();
    ctx.moveTo(mast.x, mast.y);
    ctx.lineTo(midX, midY);
    ctx.stroke();
    ctx.strokeStyle = "#1f6f78";
    ctx.lineWidth = 4;
    ctx.beginPath();
    ctx.moveTo(midX - 6, midY);
    ctx.lineTo(tipX, tipY);
    ctx.stroke();
    ctx.fillStyle = "#f4f1ea";
    ctx.fillRect(tipX - 10, tipY - 6, 20, 12);
    ctx.strokeStyle = "#1a1714";
    ctx.lineWidth = 2;
    ctx.strokeRect(tipX - 10, tipY - 6, 20, 12);
    if (run.washing) {
      ctx.fillStyle = "#d7f25a";
      for (var i = 0; i < 4; i++) {
        ctx.beginPath();
        ctx.arc(tipX + 12 + i * 7, tipY + ((run.time * 40 + i * 9) % 18) - 8, 3, 0, Math.PI * 2);
        ctx.fill();
      }
    }
  }

  function roundRect(ctx, x, y, w, h, r) {
    ctx.beginPath();
    ctx.moveTo(x + r, y);
    ctx.arcTo(x + w, y, x + w, y + h, r);
    ctx.arcTo(x + w, y + h, x, y + h, r);
    ctx.arcTo(x, y + h, x, y, r);
    ctx.arcTo(x, y, x + w, y, r);
    ctx.closePath();
    ctx.fill();
  }

  root.Malefiets.createRun = createRun;
  root.Malefiets.updateRun = updateRun;
  root.Malefiets.maxStrikes = maxStrikes;
  root.Malefiets.render = render;
  root.Malefiets.laneName = function (lane) {
    return lane === 2 ? "hoog" : lane === 1 ? "midden" : "laag";
  };
  root.Malefiets.nextWindow = function (run) {
    var best = null;
    for (var i = 0; i < run.windows.length; i++) {
      var win = run.windows[i];
      if (win.resolved || win.dirt <= 0 || win.x < run.x) continue;
      if (!best || win.x < best.x) best = win;
    }
    return best;
  };
})(typeof globalThis !== "undefined" ? globalThis : this);
