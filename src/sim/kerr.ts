/**
 * Kerr geometrisi — ekvator düzlemi (theta = pi/2), Boyer-Lindquist koordinatları.
 * Geometrik birimler: G = c = 1 ve M = 1 alınmıştır.
 * Bu yüzden "a" doğrudan boyutsuz spin parametresidir: a* = a/M  (0 <= a* < 1)
 */

// ---- Fiziksel sabitler (makro reaktör muhasebesi için) ----
export const C = 2.99792458e8; // m/s
export const G = 6.6743e-11; // m^3 kg^-1 s^-2
export const HBAR = 1.054571817e-34;
export const KB = 1.380649e-23;
export const SOLAR_MASS = 1.98892e30; // kg
export const EARTH_MASS = 5.9722e24;

export interface Orbit {
  E: number; // birim durgun kütle başına enerji  (-p_t)
  L: number; // birim durgun kütle başına açısal momentum (p_phi)
  mu: number; // 1 = kütleli parçacık, 0 = foton
}

export const rHorizon = (a: number) => 1 + Math.sqrt(Math.max(1 - a * a, 0));
export const rInner = (a: number) => 1 - Math.sqrt(Math.max(1 - a * a, 0));
export const R_ERGO = 2; // ekvatorda ergosfer sınırı daima r = 2M

export const delta = (r: number, a: number) => r * r - 2 * r + a * a;

export const bigA = (r: number, a: number) => {
  const s = r * r + a * a;
  return s * s - delta(r, a) * a * a;
};

/** Çerçeve sürüklenme açısal hızı (ZAMO) */
export const omegaDrag = (r: number, a: number) => (2 * a * r) / bigA(r, a);

/** Lapse fonksiyonu (ZAMO zaman genişlemesi) */
export const lapse = (r: number, a: number) =>
  (r * Math.sqrt(Math.max(delta(r, a), 0))) / Math.sqrt(bigA(r, a));

export const gtt = (r: number) => -(1 - 2 / r);
export const gtp = (r: number, a: number) => (-2 * a) / r;
export const gpp = (r: number, a: number) => r * r + a * a + (2 * a * a) / r;
export const grr = (r: number, a: number) => (r * r) / delta(r, a);

/** Olay ufkunun açısal hızı */
export const omegaH = (a: number) => a / (2 * rHorizon(a));

/** İndirgenemez kütle (M = 1 için):  M_irr^2 = (r_+^2 + a^2)/4 = r_+/2 */
export const mIrrNorm = (a: number) => Math.sqrt(rHorizon(a) / 2);

/** Çıkarılabilir rotasyonel enerji oranı  (M - M_irr)/M */
export const rotEnergyFraction = (a: number) => 1 - mIrrNorm(a);

/** Ekvatoral foton yörüngesi yarıçapı (üst işaret = prograd) */
export function rPhoton(a: number, prograde = true): number {
  const s = prograde ? -1 : 1;
  return 2 * (1 + Math.cos((2 / 3) * Math.acos(s * Math.min(1, Math.abs(a)))));
}

/** Radyal potansiyel:  (r^2 dr/dλ)^2 = R(r) */
export function radialR(r: number, o: Orbit, a: number): number {
  const P = o.E * (r * r + a * a) - o.L * a;
  const k = o.L - a * o.E;
  return P * P - delta(r, a) * (o.mu * o.mu * r * r + k * k);
}

export function dPhi(r: number, o: Orbit, a: number): number {
  const D = delta(r, a);
  const P = o.E * (r * r + a * a) - o.L * a;
  const k = o.L - a * o.E;
  return (k + (a * P) / D) / (r * r);
}

export function dT(r: number, o: Orbit, a: number): number {
  const D = delta(r, a);
  const P = o.E * (r * r + a * a) - o.L * a;
  const k = o.L - a * o.E;
  return (a * k + ((r * r + a * a) * P) / D) / (r * r);
}

export function dR(r: number, o: Orbit, a: number, sign: number): number {
  return (sign * Math.sqrt(Math.max(radialR(r, o, a), 0))) / (r * r);
}

export interface State {
  r: number;
  phi: number;
  sign: number; // radyal yön
}

