// Tailwind v4 ships its own PostCSS plugin and handles both `@import`
// inlining and vendor prefixing (via Lightning CSS) internally, so
// `postcss-import` and `autoprefixer` are no longer needed here.
module.exports = {
  plugins: {
    '@tailwindcss/postcss': {},
  },
};
