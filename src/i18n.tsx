import { createContext, useCallback, useContext, useEffect, useState, type ReactNode } from 'react';

export type Lang = 'en' | 'tr';

const STORAGE_KEY = 'kerr-reactor-lang';

const en = {
  docTitle: 'Kerr–Penrose Black Hole Reactor · Ergosphere Energy Simulation',

  // header
  title: 'Kerr–Penrose Rotational Energy Reactor',
  subtitle: 'ergosphere energy extraction facility · real-time geodesic solver',
  pause: '❚❚ PAUSE',
  run: '▶ RUN',
  reset: '⟲ RESET',
  physics: '? PHYSICS',
  presets: {
    lab: { name: 'Lab Core', desc: '10⁹ tonnes · horizon ≈ 1 fm' },
    ind: { name: 'Industrial Plant', desc: '10¹⁸ kg · horizon ≈ 1 nm' },
    stellar: { name: 'Stellar Class', desc: '10 M☉ · horizon ≈ 18 km' },
    extreme: { name: 'Extremal Test', desc: 'a* = 0.9995 · max. efficiency' },
    dying: { name: 'Spun-Down Core', desc: 'a* = 0.62 · dead core, rescued with 60% spin-up' },
  },

  // canvas overlay
  coords: 'equatorial plane · Boyer–Lindquist · G = c = M = 1',
  reactorClock: 'reactor clock',
  scale: 'scale',
  output: 'output',
  legendFeed: 'feed (E>0, massive)',
  legendNeg: 'negative energy → horizon',
  legendEsc: 'escaping photon → harvest',
  legendA: 'The particle splits in two ',
  legendStop: 'the moment it stops',
  legendB:
    ' in the ergosphere: the negative-energy piece falls through the horizon and slows the black hole down, the other escapes with more energy than we sent in.',
  labels: 'labels',
  dust: 'frame-drag dust',
  paused: 'REACTOR PAUSED — space bar',
  historyTitle: 'output power · spin · efficiency history',
  peakPower: 'peak power',

  // canvas labels
  cvErgo: 'ERGOSPHERE  r = 2M',
  cvHorizon: 'EVENT HORIZON  r₊ = ',
  cvCollector: 'ENERGY COLLECTOR RING',
  cvSplit: 'split  r = ',
  cvInjector: 'BEAM INJECTOR',
  cvDrag: 'frame dragging',

  // history chart
  chWaiting: 'waiting for data…',
  chPower: 'power',
  chLog: 'log scale · 6 decades',

  // control panel
  cpCore: 'Black Hole Core',
  cpSpin: 'Spin parameter  a* = Jc/GM²',
  cpSpinHint: (thick: string, frac: string) => `ergosphere thickness ${thick}M · extractable energy ${frac}% Mc²`,
  cpMass: 'Core mass  M',
  cpBeam: 'Feed Beam (micro)',
  cpAuto: 'Automatic beam focusing',
  cpAutoHint: 'solves E and L so that the turning point lands exactly on the target radius',
  cpSplit: 'Split radius (target)',
  cpSplitHint: (rp: string) => `the closer to the horizon, the higher the efficiency (r₊=${rp}M · ergosphere 2M)`,
  cpLSolved: 'Angular momentum L (solved)',
  cpL: 'Angular momentum  L/μM',
  cpLHint: 'too large and the particle bounces off the orbital barrier before reaching the ergosphere',
  cpESolved: 'Injection energy E (solved)',
  cpE: 'Injection energy  E/μc²',
  cpEHint: '1.000 = free fall from infinity · lower E = higher efficiency',
  cpPsi: 'Emission direction offset  ψ',
  cpPsiHint: '0° = the optimal recoil axis that maximizes the negative energy',
  cpJitter: 'Beam spread (jitter)',
  cpJitterHint: 'collimation error — more missed and swallowed particles',
  cpRate: 'Fire rate',
  cpAnim: 'Animation speed',
  cpCycle: 'Reactor Cycle (macro)',
  cpMdot: 'Mass flux  ṁ',
  cpMdotHint: 'total rest mass sent into the ergosphere per second',
  cpTime: 'Time scale',
  cpTimeHint: '1 real second = this many reactor seconds',
  cpSpinUp: 'Spin-up (ISCO accretion)',
  cpSpinUpHint: 'this share of the flux is accreted from a prograde disk and restores the spin',
  cpHawking: 'Hawking evaporation',
  cpHawkingHint: 'the dominant loss channel for small cores',

  // telemetry
  stDepleted: 'CORE DEPLETED',
  stReverse: 'REVERSE CYCLE — FEEDING THE BLACK HOLE',
  stLowSpin: 'STALLED — SPIN TOO LOW (a* ≳ 0.8)',
  stMistuned: 'STALLED — BEAM MISTUNED',
  stNetLoss: 'NET LOSS — LOW COLLECTION YIELD',
  stWarn: 'WARNING — SPIN NEARING THE FLOOR',
  stNominal: 'NOMINAL — EXTRACTING ENERGY',
  tmNetPower: 'Net Power to Grid',
  tmWorld: "of humanity's total energy consumption",
  tmSun: "the Sun's luminosity",
  tmTotal: 'Total Net Output',
  tmGross: 'gross',
  tmClock: 'Reactor Clock',
  tmEffective: 'effective',
  tmBalance: 'Energy Balance',
  tmEtaSub: 'net output / fed mass-energy',
  tmCeiling: 'ceiling',
  tmCeilingSub: 'horizon-adjacent split at this spin',
  tmPenroseLimit: 'absolute Penrose limit (√2−1)/2 = 20.71%',
  tmPerMass: 'per unit rest mass (c²)',
  tmRowFed: 'fed       E_p',
  tmRowNeg: 'swallowed E_neg',
  tmRowEsc: 'escaping  E_esc',
  tmRowHarvest: 'collected y·E_esc',
  tmRowNet: 'NET',
  tmSplitR: 'Split r₀',
  tmTurning: 'turning pt.',
  tmPlunge: 'plunging',
  tmNone: 'none',
  tmBeamE: 'Beam E',
  tmQuality: 'Quality',
  tmJitterLoss: 'jitter loss',
  tmNoteA: "When the negative-energy piece is swallowed, the black hole's mass ",
  tmNoteDec: 'decreases',
  tmNoteB:
    '; the escaping photon carries more energy than we sent in. Every photon that fails to escape is a straight loss.',
  tmCore: 'Core Status',
  tmMass: 'Mass M',
  tmSpin: 'Spin a*',
  tmHorizon: 'Horizon r₊',
  tmErgo: 'Ergosphere r_E',
  tmErgoSub: '2.000 M (equator)',
  tmIrr: 'Irreducible mass',
  tmIrrSub: 'can never decrease',
  tmHawkingT: 'Hawking T',
  tmLoss: 'loss',
  tmFuel: 'remaining rotational fuel',
  tmDepletion: 'time to depletion at current power',
  tmFloor: 'practical floor (turning point vanishes)',
  tmCounters: 'Beam Counters',
  tmInjected: 'Injected',
  tmSplits: 'Splits',
  tmHarvested: 'Harvested',
  tmSwallowed: 'Swallowed',
  tmNoEscape: "didn't escape",
  tmRejMiss: 'Rejected/Missed',
  tmShotControl: 'shot control',
  tmActive: 'Active',
  tmYield: 'collection yield y',

  // physics modal
  pmTitle: 'Penrose Reactor — Physics Notebook',
  pmClose: 'close ✕',
};

