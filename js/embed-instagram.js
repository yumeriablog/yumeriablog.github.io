/**
 * Load Instagram embed.js and keep embeds centered in the reading column.
 */
(function () {
  function center() {
    document.querySelectorAll('.post-embed--instagram').forEach(function (wrap) {
      wrap.querySelectorAll('iframe, .instagram-media, .instagram-media-rendered').forEach(function (el) {
        el.style.marginLeft = 'auto';
        el.style.marginRight = 'auto';
        el.style.float = 'none';
        el.style.display = 'block';
      });
    });
  }

  function process() {
    function done() {
      center();
      setTimeout(center, 400);
      setTimeout(center, 1200);
    }

    if (window.instgrm && window.instgrm.Embeds) {
      window.instgrm.Embeds.process();
      done();
      return;
    }

    var s = document.createElement('script');
    s.src = 'https://www.instagram.com/embed.js';
    s.async = true;
    s.onload = function () {
      if (window.instgrm && window.instgrm.Embeds) {
        window.instgrm.Embeds.process();
      }
      done();
    };
    document.body.appendChild(s);
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', process);
  } else {
    process();
  }
})();
