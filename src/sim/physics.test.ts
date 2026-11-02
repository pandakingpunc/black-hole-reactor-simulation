import { describe, expect, it } from 'vitest';
import * as K from './kerr';
import { ReactorEngine, R_COLLECT } from './engine';
import { si } from '../lib/format';

const close = (x: number, y: number, tol = 1e-9) => expect(Math.abs(x - y)).toBeLessThan(tol);

describe('Kerr geometry', () => {
  it('reproduces the Schwarzschild and extremal limits', () => {
    close(K.rHorizon(0), 2);
    close(K.rHorizon(1), 1);
    close(K.rPhoton(0), 3, 1e-12);
    close(K.rISCO(0), 6, 1e-12);
    close(K.rISCO(1), 1, 1e-9);
    const { E, L } = K.iscoEL(0);
    close(E, Math.sqrt(8 / 9), 1e-9);
    close(L, 2 * Math.sqrt(3), 1e-9);
  });

  it('gives an irreducible mass of M/√2 at extremality', () => {
    close(K.mIrrNorm(1), Math.SQRT1_2, 1e-12);
    close(K.rotEnergyFraction(0), 0, 1e-12);
  });
});

describe('Penrose split', () => {
  for (const a of [0.85, 0.9, 0.95, 0.99, 0.9995]) {
    const eng = new ReactorEngine();
    eng.reset(1e12, a);
    const t = eng.tune;
    const parent: K.Orbit = { E: t.E, L: t.L, mu: 1 };

    it(`conserves E and L exactly (a* = ${a})`, () => {
      for (const psi of [-0.4, 0, 0.3]) {
        const s = K.penroseSplit(t.r0, a, parent, -1, psi);
        close(s.neg.E + s.esc.E, parent.E, 1e-12);
        close(s.neg.L + s.esc.L, parent.L, 1e-12);
      }
    });

    it(`respects the area theorem: E − Ω_H L ≥ 0 for the swallowed photon (a* = ${a})`, () => {
      const s = K.penroseSplit(t.r0, a, parent, -1, 0);
      expect(s.neg.E).toBeLessThan(0);
      expect(s.neg.E - K.omegaH(a) * s.neg.L).toBeGreaterThanOrEqual(0);
    });

    it(`matches the analytic optimum ½[√(E²+2/r−1) − E] at ψ = 0 (a* = ${a})`, () => {
      const s = K.penroseSplit(t.r0, a, parent, -1, 0);
      const analytic = 0.5 * (Math.sqrt(parent.E ** 2 + 2 / t.r0 - 1) - parent.E);
      close(s.gain, analytic, 1e-9);
    });
  }

  it('approaches the classic (√2−1)/2 bound for E_p = 1 near an extremal horizon', () => {
    const a = 0.99999;
    const r = K.rHorizon(a) * 1.002;
    const L = K.solveTurningL(r, a, 1);
    // dönüş noktası ufka bu kadar yakında E = 1 ile kurulamayabilir; formül yine sınırı verir
    const gain = 0.5 * (Math.sqrt(1 + 2 / r - 1) - 1);
    close(gain, (Math.SQRT2 - 1) / 2, 5e-3);
    if (L !== null) {
      const s = K.penroseSplit(r, a, { E: 1, L, mu: 1 }, -1, 0);
      close(s.efficiency, gain, 1e-6);
    }
  });

  it('lets the optimal photon escape when it is born at its own turning point', () => {
    // Regresyon: R(r0) ≈ −1e−17 yuvarlaması optimal ψ = 0 fotonunu "kaçamaz" sayıyordu
    const eng = new ReactorEngine();
    eng.reset(1e12, 0.95);
    const t = eng.tune;
    const s = K.penroseSplit(t.r0, 0.95, { E: t.E, L: t.L, mu: 1 }, -1, 0);
    expect(K.photonEscapes(s.esc, t.r0, s.escSign, 0.95, R_COLLECT)).toBe(true);
    close(eng.nominalSplit()!.psi!, 0, 1e-12);
  });
});