export type Dict = typeof en;

const tr: Dict = {
  docTitle: 'Kerr–Penrose Kara Delik Reaktörü · Ergosfer Enerji Simülasyonu',

  title: 'Kerr–Penrose Rotasyonel Enerji Reaktörü',
  subtitle: 'ergosfer enerji çıkarma tesisi · gerçek zamanlı jeodezik çözücü',
  pause: '❚❚ DURAKLAT',
  run: '▶ ÇALIŞTIR',
  reset: '⟲ SIFIRLA',
  physics: '? FİZİK',
  presets: {
    lab: { name: 'Laboratuvar Çekirdeği', desc: '10⁹ ton · ufuk ≈ 1 fm' },
    ind: { name: 'Endüstriyel Santral', desc: '10¹⁸ kg · ufuk ≈ 1 nm' },
    stellar: { name: 'Yıldız Sınıfı', desc: '10 M☉ · ufuk ≈ 18 km' },
    extreme: { name: 'Ekstremal Test', desc: 'a* = 0.9995 · maks. verim' },
    dying: { name: 'Sönümlü Çekirdek', desc: 'a* = 0.62 · ölü çekirdek, %60 yeniden döndürme ile kurtarma' },
  },

  coords: 'ekvator düzlemi · Boyer–Lindquist · G = c = M = 1',
  reactorClock: 'reaktör saati',
  scale: 'ölçek',
  output: 'çıkış',
  legendFeed: 'besleme (E>0, kütleli)',
  legendNeg: 'negatif enerji → ufka',
  legendEsc: 'kaçan foton → hasat',
  legendA: 'Parçacık ergosferde ',
  legendStop: 'durduğu an',
  legendB:
    ' ikiye ayrılır: negatif enerjili parça ufka düşüp kara deliği yavaşlatır, diğeri gönderdiğimizden fazla enerjiyle kaçar.',
  labels: 'etiketler',
  dust: 'sürüklenme tozu',
  paused: 'REAKTÖR DURAKLATILDI — boşluk tuşu',
  historyTitle: 'çıkış gücü · spin · verim geçmişi',
  peakPower: 'tepe güç',

  cvErgo: 'ERGOSFER  r = 2M',
  cvHorizon: 'OLAY UFKU  r₊ = ',
  cvCollector: 'ENERJİ TOPLAYICI HALKA',
  cvSplit: 'bölünme  r = ',
  cvInjector: 'DEMET ENJEKTÖRÜ',
  cvDrag: 'çerçeve sürüklenmesi',

  chWaiting: 'veri bekleniyor…',
  chPower: 'güç',
  chLog: 'log ölçek · 6 dekad',

  cpCore: 'Kara Delik Çekirdeği',
  cpSpin: 'Spin parametresi  a* = Jc/GM²',
  cpSpinHint: (thick, frac) => `ergosfer kalınlığı ${thick}M · çıkarılabilir enerji ${frac}% Mc²`,
  cpMass: 'Çekirdek kütlesi  M',
  cpBeam: 'Besleme Demeti (mikro)',
  cpAuto: 'Otomatik demet odaklama',
  cpAutoHint: "E ve L'yi, dönüş noktası tam hedef yarıçapta olacak şekilde çözer",
  cpSplit: 'Bölünme yarıçapı (hedef)',
  cpSplitHint: (rp) => `ufka ne kadar yakınsa verim o kadar yüksek (r₊=${rp}M · ergosfer 2M)`,
  cpLSolved: 'Açısal momentum L (çözülen)',
  cpL: 'Açısal momentum  L/μM',
  cpLHint: 'çok büyükse parçacık yörünge bariyerinden seker, ergosfere giremez',
  cpESolved: 'Enjeksiyon enerjisi E (çözülen)',
  cpE: 'Enjeksiyon enerjisi  E/μc²',
  cpEHint: '1.000 = sonsuzdan serbest düşüş · düşük E = yüksek verim',
  cpPsi: 'Emisyon yönü sapması  ψ',
  cpPsiHint: '0° = negatif enerjiyi maksimize eden optimal geri-tepme ekseni',
  cpJitter: 'Demet dağınıklığı (jitter)',
  cpJitterHint: 'kolimasyon hatası — ıskalayan ve yutulan parçacıkları artırır',
  cpRate: 'Atış hızı',
  cpAnim: 'Animasyon hızı',
  cpCycle: 'Reaktör Çevrimi (makro)',
  cpMdot: 'Kütle akısı  ṁ',
  cpMdotHint: 'ergosfere saniyede gönderilen toplam durgun kütle',
  cpTime: 'Zaman ölçeği',
  cpTimeHint: '1 gerçek saniye = bu kadar reaktör saniyesi',
  cpSpinUp: 'Yeniden döndürme (ISCO birikimi)',
  cpSpinUpHint: 'akının bu kısmı prograd diskten yutularak spini geri yükler',
  cpHawking: 'Hawking buharlaşması',
  cpHawkingHint: 'küçük çekirdeklerde baskın kayıp kanalı',

  stDepleted: 'ÇEKİRDEK TÜKENDİ',
  stReverse: 'TERS ÇEVRİM — KARA DELİK BESLENİYOR',
  stLowSpin: 'DURDU — SPİN YETERSİZ (a* ≳ 0.8)',
  stMistuned: 'DURDU — DEMET AYARI BOZUK',
  stNetLoss: 'NET KAYIP — TOPLAMA VERİMİ DÜŞÜK',
  stWarn: 'UYARI — SPİN TABANA YAKLAŞIYOR',
  stNominal: 'NOMİNAL — ENERJİ ÇEKİLİYOR',
  tmNetPower: 'Şebekeye Net Güç',
  tmWorld: 'insanlığın toplam enerji tüketimi',
  tmSun: "Güneş'in ışıma gücü",
  tmTotal: 'Toplam Net Üretim',
  tmGross: 'brüt',
  tmClock: 'Reaktör Saati',
  tmEffective: 'etkin',
  tmBalance: 'Enerji Dengesi',
  tmEtaSub: 'net çıkış / beslenen kütle-enerji',
  tmCeiling: 'tavan',
  tmCeilingSub: 'bu spinde ufka bitişik bölünme',
  tmPenroseLimit: 'mutlak Penrose limiti (√2−1)/2 = 20.71%',
  tmPerMass: 'birim durgun kütle başına (c²)',
  tmRowFed: 'beslenen  E_p',
  tmRowNeg: 'yutulan   E_neg',
  tmRowEsc: 'kaçan     E_esc',
  tmRowHarvest: 'toplanan  y·E_esc',
  tmRowNet: 'NET',
  tmSplitR: 'Bölünme r₀',
  tmTurning: 'dönüş nok.',
  tmPlunge: 'dalışta',
  tmNone: 'yok',
  tmBeamE: 'Demet E',
  tmQuality: 'Kalite',
  tmJitterLoss: 'jitter kaybı',
  tmNoteA: 'Negatif enerjili parça yutulduğunda kara deliğin kütlesi ',
  tmNoteDec: 'azalır',
  tmNoteB: '; kaçan foton gönderdiğimizden fazla enerji taşır. Kaçamayan her foton ise doğrudan zarardır.',
  tmCore: 'Çekirdek Durumu',
  tmMass: 'Kütle M',
  tmSpin: 'Spin a*',
  tmHorizon: 'Ufuk r₊',
  tmErgo: 'Ergosfer r_E',
  tmErgoSub: '2.000 M (ekvator)',
  tmIrr: 'İndirgenemez kütle',
  tmIrrSub: 'asla azalamaz',
  tmHawkingT: 'Hawking T',
  tmLoss: 'kayıp',
  tmFuel: 'kalan rotasyonel yakıt',
  tmDepletion: 'mevcut güçte tükenme süresi',
  tmFloor: 'pratik taban (dönüş noktası kaybolur)',
  tmCounters: 'Demet Sayaçları',
  tmInjected: 'Enjekte',
  tmSplits: 'Bölünme',
  tmHarvested: 'Hasat',
  tmSwallowed: 'Yutulan',
  tmNoEscape: 'kaçamadı',
  tmRejMiss: 'Red/Iska',
  tmShotControl: 'atış kontrol',
  tmActive: 'Aktif',
  tmYield: 'toplama verimliliği y',

  pmTitle: 'Penrose Reaktörü — Fizik Defteri',
  pmClose: 'kapat ✕',
};

