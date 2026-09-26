(() => {
'use strict';

/* ---------- helpers ---------- */
const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
const $ = (s, r = document) => r.querySelector(s);
const $$ = (s, r = document) => Array.from(r.querySelectorAll(s));
const clamp = (v, a, b) => Math.max(a, Math.min(b, v));
const fmt = n => Math.round(n).toLocaleString('en-IN');
function mulberry32(a){return function(){a|=0;a=a+0x6D2B79F5|0;let t=Math.imul(a^a>>>15,1|a);t=t+Math.imul(t^t>>>7,61|t)^t;return((t^t>>>14)>>>0)/4294967296;};}
const R = mulberry32(20260925);
const rand = (a, b) => a + (b - a) * R();
const randi = (a, b) => Math.floor(rand(a, b + 1));
const pick = a => a[Math.floor(R() * a.length)];
const pickW = pairs => { let s = 0; pairs.forEach(p => s += p[1]); let r = R() * s; for (const [v, w] of pairs) { if ((r -= w) <= 0) return v; } return pairs[pairs.length - 1][0]; };
const hhmm = t => new Date(t).toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' });
const esc = s => String(s).replace(/[&<>"]/g, c => ({ '&':'&amp;', '<':'&lt;', '>':'&gt;', '"':'&quot;' }[c]));

/* ---------- i18n ---------- */
const I18N = {
  en: {
    nav_command:'Command center', nav_dispatch:'Dispatch', nav_volunteers:'Volunteers', nav_impact:'Impact',
    live:'Live, simulated data', surge:'Surge mode',
    surge_banner:'Surge mode is on. Grade A food goes to relief camps first, and volunteers within 10 km get priority alerts.',
    caption:'meals reached people today instead of the bin.',
    st_kg:'kg kept out of landfill', st_co2:'t CO₂e avoided', st_pick:'min median pickup time',
    needs:'Where food is needed most', needs_sub:'Meals still needed today',
    activity:'Activity', feed:'Live batches', all_cities:'All cities',
    legend_pillar:'Pillar height: meals rescued today', legend_arc:'Green arcs: surplus on the move', legend_relief:'Red: relief camps',
    reset:'Reset view', rotate:'Drift',
    queue:'Pickup queue', f_waiting:'Waiting', f_progress:'In progress', f_c:'Grade C', f_soon:'Expiring soon',
    safety:'Safety score', matches:'Best matches', auto:'Auto-dispatch', assign:'Assign',
    custody:'Chain of custody', unsafe:'Mark unsafe', advance:'Advance to next step',
    empty_detail:'Pick a batch from the queue to check its safety and match it to a receiver.',
    leaderboard:'Top volunteers this month', coverage:'Pickup demand vs volunteers online', badges:'Badges volunteers can earn',
    m_demand:'Demand', m_vol:'Volunteers', m_gap:'Gap', request_vol:'Request volunteers for this slot',
    forecast:'Surplus forecast, next 14 days', grade_mix:'Safety grades this month', top_cities:'Meals rescued today by city',
    sdg:'Sustainable Development Goals', csr:'CSR summary for a donor', build_csr:'Build CSR summary', close:'Close',
    k_meals:'meals this month', k_kg:'t food rescued', k_co2:'t CO₂e avoided', k_people:'people reached', k_donors:'active donors',
    city_open:'Open dispatch for this city', min_left:'min left', h_left:'hours left',
    csr:'Reports for a donor', st_split:'Where today’s surplus went',
    my_donor:'My kitchen', my_receiver:'My intake', my_ulb:'My city', my_vol:'My pickups', my_ind:'My space', namaste:'Namaste',
    login:'Log in', signup:'Sign up', h_how:'How it works', h_loop:'Waste loop', h_who:'Who it’s for',
    h_badge:'Ready for the Solid Waste Management Rules, 2026', h_t1:'Surplus food to people.', h_t2:'The rest, never to landfill.',
    h_sub:'KindBytes grades surplus food for safety in seconds and sends what is edible to shelters, community kitchens and relief camps. Everything else is segregated at source into animal feed, biogas and recycling. Every kilo gets a QR trail, and bulk kitchens get the off-site processing proof the new rules ask for.',
    h_cta1:'Create a free account', h_cta2:'Explore the live dashboard',
    a_welcome:'Welcome back', a_welcome_p:'Log in to list surplus, pick up food or track your impact.', a_join:'Join KindBytes', a_join_p:'Choose the account that fits how you will use it.',
    r_org:'Restaurants, cafes & individuals', r_org_s:'Restaurant', r_vol:'Volunteer', r_ind:'Individual',
    r_org_d:'Restaurants, cafes, hotels, caterers, households and anyone with surplus food',
    r_ngo:'NGO', r_ngo_d:'Shelters, community kitchens, children’s and elders’ homes, relief groups and gaushalas',
    r_vol_d:'Pick up surplus food near you and deliver it safely', r_ind_d:'Share food from home, find free meals, report waste hotspots',
    demo_try:'Or look around with a demo account', h_live:'meals reached people today', h_more:'Learn more',
    h_sub2:'Every kilo of surplus food graded for safety, segregated at source and sent where it helps most, with a QR trail from kitchen to plate.'
  },
  hi: {
    nav_command:'नियंत्रण केंद्र', nav_dispatch:'वितरण', nav_volunteers:'स्वयंसेवक', nav_impact:'प्रभाव',
    live:'लाइव, सिम्युलेटेड डेटा', surge:'आपात मोड',
    surge_banner:'आपात मोड चालू है। ग्रेड A भोजन पहले राहत शिविरों को जाएगा, और 10 किमी के भीतर के स्वयंसेवकों को प्राथमिकता से सूचना मिलेगी।',
    caption:'भोजन आज कूड़ेदान के बजाय लोगों तक पहुँचे।',
    st_kg:'किलो भोजन लैंडफिल से बचा', st_co2:'टन CO₂e उत्सर्जन टला', st_pick:'मिनट पिकअप समय (माध्यिका)',
    needs:'जहाँ भोजन की सबसे ज़्यादा ज़रूरत है', needs_sub:'आज अभी भी चाहिए भोजन',
    activity:'गतिविधि', feed:'लाइव बैच', all_cities:'सभी शहर',
    legend_pillar:'स्तंभ की ऊँचाई: आज बचाया गया भोजन', legend_arc:'हरे चाप: रास्ते में अतिरिक्त भोजन', legend_relief:'लाल: राहत शिविर',
    reset:'दृश्य रीसेट करें', rotate:'धीमी गति',
    queue:'पिकअप कतार', f_waiting:'प्रतीक्षा में', f_progress:'जारी', f_c:'ग्रेड C', f_soon:'जल्द खराब होने वाला',
    safety:'सुरक्षा अंक', matches:'सबसे अच्छे मिलान', auto:'स्वतः वितरण', assign:'सौंपें',
    custody:'हस्तांतरण श्रृंखला', unsafe:'असुरक्षित चिह्नित करें', advance:'अगला चरण',
    empty_detail:'सुरक्षा जाँच और मिलान के लिए कतार से एक बैच चुनें।',
    leaderboard:'इस महीने के शीर्ष स्वयंसेवक', coverage:'पिकअप माँग बनाम ऑनलाइन स्वयंसेवक', badges:'स्वयंसेवकों के बैज',
    m_demand:'माँग', m_vol:'स्वयंसेवक', m_gap:'कमी', request_vol:'इस समय के लिए स्वयंसेवक बुलाएँ',
    forecast:'अगले 14 दिनों का अतिरिक्त भोजन पूर्वानुमान', grade_mix:'इस महीने के सुरक्षा ग्रेड', top_cities:'शहरवार आज बचाया गया भोजन',
    sdg:'सतत विकास लक्ष्य', csr:'दाता के लिए CSR सारांश', build_csr:'CSR सारांश बनाएँ', close:'बंद करें',
    k_meals:'इस महीने भोजन', k_kg:'टन भोजन बचाया', k_co2:'टन CO₂e टला', k_people:'लोगों तक पहुँचे', k_donors:'सक्रिय दाता',
    city_open:'इस शहर का वितरण खोलें', min_left:'मिनट बाकी', h_left:'घंटे बाकी',
    csr:'दाता की रिपोर्ट', st_split:'आज का अतिरिक्त भोजन कहाँ गया',
    my_donor:'मेरी रसोई', my_receiver:'मेरी प्राप्ति', my_ulb:'मेरा शहर', my_vol:'मेरे पिकअप', my_ind:'मेरा पेज', namaste:'नमस्ते',
    login:'लॉग इन', signup:'साइन अप', h_how:'यह कैसे काम करता है', h_loop:'अपशिष्ट चक्र', h_who:'किसके लिए',
    h_badge:'ठोस अपशिष्ट प्रबंधन नियम, 2026 के लिए तैयार', h_t1:'बचा भोजन लोगों तक।', h_t2:'बाकी कभी लैंडफिल तक नहीं।',
    h_sub:'KindBytes अतिरिक्त भोजन की सुरक्षा जाँच सेकंडों में करता है और खाने योग्य भोजन आश्रय गृहों, सामुदायिक रसोइयों और राहत शिविरों तक भेजता है। बाकी को स्रोत पर ही पशु आहार, बायोगैस और रीसाइक्लिंग में अलग किया जाता है। हर किलो का QR रिकॉर्ड बनता है, और बड़ी रसोइयों को नए नियमों के तहत ज़रूरी प्रमाण मिलता है।',
    h_cta1:'मुफ़्त खाता बनाएँ', h_cta2:'लाइव डैशबोर्ड देखें',
    a_welcome:'फिर से स्वागत है', a_welcome_p:'अतिरिक्त भोजन दर्ज करने, पिकअप करने या अपना प्रभाव देखने के लिए लॉग इन करें।', a_join:'KindBytes से जुड़ें', a_join_p:'अपने काम के हिसाब से खाता चुनें।',
    r_org:'रेस्टोरेंट, कैफ़े और व्यक्ति', r_org_s:'रेस्टोरेंट', r_vol:'स्वयंसेवक', r_ind:'व्यक्ति',
    r_org_d:'रेस्टोरेंट, कैफ़े, होटल, कैटरर, घर और कोई भी जिसके पास बचा भोजन हो',
    r_ngo:'NGO', r_ngo_d:'आश्रय गृह, सामुदायिक रसोई, बाल और वृद्ध आश्रम, राहत संस्थाएँ और गौशालाएँ',
    r_vol_d:'पास का अतिरिक्त भोजन उठाएँ और सुरक्षित पहुँचाएँ', r_ind_d:'घर का भोजन साझा करें, मुफ़्त भोजन खोजें, कचरा स्थल की सूचना दें',
    demo_try:'या डेमो खाते से देखें', h_live:'भोजन आज लोगों तक पहुँचे', h_more:'और जानें',
    h_sub2:'हर किलो अतिरिक्त भोजन की सुरक्षा जाँच, स्रोत पर छँटाई और सही जगह तक पहुँच, रसोई से थाली तक QR रिकॉर्ड के साथ।'
  }
};

/* ---------- data ---------- */
const INDIA = [[23.7,68.2],[24.3,68.8],[24.6,71.0],[25.4,70.6],[26.6,70.2],[27.8,70.4],[28.0,71.2],[29.0,72.9],[30.1,73.8],[31.1,74.6],[32.1,74.8],[32.8,74.3],[33.7,74.0],[34.4,73.8],[35.1,74.3],[35.6,75.4],[35.9,76.9],[35.4,77.9],[34.6,78.6],[33.6,79.0],[32.6,79.4],[31.8,78.8],[31.0,79.0],[30.4,80.2],[29.6,80.3],[28.7,80.4],[28.3,81.3],[27.4,83.1],[27.3,84.4],[26.6,85.5],[26.4,86.8],[26.4,88.1],[27.4,88.0],[28.0,88.3],[27.3,88.9],[26.8,89.8],[26.9,91.2],[26.8,92.1],[27.8,91.7],[28.4,93.0],[29.2,94.5],[29.0,95.8],[28.3,97.2],[27.4,97.0],[27.0,95.8],[26.2,95.2],[25.2,94.7],[24.2,94.2],[23.1,93.4],[22.0,93.2],[22.0,92.6],[23.0,92.3],[23.9,91.8],[23.9,91.2],[24.4,91.7],[24.9,92.4],[25.2,92.0],[25.2,90.0],[25.6,89.8],[26.1,89.7],[26.3,89.0],[26.0,88.3],[25.2,88.5],[24.6,88.1],[23.7,88.6],[23.0,88.9],[22.2,89.0],[21.6,88.6],[21.6,87.6],[21.0,86.9],[20.2,86.6],[19.8,85.6],[19.1,84.8],[18.2,83.9],[17.6,83.2],[16.9,82.3],[16.3,81.7],[15.8,80.9],[15.1,80.1],[14.2,80.2],[13.3,80.3],[12.4,80.1],[11.6,79.8],[10.8,79.9],[10.3,79.8],[9.9,79.2],[9.2,78.9],[8.7,78.2],[8.1,77.5],[8.4,77.0],[8.9,76.6],[9.9,76.2],[10.9,75.9],[11.9,75.3],[12.9,74.8],[13.9,74.6],[14.8,74.1],[15.5,73.8],[16.4,73.4],[17.4,73.2],[18.5,72.9],[19.1,72.8],[20.0,72.7],[21.0,72.6],[21.7,72.5],[22.3,72.6],[22.2,72.1],[21.6,72.2],[21.0,71.4],[20.8,70.6],[21.2,69.9],[21.7,69.3],[22.3,69.0],[22.5,69.7],[22.8,70.3],[22.9,69.6],[23.0,68.8],[23.3,68.4]];

const CITIES = [
  {id:'del',name:'Delhi',lat:28.61,lon:77.21,w:1.3,lbl:1},
  {id:'mum',name:'Mumbai',lat:19.08,lon:72.88,w:1.3,lbl:1,side:'l'},
  {id:'blr',name:'Bengaluru',lat:12.97,lon:77.59,w:1.2,lbl:1,side:'l'},
  {id:'hyd',name:'Hyderabad',lat:17.39,lon:78.49,w:1.1,lbl:1},
  {id:'che',name:'Chennai',lat:13.08,lon:80.27,w:1.1,lbl:1},
  {id:'kol',name:'Kolkata',lat:22.57,lon:88.36,w:1.1,lbl:1},
  {id:'pun',name:'Pune',lat:18.52,lon:73.86,w:.9,lbl:1},
  {id:'ahm',name:'Ahmedabad',lat:23.02,lon:72.57,w:.9,lbl:1,side:'l'},
  {id:'jai',name:'Jaipur',lat:26.91,lon:75.79,w:.8,lbl:1,side:'l'},
  {id:'lko',name:'Lucknow',lat:26.85,lon:80.95,w:.8,lbl:1},
  {id:'pat',name:'Patna',lat:25.59,lon:85.14,w:.7,relief:true,lbl:1},
  {id:'gau',name:'Guwahati',lat:26.14,lon:91.74,w:.7,relief:true,lbl:1},
  {id:'bbs',name:'Bhubaneswar',lat:20.30,lon:85.82,w:.6,relief:true,lbl:1},
  {id:'koc',name:'Kochi',lat:9.93,lon:76.27,w:.6},
  {id:'ngp',name:'Nagpur',lat:21.15,lon:79.09,w:.6},
  {id:'ind',name:'Indore',lat:22.72,lon:75.86,w:.6},
  {id:'chd',name:'Chandigarh',lat:30.73,lon:76.78,w:.5},
  {id:'viz',name:'Visakhapatnam',lat:17.69,lon:83.22,w:.6}
];
const cityById = {}; CITIES.forEach(c => cityById[c.id] = c);
const city = id => cityById[id];
const CORRIDORS = [['kol','gau',1],['lko','pat',1],['viz','bbs',1],['mum','pun'],['del','jai'],['che','blr'],['ahm','ind'],['hyd','ngp'],['koc','blr'],['chd','del'],['hyd','viz'],['del','lko']];

const FOODS = [
  {n:'Veg biryani',veg:1,al:[]},{n:'Dal and jeera rice',veg:1,al:[]},{n:'Chapati and aloo sabzi',veg:1,al:['gluten']},
  {n:'Paneer butter masala',veg:1,al:['dairy']},{n:'Idli and sambar',veg:1,al:[]},{n:'Chicken curry and rice',veg:0,al:[]},
  {n:'Rajma chawal',veg:1,al:[]},{n:'Vegetable pulao',veg:1,al:[]},{n:'Curd rice',veg:1,al:['dairy']},
  {n:'Bread loaves',veg:1,al:['gluten']},{n:'Poha',veg:1,al:['peanuts']},{n:'Mixed fruit crates',veg:1,al:[]},
  {n:'Egg fried rice',veg:0,al:['egg']},{n:'Wedding buffet mix',veg:1,al:['dairy','nuts']},{n:'Mithai boxes',veg:1,al:['dairy','nuts']},
  {n:'Sambar rice',veg:1,al:[]}
];
const DONORS = ['Annapurna Caterers','Royal Palms Banquets','Green Leaf Restaurant','Tech Park cafeteria','Shubh Vivah Hall','Hotel Meghdoot','Spice Route Kitchen','Sunrise Bakery','University mess hall','Saffron Events','Metro Food Court','Sai Krupa Tiffins'];
const PEOPLE_RECV = ['Aasra Night Shelter','Seva Sadan Kitchen','Nanhi Kiran Children’s Home','Sahara Elders’ Home','Annadaan Community Kitchen','Snehalaya Women’s Shelter','Street Smile Foundation'];
const FIRST = ['Aditya','Pooja','Suresh','Kavya','Manish','Ritu','Farhan','Lakshmi','Deepak','Neha','Harish','Zoya'];
const VOLS = [];  // live leaderboard comes from /api/state/

CITIES.forEach(c => { c.meals = 0; c.need = 0; c.vols = 0; c.receivers = []; });

/* ---------- state ---------- */
const S = {
  view:'command', lang:'en', surge:false, auto:true, city:null, selected:null,
  qFilter:'waiting', heatMode:'gap', batches:[], events:[],
  totals:{meals:0, kg:0, pickup:23}, grades:{A:0,B:0,C:0}, reports:[], user:null, me:null, myRec:null, myBuilt:null,
  bwg:{}, skew:0, local:{chk:{}, probe:{}, dist:{}}, lastEventT:0, sig:''
};
S.totals.meals = CITIES.reduce((a, c) => a + c.meals, 0);
S.totals.kg = S.totals.meals * 0.4;
S.streams = {people:S.totals.kg * .84, feed:S.totals.kg * .05, wet:S.totals.kg * .08, dry:S.totals.kg * .03, landfill:0};
const t = k => (I18N[S.lang][k] ?? I18N.en[k] ?? k);

/* ---------- batches ---------- */
function scoreBatch(b){
  const stable = b.cat === 'raw' || b.cat === 'bakery';
  const safeTemp = stable || b.tempC >= 60 || b.tempC <= 5;
  const fresh = Math.max(0, 40 - Math.min(40, b.hours * (stable ? 3 : 8)));
  const temp = safeTemp ? 30 : (b.hours > 2 ? 5 : 15);
  const pack = {Sealed:15, Covered:10, Open:3}[b.packaging];
  const hand = Math.round(b.checks / 4 * 15);
  b.factors = {fresh:Math.round(fresh), temp, pack, hand};
  b.score = Math.round(fresh + temp + pack + hand);
  b.grade = b.score >= 75 ? 'A' : b.score >= 50 ? 'B' : 'C';
}
function computeStreams(b){
  const kg = b.kg, dry = kg * (b.packaging === 'Open' ? .02 : b.packaging === 'Sealed' ? .06 : .045);
  const trim = kg * (b.cat === 'raw' ? .14 : b.cat === 'bakery' ? .02 : .04), rest = Math.max(0, kg - dry - trim);
  if (b.grade === 'C') { const feed = b.veg ? rest * .6 : 0; b.streams = {people:0, feed, wet:rest - feed + trim, dry, landfill:0}; }
  else b.streams = {people:rest, feed:0, wet:trim, dry, landfill:0};
}
/* ---------- server sync: the Django REST API is the source of truth ---------- */
const remMs = b => Math.max(0, b.expiresAt - (Date.now() + S.skew));
const remMin = b => Math.ceil(remMs(b) / 60000);
const fmtDur = m => m >= 60 ? `${Math.floor(m/60)} h ${m%60} min` : `${m} min`;
const matches = b => b.matches || [];

function csrf(){ const m = document.cookie.match(/(?:^|; )csrftoken=([^;]+)/); return m ? decodeURIComponent(m[1]) : ''; }
async function api(method, url, body){
  const res = await fetch(url, {method, credentials:'same-origin',
    headers:{'Content-Type':'application/json', 'X-CSRFToken':csrf()},
    body: body === undefined ? undefined : JSON.stringify(body)});
  let data = {}; try { data = await res.json(); } catch (e) {}
  if (!res.ok) { const e = new Error(data.error || data.detail || 'Something went wrong. Please try again.'); e.data = data; e.status = res.status; throw e; }
  return data;
}
async function call(method, url, body, okMsg){
  try {
    const r = await api(method, url, body);
    if (okMsg) toast(typeof okMsg === 'function' ? okMsg(r) : okMsg);
    await sync();
    return r;
  } catch (e) { toast(e.message); return null; }
}
const EV_PULSE = {new:'turmeric', match:'lilac', deliver:'jade', warn:'chili', fail:'chili', surge:'chili'};
let syncing = null;
function sync(){
  if (syncing) return syncing;
  syncing = api('GET', '/api/state/').then(hydrate).catch(() => {}).finally(() => { syncing = null; });
  return syncing;
}
function hydrate(d){
  S.skew = d.now - Date.now();
  if (S.user && !d.user) { S.user = null; S.myRec = null; S.myBuilt = null; showHome(); }
  if (d.user && S.user) S.user = d.user;
  S.me = d.me; S.myRec = d.myRec; S.reports = d.reports || []; S.bwg = d.bwg || {};
  const surgeChanged = S.surge !== d.sim.surge;
  S.surge = d.sim.surge; S.auto = d.sim.auto;
  S.totals = d.sim.totals; S.streams = d.sim.streams; S.grades = d.sim.grades;
  d.cities.forEach(x => { const c = city(x.id); if (c) Object.assign(c, x); });
  VOLS.length = 0; d.vols.forEach(v => VOLS.push(v));
  d.batches.forEach(b => {
    if (b.mineVol) { b.chk = S.local.chk[b.id] || (S.local.chk[b.id] = [0,0,0,0]); b.probe = S.local.probe[b.id] || null; }
    if (S.local.dist[b.id]) b.distFor = S.local.dist[b.id];
  });
  S.batches = d.batches;
  if (S.lastEventT) d.events.filter(e => e.t > S.lastEventT).forEach(e => { if (e.city && EV_PULSE[e.type]) Scene.pulse(e.city, EV_PULSE[e.type]); });
  if (d.events.length) S.lastEventT = Math.max(S.lastEventT, d.events[0].t);
  S.events = d.events;
  if (surgeChanged) {
    document.body.classList.toggle('surge', S.surge);
    const sb = $('#surgeBtn'); if (sb) sb.setAttribute('aria-pressed', S.surge);
    Scene.setSurge(S.surge);
  }
  const sig = S.batches.map(b => b.id + b.status + (b.receiver ? b.receiver.id : '') + b.grade + (b.rating || '')).join('|')
    + '#' + S.reports.map(r => r.id + r.status).join('') + JSON.stringify(S.me) + (S.myRec ? S.myRec.capacity : '')
    + JSON.stringify(S.bwg[S.user ? S.user.city : ''] || '');
  if (sig !== S.sig) { S.sig = sig; dirty('feed','queue','detail','city','my','lb','impact'); }
  dirty('counts','needs','log','labels');
  Scene.refreshHeights();
}

/* ---------- 3D scene ---------- */
const Scene = (() => {
  const K = .9, LON0 = 82.5, LAT0 = 22.4;
  const COLORS = { turmeric:0xF5B83D, jade:0x3FDBB1, chili:0xFF5E5B, lilac:0xA897FF };
  const canvas = $('#scene');
  let ok = false, renderer, scene, camera, mapMat, dustMat, flowMat, flowGeo, glowTex;
  const nodes = [], arcs = [], pulses = [], pcols = [];
  let pulseIdx = 0, surge = false, drift = !reduceMotion, lastInteract = -1e9, swayAmp = drift ? 1 : 0;
  const cam = {az:0, pol:.9, rad:34, tx:0, tz:.8}, goal = {...cam};
  let W = innerWidth, H = innerHeight, start = performance.now(), last = start, hover = null, selectedId = null, view = 'command';
  const V = typeof THREE !== 'undefined' ? new THREE.Vector3() : null;

  const proj = (lat, lon, y = 0) => new THREE.Vector3((lon - LON0) * K, y, -(lat - LAT0) * K * 1.06);
  function inPoly(lat, lon){
    let inside = false;
    for (let i = 0, j = INDIA.length - 1; i < INDIA.length; j = i++) {
      const [yi, xi] = INDIA[i], [yj, xj] = INDIA[j];
      if (((yi > lat) !== (yj > lat)) && (lon < (xj - xi) * (lat - yi) / (yj - yi) + xi)) inside = !inside;
    }
    return inside;
  }
  const PT_VS = `
    attribute float aSize; attribute float aSeed; attribute vec3 aColor;
    uniform float uTime; uniform float uPixel; uniform float uMotion; uniform float uIntro;
    uniform vec4 uPulses[8]; uniform vec3 uPulseColors[8];
    varying vec3 vColor; varying float vAlpha;
    void main(){
      vec3 p = position; float glow = 0.0; vec3 add = vec3(0.0);
      for (int i = 0; i < 8; i++) {
        vec4 pl = uPulses[i]; float age = uTime - pl.z;
        if (age > 0.0 && age < 7.0) {
          float r = distance(p.xz, pl.xy);
          float w = exp(-pow(r - age * 4.2, 2.0) * 1.3) * exp(-age * 0.55) * pl.w;
          glow += w; add += uPulseColors[i] * w;
        }
      }
      p.y += glow * 0.85 * uMotion;
      p.y += sin(uTime * 0.7 + aSeed * 6.2831 + p.x * 0.25) * 0.06 * uMotion;
      float intro = clamp(uIntro * 1.6 - aSeed * 0.6, 0.0, 1.0);
      intro = intro * intro * (3.0 - 2.0 * intro);
      p.y -= (1.0 - intro) * (6.0 + aSeed * 8.0);
      vec4 mv = modelViewMatrix * vec4(p, 1.0);
      gl_Position = projectionMatrix * mv;
      gl_PointSize = aSize * uPixel * (1.0 + glow * 1.3) * (105.0 / -mv.z);
      vColor = aColor + add * 0.9;
      vAlpha = intro * (0.8 + glow * 0.8);
    }`;
  const PT_FS = `
    varying vec3 vColor; varying float vAlpha;
    void main(){
      float d = length(gl_PointCoord - 0.5);
      if (d > 0.5) discard;
      gl_FragColor = vec4(vColor, smoothstep(0.5, 0.05, d) * vAlpha);
    }`;

  function init(){
    if (typeof THREE === 'undefined') { document.body.classList.add('no-webgl'); return; }
    try {
      renderer = new THREE.WebGLRenderer({canvas, antialias:true, alpha:true, powerPreference:'high-performance'});
    } catch (e) { document.body.classList.add('no-webgl'); return; }
    ok = true;
    renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));
    renderer.setClearColor(0x000000, 0);
    scene = new THREE.Scene();
    camera = new THREE.PerspectiveCamera(42, W / H, .1, 500);
    glowTex = makeGlow();
    for (let i = 0; i < 8; i++) { pulses.push(new THREE.Vector4(0, 0, -100, 0)); pcols.push(new THREE.Vector3()); }
    buildMap(); buildDust(); buildNodes(); buildArcs(); buildLabels();
    resize(); addEventListener('resize', resize);
    bindPointer();
    setView('command', true);
    requestAnimationFrame(loop);
  }
  function makeGlow(){
    const cv = document.createElement('canvas'); cv.width = cv.height = 64;
    const g = cv.getContext('2d'), gr = g.createRadialGradient(32, 32, 0, 32, 32, 32);
    gr.addColorStop(0, 'rgba(255,255,255,1)'); gr.addColorStop(.22, 'rgba(255,255,255,.6)'); gr.addColorStop(1, 'rgba(255,255,255,0)');
    g.fillStyle = gr; g.fillRect(0, 0, 64, 64);
    return new THREE.CanvasTexture(cv);
  }
  function buildMap(){
    const step = innerWidth < 700 ? .3 : .2;
    const pos = [], col = [], size = [], seed = [];
    const base = new THREE.Color(0x565BD0), cool = new THREE.Color(0x9A86FF), warm = new THREE.Color(0xF5B83D), tmp = new THREE.Color();
    const push = (la, lo, edge) => {
      const p = proj(la, lo, edge ? 0 : R() * .1);
      pos.push(p.x, p.y, p.z);
      let w = 0;
      for (const c of CITIES) { const d2 = (c.lat - la) ** 2 + ((c.lon - lo) * .95) ** 2; w = Math.max(w, Math.exp(-d2 / .8) * c.w); }
      tmp.copy(base).lerp(cool, R() * .55).lerp(warm, Math.min(.85, w * .75));
      const k = edge ? .85 : .5 + w * .25;
      col.push(tmp.r * k, tmp.g * k, tmp.b * k);
      size.push(edge ? 1.0 : .65 + R() * .55 + w * .6);
      seed.push(R());
    };
    for (let lat = 7.6; lat <= 36.2; lat += step)
      for (let lon = 67.8; lon <= 97.6; lon += step) {
        const la = lat + (R() - .5) * step * .9, lo = lon + (R() - .5) * step * .9;
        if (inPoly(la, lo)) push(la, lo, false);
      }
    for (let i = 0; i < INDIA.length; i++) {
      const [a1, o1] = INDIA[i], [a2, o2] = INDIA[(i + 1) % INDIA.length];
      const n = Math.ceil(Math.hypot(a2 - a1, o2 - o1) / (step * .35));
      for (let k = 0; k < n; k++) push(a1 + (a2 - a1) * k / n, o1 + (o2 - o1) * k / n, true);
    }
    const geo = new THREE.BufferGeometry();
    geo.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3));
    geo.setAttribute('aColor', new THREE.Float32BufferAttribute(col, 3));
    geo.setAttribute('aSize', new THREE.Float32BufferAttribute(size, 1));
    geo.setAttribute('aSeed', new THREE.Float32BufferAttribute(seed, 1));
    mapMat = new THREE.ShaderMaterial({
      uniforms:{uTime:{value:0}, uPixel:{value:1}, uMotion:{value:reduceMotion ? 0 : 1}, uIntro:{value:reduceMotion ? 1 : 0}, uPulses:{value:pulses}, uPulseColors:{value:pcols}},
      vertexShader:PT_VS, fragmentShader:PT_FS, transparent:true, depthWrite:false, blending:THREE.AdditiveBlending
    });
    scene.add(new THREE.Points(geo, mapMat));
  }
  function buildDust(){
    const N = innerWidth < 700 ? 300 : 650, pos = [], seed = [];
    for (let i = 0; i < N; i++) { pos.push(rand(-34, 34), rand(0, 16), rand(-30, 22)); seed.push(R()); }
    const geo = new THREE.BufferGeometry();
    geo.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3));
    geo.setAttribute('aSeed', new THREE.Float32BufferAttribute(seed, 1));
    dustMat = new THREE.ShaderMaterial({
      uniforms:{uTime:{value:0}, uPixel:{value:1}, uMotion:{value:reduceMotion ? 0 : 1}},
      vertexShader:`attribute float aSeed; uniform float uTime; uniform float uPixel; uniform float uMotion; varying float vA;
        void main(){ vec3 p = position; float h = mod(p.y + uTime * (0.12 + aSeed * 0.3) * uMotion, 16.0); p.y = h - 3.0;
          p.x += sin(uTime * 0.15 + aSeed * 30.0) * 0.6 * uMotion;
          vec4 mv = modelViewMatrix * vec4(p, 1.0); gl_Position = projectionMatrix * mv;
          gl_PointSize = (0.6 + aSeed * 1.3) * uPixel * (90.0 / -mv.z);
          vA = smoothstep(0.0, 3.0, h) * (1.0 - smoothstep(10.0, 16.0, h)) * (0.16 + aSeed * 0.26); }`,
      fragmentShader:`varying float vA; void main(){ float d = length(gl_PointCoord - 0.5); if (d > 0.5) discard; gl_FragColor = vec4(0.68, 0.62, 1.0, smoothstep(0.5, 0.0, d) * vA); }`,
      transparent:true, depthWrite:false, blending:THREE.AdditiveBlending
    });
    scene.add(new THREE.Points(geo, dustMat));
  }
  function buildNodes(){
    const pgeo = new THREE.CylinderGeometry(.07, .07, 1, 10, 1, true); pgeo.translate(0, .5, 0);
    const rgeo = new THREE.RingGeometry(.3, .38, 48);
    const vs = `varying vec2 vUv; void main(){ vUv = uv; gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0); }`;
    const fs = `uniform vec3 uColor; uniform float uOpacity; varying vec2 vUv; void main(){ gl_FragColor = vec4(uColor, pow(1.0 - vUv.y, 1.3) * uOpacity); }`;
    CITIES.forEach((c, i) => {
      const base = proj(c.lat, c.lon, 0);
      const mat = new THREE.ShaderMaterial({uniforms:{uColor:{value:new THREE.Color(COLORS.turmeric)}, uOpacity:{value:.9}}, vertexShader:vs, fragmentShader:fs, transparent:true, depthWrite:false, blending:THREE.AdditiveBlending, side:THREE.DoubleSide});
      const pillar = new THREE.Mesh(pgeo, mat); pillar.position.copy(base); scene.add(pillar);
      const cap = new THREE.Sprite(new THREE.SpriteMaterial({map:glowTex, color:COLORS.turmeric, transparent:true, depthWrite:false, blending:THREE.AdditiveBlending}));
      cap.scale.setScalar(1.1); scene.add(cap);
      const ring = new THREE.Mesh(rgeo, new THREE.MeshBasicMaterial({color:COLORS.turmeric, transparent:true, opacity:.5, side:THREE.DoubleSide, depthWrite:false, blending:THREE.AdditiveBlending}));
      ring.rotation.x = -Math.PI / 2; ring.position.set(base.x, .03, base.z); scene.add(ring);
      let rring = null;
      if (c.relief) {
        rring = new THREE.Mesh(rgeo, new THREE.MeshBasicMaterial({color:COLORS.chili, transparent:true, opacity:.4, side:THREE.DoubleSide, depthWrite:false, blending:THREE.AdditiveBlending}));
        rring.rotation.x = -Math.PI / 2; rring.position.set(base.x, .04, base.z); scene.add(rring);
      }
      nodes.push({c, base, pillar, mat, cap, ring, rring, h:.2, target:1, phase:i * .137, sx:0, sy:0, bx:0, by:0, vis:true});
    });
    refreshHeights();
  }
  function refreshHeights(){
    const max = Math.max(1, ...CITIES.map(c => c.meals || 0));
    nodes.forEach(n => n.target = .5 + n.c.meals / max * 4.3);
    dirty('labels');
  }
  function buildArcs(){
    const PER = 18, total = CORRIDORS.length * PER;
    const pos = new Float32Array(total * 3), colA = new Float32Array(total * 3), sizeA = new Float32Array(total), seedA = new Float32Array(total);
    CORRIDORS.forEach(([a, b, relief], ai) => {
      const A = proj(city(a).lat, city(a).lon, .12), B = proj(city(b).lat, city(b).lon, .12);
      const mid = A.clone().add(B).multiplyScalar(.5); mid.y = A.distanceTo(B) * .38 + .6;
      const curve = new THREE.QuadraticBezierCurve3(A, mid, B);
      const lgeo = new THREE.BufferGeometry().setFromPoints(curve.getPoints(60));
      const lmat = new THREE.LineBasicMaterial({color:relief ? COLORS.chili : COLORS.jade, transparent:true, opacity:relief ? .16 : .28, depthWrite:false, blending:THREE.AdditiveBlending});
      scene.add(new THREE.Line(lgeo, lmat));
      const offs = []; for (let i = 0; i < PER; i++) { offs.push(i / PER + R() * .03); seedA[ai * PER + i] = R(); }
      arcs.push({curve, lmat, relief:!!relief, offs, speed:rand(.06, .1), start:ai * PER});
    });
    flowGeo = new THREE.BufferGeometry();
    flowGeo.setAttribute('position', new THREE.BufferAttribute(pos, 3));
    flowGeo.setAttribute('aColor', new THREE.BufferAttribute(colA, 3));
    flowGeo.setAttribute('aSize', new THREE.BufferAttribute(sizeA, 1));
    flowGeo.setAttribute('aSeed', new THREE.BufferAttribute(seedA, 1));
    flowMat = new THREE.ShaderMaterial({
      uniforms:{uTime:{value:0}, uPixel:{value:1}, uMotion:{value:0}, uIntro:{value:1}, uPulses:{value:pulses}, uPulseColors:{value:pcols}},
      vertexShader:PT_VS, fragmentShader:PT_FS, transparent:true, depthWrite:false, blending:THREE.AdditiveBlending
    });
    scene.add(new THREE.Points(flowGeo, flowMat));
    paintFlows();
  }
  function paintFlows(){
    const col = flowGeo.attributes.aColor.array, jade = new THREE.Color(COLORS.jade), chili = new THREE.Color(COLORS.chili);
    arcs.forEach(a => {
      const c = a.relief ? chili : jade, k = a.relief ? (surge ? 1.15 : .4) : .95;
      for (let i = 0; i < a.offs.length; i++) { const j = (a.start + i) * 3; col[j] = c.r * k; col[j+1] = c.g * k; col[j+2] = c.b * k; }
      a.lmat.opacity = a.relief ? (surge ? .5 : .14) : .28;
    });
    flowGeo.attributes.aColor.needsUpdate = true;
  }
  const labelEls = []; let blockers = [], blockAt = -1e9;
  function buildLabels(){
    const box = $('#labels');
    nodes.forEach(n => {
      const el = document.createElement('div');
      el.className = 'lbl' + (n.c.side === 'l' ? ' l' : '') + (n.c.relief ? ' relief' : '');
      el.innerHTML = `<span>${n.c.name}<small></small></span>`;
      if (!n.c.lbl) el.style.display = 'none';
      box.appendChild(el); labelEls.push(el);
    });
  }
  function updateLabels(){
    nodes.forEach((n, i) => {
      const el = labelEls[i];
      el.querySelector('small').textContent = fmt(n.c.meals) + ' meals';
      el.classList.toggle('sel', n.c.id === selectedId);
      el.style.display = (n.c.lbl || n.c.id === selectedId || (hover && hover.c.id === n.c.id)) ? '' : 'none';
    });
  }

  function resize(){
    W = innerWidth; H = innerHeight;
    renderer.setSize(W, H, false);
    camera.aspect = W / H; camera.updateProjectionMatrix();
    const px = renderer.getPixelRatio();
    mapMat.uniforms.uPixel.value = px; dustMat.uniforms.uPixel.value = px; flowMat.uniforms.uPixel.value = px;
    setView(view);
  }
  function fitRad(){
    const v = camera.fov * Math.PI / 180, th = Math.tan(v / 2), tw = th * camera.aspect;
    return Math.max(15 / tw, 11.5 / th) * .96;
  }
  function setView(v, instant){
    view = v; if (!ok) return;
    const fit = fitRad(), narrow = W < 900;
    if (v === 'command' || v === 'home') {
      if (selectedId && v === 'command') { const n = nodes.find(x => x.c.id === selectedId); goal.tx = n.base.x + (narrow ? 0 : 1.5); goal.tz = n.base.z + 1; goal.rad = fit * .58; }
      else {
        const vis = 2 * fit * Math.tan(camera.fov * Math.PI / 360) * camera.aspect;
        goal.tx = narrow ? 0 : v === 'home' ? .6 + vis * (W > 1200 ? .17 : .2) : .6; goal.tz = v === 'home' && !narrow ? .8 - 2 * fit * Math.tan(camera.fov * Math.PI / 360) * .1 : .8; goal.rad = v === 'home' && !narrow ? fit * (W > 1200 ? 1.4 : 1.48) : fit;
        if (v === 'home' && narrow) { goal.rad = fit * 1.02; goal.tz = .8 + 2 * goal.rad * Math.tan(camera.fov * Math.PI / 360) * .12; }
      }
    } else {
      const rad = fit * (v === 'home' ? (narrow ? 1.05 : .98) : 1.12), vis = 2 * rad * Math.tan(camera.fov * Math.PI / 360) * camera.aspect;
      goal.tx = narrow || v === 'impact' || v === 'volunteers' || v === 'my' ? 0 : v === 'home' ? -vis * .17 : -vis * .24; goal.tz = .8; goal.rad = rad;
    }
    if (instant) Object.assign(cam, goal);
  }
  function focusCity(id){ selectedId = id; setView(view); lastInteract = performance.now(); dirty('labels'); }
  function resetView(){ goal.az = 0; goal.pol = .9; selectedId = null; setView(view); dirty('labels'); }
  function setSurge(on){
    surge = on; if (!ok) return;
    nodes.forEach(n => { if (n.c.relief) n.mat.uniforms.uColor.value.set(on ? COLORS.chili : COLORS.turmeric); n.cap.material.color.set(n.c.relief && on ? COLORS.chili : COLORS.turmeric); });
    paintFlows();
  }
  function setDrift(on){ drift = on && !reduceMotion; }
  function pulse(cityId, color){
    if (!ok) return;
    const n = nodes.find(x => x.c.id === cityId); if (!n) return;
    const i = pulseIdx++ % 8, c = new THREE.Color(COLORS[color] || COLORS.turmeric);
    pulses[i].set(n.base.x, n.base.z, mapMat.uniforms.uTime.value, reduceMotion ? .5 : 1);
    pcols[i].set(c.r * .8, c.g * .8, c.b * .8);
  }

  function hit(x, y){
    let best = null, bd = 24;
    nodes.forEach(n => {
      if (!n.vis) return;
      const d = Math.hypot(n.sx - x, n.sy - y);
      const inCol = Math.abs(n.sx - x) < 10 && y > n.sy - 6 && y < n.by + 6;
      const dd = inCol ? Math.min(d, 8) : d;
      if (dd < bd) { bd = dd; best = n; }
    });
    return best;
  }
  function bindPointer(){
    let down = false, moved = 0, lx = 0, ly = 0, ptype = 'mouse';
    canvas.addEventListener('pointerdown', e => { down = true; moved = 0; lx = e.clientX; ly = e.clientY; ptype = e.pointerType; lastInteract = performance.now(); });
    addEventListener('pointermove', e => {
      if (down) {
        const dx = e.clientX - lx, dy = e.clientY - ly; moved += Math.abs(dx) + Math.abs(dy); lx = e.clientX; ly = e.clientY;
        goal.az -= dx * .005; if (ptype !== 'touch') goal.pol = clamp(goal.pol - dy * .004, .3, 1.3);
        lastInteract = performance.now();
      } else if (e.target === canvas && view === 'command') {
        const h = hit(e.clientX, e.clientY);
        if (h !== hover) { hover = h; canvas.style.cursor = h ? 'pointer' : 'grab'; showTip(); dirty('labels'); }
      } else if (hover) { hover = null; showTip(); }
    });
    addEventListener('pointerup', e => {
      if (!down) return; down = false;
      if (moved < 7 && e.target === canvas && view === 'command') {
        const h = hit(e.clientX, e.clientY);
        if (h) App.selectCity(h.c.id);
      }
    });
    addEventListener('pointercancel', () => { down = false; });
    canvas.addEventListener('wheel', e => { e.preventDefault(); goal.rad = clamp(goal.rad * (1 + Math.sign(e.deltaY) * .08), 12, 90); lastInteract = performance.now(); }, {passive:false});
    canvas.addEventListener('pointerleave', () => { if (hover) { hover = null; showTip(); } });
  }
  function showTip(){
    const tip = $('#tip');
    if (!hover) { tip.classList.remove('show'); return; }
    const c = hover.c, active = S.batches.filter(b => b.cityId === c.id && (b.status === 'listed' || b.status === 'matched' || b.status === 'picked')).length;
    tip.innerHTML = `<h3>${c.name}</h3><dl><dt>Meals rescued today</dt><dd>${fmt(c.meals)}</dd><dt>Batches in play</dt><dd>${active}</dd><dt>Volunteers online</dt><dd>${c.vols}</dd><dt>Meals still needed</dt><dd>${fmt(c.need)}</dd></dl>${c.relief ? '<p>Relief camp active nearby</p>' : ''}`;
    tip.classList.add('show');
  }

  function loop(now){
    requestAnimationFrame(loop);
    if (document.hidden) { last = now; return; }
    const dt = Math.min(.05, (now - last) / 1000); last = now;
    const time = (now - start) / 1000;
    mapMat.uniforms.uTime.value = time; dustMat.uniforms.uTime.value = time; flowMat.uniforms.uTime.value = time;
    if (!reduceMotion) mapMat.uniforms.uIntro.value = Math.min(1, time / 2.6);

    const k = 1 - Math.exp(-dt * 3.2);
    cam.az += (goal.az - cam.az) * k; cam.pol += (goal.pol - cam.pol) * k; cam.rad += (goal.rad - cam.rad) * k;
    cam.tx += (goal.tx - cam.tx) * k; cam.tz += (goal.tz - cam.tz) * k;
    const idle = (now - lastInteract) > 9000;
    swayAmp += (((drift && idle) ? 1 : 0) - swayAmp) * Math.min(1, dt * .8);
    const az = cam.az + Math.sin(time * .11) * .22 * swayAmp;
    const sp = Math.sin(cam.pol);
    camera.position.set(cam.tx + cam.rad * sp * Math.sin(az), cam.rad * Math.cos(cam.pol), cam.tz + cam.rad * sp * Math.cos(az));
    camera.lookAt(cam.tx, 0, cam.tz);

    nodes.forEach(n => {
      n.h += (n.target - n.h) * Math.min(1, dt * 2);
      n.pillar.scale.y = n.h;
      const sel = n.c.id === selectedId, hov = hover === n;
      n.cap.position.set(n.base.x, n.h + .05, n.base.z);
      n.cap.scale.setScalar(sel ? 1.9 : hov ? 1.6 : 1.1);
      const ph = reduceMotion ? .35 : (time * .45 + n.phase) % 1;
      n.ring.scale.setScalar(1 + ph * 2.2); n.ring.material.opacity = (1 - ph) * .5;
      if (n.rring) {
        const rp = reduceMotion ? .3 : (time * (surge ? .9 : .35) + n.phase) % 1;
        n.rring.scale.setScalar(1 + rp * (surge ? 4.2 : 2.2)); n.rring.material.opacity = (1 - rp) * (surge ? .9 : .32);
      }
    });

    const pos = flowGeo.attributes.position.array, size = flowGeo.attributes.aSize.array, P = V;
    arcs.forEach(a => {
      const sp2 = reduceMotion ? 0 : a.speed * (a.relief && surge ? 2.4 : 1);
      a.offs.forEach((o, i) => {
        const u = ((o + time * sp2) % 1 + 1) % 1;
        a.curve.getPoint(u, P);
        const j = a.start + i; pos[j*3] = P.x; pos[j*3+1] = P.y; pos[j*3+2] = P.z;
        size[j] = (1.4 + (a.relief && surge ? .8 : 0)) * Math.sin(u * Math.PI);
      });
    });
    flowGeo.attributes.position.needsUpdate = true; flowGeo.attributes.aSize.needsUpdate = true;

    renderer.render(scene, camera);

    // screen-space positions for hover, labels and tooltip
    const showLabels = (view === 'command' || view === 'home') && W >= 900;
    if (showLabels && now - blockAt > 700) { blockAt = now; blockers = [...document.querySelectorAll('.topbar, .surge-banner, #view-command .hero, #view-command .panel, #view-command .log, #view-command .legend, #home .h-top, #home .auth, #home .h-head .h-title, #home .h-sub2, #home .h-bottom')].map(e => e.getBoundingClientRect()).filter(r => r.width && r.height); }
    nodes.forEach((n, i) => {
      P.set(n.base.x, n.h + .05, n.base.z).project(camera);
      n.sx = (P.x * .5 + .5) * W; n.sy = (-P.y * .5 + .5) * H; n.vis = P.z < 1;
      P.set(n.base.x, 0, n.base.z).project(camera);
      n.bx = (P.x * .5 + .5) * W; n.by = (-P.y * .5 + .5) * H;
      if (showLabels) {
        const el = labelEls[i]; el.style.transform = `translate(${n.sx.toFixed(1)}px,${n.sy.toFixed(1)}px)`;
        const lw = 118, x0 = n.c.side === 'l' ? n.sx - lw - 14 : n.sx - 6, x1 = n.c.side === 'l' ? n.sx + 6 : n.sx + lw + 14;
        const occ = blockers.some(r => x1 > r.left - 6 && x0 < r.right + 6 && n.sy + 20 > r.top - 6 && n.sy - 20 < r.bottom + 6);
        if (occ !== n.occ) { n.occ = occ; el.classList.toggle('occ', occ); }
      }
    });
    if (hover) { const tip = $('#tip'); tip.style.transform = `translate(${Math.min(W - 230, hover.sx + 18)}px, ${Math.max(10, hover.sy - 60)}px)`; }
  }
  return {init, pulse, setView, focusCity, resetView, setSurge, setDrift, refreshHeights, updateLabels, get ok(){ return ok; }};
})();