/** RK4 ile tek adım (afin parametre λ). Dönüş noktalarında yön çevrilir. */
export function stepGeodesic(s: State, o: Orbit, a: number, dl: number): State {
  const f = (r: number, sign: number) => ({
    dr: dR(r, o, a, sign),
    dp: dPhi(r, o, a),
  });

  const sign = s.sign;
  const k1 = f(s.r, sign);
  const k2 = f(Math.max(s.r + 0.5 * dl * k1.dr, 1e-3), sign);
  const k3 = f(Math.max(s.r + 0.5 * dl * k2.dr, 1e-3), sign);
  const k4 = f(Math.max(s.r + dl * k3.dr, 1e-3), sign);

  let nr = s.r + (dl / 6) * (k1.dr + 2 * k2.dr + 2 * k3.dr + k4.dr);
  const nphi = s.phi + (dl / 6) * (k1.dp + 2 * k2.dp + 2 * k3.dp + k4.dp);
  let nsign = sign;

  // dönüş noktası kontrolü
  if (radialR(nr, o, a) < 0 || Math.abs(nr - s.r) < 1e-12) {
    nsign = -sign;
    nr = s.r + (dl / 6) * -(k1.dr + 2 * k2.dr + 2 * k3.dr + k4.dr) * 0.5;
  }
  return { r: nr, phi: nphi, sign: nsign };
}

// ---------------------------------------------------------------------------
//  PENROSE BÖLÜNMESİ
// ---------------------------------------------------------------------------
//  Ana parçacık (durgun kütle 1) ergosferde iki fotona ayrılır.
//  Kendi durgun çerçevesinde zıt yönlere e = 1/2 enerjili iki foton:
//      p_A = (1/2)(u + n),  p_B = (1/2)(u - n),   n·n = 1, n·u = 0
//  => p_A + p_B = u  (4-momentum tam olarak korunur)
//  E_A = -p_A,t = (1/2)(E_p - n_t)  ;  n_t'yi maksimize eden yön seçilirse
//      n_t^max = sqrt(E_p^2 + g_tt)  ve ergosferde g_tt = 2/r - 1 > 0
//  => E_A < 0 olabilir. Ekstremal ufukta (r=1, a=1, E_p=1):
//      eta = (sqrt(2) - 1)/2 = %20.7  — klasik Penrose limiti.
// ---------------------------------------------------------------------------

export interface SplitResult {
  neg: Orbit; // negatif enerjili foton (ufka düşer)
  esc: Orbit; // kaçan foton (enerji taşır)
  negSign: number;
  escSign: number;
  gain: number; // birim durgun kütle başına net kazanç = |E_neg|  (c^2 biriminde)
  efficiency: number; // gain / E_parent
  Ep: number;
  psi?: number;
  escapes?: boolean;
}

type Vec3 = [number, number, number]; // [t, r, phi] bileşenleri (kontravaryant)

function dot(v: Vec3, w: Vec3, r: number, a: number): number {
  return (
    gtt(r) * v[0] * w[0] +
    gtp(r, a) * (v[0] * w[2] + v[2] * w[0]) +
    gpp(r, a) * v[2] * w[2] +
    grr(r, a) * v[1] * w[1]
  );
}

/**
 * @param psi  optimal emisyon yönünden sapma açısı (radyan). 0 = maksimum verim.
 */