const DICTS: Record<Lang, Dict> = { en, tr };

const isLang = (v: unknown): v is Lang => v === 'en' || v === 'tr';

/** Öncelik: ?lang= parametresi, sonra kayıtlı seçim, yoksa İngilizce */
function initialLang(): Lang {
  try {
    const q = new URLSearchParams(window.location.search).get('lang');
    if (isLang(q)) return q;
  } catch {
    /* yok say */
  }
  try {
    const s = window.localStorage.getItem(STORAGE_KEY);
    if (isLang(s)) return s;
  } catch {
    /* yok say */
  }
  return 'en';
}

interface LangCtx {
  lang: Lang;
  setLang: (l: Lang) => void;
  t: Dict;
}

const Ctx = createContext<LangCtx | null>(null);

export function LangProvider({ children }: { children: ReactNode }) {
  const [lang, setLangState] = useState<Lang>(initialLang);

  const setLang = useCallback((l: Lang) => {
    setLangState(l);
    try {
      window.localStorage.setItem(STORAGE_KEY, l);
    } catch {
      /* yok say */
    }
  }, []);

  useEffect(() => {
    document.documentElement.lang = lang;
    document.title = DICTS[lang].docTitle;
  }, [lang]);

  return <Ctx.Provider value={{ lang, setLang, t: DICTS[lang] }}>{children}</Ctx.Provider>;
}

export function useLang(): LangCtx {
  const c = useContext(Ctx);
  if (!c) throw new Error('useLang must be used inside <LangProvider>');
  return c;
}
