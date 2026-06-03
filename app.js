// ═══════════════════════════════════════════════════════════════
//  SHARED EMOJI ARRAYS
// ═══════════════════════════════════════════════════════════════
const WEST_EMOJI   = ["♑","♒","♓","♈","♉","♊","♋","♌","♍","♎","♏","♐"];
const CHI_EMOJI    = ["🐀","🐂","🐯","🐰","🐉","🐍","🐴","🐐","🐒","🐓","🐕","🐷"];
const MOON_EMOJI   = ["🌑","🌒","🌓","🌔","🌕","🌖","🌗","🌘"];
const ZODIAC_EMOJI = ["♈","♉","♊","♋","♌","♍","♎","♏","♐","♑","♒","♓"];
const PLANET_EMOJI = ["☉","☽","♂","☿","♃","♀","♄"];
const CAT_KEYS     = ["work","love","health","finance"];
const CAT_ICONS    = ["💼","💕","🌿","💰"];

// ═══════════════════════════════════════════════════════════════
//  ASTRONOMY
// ═══════════════════════════════════════════════════════════════

// Julian Day Number for a given Date object
function julianDay(date){
  const y=date.getFullYear(),mo=date.getMonth()+1,day=date.getDate();
  const A=Math.floor(y/100),B=2-A+Math.floor(A/4);
  return Math.floor(365.25*(y+4716))+Math.floor(30.6001*(mo+1))+day+B-1524.5;
}

// Moon mean longitude (degrees 0-360), good to ~1° for sign placement
function moonMeanLongitude(date){
  const T=(julianDay(date)-2451545.0)/36525;
  const L=218.3164477+481267.88123421*T-0.0015786*T*T;
  return((L%360)+360)%360;
}

// Sun apparent longitude (degrees 0-360) with equation of center
function sunLongitude(date){
  const T=(julianDay(date)-2451545.0)/36525;
  let L0=280.46646+36000.76983*T;L0=((L0%360)+360)%360;
  let M=357.52911+35999.05029*T-0.0001537*T*T;M=((M%360)+360)%360;
  const Mr=M*Math.PI/180;
  const C=(1.914602-0.004817*T-0.000014*T*T)*Math.sin(Mr)
         +(0.019993-0.000101*T)*Math.sin(2*Mr)
         +0.000289*Math.sin(3*Mr);
  return((L0+C)%360+360)%360;
}

// Aspect between two sign indices (0-11 in longitude order)
function getAspect(s1,s2){
  const diff=Math.abs(s1-s2);
  const angle=Math.min(diff,12-diff)*30;
  if(angle===0)  return'conjunction';
  if(angle===120)return'trine';
  if(angle===60) return'sextile';
  if(angle===90) return'square';
  if(angle===180)return'opposition';
  return'neutral';
}

// westIdx: maps calendar month/day to display index (0=Capricorn … 11=Sagittarius)
// nd-1 logic: upper boundary is exclusive (cutoff day belongs to the next sign).
// Sagittarius (i===11) gets a dedicated branch to handle the Nov/Dec rollover.
// Verified boundary assertions:
//   westIdx(12,21) → 11 (Sagittarius)  westIdx(12,22) → 0  (Capricorn)
//   westIdx(1,19)  → 0  (Capricorn)    westIdx(1,20)  → 1  (Aquarius)
//   westIdx(3,20)  → 2  (Pisces)       westIdx(3,21)  → 3  (Aries)
//   westIdx(6,20)  → 5  (Gemini)       westIdx(6,21)  → 6  (Cancer)
function westIdx(m,d){
  const b=[[12,22],[1,20],[2,19],[3,21],[4,20],[5,21],[6,21],[7,23],[8,23],[9,23],[10,23],[11,22]];
  for(let i=0;i<12;i++){
    const[bm,bd]=b[i],[nm,nd]=b[(i+1)%12];
    if(i===11){if((m===11&&d>=22)||(m===12&&d<=21))return i;}
    else if((m===bm&&d>=bd)||(m===nm&&d<=nd-1))return i;
  }
  return 0;
}

function chiIdx(y){return((y-1900)%12+12)%12}

function moonIdx(date){
  const d=new Date(date);
  const jd=julianDay(d); // reuse shared Meeus JD formula for consistency with moonMeanLongitude()
  const phase=(((jd-2451549.5)%29.53058867)+29.53058867)%29.53058867/29.53058867;
  const t=[.0625,.1875,.3125,.4375,.5625,.6875,.8125,.9375];
  for(let i=0;i<8;i++)if(phase<t[i])return i;
  return 0;
}

// ═══════════════════════════════════════════════════════════════
//  RNG
// ═══════════════════════════════════════════════════════════════
function mkRng(seed){
  let s=seed|0;
  return()=>{s^=s<<13;s^=s>>17;s^=s<<5;return(s>>>0)/0xffffffff};
}
function dailySeed(bday,today){
  const b=parseDateInput(bday),t=parseDateInput(today);
  const bv=b.getFullYear()*10000+(b.getMonth()+1)*100+b.getDate();
  const tv=t.getFullYear()*10000+(t.getMonth()+1)*100+t.getDate();
  return Math.abs((bv*2654435769)^(tv*2246822519))%0x7fffffff;
}
// Real astrological rating engine — replaces pure-RNG pickRating
function calcRatings(bdayStr,todayDate,rng){
  const birth=parseDateInput(bdayStr);
  const bWI=westIdx(birth.getMonth()+1,birth.getDate());
  // Convert birth sign from westIdx order → longitude order (Ari=0…Pis=11)
  const birthLon=(bWI-3+12)%12;

  // Moon sign (longitude order)
  const moonLon=moonMeanLongitude(todayDate);
  const moonSignIdx=Math.floor(moonLon/30)%12;

  // Moon phase index (0=new…4=full…7=waning crescent)
  const mi=moonIdx(todayDate);
  const isWaxing=mi<4;

  // Moon sign element (fire/earth/air/water cycle every 3 signs)
  const elements=['fire','earth','air','water'];
  const moonElem=elements[moonSignIdx%4];

  // Planetary day ruler: 0=Sun,1=Moon,2=Mars,3=Mercury,4=Jupiter,5=Venus,6=Saturn
  const dow=todayDate.getDay();

  // Birth ↔ Moon aspect modifier
  const asp=getAspect(birthLon,moonSignIdx);
  const aspMod=(asp==='trine'||asp==='sextile')?0.5:(asp==='square'||asp==='opposition')?-0.5:0;

  // ── WORK ──────────────────────────────────────────────────────
  let work=3.0;
  if(dow===3)work+=0.9; // Mercury (Wed) boosts work
  if(dow===0)work+=0.4; // Sun (Sun)
  if(dow===6)work+=0.4; // Saturn (Sat)
  if(dow===1)work-=0.3; // Moon (Mon) dampens
  if(moonElem==='fire')work+=0.2;
  work+=aspMod;
  work+=(rng()-0.5)*0.5; // ±0.25 micro-variation

  // ── LOVE ──────────────────────────────────────────────────────
  let love=3.0;
  if(dow===5)love+=1.0; // Venus (Fri)
  if(dow===1)love+=0.5; // Moon (Mon)
  if(dow===6)love-=0.3; // Saturn (Sat)
  if(mi===4) love+=0.5; // Full moon = love peak
  if(moonElem==='water')love+=0.3;
  love+=aspMod;
  love+=(rng()-0.5)*0.5;

  // ── HEALTH ────────────────────────────────────────────────────
  const healthPhase=[-0.9,-0.1,0.4,0.7,1.1,0.3,-0.5,-0.8];
  let health=3.0+healthPhase[mi];
  if(dow===0)health+=0.4; // Sun boosts vitality
  if(dow===6)health-=0.3; // Saturn drains
  if(moonElem==='water')health+=0.2;
  health+=aspMod;
  health+=(rng()-0.5)*0.5;

  // ── FINANCE ───────────────────────────────────────────────────
  let finance=3.0;
  if(dow===4)finance+=1.1; // Jupiter (Thu)
  if(dow===3)finance+=0.5; // Mercury (Wed)
  if(dow===2)finance-=0.3; // Mars (Tue)
  finance+=isWaxing?0.5:-0.3;
  if(moonElem==='earth')finance+=0.3;
  finance+=aspMod;
  finance+=(rng()-0.5)*0.5;

  const clamp=v=>Math.max(1,Math.min(5,Math.round(v)));
  return{work:clamp(work),love:clamp(love),health:clamp(health),finance:clamp(finance),
         moonSignIdx,asp};
}
function pick(arr,rng){return arr[Math.floor(rng()*arr.length)]}

