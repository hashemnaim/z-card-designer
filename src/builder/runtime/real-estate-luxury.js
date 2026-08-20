/* Z Card — Real Estate Luxury mobile card runtime.
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
      openMaps: "فتح الخريطة",
      overview: "نظرة عامة على العقار",
      features: "المميزات والخدمات",
      description: "الوصف",
      gallery: "معرض الصور",
      video: "الفيديو",
      locationSection: "الموقع",
      agent: "الوكيل العقاري",
      area: "المساحة",
      bedrooms: "غرف النوم",
      bathrooms: "الحمامات",
      parking: "المواقف",
      ready: "جاهز للسكن",
      cars: "سيارات",
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
      openMaps: "Open Maps",
      overview: "Property Overview",
      features: "Features & Amenities",
      description: "Description",
      gallery: "Gallery",
      video: "Featured Video",
      locationSection: "Location",
      agent: "Agent",
      area: "Area",
      bedrooms: "Bedrooms",
      bathrooms: "Bathrooms",
      parking: "Parking",
      ready: "Ready to Move",
      cars: "Cars",
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

  function money(amount, currency) {
    var n = Number(amount);
    var value = isNaN(n) ? String(amount) : n.toLocaleString(LOCALE);
    var cur = Array.isArray(currency) ? currency[0] : currency;
    if (!has(cur)) return value;
    return RTL ? value + " " + cur : cur + " " + value;
  }

  /* ---------------- icons (inline, dependency free) ---------------- */
  var ICONS = {
    house: "M3 11.2 12 4l9 7.2M5.5 9.8V20h13V9.8",
    star: "M12 3.6l2.6 5.4 5.9.8-4.3 4.1 1 5.9-5.2-2.8-5.2 2.8 1-5.9L3.5 9.8l5.9-.8z",
    text: "M4 6h16M4 11h12M4 16h16M4 21h9",
    images: "M8 4h12v12H8zM4 8v12h12",
    play: "M12 3a9 9 0 100 18 9 9 0 000-18zM10 8.5l6 3.5-6 3.5z",
    pin: "M12 21s7-6.1 7-11a7 7 0 10-14 0c0 4.9 7 11 7 11zM12 12.5a2.5 2.5 0 100-5 2.5 2.5 0 000 5z",
    agent: "M12 12a4 4 0 100-8 4 4 0 000 8zM4.5 21a7.5 7.5 0 0115 0",
    phone: "M6 3h3l2 5-2.2 1.4a11 11 0 005.8 5.8L16 13l5 2v3a2 2 0 01-2.2 2A16 16 0 014 5.2A2 2 0 016 3z",
    whatsapp:
      "M12 3a9 9 0 00-7.7 13.6L3 21l4.5-1.2A9 9 0 1012 3zm4.3 12.1c-.2.6-1.2 1.1-1.8 1.1-1.6 0-4-1.2-5.5-3.6-.6-1-.9-2-.7-2.7.1-.5.7-1.1 1.2-1.1.3 0 .5.1.7.5l.6 1.3c.1.3 0 .5-.2.7l-.4.4c.5 1 1.4 1.9 2.4 2.4l.4-.4c.2-.2.4-.3.7-.2l1.3.6c.4.2.5.4.5.7z",
    share: "M14 4l6 4-6 4V9.6C9 9.6 6 12 5 17c-.6-6 2.5-9.7 9-10z",
    qr: "M4 4h6v6H4zM14 4h6v6h-6zM4 14h6v6H4zM14 14h2v2h-2zM18 14h2v2h-2zM16 16h2v2h-2zM14 18h2v2h-2zM18 18h2v2h-2z",
    mail: "M3 6h18v12H3zM3 6l9 7 9-7",
    arrow: "M7 10l5 5 5-5",
    check: "M5 12.5l4.5 4.5L19 7.5",
    ruler: "M4 14.5 14.5 4l5.5 5.5L9.5 20z",
    bed: "M3 18v-6h11a4 4 0 014 4v2M3 12V7M3 18h18",
    bath: "M4 12h16v3a4 4 0 01-4 4H8a4 4 0 01-4-4zM8 12V6a2 2 0 114 0",
    car: "M4 16v-3l2-5h12l2 5v3M4 16h16M7 16v2M17 16v2",
  };

  function icon(name, cls) {
    var svg = document.createElementNS("http://www.w3.org/2000/svg", "svg");
    svg.setAttribute("viewBox", "0 0 24 24");
    svg.setAttribute("fill", "none");
    svg.setAttribute("aria-hidden", "true");
    if (cls) svg.setAttribute("class", cls);
    var path = document.createElementNS("http://www.w3.org/2000/svg", "path");
    path.setAttribute("d", ICONS[name] || ICONS.house);
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
        if (cells[startIndex]) cells[startIndex].scrollIntoView({ inline: "center", block: "nearest" });
      });
    });
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
      box.appendChild(el("p", "zc-qr__caption", get("property_name", "property_title") || "Z Card"));
      body.appendChild(box);
    });
  }

  function share() {
    var title = get("property_name") || "Z Card";
    var url = typeof location !== "undefined" ? location.href : "";
    if (navigator.share) {
      navigator.share({ title: String(title), url: url }).catch(function () {});
      return;
    }
    if (navigator.clipboard) {
      navigator.clipboard.writeText(url).then(
        function () {
          toast(L.copied);
        },
        function () {},
      );
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

  /* ---------------- section builders ---------------- */
  function statGrid() {
    var stats = [];
    var area = get("property_area", "area");
    if (has(area)) {
      var unit = get("area_unit") || "m²";
      stats.push({
        icon: "ruler",
        label: L.area,
        value: Number(area).toLocaleString(LOCALE) + " " + (unit === "m2" ? "m²" : unit),
      });
    }
    if (has(get("bedrooms"))) stats.push({ icon: "bed", label: L.bedrooms, value: get("bedrooms") });
    if (has(get("bathrooms")))
      stats.push({ icon: "bath", label: L.bathrooms, value: get("bathrooms") });
    if (has(get("parking_spaces")))
      stats.push({
        icon: "car",
        label: L.parking,
        value: get("parking_spaces") + " " + L.cars,
      });
    var ready = truthy("ready_to_move");
    if (!stats.length && !ready) return null;

    var wrap = el("div", "zc-stack");
    if (stats.length) {
      var grid = el("div", "zc-stats");
      stats.forEach(function (s) {
        var cell = el("div", "zc-stat");
        var ic = el("span", "zc-stat__ico");
        ic.appendChild(icon(s.icon));
        cell.appendChild(ic);
        var col = el("span", "zc-stat__col");
        col.appendChild(el("span", "zc-stat__label", s.label));
        col.appendChild(el("span", "zc-stat__value", s.value));
        cell.appendChild(col);
        grid.appendChild(cell);
      });
      wrap.appendChild(grid);
    }
    if (ready) {
      var pill = el("div", "zc-ready");
      pill.appendChild(icon("check", "zc-ready__ico"));
      pill.appendChild(el("span", null, L.ready));
      wrap.appendChild(pill);
    }
    return { node: wrap, preview: stats.slice(0, 2).map(previewOf).join(" · ") };
  }
  function previewOf(s) {
    return s.value + " " + s.label;
  }

  function featureChips() {
    var raw = get("feature_name", "features", "amenities");
    var items = list(raw).map(function (item) {
      return typeof item === "string" ? item : item && (item.name || item.title || item.label);
    });
    items = items.filter(has);
    if (!items.length) return null;
    var wrap = el("div", "zc-chips");
    items.forEach(function (name) {
      wrap.appendChild(el("span", "zc-chip", name));
    });
    return { node: wrap, preview: items.slice(0, 3).join(" · ") };
  }

  function descriptionBlock() {
    var text = get("property_description");
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

  function galleryBlock() {
    var all = list(get("gallery_images")).map(imageOf).filter(has);
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
    var thumb = get("video_thumbnail") || firstImage();
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

  function locationBlock() {
    var mapUrl = safeUrl(get("google_maps_url", "map_url"));
    var lines = ["address", "city", "state", "country"]
      .map(function (key) {
        return get(key);
      })
      .filter(has);
    if (!mapUrl && !lines.length) return null;

    var wrap = el("div", "zc-stack");
    if (mapUrl) {
      var mini = el("a", "zc-map");
      mini.setAttribute("href", mapUrl);
      mini.setAttribute("target", "_blank");
      mini.setAttribute("rel", "noopener noreferrer");
      var grid = el("span", "zc-map__grid");
      mini.appendChild(grid);
      var pin = el("span", "zc-map__pin");
      pin.appendChild(icon("pin"));
      mini.appendChild(pin);
      wrap.appendChild(mini);
    }
    if (lines.length) {
      var addr = el("div", "zc-address");
      lines.forEach(function (line) {
        addr.appendChild(el("span", "zc-address__line", line));
      });
      wrap.appendChild(addr);
    }
    if (mapUrl) {
      var btn = el("a", "zc-btn zc-btn--ghost", L.openMaps);
      btn.setAttribute("href", mapUrl);
      btn.setAttribute("target", "_blank");
      btn.setAttribute("rel", "noopener noreferrer");
      wrap.appendChild(btn);
    }
    return { node: wrap, preview: lines.slice(0, 2).join(RTL ? "، " : ", ") };
  }

  function agentBlock() {
    var name = get("agent_name");
    var title = get("agent_title");
    var company = get("company_name", "agent_company");
    var photo = get("agent_photo", "agent_avatar");
    var phone = get("agent_phone", "phone_number", "Phone");
    var wa = get("agent_whatsapp", "whatsapp_number", "WhatsApp");
    var mail = get("agent_email", "email_address");
    if (!has(name) && !has(photo) && !has(phone) && !has(wa) && !has(mail)) return null;

    var wrap = el("div", "zc-stack");
    var row = el("div", "zc-agent");
    var avatar = img(photo, "zc-agent__photo", name || "");
    if (avatar) row.appendChild(avatar);
    var col = el("div", "zc-agent__col");
    if (has(name)) col.appendChild(el("span", "zc-agent__name", name));
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

  /* ---------------- hero ---------------- */
  function firstImage() {
    var gallery = list(get("gallery_images")).map(imageOf).filter(has);
    return gallery.length ? gallery[0] : null;
  }

  function priceText() {
    var amount = get("price");
    return has(amount) ? money(amount, get("currency")) : null;
  }

  function locationText() {
    var short = get("short_location");
    if (has(short)) return String(short);
    var parts = [get("address"), get("city"), get("state")].filter(has);
    return parts.length ? parts.slice(0, 2).join(RTL ? "، " : ", ") : null;
  }

  function statusText() {
    var status = get("property_status");
    return has(status) ? String(status) : null;
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
    root.className = "zc-root";

    var title = get("property_name");
    var type = typeLabel(get("property_type"));
    var price = priceText();
    var place = locationText();
    var status = statusText();
    var short = get("short_description", "property_description");
    var cover = get("cover_image") || firstImage();
    var portrait = get("property_image") || cover;
    var verified = truthy("verified_badge", "verified");

    /* sticky header */
    var header = el("header", "zc-sticky");
    var headInner = el("div", "zc-sticky__in");
    var headThumb = img(portrait, "zc-sticky__thumb", "");
    if (headThumb) headInner.appendChild(headThumb);
    var headCol = el("div", "zc-sticky__col");
    if (has(title)) headCol.appendChild(el("span", "zc-sticky__title", title));
    if (price) headCol.appendChild(el("span", "zc-sticky__price", price));
    headInner.appendChild(headCol);
    header.appendChild(headInner);
    root.appendChild(header);

    /* hero */
    var hero = el("section", "zc-hero");
    var coverWrap = el("div", "zc-hero__cover");
    var coverImg = img(cover, "zc-hero__coverimg", title || "");
    if (coverImg) coverWrap.appendChild(coverImg);
    else coverWrap.classList.add("is-plain");
    coverWrap.appendChild(el("span", "zc-hero__scrim"));
    hero.appendChild(coverWrap);

    var body = el("div", "zc-hero__body");
    var float = el("div", "zc-hero__float");
    var floatImg = img(portrait, "zc-hero__floatimg", title || "");
    if (floatImg) float.appendChild(floatImg);
    if (verified) {
      var badge = el("span", "zc-verified");
      badge.appendChild(icon("check"));
      float.appendChild(badge);
    }
    if (float.childNodes.length) body.appendChild(float);

    if (status) {
      var tag = el("span", "zc-status", status);
      body.appendChild(tag);
    }
    if (has(title)) body.appendChild(el("h1", "zc-hero__title", title));

    var metaRow = el("div", "zc-hero__meta");
    if (has(type)) metaRow.appendChild(el("span", "zc-hero__type", type));
    if (place) {
      var loc = el("span", "zc-hero__loc");
      loc.appendChild(icon("pin"));
      loc.appendChild(el("span", null, place));
      metaRow.appendChild(loc);
    }
    if (metaRow.childNodes.length) body.appendChild(metaRow);
    if (price) body.appendChild(el("p", "zc-hero__price", price));
    if (has(short)) body.appendChild(el("p", "zc-hero__desc", short));

    var cta = el("a", "zc-btn zc-btn--gold", L.cta);
    cta.setAttribute("href", CONFIG.ctaUrl || "https://zcard.app");
    cta.setAttribute("target", "_blank");
    cta.setAttribute("rel", "noopener noreferrer");
    body.appendChild(cta);

    hero.appendChild(body);
    root.appendChild(hero);

    /* accordions */
    var stack = el("div", "zc-sections");
    var blocks = [
      { icon: "house", title: L.overview, build: statGrid },
      { icon: "star", title: L.features, build: featureChips },
      { icon: "text", title: L.description, build: descriptionBlock },
      { icon: "images", title: L.gallery, build: galleryBlock },
      { icon: "play", title: L.video, build: videoBlock },
      { icon: "pin", title: L.locationSection, build: locationBlock },
      { icon: "agent", title: L.agent, build: agentBlock },
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
        accordions[0].node.querySelector(".zc-acc__panel").style.maxHeight = "none";
      }, 420);
    }

    /* floating action bar */
    var phone = get("phone_number", "Phone", "agent_phone");
    var wa = get("whatsapp_number", "WhatsApp", "agent_whatsapp");
    var map = safeUrl(get("map_url", "google_maps_url"));
    var bar = el("nav", "zc-bar");
    var barIn = el("div", "zc-bar__in");
    if (has(phone))
      barIn.appendChild(actionButton({ icon: "phone", label: L.call, href: "tel:" + digits(phone) }));
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
      var p = Math.min(1, Math.max(0, y / 160));
      coverWrap.style.setProperty("--p", String(p));
      if (float) float.style.setProperty("--p", String(p));
      if (p > 0.72) header.classList.add("is-on");
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
    layout: "real-estate-luxury",
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
