/* Z Card standalone template runtime — vanilla JS, no dependencies.
 * Reads window.ZCARD_DATA (or an explicit argument) and renders into #zcard-root.
 * Config is injected above this file at export time as ZC_CONFIG.
 * Rules: missing / null / empty-string / empty-array values are hidden,
 * empty sections are removed entirely, unknown keys are ignored.
 */
(function () {
  "use strict";

  var CONFIG = typeof ZC_CONFIG !== "undefined" ? ZC_CONFIG : {};
  var SAFE_SCHEMES = ["http:", "https:", "mailto:", "tel:"];

  function has(value) {
    if (value === null || value === undefined) return false;
    if (typeof value === "string") return value.trim() !== "";
    if (Array.isArray(value)) return value.filter(has).length > 0;
    if (typeof value === "object") return Object.keys(value).length > 0;
    if (typeof value === "boolean") return value === true;
    return true;
  }

  function lang() {
    return CONFIG.direction === "ltr" ? "en" : "ar";
  }

  function label(field) {
    var l = field.label || {};
    return (lang() === "en" ? l.en || l.ar : l.ar || l.en) || field.key;
  }

  function el(tag, className, text) {
    var node = document.createElement(tag);
    if (className) node.className = className;
    if (text !== undefined && text !== null) node.textContent = String(text);
    return node;
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

  function imageNode(src, className, altText) {
    var url = safeUrl(src);
    if (!url) return null;
    var img = el("img", className);
    img.setAttribute("src", url);
    img.setAttribute("alt", altText || "");
    img.setAttribute("loading", "lazy");
    return img;
  }

  function asArray(value) {
    if (Array.isArray(value)) return value.filter(has);
    if (typeof value === "string" && value.indexOf(",") > -1) {
      return value
        .split(",")
        .map(function (v) {
          return v.trim();
        })
        .filter(has);
    }
    return has(value) ? [value] : [];
  }

  function formatValue(field, value) {
    if (field.type === "integer" || field.type === "currency") {
      var n = Number(value);
      return isNaN(n) ? String(value) : n.toLocaleString(lang() === "en" ? "en-US" : "ar-EG");
    }
    if (Array.isArray(value)) return value.filter(has).join(lang() === "en" ? ", " : "، ");
    return String(value);
  }

  function linkButton(text, href, variant) {
    var url = safeUrl(href);
    if (!url) return null;
    var a = el("a", "zc-btn" + (variant ? " zc-btn--" + variant : ""), text);
    a.setAttribute("href", url);
    a.setAttribute("rel", "noopener noreferrer");
    if (url.indexOf("http") === 0) a.setAttribute("target", "_blank");
    return a;
  }

  var SOCIAL_TYPES = ["youtube", "tiktok", "twitter", "facebook", "instagram", "linkedin"];
  var SOCIAL_GLYPHS = {
    youtube: "▶",
    tiktok: "♪",
    twitter: "X",
    facebook: "f",
    instagram: "◎",
    linkedin: "in",
  };

  function renderGallery(field, value) {
    var items = asArray(value);
    if (!items.length) return null;
    var wrap = el("div", "zc-gallery");
    items.forEach(function (item) {
      var src = typeof item === "string" ? item : item && (item.url || item.image || item.src);
      var img = imageNode(src, "zc-gallery__img", label(field));
      if (img) {
        var cell = el("div", "zc-gallery__cell");
        cell.appendChild(img);
        wrap.appendChild(cell);
      }
    });
    return wrap.childNodes.length ? wrap : null;
  }

  function renderContact(fields, data) {
    var wrap = el("div", "zc-contact zc-contact--" + (CONFIG.contactStyle || "floating"));
    fields.forEach(function (field) {
      var value = data[field.key];
      if (!has(value)) return;
      var node = null;
      var key = field.key.toLowerCase();
      if (field.type === "phone" && key.indexOf("whats") > -1) {
        node = linkButton(
          lang() === "en" ? "WhatsApp" : "واتساب",
          "https://wa.me/" + String(value).replace(/[^\d+]/g, "").replace(/^\+/, ""),
          "accent",
        );
      } else if (field.type === "phone") {
        node = linkButton(lang() === "en" ? "Call" : "اتصال", "tel:" + String(value), "accent");
      } else if (field.type === "email") {
        node = linkButton(lang() === "en" ? "Email" : "البريد", "mailto:" + String(value));
      } else if (field.type === "google_map") {
        node = linkButton(lang() === "en" ? "Map" : "الخريطة", String(value));
      } else {
        node = el("div", "zc-contact__meta");
        node.appendChild(el("span", "zc-label", label(field)));
        node.appendChild(el("span", "zc-value", formatValue(field, value)));
      }
      if (node) wrap.appendChild(node);
    });
    return wrap.childNodes.length ? wrap : null;
  }

  function renderSocial(fields, data) {
    var wrap = el("div", "zc-social");
    fields.forEach(function (field) {
      var url = safeUrl(data[field.key]);
      if (!url) return;
      var a = el("a", "zc-social__item", SOCIAL_GLYPHS[field.type] || "•");
      a.setAttribute("href", url);
      a.setAttribute("target", "_blank");
      a.setAttribute("rel", "noopener noreferrer");
      a.setAttribute("aria-label", label(field));
      wrap.appendChild(a);
    });
    return wrap.childNodes.length ? wrap : null;
  }

  function renderVideo(field, value) {
    var url = safeUrl(value);
    if (!url) return null;
    var wrap = el("div", "zc-video");
    var link = linkButton((lang() === "en" ? "Watch: " : "شاهد: ") + label(field), url);
    if (link) wrap.appendChild(link);
    return wrap;
  }

  function renderFlags(fields, data) {
    var wrap = el("div", "zc-flags");
    fields.forEach(function (field) {
      var value = data[field.key];
      if (value !== true && value !== "true" && value !== 1) return;
      wrap.appendChild(el("span", "zc-chip", label(field)));
    });
    return wrap.childNodes.length ? wrap : null;
  }

  function renderSpecs(fields, data) {
    var wrap = el("div", "zc-specs");
    fields.forEach(function (field) {
      var value = data[field.key];
      if (!has(value)) return;
      var item = el("div", "zc-specs__item");
      item.appendChild(el("span", "zc-label", label(field)));
      item.appendChild(el("span", "zc-value", formatValue(field, value)));
      wrap.appendChild(item);
    });
    return wrap.childNodes.length ? wrap : null;
  }

  function renderSection(section, data, usedKeys) {
    var body = el("div", "zc-section__body");
    var galleries = [];
    var videos = [];
    var socials = [];
    var flags = [];
    var contacts = [];
    var texts = [];
    var specs = [];
    var images = [];

    section.fields.forEach(function (field) {
      if (usedKeys[field.key] === "hero") return;
      if (field.type === "gallery") galleries.push(field);
      else if (field.type === "video_url") videos.push(field);
      else if (SOCIAL_TYPES.indexOf(field.type) > -1) socials.push(field);
      else if (field.type === "checkbox" || field.type === "switch") flags.push(field);
      else if (field.type === "phone" || field.type === "email" || field.type === "google_map")
        contacts.push(field);
      else if (field.type === "textarea") texts.push(field);
      else if (field.type === "image") images.push(field);
      else specs.push(field);
    });

    images.forEach(function (field) {
      var img = imageNode(data[field.key], "zc-image", label(field));
      if (img) body.appendChild(img);
    });
    galleries.forEach(function (field) {
      var node = renderGallery(field, data[field.key]);
      if (node) body.appendChild(node);
    });
    videos.forEach(function (field) {
      var node = renderVideo(field, data[field.key]);
      if (node) body.appendChild(node);
    });
    texts.forEach(function (field) {
      if (!has(data[field.key])) return;
      var block = el("div", "zc-text");
      block.appendChild(el("p", "zc-paragraph", String(data[field.key])));
      body.appendChild(block);
    });
    var specNode = renderSpecs(specs, data);
    if (specNode) body.appendChild(specNode);
    var flagNode = renderFlags(flags, data);
    if (flagNode) body.appendChild(flagNode);
    var contactNode = contacts.length ? renderContact(contacts, data) : null;
    if (contactNode) body.appendChild(contactNode);
    var socialNode = socials.length ? renderSocial(socials, data) : null;
    if (socialNode) body.appendChild(socialNode);

    if (!body.childNodes.length) return null;

    var wrap = el("section", "zc-section zc-section--" + section.id);
    var title = section.label && (lang() === "en" ? section.label.en : section.label.ar);
    if (title) {
      var head = el("div", "zc-section__head");
      head.appendChild(el("h2", "zc-section__title", title));
      wrap.appendChild(head);
    }
    wrap.appendChild(body);
    return wrap;
  }

  function renderHero(data, usedKeys) {
    var primary = CONFIG.primary || {};
    var hero = el("header", "zc-hero zc-hero--" + (CONFIG.heroStyle || "cover"));
    var mediaSrc = null;
    if (primary.image && has(data[primary.image])) {
      mediaSrc = data[primary.image];
      usedKeys[primary.image] = "hero";
    } else if (primary.fallbackGallery && has(data[primary.fallbackGallery])) {
      var arr = asArray(data[primary.fallbackGallery]);
      var first = arr[0];
      mediaSrc = typeof first === "string" ? first : first && (first.url || first.src);
    }
    if (CONFIG.heroStyle !== "none" && mediaSrc) {
      var img = imageNode(mediaSrc, "zc-hero__media", "");
      if (img) hero.appendChild(img);
    }

    var textWrap = el("div", "zc-hero__text");
    if (primary.title && has(data[primary.title])) {
      textWrap.appendChild(el("h1", "zc-hero__title", String(data[primary.title])));
      usedKeys[primary.title] = "hero";
    }
    (primary.subtitle || []).forEach(function (key) {
      if (!has(data[key])) return;
      textWrap.appendChild(el("p", "zc-hero__subtitle", String(data[key])));
      usedKeys[key] = "hero";
    });
    (primary.badges || []).forEach(function (key) {
      var value = data[key];
      if (value === true || value === "true") {
        textWrap.appendChild(el("span", "zc-badge", lang() === "en" ? "Verified" : "موثّق"));
        usedKeys[key] = "hero";
      }
    });
    if (textWrap.childNodes.length) hero.appendChild(textWrap);
    return hero.childNodes.length ? hero : null;
  }

  function render(data) {
    var root = document.getElementById("zcard-root");
    if (!root) return;
    var payload = data || window.ZCARD_DATA || {};
    while (root.firstChild) root.removeChild(root.firstChild);

    var dir = CONFIG.direction === "ltr" ? "ltr" : "rtl";
    root.setAttribute("dir", dir);
    root.setAttribute("lang", dir === "rtl" ? "ar" : "en");
    root.className = "zc-root";

    var card = el("article", "zc-card");
    var usedKeys = {};
    var hero = renderHero(payload, usedKeys);
    if (hero) card.appendChild(hero);

    (CONFIG.sections || []).forEach(function (section) {
      var node = renderSection(section, payload, usedKeys);
      if (node) card.appendChild(node);
    });

    root.appendChild(card);
    return root;
  }

  window.ZCardTemplate = {
    id: CONFIG.id,
    cardType: CONFIG.cardType,
    schemaVersion: CONFIG.schemaVersion,
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
