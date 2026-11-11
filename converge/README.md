# Converge — Numerical Analysis

A complete interactive undergraduate numerical analysis website.

## Open it

Extract this ZIP, then open index.html in your browser. Keep index.html,
style.css, and app.js together in the same folder. No installation or build
step is needed. The downloaded HTML uses relative asset paths so it also
works directly from a folder; the deployed version uses root-relative paths.

Optionally, serve this directory using Python:

    python3 -m http.server 8000

Then visit http://localhost:8000 in your browser.

## Files and technologies

- index.html: page shell, metadata, favicon, and asset links.
- style.css: responsive layout, colors, typography, and control styling.
- app.js: all six chapters, numerical algorithms, SVG charts, interaction
  handlers, and answer checking. Uses plain JavaScript; no framework.

The only external visual dependency is Google Fonts (DM Sans and Libre
Caslon Display). If offline, the site falls back to system fonts. The
numerical experiments run entirely in your browser. Further-reading links
require internet access. Optional WebMCP tools are feature-detected; they
are not needed for normal use.

## Edit the course

Look for the chapters array near the beginning of app.js. Each entry contains
lesson text, a formula, a worked example, a practice question, and defaults.
The rootData, linearData, interpolationData, integrationData, odeData, and
errorData functions perform the calculations. The chart function draws SVG
graphs, and render builds the lesson interface.

To change the appearance, start with the color and font variables in :root
at the beginning of style.css. Responsive rules are at the end.

## Chapters

1. Errors and convergence
2. Root finding: bisection, Newton, and secant
3. Linear systems: Jacobi iteration
4. Polynomial interpolation: equally spaced and Chebyshev nodes
5. Numerical integration: trapezoidal and Simpson rules
6. Differential equations: Euler and Heun methods

## Hosting

Upload these three source files to any static website host. No server-side
application, API key, package manager, or database is required. This export
contains the website source only, without deployment credentials or internal
hosting configuration. Editing this copy does not update the hosted Site.

## Reading the code in VS Code

Open the whole converge folder using File > Open Folder. Included workspace
settings enable word wrap, use two-space indentation, and show a guide at
88 columns. Long URLs still exist in the font import and favicon, but they
will wrap visually instead of requiring horizontal scrolling.

The source has been formatted and commented for learning:

- app.js begins with a reading guide and has five labeled sections.
- Every named function has a comment explaining its purpose and inputs.
- Lesson text is split into short string pieces joined with +. Keep the
  spaces at the ends of those pieces so words do not run together.
- HTML inside JavaScript uses backticks and ${...} placeholders. These
  placeholders insert calculated values into the markup.
- Algorithm examples are arrays of lines joined with a newline.
- CSS has separate blocks for selectors and comments for page sections.

Useful JavaScript syntax used here:

- const: a binding that will not be reassigned.
- let: a variable that may be reassigned.
- {...state, ...change}: copy an object and apply updated properties.
- array.map(...): produce one output item for each input item.
- array.join(""): combine rendered fragments into one string.
- addEventListener: run a function when a user interacts with a control.
- document.getElementById: find an element in the browser page.
- innerHTML: replace an element’s HTML content.

The numerical behavior and course text match the original source. Formatting
adds whitespace to HTML templates, which can change insignificant text-node
spacing. No packages are required to run this version.
