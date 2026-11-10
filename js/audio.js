(function (root) {
  var ctx = null;
  var master = null;
  var muted = false;
  var engine = null;

  function ensure() {
    var AC = root.AudioContext || root.webkitAudioContext;
    if (!AC) return null;
    if (!ctx) {
      try {
        ctx = new AC();
      } catch (err) {
        return null;
      }
    }
    if (ctx.state === "suspended") ctx.resume();
    if (!master) {
      master = ctx.createGain();
      master.gain.value = 0.2;
      master.connect(ctx.destination);
    }
    return ctx;
  }

  function setMuted(next) {
    muted = !!next;
    if (master && ctx) master.gain.setTargetAtTime(muted ? 0 : 0.2, ctx.currentTime, 0.02);
  }

  function tone(freq, dur, type, gain) {
    if (muted) return;
    var audio = ensure();
    if (!audio) return;
    var osc = audio.createOscillator();
    var amp = audio.createGain();
    osc.type = type || "square";
    osc.frequency.value = freq;
    amp.gain.setValueAtTime(gain || 0.08, audio.currentTime);
    amp.gain.exponentialRampToValueAtTime(0.001, audio.currentTime + dur);
    osc.connect(amp);
    amp.connect(master);
    osc.start();
    osc.stop(audio.currentTime + dur);
  }

  function noise(dur, gain) {
    if (muted) return;
    var audio = ensure();
    if (!audio) return;
    var length = Math.floor(audio.sampleRate * dur);
    var buffer = audio.createBuffer(1, length, audio.sampleRate);
    var data = buffer.getChannelData(0);
    for (var i = 0; i < length; i++) data[i] = (Math.random() * 2 - 1) * (1 - i / length);
    var src = audio.createBufferSource();
    var amp = audio.createGain();
    var filter = audio.createBiquadFilter();
    filter.type = "bandpass";
    filter.frequency.value = 900;
    src.buffer = buffer;
    amp.gain.value = gain || 0.12;
    src.connect(filter);
    filter.connect(amp);
    amp.connect(master);
    src.start();
  }

  function scrub() { noise(0.06, 0.08); }
  function clean() { tone(660, 0.08, "triangle", 0.06); tone(880, 0.12, "triangle", 0.05); }
  function miss() { tone(180, 0.18, "sawtooth", 0.06); }
  function fall() { tone(240, 0.12, "square", 0.07); tone(120, 0.28, "sawtooth", 0.07); }
  function bump() { tone(520, 0.09, "square", 0.06); }
  function coin() { tone(520, 0.06, "square", 0.05); tone(780, 0.1, "square", 0.05); }
  function clearFanfare() {
    tone(523, 0.1, "triangle", 0.06);
    setTimeout(function () { tone(659, 0.1, "triangle", 0.06); }, 90);
    setTimeout(function () { tone(784, 0.18, "triangle", 0.06); }, 180);
  }

  function engineStart() {
    var audio = ensure();
    if (!audio || engine) return;
    var osc = audio.createOscillator();
    var amp = audio.createGain();
    osc.type = "triangle";
    osc.frequency.value = 72;
    amp.gain.value = muted ? 0 : 0.03;
    osc.connect(amp);
    amp.connect(master);
    osc.start();
    engine = { osc: osc, amp: amp };
  }

  function engineStop() {
    if (!engine) return;
    try { engine.osc.stop(); } catch (err) { /* already stopped */ }
    engine = null;
  }

  function engineGain() {
    if (engine && ctx) engine.amp.gain.setTargetAtTime(muted ? 0 : 0.03, ctx.currentTime, 0.05);
  }

  root.Malefiets = root.Malefiets || {};
  root.Malefiets.audio = {
    ensure: ensure,
    setMuted: setMuted,
    scrub: scrub,
    clean: clean,
    miss: miss,
    fall: fall,
    bump: bump,
    coin: coin,
    clearFanfare: clearFanfare,
    engineStart: engineStart,
    engineStop: engineStop,
    engineGain: engineGain
  };
})(typeof globalThis !== "undefined" ? globalThis : this);
