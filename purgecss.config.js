/**
 * PurgeCSS config for agency.css
 *
 * Run after a Jekyll build:
 *   bundle exec jekyll build
 *   npx purgecss --config purgecss.config.js
 *
 * Output lands in _site/assets/css/ — commit if you want to serve it statically.
 * NOTE: agency.css is compiled by Jekyll from agency.scss, so changes here
 * don't affect the live build on GitHub Pages. Use this to audit unused CSS.
 */
module.exports = {
  css: ['_site/assets/css/agency.css'],
  content: [
    '_site/**/*.html',
    '_site/assets/js/agency.min.js',
    '_site/assets/js/nav-active.js',
    '_site/assets/js/client-scroll.js',
    '_site/assets/js/testimonials-shuffle.js',
  ],
  safelist: {
    // JS-applied classes (not present in static HTML)
    standard: [
      'navbar-shrink',      // agency.min.js scroll handler
      'is-loading',         // contact form button state
      'is-success',         // contact form button state
      'is-error',           // contact form button state
      'is-validation-error',// contact form button state
      'contact-field-error',// contact form field validation
      'active',             // nav-active.js, testimonials-shuffle.js
      'show',               // Bootstrap collapse/dropdown
      'collapse',           // Bootstrap collapse
      'collapsing',         // Bootstrap collapse transition
      'collapsed',          // Bootstrap accordion
      'modal-open',         // Bootstrap modal
      'fade',               // Bootstrap modal/transition
    ],
    // Keep all Bootstrap modal, dropdown, navbar classes
    greedy: [/^modal/, /^dropdown/, /^navbar/, /^collapse/],
  },
  // Extended extractor to handle BEM (--) and utility classes
  defaultExtractor: (content) => content.match(/[\w-/:]+(?<!:)/g) || [],
  output: '_site/assets/css/',
};