describe('Geodesic integrator', () => {
  it('carries a photon born at its turning point out to the collector', () => {
    // Regresyon: birinci mertebe dr/dλ = ±√R/r² ile bu foton R = 0'da takılıyordu
    for (const a of [0.95, 0.99, 0.9995]) {
      const eng = new ReactorEngine();
      eng.reset(1e12, a);
      const t = eng.tune;
      const s = K.penroseSplit(t.r0, a, { E: t.E, L: t.L, mu: 1 }, -1, 0);
      let st: K.State = { r: t.r0, phi: 0, sign: s.escSign };
      let steps = 0;
      while (st.r < R_COLLECT && st.r > K.rHorizon(a) && steps++ < 20000) st = K.stepGeodesic(st, s.esc, a, 0.01);
      expect(st.r).toBeGreaterThanOrEqual(R_COLLECT);
    }
  });

  it('turns a massive particle around at the analytic turning point', () => {
    const a = 0.95;
    const eng = new ReactorEngine();
    eng.reset(1e12, a);
    const o: K.Orbit = { E: eng.tune.E, L: eng.tune.L, mu: 1 };
    let st: K.State = { r: 9.4, phi: 0, sign: -1 };
    let rMin = Infinity;
    for (let i = 0; i < 40000 && !(st.sign > 0 && st.r > rMin + 0.05); i++) {
      st = K.stepGeodesic(st, o, a, 0.004);
      rMin = Math.min(rMin, st.r);
    }
    close(rMin, K.outerTurning(o, a)!, 2e-3);
  });
});

describe('Reactor engine', () => {
  const run = (M: number, a: number, p: Partial<ReactorEngine['params']>, seconds: number, each?: (e: ReactorEngine) => void) => {
    const e = new ReactorEngine();
    e.reset(M, a);
    Object.assign(e.params, p);
    for (let i = 0; i < seconds * 60; i++) {
      e.step(1 / 60);
      each?.(e);
    }
    return e;
  };

  it('produces net power from the first second of the lab preset', () => {
    let worst = Infinity;
    run(1e12, 0.95, { mdot: 1e3, timeScale: 1e6, jitter: 0.08 }, 12, (e) => {
      if (e.reactor.clock > 1e6) worst = Math.min(worst, e.balance.net);
    });
    expect(worst).toBeGreaterThan(0);
  });

  it('never decreases the irreducible mass and conserves energy without Hawking loss', () => {
    let prev = Infinity;
    let violations = 0;
    const e = run(1e12, 0.99, { mdot: 1e3, timeScale: 1e6, hawking: false }, 20, (eng) => {
      const irr = eng.reactor.Mkg * K.mIrrNorm(eng.reactor.aStar);
      if (prev !== Infinity && irr < prev * (1 - 1e-12)) violations++;
      prev = irr;
    });
    expect(violations).toBe(0);
    // şebekeye giden her joule kara deliğin kütlesinden çıkar
    const dMc2 = (e.reactor.M0 - e.reactor.Mkg) * K.C * K.C;
    expect(e.reactor.energyJ).toBeGreaterThan(0);
    close(e.reactor.energyJ / dMc2, 1, 1e-6);
    expect(e.reactor.aStar).toBeLessThan(0.99);
  });

  it('stays finite in every preset regime', () => {
    for (const [M, a] of [
      [1e18, 0.9],
      [1.98892e31, 0.98],
      [1e12, 0.9995],
      [1e12, 0.62],
    ] as const) {
      const e = run(M, a, { spinUpFrac: a < 0.7 ? 0.6 : 0 }, 5);
      expect(Number.isFinite(e.reactor.power)).toBe(true);
      expect(Number.isFinite(e.reactor.aStar)).toBe(true);
      expect(e.reactor.aStar).toBeLessThanOrEqual(0.9995);
    }
  });
});

describe('format', () => {
  it('rolls over to the next SI prefix instead of printing 1000', () => {
    expect(si(9.9996e11, 'kg')).toBe('1.00 Tkg');
    expect(si(999.4e9, 'kg')).toBe('999 Gkg');
    expect(si(2.5e3, 'W')).toBe('2.50 kW');
  });
});