/* ---------- rendering ---------- */
const D = new Set(); let rafPending = false;
function dirty(...keys){ keys.forEach(k => D.add(k)); if (!rafPending) { rafPending = true; requestAnimationFrame(flush); } }
function flush(){
  rafPending = false;
  const all = D.has('all');
  if (all || D.has('counts')) renderCounts();
  if (all || D.has('needs') || D.has('city')) renderLeft();
  if (all || D.has('log')) renderLog();
  if (all || D.has('feed')) renderFeed();
  if (S.view === 'dispatch' && (all || D.has('queue'))) renderQueue();
  if (S.view === 'dispatch' && (all || D.has('detail'))) renderDetail();
  if (S.view === 'volunteers' && (all || D.has('lb'))) renderVolunteers();
  if (S.view === 'impact' && (all || D.has('impact'))) renderImpact();
  if (S.view === 'my' && (all || D.has('my') || D.has('feed') || D.has('queue') || D.has('detail') || D.has('lb'))) updateMy();
  if (all || D.has('labels')) Scene.updateLabels();
  D.clear();
  updateTimers();
}

function setCount(el, n){
  const s = fmt(n);
  if (el.dataset.s === s) return;
  if ((el.dataset.s || '').length !== s.length) {
    el.innerHTML = [...s].map(ch => /\d/.test(ch) ? `<span class="d"><span>${'0123456789'.split('').join('<br>')}</span></span>` : `<span class="sep">${ch}</span>`).join('');
    void el.offsetWidth;
  }
  [...s].forEach((ch, i) => { const d = el.children[i]; if (d && d.classList.contains('d')) d.firstElementChild.style.transform = `translateY(${-Number(ch)}em)`; });
  el.dataset.s = s; el.setAttribute('aria-label', s + ' meals');
}
function renderCounts(){
  setCount($('#mealCount'), S.totals.meals);
  $('#kgStat').textContent = fmt(S.totals.kg);
  $('#co2Stat').textContent = (S.totals.kg * 2.5 / 1000).toFixed(1);
  $('#pickStat').textContent = S.totals.pickup;
  const st = S.streams, tot = stTotal(st) || 1, pc = k => Math.round(st[k] / tot * 100);
  setHTML($('#hStreams'), `<p>${t('st_split')}</p>${splitHtml(st)}<div class="hkeys">${STREAMS.map(s => `<span><i class="sw-dot" style="background:${s.col}"></i>${s.label} <b>${s.k === 'landfill' ? 0 : pc(s.k)}%</b></span>`).join('')}</div>`);
  const hm = document.getElementById('hMeals'); if (hm) hm.textContent = fmt(S.totals.meals);
  [['lpPeople','people'],['lpFeed','feed'],['lpWet','wet'],['lpDry','dry']].forEach(([id, k]) => { const e = document.getElementById(id); if (e) e.textContent = pc(k) + '%'; });
}
function renderLeft(){
  const el = $('#leftPanel');
  if (S.city) {
    const c = city(S.city);
    const active = S.batches.filter(b => b.cityId === c.id && ['listed','matched','picked'].includes(b.status)).length;
    const recv = c.receivers.filter(r => r.type !== 'compost').length;
    el.innerHTML = `<div class="panel-head"><h2 class="cf-name">${c.name}</h2><button class="x" data-act="clear-city" aria-label="Show all cities">×</button></div>
      <dl class="cf-grid"><div><dt>Meals rescued today</dt><dd>${fmt(c.meals)}</dd></div><div><dt>Batches in play</dt><dd>${active}</dd></div>
      <div><dt>Volunteers online</dt><dd>${c.vols}</dd></div><div><dt>Meals still needed</dt><dd>${fmt(c.need)}</dd></div></dl>
      <p class="small muted cf-note">${recv} partner receivers${c.relief ? ', including an active flood relief camp' : ''}.</p>
      <button class="btn" data-act="city-dispatch">${t('city_open')}</button>`;
  } else {
    const list = [...CITIES].sort((a, b) => b.need - a.need).slice(0, innerHeight < 980 ? 4 : 5), max = list[0].need || 1;
    el.innerHTML = `<div class="panel-head"><h2>${t('needs')}</h2><span class="faint small">${t('needs_sub')}</span></div>` +
      list.map(c => `<button class="need" data-city="${c.id}"><span class="n-name">${c.name}${c.relief ? `<em class="tag-relief">Relief camp</em>` : ''}</span><span class="n-val">${fmt(c.need)}</span><span class="bar"><i style="width:${Math.max(4, c.need / max * 100).toFixed(0)}%"></i></span></button>`).join('');
  }
}
const EV_COL = {new:'var(--turmeric)', match:'var(--lilac)', deliver:'var(--jade)', fail:'var(--chili)', warn:'var(--chili)', surge:'var(--chili)', info:'var(--ink-3)'};
function renderLog(){
  $('#log').innerHTML = S.events.slice(0, 6).map(e => `<li><time>${hhmm(e.t)}</time><i class="dot" style="background:${EV_COL[e.type]}"></i><span>${esc(e.text)}</span></li>`).join('');
}
function statusLabel(b){
  return {listed:'Waiting for a match', matched:`${(b.volunteer || 'A volunteer').split(' ')[0]} is on the way`, picked:'In transit', delivered:'Delivered', composted:'Sent to compost'}[b.status];
}
function ringHtml(b, size, big){
  const r = size / 2 - (big ? 6 : 4), C = 2 * Math.PI * r;
  return `<span class="ring${big ? ' bigring' : ''}" data-exp="${b.id}" data-c="${C.toFixed(1)}" style="width:${size}px;height:${size}px"><svg width="${size}" height="${size}" aria-hidden="true"><circle cx="${size/2}" cy="${size/2}" r="${r}" class="trk"/><circle cx="${size/2}" cy="${size/2}" r="${r}" class="prg" stroke-dasharray="${C.toFixed(1)}" stroke-dashoffset="0"/></svg><b></b></span>`;
}
function itemHtml(b, current){
  const c = city(b.cityId);
  return `<button class="item${b.fresh ? ' fresh' : ''}" data-open="${b.id}"${current ? ' aria-current="true"' : ''}>
    ${ringHtml(b, 46)}
    <span style="min-width:0"><span class="t1">${esc(b.food)}</span><span class="t2">${esc(b.donor)}, ${c.name}. ${b.kg} kg</span><span class="st st-${b.status}">${statusLabel(b)}</span></span>
    <span class="grade ${b.grade}" aria-label="Grade ${b.grade}">${b.grade}</span></button>`;
}
function renderFeed(){
  let list = S.batches.filter(b => b.status !== 'composted');
  if (S.city) list = list.filter(b => b.cityId === S.city);
  $('#feedCity').innerHTML = S.city ? `<span class="city-chip">${city(S.city).name} only<button data-act="clear-city" aria-label="${t('all_cities')}">×</button></span>` : '';
  $('#feedCount').textContent = `${list.filter(b => b.status !== 'delivered').length} active`;
  $('#feed').innerHTML = list.slice(0, 30).map(b => itemHtml(b)).join('') || `<p class="small muted" style="padding:8px">No batches listed here right now. New listings from donors appear the moment they are posted.</p>`;
}
function updateTimers(){
  $$('[data-exp]').forEach(el => {
    const b = S.batches.find(x => x.id === el.dataset.exp); if (!b) return;
    const prg = el.querySelector('.prg'), lab = el.querySelector('b'), C = +el.dataset.c, big = el.classList.contains('bigring');
    if (b.status === 'delivered' || b.status === 'composted') {
      prg.style.strokeDashoffset = 0; prg.style.stroke = b.status === 'delivered' ? 'var(--jade)' : 'var(--chili)';
      lab.innerHTML = b.status === 'delivered' ? '✓' : '×'; return;
    }
    const frac = clamp(remMs(b) / b.shelf, 0, 1), m = remMin(b);
    prg.style.strokeDashoffset = (C * (1 - frac)).toFixed(1);
    prg.style.stroke = frac > .5 ? 'var(--jade)' : frac > .2 ? 'var(--turmeric)' : 'var(--chili)';
    if (big) lab.innerHTML = m >= 60 ? `${Math.floor(m/60)}:${String(m%60).padStart(2,'0')}<small>${t('h_left')}</small>` : `${m}<small>${t('min_left')}</small>`;
    else lab.textContent = m >= 60 ? (m / 60).toFixed(1) + 'h' : m + 'm';
  });
}

