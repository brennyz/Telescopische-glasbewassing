(function (root) {
  var M = root.Malefiets;
  var audio = M.audio;
  var reducedMotion = false;
  var run = null;
  var raf = 0;
  var last = 0;
  var playing = false;
  var banked = 0;
  var seenCleaned = 0;
  var seenStrikes = 0;
  var bumpSeen = false;
  var scrubAt = 0;
  var clearTimer = 0;
  var recorded = false;
  var keys = "";
  var noseTaps = 0;
  var purse = 0;
  var chromeLabel = "Joris · Wasstok";
  var input = { washing: false, hold: false, turbo: false, laneSet: null };

  function $(id) { return document.getElementById(id); }

  function state() { return M.loadState(); }

  function say(text) {
    $("live").textContent = text;
  }

  function show(name) {
    var screens = document.querySelectorAll(".screen");
    for (var i = 0; i < screens.length; i++) {
      screens[i].hidden = screens[i].id !== "screen-" + name;
    }
    document.body.dataset.mode = name;
    var heading = document.querySelector("#screen-" + name + " h1, #screen-" + name + " h2");
    if (heading) heading.focus();
    if (name !== "play") stopLoop();
    if (name === "start") paintStart();
    if (name === "cast") paintCast();
    if (name === "shop") paintShop();
    if (name === "levels") paintLevels();
    if (name === "scores") paintScores();
    if (name === "ode") setupOde();
    paintChrome();
  }

  function paintChrome() {
    var data = state();
    purse = data.soap;
    var rider = M.rider(data.rider);
    var pole = M.pole(data.equipped);
    chromeLabel = rider.name + " · " + pole.name;
    $("soapline").textContent = purse + " zeep · " + chromeLabel;
    $("mute").textContent = data.mute ? "Geluid uit" : "Geluid aan";
    $("mute").setAttribute("aria-pressed", data.mute ? "true" : "false");
    audio.setMuted(data.mute);
    audio.engineGain();
  }

  function paintStart() {
    var data = state();
    var next = M.makeLevel(data.cleared + 1);
    $("start-status").textContent = "Volgende wijk: " + next.name + ". Schoon gewassen: " + data.stats.windows + " ruiten.";
  }

  function paintCast() {
    var data = state();
    var list = $("cast-list");
    list.replaceChildren();
    M.RIDERS.forEach(function (rider) {
      var card = document.createElement("article");
      card.className = "card" + (data.rider === rider.id ? " is-on" : "");
      var canvas = document.createElement("canvas");
      canvas.width = 180;
      canvas.height = 120;
      canvas.className = "portrait";
      var title = document.createElement("h2");
      title.textContent = rider.name;
      var copy = document.createElement("p");
      copy.textContent = rider.line;
      var button = document.createElement("button");
      button.type = "button";
      button.textContent = data.rider === rider.id ? "Zit er al" : "Laat rijden";
      button.addEventListener("click", function () {
        M.updateState(function (s) { s.rider = rider.id; });
        say(rider.name + " neemt plaats.");
        paintCast();
        paintChrome();
      });
      if (rider.id === "joris") {
        canvas.addEventListener("click", function () {
          noseTaps += 1;
          if (noseTaps === 5) {
            var gained = false;
            M.updateState(function (s) {
              if (!s.seals.neus) {
                s.seals.neus = true;
                s.soap += 15;
                gained = true;
              }
            });
            if (gained) {
              audio.coin();
              say("De neus geeft 15 zeep.");
              paintChrome();
            }
          }
        });
      }
      card.append(canvas, title, copy, button);
      list.appendChild(card);
      drawPortrait(canvas, rider.id);
    });
  }

  function drawPortrait(canvas, id) {
    var ctx = canvas.getContext("2d");
    ctx.fillStyle = "#f3ead7";
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    ctx.fillStyle = "#3e4650";
    ctx.fillRect(0, 96, canvas.width, 24);
    M.drawRider(ctx, id, 90, 96, 0);
  }

  function paintShop() {
    var data = state();
    var list = $("shop-list");
    list.replaceChildren();
    M.POLES.forEach(function (pole) {
      var owned = data.owned.indexOf(pole.id) !== -1;
      var on = data.equipped === pole.id;
      var card = document.createElement("article");
      card.className = "card" + (on ? " is-on" : "");
      var title = document.createElement("h2");
      title.textContent = pole.name;
      var copy = document.createElement("p");
      copy.textContent = pole.blurb;
      var meta = document.createElement("p");
      meta.className = "meta";
      meta.textContent = "Reik " + pole.reach + " · tempo " + pole.speed + " · breedte " + pole.width + (pole.turbo ? " · turbo" : "") + (pole.grace ? " · een vangnet" : "");
      var button = document.createElement("button");
      button.type = "button";
      if (on) {
        button.textContent = "In de scootmobiel";
        button.disabled = true;
      } else if (owned) {
        button.textContent = "Pak deze stok";
        button.addEventListener("click", function () {
          M.updateState(function (s) { s.equipped = pole.id; });
          audio.coin();
          paintShop();
          paintChrome();
        });
      } else if (data.soap < pole.cost) {
        button.textContent = pole.cost + " zeep";
        button.disabled = true;
      } else {
        button.textContent = "Koop voor " + pole.cost;
        button.addEventListener("click", function () {
          M.updateState(function (s) {
            if (s.soap >= pole.cost && s.owned.indexOf(pole.id) === -1) {
              s.soap -= pole.cost;
              s.owned.push(pole.id);
              s.equipped = pole.id;
            }
          });
          audio.coin();
          say(pole.name + " ligt in de scootmobiel.");
          paintShop();
          paintChrome();
        });
      }
      card.append(title, copy, meta, button);
      list.appendChild(card);
    });
  }

  function paintLevels() {
    var data = state();
    var list = $("level-list");
    list.replaceChildren();
    var shown = Math.max(8, data.cleared + 4);
    for (var i = 0; i < shown; i++) {
      var level = M.makeLevel(i);
      var open = i <= data.cleared + 1;
      var button = document.createElement("button");
      button.type = "button";
      button.className = "level";
      button.disabled = !open;
      button.textContent = open ? (i + 1) + ". " + level.name : "Dicht";
      if (open) {
        (function (index) {
          button.addEventListener("click", function () { startRun(index); });
        })(i);
      }
      list.appendChild(button);
    }
  }

  function paintScores() {
    var data = state();
    $("score-name-board").value = data.name;
    var list = $("score-list");
    list.replaceChildren();
    if (!data.scores.length) {
      var empty = document.createElement("li");
      empty.textContent = "Nog geen rit op dit apparaat.";
      list.appendChild(empty);
      return;
    }
    data.scores.forEach(function (row) {
      var li = document.createElement("li");
      var rider = M.rider(row.rider);
      li.textContent = row.name + " · " + row.score + " · " + row.levelName + " · " + rider.name;
      list.appendChild(li);
    });
  }

  function setupOde() {
    var canvas = $("fog");
    var box = $("ode-sheet");
    var rect = box.getBoundingClientRect();
    var dpr = Math.min(2, root.devicePixelRatio || 1);
    canvas.width = Math.max(280, Math.floor(rect.width * dpr));
    canvas.height = Math.max(220, Math.floor(rect.height * dpr));
    canvas.style.width = rect.width + "px";
    canvas.style.height = rect.height + "px";
    var ctx = canvas.getContext("2d");
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    ctx.fillStyle = "rgba(198, 214, 220, 0.92)";
    ctx.fillRect(0, 0, rect.width, rect.height);
    var cleared = false;
    function wipe(event) {
      var bounds = canvas.getBoundingClientRect();
      var x = event.clientX - bounds.left;
      var y = event.clientY - bounds.top;
      ctx.globalCompositeOperation = "destination-out";
      ctx.beginPath();
      ctx.arc(x, y, 28, 0, Math.PI * 2);
      ctx.fill();
      ctx.globalCompositeOperation = "source-over";
      if (!cleared && sampleClear(ctx, canvas, dpr) > 0.42) {
        cleared = true;
        revealOde();
      }
    }
    canvas.onpointerdown = function (event) {
      canvas.setPointerCapture(event.pointerId);
      wipe(event);
    };
    canvas.onpointermove = function (event) {
      if (event.buttons) wipe(event);
    };
    if (state().seals.ode) {
      ctx.clearRect(0, 0, rect.width, rect.height);
      canvas.style.pointerEvents = "none";
      $("ode-note").hidden = false;
    } else {
      canvas.style.pointerEvents = "auto";
      $("ode-note").hidden = true;
    }
  }

  function sampleClear(ctx, canvas, dpr) {
    var pixels = ctx.getImageData(0, 0, canvas.width, canvas.height).data;
    var clear = 0;
    var step = 16 * 4;
    var seen = 0;
    for (var i = 3; i < pixels.length; i += step) {
      seen++;
      if (pixels[i] < 40) clear++;
    }
    return seen ? clear / seen : 0;
  }

  function revealOde() {
    $("ode-note").hidden = false;
    $("fog").style.pointerEvents = "none";
    M.updateState(function (s) { s.seals.ode = true; });
    audio.clean();
    say("De ruit is open. De ode is te lezen.");
  }

  function startRun(index) {
    var data = state();
    var level = M.makeLevel(index);
    var pole = M.pole(data.equipped);
    run = M.createRun(level, pole);
    banked = 0;
    seenCleaned = 0;
    seenStrikes = 0;
    bumpSeen = false;
    recorded = false;
    input.washing = false;
    input.hold = false;
    input.turbo = false;
    input.laneSet = null;
    M.updateState(function (s) { s.stats.runs += 1; });
    $("pause-card").hidden = true;
    $("clear-card").hidden = true;
    $("btn-turbo").hidden = !pole.turbo;
    $("play-hint").textContent = index === 0 ? "Houd Schrobben vast zodra een ruit bij de stok komt. Hoog, midden en laag sturen de zeem." : "";
    show("play");
    resizeStreet();
    audio.ensure();
    audio.engineStart();
    say(level.name + ". De rit is begonnen.");
    playing = true;
    last = 0;
    raf = root.requestAnimationFrame(loop);
  }

  function stopLoop() {
    playing = false;
    if (raf) root.cancelAnimationFrame(raf);
    raf = 0;
    audio.engineStop();
    if (clearTimer) {
      clearTimeout(clearTimer);
      clearTimer = 0;
    }
  }

  function loop(now) {
    if (!playing || !run) return;
    if (!last) last = now;
    var dt = Math.min(0.05, (now - last) / 1000);
    last = now;
    var snapshot = {
      washing: input.washing,
      hold: input.hold,
      turbo: input.turbo,
      laneSet: input.laneSet
    };
    input.turbo = false;
    input.laneSet = null;
    M.updateRun(run, dt, snapshot);
    if (run.soap > banked) {
      var gain = run.soap - banked;
      banked = run.soap;
      purse += gain;
      M.updateState(function (s) {
        s.soap += gain;
        s.stats.windows += Math.max(0, run.cleaned - seenCleaned);
      });
    } else if (run.cleaned > seenCleaned) {
      M.updateState(function (s) {
        s.stats.windows += run.cleaned - seenCleaned;
      });
    }
    if (run.cleaned > seenCleaned) {
      audio.clean();
      seenCleaned = run.cleaned;
    }
    if (run.strikes > seenStrikes) {
      audio.miss();
      seenStrikes = run.strikes;
      say("Misser " + run.strikes + ".");
    }
    var bumping = !!run.bump;
    if (bumping && !bumpSeen) {
      audio.bump();
      say("Hobbel. Houd vast.");
    }
    bumpSeen = bumping;
    if (input.washing && now - scrubAt > 90) {
      audio.scrub();
      scrubAt = now;
    }
    drawStreet();
    paintHud();
    if (run.status === "fallen" && run.fallenT > 0.85) {
      playing = false;
      audio.fall();
      audio.engineStop();
      M.updateState(function (s) { s.stats.falls += 1; });
      finish("fall");
      return;
    }
    if (run.status === "clear") {
      playing = false;
      audio.engineStop();
      onClear();
      return;
    }
    raf = root.requestAnimationFrame(loop);
  }

  function paintHud() {
    if (!run) return;
    var cap = M.maxStrikes(run) + 1;
    $("hud-wijk").textContent = run.level.name;
    $("hud-zeep").textContent = run.soap + " zeep deze rit";
    $("hud-miss").textContent = "Missers " + run.strikes + "/" + cap;
    $("hud-combo").textContent = run.combo > 1 ? "Reeks " + run.combo : "";
    var next = M.nextWindow(run);
    var showNext = run.pole.preview && next && (run.pole.preview > 1 || next.x - run.x < 520);
    $("hud-next").textContent = showNext ? "Volgende ruit: " + M.laneName(next.lane) : "";
    $("soapline").textContent = purse + " zeep · " + chromeLabel;
    var lanes = document.querySelectorAll("[data-lane]");
    for (var i = 0; i < lanes.length; i++) {
      lanes[i].classList.toggle("is-on", Number(lanes[i].dataset.lane) === run.lane);
    }
    $("bump-banner").hidden = !run.bump;
    if (run.bump) {
      var ratio = Math.max(0, run.bump.left / (run.bump.windowMs / 1000));
      $("bump-bar").style.transform = "scaleX(" + ratio + ")";
      $("btn-wash").textContent = "Houd vast";
    } else {
      $("btn-wash").textContent = "Schrobben";
    }
  }

  function drawStreet() {
    var canvas = $("street");
    var ctx = canvas.getContext("2d");
    var dpr = canvas.width / Math.max(1, canvas.clientWidth);
    M.render(ctx, canvas.width, canvas.height, run, state().rider);
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
  }

  function resizeStreet() {
    var canvas = $("street");
    var rect = canvas.getBoundingClientRect();
    var dpr = Math.min(2, root.devicePixelRatio || 1);
    var width = Math.max(280, rect.width);
    var height = Math.max(220, rect.height);
    canvas.width = Math.floor(width * dpr);
    canvas.height = Math.floor(height * dpr);
    if (run) drawStreet();
  }

  function onClear() {
    var bonus = 15 + run.level.index * 4;
    run.soap += bonus;
    if (run.soap > banked) {
      var gain = run.soap - banked;
      banked = run.soap;
      purse += gain;
      M.updateState(function (s) { s.soap += gain; });
    }
    M.updateState(function (s) {
      s.stats.clears += 1;
      if (run.level.index > s.cleared) s.cleared = run.level.index;
    });
    audio.clearFanfare();
    record(true);
    $("clear-title").textContent = run.level.name + " is schoon";
    $("clear-copy").textContent = "Bonus " + bonus + " zeep. Scoot scoot opa. Doorrijden gaat vanzelf.";
    $("clear-card").hidden = false;
    say(run.level.name + " is schoon.");
    paintChrome();
    clearTimer = root.setTimeout(function () {
      clearTimer = 0;
      if (!$("clear-card").hidden) startRun(run.level.index + 1);
    }, reducedMotion ? 1600 : 2800);
  }

  function finish(kind) {
    record(kind === "clear");
    stopLoop();
    var data = state();
    if (kind === "fall") {
      $("over-title").textContent = "Je viel van de bromscootmobiel";
      $("over-copy").textContent = "De stok klapte in, de stoep kwam omhoog. De zeep van deze rit blijft van jou.";
    } else if (kind === "clear") {
      $("over-title").textContent = "De rit is gezet";
      $("over-copy").textContent = "De zeep staat op dit apparaat. De naam hieronder komt op het lokale bord.";
    } else {
      $("over-title").textContent = "De rit staat stil";
      $("over-copy").textContent = "Scoot scoot opa. De zeep van deze rit blijft op dit apparaat.";
    }
    $("over-stats").textContent = run
      ? run.cleaned + " ruiten · " + run.soap + " zeep · " + (run.level ? run.level.name : "")
      : "";
    $("score-name").value = data.name;
    $("over-next").hidden = kind !== "clear";
    show("over");
  }

  var lastScoreAt = 0;

  function record(cleared) {
    if (recorded || !run) return;
    recorded = true;
    lastScoreAt = Date.now();
    var at = lastScoreAt;
    var score = run.cleaned * 100 + run.soap + run.level.index * 40;
    M.updateState(function (s) {
      s.scores.push({
        name: s.name,
        score: score,
        level: run.level.index,
        levelName: run.level.name,
        rider: s.rider,
        cleared: !!cleared,
        at: at
      });
      s.scores.sort(function (a, b) { return b.score - a.score; });
      s.scores = s.scores.slice(0, 20);
    });
    return score;
  }

  function bindHold(button, set) {
    button.addEventListener("pointerdown", function (event) {
      event.preventDefault();
      try { button.setPointerCapture(event.pointerId); } catch (err) { /* synthetische of al losgelaten pointers */ }
      audio.ensure();
      set(true);
    });
    button.addEventListener("pointerup", function () { set(false); });
    button.addEventListener("pointercancel", function () { set(false); });
    button.addEventListener("lostpointercapture", function () { set(false); });
  }

  function boot() {
    reducedMotion = root.matchMedia && root.matchMedia("(prefers-reduced-motion: reduce)").matches;
    document.querySelectorAll("[data-go]").forEach(function (button) {
      button.addEventListener("click", function () {
        audio.ensure();
        var target = button.getAttribute("data-go");
        if (target === "ride") startRun(state().cleared + 1);
        else show(target);
      });
    });
    $("mute").addEventListener("click", function () {
      audio.ensure();
      M.updateState(function (s) { s.mute = !s.mute; });
      paintChrome();
    });
    $("logo").addEventListener("click", function () {
      document.body.classList.toggle("telescoped");
      if (document.body.dataset.mode !== "play") show("start");
    });
    $("wipe-ode").addEventListener("click", function () {
      var canvas = $("fog");
      var ctx = canvas.getContext("2d");
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      revealOde();
    });
    $("btn-pause").addEventListener("click", function () {
      if (!playing) return;
      playing = false;
      input.washing = false;
      audio.engineStop();
      $("pause-card").hidden = false;
      say("Pauze.");
    });
    $("pause-resume").addEventListener("click", function () {
      $("pause-card").hidden = true;
      audio.engineStart();
      playing = true;
      last = 0;
      raf = root.requestAnimationFrame(loop);
    });
    $("pause-shop").addEventListener("click", function () {
      record(false);
      show("shop");
    });
    $("pause-stop").addEventListener("click", function () {
      finish("stop");
    });
    $("clear-go").addEventListener("click", function () {
      if (clearTimer) clearTimeout(clearTimer);
      clearTimer = 0;
      startRun(run.level.index + 1);
    });
    $("clear-shop").addEventListener("click", function () {
      if (clearTimer) clearTimeout(clearTimer);
      clearTimer = 0;
      show("shop");
    });
    $("clear-stop").addEventListener("click", function () {
      if (clearTimer) clearTimeout(clearTimer);
      clearTimer = 0;
      finish("clear");
    });
    $("over-save").addEventListener("click", function () {
      var name = M.cleanName($("score-name").value);
      M.updateState(function (s) {
        s.name = name;
        for (var i = 0; i < s.scores.length; i++) {
          if (s.scores[i].at === lastScoreAt) s.scores[i].name = name;
        }
      });
      say("Het bord onthoudt " + name + ".");
    });
    $("over-again").addEventListener("click", function () {
      if (run) startRun(run.level.index);
    });
    $("over-next").addEventListener("click", function () {
      if (run) startRun(run.level.index + 1);
    });
    $("over-shop").addEventListener("click", function () { show("shop"); });
    $("over-home").addEventListener("click", function () { show("start"); });
    $("save-board-name").addEventListener("click", function () {
      var name = M.cleanName($("score-name-board").value);
      M.updateState(function (s) { s.name = name; });
      say("Naam bewaard: " + name + ".");
    });
    $("wipe-scores").addEventListener("click", function () {
      var button = $("wipe-scores");
      if (button.dataset.armed !== "1") {
        button.dataset.armed = "1";
        button.textContent = "Ja, wis het bord";
        return;
      }
      M.updateState(function (s) { s.scores = []; });
      button.dataset.armed = "0";
      button.textContent = "Wis het bord";
      paintScores();
    });
    document.querySelectorAll("[data-lane]").forEach(function (button) {
      button.addEventListener("click", function () {
        input.laneSet = Number(button.dataset.lane);
      });
    });
    bindHold($("btn-wash"), function (down) {
      input.washing = down;
      input.hold = down;
    });
    var street = $("street");
    street.addEventListener("pointerdown", function (event) {
      street.setPointerCapture(event.pointerId);
      audio.ensure();
      input.washing = true;
      input.hold = true;
    });
    street.addEventListener("pointerup", function () {
      input.washing = false;
      input.hold = false;
    });
    street.addEventListener("pointercancel", function () {
      input.washing = false;
      input.hold = false;
    });
    $("btn-turbo").addEventListener("click", function () {
      input.turbo = true;
      audio.ensure();
    });
    root.addEventListener("keydown", function (event) {
      if (event.target && (event.target.tagName === "INPUT" || event.target.tagName === "TEXTAREA")) return;
      if (!event.repeat && event.key && event.key.length === 1) {
        keys = (keys + event.key.toLowerCase()).slice(-5);
        if (keys === "scoot") {
          var gained = false;
          M.updateState(function (s) {
            if (!s.seals.scoot) {
              s.seals.scoot = true;
              s.soap += 25;
              gained = true;
            }
          });
          if (gained) {
            audio.coin();
            say("Scoot scoot opa. 25 zeep.");
            paintChrome();
          }
        }
      }
      if (event.code === "Space" || event.code === "KeyK") {
        event.preventDefault();
        input.washing = true;
        input.hold = true;
      } else if (event.code === "ArrowUp") {
        event.preventDefault();
        if (run && !event.repeat) input.laneSet = Math.min(2, run.lane + 1);
      } else if (event.code === "ArrowDown") {
        event.preventDefault();
        if (run && !event.repeat) input.laneSet = Math.max(0, run.lane - 1);
      } else if (event.code === "KeyH") {
        input.hold = true;
      } else if (event.code === "KeyT" && !event.repeat) {
        input.turbo = true;
      } else if (event.code === "KeyM" && !event.repeat) {
        $("mute").click();
      } else if (event.code === "Escape" && playing) {
        $("btn-pause").click();
      } else if (event.code === "Digit1") input.laneSet = 0;
      else if (event.code === "Digit2") input.laneSet = 1;
      else if (event.code === "Digit3") input.laneSet = 2;
    });
    root.addEventListener("keyup", function (event) {
      if (event.code === "Space" || event.code === "KeyK") {
        input.washing = false;
        input.hold = false;
      }
      if (event.code === "KeyH") input.hold = false;
    });
    root.addEventListener("blur", function () {
      input.washing = false;
      input.hold = false;
    });
    document.addEventListener("visibilitychange", function () {
      if (document.hidden && playing) $("btn-pause").click();
    });
    var stage = $("play-stage");
    if (root.ResizeObserver && stage) {
      var lastWidth = 0;
      var observer = new root.ResizeObserver(function (entries) {
        var width = entries[0].contentRect.width;
        var big = lastWidth && Math.abs(width - lastWidth) > 80;
        lastWidth = width;
        resizeStreet();
        if (big && playing) $("btn-pause").click();
      });
      observer.observe(stage);
    } else {
      root.addEventListener("resize", resizeStreet);
    }
    show("start");
  }

  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", boot);
  else boot();
})(typeof globalThis !== "undefined" ? globalThis : this);