export function penroseSplit(
  r: number,
  a: number,
  parent: Orbit,
  sign: number,
  psi: number
): SplitResult {
  const D = delta(r, a);
  const P = parent.E * (r * r + a * a) - parent.L * a;
  const k = parent.L - a * parent.E;

  const ut = (a * k + ((r * r + a * a) * P) / D) / (r * r);
  const up = (k + (a * P) / D) / (r * r);
  const ur = (sign * Math.sqrt(Math.max(radialR(r, parent, a), 0))) / (r * r);
  const u: Vec3 = [ut, ur, up];

  const Ep = -(gtt(r) * ut + gtp(r, a) * up);

  // xi = ∂_t ; xi·u = -Ep  → xi_perp = xi - Ep*u
  const xiPerp: Vec3 = [1 - Ep * ut, -Ep * ur, -Ep * up];
  const X2 = dot(xiPerp, xiPerp, r, a);
  const X = Math.sqrt(Math.max(X2, 1e-12));
  const n1: Vec3 = [xiPerp[0] / X, xiPerp[1] / X, xiPerp[2] / X];

  // u ve n1'e dik ikinci birim vektör (Gram-Schmidt, tohum = ∂_r)
  const seed: Vec3 = [0, 1, 0];
  const su = dot(seed, u, r, a);
  const sn = dot(seed, n1, r, a);
  const w: Vec3 = [
    seed[0] + su * u[0] - sn * n1[0],
    seed[1] + su * u[1] - sn * n1[1],
    seed[2] + su * u[2] - sn * n1[2],
  ];
  const wn = Math.sqrt(Math.max(dot(w, w, r, a), 1e-12));
  const m: Vec3 = [w[0] / wn, w[1] / wn, w[2] / wn];

  const cp = Math.cos(psi);
  const sp = Math.sin(psi);
  const n: Vec3 = [cp * n1[0] + sp * m[0], cp * n1[1] + sp * m[1], cp * n1[2] + sp * m[2]];

  const e = 0.5;
  const pA: Vec3 = [e * (u[0] + n[0]), e * (u[1] + n[1]), e * (u[2] + n[2])];
  const pB: Vec3 = [e * (u[0] - n[0]), e * (u[1] - n[1]), e * (u[2] - n[2])];

  const EA = -(gtt(r) * pA[0] + gtp(r, a) * pA[2]);
  const LA = gtp(r, a) * pA[0] + gpp(r, a) * pA[2];
  const EB = -(gtt(r) * pB[0] + gtp(r, a) * pB[2]);
  const LB = gtp(r, a) * pB[0] + gpp(r, a) * pB[2];

  // hangisi negatif enerjiliyse "neg" odur
  const aIsNeg = EA < EB;
  const neg: Orbit = aIsNeg ? { E: EA, L: LA, mu: 0 } : { E: EB, L: LB, mu: 0 };
  const esc: Orbit = aIsNeg ? { E: EB, L: LB, mu: 0 } : { E: EA, L: LA, mu: 0 };

  // Dönüş noktasında bölünme olduğunda p^r ≈ 0 olur; yön radyal potansiyelin
  // eğiminden belirlenir (R'nin arttığı yöne gidilir).
  const dirOf = (o: Orbit, pr: number): number => {
    const scale = Math.abs(pA[1]) + Math.abs(pB[1]) + 1e-12;
    if (Math.abs(pr) > 1e-4 * (1 + scale) && Math.abs(radialR(r, o, a)) > 1e-7) {
      return Math.sign(pr);
    }
    const eps = 1e-3 * r;
    const slope = radialR(r + eps, o, a) - radialR(r - eps, o, a);
    return slope > 0 ? 1 : -1;
  };
  const negSign = dirOf(neg, aIsNeg ? pA[1] : pB[1]);
  const escSign = dirOf(esc, aIsNeg ? pB[1] : pA[1]);

  const gain = Math.max(-neg.E, 0);
  return { neg, esc, negSign, escSign, gain, efficiency: gain / Ep, Ep };
}

/**
 * Kütleli parçacığın r_from'dan r_to'ya dönüş noktası olmadan inip inemeyeceği.
 */
export function canReach(o: Orbit, a: number, rFrom: number, rTo: number): boolean {
  const n = 160;
  for (let i = 0; i <= n; i++) {
    const r = rFrom + ((rTo - rFrom) * i) / n;
    if (radialR(r, o, a) <= 0) return false;
  }
  return true;
}

/**
 * r0'da dönüş noktası (dr/dτ = 0) veren açısal momentum.
 * R(r0) = 0  ⟹  (2−r0)L² − 4aE·L + (E²A − Δr0²)/r0 = 0
 * Dıştan gelip r0'da duran kök seçilir (içeride yasak bölge).
 */
export function solveTurningL(r0: number, a: number, E: number): number | null {
  const D = delta(r0, a);
  const A = bigA(r0, a);
  const qa = 2 - r0;
  const qb = -4 * a * E;
  const qc = (E * E * A - D * r0 * r0) / r0;
  const roots: number[] = [];
  if (Math.abs(qa) < 1e-9) {
    if (Math.abs(qb) > 1e-12) roots.push(-qc / qb);
  } else {
    const disc = qb * qb - 4 * qa * qc;
    if (disc < 0) return null;
    const s = Math.sqrt(disc);
    roots.push((-qb - s) / (2 * qa), (-qb + s) / (2 * qa));
  }
  for (const L of roots) {
    const o: Orbit = { E, L, mu: 1 };
    if (radialR(r0 * 0.99, o, a) < 0 && radialR(r0 * 1.02, o, a) > 0) return L;
  }
  return null;
}

export interface Tune {
  E: number;
  L: number;
  ok: boolean;
  r0: number;
}

/**
 * Hedef bölünme yarıçapı için demet ayarı: enjektörden ulaşılabilen ve
 * tam r0'da duran en DÜŞÜK enerjili yörünge (en yüksek Penrose verimi).
 */
export function autoTune(r0: number, a: number, rInject: number): Tune {
  for (let i = 0; i <= 64; i++) {
    const E = 0.82 + (1.18 - 0.82) * (i / 64);
    const L = solveTurningL(r0, a, E);
    if (L === null) continue;
    const o: Orbit = { E, L, mu: 1 };
    if (!canReach(o, a, rInject, r0 * 1.02)) continue;
    return { E, L, ok: true, r0 };
  }
  return { E: 1, L: 2, ok: false, r0 };
}