/* dispatch */
const QF = {
  waiting: b => b.status === 'listed',
  progress: b => b.status === 'matched' || b.status === 'picked',
  c: b => b.grade === 'C' && b.status !== 'delivered',
  soon: b => b.status === 'listed' && remMin(b) <= 60
};
function renderQueue(){
  const base = S.batches.filter(b => !S.city || b.cityId === S.city);
  const chips = [['waiting','f_waiting'],['progress','f_progress'],['soon','f_soon'],['c','f_c']];
  $('#queueChips').innerHTML = chips.map(([k, l]) => `<button class="chip" data-qf="${k}" aria-pressed="${S.qFilter === k}">${t(l)}<b>${base.filter(QF[k]).length}</b></button>`).join('');
  $('#queueCity').innerHTML = S.city ? `<span class="city-chip">${city(S.city).name} only<button data-act="clear-city" aria-label="${t('all_cities')}">×</button></span>` : '';
  const list = base.filter(QF[S.qFilter]).sort((a, b) => a.expiresAt - b.expiresAt);
  $('#queueCount').textContent = `${base.filter(QF.waiting).length} waiting`;
  $('#queue').innerHTML = list.map(b => itemHtml(b, b.id === S.selected)).join('') ||
    `<p class="small muted" style="padding:8px">Nothing here. ${S.qFilter === 'waiting' ? 'Every listed batch has a receiver.' : 'Try another filter.'}</p>`;
}
function factorRow(label, sub, v, max){
  const f = v / max, col = f > .66 ? 'var(--jade)' : f > .33 ? 'var(--turmeric)' : 'var(--chili)';
  return `<div class="f"><span>${label}<small>${sub}</small></span><span class="track"><i style="width:${(f*100).toFixed(0)}%;background:${col}"></i></span><span>${v}/${max}</span></div>`;
}
function mbar(label, v){ return `<div><span>${label}</span><span class="track"><i style="width:${(v*100).toFixed(0)}%;background:var(--lilac)"></i></span></div>`; }
const TYPE = {people:'Shelter or kitchen', relief:'Relief camp', animal:'Animal shelter', compost:'Compost unit'};
function renderDetail(){
  const el = $('#detail'), b = S.batches.find(x => x.id === S.selected);
  if (!b) { el.innerHTML = `<div class="empty"><p>${t('empty_detail')}</p></div>`; return; }
  const c = city(b.cityId), f = b.factors, rm = remMin(b);
  const safeTemp = b.tempC >= 60 || b.tempC <= 5;
  const reco = b.grade === 'A' ? `Grade A. Safe for people. Deliver within ${fmtDur(rm)}.`
    : b.grade === 'B' ? `Grade B. Safe for people if it reaches a nearby receiver within ${fmtDur(Math.min(rm, 90))}.`
    : `Grade C. Not safe for people. Route it to an animal shelter or a compost unit so nothing goes to landfill.`;
  let html = `<div class="d-head"><div><h2 class="d-title">${esc(b.food)}</h2>
      <p class="muted">${esc(b.donor)}, ${c.name}. ${b.kg} kg, about ${b.servings} servings${b.veg ? ', vegetarian' : ', non-vegetarian'}${b.al.length ? `, contains ${b.al.join(' and ')}` : ''}.</p></div>
      <span class="bid faint">${b.id}</span></div>
    <div class="clockrow">${ringHtml(b, innerWidth < 900 ? 100 : 132, true)}
      <div><div class="gradebig"><span class="g ${b.grade}">${b.grade}</span><div><strong>${b.score}/100</strong><div class="faint small">${t('safety')}</div></div></div>
      <div class="factors">
        ${factorRow('Freshness', `${b.hours.toFixed(1)} h since cooking`, f.fresh, 40)}
        ${factorRow('Temperature', `${b.tempC} °C, ${safeTemp ? 'safe zone' : 'danger zone'}`, f.temp, 30)}
        ${factorRow('Packaging', b.packaging, f.pack, 15)}
        ${factorRow('Handling', `${b.checks} of 4 hygiene checks`, f.hand, 15)}
      </div></div></div>
    <p class="reco ${b.grade}">${reco}</p>
    <p class="probe faint">Probe reading ${b.tempC} °C when listed. Hot food should stay at 60 °C or above, and cold food at 5 °C or below.</p>
    <div class="seg-block"><div class="panel-head" style="margin-bottom:10px"><h3>Segregation at source</h3><span class="faint small">Four streams, Solid Waste Management Rules, 2026</span></div>${splitHtml(b.streams)}${keysHtml(b.streams, true)}</div>`;

  if (b.status === 'listed') {
    const ms = matches(b);
    html += `<div class="panel-head m-head"><h3>${t('matches')}</h3><span class="switch">${t('auto')}<button role="switch" aria-checked="${S.auto}" data-act="auto" aria-label="${t('auto')}"></button></span></div>
      <p class="faint small" style="margin:0 0 4px">Score weighs distance 35%, need 30%, capacity 20% and diet fit 15%${S.surge ? '. Relief camps get a surge boost' : ''}.</p>` +
      (ms.length ? ms.map((m, i) => `<div class="match"><div><div class="m-name">${esc(m.r.name)}${i === 0 ? '<span class="best">Best match</span>' : ''}</div>
        <div class="faint small">${TYPE[m.r.type]}, ${m.r.distKm.toFixed(1)} km away, room for ${m.r.capacity} servings${m.r.vegOnly ? ', vegetarian only' : ''}</div></div>
        <div class="m-right"><span class="score">${m.score}</span><button class="btn${i ? ' ghost' : ''}" data-assign="${m.r.id}">${t('assign')}</button></div>
        <div class="mbars">${mbar('Distance', m.dist)}${mbar('Need', m.need)}${mbar('Capacity', m.cap)}${mbar('Diet fit', m.diet)}</div></div>`).join('')
      : `<p class="muted">No receiver within range can take this batch. Widen the search radius or split the batch.</p>`);
    html += `<div class="d-actions">${b.grade !== 'C' ? `<button class="btn danger" data-act="unsafe">${t('unsafe')}</button>` : ''}</div>`;
  } else {
    const steps = b.status === 'composted'
      ? [['listed','Listed by donor'],['graded',`Safety check: grade ${b.grade}`],['composted','Sent to compost unit']]
      : [['listed','Listed by donor'],['graded',`Safety check: grade ${b.grade}`],['matched',`Matched to ${b.receiver.name}`],['sanitised','Hygiene check: gloves, sanitised crate, probe'],['picked',`Picked up by ${b.volunteer}`],['delivered','Delivered and signed for'],['rated', b.rating ? `Receiver rated it ${b.rating} out of 5` : 'Receiver rating']];
    const doneMap = {}; b.log.forEach(x => doneMap[x.s] = x.t);
    const nowIdx = steps.findIndex(s => !(s[0] in doneMap));
    html += `<div class="custody"><div><h3>${t('custody')}</h3><ol class="steps">${steps.map((s, i) =>
        `<li class="${s[0] in doneMap ? 'done' : i === nowIdx ? 'now' : ''}"><span>${esc(s[1])}</span><time>${s[0] in doneMap ? hhmm(doneMap[s[0]]) : ''}</time></li>`).join('')}</ol>
      ${b.status === 'matched' ? `<p class="eta">${esc(b.volunteer)} is about ${b.eta} min from ${esc(b.donor)}. If there is no response in 6 min, the next volunteer is assigned automatically.</p>` : ''}
      ${b.status === 'picked' ? `<p class="eta">On the way to ${esc(b.receiver.name)}, ${b.receiver.distKm.toFixed(1)} km.</p>` : ''}</div>
      <div class="qrbox"><div class="qr" id="qr" role="img" aria-label="QR code for batch ${b.id}"></div><p class="faint">Volunteer and receiver scan this at each handover.</p></div></div>`;
    if (b.status === 'matched' || b.status === 'picked') html += `<div class="d-actions"><button class="btn ghost" data-act="advance">${t('advance')}</button></div>`;
  }
  el.innerHTML = html;
  const q = $('#qr', el);
  if (q && typeof QRCode !== 'undefined') { try { new QRCode(q, {text:`kindbytes:batch:${b.id}`, width:112, height:112, colorDark:'#0A0D1D', colorLight:'#ffffff', correctLevel:QRCode.CorrectLevel.M}); } catch (e) {} }
  else if (q) q.innerHTML = `<div style="width:112px;height:112px;display:grid;place-items:center;color:#0A0D1D;font-size:12px;line-height:1.3">${b.id}</div>`;
}

