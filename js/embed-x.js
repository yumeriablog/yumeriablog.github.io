/**
 * Load X/Twitter widgets and force-center them in .post-embed--x shells.
 */
(function () {
  function themeFor(wrap) {
    var pref = (wrap && wrap.getAttribute('data-embed-theme')) || 'auto';
    if (pref === 'light' || pref === 'dark') return pref;
    if (document.body.classList.contains('theme-dark')) return 'dark';
    if (document.body.classList.contains('theme-light')) return 'light';
    return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
  }

  function centerAll() {
    document.querySelectorAll('.post-embed--x').forEach(function (wrap) {
      wrap.style.display = 'flex';
      wrap.style.flexDirection = 'column';
      wrap.style.alignItems = 'center';
      wrap.style.width = '100%';
      wrap.style.textAlign = 'center';

      Array.prototype.forEach.call(wrap.children, function (child) {
        child.style.marginLeft = 'auto';
        child.style.marginRight = 'auto';
        child.style.float = 'none';
      });

      wrap.querySelectorAll('iframe, twitter-widget').forEach(function (el) {
        el.style.marginLeft = 'auto';
        el.style.marginRight = 'auto';
        el.style.float = 'none';
        el.style.position = 'relative';
        el.style.left = 'auto';
        el.style.right = 'auto';
        el.style.maxWidth = '100%';
        if (el.tagName === 'IFRAME') {
          el.style.display = 'block';
        }
      });
    });
  }

  function prepare() {
    document.querySelectorAll('.post-embed--x').forEach(function (wrap) {
      var t = themeFor(wrap);
      wrap.querySelectorAll('.twitter-tweet').forEach(function (bq) {
        bq.setAttribute('data-theme', t);
        bq.setAttribute('data-dnt', 'true');
      });
    });
  }

  function boot() {
    prepare();
    centerAll();

    function after() {
      centerAll();
      [200, 600, 1500, 3000].forEach(function (ms) {
        setTimeout(centerAll, ms);
      });
    }

    function startWidgets(twttr) {
      if (!twttr || !twttr.widgets) {
        after();
        return;
      }
      var p = twttr.widgets.load(document.body);
      if (p && typeof p.then === 'function') {
        p.then(after).catch(after);
      } else {
        after();
      }
    }

    if (window.twttr && window.twttr.widgets) {
      startWidgets(window.twttr);
      return;
    }

    window.twttr = (function (d, s, id) {
      var js,
        fjs = d.getElementsByTagName(s)[0],
        t = window.twttr || {};
      if (d.getElementById(id)) return t;
      js = d.createElement(s);
      js.id = id;
      js.src = 'https://platform.twitter.com/widgets.js';
      js.async = true;
      fjs.parentNode.insertBefore(js, fjs);
      t._e = [];
      t.ready = function (f) {
        t._e.push(f);
      };
      return t;
    })(document, 'script', 'twitter-wjs');

    window.twttr.ready(function (twttr) {
      startWidgets(twttr);
    });
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', boot);
  } else {
    boot();
  }
})();