/** Bir yörüngenin ergosfer içindeki en dış dönüş noktası (yoksa null) */
export function outerTurning(o: Orbit, a: number): number | null {
  const rp = rHorizon(a);
  const lo = rp * 1.002;
  const hi = 2.0;
  const n = 240;
  let prev = radialR(hi, o, a);
  for (let i = 1; i <= n; i++) {
    const r = hi - ((hi - lo) * i) / n;
    const cur = radialR(r, o, a);
    if (prev > 0 && cur <= 0) {
      // ikili arama
      let a1 = r;
      let b1 = r + (hi - lo) / n;
      for (let k = 0; k < 40; k++) {
        const m = (a1 + b1) / 2;
        if (radialR(m, o, a) <= 0) a1 = m;
        else b1 = m;
      }
      return b1;
    }
    prev = cur;
  }
  return null;
}

/**
 * Foton r0'dan başlayıp toplayıcıya ulaşabilir mi?
 * (radyal potansiyelde bariyer var mı diye bakılır — entegrasyon gerekmez)
 */
export function photonEscapes(o: Orbit, r0: number, sign: number, a: number, rMax: number): boolean {
  const rp = rHorizon(a);
  if (sign < 0) {
    // içeri gidiyor: ufuktan önce dönüş noktası bulmalı
    let found = false;
    const n = 60;
    for (let i = 1; i <= n; i++) {
      const r = r0 - ((r0 - rp * 1.01) * i) / n;
      if (radialR(r, o, a) <= 0) {
        found = true;
        break;
      }
    }
    if (!found) return false;
  }
  const n = 90;
  for (let i = 0; i <= n; i++) {
    const r = r0 + ((rMax - r0) * i) / n;
    if (radialR(r, o, a) <= 0) return false;
  }
  return true;
}

/**
 * Verilen bölünme noktasında, kaçan parçanın gerçekten kaçabildiği
 * konfigürasyonlar arasından net enerji kazancını maksimize eden emisyon yönü.
 * psiOffset: kullanıcının optimumdan sapma açısı.
 */
export function bestSplit(
  r: number,
  a: number,
  parent: Orbit,
  sign: number,
  psiOffset: number,
  rMax: number
): SplitResult | null {
  let bestPsi: number | null = null;
  let bestGain = -Infinity;
  const N = 40;
  for (let i = 0; i <= N; i++) {
    const psi = -Math.PI / 2 + (Math.PI * i) / N;
    const s = penroseSplit(r, a, parent, sign, psi);
    if (s.gain <= 0) continue;
    if (!photonEscapes(s.esc, r, s.escSign, a, rMax)) continue;
    if (s.gain > bestGain) {
      bestGain = s.gain;
      bestPsi = psi;
    }
  }
  if (bestPsi === null) {
    // kazanç sağlanamıyor: yine de görsel için ψ=0 bölünmesi döndür
    return null;
  }
  const s = penroseSplit(r, a, parent, sign, bestPsi + psiOffset);
  s.psi = bestPsi + psiOffset;
  s.escapes = photonEscapes(s.esc, r, s.escSign, a, rMax);
  return s;
}

/** Kerr ISCO yarıçapı (prograd) */
export function rISCO(a: number): number {
  const a2 = a * a;
  const z1 =
    1 + Math.cbrt(1 - a2) * (Math.cbrt(1 + a) + Math.cbrt(1 - a));
  const z2 = Math.sqrt(3 * a2 + z1 * z1);
  return 3 + z2 - Math.sqrt(Math.max((3 - z1) * (3 + z1 + 2 * z2), 0));
}

/** ISCO'daki prograd dairesel yörünge için E ve L (birim durgun kütle) */
export function iscoEL(a: number): { E: number; L: number } {
  const r = rISCO(a);
  const sr = Math.sqrt(r);
  const den = r * Math.sqrt(Math.max(r * r - 3 * r + 2 * a * sr, 1e-9));
  const E = (r * r - 2 * r + a * sr) / den;
  const L = (sr * (r * r - 2 * a * sr + a * a)) / den;
  return { E, L };
}

/** Hawking sıcaklığı (K) — dönen kara delik */
export function hawkingTemp(Mkg: number, a: number): number {
  const rp = rHorizon(a); // M birimi
  const kappa = Math.sqrt(Math.max(1 - a * a, 0)) / (2 * rp); // M = 1 birimde yüzey çekimi
  const Mgeo = (G * Mkg) / (C * C); // metre
  return (HBAR * C * kappa) / (2 * Math.PI * KB * Mgeo);
}

/** Hawking ışıma gücü (W) — Schwarzschild yaklaşımı */
export function hawkingPower(Mkg: number): number {
  return 3.5629e32 / (Mkg * Mkg);
}