/* volunteers */
function demand(d, h){
  const hh = h < 5 ? h + 24 : h, wk = d >= 4 ? 1.35 : 1;
  return Math.round(2 + 6 * Math.exp(-((h - 9) ** 2) / 2) + 20 * Math.exp(-((h - 14) ** 2) / 3) + 32 * wk * Math.exp(-((hh - 22) ** 2) / 2.2));
}
function supply(d, h){
  return Math.round(3 + 26 * (d >= 5 ? 1.2 : 1) * Math.exp(-((h - 18.5) ** 2) / 4) + (d >= 5 ? 18 * Math.exp(-((h - 11) ** 2) / 5) : 0) + 8 * Math.exp(-((h - 13) ** 2) / 1.5));
}
const DAYS = ['Mon','Tue','Wed','Thu','Fri','Sat','Sun'], DAYS_FULL = ['Monday','Tuesday','Wednesday','Thursday','Friday','Saturday','Sunday'];
const hLabel = h => h === 0 ? '12 am' : h < 12 ? `${h} am` : h === 12 ? '12 pm' : `${h - 12} pm`;
function renderVolunteers(){
  const sorted = [...VOLS].sort((a, b) => b.cr - a.cr);
  $('#onlineCount').textContent = `${VOLS.filter(v => v.on).length} online now`;
  $('#lb').innerHTML = `<tr><th>#</th><th>Volunteer</th><th class="num">Deliveries</th><th class="num">Eco-credits</th><th class="num">Streak</th></tr>` +
    sorted.slice(0, 10).map((v, i) => `<tr><td class="rk">${i + 1}</td><td class="nm">${v.n}${v.on ? '<i class="on" title="Online"></i>' : ''}<small>${city(v.c).name}</small><span class="bdg" title="${v.b.join(', ')}">${v.b[0]}${v.b.length > 1 ? ` +${v.b.length - 1}` : ''}</span></td><td class="num">${v.d}</td><td class="num">${fmt(v.cr)}</td><td class="num">${v.s} d</td></tr>`).join('');

  let cells = '<span></span>';
  for (let h = 0; h < 24; h++) cells += `<span class="h">${h % 6 === 0 ? hLabel(h) : ''}</span>`;
  let maxD = 0, maxS = 0, maxG = 0, minG = 0, best = null;
  const grid = [];
  for (let d = 0; d < 7; d++) { grid.push([]); for (let h = 0; h < 24; h++) {
    const de = demand(d, h), su = supply(d, h), g = de - su;
    grid[d].push({de, su, g}); maxD = Math.max(maxD, de); maxS = Math.max(maxS, su); maxG = Math.max(maxG, g); minG = Math.min(minG, g);
    if (!best || g > best.g) best = {d, h, de, su, g};
  }}
  for (let d = 0; d < 7; d++) {
    cells += `<span class="dl">${DAYS[d]}</span>`;
    for (let h = 0; h < 24; h++) {
      const {de, su, g} = grid[d][h]; let bg;
      if (S.heatMode === 'demand') bg = `rgba(245,184,61,${(.06 + .9 * de / maxD).toFixed(2)})`;
      else if (S.heatMode === 'vol') bg = `rgba(168,151,255,${(.06 + .9 * su / maxS).toFixed(2)})`;
      else bg = g > 0 ? `rgba(255,94,91,${(.08 + .85 * g / maxG).toFixed(2)})` : `rgba(63,219,177,${(.06 + .6 * g / minG).toFixed(2)})`;
      cells += `<span class="c" style="background:${bg}" title="${DAYS[d]} ${hLabel(h)}: ${de} pickups expected, ${su} volunteers usually online"></span>`;
    }
  }
  $('#heat').innerHTML = cells;
  const isVol = S.user && S.user.role === 'vol';
  $('#insight').innerHTML = `<p><strong>Biggest gap: ${DAYS_FULL[best.d]}, ${hLabel(best.h)} to ${hLabel((best.h + 1) % 24)}.</strong> About ${best.de} pickups are expected, when usually only ${best.su} volunteers are online. Dinner and wedding buffets close around this time.</p>` +
    (isVol ? '' : `<button class="btn" data-act="broadcast" data-slot="${DAYS_FULL[best.d]} ${hLabel(best.h)}">${t('request_vol')}</button>`);

  const BADGES = [
    ['Night owl','10 pickups after 9 pm, when most surplus appears','var(--lilac)','<path d="M20 14.5A8 8 0 1 1 9.5 4a6.5 6.5 0 0 0 10.5 10.5z"/>'],
    ['Zero spoil','25 deliveries with every temperature check passed','var(--jade)','<path d="M12 3l7 3v5c0 4.5-3 8-7 10-4-2-7-5.5-7-10V6z"/><path d="m9 12 2 2 4-4"/>'],
    ['Monsoon hero','Delivered to a relief camp during surge mode','var(--chili)','<path d="M7 15a4 4 0 0 1 .6-8A5 5 0 0 1 17 8a3.5 3.5 0 0 1 0 7z"/><path d="M9 18l-1 2M13 18l-1 2M17 18l-1 2"/>'],
    ['Streak keeper','Pickups on 7 days in a row','var(--turmeric)','<path d="M12 3c1 4 5 5 5 10a5 5 0 0 1-10 0c0-3 2-4 2-6 1 1 2 2 3 2 0-3-1-4 0-6z"/>'],
    ['First mile','Completed a first pickup','var(--ink-2)','<path d="M6 21V4h11l-2 4 2 4H6"/>']
  ];
  $('#badges').innerHTML = BADGES.map(([n, d, c, p]) => {
    const earned = VOLS.filter(v => v.b.includes(n)).length;
    return `<div class="badge"><span class="ic" style="background:color-mix(in srgb, ${c} 16%, transparent);color:${c}"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">${p}</svg></span><span><strong>${n}</strong><span>${d}. Earned by ${earned} of the top 14.</span></span></div>`;
  }).join('');
}

