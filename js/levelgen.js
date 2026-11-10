(function (root) {
  var NAMES = [
    "Scootstraat",
    "Zeepkade",
    "Beslagen Singel",
    "Krulhaarhof",
    "Pilasterplein",
    "Neussteeg",
    "Vuurtorenbuurt",
    "Mammoetlaan",
    "Koeksteeg",
    "Opa's Laan",
    "Ruitenrij",
    "Waslijn",
    "Telescooplaan",
    "Bromkade",
    "Schuimhof"
  ];

  function mulberry32(seed) {
    var a = seed >>> 0;
    return function () {
      a |= 0;
      a = (a + 0x6d2b79f5) | 0;
      var t = Math.imul(a ^ (a >>> 15), 1 | a);
      t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
      return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
    };
  }

  function makeLevel(index) {
    var n = Math.max(0, index | 0);
    var rng = mulberry32((n + 1) * 10007);
    var count = Math.min(42, 6 + Math.floor(n * 1.15));
    var windows = [];
    var x = 180;
    var dirt = +(Math.min(1.85, 0.85 + n * 0.045)).toFixed(2);
    var id = 0;
    for (var i = 0; i < count; i++) {
      var gap = Math.max(168, 300 - n * 4 + rng() * 90);
      x += gap;
      var lane = Math.floor(rng() * 3);
      windows.push({ id: id++, x: Math.round(x), lane: lane, maxDirt: dirt });
      if (n > 1 && rng() < 0.16 + Math.min(0.14, n * 0.006)) {
        x += 78;
        var lane2 = (lane + 1 + Math.floor(rng() * 2)) % 3;
        windows.push({ id: id++, x: Math.round(x), lane: lane2, maxDirt: dirt });
      }
    }
    var bumps = [];
    if (n > 0) {
      var bumpCount = Math.min(7, 1 + Math.floor(n / 3));
      var span = Math.max(200, x - 800);
      for (var b = 0; b < bumpCount; b++) {
        bumps.push({
          x: Math.round(500 + rng() * span),
          windowMs: Math.max(480, 1000 - n * 22)
        });
      }
      bumps.sort(function (p, q) { return p.x - q.x; });
    }
    var moods = ["dag", "dag", "regen", "nacht"];
    return {
      index: n,
      name: n < NAMES.length ? NAMES[n] : "Wijk " + (n + 1),
      speed: 70 + n * 5,
      windows: windows,
      bumps: bumps,
      length: x + 380,
      mood: moods[n % moods.length]
    };
  }

  root.Malefiets = root.Malefiets || {};
  root.Malefiets.makeLevel = makeLevel;
  root.Malefiets.mulberry32 = mulberry32;
})(typeof globalThis !== "undefined" ? globalThis : this);
