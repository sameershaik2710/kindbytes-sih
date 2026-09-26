/** KindBytes Tailwind theme. Preflight is off because the carried-over component
 *  styles (frontend/src/css/legacy.css) ship their own base reset. */
module.exports = {
  content: ['./templates/**/*.html', './frontend/src/js/**/*.js'],
  corePlugins: { preflight: false },
  theme: {
    extend: {
      colors: {
        kb: { bg: '#0A0D1D', panel: 'rgba(16,19,40,.74)' },
        ink: { DEFAULT: '#EFEDF8', 2: '#B3B4D0', 3: '#7F82A8' },
        turmeric: '#F5B83D', jade: '#3FDBB1', chili: '#FF5E5B', lilac: '#A897FF',
        line: { DEFAULT: 'rgba(164,170,255,.12)', 2: 'rgba(164,170,255,.22)' }
      },
      fontFamily: {
        display: ['"Bricolage Grotesque"', '"Noto Sans Devanagari"', '"Atkinson Hyperlegible"', 'system-ui', 'sans-serif'],
        body: ['"Atkinson Hyperlegible"', '"Noto Sans Devanagari"', 'system-ui', 'sans-serif']
      },
      borderRadius: { kb: '22px' }
    }
  }
};