/* impact */
function renderImpact(){
  const monthMeals = 118640 + S.totals.meals, monthKg = monthMeals * .4;
  const kpis = [[fmt(monthMeals),'k_meals'],[(monthKg / 1000).toFixed(1),'k_kg'],[(monthKg * 2.5 / 1000).toFixed(0),'k_co2'],[fmt(monthMeals / 2.6),'k_people'],['412','k_donors']];
  $('#kpis').innerHTML = kpis.map(([v, l]) => `<div><dt>${t(l)}</dt><dd>${v}</dd></div>`).join('');

  const g = {A:812 + S.grades.A, B:264 + S.grades.B, C:71 + S.grades.C}, tot = g.A + g.B + g.C;
  $('#gradeMix').innerHTML = `<div class="stack"><i style="width:${g.A/tot*100}%;background:var(--jade)"></i><i style="width:${g.B/tot*100}%;background:var(--turmeric)"></i><i style="width:${g.C/tot*100}%;background:var(--chili)"></i></div>` +
    [['A','Safe for people',g.A],['B','Safe if delivered soon',g.B],['C','Animals or compost',g.C]].map(([k, l, v]) => `<div class="gm-row"><span class="grade ${k}">${k}</span><span>${l}</span><span>${fmt(v)} batches, ${(v / tot * 100).toFixed(0)}%</span></div>`).join('') +
    `<p class="small muted" style="margin:12px 0 0">Grade C batches still avoided landfill by going to animal shelters and compost units.</p>`;

  const top = [...CITIES].sort((a, b) => b.meals - a.meals).slice(0, 7), mx = top[0].meals || 1;
  $('#topCities').innerHTML = top.map(c => `<div class="tc-row"><span>${c.name}</span><span class="track"><i style="width:${(c.meals / mx * 100).toFixed(0)}%"></i></span><span>${fmt(c.meals)}</span></div>`).join('');

  const mst = {}; addStreams(mst, S.streams, 1); const scale = monthKg / (stTotal(mst) || 1); Object.keys(mst).forEach(k => mst[k] *= scale);
  const mx2 = Math.max(mst.people, 1);
  $('#hierarchy').innerHTML = [['Reuse','Edible food to people','people'],['Recovery','Animal feed','feed'],['Recovery','Biogas and compost','wet'],['Recycling','Dry packaging to MRFs','dry'],['Disposal','Landfill','landfill']].map(([lv, l, k]) => {
    const s = STREAMS.find(x => x.k === k);
    return `<div class="hier"><span>${lv}<small>${l}</small></span><span class="track"><i style="width:${Math.max(k === 'landfill' ? 0 : 1.5, mst[k] / mx2 * 100).toFixed(1)}%;background:${s.col}"></i></span><span>${(mst[k] / 1000).toFixed(1)} t</span></div>`;
  }).join('') + `<p class="small muted" style="margin:12px 0 0">Nothing reached landfill this month. Grade C food and kitchen trimmings went to animal feed, biogas or compost, and packaging went to Material Recovery Facilities.</p>`;
  const cities = [...CITIES].sort((a, b) => b.w - a.w).slice(0, 5);
  $('#compliance').innerHTML = `<dl class="cmp-kpis"><div><dt>Bulk generators on KindBytes</dt><dd>286</dd></div><div><dt>Holding a valid certificate</dt><dd>94%</dd></div><div><dt>Certificates issued this month</dt><dd>${fmt(271 + Math.floor(S.totals.meals / 900))}</dd></div></dl>` +
    cities.map(c => { const l = bwgList(c.id), p = Math.round(l.filter(x => x.status === 'valid').length / l.length * 100); return `<div class="tc-row"><span>${c.name}</span><span class="track"><i style="width:${p}%;background:var(--jade)"></i></span><span>${p}%</span></div>`; }).join('') +
    `<p class="small muted" style="margin:12px 0 0">Share of bulk waste generators in each city with a valid off-site processing certificate for this month.</p>`;

  $('#sdg').innerHTML = `<div class="sdg-row"><strong>SDG 2, Zero hunger</strong><span>${fmt(monthMeals)} meals served to shelters, kitchens and relief camps this month.</span></div>
    <div class="sdg-row"><strong>SDG 12.3, Halve food waste</strong><span>${(monthKg / 1000).toFixed(1)} t of food kept out of landfill this month.</span></div>
    <div class="sdg-row"><strong>SDG 13, Climate action</strong><span>About ${(monthKg * 2.5 / 1000).toFixed(0)} t of CO₂e avoided, at 2.5 kg CO₂e per kg of food not wasted.</span></div>`;
  renderForecast();
}
function renderForecast(){
  const box = $('#forecast'), W = Math.max(300, box.clientWidth || 640), H = 230, pl = 52, pr = 14, pt = 26, pb = 34;
  const today = new Date(); today.setHours(0, 0, 0, 0);
  const days = [];
  for (let i = 0; i < 14; i++) {
    const d = new Date(today); d.setDate(d.getDate() + i + 1);
    const dow = d.getDay(), wk = dow === 6 || dow === 0 ? 1.38 : dow === 5 ? 1.15 : 1;
    const noise = (Math.sin((i + 1) * 12.9898) * 43758.5453) % 1;
    const v = Math.round((1850 + i * 14) * wk * (.97 + Math.abs(noise) * .06));
    days.push({d, v, lo:v * .87, hi:v * 1.13});
  }
  const maxV = Math.ceil(Math.max(...days.map(x => x.hi)) / 500) * 500, minV = 1000;
  const x = i => pl + i * (W - pl - pr) / 13, y = v => pt + (1 - (v - minV) / (maxV - minV)) * (H - pt - pb);
  const line = days.map((p, i) => `${i ? 'L' : 'M'}${x(i).toFixed(1)},${y(p.v).toFixed(1)}`).join('');
  const band = days.map((p, i) => `${i ? 'L' : 'M'}${x(i).toFixed(1)},${y(p.hi).toFixed(1)}`).join('') + days.slice().reverse().map((p, j) => `L${x(13 - j).toFixed(1)},${y(p.lo).toFixed(1)}`).join('') + 'Z';
  const ticks = []; for (let v = minV; v <= maxV; v += 500) ticks.push(v);
  const peakI = days.reduce((bi, p, i) => p.v > days[bi].v ? i : bi, 0);
  const lab = d => d.toLocaleDateString('en-IN', {weekday:'short', day:'numeric'});
  const every = W < 420 ? 3 : W < 640 ? 2 : 1;
  box.innerHTML = `<svg width="${W}" height="${H}" viewBox="0 0 ${W} ${H}" role="img" aria-label="Forecast of surplus food for the next 14 days">
    <defs><linearGradient id="fg" x1="0" x2="0" y1="0" y2="1"><stop offset="0" stop-color="#F5B83D" stop-opacity=".28"/><stop offset="1" stop-color="#F5B83D" stop-opacity=".04"/></linearGradient></defs>
    ${ticks.map(v => `<line x1="${pl}" x2="${W - pr}" y1="${y(v)}" y2="${y(v)}" stroke="rgba(164,170,255,.1)"/><text x="${pl - 8}" y="${y(v) + 4}" text-anchor="end">${fmt(v)}</text>`).join('')}
    <path d="${band}" fill="url(#fg)"/>
    <path d="${line}" fill="none" stroke="#F5B83D" stroke-width="2.2" stroke-linejoin="round"/>
    ${days.map((p, i) => `<circle cx="${x(i)}" cy="${y(p.v)}" r="${i === peakI ? 5 : 3}" fill="${i === peakI ? '#F5B83D' : '#0A0D1D'}" stroke="#F5B83D" stroke-width="2"/>`).join('')}
    <text x="${x(peakI)}" y="${y(days[peakI].v) - 12}" text-anchor="middle" style="fill:#EFEDF8;font-weight:700">Peak ${fmt(days[peakI].v)} kg</text>
    ${days.map((p, i) => i % every === 0 ? `<text x="${x(i)}" y="${H - 10}" text-anchor="middle">${lab(p.d)}</text>` : '').join('')}
    <line id="fcHair" x1="0" x2="0" y1="${pt}" y2="${H - pb}" stroke="rgba(239,237,248,.4)" stroke-dasharray="3 3" opacity="0"/>
    ${days.map((p, i) => `<rect data-fi="${i}" x="${x(i) - (W - pl - pr) / 26}" y="${pt}" width="${(W - pl - pr) / 13}" height="${H - pt - pb}" fill="transparent"/>`).join('')}
  </svg>`;
  const read = $('#fcRead'), hair = $('#fcHair', box);
  const setRead = i => { const p = days[i]; read.textContent = `${p.d.toLocaleDateString('en-IN', {weekday:'long', day:'numeric', month:'short'})}: about ${fmt(p.v)} kg expected, likely between ${fmt(p.lo)} and ${fmt(p.hi)} kg.`; hair.setAttribute('x1', x(i)); hair.setAttribute('x2', x(i)); hair.setAttribute('opacity', 1); };
  $$('rect[data-fi]', box).forEach(r => r.addEventListener('pointerenter', () => setRead(+r.dataset.fi)));
  box.onpointerleave = () => { hair.setAttribute('opacity', 0); read.textContent = `Weekends bring about 38% more surplus, mostly from weddings and banquets. Schedule extra volunteers for ${lab(days[peakI].d)}.`; };
  box.onpointerleave();
}

/* ---------- app controller ---------- */
function toast(msg){
  const el = $('#toast'); el.textContent = msg; el.classList.add('show');
  clearTimeout(toast.t); toast.t = setTimeout(() => el.classList.remove('show'), 3200);
}
function applyI18n(){
  document.documentElement.lang = S.lang;
  $$('[data-i18n]').forEach(el => { el.textContent = t(el.dataset.i18n); });
  $$('.lang button').forEach(b => b.setAttribute('aria-pressed', b.dataset.lang === S.lang));
  const nm = $('#navMy'); if (nm) nm.textContent = S.user && S.user.role !== 'coord' ? t((ORG_TYPES[S.user.orgType] || {}).noReg ? 'my_ind' : 'my_' + myKind(S.user)) : t('my_ind');
  const mm = $('.menu-my'); if (mm) mm.textContent = nm.textContent;
}
function setView(v){
  if (!S.user) return;
  if (v === 'my' && (S.user.role === 'coord' || !S.myBuilt)) v = 'command';
  closeMenu();
  S.view = v; document.body.dataset.view = v;
  $$('.nav button').forEach(b => b.dataset.go === v ? b.setAttribute('aria-current', 'page') : b.removeAttribute('aria-current'));
  $$('.view').forEach(s => s.classList.toggle('active', s.id === 'view-' + v));
  if (v === 'dispatch' && !S.batches.some(b => b.id === S.selected)) {
    const first = S.batches.filter(b => b.status === 'listed' && (!S.city || b.cityId === S.city)).sort((a, b) => a.expiresAt - b.expiresAt)[0];
    S.selected = first ? first.id : null;
  }
  $('#tip').classList.remove('show');
  Scene.setView(v);
  if (innerWidth < 900) window.scrollTo(0, 0);
  dirty('all');
}
function selectCity(id){
  S.city = id; Scene.focusCity(id);
  dirty('city','feed','queue','labels');
}
function setSurge(on){
  call('POST', '/api/sim/', {surge:on}, on ? 'Surge mode on. Relief camps now get grade A food first.' : 'Surge mode off. Normal routing resumed.');
}
const App = { selectCity };
window.App = App;

document.addEventListener('click', e => {
  const el = e.target.closest('button'); if (!el || el.disabled) return;
  if (handleAuthClick(el)) return;
  if (el.dataset.go) return setView(el.dataset.go);
  if (el.dataset.lang) { S.lang = el.dataset.lang; applyI18n(); window.dispatchEvent(new CustomEvent('kb:lang', {detail:S.lang})); if (S.user && S.myBuilt) buildMy(); return dirty('all'); }
  if (el.id === 'surgeBtn') return setSurge(!S.surge);
  if (el.id === 'resetView') { S.city = null; Scene.resetView(); return dirty('city','feed','queue'); }
  if (el.id === 'driftBtn') { const on = el.getAttribute('aria-pressed') !== 'true'; el.setAttribute('aria-pressed', on); return Scene.setDrift(on); }
  if (el.dataset.city) return selectCity(el.dataset.city);
  if (el.dataset.open) {
    S.selected = el.dataset.open;
    if (S.view !== 'dispatch') { const b = S.batches.find(x => x.id === S.selected); if (b && b.status !== 'listed') S.qFilter = b.status === 'delivered' || b.status === 'composted' ? S.qFilter : 'progress'; else S.qFilter = 'waiting'; setView('dispatch'); }
    else dirty('queue','detail');
    return;
  }
  if (el.dataset.qf) { S.qFilter = el.dataset.qf; return dirty('queue'); }
  if (el.dataset.mode) { S.heatMode = el.dataset.mode; $$('#heatSeg button').forEach(b => b.setAttribute('aria-pressed', b.dataset.mode === S.heatMode)); return dirty('lb'); }
  if (el.dataset.assign) {
    const b = S.batches.find(x => x.id === S.selected); if (!b) return;
    call('POST', `/api/batches/${b.id}/assign/`, {receiver:el.dataset.assign}, r => `Assigned to ${r.receiver}. ${r.volunteer} has been notified.`); return;
  }
  const act = el.dataset.act;
  if (act === 'clear-city') { S.city = null; Scene.focusCity(null); return dirty('city','feed','queue','labels'); }
  if (act === 'city-dispatch') { S.selected = null; S.qFilter = 'waiting'; return setView('dispatch'); }
  if (act === 'auto') { const on = !S.auto; call('POST', '/api/sim/', {auto:on}, on ? 'Auto-dispatch on. Unclaimed batches are assigned after 20 seconds.' : 'Auto-dispatch off. Assign each batch yourself.'); return; }
  if (act === 'unsafe') {
    const b = S.batches.find(x => x.id === S.selected); if (!b) return;
    call('POST', `/api/batches/${b.id}/unsafe/`, {}, `${b.id} marked unsafe. It will not go to people.`); return;
  }
  if (act === 'advance') {
    const b = S.batches.find(x => x.id === S.selected); if (!b) return;
    call('POST', `/api/batches/${b.id}/advance/`, {}, r => r.status === 'picked' ? `${b.volunteer} picked up ${b.id}.` : `${b.id} delivered.`); return;
  }
  if (act === 'broadcast') { if (S.user && S.user.role === 'vol') return; call('POST', '/api/volunteers/broadcast/', {slot:el.dataset.slot}, r => `Shift request sent to ${r.sent} volunteers for ${el.dataset.slot}.`); return; }
  if (el.id === 'csrBtn') return openCsr();
  if (el.id === 'csrClose') return $('#csrDialog').close();
});
function openCsr(){
  const donor = $('#donorSel').value, i = DONORS.indexOf(donor);
  const kg = 620 + (i * 373) % 1500, meals = Math.round(kg / .4), recv = 6 + (i * 5) % 11, pass = 94 + (i * 3) % 6;
  const month = new Date().toLocaleDateString('en-IN', {month:'long', year:'numeric'});
  $('#csrTitle').textContent = `${donor}, ${month}`; $('#csrTitle').style.display = ''; $('#csrDialog').classList.remove('wide');
  $('#csrBody').innerHTML = `<p>In ${month}, ${esc(donor)} donated ${fmt(kg)} kg of surplus food through KindBytes. It became about ${fmt(meals)} meals for ${recv} partner shelters, community kitchens and relief camps. Food that was not safe for people went to animal shelters and compost units, so none of it reached landfill.</p>
    <p>This avoided an estimated ${(kg * 2.5 / 1000).toFixed(1)} t of CO₂e. ${pass}% of batches passed the safety check at pickup, and every handover was logged with a QR scan. The donation supports SDG 2 (zero hunger) and SDG 12.3 (halving food waste).</p>
    <p class="small faint">Estimates use 0.4 kg per meal and 2.5 kg CO₂e per kg of food not wasted. Figures in this demo are simulated.</p>`;
  $('#csrDialog').showModal();
}
document.addEventListener('keydown', e => {
  if (!S.user || e.target.closest('input,select,textarea') || $('#csrDialog').open) return;
  if (e.key === 'Escape') closeMenu();
  const map = {'0':'my','1':'command','2':'dispatch','3':'volunteers','4':'impact'};
  if (map[e.key]) setView(map[e.key]);
  else if (e.key === 's' || e.key === 'S') setSurge(!S.surge);
  else if (e.key === 'r' || e.key === 'R') { S.city = null; Scene.resetView(); dirty('city','feed','queue'); }
  else if (e.key === 'Escape' && S.city) { S.city = null; Scene.focusCity(null); dirty('city','feed','queue','labels'); }
});
let rsz; addEventListener('resize', () => { clearTimeout(rsz); rsz = setTimeout(() => { if (S.view === 'impact') renderForecast(); }, 150); });

