(function () {
  var overlay = null;
  var img = null;
  var captionEl = null;
  var prevBtn = null;
  var nextBtn = null;
  var currentTrigger = null;
  var triggers = [];

  function showAt(trigger) {
    if (!overlay || !trigger) return;
    currentTrigger = trigger;
    var href = trigger.getAttribute('href') || trigger.getAttribute('data-src') || '';
    if (!href && trigger.tagName === 'IMG') href = trigger.currentSrc || trigger.src;
    var fig = trigger.closest('figure');
    var cap = fig ? fig.querySelector('figcaption') : null;
    var alt = trigger.querySelector ? (trigger.querySelector('img') || {}).alt : trigger.alt;
    img.src = href;
    captionEl.textContent = (cap && cap.textContent) || alt || '';
    prevBtn.style.display = triggers.length > 1 ? '' : 'none';
    nextBtn.style.display = triggers.length > 1 ? '' : 'none';
    overlay.classList.remove('lightbox-hidden');
    document.body.style.overflow = 'hidden';
  }

  function hide() {
    if (!overlay) return;
    overlay.classList.add('lightbox-hidden');
    document.body.style.overflow = '';
    img.src = '';
  }

  function navigate(dir) {
    if (!triggers.length || !currentTrigger) return;
    var idx = triggers.indexOf(currentTrigger);
    if (idx < 0) idx = 0;
    var next = (idx + dir + triggers.length) % triggers.length;
    showAt(triggers[next]);
  }

  function collectGallery(trigger) {
    var g = trigger.getAttribute('data-gallery');
    if (g) {
      return Array.from(document.querySelectorAll('a.lightbox-trigger[data-gallery="' + g + '"], a.image-link[data-gallery="' + g + '"]'));
    }
    var gallery = trigger.closest('.gallery, .post-gallery');
    if (gallery) {
      return Array.from(gallery.querySelectorAll('a.lightbox-trigger, a.image-link'));
    }
    return [trigger];
  }

  function init() {
    overlay = document.createElement('div');
    overlay.className = 'lightbox-overlay lightbox-hidden';
    overlay.setAttribute('role', 'dialog');
    overlay.setAttribute('aria-modal', 'true');
    overlay.innerHTML =
      '<div class="lightbox-backdrop"></div>' +
      '<div class="lightbox-content">' +
        '<button type="button" class="lightbox-close" aria-label="Close">&times;</button>' +
        '<button type="button" class="lightbox-prev" aria-label="Previous">&lsaquo;</button>' +
        '<img class="lightbox-img" alt="" />' +
        '<button type="button" class="lightbox-next" aria-label="Next">&rsaquo;</button>' +
        '<p class="lightbox-caption"></p>' +
      '</div>';
    document.body.appendChild(overlay);

    img = overlay.querySelector('.lightbox-img');
    captionEl = overlay.querySelector('.lightbox-caption');
    prevBtn = overlay.querySelector('.lightbox-prev');
    nextBtn = overlay.querySelector('.lightbox-next');

    overlay.querySelector('.lightbox-backdrop').addEventListener('click', hide);
    overlay.querySelector('.lightbox-close').addEventListener('click', hide);
    prevBtn.addEventListener('click', function (e) { e.stopPropagation(); navigate(-1); });
    nextBtn.addEventListener('click', function (e) { e.stopPropagation(); navigate(1); });

    document.addEventListener('keydown', function (e) {
      if (overlay.classList.contains('lightbox-hidden')) return;
      if (e.key === 'Escape') hide();
      if (e.key === 'ArrowLeft') navigate(-1);
      if (e.key === 'ArrowRight') navigate(1);
    });

    document.addEventListener('click', function (e) {
      var t = e.target.closest('a.lightbox-trigger, a.image-link');
      if (t && t.closest('.post-content, .post-cover')) {
        e.preventDefault();
        triggers = collectGallery(t);
        showAt(t);
        return;
      }

      /* Bare content images not yet wrapped */
      var im = e.target.closest('.post-content img');
      if (im && !im.closest('a.lightbox-trigger, a.image-link') && !im.closest('.lightbox-overlay')) {
        e.preventDefault();
        triggers = [im];
        currentTrigger = im;
        img.src = im.currentSrc || im.src;
        captionEl.textContent = im.alt || '';
        prevBtn.style.display = 'none';
        nextBtn.style.display = 'none';
        overlay.classList.remove('lightbox-hidden');
        document.body.style.overflow = 'hidden';
      }
    });
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();
