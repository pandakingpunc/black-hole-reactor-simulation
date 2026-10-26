const SUP = ['⁰', '¹', '²', '³', '⁴', '⁵', '⁶', '⁷', '⁸', '⁹'];

export function sup(n: number): string {
  const s = Math.abs(Math.round(n)).toString().split('').map((d) => SUP[+d]).join('');
  return (n < 0 ? '⁻' : '') + s;
}

/** 1.24×10¹² biçiminde bilimsel gösterim */
export function sci(v: number, digits = 2): string {
  if (!isFinite(v)) return '∞';
  if (v === 0) return '0';
  const neg = v < 0;
  const av = Math.abs(v);
  const e = Math.floor(Math.log10(av));
  const m = av / Math.pow(10, e);
  if (e >= -2 && e <= 3) {
    const f = av >= 100 ? 0 : av >= 10 ? 1 : digits;
    return (neg ? '−' : '') + av.toFixed(f);
  }
  return `${neg ? '−' : ''}${m.toFixed(digits)}×10${sup(e)}`;
}

const PREFIX: [number, string][] = [
  [1e24, 'Y'],
  [1e21, 'Z'],
  [1e18, 'E'],
  [1e15, 'P'],
  [1e12, 'T'],
  [1e9, 'G'],
  [1e6, 'M'],
  [1e3, 'k'],
  [1, ''],
  [1e-3, 'm'],
  [1e-6, 'µ'],
  [1e-9, 'n'],
  [1e-12, 'p'],
  [1e-15, 'f'],
];

/** SI ön ekli gösterim: 3.4 GW gibi */
export function si(v: number, unit = '', digits = 2): string {
  if (!isFinite(v)) return '∞ ' + unit;
  const av = Math.abs(v);
  if (av === 0) return `0 ${unit}`;
  if (av >= 1e27 || av < 1e-15) return `${sci(v, digits)} ${unit}`;
  for (const [f, p] of PREFIX) {
    if (av >= f) {
      const x = v / f;
      return `${x.toFixed(Math.abs(x) >= 100 ? 0 : Math.abs(x) >= 10 ? 1 : digits)} ${p}${unit}`;
    }
  }
  return `${sci(v, digits)} ${unit}`;
}

const YEAR = 3.15576e7;

const DUR_UNITS = {
  en: { inf: 'infinite', min: 'min', h: 'h', d: 'days', y: 'yr', ky: 'thousand yr', My: 'million yr', Gy: 'billion yr' },
  tr: { inf: 'sonsuz', min: 'dk', h: 'saat', d: 'gün', y: 'yıl', ky: 'bin yıl', My: 'milyon yıl', Gy: 'milyar yıl' },
};

/** Süreyi seçili dilde okunur hale getir */
export function dur(s: number, lang: 'en' | 'tr' = 'en'): string {
  const u = DUR_UNITS[lang];
  if (!isFinite(s)) return u.inf;
  if (s < 1e-9) return `${sci(s, 1)} s`;
  if (s < 1e-3) return `${(s * 1e6).toFixed(1)} µs`;
  if (s < 1) return `${(s * 1e3).toFixed(1)} ms`;
  if (s < 90) return `${s.toFixed(1)} s`;
  if (s < 5400) return `${(s / 60).toFixed(1)} ${u.min}`;
  if (s < 172800) return `${(s / 3600).toFixed(1)} ${u.h}`;
  if (s < YEAR) return `${(s / 86400).toFixed(1)} ${u.d}`;
  const y = s / YEAR;
  if (y < 1e3) return `${y.toFixed(1)} ${u.y}`;
  if (y < 1e6) return `${(y / 1e3).toFixed(1)} ${u.ky}`;
  if (y < 1e9) return `${(y / 1e6).toFixed(1)} ${u.My}`;
  if (y < 1e12) return `${(y / 1e9).toFixed(1)} ${u.Gy}`;
  return `${sci(y, 2)} ${u.y}`;
}

export function pct(v: number, d = 1): string {
  return `${(v * 100).toFixed(d)}%`;
}

export function massLabel(kg: number): string {
  if (kg >= 1e29) return `${(kg / 1.98892e30).toFixed(3)} M☉`;
  if (kg >= 1e22) return `${(kg / 5.9722e24).toFixed(3)} M⊕`;
  return `${si(kg, 'kg')}`;
}