/* ---------- waste streams ---------- */
const STREAMS = [
  {k:'people', label:'People', dest:'Shelters, kitchens, relief camps', col:'#3FDBB1'},
  {k:'feed', label:'Animal feed', dest:'Gaushalas, animal shelters', col:'#A897FF'},
  {k:'wet', label:'Biogas or compost', dest:'Green bin, wet waste', col:'#9CCB5B'},
  {k:'dry', label:'Recycling', dest:'Blue bin, dry waste to MRF', col:'#62A8FF'},
  {k:'landfill', label:'Landfill', dest:'Last resort, target zero', col:'#FF5E5B'}
];
const fmtKg = v => (v < 10 ? (Math.round(v * 10) / 10).toLocaleString('en-IN') : fmt(v)) + ' kg';
const stTotal = st => STREAMS.reduce((a, s) => a + (st[s.k] || 0), 0);
function splitHtml(st){
  const tot = stTotal(st) || 1;
  return `<div class="split" role="img" aria-label="${STREAMS.map(s => `${s.label} ${Math.round((st[s.k] || 0) / tot * 100)}%`).join(', ')}">${STREAMS.filter(s => st[s.k] > 0).map(s => `<i style="width:${(st[s.k] / tot * 100).toFixed(2)}%;background:${s.col}"></i>`).join('')}</div>`;
}
function keysHtml(st, dest){
  return `<div class="skeys">${STREAMS.map(s => `<span><i class="sw-dot" style="background:${s.col}"></i><span>${s.label}${dest ? `<small>${s.dest}</small>` : ''}</span><b>${fmtKg(st[s.k] || 0)}</b></span>`).join('')}</div>`;
}
function addStreams(target, st, scale = 1){ STREAMS.forEach(s => target[s.k] = (target[s.k] || 0) + (st[s.k] || 0) * scale); }

const ORG_TYPES = {
  restaurant:{label:'Restaurant', kind:'donor', grp:'give'},
  cafe:{label:'Cafe or bakery', kind:'donor', grp:'give'},
  hotel:{label:'Hotel', kind:'donor', grp:'give'},
  banquet:{label:'Banquet hall or caterer', kind:'donor', grp:'give'},
  mess:{label:'Hostel, college or corporate mess', kind:'donor', grp:'give'},
  hospital:{label:'Hospital kitchen', kind:'donor', grp:'give'},
  individual:{label:'Individual or household', kind:'donor', grp:'people', noReg:true},
  event:{label:'Wedding, party or event host', kind:'donor', grp:'people', noReg:true},
  processor:{label:'Biogas, compost or recycling unit', kind:'receiver', grp:'proc', rtype:'compost', unit:'kg'},
  ulb:{label:'Urban local body', kind:'ulb', grp:'gov'},
  ngo:{label:'Shelter or community kitchen', kind:'receiver', grp:'ngo', rtype:'people', unit:'servings'},
  home:{label:'Children’s or elders’ home', kind:'receiver', grp:'ngo', rtype:'people', unit:'servings'},
  relief:{label:'Disaster relief organization', kind:'receiver', grp:'ngo', rtype:'relief', unit:'servings'},
  animal:{label:'Animal shelter or gaushala', kind:'receiver', grp:'ngo', rtype:'animal', unit:'kg'}
};
const REG = {
  donor:{label:'FSSAI licence or registration number', hint:'14 digits, printed on your FSSAI licence', re:/^\d{14}$/, msg:'Enter the 14-digit FSSAI number.', ph:'13622011000457'},
  ngo:{label:'NGO Darpan unique ID', hint:'From ngodarpan.gov.in, for example DL/2019/0234567', re:/^[A-Za-z]{2}\/\d{4}\/\d{7}$/, msg:'Use the format DL/2019/0234567.', ph:'DL/2019/0234567'},
  animal:{label:'Registration or NGO Darpan ID', hint:'Animal Welfare Board recognition number or NGO Darpan ID', re:/^.{4,}$/, msg:'Enter your registration number.', ph:''},
  processor:{label:'Pollution Control Board authorisation number', hint:'Issued by your State Pollution Control Board', re:/^.{4,}$/, msg:'Enter your authorisation number.', ph:''},
  ulb:{label:'ULB code', hint:'Your urban local body code', re:/^.{3,}$/, msg:'Enter your ULB code.', ph:''}
};
const regKey = type => ORG_TYPES[type].kind === 'donor' ? 'donor' : ['ngo','home','relief'].includes(type) ? 'ngo' : type;
const myKind = u => !u ? null : u.role === 'org' ? u.kind : u.role;
const first = n => String(n || '').split(' ')[0];
const initials = n => String(n || '?').split(/\s+/).filter(Boolean).slice(0, 2).map(w => w[0]).join('').toUpperCase();

const ICON = {
  org:'<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M3 2v7c0 1.1.9 2 2 2h4a2 2 0 0 0 2-2V2"/><path d="M7 2v20"/><path d="M21 15V2a5 5 0 0 0-5 5v6c0 1.1.9 2 2 2h3zm0 0v7"/></svg>',
  vol:'<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><circle cx="5.5" cy="17.5" r="3.5"/><circle cx="18.5" cy="17.5" r="3.5"/><path d="M15 6h2l3 7.5M5.5 17.5 9 10h6l3.5 7.5M9 10 7.5 6H5"/></svg>',
  ind:'<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M3 10.5 12 3l9 7.5"/><path d="M5 9v12h14V9"/><path d="M12 17s-3-1.8-3-4a1.7 1.7 0 0 1 3-1 1.7 1.7 0 0 1 3 1c0 2.2-3 4-3 4z"/></svg>',
  ngo:'<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M12 20s-7-4.4-7-10a4 4 0 0 1 7-2.6A4 4 0 0 1 19 10c0 5.6-7 10-7 10z"/><path d="M9 11h6M12 8v6"/></svg>',
  chev:'<svg class="chev" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="m9 6 6 6-6 6"/></svg>',
  back:'<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="m15 6-6 6 6 6"/></svg>',
  ok:'<svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="m5 12 5 5 9-10"/></svg>',
  pin:'<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M12 21s-7-6.2-7-11.5A7 7 0 0 1 19 9.5C19 14.8 12 21 12 21z"/><circle cx="12" cy="9.5" r="2.5"/></svg>'
};

/* ---------- auth UI ---------- */
const CITY_OPTS = sel => CITIES.map(c => `<option value="${c.id}"${c.id === sel ? ' selected' : ''}>${c.name}</option>`).join('');
function fld(name, label, o = {}){
  return `<label class="fld"><span>${label}</span><input class="in" name="${name}" type="${o.type || 'text'}"${o.ph ? ` placeholder="${o.ph}"` : ''}${o.auto ? ` autocomplete="${o.auto}"` : ''}${o.extra || ''}>${o.hint ? `<small>${o.hint}</small>` : ''}<span class="err" data-err="${name}"></span></label>`;
}
const cityArea = () => `<div class="row2"><label class="fld"><span>City</span><select class="in" name="city">${CITY_OPTS('del')}</select></label>${fld('area', 'Area or PIN code', {ph:'Karol Bagh or 110005', auto:'postal-code'})}</div>`;
const pwBlock = (label = 'Create a password') => `<label class="fld"><span>${label}</span><span class="pw"><input class="in" name="pw" type="password" autocomplete="new-password" placeholder="At least 8 characters"><button type="button" data-pwt>Show</button></span><span class="meter"><i id="pwMeter"></i></span><small>Use 8 or more characters with a letter and a number.</small><span class="err" data-err="pw"></span></label>`;
const optGroup = (grp, items, single, sel = []) => `<div class="opts" data-grp="${grp}"${single ? ' data-single' : ''}>${items.map(([v, l]) => `<button type="button" class="opt" data-val="${v}" aria-pressed="${sel.includes(v)}">${l}</button>`).join('')}</div>`;

const selectedOpts = (root, grp) => $$(`.opts[data-grp="${grp}"] .opt[aria-pressed="true"]`, root).map(b => b.dataset.val);
function showErrs(form, errs){
  $$('[data-err]', form).forEach(e => e.textContent = '');
  $$('.in', form).forEach(i => i.removeAttribute('aria-invalid'));
  Object.entries(errs).forEach(([k, msg]) => {
    const e = $(`[data-err="${k}"]`, form); if (e) e.textContent = msg;
    const i = $(`[name="${k}"]`, form); if (i && i.classList.contains('in')) i.setAttribute('aria-invalid', 'true');
  });
  const firstBad = Object.keys(errs)[0];
  if (firstBad) { const i = $(`[name="${firstBad}"]`, form) || $(`[data-err="${firstBad}"]`, form); if (i) { i.scrollIntoView({block:'center', behavior:'smooth'}); if (i.focus) i.focus({preventScroll:true}); } }
}
const cleanPhone = p => String(p || '').replace(/[\s-]/g, '').replace(/^(\+91|91|0)(?=\d{10}$)/, '');

(function homeScroll(){
  const home = $('#home'); if (!home) return;
  home.addEventListener('scroll', () => { document.body.classList.toggle('home-deep', home.scrollTop > innerHeight * .45); }, {passive:true});
  const items = $$('.reveal', home);
  if (reduceMotion || !('IntersectionObserver' in window)) { items.forEach(el => el.classList.add('shown')); return; }
  const io = new IntersectionObserver(es => es.forEach(e => { if (e.isIntersecting) { e.target.classList.add('shown'); io.unobserve(e.target); } }), {root:home, threshold:.18});
  items.forEach(el => io.observe(el));
})();
function showHome(){
  document.body.classList.add('show-home'); document.body.classList.remove('guest');
  S.view = 'home'; document.body.dataset.view = 'home';
  $('#home').scrollTop = 0; document.body.classList.remove('home-deep');
  S.city = null; Scene.focusCity(null);
  closeMenu(); Scene.setView('home'); dirty('labels');
  window.dispatchEvent(new CustomEvent('kb:home'));
}
const ROLE_LABEL = {org:'Organization', vol:'Volunteer'};
function setupUser(u){
  $('#whoInit').textContent = initials(u.role === 'org' ? u.org : u.name);
  $('#whoName').textContent = u.role === 'org' ? u.org : u.name;
  $('#whoD').innerHTML = `<strong>${esc(u.role === 'org' ? u.org : u.name)}</strong>${u.role === 'org' ? ((ORG_TYPES[u.orgType] || {}).label || '') : ROLE_LABEL[u.role]}${u.city ? `, ${city(u.city).name}` : ''}`;
}
async function signIn(u, msg){
  S.user = u; S.myBuilt = null; S.local = {chk:{}, probe:{}, dist:{}};
  document.body.classList.remove('home-deep', 'show-home', 'guest');
  setupUser(u); applyI18n();
  await sync();
  buildMy(); applyI18n(); setView('my');
  if (msg) toast(msg);
}
async function signOut(){
  try { await api('POST', '/api/auth/logout/'); } catch (e) {}
  S.user = null; S.myRec = null; S.myBuilt = null; S.me = null;
  showHome(); toast('You are logged out.'); sync();
}
function closeMenu(){ const m = $('#menu'); if (m) { m.classList.remove('open'); $('#whoBtn').setAttribute('aria-expanded', 'false'); } }

