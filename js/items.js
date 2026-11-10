(function (root) {
  var POLES = [
    { id: "wasstok", name: "Wasstok", cost: 0, reach: 1, speed: 1, width: 1, turbo: 0, grace: 0, preview: 0, blurb: "De stok waarmee Joris de stoep op gaat." },
    { id: "lange-leiding", name: "Lange leiding", cost: 45, reach: 1.6, speed: 1, width: 1, turbo: 0, grace: 0, preview: 0, blurb: "Schuift verder uit, nog voor de ruit voorbij is." },
    { id: "snelle-zeem", name: "Snelle zeem", cost: 80, reach: 1.05, speed: 1.7, width: 1, turbo: 0, grace: 0, preview: 0, blurb: "Minder reikwijdte, meer gewrijf per seconde." },
    { id: "brede-kop", name: "Brede kop", cost: 120, reach: 1.1, speed: 1.05, width: 2.2, turbo: 0, grace: 0, preview: 0, blurb: "Pakt een buurraam mee als het vlakbij hangt." },
    { id: "turbostok", name: "Turbostok", cost: 170, reach: 1.15, speed: 1.15, width: 1, turbo: 1, grace: 0, preview: 0, blurb: "Een korte stoot extra schrobben, daarna even uitpuffen." },
    { id: "verre-kijker", name: "Verre kijker", cost: 240, reach: 2, speed: 1.05, width: 1, turbo: 0, grace: 0, preview: 1, blurb: "Ziet de volgende ruit eerder en reikt ver." },
    { id: "dubbele-zeem", name: "Dubbele zeem", cost: 320, reach: 1.25, speed: 1.85, width: 1.55, turbo: 0, grace: 0, preview: 0, blurb: "Twee lappen, een beetje breed, flink snel." },
    { id: "opas-stok", name: "Opa's stok", cost: 430, reach: 1.7, speed: 1.65, width: 1.45, turbo: 0, grace: 0, preview: 0, blurb: "De gebalanceerde stok voor een lange rit." },
    { id: "pilaster", name: "Pilasterpaal", cost: 560, reach: 2.45, speed: 1.2, width: 1.1, turbo: 0, grace: 0, preview: 1, blurb: "Bijna een lantaarnpaal. De wijk wordt kleiner." },
    { id: "nachtlamp", name: "Nachtlamp", cost: 700, reach: 1.4, speed: 1.4, width: 1.1, turbo: 0, grace: 0, preview: 2, blurb: "In het donker zie je de hoogte van de volgende ruit." },
    { id: "mammoetstam", name: "Mammoetstam", cost: 880, reach: 1.35, speed: 0.9, width: 2.8, turbo: 0, grace: 1, preview: 0, blurb: "Log en breed. De eerste misser telt niet." },
    { id: "kruimelkwast", name: "Kruimelkwast", cost: 1100, reach: 1.15, speed: 2.5, width: 0.85, turbo: 0, grace: 0, preview: 0, blurb: "Klein, zenuwachtig en erg snel." },
    { id: "scootlan", name: "Scootlans", cost: 1450, reach: 2.1, speed: 2, width: 1.7, turbo: 1, grace: 0, preview: 1, blurb: "De lange rit. Reikwijdte, tempo en een turbostoot." }
  ];

  function pole(id) {
    for (var i = 0; i < POLES.length; i++) {
      if (POLES[i].id === id) return POLES[i];
    }
    return POLES[0];
  }

  root.Malefiets = root.Malefiets || {};
  root.Malefiets.POLES = POLES;
  root.Malefiets.pole = pole;
})(typeof globalThis !== "undefined" ? globalThis : this);
