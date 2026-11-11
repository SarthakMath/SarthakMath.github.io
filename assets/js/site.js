// Shared header, footer and image slots for every page.
// Edit SITE once and every page updates.
const SITE = {
  name: 'Sarthak Sourav Dash',
  email: 'sarthak.dash@iitgn.ac.in',
  // Set to a file path such as 'assets/img/logo.svg' once you add your logo.
  logo: '',
  github: 'https://github.com/SarthakMath',
  arxiv: 'https://arxiv.org/abs/2609.16830',
  // Paste your LinkedIn profile address here to show the link in the footer.
  linkedin: '',
  updated: 'November 2026',
  pages: [
    ['research', 'Research', 'research.html'],
    ['experience', 'Experience', 'experience.html'],
    ['visualization', 'Math visualization', 'visualization.html'],
    ['gallery', 'Gallery', 'gallery.html'],
    ['personal', 'Personal', 'personal.html'],
  ],
};

(function () {
  const current = document.body.dataset.page;
  const nav = SITE.pages
    .map(([id, label, href]) => `<a href="${href}"${id === current ? ' aria-current="page"' : ''}>${label}</a>`)
    .join('');
  const logo = SITE.logo ? `<img src="${SITE.logo}" alt="">` : '';
  const header = document.createElement('header');
  header.className = 'site-header';
  header.innerHTML = `<div class="wrap"><a class="site-name" href="index.html">${logo}<span>${SITE.name}</span></a><nav class="site-nav" aria-label="Main">${nav}</nav></div>`;
  document.body.prepend(header);

  const more = [
    `<a href="mailto:${SITE.email}">${SITE.email}</a>`,
    `<a href="${SITE.arxiv}">arXiv</a>`,
    `<a href="${SITE.github}">GitHub</a>`,
    SITE.linkedin ? `<a href="${SITE.linkedin}">LinkedIn</a>` : '',
  ].filter(Boolean).join(' &nbsp; ');
  const footer = document.createElement('footer');
  footer.className = 'site-footer';
  footer.innerHTML = `<div class="wrap"><span>${SITE.name}, Department of Mathematics, IIT Gandhinagar</span><span>${more}</span><span>Updated ${SITE.updated}</span></div>`;
  document.body.append(footer);

  // An <img data-slot="..."> whose file is missing becomes a labelled placeholder.
  document.querySelectorAll('img[data-slot]').forEach((img) => {
    const swap = () => {
      const slot = document.createElement('div');
      slot.className = 'slot ' + img.className;
      slot.textContent = img.dataset.slot;
      img.replaceWith(slot);
    };
    if (img.complete && img.naturalWidth === 0) swap();
    else img.addEventListener('error', swap, { once: true });
  });
})();