/* ---------- my space ---------- */
const CATS = [['veg','Cooked veg'],['nonveg','Cooked non-veg'],['bakery','Bakery'],['raw','Fruit and vegetables'],['sweets','Sweets and dairy']];
const PREP = [[.5,'Less than 1 hour ago'],[1.5,'1 to 2 hours ago'],[3,'2 to 4 hours ago'],[5,'4 to 6 hours ago'],[7.5,'More than 6 hours ago']];
const TEMPS = [['hot','Kept hot, 60 °C or more',63],['cold','Chilled, 5 °C or less',4],['room','Room temperature',30]];
const HYG = ['Staff wore gloves and hairnets','Food-grade containers','Labelled with the time it was cooked','Crates and counters sanitised'];
const VCHK = ['Hands washed and sanitised','Gloves and mask on','Crate sanitised and lined','Thermometer probe ready'];
const PROBE = [['hot','60 °C or more'],['cold','5 °C or less'],['mid','Between 5 and 60 °C']];
const REPORT_TYPES = ['Food dumped in the open','Overflowing bin','Unsegregated waste at an event','Dirty community fridge'];
const REP_STATUS = {new:['Sent to ward team','warn'], assigned:['Team on the way','info'], cleared:['Cleared','ok']};
const monthName = () => new Date().toLocaleDateString('en-IN', {month:'long', year:'numeric'});
function setHTML(el, html){ if (el && el._h !== html) { el._h = html; el.innerHTML = html; } }
const kpiHtml = list => list.map(([l, v]) => `<div><dt>${l}</dt><dd>${v}</dd></div>`).join('');
const MY_SUB = {
  donor: u => (ORG_TYPES[u.orgType] || {}).noReg
    ? `${u.org}, ${u.area}, ${city(u.city).name}. Share extra food from home or a function. KindBytes grades it and sends a volunteer to collect it.`
    : `${u.org}, ${u.area}, ${city(u.city).name}. List surplus in under a minute. KindBytes grades it, finds the receiver and keeps the paperwork.`,
  receiver: u => `${u.org}, ${city(u.city).name}. Tell us how much you can take today, and matching ${ORG_TYPES[u.orgType].unit === 'servings' ? 'food' : 'feedstock'} comes to you first.`,
  ulb: u => `Bulk waste generator compliance and citizen hotspot reports for ${city(u.city).name}.`,
  vol: u => `${u.vehicle || 'Two-wheeler'} volunteer in ${u.area}, ${city(u.city).name}. Pickups near you are sorted by how soon the food expires.`,
  ind: u => `${u.area}, ${city(u.city).name}. Share extra food, find free meals, or report a waste hotspot.`
};
function buildMy(){
  const u = S.user, el = $('#view-my');
  if (!u || u.role === 'coord') { el.innerHTML = ''; S.myBuilt = null; return; }
  const kind = myKind(u);
  el.innerHTML = `<div class="my-hello"><div><h1>${t('namaste')}, ${esc(first(u.name))}</h1><p>${esc(MY_SUB[kind](u))}</p></div><dl class="minikpi" id="myKpi"></dl></div>` + MY_BUILD[kind](u);
  S.myBuilt = kind;
  if (kind === 'donor') updatePreview();
  updateMy();
}
const MY_BUILD = {
  donor: u => `<div class="my-col"><div class="panel">
      <div class="panel-head"><h2>List surplus food</h2><span class="faint small">Takes under a minute</span></div>
      <form id="listForm" novalidate>
        <label class="fld"><span>What is it?</span><input class="in" name="food" list="foodList" placeholder="Veg biryani, dal and rice, bread loaves"><datalist id="foodList">${FOODS.map(f => `<option value="${f.n}">`).join('')}</datalist><span class="err" data-err="food"></span></label>
        <div class="fld"><span>Category</span>${optGroup('cat', CATS, true, ['veg'])}</div>
        <div class="row2">
          <label class="fld"><span>Quantity in kg</span><input class="in" name="kg" type="number" min="1" max="2000" value="24" inputmode="numeric"><span class="err" data-err="kg"></span></label>
          <label class="fld"><span>Cooked or prepared</span><select class="in" name="hours">${PREP.map(([v, l], i) => `<option value="${v}"${i === 1 ? ' selected' : ''}>${l}</option>`).join('')}</select></label>
        </div>
        <div class="fld"><span>How is it stored right now?</span>${optGroup('temp', TEMPS.map(x => [x[0], x[1]]), true, ['hot'])}</div>
        <div class="fld"><span>Packaging</span>${optGroup('pack', [['Sealed','Sealed'],['Covered','Covered'],['Open','Open']], true, ['Covered'])}</div>
        <div class="fld"><span>Hygiene checklist</span><div class="checks">${HYG.map(h => `<label class="check"><input type="checkbox" name="hyg" value="${h}" checked> <span>${h}</span></label>`).join('')}</div></div>
        <div class="preview" id="lPreview" aria-live="polite"></div>
        <button class="btn full" type="submit">Post listing</button>
      </form></div></div>
    <div class="my-col">
      <div class="panel"><div class="panel-head"><h2>My listings</h2><span class="faint small" id="myListCount"></span></div><div id="myListings"></div></div>
      <div class="panel" id="complPanel"></div>
    </div>`,
  receiver: u => {
    const o = ORG_TYPES[u.orgType], people = o.unit === 'servings';
    return `<div class="my-col"><div class="panel">
      <div class="panel-head"><h2>What can you take today?</h2><span class="faint small">Updates matching instantly</span></div>
      <form id="capForm" novalidate>
        <label class="fld"><span>${people ? 'Servings you can take' : 'Kilograms you can take'}</span><input class="in" name="cap" type="number" min="1" value="${S.myRec.capacity}" inputmode="numeric"></label>
        ${people ? `<label class="check"><input type="checkbox" name="veg"> <span>Vegetarian food only</span></label>` : ''}
        <label class="fld" style="margin-top:8px"><span>Open to receive until</span><select class="in" name="until"><option>8 pm</option><option selected>10 pm</option><option>Midnight</option><option>Open 24 hours</option></select></label>
        <label class="check"><input type="checkbox" name="urgent" checked> <span>${people ? 'We are short of food today. Put us first in line.' : 'We have spare capacity today. Send us more.'}</span></label>
        <button class="btn" type="submit" style="margin-top:8px">Update availability</button>
      </form></div>
      <div class="panel"><div class="panel-head"><h2>How matching works</h2></div>
        <p class="small muted" style="margin:0">Each batch is scored for every nearby receiver on distance (35%), need (30%), capacity (20%) and diet fit (15%). ${people ? 'Grade A and B food comes to kitchens and shelters.' : 'Grade C food and wet waste come to you, so nothing goes to landfill.'} Keeping your capacity current is the fastest way to receive more.</p></div>
    </div>
    <div class="my-col"><div class="panel"><div class="panel-head"><h2>On the way to you</h2><span class="faint small" id="incCount"></span></div><div id="incoming"></div></div></div>`;
  },
  ulb: u => `<div class="my-col"><div class="panel"><div class="panel-head"><h2>Bulk waste generators in ${city(u.city).name}</h2><span class="faint small">Monthly certificates</span></div><div class="tbl-wrap"><table class="tbl" id="bwgTbl"></table></div></div></div>
    <div class="my-col">
      <div class="panel"><div class="panel-head"><h2>Hotspots reported by citizens</h2><span class="faint small" id="hsCount"></span></div><div id="hotspots"></div></div>
      <div class="panel"><div class="panel-head"><h2>Where ${city(u.city).name}’s surplus went today</h2></div><div id="cityStreams"></div></div>
    </div>`,
  vol: u => `<div class="my-col"><div class="panel"><div class="panel-head"><h2>Pickups near you</h2><span class="faint small" id="nearCount"></span></div><div id="nearby"></div></div></div>
    <div class="my-col">
      <div class="panel"><div class="panel-head"><h2>Your pickup</h2></div><div id="task"></div></div>
      <div class="panel"><div class="panel-head"><h2>Report a waste hotspot</h2><span class="faint small">Goes to the ward sanitation team</span></div>${reportFormHtml()}<div id="volReports" style="margin-top:8px"></div></div>
      <div class="panel"><div class="panel-head"><h2>Your badges</h2></div><div id="myBadges"></div></div>
    </div>`,
  ind: u => `<div class="my-col">
      <div class="panel"><div class="panel-head"><h2>Share extra food</h2><span class="faint small">From home or a family function</span></div>
        <form id="shareForm" novalidate>
          <label class="fld"><span>What is it?</span><input class="in" name="food" placeholder="Pulao and raita from a birthday party"><span class="err" data-err="food"></span></label>
          <div class="row2">
            <label class="fld"><span>Enough for how many people?</span><input class="in" name="servings" type="number" min="1" value="25" inputmode="numeric"></label>
            <label class="fld"><span>Cooked</span><select class="in" name="hours">${PREP.slice(0, 4).map(([v, l], i) => `<option value="${v}"${i === 1 ? ' selected' : ''}>${l}</option>`).join('')}</select></label>
          </div>
          <div class="fld"><span>Food type</span>${optGroup('diet', [['veg','Vegetarian'],['nonveg','Non-vegetarian']], true, ['veg'])}</div>
          <div class="fld"><span>Stored</span>${optGroup('temp', [['hot','Kept hot'],['cold','In the fridge'],['room','Room temperature']], true, ['hot'])}</div>
          ${fld('area', 'Pickup area', {extra:` value="${esc(u.area)}"`})}
          <p class="note-box warm" id="shareNote"></p>
          <button class="btn full" type="submit">Request a pickup</button>
        </form></div>
      <div class="panel"><div class="panel-head"><h2>Report a waste hotspot</h2><span class="faint small">Goes to the ward sanitation team</span></div>
        ${reportFormHtml()}</div>
    </div>
    <div class="my-col">
      <div class="panel"><div class="panel-head"><h2>Free meals near you</h2><span class="faint small">Today in ${city(u.city).name}</span></div><div id="meals"></div></div>
      <div class="panel"><div class="panel-head"><h2>Your requests and reports</h2></div><div id="myReports"></div></div>
    </div>`
};

function reportFormHtml(){
  return `<form id="reportForm" novalidate>
    <div class="fld"><span>What did you see?</span>${optGroup('rtype', REPORT_TYPES.map(x => [x, x]), true, [REPORT_TYPES[0]])}</div>
    <label class="fld"><span>Where?</span><input class="in" name="where" placeholder="Landmark or street, for example behind the vegetable market"><span class="err" data-err="where"></span></label>
    <label class="fld"><span>Photo, optional</span><input class="in" name="photo" type="file" accept="image/*" capture="environment"><span class="thumb" id="thumb"></span></label>
    <button class="btn full" type="submit">Send report</button>
  </form>`;
}
function readListing(form){
  const fd = new FormData(form), cat = selectedOpts(form, 'cat')[0] || 'veg', tk = selectedOpts(form, 'temp')[0] || 'hot';
  return {food:String(fd.get('food') || '').trim(), cat, veg:cat !== 'nonveg', kg:Math.round(+fd.get('kg') || 0), hours:+fd.get('hours') || 1.5,
    tempC:TEMPS.find(x => x[0] === tk)[2], packaging:selectedOpts(form, 'pack')[0] || 'Covered', checks:fd.getAll('hyg').length};
}
function gradeLine(b){
  const hot = b.tempC > 5 && b.tempC < 60 && !['raw','bakery'].includes(b.cat);
  if (b.grade === 'A') return 'Grade A. Safe for people. It goes to a shelter or community kitchen first.';
  if (b.grade === 'B') return `Grade B. Safe for people if it is delivered within 90 minutes.${hot ? ' Keep it hot or chilled to raise the grade.' : ''}`;
  return `Grade C. Not safe for people${hot && b.hours > 2 ? ', because it has been in the 5 to 60 °C danger zone too long' : ''}. It goes to animal feed or biogas, never to landfill.`;
}
function updatePreview(){
  const form = $('#listForm'); if (!form) return;
  const b = readListing(form); if (!(b.kg > 0)) b.kg = 1;
  scoreBatch(b); computeStreams(b);
  $('#lPreview').innerHTML = `<div class="pv-top"><span class="grade ${b.grade}">${b.grade}</span><div><strong>Safety score ${b.score} of 100</strong><span>${gradeLine(b)}</span></div></div>
    <span class="faint small">Segregated at source into four streams</span>${splitHtml(b.streams)}${keysHtml(b.streams, true)}`;
}
async function postListing(form){
  const L = readListing(form), errs = {};
  if (L.food.length < 2) errs.food = 'Say what the food is.';
  if (!(L.kg > 0)) errs.kg = 'Enter the quantity in kg.';
  showErrs(form, errs); if (Object.keys(errs).length) return;
  const btn = form.querySelector('button[type=submit]'); if (btn) btn.disabled = true;
  try {
    const r = await api('POST', '/api/batches/', L);
    form.food.value = ''; updatePreview();
    toast(`Posted ${r.id}, grade ${r.grade}. Finding the best receiver now.`);
    await sync();
  } catch (e) { if (e.data && e.data.errors) showErrs(form, e.data.errors); else toast(e.message); }
  finally { if (btn) btn.disabled = false; }
}
async function postReport(form){
  const fd = new FormData(form), where = String(fd.get('where') || '').trim(), type = selectedOpts(form, 'rtype')[0] || REPORT_TYPES[0], errs = {};
  if (where.length < 3) errs.where = 'Add a landmark or street so the team can find it.';
  showErrs(form, errs); if (Object.keys(errs).length) return;
  const f = fd.get('photo');
  try {
    await api('POST', '/api/reports/', {type, where, photo: !!(f && f.size)});
    form.where.value = ''; form.photo.value = ''; const th = $('#thumb'); th.style.display = 'none'; th.innerHTML = '';
    toast('Report sent to the ward sanitation team. Updates appear here.');
    await sync();
  } catch (e) { if (e.data && e.data.errors) showErrs(form, e.data.errors); else toast(e.message); }
}
const cityCode = id => city(id).name.slice(0, 3).toUpperCase();
function bwgList(cityId){ return (S.bwg && S.bwg[cityId]) || []; }
function openDialog(title, html, wide){
  const d = $('#csrDialog');
  d.classList.toggle('wide', !!wide);
  $('#csrTitle').textContent = title; $('#csrTitle').style.display = title ? '' : 'none';
  $('#csrBody').innerHTML = html;
  if (!d.open) d.showModal();
}
function openCert(o){
  const now = new Date(), day = now.getDate(), mm = String(now.getMonth() + 1).padStart(2, '0');
  const base = (o.daily || 140) * day * .92, st = {people:base * .56, feed:base * .07, wet:base * .32, dry:base * .05, landfill:0};
  if (o.extra) addStreams(st, o.extra);
  const tot = stTotal(st), no = `KB/${cityCode(o.city)}/${now.getFullYear()}-${mm}/${String(100 + (o.org.length * 37) % 900).padStart(4, '0')}`;
  const c = city(o.city), recv = c.receivers.filter(r => r.type === 'people' || r.type === 'relief').length;
  const rows = [['Edible food to people', `${recv} shelters and community kitchens`, st.people], ['Animal feed', 'Karuna Animal Shelter', st.feed], ['Wet waste', 'GreenCycle compost unit and city biogas plant', st.wet], ['Dry packaging', 'Material Recovery Facility', st.dry], ['Sent to landfill', 'None', 0]];
  openDialog('', `<div class="cert">
    <div class="cert-top"><div class="brand"><svg viewBox="0 0 32 32" aria-hidden="true"><path d="M4 16h24a12 12 0 0 1-24 0z" fill="#E0A020"/><circle cx="10.5" cy="10" r="2.2" fill="#1FA283"/><circle cx="16" cy="5.8" r="2.2" fill="#6E5BD8"/><circle cx="21.5" cy="10" r="2.2" fill="#1FA283"/></svg>KindBytes</div><div class="cert-no">Certificate no. ${no}<br>Issued ${now.toLocaleDateString('en-IN', {day:'numeric', month:'long', year:'numeric'})}</div></div>
    <h3>Off-site processing certificate</h3>
    <p class="sub">Record of surplus food and wet waste handed over for off-site use and processing, for submission to the urban local body under the Extended Bulk Waste Generator Responsibility provisions of the Solid Waste Management Rules, 2026.</p>
    <div class="meta"><div><b>Bulk waste generator</b>${esc(o.org)}</div><div><b>FSSAI licence</b>${esc(o.reg || 'Not provided')}</div><div><b>Location</b>${esc(o.area || '')}${o.area ? ', ' : ''}${c.name}</div><div><b>Period</b>1 to ${day} ${now.toLocaleDateString('en-IN', {month:'long', year:'numeric'})}</div></div>
    <table><thead><tr><th>Stream</th><th>Handed to</th><th class="num">Quantity</th></tr></thead><tbody>
    ${rows.map(([s, to, v]) => `<tr><td>${s}</td><td>${to}</td><td class="num">${fmtKg(v)}</td></tr>`).join('')}
    <tr class="tot"><td>Total</td><td></td><td class="num">${fmtKg(tot)}</td></tr></tbody></table>
    <div class="foot"><div><p><strong>Diverted from landfill: 100%.</strong> Every handover in this period was logged with a batch QR scan and a temperature reading at pickup.</p><p class="fine">Issued by the KindBytes platform. Scan the code to check the chain of custody. Prototype certificate with simulated figures.</p></div><div class="qr" id="certQr"></div></div>
  </div>`, true);
  const q = $('#certQr');
  if (q && typeof QRCode !== 'undefined') { try { new QRCode(q, {text:`kindbytes:certificate:${no}`, width:96, height:96, colorDark:'#1C1A2E', colorLight:'#ffffff', correctLevel:QRCode.CorrectLevel.M}); } catch (e) {} }
}
function openCsrFor(donor, kgBase){
  const kg = kgBase || randi(900, 5200), meals = Math.round(kg / .4), month = monthName();
  openDialog(`${donor}, ${month}`, `<p>In ${month}, ${esc(donor)} donated ${fmt(kg)} kg of surplus food through KindBytes. It became about ${fmt(meals)} meals for partner shelters, community kitchens and relief camps. Food that was not safe for people went to animal shelters and compost units, so none of it reached landfill.</p>
    <p>This avoided an estimated ${(kg * 2.5 / 1000).toFixed(1)} t of CO₂e. Every handover was logged with a QR scan. The donation supports SDG 2 (zero hunger) and SDG 12.3 (halving food waste).</p>
    <p class="small faint">Estimates use 0.4 kg per meal and 2.5 kg CO₂e per kg of food not wasted. Figures in this demo are simulated.</p>`);
}

