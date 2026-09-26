/* KindBytes auth card: an Alpine.js component backed by the Django /api/auth/ endpoints. */
document.addEventListener('alpine:init', () => {
  Alpine.store('kb', { lang: 'en' });
  window.addEventListener('kb:lang', e => { Alpine.store('kb').lang = e.detail; });

  const ICONS = {
    org: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M3 2v7c0 1.1.9 2 2 2h4a2 2 0 0 0 2-2V2"/><path d="M7 2v20"/><path d="M21 15V2a5 5 0 0 0-5 5v6c0 1.1.9 2 2 2h3zm0 0v7"/></svg>',
    ngo: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M12 20s-7-4.4-7-10a4 4 0 0 1 7-2.6A4 4 0 0 1 19 10c0 5.6-7 10-7 10z"/><path d="M9 11h6M12 8v6"/></svg>',
    vol: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><circle cx="5.5" cy="17.5" r="3.5"/><circle cx="18.5" cy="17.5" r="3.5"/><path d="M15 6h2l3 7.5M5.5 17.5 9 10h6l3.5 7.5M9 10 7.5 6H5"/></svg>'
  };
  const blank = role => ({
    orgType: role === 'ngo' ? 'ngo' : 'restaurant', org: '', reg: '', daily: '', cap: '',
    name: '', phone: '', email: '', city: 'del', area: '', vehicle: '', slots: [],
    verified: false, hyg: false, fostac: false, storage: false, pw: '', agree: false
  });
  const who = u => u.role === 'org' ? u.org : u.name;

  Alpine.data('authCard', () => ({
    tab: 'login', role: null, busy: false, formErr: '', errors: {}, showPw: false, verifying: false,
    login: { ident: '', pw: '', keep: true },
    f: blank('org'),
    vehicles: ['On foot', 'Bicycle', 'Two-wheeler', 'E-rickshaw', 'Car or van'],
    slotOptions: ['Mornings', 'Afternoons', 'Evenings', 'Late nights'],
    roleCards: [
      { key: 'org', bg: 'rgba(245,184,61,.14)', col: 'var(--turmeric)', icon: ICONS.org },
      { key: 'ngo', bg: 'rgba(63,219,177,.14)', col: 'var(--jade)', icon: ICONS.ngo },
      { key: 'vol', bg: 'rgba(168,151,255,.16)', col: 'var(--lilac)', icon: ICONS.vol }
    ],

    init() {
      window.addEventListener('kb:auth', e => this.go(e.detail.tab, e.detail.role || null));
      window.addEventListener('kb:home', () => { this.go('login'); this.login.pw = ''; });
    },
    tr(k) { this.$store.kb.lang; return window.KB ? window.KB.t(k) : k; },
    go(tab, role = null) {
      this.tab = tab; this.role = tab === 'signup' ? role : null;
      this.errors = {}; this.formErr = ''; this.showPw = false;
      if (role) this.f = blank(role);
    },
    pickRole(r) { this.role = r; this.f = blank(r); this.errors = {}; this.formErr = ''; },

    get cities() { return window.KB ? window.KB.cities : []; },
    types(grp) { return window.KB ? Object.entries(window.KB.ORG_TYPES).filter(([, o]) => o.grp === grp) : []; },
    get type() { return (window.KB && window.KB.ORG_TYPES[this.f.orgType]) || {}; },
    get reg() { return (window.KB && window.KB.REG[window.KB.regKey(this.f.orgType)]) || {}; },
    get bwgNote() {
      const v = +this.f.daily;
      if (!(v > 0)) return '';
      return v >= 100
        ? 'At 100 kg or more a day, you are a bulk waste generator under the Solid Waste Management Rules, 2026. KindBytes prepares your off-site processing certificate every month.'
        : 'You are below the 100 kg a day bulk generator threshold. You will still get a monthly diversion report.';
    },
    get meterStyle() {
      const pw = this.f.pw;
      let s = 0;
      if (pw.length >= 8) s++; if (pw.length >= 12) s++;
      if (/[A-Za-z]/.test(pw) && /\d/.test(pw)) s++; if (/[^A-Za-z0-9]/.test(pw)) s++;
      const bg = s <= 1 ? 'var(--chili)' : s === 2 ? 'var(--turmeric)' : 'var(--jade)';
      return `width:${pw ? Math.max(12, s * 25) : 0}%;background:${bg}`;
    },
    toggleSlot(s) { this.f.slots = this.f.slots.includes(s) ? this.f.slots.filter(x => x !== s) : [...this.f.slots, s]; },
    verify() { this.verifying = true; setTimeout(() => { this.verifying = false; this.f.verified = true; }, 1300); },
    forgot() {
      const id = this.login.ident.trim();
      window.KB.toast(id ? `If ${id} has an account, a reset link is on its way.` : 'Enter your email or mobile number first, then tap Forgot password.');
    },

    async doLogin() {
      this.formErr = ''; this.busy = true;
      try {
        const r = await window.KB.api('POST', '/api/auth/login/', this.login);
        await window.KB.signIn(r.user, `Signed in as ${who(r.user)}.`);
      } catch (e) { this.formErr = e.message; }
      finally { this.busy = false; }
    },
    async demo(key) {
      this.busy = true;
      try {
        const r = await window.KB.api('POST', '/api/auth/demo/', { key });
        await window.KB.signIn(r.user, `Signed in as ${who(r.user)}.`);
      } catch (e) { window.KB.toast(e.message); }
      finally { this.busy = false; }
    },
    async submit() {
      this.busy = true; this.errors = {}; this.formErr = '';
      try {
        const r = await window.KB.api('POST', '/api/auth/signup/', { ...this.f, role: this.role });
        await window.KB.signIn(r.user, `Welcome to KindBytes, ${String(r.user.name).split(' ')[0]}. Your account is ready.`);
      } catch (e) {
        this.errors = (e.data && e.data.errors) || {};
        this.formErr = Object.keys(this.errors).length ? 'Please fix the highlighted fields.' : e.message;
        this.$nextTick(() => {
          const bad = this.$root.querySelector('[aria-invalid="true"]') || this.$root.querySelector('.form-err');
          if (bad) bad.scrollIntoView({ block: 'center', behavior: 'smooth' });
        });
      } finally { this.busy = false; }
    }
  }));
});
