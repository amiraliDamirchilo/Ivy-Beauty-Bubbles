(function () {
  "use strict";

  var WA = "971527434416";
  var root = document.documentElement;

  /* ---------- Storage (wrapped: can be blocked in private windows) ---------- */
  function getPref(k) { try { return window.localStorage.getItem(k); } catch (e) { return null; } }
  function setPref(k, v) { try { window.localStorage.setItem(k, v); } catch (e) {} }

  /* ---------- Language: English <-> Arabic ---------- */
  var nodes = Array.prototype.slice.call(document.querySelectorAll("[data-ar]"));
  var phNodes = Array.prototype.slice.call(document.querySelectorAll("[data-ar-placeholder]"));
  var lblNodes = Array.prototype.slice.call(document.querySelectorAll("[data-ar-label]"));
  nodes.forEach(function (n) { n.setAttribute("data-en", n.innerHTML); });
  phNodes.forEach(function (n) { n.setAttribute("data-en-placeholder", n.getAttribute("placeholder") || ""); });
  lblNodes.forEach(function (n) { n.setAttribute("data-en-label", n.getAttribute("aria-label") || ""); });
  var titleEl = document.querySelector("title");
  var titleEn = titleEl ? titleEl.textContent : "";
  var titleAr = titleEl ? titleEl.getAttribute("data-title-ar") : "";

  function setLang(lang, save) {
    var ar = lang === "ar";
    root.setAttribute("lang", ar ? "ar" : "en");
    root.setAttribute("dir", ar ? "rtl" : "ltr");
    nodes.forEach(function (n) { n.innerHTML = ar ? n.getAttribute("data-ar") : n.getAttribute("data-en"); });
    phNodes.forEach(function (n) { n.setAttribute("placeholder", ar ? n.getAttribute("data-ar-placeholder") : n.getAttribute("data-en-placeholder")); });
    lblNodes.forEach(function (n) { n.setAttribute("aria-label", ar ? n.getAttribute("data-ar-label") : n.getAttribute("data-en-label")); });
    if (titleEl && titleAr) titleEl.textContent = ar ? titleAr : titleEn;
    document.querySelectorAll(".lang-toggle button").forEach(function (b) {
      b.setAttribute("aria-pressed", String(b.getAttribute("data-lang") === lang));
    });
    if (save) setPref("ivy-lang", lang);
    document.dispatchEvent(new CustomEvent("langchange", { detail: lang }));
  }
  document.querySelectorAll(".lang-toggle button").forEach(function (b) {
    b.addEventListener("click", function () { setLang(b.getAttribute("data-lang"), true); });
  });
  var qs = new URLSearchParams(location.search).get("lang");
  var initial = qs === "ar" || qs === "en" ? qs : (getPref("ivy-lang") || "en");
  setLang(initial, !!qs);
  function lang() { return root.getAttribute("lang"); }

  /* ---------- Header ---------- */
  var header = document.querySelector(".site-header");
  function onScroll() { if (header) header.classList.toggle("is-scrolled", window.scrollY > 8); }
  window.addEventListener("scroll", onScroll, { passive: true }); onScroll();

  var menuBtn = document.querySelector(".menu-btn");
  if (menuBtn) {
    menuBtn.addEventListener("click", function () {
      var open = document.body.classList.toggle("menu-open");
      menuBtn.setAttribute("aria-expanded", String(open));
    });
    document.querySelectorAll(".nav a").forEach(function (a) {
      a.addEventListener("click", function () { document.body.classList.remove("menu-open"); menuBtn.setAttribute("aria-expanded", "false"); });
    });
    document.addEventListener("keydown", function (e) {
      if (e.key === "Escape" && document.body.classList.contains("menu-open")) { document.body.classList.remove("menu-open"); menuBtn.setAttribute("aria-expanded", "false"); menuBtn.focus(); }
    });
  }

  /* ---------- Open now (Dubai time, 9:00 to 24:00 daily) ---------- */
  function dubaiNow() {
    var parts = new Intl.DateTimeFormat("en-GB", { timeZone: "Asia/Dubai", hour: "2-digit", minute: "2-digit", weekday: "short", hour12: false }).formatToParts(new Date());
    var o = {}; parts.forEach(function (p) { o[p.type] = p.value; });
    return { h: parseInt(o.hour, 10) % 24, wd: o.weekday };
  }
  function paintOpen() {
    var now = dubaiNow();
    var open = now.h >= 9;
    document.querySelectorAll(".open-now").forEach(function (el) {
      el.classList.toggle("is-closed", !open);
      var ar = lang() === "ar";
      el.textContent = open
        ? (ar ? "مفتوح الآن حتى منتصف الليل" : "Open now, until midnight")
        : (ar ? "مغلق الآن، نفتح الساعة 9 صباحاً" : "Closed now, opens at 9am");
    });
    var map = { Sun: 0, Mon: 1, Tue: 2, Wed: 3, Thu: 4, Fri: 5, Sat: 6 };
    document.querySelectorAll(".hours tr").forEach(function (tr) {
      tr.classList.toggle("is-today", Number(tr.getAttribute("data-day")) === map[now.wd]);
    });
  }
  paintOpen();
  document.addEventListener("langchange", paintOpen);

  /* ---------- Before / after ---------- */
  document.querySelectorAll(".ba").forEach(function (ba) {
    var range = ba.querySelector("input[type=range]");
    if (!range) return;
    function upd() {
      var v = Number(range.value);
      if (root.getAttribute("dir") === "rtl") v = 100 - v;
      ba.style.setProperty("--pos", v + "%");
    }
    range.addEventListener("input", upd);
    document.addEventListener("langchange", upd);
    upd();
  });
  document.querySelectorAll(".ba-tabs").forEach(function (tabs) {
    var ba = document.getElementById(tabs.getAttribute("data-for"));
    tabs.querySelectorAll("button").forEach(function (b) {
      b.addEventListener("click", function () {
        tabs.querySelectorAll("button").forEach(function (x) { x.setAttribute("aria-pressed", "false"); });
        b.setAttribute("aria-pressed", "true");
        var url = "url('" + b.getAttribute("data-img") + "')";
        ba.querySelectorAll(".ba__img").forEach(function (l) { l.style.backgroundImage = url; });
        var r = ba.querySelector("input"); r.value = 50; r.dispatchEvent(new Event("input"));
      });
    });
  });

  /* ---------- Filters (gallery + reviews) ---------- */
  document.querySelectorAll("[data-filter-group]").forEach(function (group) {
    var target = document.getElementById(group.getAttribute("data-filter-group"));
    group.querySelectorAll("button").forEach(function (b) {
      b.addEventListener("click", function () {
        group.querySelectorAll("button").forEach(function (x) { x.setAttribute("aria-pressed", "false"); });
        b.setAttribute("aria-pressed", "true");
        var f = b.getAttribute("data-filter");
        target.querySelectorAll("[data-tags]").forEach(function (item) {
          var show = f === "all" || item.getAttribute("data-tags").split(" ").indexOf(f) > -1;
          item.classList.toggle("is-hidden", !show);
        });
      });
    });
  });

  /* ---------- Lightbox ---------- */
  var lb = document.querySelector(".lightbox");
  if (lb) {
    var lbImg = lb.querySelector("img");
    var items = [], idx = 0, lastFocus = null;
    function visible() { return Array.prototype.slice.call(document.querySelectorAll(".g-item:not(.is-hidden)")); }
    function show(i) {
      items = visible(); idx = (i + items.length) % items.length;
      var it = items[idx];
      lbImg.src = it.getAttribute("data-full");
      lbImg.alt = it.querySelector("img").alt;
    }
    document.querySelectorAll(".g-item").forEach(function (it) {
      it.addEventListener("click", function () {
        lastFocus = it; show(visible().indexOf(it));
        lb.classList.add("is-open"); lb.querySelector(".lb-close").focus();
        document.body.style.overflow = "hidden";
      });
    });
    function close() { lb.classList.remove("is-open"); document.body.style.overflow = ""; if (lastFocus) lastFocus.focus(); }
    lb.querySelector(".lb-close").addEventListener("click", close);
    lb.querySelector(".lb-prev").addEventListener("click", function () { show(idx - 1); });
    lb.querySelector(".lb-next").addEventListener("click", function () { show(idx + 1); });
    lb.addEventListener("click", function (e) { if (e.target === lb) close(); });
    document.addEventListener("keydown", function (e) {
      if (!lb.classList.contains("is-open")) return;
      var rtl = root.getAttribute("dir") === "rtl";
      if (e.key === "Escape") close();
      if (e.key === "ArrowRight") show(idx + (rtl ? -1 : 1));
      if (e.key === "ArrowLeft") show(idx + (rtl ? 1 : -1));
    });
  }

  /* ---------- Booking request -> WhatsApp ---------- */
  var form = document.getElementById("book-form");
  if (form) {
    var dateIn = form.querySelector("#b-date");
    if (dateIn) {
      var d = new Date(); var iso = new Date(d.getTime() - d.getTimezoneOffset() * 60000).toISOString().slice(0, 10);
      dateIn.min = iso;
    }
    var pre = new URLSearchParams(location.search).get("service");
    if (pre) { var box = form.querySelector('input[name=service][data-key="' + pre + '"]'); if (box) box.checked = true; }

    form.addEventListener("submit", function (e) {
      e.preventDefault();
      var ar = lang() === "ar";
      var name = form.querySelector("#b-name");
      var err = form.querySelector("#b-name-err");
      if (!name.value.trim()) {
        err.textContent = ar ? "يرجى كتابة الاسم حتى نعرف بمن نرحّب." : "Add your name so we know who to welcome.";
        name.focus(); return;
      }
      err.textContent = "";
      var services = Array.prototype.slice.call(form.querySelectorAll("input[name=service]:checked")).map(function (c) {
        return ar ? c.getAttribute("data-ar-value") : c.value;
      });
      var lines = ar
        ? ["مرحباً Ivy Beauty & Bubbles، أود حجز موعد في فرع شيراتون جراند.",
           "الاسم: " + name.value.trim(),
           services.length ? "الخدمة: " + services.join("، ") : "",
           form.querySelector("#b-date").value ? "التاريخ: " + form.querySelector("#b-date").value : "",
           form.querySelector("#b-time").value ? "الوقت المفضل: " + form.querySelector("#b-time").selectedOptions[0].text : "",
           form.querySelector("#b-stylist").value.trim() ? "المصفف/ة: " + form.querySelector("#b-stylist").value.trim() : "",
           form.querySelector("#b-notes").value.trim() ? "ملاحظات: " + form.querySelector("#b-notes").value.trim() : ""]
        : ["Hi Ivy Beauty & Bubbles, I'd like to book at the Sheraton Grand salon.",
           "Name: " + name.value.trim(),
           services.length ? "Service: " + services.join(", ") : "",
           form.querySelector("#b-date").value ? "Date: " + form.querySelector("#b-date").value : "",
           form.querySelector("#b-time").value ? "Preferred time: " + form.querySelector("#b-time").selectedOptions[0].text : "",
           form.querySelector("#b-stylist").value.trim() ? "Stylist: " + form.querySelector("#b-stylist").value.trim() : "",
           form.querySelector("#b-notes").value.trim() ? "Notes: " + form.querySelector("#b-notes").value.trim() : ""];
      var text = lines.filter(Boolean).join("\n");
      window.open("https://wa.me/" + WA + "?text=" + encodeURIComponent(text), "_blank", "noopener");
    });
  }

  /* ---------- Year ---------- */
  document.querySelectorAll("[data-year]").forEach(function (y) { y.textContent = new Date().getFullYear(); });
})();