function prowHtml(b, right){
  const c = city(b.cityId);
  return `<div class="prow">${ringHtml(b, 46)}<span style="min-width:0"><span class="t1">${esc(b.food)}</span><span class="t2">${esc(b.donor)}, ${c.name}. ${b.kg} kg${b.distFor ? `, ${b.distFor.toFixed(1)} km away` : ''}</span><span class="st st-${b.status}">${statusLabel(b)}</span></span><span style="display:flex;align-items:center;gap:10px"><span class="grade ${b.grade}">${b.grade}</span>${right || ''}</span></div>`;
}
function updateMy(){
  const u = S.user; if (!u || !S.myBuilt) return;
  const kind = S.myBuilt, c = city(u.city);
  if (kind === 'donor') {
    const mine = S.batches.filter(b => b.owner === u.id);
    $('#myListCount').textContent = mine.length ? `${mine.filter(b => b.status !== 'delivered' && b.status !== 'composted').length} active` : '';
    setHTML($('#myListings'), mine.length ? mine.map(b => itemHtml(b)).join('') : `<p class="emptyline">Your listings show up here with live status, from matching to delivery.</p>`);
    const indiv = (ORG_TYPES[u.orgType] || {}).noReg;
    if (indiv) {
      const kg = S.me.listedKg, st = {}; addStreams(st, S.me.st);
      setHTML($('#complPanel'), `<div class="panel-head"><h2>Your impact</h2><span class="pill ok">Thank you</span></div>
        <dl class="cmp-kpis"><div><dt>Food shared this session</dt><dd>${fmt(kg)} kg</dd></div><div><dt>Meals reached people</dt><dd>${fmt(S.me.meals)}</dd></div><div><dt>Eco-credits</dt><dd>${fmt(S.me.meals * 2 + Math.round(kg * 3))}</dd></div></dl>
        ${stTotal(st) ? splitHtml(st) + keysHtml(st) : `<p class="small muted" style="margin:0">Once a volunteer delivers your food, you will see exactly where every kilo went: people, animal feed, compost or recycling.</p>`}
        <p class="note-box" style="margin-top:14px">Under 8 servings? Share it with neighbours or a community fridge nearby. Bigger amounts from functions and parties are picked up for free.</p>`);
      $('#myKpi').innerHTML = kpiHtml([['shared today', fmt(kg) + ' kg'], ['meals delivered', fmt(S.me.meals)], ['landfill', '0 kg']]);
      return;
    }
    const day = new Date().getDate(), base = (u.daily || 140) * day * .92, st = {people:base * .56, feed:base * .07, wet:base * .32, dry:base * .05, landfill:0};
    addStreams(st, S.me.st);
    const bwg = (u.daily || 0) >= 100;
    setHTML($('#complPanel'), `<div class="panel-head"><h2>Solid Waste Management Rules, 2026</h2><span class="pill ${bwg ? 'info' : ''}">${bwg ? 'Bulk waste generator' : 'Below bulk threshold'}</span></div>
      <dl class="cmp-kpis"><div><dt>Processed off-site this month</dt><dd>${fmt(stTotal(st))} kg</dd></div><div><dt>Diverted from landfill</dt><dd>100%</dd></div><div><dt>QR-logged handovers</dt><dd>${fmt(Math.round(day * 3.4) + S.me.handovers)}</dd></div></dl>
      ${splitHtml(st)}${keysHtml(st)}
      <p class="note-box" style="margin-top:14px">Your off-site processing certificate for ${monthName()} is ready. Share it with your urban local body as proof under Extended Bulk Waste Generator Responsibility.</p>
      <div class="btnrow"><button class="btn" data-act="cert-me">View certificate</button><button class="btn ghost" data-act="csr-me">CSR impact summary</button></div>`);
    $('#myKpi').innerHTML = kpiHtml([['listed today', fmt(S.me.listedKg) + ' kg'], ['meals this month', fmt(base * .56 / .4 + S.me.meals)], ['landfill', '0 kg']]);
  }
  if (kind === 'receiver') {
    const inc = S.batches.filter(b => b.receiver && b.receiver.mine), people = S.myRec.type !== 'animal' && S.myRec.type !== 'compost';
    $('#incCount').textContent = inc.length ? `${inc.filter(b => b.status !== 'delivered').length} on the way` : '';
    setHTML($('#incoming'), inc.length ? inc.map(b => prowHtml(b, b.status === 'picked' ? `<button class="btn" data-act="receive" data-id="${b.id}">Confirm receipt</button>` : b.status === 'delivered' ? `<span class="pill ok">Received</span>` : `<span class="pill info">Volunteer assigned</span>`)).join('')
      : `<p class="emptyline">Nothing on the way yet. Matches usually arrive within minutes of a nearby listing.</p>`);
    $('#myKpi').innerHTML = kpiHtml([[people ? 'servings received today' : 'kg received today', fmt(S.me.received)], ['on the way', inc.filter(b => b.status === 'matched' || b.status === 'picked').length], [people ? 'capacity left' : 'kg capacity left', fmt(S.myRec.capacity)]]);
  }
  if (kind === 'ulb') {
    const list = bwgList(u.city), valid = list.filter(x => x.status === 'valid').length;
    setHTML($('#bwgTbl'), `<thead><tr><th>Generator</th><th class="num">kg a day</th><th class="num">Diverted</th><th>Certificate</th><th></th></tr></thead><tbody>${list.map((x, i) => `<tr><td>${esc(x.n)}<small>${x.type}</small></td><td class="num">${x.kg}</td><td class="num">${x.div}%</td><td>${{valid:'<span class="pill ok">Valid</span>', due:'<span class="pill warn">Due in 3 days</span>', missing:'<span class="pill bad">Missing</span>', sent:'<span class="pill info">Notice sent</span>'}[x.status]}</td><td>${x.status === 'valid' ? `<button class="btn ghost" data-act="ulb-cert" data-i="${i}">View</button>` : x.status === 'sent' ? '' : `<button class="btn ${x.status === 'missing' ? '' : 'ghost'}" data-act="ulb-notice" data-i="${i}">${x.status === 'missing' ? 'Send notice' : 'Remind'}</button>`}</td></tr>`).join('')}</tbody>`);
    const reps = S.reports.filter(r => r.cityId === u.city), open = reps.filter(r => r.status !== 'cleared').length;
    $('#hsCount').textContent = `${open} open`;
    setHTML($('#hotspots'), reps.map(r => `<div class="rep"><span class="ic">${ICON.pin}</span><span style="min-width:0"><strong style="font-size:14px">${esc(r.type)}</strong><small>${esc(r.where)}, reported at ${hhmm(r.t)}${r.photo ? ', with photo' : ''}</small></span><span class="acts">${r.status === 'new' ? `<button class="btn" data-act="hs-assign" data-id="${r.id}">Assign team</button>` : r.status === 'assigned' ? `<button class="btn ghost" data-act="hs-clear" data-id="${r.id}">Mark cleared</button>` : `<span class="pill ok">Cleared</span>`}</span></div>`).join('') || `<p class="emptyline">No hotspots reported.</p>`);
    const kg = c.meals * .4 / .84, st = {people:kg * .84, feed:kg * .05, wet:kg * .08, dry:kg * .03, landfill:0};
    setHTML($('#cityStreams'), splitHtml(st) + keysHtml(st, true));
    $('#myKpi').innerHTML = kpiHtml([['bulk generators', list.length * 4 + 2], ['certificates valid', Math.round(valid / list.length * 100) + '%'], ['open hotspots', open]]);
  }
  if (kind === 'vol') {
    const me = VOLS.find(v => v.me), active = S.batches.find(b => b.mineVol && (b.status === 'matched' || b.status === 'picked'));
    const listed = S.batches.filter(b => b.status === 'listed' && !b.mineVol).sort((a, b) => (a.cityId === u.city ? 0 : 1) - (b.cityId === u.city ? 0 : 1) || a.expiresAt - b.expiresAt).slice(0, 8);
    listed.forEach(b => { if (b.cityId === u.city && !b.distFor) b.distFor = S.local.dist[b.id] = rand(.6, 6.5); });
    $('#nearCount').textContent = `${S.batches.filter(b => b.status === 'listed' && b.cityId === u.city).length} in ${c.name}`;
    setHTML($('#nearby'), listed.map(b => prowHtml(b, `<button class="btn" data-act="accept" data-id="${b.id}"${active ? ' disabled title="Finish your current pickup first"' : ''}>Accept</button>`)).join('') || `<p class="emptyline">No pickups waiting right now. New listings appear here the moment they are posted.</p>`);
    setHTML($('#task'), taskHtml(active));
    if (active) { const q = $('#taskQr'); if (q && !q.dataset.done && typeof QRCode !== 'undefined') { q.dataset.done = 1; try { new QRCode(q, {text:`kindbytes:batch:${active.id}`, width:96, height:96, colorDark:'#0A0D1D', colorLight:'#ffffff', correctLevel:QRCode.CorrectLevel.M}); } catch (e) {} } }
    const vreps = S.reports.filter(r => r.by === u.id);
    setHTML($('#volReports'), vreps.map(r => `<div class="rep"><span class="ic">${ICON.pin}</span><span style="min-width:0"><strong style="font-size:14px">${esc(r.type)}</strong><small>${esc(r.where)}, ${hhmm(r.t)}</small></span><span class="acts"><span class="pill ${REP_STATUS[r.status][1]}">${REP_STATUS[r.status][0]}</span></span></div>`).join(''));
    const rank = [...VOLS].sort((a, b) => b.cr - a.cr).findIndex(v => v.me) + 1;
    setHTML($('#myBadges'), me && me.b.length ? `<div class="opts">${me.b.map(x => `<span class="bdg" style="font-size:12.5px;padding:4px 11px">${x}</span>`).join('')}</div><p class="small muted" style="margin:12px 0 0">Keep a 7-day streak to earn Streak keeper. Eco-credits can be redeemed for metro passes and meal coupons from partner donors.</p>` : `<p class="small muted" style="margin:0">Complete your first pickup to earn First mile. Eco-credits can be redeemed for metro passes and meal coupons from partner donors.</p>`);
    $('#myKpi').innerHTML = kpiHtml([['eco-credits', fmt(me ? me.cr : 0)], ['deliveries', me ? me.d : 0], ['day streak', me ? me.s : 0], ['rank', '#' + rank]]);
  }
  if (kind === 'ind') {
    const recv = c.receivers.filter(r => r.type === 'people' || r.type === 'relief');
    recv.forEach(r => { if (!r.slot) r.slot = pick(['12:30 to 2 pm','1 to 3 pm','7 to 9 pm','8 to 10 pm']); });
    setHTML($('#meals'), recv.map(r => `<div class="meal"><span><strong>${esc(r.name)}</strong></span><span class="pill ok">Free</span><small>${r.distKm.toFixed(1)} km away, serves ${r.slot}</small></div>`).join(''));
    const mine = S.batches.filter(b => b.owner === u.id), reps = S.reports.filter(r => r.by === u.id);
    setHTML($('#myReports'), (mine.map(b => prowHtml(b)).join('') + reps.map(r => `<div class="rep"><span class="ic">${ICON.pin}</span><span style="min-width:0"><strong style="font-size:14px">${esc(r.type)}</strong><small>${esc(r.where)}, ${hhmm(r.t)}</small></span><span class="acts"><span class="pill ${REP_STATUS[r.status][1]}">${REP_STATUS[r.status][0]}</span></span></div>`).join(''))
      || `<p class="emptyline">Food you share and hotspots you report show up here with live status.</p>`);
    $('#myKpi').innerHTML = kpiHtml([['meals shared', fmt(S.me.meals)], ['pickups requested', mine.length], ['hotspots reported', reps.length], ['eco-credits', fmt(S.me.meals * 2 + reps.length * 15)]]);
  }
}
function taskHtml(b){
  if (!b) {
    const last = S.batches.find(x => x.mineVol && x.status === 'delivered');
    return `<p class="emptyline" style="padding-top:0">${last ? `Last delivery: ${esc(last.food)} to ${esc(last.receiver.name)}. ` : ''}Accept a pickup to start. You will get the donor’s address, the receiver and a hygiene checklist.</p>`;
  }
  const picked = b.status === 'picked', ready = b.chk.every(Boolean) && b.probe;
  return `<div class="task"><div class="panel-head" style="margin:0"><h3>${esc(b.food)}</h3><span class="grade ${b.grade}">${b.grade}</span></div>
    <p class="t2" style="margin:4px 0 0">${b.kg} kg from ${esc(b.donor)}. Deliver to ${esc(b.receiver.name)}, ${b.receiver.distKm.toFixed(1)} km.</p>
    <div class="stepper" aria-hidden="true"><span class="done"></span><span class="${picked ? 'done' : 'on'}"></span><span class="${picked ? 'on' : ''}"></span></div>
    <div class="task-grid"><div>${picked
      ? `<p style="margin:4px 0 12px;font-size:14px">On the way to <strong>${esc(b.receiver.name)}</strong>. Ask them to scan the batch code when you hand it over.</p><button class="btn" data-act="vdrop" data-id="${b.id}">Confirm delivery</button>`
      : `<strong style="font-size:14px">Before you pick up</strong>${VCHK.map((x, i) => `<label class="check"><input type="checkbox" data-vchk="${i}" data-id="${b.id}"${b.chk[i] ? ' checked' : ''}> <span>${x}</span></label>`).join('')}
        <div class="fld" style="margin-top:10px"><span>Probe reading at pickup</span><div class="opts">${PROBE.map(([k, l]) => `<button type="button" class="opt" data-probe="${k}" data-id="${b.id}" aria-pressed="${b.probe === k}">${l}</button>`).join('')}</div></div>
        <button class="btn" data-act="vpick" data-id="${b.id}"${ready ? '' : ' disabled'}>Confirm pickup</button>${ready ? '' : `<p class="faint small" style="margin:8px 0 0">Tick all four checks and log the probe reading to continue.</p>`}`}
    </div><div class="qrbox"><div class="qr" id="taskQr"></div><p class="faint">Scan at each handover</p></div></div></div>`;
}
async function volAccept(id){
  const r = await call('POST', `/api/batches/${id}/accept/`, {}, `You accepted ${id}. Finish the hygiene check before you leave.`);
  if (r) { S.local.chk[id] = [0,0,0,0]; dirty('my'); }
}
async function volPick(id){
  const b = S.batches.find(x => x.id === id); if (!b || !b.chk.every(Boolean) || !b.probe) return;
  const r = await call('POST', `/api/batches/${id}/pickup/`, {checks:b.chk.map(Boolean), probe:b.probe});
  if (r) toast(r.rerouted ? `Danger-zone reading. ${id} now goes to ${r.rerouted}, not to people.` : `Picked up ${id}. Head to ${r.receiver}.`);
}

/* ---------- workspace events (the auth card is an Alpine.js component) ---------- */
document.addEventListener('submit', e => {
  const f = e.target;
  if (f.closest('#auth')) return;
  e.preventDefault();
  if (f.id === 'listForm') postListing(f);
  else if (f.id === 'reportForm') postReport(f);
  else if (f.id === 'capForm') {
    const fd = new FormData(f), cap = Math.round(+fd.get('cap') || 0);
    if (!(cap > 0)) { toast('Enter how much you can take.'); return; }
    call('POST', '/api/me/capacity/', {cap, veg:!!fd.get('veg'), urgent:!!fd.get('urgent'), until:fd.get('until')}, 'Availability updated. Donors nearby will see you first.');
  }
});
document.addEventListener('input', e => { if (e.target.closest('#listForm')) updatePreview(); });
document.addEventListener('change', e => {
  const el = e.target;
  if (el.closest('#listForm')) updatePreview();
  if (el.dataset.vchk !== undefined) {
    const b = S.batches.find(x => x.id === el.dataset.id);
    if (b) { b.chk[+el.dataset.vchk] = el.checked ? 1 : 0; S.local.chk[b.id] = b.chk; dirty('my'); }
  }
  if (el.name === 'photo' && el.files && el.closest('#reportForm')) {
    const th = $('#thumb'), f = el.files[0];
    if (f) { th.innerHTML = `<img alt="Photo preview" src="${URL.createObjectURL(f)}">`; th.style.display = 'block'; } else { th.style.display = 'none'; th.innerHTML = ''; }
  }
});
function handleAuthClick(el){
  if (el.dataset.auth) {
    window.dispatchEvent(new CustomEvent('kb:auth', {detail:{tab:el.dataset.auth}}));
    const a = $('#auth'); if (a) a.scrollIntoView({behavior:'smooth', block:'start'});
    return true;
  }
  if (el.dataset.signup) {
    window.dispatchEvent(new CustomEvent('kb:auth', {detail:{tab:'signup', role:el.dataset.signup}}));
    $('#home').scrollTo({top:0, behavior:'smooth'}); return true;
  }
  if (el.closest('#auth')) return true;
  if (el.dataset.scroll) { const s = document.getElementById(el.dataset.scroll); if (s) s.scrollIntoView({behavior:'smooth'}); return true; }
  if (el.classList.contains('opt') && el.closest('.opts[data-grp]')) {
    const g = el.closest('.opts'); if (g.hasAttribute('data-single')) $$('.opt', g).forEach(b => b.setAttribute('aria-pressed', b === el)); else el.setAttribute('aria-pressed', el.getAttribute('aria-pressed') !== 'true');
    if (el.closest('#listForm')) updatePreview();
    return true;
  }
  if (el.dataset.probe) {
    const b = S.batches.find(x => x.id === el.dataset.id);
    if (b) { b.probe = el.dataset.probe; S.local.probe[b.id] = b.probe; dirty('my'); }
    return true;
  }
  const act = el.dataset.act;
  if (act === 'logout') { signOut(); return true; }
  if (act === 'close-dlg') { $('#csrDialog').close(); return true; }
  if (act === 'cert-me') { const u = S.user; openCert({org:u.org, reg:u.reg, area:u.area, city:u.city, daily:u.daily, extra:S.me.st}); return true; }
  if (act === 'csr-me') { openCsrFor(S.user.org, Math.round((S.user.daily || 140) * new Date().getDate() * .92 * .56 + S.me.listedKg)); return true; }
  if (act === 'cert-donor') { const d = $('#donorSel').value; openCert({org:d, reg:String(13300000000000 + d.length * 7919), area:'', city:'del', daily:100 + d.length * 9}); return true; }
  if (act === 'ulb-cert') { const x = bwgList(S.user.city)[+el.dataset.i]; if (x) openCert({org:x.n, reg:x.reg, area:'', city:S.user.city, daily:x.kg}); return true; }
  if (act === 'ulb-notice') {
    const x = bwgList(S.user.city)[+el.dataset.i];
    if (x) call('POST', `/api/bwg/${x.id}/notice/`, {}, r => r.was === 'missing' ? `Notice sent to ${r.name}. They have 7 days to show an off-site processing certificate.` : `Reminder sent to ${r.name}.`);
    return true;
  }
  if (act === 'hs-assign' || act === 'hs-clear') {
    call('POST', `/api/reports/${el.dataset.id}/status/`, {status: act === 'hs-assign' ? 'assigned' : 'cleared'},
      act === 'hs-assign' ? 'Team assigned. The citizen who reported it gets an update.' : 'Marked cleared. The citizen gets a notification.');
    return true;
  }
  if (act === 'accept') { volAccept(el.dataset.id); return true; }
  if (act === 'vpick') { volPick(el.dataset.id); return true; }
  if (act === 'vdrop') { call('POST', `/api/batches/${el.dataset.id}/deliver/`, {}, r => `Delivered. You earned ${r.credits} eco-credits.`); return true; }
  if (act === 'receive') { call('POST', `/api/batches/${el.dataset.id}/deliver/`, {}, 'Receipt confirmed and logged against the batch QR.'); return true; }
  if (el.id === 'whoBtn') { const m = $('#menu'), open = !m.classList.contains('open'); m.classList.toggle('open', open); el.setAttribute('aria-expanded', open); return true; }
  return false;
}
document.addEventListener('click', e => { if (!e.target.closest('#menu') && !e.target.closest('#whoBtn')) closeMenu(); }, true);

/* ---------- boot ---------- */
$('#donorSel').innerHTML = DONORS.map(d => `<option>${d}</option>`).join('');
window.KB = {
  signIn, toast, api, t: k => t(k), lang: () => S.lang, ORG_TYPES, REG, regKey,
  cities: CITIES.map(c => ({id:c.id, name:c.name}))
};
applyI18n();
Scene.init();
if (!Scene.ok) $('#driftBtn').disabled = true;
if (reduceMotion) $('#driftBtn').setAttribute('aria-pressed', 'false');
dirty('all');
const boot = JSON.parse((document.getElementById('kb-boot') || {}).textContent || '{}');
if (boot.user) signIn(boot.user); else { showHome(); sync(); }
setInterval(sync, 2000);
setInterval(updateTimers, 1000);
})();