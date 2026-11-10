(function (root) {
  var KEY = "malefiets.v1";

  function blank() {
    return {
      version: 1,
      soap: 0,
      rider: "joris",
      owned: ["wasstok"],
      equipped: "wasstok",
      cleared: -1,
      name: "Joris",
      mute: false,
      scores: [],
      seals: { ode: false, scoot: false, neus: false },
      stats: { windows: 0, falls: 0, runs: 0, clears: 0 }
    };
  }

  function memoryStore() {
    var value = null;
    return {
      getItem: function () { return value; },
      setItem: function (_key, next) { value = String(next); }
    };
  }

  var memory = memoryStore();

  function store() {
    try {
      if (typeof localStorage !== "undefined" && localStorage) {
        var probe = KEY + ".probe";
        localStorage.setItem(probe, "1");
        localStorage.removeItem(probe);
        return localStorage;
      }
    } catch (err) {
      return memory;
    }
    return memory;
  }

  function load() {
    var base = blank();
    try {
      var raw = store().getItem(KEY);
      if (!raw) return base;
      var data = JSON.parse(raw);
      if (!data || data.version !== 1) return base;
      base.soap = clampNum(data.soap);
      base.rider = typeof data.rider === "string" ? data.rider : base.rider;
      base.owned = Array.isArray(data.owned) && data.owned.length ? data.owned.slice() : base.owned;
      base.equipped = typeof data.equipped === "string" ? data.equipped : base.equipped;
      base.cleared = clampNum(data.cleared);
      if (base.cleared < -1) base.cleared = -1;
      base.name = cleanName(data.name);
      base.mute = !!data.mute;
      base.scores = Array.isArray(data.scores) ? data.scores.slice(0, 20) : [];
      base.seals = Object.assign(base.seals, data.seals || {});
      base.stats = Object.assign(base.stats, data.stats || {});
      if (base.owned.indexOf("wasstok") === -1) base.owned.unshift("wasstok");
      if (base.owned.indexOf(base.equipped) === -1) base.equipped = base.owned[0];
      return base;
    } catch (err) {
      return blank();
    }
  }

  function save(state) {
    store().setItem(KEY, JSON.stringify(state));
    return state;
  }

  function clampNum(value) {
    var n = Number(value);
    if (!isFinite(n)) return 0;
    return Math.round(n);
  }

  function cleanName(value) {
    var name = String(value || "").replace(/\s+/g, " ").trim().slice(0, 18);
    return name || "Joris";
  }

  function update(fn) {
    var state = load();
    fn(state);
    return save(state);
  }

  root.Malefiets = root.Malefiets || {};
  root.Malefiets.STORAGE_KEY = KEY;
  root.Malefiets.loadState = load;
  root.Malefiets.saveState = save;
  root.Malefiets.updateState = update;
  root.Malefiets.cleanName = cleanName;
})(typeof globalThis !== "undefined" ? globalThis : this);
