/**
 * yume client-side search — loads /index.json, ranks by title → terms → body.
 * Results reuse the theme’s hero post-title markup (first word + rest).
 */
(function () {
  "use strict";

  var root = document.getElementById("search-root");
  if (!root) return;

  var input = document.getElementById("search-input");
  var statusEl = document.getElementById("search-status");
  var listEl = document.getElementById("search-results");
  var form = document.getElementById("search-form");
  if (!input || !statusEl || !listEl) return;

  var indexUrl = root.getAttribute("data-index") || "index.json";
  var titlePeriod = root.getAttribute("data-title-period") !== "false";
  var i18n = {
    idle: root.getAttribute("data-i18n-idle") || "Start typing to find a post.",
    loading: root.getAttribute("data-i18n-loading") || "Loading…",
    empty: root.getAttribute("data-i18n-empty") || "Nothing matched.",
    error: root.getAttribute("data-i18n-error") || "Search is unavailable.",
    one: root.getAttribute("data-i18n-one") || "1 post",
    other: root.getAttribute("data-i18n-other") || "99 posts",
  };

  var docs = null;
  var loadError = false;
  var debounceTimer = null;
  var DEBOUNCE_MS = 140;

  function ensurePeriod(title) {
    if (!titlePeriod || !title) return title || "";
    if (/\.\s*$/.test(title) || /\.\.\.$/.test(title)) return title;
    return title + ".";
  }

  function splitTitle(title) {
    var t = ensurePeriod(title).trim();
    var parts = t.split(/\s+/);
    var first = parts[0] || "";
    var rest = parts.slice(1).join(" ");
    return { first: first, rest: rest };
  }

  function escapeHtml(s) {
    return String(s)
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;");
  }

  function resultCountLabel(n) {
    if (n === 1) return i18n.one;
    return String(i18n.other).replace(/__N__/g, String(n));
  }

  function setStatus(text) {
    statusEl.textContent = text || "";
  }

  function clearResults() {
    listEl.innerHTML = "";
  }

  function renderResults(items) {
    clearResults();
    if (!items.length) return;

    var frag = document.createDocumentFragment();
    for (var i = 0; i < items.length; i++) {
      var item = items[i];
      var parts = splitTitle(item.title);
      var li = document.createElement("li");
      var a = document.createElement("a");
      a.className = "post-title";
      a.href = item.permalink;

      var first = document.createElement("span");
      first.className = "post-title-first";
      first.textContent = parts.first;
      a.appendChild(first);

      if (parts.rest) {
        a.appendChild(document.createTextNode(" "));
        var rest = document.createElement("span");
        rest.className = "post-title-rest";
        rest.textContent = parts.rest;
        a.appendChild(rest);
      }

      li.appendChild(a);
      frag.appendChild(li);
    }
    listEl.appendChild(frag);
  }

  function tokenize(q) {
    return String(q || "")
      .toLowerCase()
      .trim()
      .split(/[\s/|,;:]+/)
      .filter(function (t) {
        return t.length > 0;
      });
  }

  function fieldHas(hay, term) {
    return hay.indexOf(term) !== -1;
  }

  function scoreDoc(doc, terms) {
    if (!terms.length) return 0;

    var title = (doc.title || "").toLowerCase();
    var summary = (doc.summary || "").toLowerCase();
    var content = (doc.content || "").toLowerCase();
    var tags = (doc.tags || []).join(" ").toLowerCase();
    var cats = (doc.categories || []).join(" ").toLowerCase();
    var section = (doc.section || "").toLowerCase();

    var score = 0;
    for (var i = 0; i < terms.length; i++) {
      var t = terms[i];
      var hit = false;

      if (fieldHas(title, t)) {
        hit = true;
        score += 24;
        if (title.indexOf(t) === 0) score += 8;
        if (title === t || title === t + ".") score += 12;
      }
      if (fieldHas(tags, t)) {
        hit = true;
        score += 14;
      }
      if (fieldHas(cats, t)) {
        hit = true;
        score += 12;
      }
      if (fieldHas(section, t)) {
        hit = true;
        score += 4;
      }
      if (fieldHas(summary, t)) {
        hit = true;
        score += 6;
      }
      if (fieldHas(content, t)) {
        hit = true;
        score += 2;
      }

      // AND: every term must match somewhere
      if (!hit) return 0;
    }
    return score;
  }

  function search(query) {
    var terms = tokenize(query);
    if (!terms.length) {
      clearResults();
      setStatus(i18n.idle);
      root.classList.remove("is-searching", "has-results", "no-results");
      return;
    }

    root.classList.add("is-searching");
    var ranked = [];
    for (var i = 0; i < docs.length; i++) {
      var s = scoreDoc(docs[i], terms);
      if (s > 0) ranked.push({ doc: docs[i], score: s });
    }
    ranked.sort(function (a, b) {
      if (b.score !== a.score) return b.score - a.score;
      return (a.doc.title || "").localeCompare(b.doc.title || "");
    });

    var items = ranked.map(function (r) {
      return r.doc;
    });
    renderResults(items);

    if (items.length) {
      root.classList.add("has-results");
      root.classList.remove("no-results");
      setStatus(resultCountLabel(items.length));
    } else {
      root.classList.add("no-results");
      root.classList.remove("has-results");
      setStatus(i18n.empty);
    }
  }

  function readQueryFromUrl() {
    try {
      var params = new URLSearchParams(window.location.search);
      return params.get("q") || "";
    } catch (e) {
      return "";
    }
  }

  function writeQueryToUrl(q) {
    try {
      var url = new URL(window.location.href);
      if (q && q.trim()) url.searchParams.set("q", q.trim());
      else url.searchParams.delete("q");
      window.history.replaceState({}, "", url.pathname + url.search + url.hash);
    } catch (e) {
      /* ignore */
    }
  }

  function onInput() {
    var q = input.value;
    writeQueryToUrl(q);
    if (!docs) return;
    search(q);
  }

  function scheduleSearch() {
    if (debounceTimer) clearTimeout(debounceTimer);
    debounceTimer = setTimeout(onInput, DEBOUNCE_MS);
  }

  if (form) {
    form.addEventListener("submit", function (e) {
      e.preventDefault();
      if (debounceTimer) clearTimeout(debounceTimer);
      onInput();
    });
  }

  input.addEventListener("input", scheduleSearch);
  input.addEventListener("search", function () {
    // native clear (x) on type=search
    if (debounceTimer) clearTimeout(debounceTimer);
    onInput();
  });

  setStatus(i18n.loading);

  fetch(indexUrl, { credentials: "same-origin" })
    .then(function (res) {
      if (!res.ok) throw new Error("index " + res.status);
      return res.json();
    })
    .then(function (data) {
      docs = Array.isArray(data) ? data : [];
      loadError = false;
      var initial = readQueryFromUrl();
      if (initial) {
        input.value = initial;
        search(initial);
      } else {
        setStatus(i18n.idle);
      }
      // Prefer focusing the field once ready (skip if user already tabbed away)
      if (document.activeElement === document.body || document.activeElement === input) {
        try {
          input.focus({ preventScroll: true });
        } catch (e) {
          input.focus();
        }
      }
    })
    .catch(function () {
      loadError = true;
      docs = [];
      setStatus(i18n.error);
    });
})();
