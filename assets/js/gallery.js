(function () {
  const grid = document.getElementById('gallery');
  if (!grid) return;
  if (!GALLERY.length) {
    const hints = ['Conferences and workshops', 'Talks and seminars', 'IIT Gandhinagar', 'IISER Bhopal', 'Travel', 'Everything else'];
    grid.innerHTML = hints.map((h) => `<figure><div class="slot">${h}</div></figure>`).join('');
    document.getElementById('galleryEmpty').hidden = false;
    return;
  }
  const box = document.getElementById('lightbox');
  grid.innerHTML = GALLERY.map((g, i) =>
    `<figure><button type="button" data-i="${i}" aria-label="Enlarge: ${g.caption || g.alt || 'photo'}"><img loading="lazy" src="assets/img/gallery/${g.file}" alt="${g.alt || ''}"></button>${g.caption ? `<figcaption>${g.caption}</figcaption>` : ''}</figure>`).join('');
  grid.addEventListener('click', (e) => {
    const b = e.target.closest('button[data-i]'); if (!b) return;
    const g = GALLERY[+b.dataset.i];
    box.querySelector('img').src = 'assets/img/gallery/' + g.file;
    box.querySelector('img').alt = g.alt || '';
    box.querySelector('span').textContent = g.caption || '';
    box.showModal();
  });
  box.addEventListener('click', (e) => { if (e.target === box || e.target.closest('button')) box.close(); });
})();