// ═══════════════════════════════════════════════════════════════
//  HELPERS
// ═══════════════════════════════════════════════════════════════
function dots(n){
  let h='<div class="dots">';
  for(let i=1;i<=5;i++)h+=`<div class="dot${i<=n?' on':''}"></div>`;
  return h+'</div>';
}

/** @param {string} id @returns {HTMLElement} */
function $ (id){return document.getElementById(id)}
/** Sets textContent of element by id */
function tx(id,v){$(id).textContent=v}
function setBlockText(id,v){
  const el=$(id);
  el.textContent=v||'';
  el.style.display=v?'':'none';
}
function escapeHtml(v){
  return String(v)
    .replace(/&/g,'&amp;')
    .replace(/</g,'&lt;')
    .replace(/>/g,'&gt;')
    .replace(/"/g,'&quot;')
    .replace(/'/g,'&#39;');
}
function isActionKey(e){return e.key==='Enter'||e.key===' '}
function localDate(date){
  return new Date(date.getFullYear(),date.getMonth(),date.getDate());
}
function dateKey(date){
  const d=localDate(date);
  const y=d.getFullYear();
  const m=String(d.getMonth()+1).padStart(2,'0');
  const day=String(d.getDate()).padStart(2,'0');
  return `${y}-${m}-${day}`;
}
function parseDateKey(key){
  const [y,m,d]=String(key).split('-').map(Number);
  return new Date(y,m-1,d);
}
function parseDateInput(value){
  if(!value)return localDate(new Date());
  if(value instanceof Date)return localDate(value);
  if(typeof value==='string' && /^\d{4}-\d{2}-\d{2}$/.test(value))return parseDateKey(value);
  return localDate(new Date(value));
}
function addDays(date,days){
  const d=localDate(date);
  d.setDate(d.getDate()+days);
  return d;
}
// Safe localStorage wrapper — falls back silently in private browsing / storage-full scenarios
const storage={
  get(k){try{return localStorage.getItem(k)}catch(e){return null}},
  set(k,v){try{localStorage.setItem(k,v)}catch(e){}},
  remove(k){try{localStorage.removeItem(k)}catch(e){}}
};

// ═══════════════════════════════════════════════════════════════
//  THEME
// ═══════════════════════════════════════════════════════════════
let theme = storage.get('cosmic_theme')
  || (window.matchMedia('(prefers-color-scheme: light)').matches ? 'light' : 'dark');

function applyTheme(t){
  theme = t;
  document.documentElement.dataset.theme = t;
  $('theme-btn').textContent = t === 'dark' ? '☀️' : '🌙';
  $('theme-btn').setAttribute('aria-label', t === 'dark' ? 'Switch to day mode' : 'Switch to night mode');
  // Update PWA theme-color meta
  const meta = document.querySelector('meta[name="theme-color"]');
  if(meta) meta.content = t === 'dark' ? '#09080b' : '#f5f0e8';
  storage.set('cosmic_theme', t);
}

function toggleTheme(){
  applyTheme(theme === 'dark' ? 'light' : 'dark');
}

// ═══════════════════════════════════════════════════════════════
//  APP STATE
// ═══════════════════════════════════════════════════════════════
let lang = storage.get('cosmic_lang') || 'en';
let readingState=null;
let lastDetailTrigger=null;
let selectedDate=localDate(new Date());

function toggleLang(){
  closeDetail();
  lang = lang==='en'?'zh':'en';
  storage.set('cosmic_lang',lang);
  const bday=storage.get('cosmic_bday');
  applyStaticLang();
  if(bday && !$('reading').classList.contains('hidden'))renderReading(bday,selectedDate);
}

function applyStaticLang(){
  const L=LANG[lang];
  $('lang-btn').textContent = L.langToggle;
  tx('ob-title', L.appTitle);
  tx('ob-sub',   L.appSub);
  tx('ob-h2',    L.obH2);
  tx('ob-p',     L.obP);
  tx('ob-lbl',   L.obLbl);
  tx('ob-btn',   L.obBtn);
  if($('oracle-lbl'))tx('oracle-lbl',L.oracleLbl);
  if($('sug-lbl')) tx('sug-lbl',   L.sugLbl);
  if($('btn-reset'))tx('btn-reset', L.changeBtn);
  if($('btn-creator'))tx('btn-creator', L.creatorBtn);
  if($('btn-about'))tx('btn-about', L.aboutBtn);
  if($('date-prev'))tx('date-prev', L.prevDay);
  if($('date-next'))tx('date-next', L.nextDay);
  if($('date-today'))tx('date-today', L.todayBtn);
  if($('detail-close'))$('detail-close').setAttribute('aria-label',L.detailClose);
  document.documentElement.lang = lang==='zh'?'zh-Hans':'en';
}

function show(id){
  if(id!=='reading')closeDetail();
  ['onboarding','reading'].forEach(s=>$(s).classList.add('hidden'));
  $(id).classList.remove('hidden');
}

function startReading(){
  const v=$('bday-input').value;
  if(!v){
    $('bday-input').style.borderColor='rgba(196,165,90,.55)';
    setTimeout(()=>$('bday-input').style.borderColor='',900);
    return;
  }
  storage.set('cosmic_bday',v);
  selectedDate=localDate(new Date());
  show('reading');
  renderReading(v,selectedDate);
}

let _confirmCb=null;
function showConfirm(msg,okLabel,cancelLabel,cb){
  tx('confirm-msg',msg);
  tx('confirm-ok',okLabel);
  tx('confirm-cancel',cancelLabel);
  _confirmCb=cb;
  const m=$('confirm-modal');
  m.classList.add('open');
  m.removeAttribute('aria-hidden');
  $('confirm-cancel').focus();
}
function closeConfirm(){
  const m=$('confirm-modal');
  m.classList.remove('open');
  m.setAttribute('aria-hidden','true');
  _confirmCb=null;
}
function confirmOk(){
  const cb=_confirmCb;
  closeConfirm();
  if(cb)cb();
}

function resetBday(){
  const L=LANG[lang];
  showConfirm(L.resetMsg, L.confirmOk, L.confirmCancel, ()=>{
    closeDetail();
    readingState=null;
    selectedDate=localDate(new Date());
    storage.remove('cosmic_bday');
    $('bday-input').value='';
    show('onboarding');
  });
}

function currentBday(){
  return storage.get('cosmic_bday');
}

function shiftSelectedDate(days){
  const bday=currentBday();
  if(!bday)return;
  selectedDate=addDays(selectedDate,days);
  closeDetail();
  renderReading(bday,selectedDate);
}

function jumpToToday(){
  const bday=currentBday();
  if(!bday)return;
  selectedDate=localDate(new Date());
  closeDetail();
  renderReading(bday,selectedDate);
}

function applyDetail(payload){
  setBlockText('detail-kicker',payload.kicker);
  setBlockText('detail-title',payload.title);
  setBlockText('detail-sub',payload.subtitle);

  const facts=payload.facts||[];
  $('detail-facts').innerHTML=facts.map(f=>`<span class="detail-pill">${escapeHtml(f)}</span>`).join('');
  $('detail-facts').style.display=facts.length?'flex':'none';

  const custom=$('detail-custom');
  custom.innerHTML='';
  custom.style.display='none';
  if(payload.custom && payload.custom.type==='almanac'){
    renderAlmanacCustom(payload.custom);
    custom.style.display='block';
  }else if(payload.custom && payload.custom.type==='privacy'){
    renderPrivacyCustom();
    custom.style.display='block';
  }

  const copy=$('detail-copy');
  copy.innerHTML='';
  (payload.paragraphs||[]).filter(Boolean).forEach(text=>{
    const p=document.createElement('p');
    p.textContent=text;
    copy.appendChild(p);
  });
  copy.style.display=copy.childElementCount?'flex':'none';
}

function openDetail(payload){
  if(!payload)return;
  applyDetail(payload);
  $('detail-modal').classList.add('open');
  $('detail-modal').setAttribute('aria-hidden','false');
  document.body.classList.add('modal-open');
  requestAnimationFrame(()=>$('detail-close').focus());
}

function closeDetail(){
  const wasOpen=$('detail-modal').classList.contains('open');
  $('detail-modal').classList.remove('open');
  $('detail-modal').setAttribute('aria-hidden','true');
  document.body.classList.remove('modal-open');
  if(wasOpen && lastDetailTrigger && document.contains(lastDetailTrigger))lastDetailTrigger.focus();
}

function displayWesternName(idx){
  return lang==='zh'
    ?LANG.zh.westNames[idx]
    :LANG.en.westNames[idx];
}

function displayChineseZodiacName(idx){
  return lang==='zh'
    ?`${LANG.zh.chiNames[idx]}年`
    :LANG.en.yearOf(LANG.en.chiNames[idx]);
}

function displayMoonSignName(idx){
  return lang==='zh'
    ?LANG.zh.zodiacNames[idx]
    :LANG.en.zodiacNames[idx];
}

function westernDisplayToDetailIdx(idx){
  return (idx+9)%12;
}

function getAlmanacPack(){
  return lang==='zh'?ALMANAC_ZH:ALMANAC_EN;
}

function buildAlmanacAdvice(){
  const pack=getAlmanacPack();
  const phase=pack.phase[readingState.phaseIdx];
  const sign=pack.sign[readingState.moonSignIdx];
  const day=pack.day[readingState.dayIdx];
  const west=pack.west[readingState.westIdx];
  const zodiac=pack.chinese[readingState.chineseIdx];
  if(lang==='zh'){
    return{
      yi:`${phase.yi}；以${sign.yi}为方法，借${day.yi}推进，兼顾${west.yi}与${zodiac.yi}。`,
      ji:`${phase.ji}；少做${sign.ji}，避免${day.ji}，尤其别让${west.ji}和${zodiac.ji}叠在一起。`
    };
  }
  return{
    yi:`${phase.yi}; use ${sign.yi}, lean on ${day.yi}, and keep ${west.yi} with ${zodiac.yi}.`,
    ji:`${phase.ji}; avoid ${sign.ji}, watch ${day.ji}, and do not let ${west.ji} combine with ${zodiac.ji}.`
  };
}

function buildAlmanacDetail(activeTab='phase'){
  const pack=getAlmanacPack();
  const phase=pack.phase[readingState.phaseIdx];
  const day=pack.day[readingState.dayIdx];
  return{
    kicker:lang==='zh'?'今日宜忌':'Daily Almanac',
    title:lang==='zh'?'今日宜忌视窗':'Daily Almanac',
    subtitle:lang==='zh'
      ?`${phase.label} · 月入${LANG.zh.zodiacNames[readingState.moonSignIdx]} · ${day.label}`
      :`${phase.label} · Moon in ${LANG.en.zodiacNames[readingState.moonSignIdx]} · ${day.label}`,
    facts:[],
    paragraphs:[],
    custom:{
      type:'almanac',
      activeTab
    }
  };
}

function renderAlmanacCustom(config){
  const custom=$('detail-custom');
  const pack=getAlmanacPack();
  const combo=buildAlmanacAdvice();
  const activeTab=config.activeTab||'phase';
  const items={
    phase:{
      label:lang==='zh'?'月相':'Moon Phase',
      value:`${MOON_EMOJI[readingState.phaseIdx]} ${pack.phase[readingState.phaseIdx].label}`,
      title:`${MOON_EMOJI[readingState.phaseIdx]} ${pack.phase[readingState.phaseIdx].label}`,
      note:pack.phase[readingState.phaseIdx].note
    },
    moonSign:{
      label:lang==='zh'?'月入星座':'Moon Sign',
      value:`🌙 ${displayMoonSignName(readingState.moonSignIdx)}`,
      title:lang==='zh'
        ?`🌙 月入${displayMoonSignName(readingState.moonSignIdx)}`
        :`🌙 Moon in ${displayMoonSignName(readingState.moonSignIdx)}`,
      note:pack.sign[readingState.moonSignIdx].note
    },
    day:{
      label:lang==='zh'?'今日之日':'Day Ruler',
      value:`${PLANET_EMOJI[readingState.dayIdx]} ${pack.day[readingState.dayIdx].label}`,
      title:`${PLANET_EMOJI[readingState.dayIdx]} ${pack.day[readingState.dayIdx].label}`,
      note:pack.day[readingState.dayIdx].note
    }
  };

  custom.innerHTML=`
    <div class="almanac-shell">
      <div class="almanac-top">
        <div class="almanac-id">${WEST_EMOJI[readingState.westIdx]} ${displayWesternName(readingState.westIdx)}</div>
        <div class="almanac-id">${CHI_EMOJI[readingState.chineseIdx]} ${displayChineseZodiacName(readingState.chineseIdx)}</div>
      </div>
      <div class="almanac-grid">
        ${Object.entries(items).map(([key,item])=>`
          <button type="button" class="almanac-tab${key===activeTab?' active':''}" data-almanac-tab="${key}">
            <div class="almanac-tab-label">${item.label}</div>
            <div class="almanac-tab-value">${item.value}</div>
          </button>
        `).join('')}
      </div>
      <div class="almanac-active">
        <div class="almanac-active-kicker">${items[activeTab].label}</div>
        <div class="almanac-active-title">${items[activeTab].title}</div>
        <div class="almanac-active-note">${items[activeTab].note}</div>
      </div>
      <div class="almanac-yi-grid">
        <div class="almanac-yi-card do">
          <div class="almanac-yi-label">${lang==='zh'?'今日宜':"Today's Do"}</div>
          <div class="almanac-yi-text">${escapeHtml(combo.yi)}</div>
        </div>
        <div class="almanac-yi-card dont">
          <div class="almanac-yi-label">${lang==='zh'?'今日不宜':'Avoid'}</div>
          <div class="almanac-yi-text">${escapeHtml(combo.ji)}</div>
        </div>
      </div>
    </div>
  `;
  custom.querySelectorAll('[data-almanac-tab]').forEach(btn=>{
    btn.addEventListener('click',()=>{
      applyDetail(buildAlmanacDetail(btn.dataset.almanacTab));
    });
  });
}

function buildWesternDetail(idx){
  const L=LANG[lang], D=DETAILS[lang];
  const item=D.western[westernDisplayToDetailIdx(idx)];
  return{
    kicker:D.labels.western,
    title:`${WEST_EMOJI[idx]} ${displayWesternName(idx)}`,
    subtitle:item.range,
    facts:item.facts,
    paragraphs:[item.summary,item.extra]
  };
}

function buildChineseDetail(idx){
  const L=LANG[lang], D=DETAILS[lang];
  const item=D.chinese[idx];
  return{
    kicker:D.labels.chinese,
    title:`${CHI_EMOJI[idx]} ${displayChineseZodiacName(idx)}`,
    subtitle:lang==='zh'
      ?`${readingState.birthYear}年出生对应生肖 · ${item.cycle}`
      :`Birth year ${readingState.birthYear} · ${item.cycle}`,
    facts:item.facts,
    paragraphs:[item.summary,item.extra]
  };
}

function buildMoonPhaseDetail(idx){
  const L=LANG[lang], D=DETAILS[lang];
  const item=D.phases[idx];
  return{
    kicker:D.labels.phase,
    title:`${MOON_EMOJI[idx]} ${L.moonNames[idx]}`,
    subtitle:item.subtitle,
    facts:item.facts,
    paragraphs:[
      item.summary,
      item.extra,
      lang==='zh'
        ?'科学上，月相来自太阳、地球、月亮相对位置的变化，也就是我们从地球上看到的月面受光比例在变；它是真实可观测的天文现象。'
        :'Scientifically, moon phases come from the changing Sun-Earth-Moon geometry, which changes how much of the moon’s sunlit face we can see from Earth.',
      lang==='zh'
        ?'如果想把它用成一种“今日节律提示”，比较稳妥的理解是：它更像观察自然周期的方式，而不是对个人命运的硬性决定。'
        :'If you use it as a rhythm cue for the day, the grounded interpretation is that it marks a visible natural cycle, not a proven controller of personal fate.'
    ]
  };
}

function buildMoonSignDetail(idx){
  const L=LANG[lang], D=DETAILS[lang];
  const sign=D.western[idx];
  const aspect=D.aspects[readingState.aspect];
  return{
    kicker:D.labels.moonSign,
    title:lang==='zh'
      ?`🌙 月入 ${displayMoonSignName(idx)}`
      :`🌙 Moon in ${displayMoonSignName(idx)}`,
    subtitle:lang==='zh'?'今天情绪与本能反应的底色':"Today's emotional weather",
    facts:[sign.facts[0],sign.facts[2],`${lang==='zh'?'当前相位':'Current aspect'}: ${aspect.name}`],
    paragraphs:[
      lang==='zh'
        ?'月入星座描述的是今天情绪、本能与安全感更容易通过什么方式表达。'
        :'Moon-in-sign describes how the emotional tone of the day is likely to move.',
      sign.moonFocus,
      aspect.summary,
      lang==='zh'
        ?'从天文上说，这里指的是月亮当天沿黄道运行到哪个黄道区段；这是可以计算和观测的位置变化。把它解释成“今天比较适合什么气质”，属于象征性阅读，不是已被证实的因果科学。'
        :'Astronomically, this refers to which section of the ecliptic the moon is moving through today. That position is measurable; the personality-style reading on top of it is symbolic rather than established causal science.'
    ]
  };
}

function buildPlanetDetail(idx){
  const D=DETAILS[lang];
  const item=D.planetDays[idx];
  return{
    kicker:D.labels.planet,
    title:`${PLANET_EMOJI[idx]} ${readingState.planetDayLabel}`,
    subtitle:item.title,
    facts:item.facts,
    paragraphs:[
      item.summary,
      item.extra,
      lang==='zh'
        ?'更严格地说，所谓“太阳日 / 月亮日 / 水星日”主要来自古典历法与星期命名传统，本身更接近文化时间感，而不是现代科学里会直接影响行为的物理机制。'
        :'More strictly, labels like Sun Day, Moon Day, or Mercury Day come from classical calendar and weekday naming traditions. They are cultural time-markers more than a modern scientific physical mechanism.',
      lang==='zh'
        ?'如果你喜欢一点像黄历的感觉，可以把它当成“今天适合偏向哪类安排”的轻提示，比如水星日偏沟通整理，金星日偏关系审美，土星日偏收束、整理、减法。'
        :'If you want a mild almanac-like feel, the grounded version is to treat it as a cultural cue for what kind of day suits what kind of task: Mercury for communication, Venus for relationships and aesthetics, Saturn for structure and pruning.'
    ]
  };
}

function buildAstroDetail(){
  const L=LANG[lang], D=DETAILS[lang];
  const aspect=D.aspects[readingState.aspect];
  const moonItem=D.western[readingState.moonSignIdx];
  return{
    kicker:D.labels.astro,
    title:readingState.moonInLabel,
    subtitle:lang==='zh'?'这行是今天评分背后的星象速记':'The short astrological note behind today’s scores',
    facts:[
      `${lang==='zh'?'相位':'Aspect'}: ${aspect.name}`,
      `${lang==='zh'?'月入':'Moon in'} ${L.zodiacNames[readingState.moonSignIdx]}`
    ],
    paragraphs:[
      aspect.summary,
      moonItem.moonFocus,
      lang==='zh'
        ?'它不会改写原文，但会解释今天整体情绪底色为什么更偏向这个方向。'
        :'It does not rewrite the messages, but it does explain the emotional tilt behind today’s reading.',
      lang==='zh'
        ?'这行里真正可计算的部分，是月亮当天的位置和它与本命星座形成的角度；至于“今天读起来像什么”，则是建立在这些位置之上的解释层。'
        :'The computable part here is the moon’s current position and its angle relative to your natal sign; the rest is the interpretive layer built on top of those positions.'
    ]
  };
}

function scoreDirection(score){
  if(score>=5)return 'peak';
  if(score===4)return 'high';
  if(score===3)return 'steady';
  if(score===2)return 'low';
  return 'rough';
}

// Each "category × direction" now holds multiple [rhythm, watch, move] templates.
// One is chosen deterministically per day from the daily seed (see pickInsightVariant),
// so the detail copy stays stable within a day but varies across days and birth profiles
// without touching the render-time RNG stream (no change to existing oracle/message picks).
// Large distinct constants so each category gets a well-separated sub-seed
// (xorshift first outputs correlate when seeds differ only by a small amount).
const INSIGHT_KEY_OFFSET={work:0x9E3779B1,love:0x85EBCA77,health:0xC2B2AE3D,finance:0x27D4EB2F};
function pickInsightVariant(pool,key){
  if(!pool||!pool.length)return['','',''];
  if(pool.length===1)return pool[0];
  const seed=(readingState&&readingState.seed)||0;
  const r=mkRng((seed^(INSIGHT_KEY_OFFSET[key]||0x165667B1))>>>0);
  r(); // warm up one step to decorrelate from the sub-seed
  const idx=Math.floor(r()*pool.length)%pool.length;
  return pool[idx];
}
function buildCategoryInsight(key){
  const L=LANG[lang];
  const score=readingState.ratings[key];
  const direction=scoreDirection(score);
  const label=L.rLbls[score];
  const text={
    en:{
      work:{
        rough:[
          ["Keep the professional lane narrow. This is a maintenance day, not a day for proving range.","Watch for unclear requests, avoidable urgency, or the temptation to volunteer before the brief is real.","Choose one task that would make tomorrow easier and complete only that."],
          ["Ambition is running ahead of traction today. Treat it as a holding pattern and protect what already works.","Watch for forcing a decision that wants more information, or mistaking motion for progress.","Close one small loop completely instead of opening three you cannot finish."],
          ["The work signal is thin. Lower the bar to 'kept it steady' and let that count as a win.","Watch for taking on someone else's urgency as if it were your own.","Tidy one corner of your workspace or inbox and let that be enough."]
        ],
        low:[
          ["Work can move, but it needs guardrails. Progress favors simple priorities and clean handoffs.","Watch for small delays, vague messages, or energy leaking into tasks that do not matter.","Write the next three steps before you start, then do the first one."],
          ["Momentum is light but real. Pick the path with the least friction and let it carry you.","Watch for over-planning to avoid starting, or letting small interruptions reset your focus.","Do the easiest meaningful task first to prime the rest of the day."],
          ["You can make ground today, just not on every front. Narrow the day to one priority.","Watch for energy draining into messages and tabs that move nothing forward.","Protect one 25-minute block for the thing that actually matters."]
        ],
        steady:[
          ["The work current is stable. Ordinary effort is enough if you keep it consistent.","Watch for boredom disguising itself as restlessness; the day rewards follow-through more than novelty.","Finish a practical task you already understand instead of opening a new thread."],
          ["Conditions are workmanlike — neither lift nor drag. Reliability is the advantage today.","Watch for waiting on inspiration that is not coming; routine will outperform mood.","Pick up an unfinished thread and carry it one clear step forward."],
          ["The middle gear suits today. A consistent pace beats short bursts.","Watch for treating a calm day as an empty one and filling it with busywork.","Knock out a task you have been postponing precisely because it is dull."]
        ],
        high:[
          ["The work signal is clear. Use the momentum while it is available, especially for decisions or visible output.","Watch for overloading the day because things finally feel possible.","Move one meaningful project from intention into an observable next step."],
          ["Traction is on your side. Decisions land cleaner and output carries further than usual.","Watch for saying yes to more than the momentum can actually sustain.","Make the call or ship the thing while the path is still open."],
          ["The work channel rewards initiative today. What you start tends to stick.","Watch for polishing what is already good instead of advancing what is stuck.","Put your strongest hour toward the project that matters most."]
        ],
        peak:[
          ["The career channel is unusually open. Visibility, timing, and confidence are all easier to access.","Watch for overconfidence or scattering strong energy across too many targets.","Ask for the thing, send the proposal, or put your best work where it can be seen."],
          ["Rare alignment in the work field — timing, clarity, and nerve are all available at once.","Watch for spending a peak day on small wins you could get any time.","Aim the energy at the boldest thing on your list, not the easiest."],
          ["The professional current is wide open. People are more likely to say yes today.","Watch for scattering a strong signal across too many directions.","Make one high-stakes ask you would normally talk yourself out of."]
        ]
      },
      love:{
        rough:[
          ["Connection needs extra softness today. Keep the emotional weather simple and avoid forcing clarity too early.","Watch for reading tone too sharply, withdrawing too fast, or expecting people to guess what you mean.","Send one kind, low-pressure signal to someone who matters."],
          ["The relational field is tender. Lower the stakes and let connection stay simple.","Watch for testing people instead of telling them what you need.","Offer one small, clear kindness with no agenda attached."],
          ["Closeness asks for patience today, not performance. Do not force a resolution.","Watch for reading silence as rejection when it is probably just distance.","Step back from the conversation that keeps looping and let it rest."]
        ],
        low:[
          ["Social energy is present but muted. Smaller gestures will land better than big emotional scenes.","Watch for mixed signals, delayed replies, or taking normal distance personally.","Choose one relationship and make the next exchange easier, not heavier."],
          ["Warmth is available in small denominations today. Spend it that way.","Watch for keeping score, or expecting reciprocity on your own timeline.","Reach out once without needing a particular reply."],
          ["Social energy is quiet but not closed. Gentle beats grand.","Watch for overthinking a message before you have even sent it.","Check in on someone simply, then let the exchange breathe."]
        ],
        steady:[
          ["The relationship field is even. It supports ordinary warmth, honest attention, and calm presence.","Watch for overlooking the good because it is not dramatic.","Give someone your full attention for five uninterrupted minutes."],
          ["The heart field is calm and dependable. Presence matters more than gesture.","Watch for autopilot in the relationships you trust most.","Ask one real question and actually listen to the whole answer."],
          ["Connection sits in an easy middle today. Ordinary closeness is the gift.","Watch for skipping appreciation just because nothing is wrong.","Tell someone specifically what you value about them."]
        ],
        high:[
          ["Warmth is easier to exchange today. The right words can open more than expected.","Watch for promising more emotional availability than you actually have.","Say one true thing clearly and warmly."],
          ["Affection moves easily today. Honesty lands softer than you would expect.","Watch for promising warmth you will be too tired to deliver later.","Say the kind thing out loud instead of assuming it is understood."],
          ["The relational current is generous. People meet you halfway more readily.","Watch for mistaking momentum for a green light on everything.","Make the warm first move you keep waiting for someone else to make."]
        ],
        peak:[
          ["The heart channel is bright. Affection, magnetism, and meaningful timing are all amplified.","Watch for intensity moving faster than consent, capacity, or context.","Make the generous move you will still respect tomorrow."],
          ["The heart channel is wide and bright. Magnetism and timing are both on your side.","Watch for intensity outrunning trust or context.","Be generously honest with someone who has earned it."],
          ["Rare openness in the love field today — closeness is unusually easy to reach.","Watch for letting a high tide sweep past your own boundaries.","Take the affectionate risk you will be glad you took tomorrow."]
        ]
      },
      health:{
        rough:[
          ["The body lane asks for conservation. Treat energy as a limited resource and protect your baseline.","Watch for pushing through fatigue, skipping meals, or confusing tension with motivation.","Do one restorative thing before asking your body for more."],
          ["The body is running on reserves. Treat rest as the productive choice today.","Watch for caffeine standing in for sleep, or tension masquerading as drive.","Cancel one optional demand and give that hour back to your body."],
          ["Vitality is low and asking to be heard. Subtract before you add.","Watch for pushing past the first clear signal to stop.","Do the smallest restorative thing — water, air, horizontal — right now."]
        ],
        low:[
          ["Physical rhythm is below ideal but workable. Gentle consistency matters more than intensity.","Watch for shallow breathing, screen fatigue, or ignoring small signals until they get louder.","Hydrate, stretch, and lower the day's physical demand by one notch."],
          ["Your system wants maintenance, not a challenge. Keep the demands modest.","Watch for skipping meals or sleep to buy time you will pay back with interest.","Trade one strenuous plan for a gentler version of it."],
          ["Energy is workable if you do not spend it all at once. Pace beats push.","Watch for ignoring a small ache until it gets loud.","Build one quiet recovery window into the day on purpose."]
        ],
        steady:[
          ["Your body is in a usable middle range. Routine care will do more than dramatic correction.","Watch for neglecting basics because nothing feels urgent.","Anchor the day with one proper meal, one walk, or one earlier bedtime choice."],
          ["The body is in a serviceable rhythm. Basics, done consistently, are the whole strategy.","Watch for letting 'fine' quietly drift into neglected.","Lock in one anchor habit — a walk, a meal, a bedtime — and keep it."],
          ["Physical baseline is steady today. Maintenance compounds quietly.","Watch for skipping the small care because nothing feels urgent.","Move your body once in a way that feels good, not punishing."]
        ],
        high:[
          ["Vitality is available. Movement and care can compound well if you keep them clean.","Watch for spending all the energy just because it is there.","Use the lift for a walk, workout, reset, or practical body maintenance."],
          ["Energy is genuinely available today. Use it cleanly and it pays forward.","Watch for burning the whole reserve just because it is there.","Channel the lift into one workout or task that builds capacity."],
          ["The body feels capable. A good day to ask a little more of it.","Watch for mistaking a strong day for an indestructible one.","Do the active thing you have been meaning to start."]
        ],
        peak:[
          ["The physical channel is strong. This is a good day to feel what your body can do.","Watch for overreaching because confidence is high.","Choose one physical action that builds future capacity, not just today's burn."],
          ["Physical vitality is at a high mark — strength, stamina, and recovery all favor you.","Watch for overreaching on confidence and paying for it tomorrow.","Pick a challenge that leaves you stronger, not just emptier."],
          ["The body channel is bright today. Capacity is unusually accessible.","Watch for treating one strong day as license to skip recovery.","Invest the energy in something that compounds, not a one-off burn."]
        ]
      },
      finance:{
        rough:[
          ["The material lane wants caution. Clarity matters more than speed, and restraint has value.","Watch for impulse purchases, vague deals, or trying to fix a feeling with spending.","Pause one financial decision until you can look at it calmly."],
          ["The money field is choppy. Defense beats offense today; protect the baseline.","Watch for emotional spending, or a deal that needs you to decide right now.","Sleep on any purchase above your usual threshold."],
          ["Material timing is poor for bold moves. Stillness is a position too.","Watch for fixing a mood with a checkout button.","Move one tempting decision to a calmer day and leave it there."]
        ],
        low:[
          ["Money energy is subdued. Small practical choices are more useful than dramatic moves.","Watch for tiny leaks, subscriptions, convenience spending, or optimism without numbers.","Review one expense and decide whether it still belongs."],
          ["Resources are tightish but manageable. Precision matters more than ambition.","Watch for small recurring leaks you have stopped noticing.","Cancel or pause one thing you no longer use."],
          ["The money lane is slow today. Tend it rather than push it.","Watch for optimism that skips the actual numbers.","Reconcile one balance so you are deciding from facts."]
        ],
        steady:[
          ["The financial field is balanced. Skill, attention, and ordinary discipline matter more than luck.","Watch for ignoring simple maintenance because nothing feels urgent.","Check one account, bill, or plan and leave it cleaner than you found it."],
          ["Finances sit in a stable groove. Discipline, not luck, is doing the work.","Watch for deferring the boring admin that keeps things clean.","Handle one pending money task and close it for good."],
          ["The material field is level today. Ordinary diligence is enough.","Watch for assuming steady means it can be ignored.","Review one upcoming expense before it arrives."]
        ],
        high:[
          ["Material timing is favorable for thoughtful action. Useful opportunities may be quiet rather than flashy.","Watch for confusing a lucky opening with permission to skip judgment.","Take one calculated step after checking the numbers."],
          ["Material timing favors a measured move. Opportunity rewards homework today.","Watch for confusing a green light with a guarantee.","Take the calculated step you have already researched."],
          ["The money channel is cooperative. Smart effort tends to convert.","Watch for chasing a flashier option over the sound one.","Advance one plan that you understand end to end."]
        ],
        peak:[
          ["The luck channel is bright, especially when paired with precision. This favors bold but clean action.","Watch for turning confidence into recklessness.","Use the opening on a move you already understand, not a gamble you only hope will work."],
          ["The luck field is bright, especially paired with precision. Bold-but-clean wins today.","Watch for letting confidence slide into a gamble.","Act on the opportunity you actually understand, fully."],
          ["Rare favor in the material channel today — timing and judgment align.","Watch for overextending because the door is open.","Make the decisive move on something you have already vetted."]
        ]
      }
    },
    zh:{
      work:{
        rough:[
          ["职场这条线今天适合收窄范围。它更像维护日，不是证明能力边界的日子。","留意模糊需求、临时催促，或者在事情还没说清前就主动揽下来的冲动。","选一件能让明天更轻松的任务，只把它做好。"],
          ["今天野心跑在执行力前面。把它当成盘整期，先守住已经能跑通的部分。","留意逼自己做一个其实还缺信息的决定，或把忙碌当成进展。","彻底收掉一个小环节，而不是同时打开三个收不了的。"],
          ["工作信号很薄。把标准降到「保持住」，这就算赢。","留意把别人的紧急当成自己的紧急来扛。","整理工作区或收件箱的一个角落，今天到这里就够。"]
        ],
        low:[
          ["工作可以推进，但需要护栏。简单优先级和清楚交接会比硬冲更有效。","留意小延误、含糊消息，或把精力漏到不重要的任务里。","开始前先写下接下来的三步，然后只做第一步。"],
          ["势头不强但真实存在。挑阻力最小的那条路，让它带你走。","留意用过度规划逃避开始，或让小打扰一次次重置专注。","先做最容易的那件有意义的事，给一天热身。"],
          ["可以推进，但不是全线推进。把今天收窄到一个优先级。","留意精力漏进那些推不动任何事的消息和标签页。","守住一个 25 分钟，只给真正重要的那件事。"]
        ],
        steady:[
          ["工作流速稳定。普通但持续的努力已经够用。","留意把无聊误认成需要开新坑；今天更奖励完成，而不是新鲜感。","完成一件你已经理解的实际任务，不要再打开新线。"],
          ["条件中规中矩——没有顺风也没有逆风。今天的优势是稳定可靠。","留意在等一个不会来的灵感；按部就班会赢过看心情。","拿起一条没收尾的线，把它清楚地往前推一步。"],
          ["今天适合中间挡。匀速胜过爆发。","留意把平稳的一天当成空的一天，然后塞满杂活。","专门去做一件你一直拖、正因为它无聊的事。"]
        ],
        high:[
          ["职场信号清楚。适合用这股顺势处理决定、输出或可见成果。","留意因为终于顺了，就把一天塞得太满。","把一个重要项目从想法推进到一个看得见的下一步。"],
          ["执行力站在你这边。决定落得更干净，产出也比平时走得更远。","留意答应了超过这股顺势真正撑得住的量。","趁路还开着，把那个电话打了，或把东西发出去。"],
          ["今天职场奖励主动。你起的头更容易立住。","留意去打磨本就够好的，而不是推进卡住的。","把状态最好的一个小时，投给最重要的项目。"]
        ],
        peak:[
          ["事业通道今天很开。可见度、时机和信心都更容易被调动。","留意过度自信，或把强能量分散到太多目标上。","提出那个请求，发出那份方案，或把最好的成果放到能被看见的位置。"],
          ["职场难得的对齐——时机、清晰和胆量同时在线。","留意把巅峰日花在任何时候都能拿的小胜上。","把能量瞄准清单上最大胆的那件，而不是最容易的。"],
          ["事业通道大开。今天别人更可能说「好」。","留意把强信号分散到太多方向。","提出一个你平时会劝退自己的高风险请求。"]
        ]
      },
      love:{
        rough:[
          ["关系线今天需要额外柔软。保持情绪天气简单，不要太早逼迫清晰答案。","留意过度解读语气、太快退回自己，或期待别人自动猜中你的意思。","给一个重要的人发出一个善意、低压力的信号。"],
          ["关系场域今天很嫩。降低赌注，让连接保持简单。","留意用试探代替直接说出你的需要。","送出一个不带目的、清楚的小善意。"],
          ["亲近今天要的是耐心，不是表现。别逼出一个结论。","留意把沉默读成拒绝，其实那多半只是距离。","从那段一直绕圈的对话里退出来，让它先歇着。"]
        ],
        low:[
          ["社交能量在，但偏弱。小动作比大型情绪场面更容易落地。","留意混合信号、回复变慢，或把正常距离理解成针对你。","选一段关系，让下一次交流更轻，而不是更重。"],
          ["温度今天以小额面值供应。就这样花它。","留意计较得失，或要求对方按你的时间表回应。","主动联系一次，不必非要某种回复。"],
          ["社交能量安静，但没关上。温柔胜过盛大。","留意一条消息还没发就已经想太多。","简单地问候一个人，然后让交流自然呼吸。"]
        ],
        steady:[
          ["关系场域平稳。它支持普通的温暖、诚实的注意力和安静的在场。","留意因为它不戏剧化，就忽略其中好的部分。","给某个人五分钟完整注意力，不分心。"],
          ["心的场域平稳可靠。在场比姿态更重要。","留意在最信任的关系里开了自动驾驶。","问一个真实的问题，并且真的听完整个回答。"],
          ["连接今天落在轻松的中间。普通的亲近就是礼物。","留意因为没出问题，就跳过了表达欣赏。","具体地告诉某人，你看重他哪一点。"]
        ],
        high:[
          ["今天温度更容易交换。合适的话会比你预想中打开更多东西。","留意承诺超过你真实能给出的情绪余量。","清楚、温和地说一句真实的话。"],
          ["今天好感流动顺畅。坦诚落地比你想的更柔软。","留意承诺了之后会累到给不出的温度。","把那句善意说出口，别假设对方已经懂。"],
          ["关系的流向很慷慨。别人更愿意走过来一半。","留意把顺势误当成所有事都开了绿灯。","主动做出那个你总在等别人先做的温暖动作。"]
        ],
        peak:[
          ["心的通道很亮。好感、吸引力和有意义的时机都被放大。","留意强度走得比同意、容量和现实语境更快。","做一个慷慨但明天依然会尊重自己的动作。"],
          ["心的通道又宽又亮。吸引力和时机都站在你这边。","留意强度跑过了信任或语境。","对一个值得的人，慷慨地坦诚一次。"],
          ["今天爱的场域难得敞开——亲近异常容易抵达。","留意让高潮把你自己的边界一起冲走。","做那个明天会庆幸自己做了的、带感情的冒险。"]
        ]
      },
      health:{
        rough:[
          ["身体线今天要求保存能量。把体力当成有限资源，先保护基础状态。","留意硬扛疲惫、跳过正餐，或把紧绷误认成动力。","在继续要求身体输出前，先做一件恢复性的事。"],
          ["身体在吃老本。今天把休息当成最有产出的选择。","留意用咖啡因顶替睡眠，或把紧绷当成动力。","取消一个可选的安排，把那一小时还给身体。"],
          ["活力很低，正在求你听见。先做减法再做加法。","留意冲过第一个明确的停止信号。","现在就做最小的恢复动作——喝水、透气、躺平。"]
        ],
        low:[
          ["身体节奏低于理想值，但还可运转。温和一致比强度更重要。","留意呼吸变浅、屏幕疲劳，或忽视小信号直到它变大。","喝水、拉伸，并把今天的身体要求下调一档。"],
          ["系统今天要的是维护，不是挑战。把要求压低。","留意用跳过吃饭和睡觉换时间，之后要连本带利还。","把一个高强度计划换成它温和的版本。"],
          ["能量还能用，前提是别一次花光。配速胜过硬冲。","留意忽视一个小疼痛，直到它变响。","在一天里特意安排一个安静的恢复窗口。"]
        ],
        steady:[
          ["身体处在可用的中间区间。日常照顾比戏剧性修正更有用。","留意因为没有明显警报，就忽略基础维护。","用一顿正经饭、一次散步，或一个早点睡的选择固定今天。"],
          ["身体节奏堪用。把基础做到一致，这就是全部策略。","留意让「还行」慢慢滑成「被忽略」。","锁定一个锚点习惯——散步、一顿饭、或睡点——然后守住。"],
          ["身体基线今天稳定。维护会安静地累积。","留意因为没有紧急感，就跳过了小照顾。","用一种让你舒服而不是惩罚的方式动一次身体。"]
        ],
        high:[
          ["活力可用。运动和照顾如果保持干净，会有叠加效果。","留意因为有能量，就把它全部花光。","把这股抬升用在散步、训练、重置或身体维护上。"],
          ["今天能量是真的有。用得干净，它会往后回报你。","留意只因为有，就把整个储备烧光。","把这股抬升导进一次训练，或一件建设体能的事。"],
          ["身体感觉有余力。适合今天对它多要求一点。","留意把状态好的一天当成无敌的一天。","去做那件你一直想开始的有氧的事。"]
        ],
        peak:[
          ["身体通道很强。今天适合感受身体真正能做到什么。","留意因为信心高而过度推进。","选一个能建设未来体能的动作，而不只是消耗今天的能量。"],
          ["身体活力到了高位——力量、耐力和恢复都向着你。","留意凭信心过度推进，明天来还账。","选一个让你更强、而不只是更空的挑战。"],
          ["身体通道今天很亮。体能异常容易调用。","留意把一个强日当成可以跳过恢复的许可。","把能量投到能累积的事上——不是一次性的燃烧。"]
        ]
      },
      finance:{
        rough:[
          ["物质线今天要谨慎。清楚比速度重要，克制本身有价值。","留意冲动消费、含糊交易，或试图用花钱修复情绪。","把一个财务决定暂停到你能冷静看它的时候。"],
          ["金钱场域颠簸。今天防守胜过进攻，先保住基础盘。","留意情绪化消费，或一个逼你当场拍板的交易。","任何超过日常阈值的购买，先睡一觉再说。"],
          ["物质时机不适合大动作。静止也是一种仓位。","留意用一个结账按钮去修复情绪。","把一个诱人的决定挪到更冷静的一天，然后留在那儿。"]
        ],
        low:[
          ["金钱能量偏低。小而实际的选择比戏剧性动作更有用。","留意小漏、订阅、便利消费，或没有数字支撑的乐观。","检查一项开支，判断它是否还应该留在你的生活里。"],
          ["资源有点紧但能管理。精准比野心更重要。","留意那些你已经不再注意的小额定期漏出。","取消或暂停一个你已经不用的东西。"],
          ["金钱这条线今天慢。养它，别推它。","留意跳过实际数字的乐观。","对一笔余额做一次核对，让你从事实出发做决定。"]
        ],
        steady:[
          ["财务场域平衡。技巧、注意力和普通纪律比运气更重要。","留意因为没有紧急感，就忽略简单维护。","检查一个账户、账单或计划，让它比刚开始时更清楚。"],
          ["财务处在稳定的轨道里。在起作用的是纪律，不是运气。","留意一再推迟那些让一切保持干净的无聊杂务。","处理一件待办的钱务，把它彻底了结。"],
          ["物质场域今天持平。普通的勤勉就够了。","留意把「稳定」当成「可以不管」。","在一笔即将到来的开支到账前先看一眼。"]
        ],
        high:[
          ["物质时机偏顺，适合经过思考后的行动。机会可能安静，不一定醒目。","留意把幸运窗口误认成可以跳过判断。","核对数字后，迈出一个计算过的小步。"],
          ["物质时机偏向有度的行动。今天机会奖励做过功课的人。","留意把绿灯误当成保证。","迈出那个你已经研究过的、计算过的小步。"],
          ["金钱通道愿意配合。聪明的努力今天更容易兑现。","留意去追更花哨的选项，而放过稳妥的那个。","推进一个你从头到尾都理解的计划。"]
        ],
        peak:[
          ["偏财通道很亮，尤其适合和精准度配合。它支持大胆但干净的动作。","留意把信心变成鲁莽。","把这个窗口用在你已经理解的行动上，而不是只靠希望的赌注上。"],
          ["偏财场域很亮，尤其和精准配合时。大胆但干净会赢。","留意让信心滑进一场赌博。","对那个你真正理解的机会，完整地行动。"],
          ["今天物质通道难得有利——时机和判断对齐。","留意因为门开着就过度伸展。","对一个你已经核实过的东西，做出决定性的一步。"]
        ]
      }
    }
  };
  const [rhythm,watch,move]=pickInsightVariant(text[lang][key][direction],key);
  return{
    rhythm,
    watch,
    move,
    label
  };
}

function buildCategoryDetail(key){
  const L=LANG[lang], D=DETAILS[lang];
  const insight=buildCategoryInsight(key);
  return{
    kicker:D.labels.section,
    title:`${CAT_ICONS[CAT_KEYS.indexOf(key)]} ${L[key].name}`,
    subtitle:lang==='zh'?`今日评分：${L.rLbls[readingState.ratings[key]]}`:`Today’s rating: ${L.rLbls[readingState.ratings[key]]}`,
    facts:[
      `${lang==='zh'?'分数':'Score'}: ${readingState.ratings[key]}/5`,
      insight.label
    ],
    paragraphs:[
      readingState.msgs[key],
      `${L.detailRhythm}: ${insight.rhythm}`,
      `${L.detailWatch}: ${insight.watch}`,
      `${L.detailMove}: ${insight.move}`
    ]
  };
}

function buildOracleDetail(){
  const D=DETAILS[lang];
  return{
    kicker:D.labels.oracle,
    title:LANG[lang].oracleLbl,
    subtitle:lang==='zh'?'放大查看今天的神谕':'Expanded for easier reading',
    facts:[],
    paragraphs:[readingState.oracle]
  };
}

function buildSuggestionDetail(){
  const D=DETAILS[lang];
  return{
    kicker:D.labels.suggestion,
    title:LANG[lang].sugLbl,
    subtitle:lang==='zh'?'放大查看今天的建议':'Expanded for easier reading',
    facts:[],
    paragraphs:[readingState.suggest]
  };
}

function buildCreatorDetail(){
  const L=LANG[lang];
  return{
    kicker:L.creatorKicker,
    title:L.creatorTitle,
    subtitle:'',
    facts:[],
    paragraphs:[L.creatorCopy]
  };
}

function buildAboutDetail(){
  const L=LANG[lang];
  return{
    kicker:L.aboutKicker,
    title:L.aboutTitle,
    subtitle:L.aboutSub,
    facts:[],
    paragraphs:L.aboutParas,
    custom:{type:'privacy'}
  };
}

const ANALYTICS_OPT_OUT_KEY='cosmic_analytics_opt_out';
function analyticsEnabled(){return storage.get(ANALYTICS_OPT_OUT_KEY)!=='1';}
function renderPrivacyCustom(){
  const L=LANG[lang];
  const custom=$('detail-custom');
  const on=analyticsEnabled();
  custom.innerHTML=`
    <div class="privacy-toggle">
      <div class="privacy-toggle-text">
        <div class="privacy-toggle-label">${escapeHtml(L.privacyAnalyticsLabel)}</div>
        <div class="privacy-toggle-note">${escapeHtml(on?L.privacyAnalyticsOnNote:L.privacyAnalyticsOffNote)}</div>
      </div>
      <button type="button" class="privacy-toggle-btn${on?'':' off'}" id="privacy-toggle-btn">
        ${escapeHtml(on?L.privacyToggleToOff:L.privacyToggleToOn)}
      </button>
    </div>`;
  $('privacy-toggle-btn').addEventListener('click',()=>{
    if(analyticsEnabled())storage.set(ANALYTICS_OPT_OUT_KEY,'1');
    else storage.remove(ANALYTICS_OPT_OUT_KEY);
    // Reload so the analytics beacon actually starts/stops; the birthday persists.
    location.reload();
  });
}

function getDetailPayload(type,key){
  if(!readingState)return null;
  switch(type){
    case 'almanac': return buildAlmanacDetail('phase');
    case 'western': return buildWesternDetail(Number(key));
    case 'chinese': return buildChineseDetail(Number(key));
    case 'moon-phase': return buildAlmanacDetail('phase');
    case 'moon-sign': return buildAlmanacDetail('moonSign');
    case 'planet-day': return buildAlmanacDetail('day');
    case 'astro': return buildAlmanacDetail('phase');
    case 'category': return buildCategoryDetail(key);
    case 'oracle': return buildOracleDetail();
    case 'suggestion': return buildSuggestionDetail();
    case 'creator': return buildCreatorDetail();
    case 'about': return buildAboutDetail();
    default: return null;
  }
}

function activateDetailTrigger(node){
  const payload=getDetailPayload(node.dataset.detail,node.dataset.key);
  if(payload){
    lastDetailTrigger=node;
    openDetail(payload);
  }
}

function onReadingClick(e){
  const trigger=e.target.closest('[data-detail]');
  if(trigger)activateDetailTrigger(trigger);
}

function onReadingKeydown(e){
  const trigger=e.target.closest('[data-detail]');
  if(trigger && isActionKey(e)){
    e.preventDefault();
    activateDetailTrigger(trigger);
  }
}

function renderReading(bday,targetDate=new Date()){
  const L=LANG[lang];
  applyStaticLang();

  selectedDate=localDate(targetDate);
  const birth=parseDateInput(bday),today=selectedDate;
  const bM=birth.getMonth()+1,bD=birth.getDate(),bY=birth.getFullYear();

  const wi=westIdx(bM,bD), ci=chiIdx(bY), mi=moonIdx(today);
  const wsEmoji=WEST_EMOJI[wi], czEmoji=CHI_EMOJI[ci], moonEmoji=MOON_EMOJI[mi];
  const wsName=L.westNames[wi], czName=L.chiNames[ci], moonName=L.moonNames[mi];

  const todayStr=dateKey(today);

  // Skip full rebuild if nothing changed (e.g. duplicate call with same params)
  if(readingState && readingState.dateKey===todayStr && readingState.langUsed===lang && readingState.bday===bday){
    return;
  }

  // Track what changed to allow targeted DOM updates below
  const bdayOrLangChanged = !readingState || readingState.bday!==bday || readingState.langUsed!==lang;

  const seed=dailySeed(bday,today);
  const rng=mkRng(seed);

  // Real astrological ratings
  const calc=calcRatings(bday,today,rng);
  const ratings={work:calc.work,love:calc.love,health:calc.health,finance:calc.finance};

  // Messages (one random pick per category per day)
  const msgs={};
  for(const k of CAT_KEYS) msgs[k]=pick(L[k].m[ratings[k]],rng);
  // Profile-bound pools: pick from a bucket matched to the day's chart, falling
  // back to the flat pool. pick() consumes exactly one rng() either way, so the
  // downstream stream (title) and all ratings/messages are unchanged.
  const aspectClass=(calc.asp==='trine'||calc.asp==='sextile')?'harmonious'
    :(calc.asp==='square'||calc.asp==='opposition')?'tension':'neutral';
  const oraclePool=(L.oraclesByProfile&&L.oraclesByProfile[mi]&&L.oraclesByProfile[mi][aspectClass])||L.oracles;
  const oracle =pick(oraclePool,rng);
  const domCat=CAT_KEYS.reduce((a,k)=>ratings[k]>ratings[a]?k:a,CAT_KEYS[0]);
  const meanScore=(ratings.work+ratings.love+ratings.health+ratings.finance)/4;
  const dayTone=meanScore>=3.6?'bright':meanScore<=2.6?'cautious':'mixed';
  const suggestPool=(L.suggestionsByProfile&&L.suggestionsByProfile[domCat]&&L.suggestionsByProfile[domCat][dayTone])||L.suggestions;
  const suggest=pick(suggestPool,rng);
  const rtitle =pick(L.readingTitles,rng);

  // Moon sign badge
  const moonSignName =L.zodiacNames[calc.moonSignIdx];
  const moonSignEmoji=ZODIAC_EMOJI[calc.moonSignIdx];

  // Planetary day badge
  const planetName =L.planetNames[today.getDay()];
  const planetEmoji=PLANET_EMOJI[today.getDay()];
  const planetDayLabel=lang==='zh'?`${planetName}日`:`${planetName} Day`;

  // Astrological basis label for detail views
  const aspName=L.aspectNames[calc.asp];
  const moonInLabel=lang==='zh'
    ?`月亮${aspName?aspName+'相·':''}月入${moonSignName}`
    :`Moon${aspName?' '+aspName+' natal ·':''} Moon in ${moonSignName}`;

  readingState={
    bday,
    langUsed:lang,
    seed,
    birthYear:bY,
    dateKey:todayStr,
    dateLabel:'',
    identity:'',
    sky:'',
    ratings,
    msgs,
    oracle,
    suggest,
    phaseIdx:mi,
    dayIdx:today.getDay(),
    aspect:calc.asp,
    westIdx:wi,
    chineseIdx:ci,
    moonSignIdx:calc.moonSignIdx,
    moonInLabel,
    planetDayLabel
  };

  // Header
  const d=today,wday=L.dayNames[d.getDay()];
  const mNum=d.getMonth()+1, mName=L.monthNames[d.getMonth()];
  const dateLabel=L.dateStr(wday, lang==='zh'?mNum:mName, d.getDate(), d.getFullYear());
  const identity=`${wsEmoji} ${wsName} · ${czEmoji} ${lang==='zh'?czName+'年':L.yearOf(czName)}`;
  const sky=`${moonEmoji} ${moonName} · ${moonSignEmoji} ${moonSignName} · ${planetEmoji} ${planetDayLabel}`;
  readingState.dateLabel=dateLabel;
  readingState.identity=identity;
  readingState.sky=sky;
  tx('r-date',  dateLabel);
  tx('r-title', rtitle);
  tx('date-today',todayStr===dateKey(new Date())?L.todayBtn:todayStr);

  // Birth sign badges only depend on birthday + language — skip rebuild on date-only changes
  if(bdayOrLangChanged){
    $('r-signs').innerHTML=`
    <button type="button" class="badge badge-btn" data-detail="western" data-key="${wi}">${wsEmoji} ${wsName}</button>
    <button type="button" class="badge badge-btn" data-detail="chinese" data-key="${ci}">${czEmoji} ${lang==='zh'?czName+'年':L.yearOf(czName)}</button>`;
  }

  $('almanac-summary').innerHTML=`
    <div class="almanac-summary-head">
      <div>
        <div class="almanac-summary-kicker">${lang==='zh'?'今日宜忌':'Daily Almanac'}</div>
        <div class="almanac-summary-title">${lang==='zh'?'今日天象':'Today’s Sky'}</div>
      </div>
      <div class="almanac-summary-more">${lang==='zh'?'点击展开':'Tap to open'}</div>
    </div>
    <div class="almanac-summary-grid">
      <div class="almanac-summary-item">
        <div class="almanac-summary-label">${lang==='zh'?'月相':'Moon'}</div>
        <div class="almanac-summary-value">${moonEmoji} ${moonName}</div>
      </div>
      <div class="almanac-summary-item">
        <div class="almanac-summary-label">${lang==='zh'?'月入':'Moon In'}</div>
        <div class="almanac-summary-value">🌙 ${lang==='zh'?moonSignName:`${moonSignName}`}</div>
      </div>
      <div class="almanac-summary-item">
        <div class="almanac-summary-label">${lang==='zh'?'今日':'Day'}</div>
        <div class="almanac-summary-value">${planetEmoji} ${planetDayLabel}</div>
      </div>
    </div>`;

  // Category cards
  $('cat-grid').innerHTML=CAT_KEYS.map((k,i)=>`
    <div class="card cat-card interactive-card fu d${i+1}" tabindex="0" role="button" data-detail="category" data-key="${k}">
      <div class="cat-head">
        <span class="cat-icon">${CAT_ICONS[i]}</span>
        <span class="cat-name">${L[k].name}</span>
      </div>
      ${dots(ratings[k])}
      <div class="r-lbl">${L.rLbls[ratings[k]]}</div>
      <div class="cat-msg">${msgs[k]}</div>
    </div>`).join('');

  tx('oracle-txt', oracle);
  tx('sug-txt',    suggest);
}

// ═══════════════════════════════════════════════════════════════
//  INIT
// ═══════════════════════════════════════════════════════════════
function init(){
  applyTheme(theme);
  applyStaticLang();
  $('reading').addEventListener('click',onReadingClick);
  $('reading').addEventListener('keydown',onReadingKeydown);
  $('detail-modal').addEventListener('click',e=>{
    if(e.target===$('detail-modal'))closeDetail();
  });
  $('confirm-modal').addEventListener('click',e=>{
    if(e.target===$('confirm-modal'))closeConfirm();
  });
  document.addEventListener('keydown',e=>{
    if(e.key==='Escape'){
      if($('confirm-modal').classList.contains('open'))closeConfirm();
      else if($('detail-modal').classList.contains('open'))closeDetail();
    }
  });
  const bday=storage.get('cosmic_bday');
  if(bday){show('reading');renderReading(bday);}
  else show('onboarding');
  if('serviceWorker' in navigator)navigator.serviceWorker.register('./sw.js');
}

init();
