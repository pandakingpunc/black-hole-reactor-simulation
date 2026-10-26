import * as K from './kerr';

export type Kind = 'feed' | 'neg' | 'esc';

export interface Particle {
  id: number;
  kind: Kind;
  r: number;
  phi: number;
  sign: number;
  orbit: K.Orbit;
  trail: Float32Array;
  trailLen: number;
  trailHead: number;
  age: number;
  dead: boolean;
  energy: number;
}

export interface Params {
  auto: boolean; // otomatik demet odaklama
  Lp: number;
  Ep: number;
  splitFrac: number; // 0 = ufka en yakın uygulanabilir, 1 = ergosfer sınırı
  psi: number; // optimumdan sapma
  jitter: number;
  rate: number;
  microSpeed: number;
  mdot: number;
  timeScale: number;
  hawking: boolean;
  spinUpFrac: number;
  running: boolean;
}

export interface Event {
  eta: number;
  gain: number;
  Eneg: number;
  Lneg: number;
  rel: number; // olay kazancı / o andaki nominal kazanç
}

export interface Reactor {
  Mkg: number;
  aStar: number;
  M0: number;
  clock: number;
  energyJ: number;
  grossJ: number;
  power: number;
  hawkingLossJ: number;
  spunUpJ: number;
  depleted: boolean;
}

export interface Sample {
  t: number;
  power: number;
  aStar: number;
  eta: number;
  mass: number;
}

export interface Tune {
  E: number;
  L: number;
  r0: number;
  mode: 'turning' | 'plunge' | 'none';
  rMinFeasible: number;
}

export const R_INJECT = 9.4;
export const R_COLLECT = 11.6;
export const TRAIL_MAX = 80;
const C2 = K.C * K.C;

function makeParticle(id: number, kind: Kind, r: number, phi: number, sign: number, orbit: K.Orbit): Particle {
  return {
    id,
    kind,
    r,
    phi,
    sign,
    orbit,
    trail: new Float32Array(TRAIL_MAX * 2),
    trailLen: 0,
    trailHead: 0,
    age: 0,
    dead: false,
    energy: Math.abs(orbit.E),
  };
}

export class ReactorEngine {
  params: Params = {
    auto: true,
    Lp: 2.0,
    Ep: 1.0,
    splitFrac: 0.05,
    psi: 0,
    jitter: 0.08,
    rate: 7,
    microSpeed: 1,
    mdot: 1e3,
    timeScale: 1e6,
    hawking: true,
    spinUpFrac: 0,
    running: true,
  };

  reactor: Reactor = {
    Mkg: 1e12,
    aStar: 0.95,
    M0: 1e12,
    clock: 0,
    energyJ: 0,
    grossJ: 0,
    power: 0,
    hawkingLossJ: 0,
    spunUpJ: 0,
    depleted: false,
  };

  particles: Particle[] = [];
  events: Event[] = [];
  history: Sample[] = [];
  collectorFlashes: { phi: number; t: number; e: number }[] = [];
  splitFlashes: { r: number; phi: number; t: number; gain: number }[] = [];
  counts = { injected: 0, split: 0, harvested: 0, lostEsc: 0, missed: 0, fizzle: 0, rejected: 0 };

  yieldSmooth = 0.8;
  private hWin = 0;
  private lWin = 0;
  etaSmooth = 0;
  simTime = 0;
  effTimeScale = 1;
  stalled = false;
  quality = 1;
  balance = { Ep: 1, Eneg: 0, Eesc: 1, y: 1, gain: 0, net: 0, harvest: 1, dM: 0 };

  private nextId = 1;
  private spawnAcc = 0;
  private sampleAcc = 0;
  private powerAvg = 0;
  private tuneCache: { key: string; tune: Tune } | null = null;
  private nomCache: { key: string; res: K.SplitResult | null } | null = null;

  // ---------------- demet ayarı ----------------
  get tune(): Tune {
    const p = this.params;
    const a = Math.max(this.reactor.aStar, 1e-4);
    const key = `${a.toFixed(4)}|${p.splitFrac.toFixed(3)}|${p.auto}|${p.Lp.toFixed(3)}|${p.Ep.toFixed(3)}`;
    if (this.tuneCache && this.tuneCache.key === key) return this.tuneCache.tune;
    const tune = this.computeTune(a);
    this.tuneCache = { key, tune };
    return tune;
  }

