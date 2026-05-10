/* Pillars — interactive bento
   - 5 cards, each with a unique mini-canvas viz that animates on hover
   - 3D tilt parallax on mouseover
   - cursor-following glow
   - mode picker (Tweaks-only): A/B/C variants flip section class
*/
(function () {
  var section = document.getElementById("pillars");
  if (!section) return;
  var bento = document.getElementById("pillars-bento");
  if (!bento) return;

  /* ---------- Mode picker ---------- */
  var DEFAULT_MODE = "dataviz";
  function applyMode(name) {
    section.classList.remove(
      "pillars-mode-dataviz",
      "pillars-mode-architectural",
      "pillars-mode-cinematic",
    );
    section.classList.add("pillars-mode-" + name);
    document.querySelectorAll("[data-mode-pick]").forEach(function (b) {
      b.classList.toggle(
        "is-active",
        b.getAttribute("data-mode-pick") === name,
      );
    });
    try {
      localStorage.setItem("origyn-pillars-mode", name);
    } catch (e) {}
  }
  document.querySelectorAll("[data-mode-pick]").forEach(function (b) {
    b.addEventListener("click", function () {
      applyMode(b.getAttribute("data-mode-pick"));
    });
  });
  var saved = null;
  try {
    saved = localStorage.getItem("origyn-pillars-mode");
  } catch (e) {}
  applyMode(saved || DEFAULT_MODE);

  /* ---------- Theme helpers ---------- */
  function isDark() {
    return (
      (document.documentElement.getAttribute("data-theme") || "dark") !==
      "light"
    );
  }
  function P() {
    return isDark()
      ? {
          ink: "rgba(79,155,255,",
          ink2: "rgba(18,194,233,",
          glow: "rgba(140,200,255,",
          line: "rgba(120,160,210,",
          text: "rgba(220,230,245,",
          dim: "rgba(120,140,170,",
        }
      : {
          ink: "rgba(10,90,158,",
          ink2: "rgba(0,53,105,",
          glow: "rgba(26,123,213,",
          line: "rgba(40,60,90,",
          text: "rgba(20,30,45,",
          dim: "rgba(90,110,140,",
        };
  }

  var sectionVisible = false;
  function shouldAnimate() {
    return sectionVisible && !document.hidden;
  }
  function scheduleStep(fn) {
    if (shouldAnimate()) requestAnimationFrame(fn);
    else setTimeout(function () { requestAnimationFrame(fn); }, 240);
  }
  if ("IntersectionObserver" in window) {
    new IntersectionObserver(
      function (entries) {
        sectionVisible = entries.some(function (entry) {
          return entry.isIntersecting;
        });
      },
      { rootMargin: "160px" },
    ).observe(section);
  } else {
    sectionVisible = true;
  }

  /* ---------- 3D tilt + cursor glow per card ---------- */
  var prefersReduced =
    window.matchMedia &&
    window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  var isTouch = window.matchMedia && window.matchMedia("(hover: none)").matches;
  function tiltEnabled() {
    return !prefersReduced && !(window.TWEAKS && window.TWEAKS.cardTilt === false);
  }
  /* Touch devices: tap to toggle is-active, ensure only one active at a time */
  if (isTouch) {
    document.addEventListener("click", function (e) {
      var card = e.target.closest(".pcard");
      document.querySelectorAll(".pcard.is-active").forEach(function (c) {
        if (c !== card) {
          c.classList.remove("is-active");
          var key = c.getAttribute("data-pillar");
          if (viz[key] && viz[key].onLeave) viz[key].onLeave();
        }
      });
      if (card) {
        card.classList.toggle("is-active");
        var k = card.getAttribute("data-pillar");
        if (card.classList.contains("is-active")) {
          if (viz[k] && viz[k].onEnter) viz[k].onEnter();
        } else {
          if (viz[k] && viz[k].onLeave) viz[k].onLeave();
        }
      }
    });
  }
  var activeCard = null;
  function clearActiveCard() {
    if (!activeCard) return;
    var key = activeCard.getAttribute("data-pillar");
    activeCard.classList.remove("is-active");
    activeCard.style.transform = "";
    if (viz[key] && viz[key].onLeave) viz[key].onLeave();
    activeCard = null;
  }
  bento.addEventListener("mouseleave", function () {
    if (isTouch) return;
    clearActiveCard();
  });
  document.querySelectorAll(".pcard").forEach(function (card) {
    var glow = card.querySelector(".pcard__glow");
    card.addEventListener("mouseenter", function () {
      if (isTouch) return; /* skip on touch — handled via click */
      if (activeCard === card) return;
      clearActiveCard();
      activeCard = card;
      card.classList.add("is-active");
      var key = card.getAttribute("data-pillar");
      if (viz[key] && viz[key].onEnter) viz[key].onEnter();
    });
    card.addEventListener("mouseleave", function () {
      if (isTouch) return;
      card.style.transform = "";
      if (glow) glow.style.opacity = "";
    });
    card.addEventListener("mousemove", function (e) {
      var r = card.getBoundingClientRect();
      var x = e.clientX - r.left,
        y = e.clientY - r.top;
      var nx = x / r.width - 0.5;
      var ny = y / r.height - 0.5;
      // glow
      if (glow) {
        glow.style.left = x + "px";
        glow.style.top = y + "px";
      }
      // notify viz
      var key = card.getAttribute("data-pillar");
      if (viz[key] && viz[key].onMove) viz[key].onMove(nx, ny);
      if (!tiltEnabled()) return;
      // tilt
      var tiltX = (-ny * 6).toFixed(2); // rotateX
      var tiltY = (nx * 8).toFixed(2); // rotateY
      card.style.transform =
        "translateZ(0) rotateX(" + tiltX + "deg) rotateY(" + tiltY + "deg)";
    });
  });

  /* ---------- Per-card visualisations ---------- */
  /* Each viz mounts a canvas in .pcard__viz and animates.
     They run all the time at low intensity, ramp up on hover. */

  function mkCanvas(host) {
    var c = document.createElement("canvas");
    host.appendChild(c);
    var ctx = c.getContext("2d");
    var DPR = Math.min(1.5, window.devicePixelRatio || 1);
    var resizeRaf = 0;
    function size() {
      var r = host.getBoundingClientRect();
      var nextWidth = Math.max(1, Math.floor(r.width * DPR));
      var nextHeight = Math.max(1, Math.floor(r.height * DPR));
      if (c.width === nextWidth && c.height === nextHeight) return;
      c.width = nextWidth;
      c.height = nextHeight;
      c.style.width = "100%";
      c.style.height = "100%";
      ctx.setTransform(DPR, 0, 0, DPR, 0, 0);
    }
    function scheduleSize() {
      if (resizeRaf) return;
      resizeRaf = requestAnimationFrame(function () {
        resizeRaf = 0;
        size();
      });
    }
    size();
    window.addEventListener("resize", scheduleSize);
    if ("ResizeObserver" in window) {
      new ResizeObserver(scheduleSize).observe(host);
    }
    return {
      c: c,
      ctx: ctx,
      size: size,
      get w() {
        return c.width / DPR;
      },
      get h() {
        return c.height / DPR;
      },
    };
  }

  var viz = {};

  /* === 01 TRUST — animated certificate seal that auto-validates === */
  (function () {
    var host = document.querySelector('[data-viz="trust"]');
    if (!host) return;
    var k = mkCanvas(host);
    var t = 0,
      hover = 0,
      stamp = 0;
    function step(now) {
      if (!shouldAnimate()) {
        scheduleStep(step);
        return;
      }
      var p = P();
      var w = k.w,
        h = k.h,
        ctx = k.ctx;
      ctx.clearRect(0, 0, w, h);
      hover =
        hover +
        ((host.parentNode.classList.contains("is-active") ? 1 : 0) - hover) *
          0.08;
      t += 16;
      // central seal
      var cx = w * 0.72,
        cy = h * 0.42;
      var R = Math.min(w, h) * 0.32;
      // outer rotating ring with tick marks
      ctx.save();
      ctx.translate(cx, cy);
      ctx.rotate(t * 0.0003);
      ctx.strokeStyle = p.ink + (0.35 + hover * 0.4) + ")";
      ctx.lineWidth = 1;
      for (var i = 0; i < 60; i++) {
        var a = (i / 60) * Math.PI * 2;
        var inner = R * 0.92,
          outer = R * (i % 5 === 0 ? 1.05 : 1.0);
        ctx.beginPath();
        ctx.moveTo(Math.cos(a) * inner, Math.sin(a) * inner);
        ctx.lineTo(Math.cos(a) * outer, Math.sin(a) * outer);
        ctx.stroke();
      }
      // perimeter ring
      ctx.beginPath();
      ctx.arc(0, 0, R * 0.92, 0, Math.PI * 2);
      ctx.stroke();
      ctx.restore();
      // inner ring counter-rotates
      ctx.save();
      ctx.translate(cx, cy);
      ctx.rotate(-t * 0.0005);
      ctx.strokeStyle = p.ink2 + (0.5 + hover * 0.4) + ")";
      ctx.beginPath();
      ctx.arc(0, 0, R * 0.6, 0, Math.PI * 2);
      ctx.stroke();
      // dashed mid ring
      ctx.setLineDash([4, 6]);
      ctx.strokeStyle = p.glow + (0.3 + hover * 0.5) + ")";
      ctx.beginPath();
      ctx.arc(0, 0, R * 0.75, 0, Math.PI * 2);
      ctx.stroke();
      ctx.setLineDash([]);
      ctx.restore();
      // checkmark grows on hover (validation)
      stamp =
        stamp +
        ((host.parentNode.classList.contains("is-active") ? 1 : 0) - stamp) *
          0.15;
      ctx.save();
      ctx.translate(cx, cy);
      ctx.strokeStyle = p.glow + (0.4 + stamp * 0.6) + ")";
      ctx.lineWidth = 2.4 + stamp * 1.5;
      ctx.lineCap = "round";
      var s = R * 0.42;
      ctx.beginPath();
      ctx.moveTo(-s * 0.55, 0);
      ctx.lineTo(-s * 0.1, s * 0.4 * stamp);
      ctx.lineTo(s * 0.6, -s * 0.45 * stamp);
      ctx.stroke();
      ctx.restore();
      // hash strings drifting on the left — kept in the middle band to avoid
      // overlapping the .pcard__num at top (~36px) and .pcard__name at bottom (~80px)
      ctx.font = "9px JetBrains Mono, monospace";
      ctx.fillStyle = p.dim + (0.55 + hover * 0.3) + ")";
      var hashes = [
        "0xA3F2…91D",
        "0x7E1B…40C",
        "0x2C9A…F7E",
        "SHA-256",
        "SIG ✓",
        "ICP-CERT",
      ];
      var topPad = 50,
        bottomPad = 90;
      var band = Math.max(60, h - topPad - bottomPad);
      for (var hi = 0; hi < hashes.length; hi++) {
        var yy = topPad + ((hi * 16 + t * 0.02 * (0.3 + hover)) % band);
        ctx.fillText(hashes[hi], 18, yy);
      }
      scheduleStep(step);
    }
    scheduleStep(step);
    viz.trust = {};
  })();

  /* === 02 CONTEXT — dense knowledge graph (force-directed feel) === */
  (function () {
    var host = document.querySelector('[data-viz="context"]');
    if (!host) return;
    var k = mkCanvas(host);
    var t = 0,
      hover = 0;
    var nodes = [];
    var links = [];
    var center = null;

    /* tier-based layout: 1 core, ~7 inner ring, ~14 outer ring, plus stragglers */
    function init() {
      var w = k.w,
        h = k.h;
      nodes = [];
      links = [];
      var cx = w * 0.62,
        cy = h * 0.55;
      var R = Math.min(w, h);

      /* core */
      center = { x: cx, y: cy, ox: cx, oy: cy, r: 4.5, tier: 0, phase: 0 };
      nodes.push(center);

      /* inner tier */
      var inner = 7;
      for (var i = 0; i < inner; i++) {
        var a = (i / inner) * Math.PI * 2 + 0.4;
        var d = R * 0.22;
        nodes.push({
          x: cx + Math.cos(a) * d,
          y: cy + Math.sin(a) * d,
          ox: cx + Math.cos(a) * d,
          oy: cy + Math.sin(a) * d,
          r: 2.5 + Math.random() * 1.2,
          tier: 1,
          phase: Math.random() * 6.28,
          drift: 4 + Math.random() * 4,
        });
      }
      /* outer tier */
      var outer = 14;
      for (var j = 0; j < outer; j++) {
        var a2 = (j / outer) * Math.PI * 2 + Math.random() * 0.4;
        var d2 = R * 0.36 + Math.random() * R * 0.05;
        nodes.push({
          x: cx + Math.cos(a2) * d2,
          y: cy + Math.sin(a2) * d2,
          ox: cx + Math.cos(a2) * d2,
          oy: cy + Math.sin(a2) * d2,
          r: 1.6 + Math.random() * 1,
          tier: 2,
          phase: Math.random() * 6.28,
          drift: 6 + Math.random() * 6,
        });
      }
      /* outliers — sparse + dim */
      var stragglers = 6;
      for (var s = 0; s < stragglers; s++) {
        var a3 = Math.random() * Math.PI * 2;
        var d3 = R * 0.5 + Math.random() * R * 0.08;
        nodes.push({
          x: cx + Math.cos(a3) * d3,
          y: cy + Math.sin(a3) * d3,
          ox: cx + Math.cos(a3) * d3,
          oy: cy + Math.sin(a3) * d3,
          r: 1.2 + Math.random() * 0.7,
          tier: 3,
          phase: Math.random() * 6.28,
          drift: 8 + Math.random() * 8,
        });
      }

      /* edges: every inner -> core */
      for (var i2 = 1; i2 <= inner; i2++)
        links.push({ a: 0, b: i2, kind: "core" });
      /* outer -> nearest inner */
      for (var j2 = inner + 1; j2 < inner + 1 + outer; j2++) {
        var nb = 1 + Math.floor(Math.random() * inner);
        links.push({ a: nb, b: j2, kind: "edge" });
      }
      /* a few inner-inner cross-connections */
      for (var c = 0; c < 3; c++) {
        var x1 = 1 + Math.floor(Math.random() * inner);
        var x2 = 1 + Math.floor(Math.random() * inner);
        if (x1 !== x2) links.push({ a: x1, b: x2, kind: "edge" });
      }
      /* outer-outer few */
      for (var c2 = 0; c2 < 4; c2++) {
        var y1 = inner + 1 + Math.floor(Math.random() * outer);
        var y2 = inner + 1 + Math.floor(Math.random() * outer);
        if (y1 !== y2) links.push({ a: y1, b: y2, kind: "thin" });
      }
      /* stragglers -> outer */
      for (var s2 = 0; s2 < stragglers; s2++) {
        var ow = inner + 1 + Math.floor(Math.random() * outer);
        links.push({ a: ow, b: inner + 1 + outer + s2, kind: "thin" });
      }
    }
    init();
    window.addEventListener("resize", init);

    function step() {
      if (!shouldAnimate()) {
        scheduleStep(step);
        return;
      }
      var p = P();
      var w = k.w,
        h = k.h,
        ctx = k.ctx;
      ctx.clearRect(0, 0, w, h);
      hover =
        hover +
        ((host.parentNode.classList.contains("is-active") ? 1 : 0) - hover) *
          0.08;
      t += 16;

      /* drift each node around its origin */
      for (var i = 1; i < nodes.length; i++) {
        var n = nodes[i];
        var d = n.drift * (0.5 + hover * 1.2);
        n.x = n.ox + Math.cos(t * 0.0009 + n.phase) * d;
        n.y = n.oy + Math.sin(t * 0.0011 + n.phase * 1.3) * d;
      }

      /* edges */
      for (var l = 0; l < links.length; l++) {
        var L = links[l];
        var a = nodes[L.a],
          b = nodes[L.b];
        var baseA, baseB;
        if (L.kind === "core") {
          baseA = 0.55 + hover * 0.25;
          baseB = 0.18 + hover * 0.2;
          ctx.lineWidth = 1;
        } else if (L.kind === "edge") {
          baseA = 0.32 + hover * 0.3;
          baseB = 0.1 + hover * 0.18;
          ctx.lineWidth = 1;
        } else {
          baseA = 0.18 + hover * 0.25;
          baseB = 0.04 + hover * 0.12;
          ctx.lineWidth = 0.8;
        }
        var grad = ctx.createLinearGradient(a.x, a.y, b.x, b.y);
        grad.addColorStop(0, p.glow + baseA + ")");
        grad.addColorStop(1, p.ink + baseB + ")");
        ctx.strokeStyle = grad;
        ctx.beginPath();
        ctx.moveTo(a.x, a.y);
        ctx.lineTo(b.x, b.y);
        ctx.stroke();
      }

      /* traveling pulses on core links only */
      for (var lp = 0; lp < links.length; lp++) {
        if (links[lp].kind !== "core") continue;
        var aa = nodes[links[lp].a],
          bb = nodes[links[lp].b];
        var prog = (t * 0.0006 + lp * 0.21) % 1;
        var px = aa.x + (bb.x - aa.x) * prog,
          py = aa.y + (bb.y - aa.y) * prog;
        ctx.fillStyle = p.glow + (0.65 + hover * 0.35) + ")";
        ctx.beginPath();
        ctx.arc(px, py, 1.4 + hover * 1.4, 0, Math.PI * 2);
        ctx.fill();
      }

      /* nodes */
      for (var n3 = 0; n3 < nodes.length; n3++) {
        var nn = nodes[n3];
        var pulse = nn.tier === 0 ? 1 + hover * 0.6 : 1;
        var rr = nn.r * pulse;
        /* glow */
        var alphaGlow = (nn.tier <= 1 ? 0.4 : 0.22) + hover * 0.3;
        var gg = ctx.createRadialGradient(nn.x, nn.y, 0, nn.x, nn.y, rr * 5);
        gg.addColorStop(0, p.glow + alphaGlow + ")");
        gg.addColorStop(1, p.glow + "0)");
        ctx.fillStyle = gg;
        ctx.beginPath();
        ctx.arc(nn.x, nn.y, rr * 5, 0, Math.PI * 2);
        ctx.fill();
        /* core */
        var coreA =
          nn.tier === 0
            ? 1
            : nn.tier === 1
              ? 0.95
              : nn.tier === 2
                ? 0.75
                : 0.55;
        ctx.fillStyle = p.glow + coreA + ")";
        ctx.beginPath();
        ctx.arc(nn.x, nn.y, rr, 0, Math.PI * 2);
        ctx.fill();
      }
      scheduleStep(step);
    }
    scheduleStep(step);
    viz.context = {};
  })();

  /* === 03 DISTRIBUTION — wireframe globe + arcs (network map) === */
  (function () {
    var host = document.querySelector('[data-viz="distribution"]');
    if (!host) return;
    var k = mkCanvas(host);
    var t = 0,
      hover = 0;

    /* fixed pin positions on the sphere (lat/lon, deg) — geographic feel */
    var PINS = [
      { lat: 47, lon: 8, name: "CH" }, // Switzerland (anchor)
      { lat: 51, lon: -0, name: "GB" },
      { lat: 40, lon: -74, name: "US-E" },
      { lat: 37, lon: -122, name: "US-W" },
      { lat: 35, lon: 139, name: "JP" },
      { lat: 1, lon: 103, name: "SG" },
      { lat: -33, lon: 151, name: "AU" },
      { lat: 28, lon: 77, name: "IN" },
      { lat: -23, lon: -46, name: "BR" },
    ];
    /* arcs originate from CH (index 0) to all others */
    var arcs = [];
    for (var ai = 1; ai < PINS.length; ai++) {
      arcs.push({ from: 0, to: ai, offset: Math.random() });
    }

    function project(lat, lon, R, rotY) {
      var la = (lat * Math.PI) / 180;
      var lo = (lon * Math.PI) / 180 + rotY;
      var x = R * Math.cos(la) * Math.sin(lo);
      var y = R * Math.sin(la) * -1; // canvas y inverted
      var z = R * Math.cos(la) * Math.cos(lo);
      return { x: x, y: y, z: z };
    }

    function step() {
      if (!shouldAnimate()) {
        scheduleStep(step);
        return;
      }
      var p = P();
      var w = k.w,
        h = k.h,
        ctx = k.ctx;
      ctx.clearRect(0, 0, w, h);
      hover =
        hover +
        ((host.parentNode.classList.contains("is-active") ? 1 : 0) - hover) *
          0.08;
      t += 16;

      var cx = w * 0.62,
        cy = h * 0.55;
      var R = Math.min(w, h) * 0.4;
      var rotY = t * 0.00025 + hover * 0.4;

      ctx.save();
      ctx.translate(cx, cy);

      /* === sphere wireframe === */
      /* longitudes (meridians) */
      var meridians = 9;
      for (var m = 0; m < meridians; m++) {
        var lon0 = (m / meridians) * Math.PI * 2 + rotY;
        ctx.beginPath();
        var first = true;
        for (var la = -90; la <= 90; la += 8) {
          var laR = (la * Math.PI) / 180;
          var x = R * Math.cos(laR) * Math.sin(lon0);
          var y = R * Math.sin(laR) * -1;
          var z = R * Math.cos(laR) * Math.cos(lon0);
          if (z < -0.02) {
            first = true;
            continue;
          }
          if (first) {
            ctx.moveTo(x, y);
            first = false;
          } else ctx.lineTo(x, y);
        }
        var alphaM = 0.1 + hover * 0.18;
        ctx.strokeStyle = p.line + alphaM + ")";
        ctx.lineWidth = 1;
        ctx.stroke();
      }
      /* latitudes (parallels) */
      for (var pa = -60; pa <= 60; pa += 20) {
        var paR = (pa * Math.PI) / 180;
        ctx.beginPath();
        var first2 = true;
        for (var lo = 0; lo <= 360; lo += 6) {
          var loR = (lo * Math.PI) / 180 + rotY;
          var x2 = R * Math.cos(paR) * Math.sin(loR);
          var y2 = R * Math.sin(paR) * -1;
          var z2 = R * Math.cos(paR) * Math.cos(loR);
          if (z2 < -0.02) {
            first2 = true;
            continue;
          }
          if (first2) {
            ctx.moveTo(x2, y2);
            first2 = false;
          } else ctx.lineTo(x2, y2);
        }
        var alphaP = 0.08 + hover * 0.15;
        ctx.strokeStyle = p.line + alphaP + ")";
        ctx.lineWidth = 1;
        ctx.stroke();
      }

      /* equator highlight */
      ctx.beginPath();
      var firstE = true;
      for (var le = 0; le <= 360; le += 4) {
        var loE = (le * Math.PI) / 180 + rotY;
        var xe = R * Math.sin(loE);
        var ze = R * Math.cos(loE);
        if (ze < -0.02) {
          firstE = true;
          continue;
        }
        if (firstE) {
          ctx.moveTo(xe, 0);
          firstE = false;
        } else ctx.lineTo(xe, 0);
      }
      ctx.strokeStyle = p.ink + (0.22 + hover * 0.2) + ")";
      ctx.lineWidth = 1;
      ctx.stroke();

      /* === pins === */
      var pinPos = PINS.map(function (P_) {
        return project(P_.lat, P_.lon, R, rotY);
      });
      for (var pi = 0; pi < PINS.length; pi++) {
        var pp = pinPos[pi];
        if (pp.z < 0) continue; // back of sphere
        var depth = (pp.z + R) / (2 * R); // 0..1
        var rr = (pi === 0 ? 3.5 : 2.2) + depth * 1.5;
        /* halo */
        var hg = ctx.createRadialGradient(pp.x, pp.y, 0, pp.x, pp.y, rr * 5);
        hg.addColorStop(0, p.glow + (0.5 + hover * 0.3) + ")");
        hg.addColorStop(1, p.glow + "0)");
        ctx.fillStyle = hg;
        ctx.beginPath();
        ctx.arc(pp.x, pp.y, rr * 5, 0, Math.PI * 2);
        ctx.fill();
        /* core */
        ctx.fillStyle = p.glow + (0.85 + depth * 0.15) + ")";
        ctx.beginPath();
        ctx.arc(pp.x, pp.y, rr, 0, Math.PI * 2);
        ctx.fill();
        /* CH ring */
        if (pi === 0) {
          ctx.strokeStyle = p.glow + (0.6 + hover * 0.3) + ")";
          ctx.lineWidth = 1.2;
          ctx.beginPath();
          ctx.arc(
            pp.x,
            pp.y,
            rr * 2.2 + Math.sin(t * 0.003) * 1.5,
            0,
            Math.PI * 2,
          );
          ctx.stroke();
        }
      }

      /* === arcs (great-circle approximation) === */
      for (var ar = 0; ar < arcs.length; ar++) {
        var A = arcs[ar];
        var fp = pinPos[A.from],
          tp = pinPos[A.to];
        if (fp.z < -0.1 && tp.z < -0.1) continue;
        /* curve up off the sphere */
        var mx = (fp.x + tp.x) / 2;
        var my = (fp.y + tp.y) / 2;
        var dx = tp.x - fp.x,
          dy = tp.y - fp.y;
        var len = Math.hypot(dx, dy);
        var lift = len * 0.45 + 18;
        var cmx = mx,
          cmy = my - lift;
        /* draw faint full arc */
        ctx.beginPath();
        ctx.moveTo(fp.x, fp.y);
        ctx.quadraticCurveTo(cmx, cmy, tp.x, tp.y);
        var arcAlpha = 0.18 + hover * 0.25;
        ctx.strokeStyle = p.ink + arcAlpha + ")";
        ctx.lineWidth = 1;
        ctx.stroke();
        /* traveling packet along arc */
        var prog = (t * 0.0007 + A.offset) % 1;
        var u = 1 - prog;
        var bx = u * u * fp.x + 2 * u * prog * cmx + prog * prog * tp.x;
        var by = u * u * fp.y + 2 * u * prog * cmy + prog * prog * tp.y;
        /* draw bright leading segment */
        var trailSteps = 8;
        ctx.lineWidth = 1.6;
        for (var ts = 0; ts < trailSteps; ts++) {
          var p1 = Math.max(0, prog - ts * 0.025);
          var p2 = Math.max(0, prog - (ts + 1) * 0.025);
          var u1 = 1 - p1,
            u2 = 1 - p2;
          var x1t = u1 * u1 * fp.x + 2 * u1 * p1 * cmx + p1 * p1 * tp.x;
          var y1t = u1 * u1 * fp.y + 2 * u1 * p1 * cmy + p1 * p1 * tp.y;
          var x2t = u2 * u2 * fp.x + 2 * u2 * p2 * cmx + p2 * p2 * tp.x;
          var y2t = u2 * u2 * fp.y + 2 * u2 * p2 * cmy + p2 * p2 * tp.y;
          var alphaT = (1 - ts / trailSteps) * (0.7 + hover * 0.3);
          ctx.strokeStyle = p.glow + alphaT + ")";
          ctx.beginPath();
          ctx.moveTo(x1t, y1t);
          ctx.lineTo(x2t, y2t);
          ctx.stroke();
        }
        /* head */
        ctx.fillStyle = p.glow + 0.95 + ")";
        ctx.beginPath();
        ctx.arc(bx, by, 1.8 + hover * 1.2, 0, Math.PI * 2);
        ctx.fill();
      }

      ctx.restore();
      scheduleStep(step);
    }
    scheduleStep(step);
    viz.distribution = {};
  })();

  /* === 04 TASTE — preference curve with sample dots converging === */
  (function () {
    var host = document.querySelector('[data-viz="taste"]');
    if (!host) return;
    var k = mkCanvas(host);
    var t = 0,
      hover = 0;
    var dots = [];
    function init() {
      dots = [];
      for (var i = 0; i < 28; i++)
        dots.push({
          x: Math.random(),
          y: Math.random(),
          tx: Math.random(),
          ty: Math.random(),
          v: 0.005 + Math.random() * 0.01,
        });
    }
    init();
    function step() {
      if (!shouldAnimate()) {
        scheduleStep(step);
        return;
      }
      var p = P();
      var w = k.w,
        h = k.h,
        ctx = k.ctx;
      ctx.clearRect(0, 0, w, h);
      hover =
        hover +
        ((host.parentNode.classList.contains("is-active") ? 1 : 0) - hover) *
          0.08;
      t += 16;
      // grid
      ctx.strokeStyle = p.line + "0.08)";
      ctx.lineWidth = 1;
      for (var gx = 0; gx < 5; gx++) {
        var x = w * (0.5 + gx * 0.12);
        ctx.beginPath();
        ctx.moveTo(x, h * 0.1);
        ctx.lineTo(x, h * 0.95);
        ctx.stroke();
      }
      for (var gy = 0; gy < 4; gy++) {
        var y = h * (0.2 + gy * 0.22);
        ctx.beginPath();
        ctx.moveTo(w * 0.5, y);
        ctx.lineTo(w * 0.97, y);
        ctx.stroke();
      }
      // bezier curve "taste"
      ctx.strokeStyle = p.glow + (0.6 + hover * 0.3) + ")";
      ctx.lineWidth = 1.6;
      ctx.beginPath();
      var x0 = w * 0.5,
        y0 = h * 0.85;
      var x1 = w * 0.65,
        y1 = h * 0.4 + Math.sin(t * 0.001) * 8;
      var x2 = w * 0.82,
        y2 = h * 0.7 + Math.cos(t * 0.001) * 8;
      var x3 = w * 0.97,
        y3 = h * 0.18;
      ctx.moveTo(x0, y0);
      ctx.bezierCurveTo(x1, y1, x2, y2, x3, y3);
      ctx.stroke();
      // dots wandering then converging on hover toward curve
      for (var i = 0; i < dots.length; i++) {
        var d = dots[i];
        if (host.parentNode.classList.contains("is-active")) {
          // attract toward curve sample
          var pp = i / dots.length;
          var bx = bez(x0, x1, x2, x3, pp),
            by = bez(y0, y1, y2, y3, pp);
          d.x += (bx / w - d.x) * 0.06;
          d.y += (by / h - d.y) * 0.06;
        } else {
          d.x += (d.tx - d.x) * d.v;
          d.y += (d.ty - d.y) * d.v;
          if (Math.abs(d.x - d.tx) < 0.01) {
            d.tx = Math.random();
            d.ty = Math.random();
          }
        }
        var px = w * (0.5 + d.x * 0.47),
          py = h * (0.1 + d.y * 0.85);
        ctx.fillStyle = p.ink + (0.55 + hover * 0.35) + ")";
        ctx.beginPath();
        ctx.arc(px, py, 1.6, 0, Math.PI * 2);
        ctx.fill();
      }
      scheduleStep(step);
    }
    function bez(a, b, c, d, t) {
      var u = 1 - t;
      return (
        u * u * u * a + 3 * u * u * t * b + 3 * u * t * t * c + t * t * t * d
      );
    }
    scheduleStep(step);
    viz.taste = {};
  })();

  /* === 05 LIABILITY — ledger / audit lines scrolling === */
  (function () {
    var host = document.querySelector('[data-viz="liability"]');
    if (!host) return;
    var k = mkCanvas(host);
    var t = 0,
      hover = 0;
    var rows = [];
    function init() {
      rows = [];
      for (var i = 0; i < 12; i++) {
        rows.push({
          y: i * 16,
          hash: rndHash(),
          ok: Math.random() > 0.1,
        });
      }
    }
    function rndHash() {
      var s = "0x";
      var hex = "0123456789ABCDEF";
      for (var i = 0; i < 6; i++) s += hex[Math.floor(Math.random() * 16)];
      return s;
    }
    init();
    function step() {
      if (!shouldAnimate()) {
        scheduleStep(step);
        return;
      }
      var p = P();
      var w = k.w,
        h = k.h,
        ctx = k.ctx;
      ctx.clearRect(0, 0, w, h);
      hover =
        hover +
        ((host.parentNode.classList.contains("is-active") ? 1 : 0) - hover) *
          0.08;
      t += 16;
      var speed = 0.25 + hover * 1.2;
      ctx.font = "10px JetBrains Mono, monospace";
      ctx.textBaseline = "middle";
      var startX = w * 0.5;
      for (var i = 0; i < rows.length; i++) {
        var r = rows[i];
        r.y -= speed;
        if (r.y < -16) {
          r.y = h + 8;
          r.hash = rndHash();
          r.ok = Math.random() > 0.15;
        }
        var alpha = 0.6 - Math.abs((r.y - h / 2) / h) * 0.6 + hover * 0.2;
        if (alpha < 0.05) continue;
        // status pip
        ctx.fillStyle = (r.ok ? p.glow : p.ink2) + alpha + ")";
        ctx.beginPath();
        ctx.arc(startX + 10, r.y, 2.2, 0, Math.PI * 2);
        ctx.fill();
        // hash
        ctx.fillStyle = p.text + alpha + ")";
        ctx.fillText(r.hash, startX + 22, r.y);
        // status
        ctx.fillStyle = p.dim + alpha + ")";
        ctx.fillText(r.ok ? "CERT ✓" : "PEND", startX + 90, r.y);
        // line
        ctx.strokeStyle = p.line + alpha * 0.3 + ")";
        ctx.lineWidth = 1;
        ctx.beginPath();
        ctx.moveTo(startX + 140, r.y);
        ctx.lineTo(w - 12, r.y);
        ctx.stroke();
      }
      // left edge accent
      ctx.fillStyle = p.glow + (0.25 + hover * 0.4) + ")";
      ctx.fillRect(startX, 0, 2, h);
      scheduleStep(step);
    }
    scheduleStep(step);
    viz.liability = {};
  })();

  /* Theme observer: nothing to repaint manually since each loop reads palette() each frame */
  new MutationObserver(function () {}).observe(document.documentElement, {
    attributes: true,
    attributeFilter: ["data-theme"],
  });
})();
