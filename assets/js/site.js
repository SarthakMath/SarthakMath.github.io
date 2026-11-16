// =====================================================================
// SITE SETTINGS: shared by every page.
// The top bar (your name + menu) and the footer are built from SITE
// below, so change something here once and every page updates.
//
//   name      shown at the top left and in the footer
//   email     footer link (the "Email me" button is in index.html)
//   logo      leave '' for no logo; set e.g. 'assets/img/logo.svg'
//   github, arxiv, linkedin   footer links ('' hides LinkedIn)
//   scholar, orcid            shown in the home page "Contact" list
//                             (any address left as '' is simply not shown)
//   updated   the "Updated ..." text in the footer
//   pages     the menu, in order: [id, label shown, file]
//             To add a page: copy personal.html to a new file, change its
//             <body data-page="..."> to a new id, and add a line here.
// You should not need to edit anything below the SITE block.
// =====================================================================
const SITE = {
  name: 'Sarthak Sourav Dash',
  email: 'sarthak.dash@iitgn.ac.in',
  // Set to a file path such as 'assets/img/logo.svg' once you add your logo.
  logo: '',
  github: 'https://github.com/SarthakMath',
  arxiv: 'https://arxiv.org/abs/2609.16830',
  // Paste your LinkedIn profile address here to show the link in the footer.
  linkedin: 'https://www.linkedin.com/in/sarthak-sourav-dash-9a144218b/',
  // Paste your Google Scholar and ORCID profile addresses here if you have them.
  scholar: '',
  orcid: 'https://orcid.org/0009-0004-6126-8307',
  updated: 'November 2026',
  // First year of the copyright notice; later years are added automatically.
  since: 2026,
  pages: [
    ['research', 'Research', 'research.html'],
    ['experience', 'Experience', 'experience.html'],
    ['visualization', 'Math visualization', 'visualization.html'],
    ['resources', 'Resources', 'resources.html'],
    ['gallery', 'Gallery', 'gallery.html'],
    ['personal', 'Personal', 'personal.html'],
  ],
};

// ---- Builds the top bar, footer and photo placeholders (no need to edit) ----
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
    SITE.orcid ? `<a href="${SITE.orcid}">ORCID</a>` : '',
  ].filter(Boolean).join(' &nbsp; ');
  const year = new Date().getFullYear();
  const years = year > SITE.since ? `${SITE.since}–${year}` : `${SITE.since}`;
  const rights = `© ${years} ${SITE.name}. All rights reserved.`;
  const footer = document.createElement('footer');
  footer.className = 'site-footer';
  footer.innerHTML = `<div class="wrap"><span>${SITE.name}, Department of Mathematics, IIT Gandhinagar</span><span>${more}</span><span>Updated ${SITE.updated}</span><span class="rights">${rights}</span></div>`;
  document.body.append(footer);

  // The home page "Contact" list: one row per address that is filled in above.
  const contact = document.querySelector('[data-contact]');
  if (contact) {
    const tidy = (url) => url.replace(/^https?:\/\/(www\.)?/, '').replace(/\/$/, '');
    contact.innerHTML = [
      ['Email', `mailto:${SITE.email}`, SITE.email],
      ['GitHub', SITE.github, 'Code for this site and the interactive notes'],
      ['arXiv', SITE.arxiv, 'My preprint on algebraic flux correction'],
      ['LinkedIn', SITE.linkedin, 'Profile and work history'],
      ['Google Scholar', SITE.scholar, ''],
      ['ORCID', SITE.orcid, ''],
    ]
      .filter(([, href]) => href && href !== 'mailto:')
      .map(([label, href, note]) => `<li><span><a href="${href}">${label}</a><small>${note || tidy(href)}</small></span></li>`)
      .join('');
  }

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