  private computeTune(a: number): Tune {
    const p = this.params;
    const rp = K.rHorizon(a);
    const lo = rp * 1.015;
    const hi = 1.995;

    if (!p.auto) {
      // elle ayar: parçacığın ergosfer içindeki gerçek dönüş noktasında böl
      const o: K.Orbit = { E: p.Ep, L: p.Lp, mu: 1 };
      const rt = K.outerTurning(o, a);
      if (rt !== null && K.canReach(o, a, R_INJECT, rt * 1.02)) {
        return { E: p.Ep, L: p.Lp, r0: rt, mode: 'turning', rMinFeasible: lo };
      }
      const r0 = Math.max(lo, lo + (hi - lo) * p.splitFrac);
      return { E: p.Ep, L: p.Lp, r0, mode: K.canReach(o, a, R_INJECT, r0) ? 'plunge' : 'none', rMinFeasible: lo };
    }

    // uygulanabilir en derin dönüş noktası
    let rMin = hi;
    const N = 26;
    for (let i = 0; i <= N; i++) {
      const r = lo + ((hi - lo) * i) / N;
      if (K.autoTune(r, a, R_INJECT * 1.06).ok) {
        rMin = r;
        break;
      }
    }
    // Demet jitter'ının en kötü durumunda (L biraz düşük, E biraz yüksek) bile
    // dönüş noktası hâlâ var olmalı; aksi halde parçacık dalar ve enerji kaybolur.
    const target = lo + (hi - lo) * p.splitFrac;
    let fallback: Tune | null = null;
    for (let k = 0; k < 18; k++) {
      const r0 = Math.min(1.99, Math.max(target, rMin * (1 + 0.016 * k)));
      const t = K.autoTune(r0, a, R_INJECT * 1.06);
      if (!t.ok) continue;
      const cand: Tune = { E: t.E, L: t.L, r0, mode: 'turning', rMinFeasible: rMin };
      if (!fallback) fallback = cand;
      const worst: K.Orbit = {
        E: t.E * (1 + 0.016 * p.jitter),
        L: t.L * (1 - 0.075 * p.jitter),
        mu: 1,
      };
      if (K.outerTurning(worst, a) !== null) return cand;
      if (r0 >= 1.99) break;
    }
    if (fallback) return fallback;

    // dönüş noktası yok → dalışta böl, bariyere en yakın L'yi seç
    let bestL = 0;
    for (let i = 24; i >= 0; i--) {
      const L = (4.2 * i) / 24;
      if (K.canReach({ E: 1, L, mu: 1 }, a, R_INJECT, target)) {
        bestL = L;
        break;
      }
    }
    return { E: 1, L: bestL, r0: target, mode: 'plunge', rMinFeasible: rMin };
  }

  get rSplit(): number {
    return this.tune.r0;
  }

  /** Jittersiz nominal olay — makro muhasebe ve göstergeler için */
  nominalSplit(): K.SplitResult | null {
    const a = Math.max(this.reactor.aStar, 1e-4);
    const t = this.tune;
    const key = `${a.toFixed(4)}|${t.r0.toFixed(4)}|${t.E.toFixed(4)}|${t.L.toFixed(4)}|${this.params.psi.toFixed(3)}`;
    if (this.nomCache && this.nomCache.key === key) return this.nomCache.res;
    const parent: K.Orbit = { E: t.E, L: t.L, mu: 1 };
    let res: K.SplitResult | null = null;
    if (t.mode !== 'none') {
      res = K.bestSplit(t.r0, a, parent, -1, this.params.psi, R_COLLECT);
    }
    this.nomCache = { key, res };
    return res;
  }

