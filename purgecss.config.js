/**
 * PurgeCSS audit tool for valiente CSS files.
 *
 * Run after a Jekyll build:
 *   bundle exec jekyll build
 *   npx purgecss --config purgecss.config.js
 *
 * Output lands in _site/assets/css/ for inspection only.
 * Changes must be made in the SCSS source files.
 */
module.exports = {
  css: [
    '_site/assets/css/valiente-base.css',
    '_site/assets/css/valiente-home.css',
    '_site/assets/css/valiente-corporate.css',
    '_site/assets/css/valiente-contact.css',
    '_site/assets/css/valiente-legal.css',
    '_site/assets/css/valiente-error.css',
  ],
  content: [
    '_site/**/*.html',
    '_site/assets/js/nav-active.js',
    '_site/assets/js/client-scroll.js',
    '_site/assets/js/testimonials-shuffle.js',
  ],
  safelist: {
    standard: [
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
    greedy: [/^modal/, /^dropdown/, /^navbar/, /^collapse/],
  },
  defaultExtractor: (content) => content.match(/[\w-/:]+(?<!:)/g) || [],
  output: '_site/assets/css/',
};
