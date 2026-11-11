# Personal website of Sarthak Sourav Dash

A static site: plain HTML, CSS and JavaScript. There is no build step.

## Preview on your computer

```bash
python3 -m http.server 8000
```

Then open http://127.0.0.1:8000.

## Publish on GitHub Pages

1. On GitHub, create a public repository named `SarthakMath.github.io` (leave README, licence and .gitignore unchecked).
2. In this folder:

   ```bash
   git init
   git add .
   git commit -m "Personal website"
   git branch -M main
   git remote add origin https://github.com/SarthakMath/SarthakMath.github.io.git
   git push -u origin main
   ```

3. In the repository open **Settings → Pages** and set **Source** to **Deploy from a branch**, branch `main`, folder `/ (root)`.

The site appears at https://sarthakmath.github.io/ within a minute or two. Every later push updates it.
Because the CDR lab is published from the `CDR_visualizer` repository of the same account, it lives at
https://sarthakmath.github.io/CDR_visualizer/ and the two read as one site.

## Where things are

| To change | Edit |
| --- | --- |
| Name, email, logo, LinkedIn, navigation, footer | `assets/js/site.js` (the `SITE` block at the top) |
| Colours and type | `assets/css/style.css` (the `:root` block at the top) |
| Page text | the `.html` file of that page |
| Gallery photos | add files to `assets/img/gallery/`, list them in `assets/js/gallery-data.js` |
| Home page figure | `assets/js/layers.js` |
| Converge course | `converge/` (its own `index.html`, `style.css`, `app.js`; served at /converge/) |

## Pictures to add

| File | Appears |
| --- | --- |
| `assets/img/portrait.jpg` | Home page, About (portrait, about 4:5) |
| `assets/img/personal.jpg` | Personal page (about 4:5) |
| `assets/img/logo.svg` or `.png` | Header. Then set `logo: 'assets/img/logo.svg'` in `assets/js/site.js` |
| `assets/img/gallery/*` | Gallery page |

Until a picture exists, the page shows a dashed frame saying which file it expects.
Text with a red bar on the left is a draft note for you to replace.