  reset(Mkg: number, aStar: number) {
    this.particles = [];
    this.events = [];
    this.history = [];
    this.collectorFlashes = [];
    this.splitFlashes = [];
    this.counts = { injected: 0, split: 0, harvested: 0, lostEsc: 0, missed: 0, fizzle: 0, rejected: 0 };
    this.reactor = {
      Mkg,
      aStar,
      M0: Mkg,
      clock: 0,
      energyJ: 0,
      grossJ: 0,
      power: 0,
      hawkingLossJ: 0,
      spunUpJ: 0,
      depleted: false,
    };
    this.simTime = 0;
    this.powerAvg = 0;
    this.yieldSmooth = 0.8;
    this.hWin = 0;
    this.lWin = 0;
    this.etaSmooth = 0;
    this.tuneCache = null;
    this.nomCache = null;
    this.stalled = false;
  }

  private pushTrail(p: Particle) {
    p.trail[p.trailHead * 2] = p.r * Math.cos(p.phi);
    p.trail[p.trailHead * 2 + 1] = p.r * Math.sin(p.phi);
    p.trailHead = (p.trailHead + 1) % TRAIL_MAX;
    if (p.trailLen < TRAIL_MAX) p.trailLen++;
  }

  private spawn() {
    const p = this.params;
    const a = Math.max(this.reactor.aStar, 1e-4);
    const t = this.tune;
    const j = p.jitter;
    const L = t.L * (1 + (Math.random() - 0.5) * 0.14 * j);
    const E = t.E * (1 + (Math.random() - 0.5) * 0.03 * j);
    const orbit: K.Orbit = { E, L, mu: 1 };
    if (K.radialR(R_INJECT, orbit, a) <= 0) {
      this.counts.rejected++;
      return;
    }
    // atış kontrol: dönüş noktası oluşmayan atışlar ateşlenmez (boşa yakıt)
    if (t.mode === 'turning' && K.outerTurning(orbit, a) === null) {
      this.counts.rejected++;
      return;
    }
    const phi = -0.3 + (Math.random() - 0.5) * 0.08;
    this.particles.push(makeParticle(this.nextId++, 'feed', R_INJECT, phi, -1, orbit));
    this.counts.injected++;
  }

  private advance(p: Particle, dl: number) {
    const a = Math.max(this.reactor.aStar, 1e-4);
    let remaining = dl;
    let guard = 0;
    while (remaining > 1e-9 && guard++ < 48) {
      const vr = Math.abs(K.dR(p.r, p.orbit, a, p.sign));
      const vp = Math.abs(K.dPhi(p.r, p.orbit, a)) * p.r;
      const v = Math.max(Math.hypot(vr, vp), 1e-6);
      const step = Math.min(remaining, 0.07 / v);
      const s = K.stepGeodesic({ r: p.r, phi: p.phi, sign: p.sign }, p.orbit, a, step);
      p.r = s.r;
      p.phi = s.phi;
      p.sign = s.sign;
      remaining -= step;
      p.age += step;
    }
  }

  private doSplit(p: Particle) {
    const a = Math.max(this.reactor.aStar, 1e-4);
    const jit = (Math.random() - 0.5) * 0.9 * this.params.jitter;
    const psi = this.params.psi + jit;
    const res = K.bestSplit(p.r, a, p.orbit, p.sign, psi, R_COLLECT);
    this.counts.split++;
    p.dead = true;

    const s = res ?? K.penroseSplit(p.r, a, p.orbit, p.sign, psi);
    if (!res) this.counts.fizzle++;
    this.splitFlashes.push({ r: p.r, phi: p.phi, t: 0, gain: Math.max(s.gain, 0) });
    if (this.splitFlashes.length > 24) this.splitFlashes.shift();

    // dönüş noktasında p^r ≈ 0 olduğundan küçük bir itmeyle başlat
    const nudge = (sign: number) => p.r * (1 + sign * 2.5e-3);
    const neg = makeParticle(this.nextId++, 'neg', nudge(s.negSign), p.phi, s.negSign, s.neg);
    const esc = makeParticle(this.nextId++, 'esc', nudge(s.escSign), p.phi, s.escSign, s.esc);
    neg.energy = Math.abs(s.neg.E);
    esc.energy = Math.abs(s.esc.E);
    this.particles.push(neg, esc);

    const nom = this.nominalSplit();
    const nomGain = nom ? nom.gain : 0;
    this.events.push({
      eta: s.efficiency,
      gain: Math.max(s.gain, 0),
      Eneg: s.neg.E,
      Lneg: s.neg.L,
      rel: nomGain > 1e-12 ? Math.max(s.gain, 0) / nomGain : 0,
    });
    if (this.events.length > 160) this.events.shift();
  }

