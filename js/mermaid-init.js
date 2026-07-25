(function () {
  function loadMermaid() {
    var nodes = document.querySelectorAll('.post-content .mermaid');
    if (!nodes.length) return;

    var s = document.createElement('script');
    s.src = 'https://cdn.jsdelivr.net/npm/mermaid@11/dist/mermaid.min.js';
    s.onload = function () {
      var dark =
        document.body.classList.contains('theme-dark') ||
        (document.body.classList.contains('theme-auto') &&
          window.matchMedia('(prefers-color-scheme: dark)').matches);
      window.mermaid.initialize({
        startOnLoad: false,
        theme: dark ? 'dark' : 'neutral',
        securityLevel: 'loose',
        fontFamily: 'Outfit, Inter, sans-serif'
      });
      window.mermaid.run({ nodes: nodes });
    };
    document.head.appendChild(s);
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', loadMermaid);
  } else {
    loadMermaid();
  }
})();
