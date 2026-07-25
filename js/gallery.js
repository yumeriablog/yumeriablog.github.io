/**
 * Stack-inspired auto gallery:
 * consecutive images alone in a paragraph become a flex gallery row.
 */
(function () {
  function flexFromImg(img) {
    var w = parseInt(img.getAttribute('width'), 10);
    var h = parseInt(img.getAttribute('height'), 10);
    if (w && h && h > 0) {
      return {
        grow: String((w / h).toFixed(3)),
        basis: Math.round((w / h) * 220) + 'px'
      };
    }
    /* Unknown size — equal flex share */
    return { grow: '1', basis: '0' };
  }

  function makeFigure(img, galleryId, solo) {
    var figure = document.createElement('figure');
    figure.className = 'gallery-image' + (solo ? ' gallery-image--solo' : '');

    if (!solo) {
      var flex = flexFromImg(img);
      figure.style.flexGrow = flex.grow;
      figure.style.flexBasis = flex.basis;
    }

    var a = document.createElement('a');
    a.href = img.currentSrc || img.src;
    a.className = 'image-link lightbox-trigger';
    a.setAttribute('data-gallery', galleryId);
    a.setAttribute('rel', 'noopener');

    /* Move image into the link */
    a.appendChild(img);

    figure.appendChild(a);

    var captionText =
      img.getAttribute('data-caption') ||
      img.getAttribute('title') ||
      '';
    /* Solo images: show caption when title set; multi: keep captions for lightbox only */
    if (captionText) {
      var cap = document.createElement('figcaption');
      cap.textContent = captionText;
      figure.appendChild(cap);
    }

    return figure;
  }

  function isImageOnlyParagraph(p) {
    if (!p || p.tagName !== 'P') return false;
    /* No meaningful text besides image alts (alts live on attributes) */
    var clone = p.cloneNode(true);
    clone.querySelectorAll('img').forEach(function (n) { n.remove(); });
    return clone.textContent.replace(/\s+/g, '') === '' && p.querySelectorAll('img').length > 0;
  }

  function processContainer(container) {
    if (!container || container.dataset.galleryProcessed === '1') return;
    container.dataset.galleryProcessed = '1';

    var paragraphs = Array.prototype.slice.call(container.querySelectorAll('p'));
    paragraphs.forEach(function (p) {
      if (!isImageOnlyParagraph(p)) return;

      var imgs = Array.prototype.slice.call(p.querySelectorAll('img.gallery-image, img'));
      if (!imgs.length) return;

      var gallery = document.createElement('div');
      var solo = imgs.length === 1;
      gallery.className = solo ? 'gallery gallery--solo' : 'gallery';
      var gid = 'gallery-' + Math.random().toString(36).slice(2, 9);
      gallery.setAttribute('data-gallery', gid);

      imgs.forEach(function (img) {
        gallery.appendChild(makeFigure(img, gid, solo));
      });

      p.parentNode.replaceChild(gallery, p);
    });

    /* Explicit {{< gallery >}} shortcode: promote images to figures */
    container.querySelectorAll('.post-gallery').forEach(function (g) {
      if (g.querySelector('figure.gallery-image')) return;
      var gid = g.getAttribute('data-gallery') || ('gallery-' + Math.random().toString(36).slice(2, 9));
      g.setAttribute('data-gallery', gid);
      g.classList.add('gallery');
      var imgs = Array.prototype.slice.call(g.querySelectorAll('img'));
      var solo = imgs.length === 1;
      if (solo) g.classList.add('gallery--solo');
      imgs.forEach(function (img) {
        g.appendChild(makeFigure(img, gid, solo));
      });
      /* Remove leftover empty wrappers */
      g.querySelectorAll('p').forEach(function (p) {
        if (!p.querySelector('img') && p.textContent.trim() === '') p.remove();
      });
    });
  }

  function init() {
    document.querySelectorAll('.post-content').forEach(processContainer);
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();