  stepMicro(dtReal: number) {
    const p = this.params;
    const a = Math.max(this.reactor.aStar, 1e-4);
    const rp = K.rHorizon(a);
    const dl = dtReal * 5.5 * p.microSpeed;
    this.simTime += dtReal * p.microSpeed;

    this.spawnAcc += dtReal * p.rate * p.microSpeed;
    while (this.spawnAcc >= 1) {
      this.spawnAcc -= 1;
      if (this.particles.length < 240) this.spawn();
    }

    const rs = this.rSplit;
    for (const q of this.particles) {
      if (q.dead) continue;
      this.advance(q, dl);
      this.pushTrail(q);

      if (q.kind === 'feed') {
        // İdeal: parçacığın KENDİ dönüş noktası (radyal yön döndüğü an).
        // Dönüş noktası yoksa ufka dalmadan hemen önce son şans bölünmesi.
        const turned = q.sign > 0 && q.r < 2.04;
        const lastChance = q.r <= Math.max(rp * 1.045, rs * 0.86);
        if (turned || lastChance) {
          this.doSplit(q);
          continue;
        }
        if (q.r >= R_INJECT + 1.5) {
          q.dead = true;
          this.counts.missed++;
          continue;
        }
        if (q.r <= rp * 1.02) {
          q.dead = true;
          this.counts.missed++;
          continue;
        }
      } else if (q.kind === 'neg') {
        if (q.r <= rp * 1.02) q.dead = true;
        if (q.r >= R_COLLECT) q.dead = true;
      } else {
        if (q.r >= R_COLLECT) {
          q.dead = true;
          this.counts.harvested++;
          this.hWin += 1;
          this.collectorFlashes.push({ phi: q.phi, t: 0, e: q.energy });
          if (this.collectorFlashes.length > 36) this.collectorFlashes.shift();
        } else if (q.r <= rp * 1.02) {
          q.dead = true;
          this.counts.lostEsc++;
          this.lWin += 1;
        }
      }
      if (q.age > 260) q.dead = true;
    }
    this.particles = this.particles.filter((x) => !x.dead);

    for (const f of this.collectorFlashes) f.t += dtReal;
    this.collectorFlashes = this.collectorFlashes.filter((f) => f.t < 0.9);
    for (const f of this.splitFlashes) f.t += dtReal;
    this.splitFlashes = this.splitFlashes.filter((f) => f.t < 0.7);

    // kayan pencere ile toplama verimi (3 s zaman sabiti + zayıf önsel)
    const decay = Math.exp(-dtReal / 6);
    this.hWin *= decay;
    this.lWin *= decay;
    this.yieldSmooth = (this.hWin + 0.15) / (this.hWin + this.lWin + 0.18);
  }

