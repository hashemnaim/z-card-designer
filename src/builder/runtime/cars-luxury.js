/* Z Card — Cars Luxury mobile card runtime.
 * Standalone vanilla JS, zero dependencies.
 * Reads window.ZCARD_DATA (or an explicit argument) and renders into #zcard-root.
 * Config injected above this file at export time as ZC_CONFIG.
 * Rules: empty / null / empty-array values are hidden, empty sections are removed,
 * unknown keys are ignored, official API keys are never renamed.
 */
(function () {
  "use strict";

  var CONFIG = typeof ZC_CONFIG !== "undefined" ? ZC_CONFIG : {};
  var RTL = CONFIG.direction !== "ltr";
  var SAFE_SCHEMES = ["http:", "https:", "mailto:", "tel:"];

  /* ---------------- i18n ---------------- */
  var T = {
    ar: {
      call: "اتصال",
      whatsapp: "واتساب",
      location: "الموقع",
      share: "مشاركة",
      qr: "رمز QR",
      email: "البريد",
      cta: "أنشئ بطاقتك الآن",
      verified: "موثّق",
      readMore: "اقرأ المزيد",
      readLess: "أقل",
      specs: "مواصفات السيارة",
      highlights: "أبرز المميزات",
      description: "الوصف",
      gallery: "معرض الصور",
      video: "الفيديو",
      seller: "البائع",
      social: "روابط التواصل",
      brand: "الماركة",
      model: "الموديل",
      year: "سنة الصنع",
      mileage: "الكيلومترات",
      transmission: "ناقل الحركة",
      fuel: "نوع الوقود",
      engine: "المحرك",
      horsepower: "القوة",
      exterior: "اللون الخارجي",
      interior: "اللون الداخلي",
      drivetrain: "نظام الدفع",
      bodyType: "نوع الهيكل",
      trim: "الفئة",
      km: "كم",
      hp: "حصان",
      copied: "تم نسخ الرابط",
      close: "إغلاق",
    },
    en: {
      call: "Call",
      whatsapp: "WhatsApp",
      location: "Location",
      share: "Share",
      qr: "QR Code",
      email: "Email",
      cta: "Create Your Z Card",
      verified: "Verified",
      readMore: "Read More",
      readLess: "Read Less",
      specs: "Vehicle Specifications",
      highlights: "Highlights",
      description: "Description",
      gallery: "Gallery",
      video: "Featured Video",
      seller: "Seller",
      social: "Social Links",
      brand: "Brand",
      model: "Model",
      year: "Year",
      mileage: "Mileage",
      transmission: "Transmission",
      fuel: "Fuel Type",
      engine: "Engine",
      horsepower: "Horsepower",
      exterior: "Exterior Color",
      interior: "Interior Color",
      drivetrain: "Drivetrain",
      bodyType: "Body Type",
      trim: "Trim",
      km: "km",
      hp: "HP",
      copied: "Link copied",
      close: "Close",
    },
  };
  var L = RTL ? T.ar : T.en;
  var LOCALE = RTL ? "ar-EG" : "en-US";

  /* ---------------- helpers ---------------- */
  function has(v) {
    if (v === null || v === undefined) return false;
    if (typeof v === "string") return v.trim() !== "";
    if (Array.isArray(v)) return v.filter(has).length > 0;
    if (typeof v === "object") return Object.keys(v).length > 0;
    if (typeof v === "boolean") return v === true;
    return true;
  }

  function el(tag, cls, text) {
    var n = document.createElement(tag);
    if (cls) n.className = cls;
    if (text !== undefined && text !== null) n.textContent = String(text);
    return n;
  }

  function safeUrl(raw) {
    if (!has(raw)) return null;
    var value = String(raw).trim();
    try {
      var url = new URL(value, "https://placeholder.invalid");
      if (SAFE_SCHEMES.indexOf(url.protocol) === -1) return null;
      if (/^(https?:|mailto:|tel:)/i.test(value)) return value;
      return url.href;
    } catch (e) {
      return null;
    }
  }

  function img(src, cls, alt) {
    var url = safeUrl(src);
    if (!url) return null;
    var n = el("img", cls);
    n.setAttribute("src", url);
    n.setAttribute("alt", alt || "");
    n.setAttribute("loading", "lazy");
    n.setAttribute("decoding", "async");
    return n;
  }

  function list(value) {
    if (Array.isArray(value)) return value.filter(has);
    if (typeof value === "string" && value.indexOf(",") > -1)
      return value.split(",").map(trim).filter(has);
    return has(value) ? [value] : [];
  }
  function trim(v) {
    return String(v).trim();
  }

  function imageOf(item) {
    if (typeof item === "string") return item;
    if (item && typeof item === "object") return item.url || item.image || item.src || null;
    return null;
  }

  var D = {};
  function get() {
    for (var i = 0; i < arguments.length; i++) {
      var v = D[arguments[i]];
      if (has(v)) return v;
    }
    return null;
  }
  function truthy() {
    for (var i = 0; i < arguments.length; i++) {
      var v = D[arguments[i]];
      if (v === true || v === "true" || v === 1 || v === "1") return true;
    }
    return false;
  }

  function digits(v) {
    return String(v).replace(/[^\d+]/g, "");
  }
  function waLink(v) {
    return "https://wa.me/" + digits(v).replace(/^\+/, "");
  }

  function num(value) {
    var n = Number(value);
    return isNaN(n) ? String(value) : n.toLocaleString(LOCALE);
  }

  function money(amount, currency) {
    var value = num(amount);
    var cur = Array.isArray(currency) ? currency[0] : currency;
    if (!has(cur)) return value;
    return RTL ? value + " " + cur : cur + " " + value;
  }

  /* ---------------- icons (inline, dependency free) ---------------- */
  var ICONS = {
    car: "M3 16.5v-3.2L5.2 8h13.6L21 13.3v3.2M3 16.5h18M6.5 16.5v2M17.5 16.5v2M6.6 12.6h10.8",
    gauge: "M12 21a9 9 0 100-18 9 9 0 000 18zM12 12l4-3.4M12 12h.01",
    star: "M12 3.6l2.6 5.4 5.9.8-4.3 4.1 1 5.9-5.2-2.8-5.2 2.8 1-5.9L3.5 9.8l5.9-.8z",
    text: "M4 6h16M4 11h12M4 16h16M4 21h9",
    images: "M8 4h12v12H8zM4 8v12h12",
    play: "M12 3a9 9 0 100 18 9 9 0 000-18zM10 8.5l6 3.5-6 3.5z",
    pin: "M12 21s7-6.1 7-11a7 7 0 10-14 0c0 4.9 7 11 7 11zM12 12.5a2.5 2.5 0 100-5 2.5 2.5 0 000 5z",
    seller: "M12 12a4 4 0 100-8 4 4 0 000 8zM4.5 21a7.5 7.5 0 0112.4-5.6M16.5 19l1.8 1.8L22 17",
    phone: "M6 3h3l2 5-2.2 1.4a11 11 0 005.8 5.8L16 13l5 2v3a2 2 0 01-2.2 2A16 16 0 014 5.2A2 2 0 016 3z",
    whatsapp:
      "M12 3a9 9 0 00-7.7 13.6L3 21l4.5-1.2A9 9 0 1012 3zm4.3 12.1c-.2.6-1.2 1.1-1.8 1.1-1.6 0-4-1.2-5.5-3.6-.6-1-.9-2-.7-2.7.1-.5.7-1.1 1.2-1.1.3 0 .5.1.7.5l.6 1.3c.1.3 0 .5-.2.7l-.4.4c.5 1 1.4 1.9 2.4 2.4l.4-.4c.2-.2.4-.3.7-.2l1.3.6c.4.2.5.4.5.7z",
    share: "M14 4l6 4-6 4V9.6C9 9.6 6 12 5 17c-.6-6 2.5-9.7 9-10z",
    shareNodes: "M8 12a2.5 2.5 0 11-5 0 2.5 2.5 0 015 0zM21 6.5a2.5 2.5 0 11-5 0 2.5 2.5 0 015 0zM21 17.5a2.5 2.5 0 11-5 0 2.5 2.5 0 015 0zM7.8 10.8l8.4-3.2M7.8 13.2l8.4 3.2",
    qr: "M4 4h6v6H4zM14 4h6v6h-6zM4 14h6v6H4zM14 14h2v2h-2zM18 14h2v2h-2zM16 16h2v2h-2zM14 18h2v2h-2zM18 18h2v2h-2z",
    mail: "M3 6h18v12H3zM3 6l9 7 9-7",
    arrow: "M7 10l5 5 5-5",
    check: "M5 12.5l4.5 4.5L19 7.5",
    fuel: "M6 21V5a2 2 0 012-2h4a2 2 0 012 2v16M5 21h10M6 11h8M14 8h2.5a2 2 0 012 2v6a1.5 1.5 0 003 0v-6l-2-3",
    gear: "M7 4v16M17 4v16M7 8h10M7 14h10",
    engine: "M4 12h2V9h4V7h4v2h3l3 3v5h-3v-3H6v3H4z",
    palette:
      "M12 3a9 9 0 100 18c1.4 0 1.6-1 1-1.8-.7-1 0-2.2 1.2-2.2H17a4 4 0 004-4c0-5-4.5-10-9-10zM7.5 11a1 1 0 100-2 1 1 0 000 2zM11 8a1 1 0 100-2 1 1 0 000 2zM15 9a1 1 0 100-2 1 1 0 000 2z",
    globe: "M12 3a9 9 0 100 18 9 9 0 000-18zM3.5 9h17M3.5 15h17M12 3c2.4 2.4 3.6 5.4 3.6 9S14.4 18.6 12 21c-2.4-2.4-3.6-5.4-3.6-9S9.6 5.4 12 3z",
  };

  function icon(name, cls) {
    var svg = document.createElementNS("http://www.w3.org/2000/svg", "svg");
    svg.setAttribute("viewBox", "0 0 24 24");
    svg.setAttribute("fill", "none");
    svg.setAttribute("aria-hidden", "true");
    if (cls) svg.setAttribute("class", cls);
    var path = document.createElementNS("http://www.w3.org/2000/svg", "path");
    path.setAttribute("d", ICONS[name] || ICONS.car);
    path.setAttribute("stroke", "currentColor");
    path.setAttribute("stroke-width", "1.6");
    path.setAttribute("stroke-linecap", "round");
    path.setAttribute("stroke-linejoin", "round");
    svg.appendChild(path);
    return svg;
  }

  function actionButton(cfg) {
    var node = cfg.href ? el("a", "zc-act") : el("button", "zc-act");
    if (cfg.href) {
      node.setAttribute("href", cfg.href);
      node.setAttribute("rel", "noopener noreferrer");
      if (cfg.href.indexOf("http") === 0) node.setAttribute("target", "_blank");
    } else {
      node.setAttribute("type", "button");
      node.addEventListener("click", cfg.onClick);
    }
    node.setAttribute("aria-label", cfg.label);
    var bubble = el("span", "zc-act__ico");
    bubble.appendChild(icon(cfg.icon));
    node.appendChild(bubble);
    node.appendChild(el("span", "zc-act__txt", cfg.label));
    return node;
  }

  /* ---------------- QR encoder (byte mode, EC level L, versions 1-9) ---------------- */
  /* [total codewords, data codewords, ec codewords per block, blocks] */
  var QR_CAP = [
    null,
    [26, 19, 7, 1],
    [44, 34, 10, 1],
    [70, 55, 15, 1],
    [100, 80, 20, 1],
    [134, 108, 26, 1],
    [172, 136, 18, 2],
    [196, 156, 20, 2],
    [242, 194, 24, 2],
    [292, 232, 30, 2],
  ];
  var QR_ALIGN = [
    null,
    [],
    [6, 18],
    [6, 22],
    [6, 26],
    [6, 30],
    [6, 34],
    [6, 22, 38],
    [6, 24, 42],
    [6, 26, 46],
  ];
  var QR_VERSION_BITS = { 7: 0x07c94, 8: 0x085bc, 9: 0x09a99 };

  var GF_EXP = [];
  var GF_LOG = [];
  (function () {
    var x = 1;
    for (var i = 0; i < 255; i++) {
      GF_EXP[i] = x;
      GF_LOG[x] = i;
      x <<= 1;
      if (x & 0x100) x ^= 0x11d;
    }
    for (var j = 255; j < 512; j++) GF_EXP[j] = GF_EXP[j - 255];
  })();

  function gfMul(a, b) {
    if (!a || !b) return 0;
    return GF_EXP[GF_LOG[a] + GF_LOG[b]];
  }

  function rsGenerator(n) {
    var poly = [1];
    for (var i = 0; i < n; i++) {
      var next = [];
      for (var k = 0; k <= poly.length; k++) next[k] = 0;
      for (var j = 0; j < poly.length; j++) {
        next[j] ^= poly[j];
        next[j + 1] ^= gfMul(poly[j], GF_EXP[i]);
      }
      poly = next;
    }
    return poly;
  }

  function rsEncode(data, ecLen) {
    var gen = rsGenerator(ecLen);
    var res = [];
    for (var i = 0; i < ecLen; i++) res[i] = 0;
    for (var d = 0; d < data.length; d++) {
      var factor = data[d] ^ res[0];
      res.shift();
      res.push(0);
      if (factor) {
        for (var j = 0; j < ecLen; j++) res[j] ^= gfMul(gen[j + 1], factor);
      }
    }
    return res;
  }

  function utf8Bytes(text) {
    var str = String(text);
    if (typeof TextEncoder !== "undefined") {
      var enc = new TextEncoder().encode(str);
      var arr = [];
      for (var i = 0; i < enc.length; i++) arr.push(enc[i]);
      return arr;
    }
    var out = [];
    var escaped = unescape(encodeURIComponent(str));
    for (var c = 0; c < escaped.length; c++) out.push(escaped.charCodeAt(c) & 0xff);
    return out;
  }

  function qrCodewords(text) {
    var bytes = utf8Bytes(text);
    var version = 1;
    while (version < 9 && bytes.length + 2 > QR_CAP[version][1]) version++;
    if (bytes.length + 2 > QR_CAP[9][1]) bytes = bytes.slice(0, QR_CAP[9][1] - 2);
    var cap = QR_CAP[version];
    var dataCap = cap[1];
    var ecLen = cap[2];
    var blocks = cap[3];

    var bits = [];
    function push(value, len) {
      for (var i = len - 1; i >= 0; i--) bits.push((value >> i) & 1);
    }
    push(4, 4); /* byte mode */
    push(bytes.length, 8); /* count indicator, versions 1-9 */
    for (var i = 0; i < bytes.length; i++) push(bytes[i], 8);
    var capacity = dataCap * 8;
    var terminator = Math.min(4, capacity - bits.length);
    for (var t = 0; t < terminator; t++) bits.push(0);
    while (bits.length % 8) bits.push(0);

    var words = [];
    for (var b = 0; b < bits.length; b += 8) {
      var byte = 0;
      for (var k = 0; k < 8; k++) byte = (byte << 1) | bits[b + k];
      words.push(byte);
    }
    var pad = [0xec, 0x11];
    var p = 0;
    while (words.length < dataCap) words.push(pad[p++ % 2]);

    var per = dataCap / blocks;
    var dataBlocks = [];
    var ecBlocks = [];
    for (var g = 0; g < blocks; g++) {
      var chunk = words.slice(g * per, (g + 1) * per);
      dataBlocks.push(chunk);
      ecBlocks.push(rsEncode(chunk, ecLen));
    }
    var out = [];
    for (var ci = 0; ci < per; ci++)
      for (var cb = 0; cb < blocks; cb++) out.push(dataBlocks[cb][ci]);
    for (var ei = 0; ei < ecLen; ei++)
      for (var eb = 0; eb < blocks; eb++) out.push(ecBlocks[eb][ei]);
    return { version: version, codewords: out };
  }

  function bchFormat(data) {
    var d = data << 10;
    for (var i = 14; i >= 10; i--) {
      if ((d >> i) & 1) d ^= 0x537 << (i - 10);
    }
    return (((data << 10) | (d & 0x3ff)) ^ 0x5412) & 0x7fff;
  }

  /** Returns a square matrix of 0/1 modules for the given text (mask pattern 0). */
  function qrMatrix(text) {
    var enc = qrCodewords(text);
    var version = enc.version;
    var size = version * 4 + 17;
    var m = [];
    var fixed = [];
    for (var r = 0; r < size; r++) {
      m[r] = [];
      fixed[r] = [];
      for (var c = 0; c < size; c++) {
        m[r][c] = 0;
        fixed[r][c] = 0;
      }
    }
    function set(row, col, value) {
      if (row < 0 || col < 0 || row >= size || col >= size) return;
      m[row][col] = value ? 1 : 0;
      fixed[row][col] = 1;
    }
    function finder(r0, c0) {
      for (var dr = -1; dr <= 7; dr++) {
        for (var dc = -1; dc <= 7; dc++) {
          var ring =
            (dr >= 0 && dr <= 6 && (dc === 0 || dc === 6)) ||
            (dc >= 0 && dc <= 6 && (dr === 0 || dr === 6)) ||
            (dr >= 2 && dr <= 4 && dc >= 2 && dc <= 4);
          set(r0 + dr, c0 + dc, ring ? 1 : 0);
        }
      }
    }
    finder(0, 0);
    finder(0, size - 7);
    finder(size - 7, 0);

    for (var i = 8; i < size - 8; i++) {
      var tv = i % 2 === 0 ? 1 : 0;
      set(6, i, tv);
      set(i, 6, tv);
    }

    var align = QR_ALIGN[version];
    for (var a = 0; a < align.length; a++) {
      for (var a2 = 0; a2 < align.length; a2++) {
        var ar = align[a];
        var ac = align[a2];
        if (
          (ar <= 8 && ac <= 8) ||
          (ar <= 8 && ac >= size - 9) ||
          (ar >= size - 9 && ac <= 8)
        )
          continue;
        for (var dr2 = -2; dr2 <= 2; dr2++) {
          for (var dc2 = -2; dc2 <= 2; dc2++) {
            var on = Math.max(Math.abs(dr2), Math.abs(dc2)) !== 1;
            set(ar + dr2, ac + dc2, on ? 1 : 0);
          }
        }
      }
    }

    /* reserve format + version areas */
    for (var f = 0; f < 9; f++) {
      if (!fixed[8][f]) set(8, f, 0);
      if (!fixed[f][8]) set(f, 8, 0);
    }
    for (var f2 = 0; f2 < 8; f2++) {
      set(8, size - 1 - f2, 0);
      set(size - 1 - f2, 8, 0);
    }
    set(size - 8, 8, 1);
    if (version >= 7) {
      for (var vi = 0; vi < 3; vi++) {
        for (var vj = 0; vj < 6; vj++) {
          set(size - 11 + vi, vj, 0);
          set(vj, size - 11 + vi, 0);
        }
      }
    }

    /* data placement + mask 0 */
    var cw = enc.codewords;
    var bitIndex = 0;
    function nextBit() {
      var byteI = bitIndex >> 3;
      var bit = byteI < cw.length ? (cw[byteI] >> (7 - (bitIndex & 7))) & 1 : 0;
      bitIndex++;
      return bit;
    }
    var upward = true;
    for (var col = size - 1; col > 0; col -= 2) {
      if (col === 6) col = 5;
      for (var step = 0; step < size; step++) {
        var row = upward ? size - 1 - step : step;
        for (var k2 = 0; k2 < 2; k2++) {
          var cc = col - k2;
          if (fixed[row][cc]) continue;
          var bit = nextBit();
          if ((row + cc) % 2 === 0) bit ^= 1;
          m[row][cc] = bit;
        }
      }
      upward = !upward;
    }

    /* format info: EC level L (01) + mask 0 */
    var fmt = bchFormat((0x01 << 3) | 0);
    for (var fi = 0; fi < 15; fi++) {
      var fbit = (fmt >> fi) & 1;
      if (fi < 6) m[fi][8] = fbit;
      else if (fi < 8) m[fi + 1][8] = fbit;
      else m[size - 15 + fi][8] = fbit;
      if (fi < 8) m[8][size - 1 - fi] = fbit;
      else m[8][15 - fi] = fbit;
    }
    m[size - 8][8] = 1;

    if (version >= 7) {
      var vbits = QR_VERSION_BITS[version];
      for (var b2 = 0; b2 < 18; b2++) {
        var vbit = (vbits >> b2) & 1;
        m[Math.floor(b2 / 3)][size - 11 + (b2 % 3)] = vbit;
        m[size - 11 + (b2 % 3)][Math.floor(b2 / 3)] = vbit;
      }
    }
    return m;
  }

  /** Draws the QR for `text` on a canvas element (offline, no network). */
  function qrCanvas(text, pixels) {
    var matrix = qrMatrix(text);
    var size = matrix.length;
    var quiet = 4;
    var total = size + quiet * 2;
    var scale = Math.max(2, Math.floor((pixels || 240) / total));
    var canvas = document.createElement("canvas");
    canvas.className = "zc-qr__canvas";
    canvas.width = total * scale;
    canvas.height = total * scale;
    canvas.setAttribute("role", "img");
    var ctx = canvas.getContext("2d");
    if (!ctx) return canvas;
    ctx.fillStyle = "#ffffff";
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    ctx.fillStyle = "#111111";
    for (var r = 0; r < size; r++) {
      for (var c = 0; c < size; c++) {
        if (matrix[r][c])
          ctx.fillRect((c + quiet) * scale, (r + quiet) * scale, scale, scale);
      }
    }
    return canvas;
  }

  /* ---------------- overlays ---------------- */

  function toast(message) {
    var t = el("div", "zc-toast", message);
    document.body.appendChild(t);
    requestAnimationFrame(function () {
      t.classList.add("is-on");
    });
    setTimeout(function () {
      t.classList.remove("is-on");
      setTimeout(function () {
        if (t.parentNode) t.parentNode.removeChild(t);
      }, 260);
    }, 1800);
  }

  function openOverlay(build) {
    var overlay = el("div", "zc-overlay");
    var close = el("button", "zc-overlay__close");
    close.setAttribute("type", "button");
    close.setAttribute("aria-label", L.close);
    close.textContent = "✕";
    var body = el("div", "zc-overlay__body");
    build(body);
    overlay.appendChild(close);
    overlay.appendChild(body);
    function dismiss() {
      overlay.classList.remove("is-on");
      setTimeout(function () {
        if (overlay.parentNode) overlay.parentNode.removeChild(overlay);
      }, 240);
    }
    close.addEventListener("click", dismiss);
    overlay.addEventListener("click", function (e) {
      if (e.target === overlay) dismiss();
    });
    document.body.appendChild(overlay);
    requestAnimationFrame(function () {
      overlay.classList.add("is-on");
    });
  }

  function openGallery(images, startIndex) {
    openOverlay(function (body) {
      var strip = el("div", "zc-lightbox");
      images.forEach(function (src) {
        var cell = el("div", "zc-lightbox__cell");
        var node = img(src, "zc-lightbox__img", "");
        if (node) {
          cell.appendChild(node);
          strip.appendChild(cell);
        }
      });
      body.appendChild(strip);
      requestAnimationFrame(function () {
        var cells = strip.children;
        if (cells[startIndex])
          cells[startIndex].scrollIntoView({ inline: "center", block: "nearest" });
      });
    });
  }

  function cardTitle() {
    return get("title") || [get("year"), get("brand"), get("model")].filter(has).join(" ") || "Z Card";
  }

  function openQr() {
    var link = typeof location !== "undefined" ? location.href : "";
    openOverlay(function (body) {
      var box = el("div", "zc-qr");
      var frame = el("div", "zc-qr__frame");
      var src =
        "https://api.qrserver.com/v1/create-qr-code/?size=440x440&margin=8&data=" +
        encodeURIComponent(link);
      var node = img(src, "zc-qr__img", "QR");
      if (node) frame.appendChild(node);
      box.appendChild(frame);
      box.appendChild(el("p", "zc-qr__caption", cardTitle()));
      body.appendChild(box);
    });
  }

  function share() {
    var url = typeof location !== "undefined" ? location.href : "";
    if (navigator.share) {
      navigator.share({ title: String(cardTitle()), url: url }).catch(function () {});
      return;
    }
    if (navigator.clipboard) {
      navigator.clipboard.writeText(url).then(function () {
        toast(L.copied);
      }, function () {});
    }
  }

  /* ---------------- accordion ---------------- */
  var accordions = [];

  function accordion(cfg) {
    if (!cfg.content) return null;
    var item = el("section", "zc-acc");
    var head = el("button", "zc-acc__head");
    head.setAttribute("type", "button");
    head.setAttribute("aria-expanded", "false");

    var badge = el("span", "zc-acc__ico");
    badge.appendChild(icon(cfg.icon));
    head.appendChild(badge);

    var textCol = el("span", "zc-acc__text");
    textCol.appendChild(el("span", "zc-acc__title", cfg.title));
    if (has(cfg.preview)) textCol.appendChild(el("span", "zc-acc__preview", cfg.preview));
    head.appendChild(textCol);

    var chevron = el("span", "zc-acc__chev");
    chevron.appendChild(icon("arrow"));
    head.appendChild(chevron);

    var panel = el("div", "zc-acc__panel");
    var inner = el("div", "zc-acc__inner");
    inner.appendChild(cfg.content);
    panel.appendChild(inner);

    item.appendChild(head);
    item.appendChild(panel);

    var api = {
      node: item,
      close: function () {
        item.classList.remove("is-open");
        head.setAttribute("aria-expanded", "false");
        panel.style.maxHeight = "0px";
      },
      open: function () {
        item.classList.add("is-open");
        head.setAttribute("aria-expanded", "true");
        panel.style.maxHeight = inner.scrollHeight + 32 + "px";
      },
    };
    head.addEventListener("click", function () {
      var isOpen = item.classList.contains("is-open");
      accordions.forEach(function (a) {
        a.close();
      });
      if (!isOpen) {
        api.open();
        setTimeout(function () {
          panel.style.maxHeight = "none";
        }, 420);
      }
    });
    accordions.push(api);
    return api;
  }

  /* ---------------- sections ---------------- */
  function engineText() {
    var size = get("engine_size");
    if (!has(size)) return null;
    var raw = String(size).trim();
    if (/[a-zA-Zء-ي]/.test(raw)) return raw;
    var n = Number(raw);
    if (isNaN(n)) return raw;
    if (n > 100) return (n / 1000).toFixed(1) + "L";
    return n.toFixed(1) + "L";
  }

  function specsBlock() {
    var rows = [
      { icon: "car", label: L.brand, value: get("brand") },
      { icon: "car", label: L.model, value: get("model") },
      { icon: "star", label: L.trim, value: get("trim") },
      { icon: "gauge", label: L.year, value: get("year") },
      {
        icon: "gauge",
        label: L.mileage,
        value: has(get("mileage")) ? num(get("mileage")) + " " + L.km : null,
      },
      { icon: "gear", label: L.transmission, value: get("transmission") },
      { icon: "fuel", label: L.fuel, value: get("fuel_type") },
      { icon: "engine", label: L.engine, value: engineText() },
      {
        icon: "gauge",
        label: L.horsepower,
        value: has(get("horsepower")) ? num(get("horsepower")) + " " + L.hp : null,
      },
      { icon: "car", label: L.drivetrain, value: get("drivetrain") },
      { icon: "car", label: L.bodyType, value: get("body_type") },
      { icon: "palette", label: L.exterior, value: get("exterior_color") },
      { icon: "palette", label: L.interior, value: get("interior_color") },
    ].filter(function (row) {
      return has(row.value);
    });
    if (!rows.length) return null;

    var grid = el("div", "zc-stats");
    rows.forEach(function (row) {
      var cell = el("div", "zc-stat");
      var ic = el("span", "zc-stat__ico");
      ic.appendChild(icon(row.icon));
      cell.appendChild(ic);
      var col = el("span", "zc-stat__col");
      col.appendChild(el("span", "zc-stat__label", row.label));
      col.appendChild(el("span", "zc-stat__value", row.value));
      cell.appendChild(col);
      grid.appendChild(cell);
    });
    return {
      node: grid,
      preview: rows
        .slice(0, 2)
        .map(function (r) {
          return r.value;
        })
        .join(" · "),
    };
  }

  var FEATURE_LABELS = [
    ["leather_seats", "مقاعد جلد", "Leather Seats"],
    ["sunroof", "فتحة سقف بانورامية", "Panoramic Sunroof"],
    ["rear_camera", "كاميرا ٣٦٠°", "360° Camera"],
    ["parking_sensors", "حساسات ركن", "Parking Sensors"],
    ["apple_carplay", "Apple CarPlay", "Apple CarPlay"],
    ["android_auto", "Android Auto", "Android Auto"],
    ["navigation", "نظام ملاحة", "Navigation"],
    ["blind_spot_monitor", "مراقبة النقطة العمياء", "Blind Spot Monitor"],
    ["cruise_control", "مثبت سرعة تكيفي", "Adaptive Cruise Control"],
    ["wireless_charger", "شاحن لاسلكي", "Wireless Charger"],
    ["premium_sound", "نظام صوتي فاخر", "Premium Sound System"],
    ["bluetooth", "بلوتوث", "Bluetooth"],
    ["keyless_entry", "دخول ذكي", "Keyless Entry"],
  ];

  function highlightsBlock() {
    var items = [];
    FEATURE_LABELS.forEach(function (entry) {
      if (truthy(entry[0])) items.push(RTL ? entry[1] : entry[2]);
    });
    list(get("features", "highlights", "feature_name")).forEach(function (item) {
      var name = typeof item === "string" ? item : item && (item.name || item.title || item.label);
      if (has(name)) items.push(name);
    });
    if (!items.length) return null;
    var wrap = el("div", "zc-chips");
    items.forEach(function (name) {
      var chip = el("span", "zc-chip");
      chip.appendChild(icon("check", "zc-chip__ico"));
      chip.appendChild(el("span", null, name));
      wrap.appendChild(chip);
    });
    return { node: wrap, preview: items.slice(0, 3).join(" · ") };
  }

  function descriptionBlock() {
    var text = get("description");
    if (!has(text)) return null;
    var wrap = el("div", "zc-stack");
    var p = el("p", "zc-prose is-clamped", String(text));
    wrap.appendChild(p);
    if (String(text).length > 160) {
      var toggle = el("button", "zc-more", L.readMore);
      toggle.setAttribute("type", "button");
      toggle.addEventListener("click", function () {
        var clamped = p.classList.toggle("is-clamped");
        toggle.textContent = clamped ? L.readMore : L.readLess;
      });
      wrap.appendChild(toggle);
    }
    return { node: wrap, preview: String(text).slice(0, 42) + "…" };
  }

  function allImages() {
    return list(get("gallery", "gallery_images"))
      .concat(list(get("interior_gallery")))
      .map(imageOf)
      .filter(has);
  }

  function galleryBlock() {
    var all = allImages();
    if (!all.length) return null;
    var slider = el("div", "zc-slider");
    all.slice(0, 4).forEach(function (src, index) {
      var cell = el("button", "zc-slide");
      cell.setAttribute("type", "button");
      var node = img(src, "zc-slide__img", "");
      if (!node) return;
      cell.appendChild(node);
      cell.addEventListener("click", function () {
        openGallery(all, index);
      });
      slider.appendChild(cell);
    });
    if (!slider.childNodes.length) return null;
    var wrap = el("div", "zc-stack");
    wrap.appendChild(slider);
    if (all.length > 4) {
      var more = el("button", "zc-more", "+" + (all.length - 4));
      more.setAttribute("type", "button");
      more.addEventListener("click", function () {
        openGallery(all, 4);
      });
      wrap.appendChild(more);
    }
    return { node: wrap, preview: String(all.length) };
  }

  function videoBlock() {
    var url = safeUrl(get("video_url"));
    if (!url) return null;
    var images = allImages();
    var thumb = get("video_thumbnail") || (images.length ? images[0] : null);
    var card = el("a", "zc-video");
    card.setAttribute("href", url);
    card.setAttribute("target", "_blank");
    card.setAttribute("rel", "noopener noreferrer");
    var node = img(thumb, "zc-video__img", "");
    if (node) card.appendChild(node);
    else card.classList.add("is-plain");
    var play = el("span", "zc-video__play");
    play.appendChild(icon("play"));
    card.appendChild(play);
    return { node: card, preview: "" };
  }

  function sellerBlock() {
    var name = get("seller_name");
    var title = get("seller_title");
    var company = get("seller_company");
    var photo = get("seller_avatar");
    var phone = get("seller_phone", "phone", "Phone");
    var wa = get("seller_whatsapp", "whatsapp", "WhatsApp");
    var mail = get("email", "seller_email", "email_address");
    if (!has(name) && !has(photo) && !has(phone) && !has(wa) && !has(mail)) return null;

    var wrap = el("div", "zc-stack");
    var row = el("div", "zc-agent");
    var avatar = img(photo, "zc-agent__photo", name || "");
    if (avatar) row.appendChild(avatar);
    var col = el("div", "zc-agent__col");
    if (has(name)) {
      var nameRow = el("span", "zc-agent__namerow");
      nameRow.appendChild(el("span", "zc-agent__name", name));
      if (truthy("seller_verified")) {
        var mark = el("span", "zc-agent__check");
        mark.appendChild(icon("check"));
        nameRow.appendChild(mark);
      }
      col.appendChild(nameRow);
    }
    if (has(title)) col.appendChild(el("span", "zc-agent__title", title));
    if (has(company)) col.appendChild(el("span", "zc-agent__company", company));
    row.appendChild(col);
    wrap.appendChild(row);

    var actions = el("div", "zc-agent__actions");
    if (has(phone))
      actions.appendChild(
        actionButton({ icon: "phone", label: L.call, href: "tel:" + digits(phone) }),
      );
    if (has(wa))
      actions.appendChild(actionButton({ icon: "whatsapp", label: L.whatsapp, href: waLink(wa) }));
    if (has(mail))
      actions.appendChild(
        actionButton({ icon: "mail", label: L.email, href: "mailto:" + String(mail).trim() }),
      );
    if (actions.childNodes.length) wrap.appendChild(actions);
    return { node: wrap, preview: [name, title].filter(has).join(" · ") };
  }

  var SOCIALS = [
    { keys: ["website", "website_url"], label: "Website", glyph: "globe" },
    { keys: ["instagram", "instagram_url"], label: "Instagram", short: "IG" },
    { keys: ["facebook", "facebook_url"], label: "Facebook", short: "f" },
    { keys: ["youtube", "youtube_url"], label: "YouTube", short: "YT" },
    { keys: ["tiktok", "tiktok_url"], label: "TikTok", short: "TT" },
    { keys: ["snapchat", "snapchat_url"], label: "Snapchat", short: "SC" },
    { keys: ["linkedin", "linkedin_url"], label: "LinkedIn", short: "in" },
    { keys: ["x", "x_url", "twitter_url"], label: "X", short: "X" },
  ];

  function socialBlock() {
    var wrap = el("div", "zc-social");
    var labels = [];
    SOCIALS.forEach(function (entry) {
      var url = safeUrl(get.apply(null, entry.keys));
      if (!url) return;
      var link = el("a", "zc-social__item");
      link.setAttribute("href", url);
      link.setAttribute("target", "_blank");
      link.setAttribute("rel", "noopener noreferrer");
      link.setAttribute("aria-label", entry.label);
      if (entry.glyph) link.appendChild(icon(entry.glyph));
      else link.appendChild(el("span", "zc-social__txt", entry.short));
      wrap.appendChild(link);
      labels.push(entry.label);
    });
    if (!wrap.childNodes.length) return null;
    return { node: wrap, preview: labels.slice(0, 3).join(" · ") };
  }

  /* ---------------- hero ---------------- */
  function priceText() {
    var amount = get("price");
    return has(amount) ? money(amount, get("currency")) : null;
  }

  function heroTitle() {
    var title = get("title");
    if (has(title)) return String(title);
    var parts = [get("year"), get("brand"), get("model")].filter(has);
    return parts.length ? parts.join(" ") : null;
  }

  /* ---------------- render ---------------- */
  function render(data) {
    var root = document.getElementById("zcard-root");
    if (!root) return;
    D = data || window.ZCARD_DATA || {};
    accordions = [];
    while (root.firstChild) root.removeChild(root.firstChild);

    root.setAttribute("dir", RTL ? "rtl" : "ltr");
    root.setAttribute("lang", RTL ? "ar" : "en");
    root.className = "zc-root zc-root--cars";

    var title = heroTitle();
    var price = priceText();
    var place = get("location");
    var badge = get("badge", "condition");
    var short = get("short_description", "description");
    var images = allImages();
    var cover = get("cover_image") || get("featured_image") || (images.length ? images[0] : null);
    var vehicle = get("featured_image") || cover;
    var verified = truthy("verified", "seller_verified");

    /* sticky glass header */
    var header = el("header", "zc-sticky");
    var headInner = el("div", "zc-sticky__in");
    var headThumb = img(vehicle, "zc-sticky__thumb zc-sticky__thumb--car", "");
    if (headThumb) headInner.appendChild(headThumb);
    var headCol = el("div", "zc-sticky__col");
    if (has(title)) headCol.appendChild(el("span", "zc-sticky__title", title));
    if (price) headCol.appendChild(el("span", "zc-sticky__price", price));
    headInner.appendChild(headCol);
    header.appendChild(headInner);
    root.appendChild(header);

    /* hero */
    var hero = el("section", "zc-hero zc-hero--cars");
    var coverWrap = el("div", "zc-hero__cover");
    var coverImg = img(cover, "zc-hero__coverimg", title || "");
    if (coverImg) coverWrap.appendChild(coverImg);
    else coverWrap.classList.add("is-plain");
    coverWrap.appendChild(el("span", "zc-hero__scrim"));

    var float = el("div", "zc-hero__car");
    var floatImg = img(vehicle, "zc-hero__carimg", title || "");
    if (floatImg) {
      float.appendChild(floatImg);
      coverWrap.appendChild(float);
    }
    hero.appendChild(coverWrap);

    var body = el("div", "zc-hero__body");

    var tags = el("div", "zc-hero__tags");
    if (has(badge)) tags.appendChild(el("span", "zc-status", badge));
    if (verified) {
      var pill = el("span", "zc-vpill");
      pill.appendChild(icon("check", "zc-vpill__ico"));
      pill.appendChild(el("span", null, L.verified));
      tags.appendChild(pill);
    }
    if (tags.childNodes.length) body.appendChild(tags);

    if (has(title)) body.appendChild(el("h1", "zc-hero__title", title));
    if (price) body.appendChild(el("p", "zc-hero__price", price));

    var metaRow = el("div", "zc-hero__meta");
    [get("brand"), get("model"), get("year"), get("trim")].filter(has).forEach(function (part) {
      metaRow.appendChild(el("span", "zc-hero__metaitem", part));
    });
    if (has(get("body_type"))) {
      var bt = el("span", "zc-hero__metaitem zc-hero__metaitem--ico");
      bt.appendChild(icon("car"));
      bt.appendChild(el("span", null, get("body_type")));
      metaRow.appendChild(bt);
    }
    if (metaRow.childNodes.length) body.appendChild(metaRow);

    if (has(place)) {
      var loc = el("p", "zc-hero__loc");
      loc.appendChild(icon("pin"));
      loc.appendChild(el("span", null, place));
      body.appendChild(loc);
    }
    if (has(short)) body.appendChild(el("p", "zc-hero__desc", short));

    hero.appendChild(body);
    root.appendChild(hero);

    /* accordions */
    var stack = el("div", "zc-sections");
    var blocks = [
      { icon: "car", title: L.specs, build: specsBlock },
      { icon: "star", title: L.highlights, build: highlightsBlock },
      { icon: "text", title: L.description, build: descriptionBlock },
      { icon: "images", title: L.gallery, build: galleryBlock },
      { icon: "play", title: L.video, build: videoBlock },
      { icon: "seller", title: L.seller, build: sellerBlock },
      { icon: "shareNodes", title: L.social, build: socialBlock },
    ];
    blocks.forEach(function (block) {
      var built = block.build();
      if (!built) return;
      var acc = accordion({
        icon: block.icon,
        title: block.title,
        preview: built.preview,
        content: built.node,
      });
      if (acc) stack.appendChild(acc.node);
    });
    if (stack.childNodes.length) {
      root.appendChild(stack);
      accordions[0].open();
      setTimeout(function () {
        var panel = accordions[0].node.querySelector(".zc-acc__panel");
        if (panel) panel.style.maxHeight = "none";
      }, 420);
    }

    /* floating action bar */
    var phone = get("phone", "Phone", "seller_phone");
    var wa = get("whatsapp", "WhatsApp", "seller_whatsapp");
    var map = safeUrl(get("map_url", "google_maps_url", "location_url"));
    if (!map && has(place))
      map = "https://maps.google.com/?q=" + encodeURIComponent(String(place));
    var bar = el("nav", "zc-bar");
    var barIn = el("div", "zc-bar__in");
    if (has(phone))
      barIn.appendChild(
        actionButton({ icon: "phone", label: L.call, href: "tel:" + digits(phone) }),
      );
    if (has(wa))
      barIn.appendChild(actionButton({ icon: "whatsapp", label: L.whatsapp, href: waLink(wa) }));
    if (map) barIn.appendChild(actionButton({ icon: "pin", label: L.location, href: map }));
    barIn.appendChild(actionButton({ icon: "share", label: L.share, onClick: share }));
    barIn.appendChild(actionButton({ icon: "qr", label: L.qr, onClick: openQr }));
    bar.appendChild(barIn);
    root.appendChild(bar);

    bindScroll(header, coverWrap, float);
    return root;
  }

  /* ---------------- scroll choreography ---------------- */
  function bindScroll(header, coverWrap, float) {
    var raf = null;
    function apply() {
      raf = null;
      var y = window.scrollY || document.documentElement.scrollTop || 0;
      var p = Math.min(1, Math.max(0, y / 170));
      coverWrap.style.setProperty("--p", String(p));
      if (float) float.style.setProperty("--p", String(p));
      if (p > 0.7) header.classList.add("is-on");
      else header.classList.remove("is-on");
    }
    window.addEventListener(
      "scroll",
      function () {
        if (raf === null) raf = requestAnimationFrame(apply);
      },
      { passive: true },
    );
    apply();
  }

  window.ZCardTemplate = {
    id: CONFIG.id,
    cardType: CONFIG.cardType,
    schemaVersion: CONFIG.schemaVersion,
    layout: "cars-luxury",
    render: render,
  };

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", function () {
      render(window.ZCARD_DATA);
    });
  } else {
    render(window.ZCARD_DATA);
  }
})();
