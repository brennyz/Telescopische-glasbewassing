(function (root) {
  var RIDERS = [
    {
      id: "joris",
      name: "Joris",
      line: "1,88 m, klein buikje, grijze krullen, bril, grote neus en een veegje op de wang."
    },
    {
      id: "vuurtoren",
      name: "Vuurtoren",
      line: "Een gestreept mannetje met een lamp als hoofd. Hij past in hetzelfde zitje."
    },
    {
      id: "mammoet",
      name: "Mammoet",
      line: "Slurf, slagtanden en oren die de wind meenemen. De stok doet het werk."
    },
    {
      id: "koekmannetje",
      name: "Koekmannetje",
      line: "Een rond koekje met spikkels en glazuur. Een baksel, geen blauw monster."
    }
  ];

  function rider(id) {
    for (var i = 0; i < RIDERS.length; i++) {
      if (RIDERS[i].id === id) return RIDERS[i];
    }
    return RIDERS[0];
  }

  function draw(ctx, id, x, y, t) {
    ctx.save();
    ctx.translate(x, y);
    if (id === "vuurtoren") drawTower(ctx, t);
    else if (id === "mammoet") drawMammoth(ctx, t);
    else if (id === "koekmannetje") drawCookie(ctx, t);
    else drawJoris(ctx, t);
    ctx.restore();
  }

  function drawJoris(ctx, t) {
    var bob = Math.sin(t * 8) * 1.2;
    ctx.translate(0, bob);
    ctx.fillStyle = "#3d4c6b";
    roundRect(ctx, -16, -8, 32, 16, 6);
    ctx.fill();
    ctx.fillStyle = "#e7b89a";
    ctx.beginPath();
    ctx.ellipse(0, -28, 16, 18, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = "#d9d9d9";
    ctx.beginPath();
    ctx.arc(-8, -40, 6, Math.PI, Math.PI * 2);
    ctx.arc(0, -42, 6, Math.PI, Math.PI * 2);
    ctx.arc(8, -40, 6, Math.PI, Math.PI * 2);
    ctx.fill();
    ctx.strokeStyle = "#243044";
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.arc(-6, -30, 5, 0, Math.PI * 2);
    ctx.arc(6, -30, 5, 0, Math.PI * 2);
    ctx.moveTo(-1, -30);
    ctx.lineTo(1, -30);
    ctx.stroke();
    ctx.fillStyle = "#e7b89a";
    ctx.beginPath();
    ctx.ellipse(13, -27, 7, 5, 0.4, 0, Math.PI * 2);
    ctx.fill();
    ctx.strokeStyle = "#c4526a";
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(-10, -22);
    ctx.lineTo(-5, -20);
    ctx.stroke();
    ctx.strokeStyle = "#6a3b32";
    ctx.beginPath();
    ctx.arc(0, -22, 4, 0.2, Math.PI - 0.2);
    ctx.stroke();
    ctx.fillStyle = "#e7b89a";
    ctx.fillRect(10, -18, 14, 5);
  }

  function drawTower(ctx, t) {
    ctx.fillStyle = "#f4f1ea";
    ctx.fillRect(-12, -46, 24, 40);
    ctx.fillStyle = "#e23d2b";
    ctx.fillRect(-12, -46, 24, 6);
    ctx.fillRect(-12, -32, 24, 6);
    ctx.fillRect(-12, -18, 24, 6);
    ctx.fillStyle = "#f4f1ea";
    ctx.fillRect(-16, -52, 32, 6);
    ctx.fillStyle = "#f6d56b";
    ctx.beginPath();
    ctx.arc(0, -58, 7, 0, Math.PI * 2);
    ctx.fill();
    ctx.globalAlpha = 0.35;
    ctx.beginPath();
    ctx.moveTo(0, -58);
    ctx.lineTo(36, -70 + Math.sin(t * 2) * 8);
    ctx.lineTo(40, -50);
    ctx.fill();
    ctx.globalAlpha = 1;
  }

  function drawMammoth(ctx, t) {
    ctx.fillStyle = "#8d8478";
    ctx.beginPath();
    ctx.ellipse(0, -24, 18, 16, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.beginPath();
    ctx.ellipse(-16, -30, 8, 10, -0.4, 0, Math.PI * 2);
    ctx.ellipse(16, -30, 8, 10, 0.4, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = "#f4f1ea";
    ctx.beginPath();
    ctx.moveTo(-6, -16);
    ctx.quadraticCurveTo(-2, -2 + Math.sin(t * 3) * 2, 4, -8);
    ctx.quadraticCurveTo(2, -14, -2, -16);
    ctx.fill();
    ctx.strokeStyle = "#f4f1ea";
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(-8, -18);
    ctx.quadraticCurveTo(-14, -8, -10, -4);
    ctx.moveTo(6, -18);
    ctx.quadraticCurveTo(12, -8, 9, -4);
    ctx.stroke();
    ctx.fillStyle = "#2b241c";
    ctx.beginPath();
    ctx.arc(-5, -26, 1.6, 0, Math.PI * 2);
    ctx.arc(5, -26, 1.6, 0, Math.PI * 2);
    ctx.fill();
  }

  function drawCookie(ctx, t) {
    ctx.fillStyle = "#c9844a";
    ctx.beginPath();
    ctx.arc(0, -24, 18, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = "#5c3317";
    var chips = [[-8, -30], [6, -32], [-4, -18], [8, -20], [0, -26]];
    for (var i = 0; i < chips.length; i++) {
      ctx.beginPath();
      ctx.arc(chips[i][0], chips[i][1] + Math.sin(t * 4 + i) * 0.4, 2.2, 0, Math.PI * 2);
      ctx.fill();
    }
    ctx.strokeStyle = "#f3ead7";
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.arc(0, -20, 6, 0.3, Math.PI - 0.3);
    ctx.stroke();
    ctx.fillStyle = "#c9844a";
    ctx.fillRect(-20, -16, 8, 5);
    ctx.fillRect(12, -16, 8, 5);
  }

  function roundRect(ctx, x, y, w, h, r) {
    ctx.beginPath();
    ctx.moveTo(x + r, y);
    ctx.arcTo(x + w, y, x + w, y + h, r);
    ctx.arcTo(x + w, y + h, x, y + h, r);
    ctx.arcTo(x, y + h, x, y, r);
    ctx.arcTo(x, y, x + w, y, r);
    ctx.closePath();
  }

  root.Malefiets = root.Malefiets || {};
  root.Malefiets.RIDERS = RIDERS;
  root.Malefiets.rider = rider;
  root.Malefiets.drawRider = draw;
})(typeof globalThis !== "undefined" ? globalThis : this);