  stepMacro(dtReal: number) {
    const rc = this.reactor;
    const p = this.params;
    if (rc.depleted) {
      rc.power = 0;
      return;
    }

    const nom = this.nominalSplit();
    const a = Math.max(rc.aStar, 1e-6);

    // Büyüklük daima GÜNCEL duruma ait nominal olaydan gelir; mikro simülasyon
    // yalnızca bir "kalite katsayısı" (jitter + toplama kaybı) sağlar.
    let quality = 1;
    if (this.events.length > 10) {
      const n = Math.min(this.events.length, 60);
      let q = 0;
      for (let i = this.events.length - n; i < this.events.length; i++) q += this.events[i].rel;
      quality = Math.min(1.15, Math.max(0, q / n));
    }
    const yieldF = Math.min(1, Math.max(0, this.yieldSmooth));
    this.quality = quality;

    // Birim durgun kütle başına enerji dengesi (E_neg + E_esc = E_p her zaman):
    //   kara deliğe giden : E_neg + (1−y)·E_esc
    //   toplayıcıya giden : y·E_esc
    //   şebekeye net      : y·E_esc − E_p
    const Ep = this.tune.E;
    const Lp = this.tune.L;
    const y = nom ? yieldF : 0;
    const Eneg = nom ? nom.neg.E * quality : Ep;
    const Lneg = nom ? nom.neg.L * quality : Lp;
    const Eesc = Ep - Eneg;
    const Lesc = Lp - Lneg;

    const dMperMass = Eneg + (1 - y) * Eesc;
    const dJperMass = Lneg + (1 - y) * Lesc;
    const harvestPerMass = y * Eesc;
    const netPerMass = harvestPerMass - Ep;
    const gain = Math.max(-Eneg, 0);
    this.stalled = gain <= 1e-12;
    this.balance = { Ep, Eneg, Eesc, y, gain, net: netPerMass, harvest: harvestPerMass, dM: dMperMass };

    const eta = netPerMass / Math.max(Ep, 1e-6);
    if (p.spinUpFrac < 0.999) this.etaSmooth += (eta - this.etaSmooth) * 0.07;
    else this.etaSmooth *= 0.98;

    // ---- zaman adımı sınırlaması: kütle tek adımda %0.12'den fazla değişemez ----
    const mdotPen = p.mdot * (1 - p.spinUpFrac);
    const mdotFeed = p.mdot * p.spinUpFrac;
    const ph = p.hawking ? K.hawkingPower(rc.Mkg) : 0;
    const rate = mdotPen * Math.abs(dMperMass) + mdotFeed + ph / C2 + 1e-300; // kg/s
    const dtMax = (0.0004 * rc.Mkg) / rate;
    const dtWant = dtReal * p.timeScale;
    const dtR = Math.min(dtWant, dtMax);
    this.effTimeScale = dtR / Math.max(dtReal, 1e-6);
    rc.clock += dtR;

    const mBeam = mdotPen * dtR;
    const mFeed = mdotFeed * dtR;

    let dM = mBeam * dMperMass;
    let dJ = mBeam * dJperMass;
    const extracted = mBeam * netPerMass * C2;
    const gross = mBeam * harvestPerMass * C2;

    if (mFeed > 0) {
      const { E: Ei, L: Li } = K.iscoEL(Math.min(a, 0.9995));
      dM += mFeed * Ei;
      dJ += mFeed * Li;
      rc.spunUpJ += mFeed * (1 - Ei) * C2;
    }

    let dMh = 0;
    if (ph > 0) {
      dMh = (-ph * dtR) / C2;
      rc.hawkingLossJ += ph * dtR;
    }

    const Mold = rc.Mkg;
    const Mnew = Mold + dM + dMh;
    if (Mnew <= 1e-3 || !isFinite(Mnew)) {
      rc.Mkg = 0;
      rc.depleted = true;
      rc.power = 0;
      return;
    }
    const Jold = rc.aStar * Mold * Mold;
    let aNew = Math.min(0.9995, Math.max(0, (Jold + dJ * Mold) / (Mnew * Mnew)));

    // --- Hawking alan teoremi güvencesi: M_irr asla azalamaz ---
    const irrOld = Mold * K.mIrrNorm(rc.aStar);
    const irrNew = Mnew * K.mIrrNorm(aNew);
    if (irrNew < irrOld) {
      const x = Math.min(1, irrOld / Mnew);
      const s2 = 2 * x * x - 1;
      aNew = s2 >= 0 && s2 <= 1 ? Math.sqrt(Math.max(0, 1 - s2 * s2)) : 0;
    }

    rc.Mkg = Mnew;
    rc.aStar = aNew;
    rc.energyJ += extracted;
    rc.grossJ += gross;

    const inst = dtR > 0 ? extracted / dtR : 0;
    this.powerAvg += (inst - this.powerAvg) * 0.12;
    rc.power = this.powerAvg;

    this.sampleAcc += dtReal;
    if (this.sampleAcc > 0.1) {
      this.sampleAcc = 0;
      this.history.push({ t: rc.clock, power: rc.power, aStar: rc.aStar, eta: this.etaSmooth, mass: rc.Mkg });
      if (this.history.length > 300) this.history.shift();
    }
  }

  step(dtReal: number) {
    if (!this.params.running) return;
    const dt = Math.min(dtReal, 0.05);
    this.stepMicro(dt);
    this.stepMacro(dt);
  }
}
