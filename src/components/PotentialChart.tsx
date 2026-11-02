import { useEffect, useRef } from 'react';
import * as K from '../sim/kerr';
import type { Tune } from '../sim/engine';
import { useLang } from '../i18n';

interface Props {
  a: number;
  tune: Tune;
  jitter: number;
}

const R_MAX = 4.2;

/**
 * Demetin radyal potansiyeli: (dr/dτ)² = R(r)/r⁴ (μ = 1).
 * Eğrinin sıfıra değdiği yer dönüş noktasıdır; negatif bölge yasak bölgedir.
 * Jitter'in iki uç hali (L düşük/E yüksek ve tersi) kesik çizgiyle çizilir.
 */
export default function PotentialChart({ a, tune, jitter }: Props) {
  const ref = useRef<HTMLCanvasElement | null>(null);
  const wrapRef = useRef<HTMLDivElement | null>(null);
  const { t } = useLang();

  useEffect(() => {
    const canvas = ref.current!;
    const wrap = wrapRef.current!;
    const ctx = canvas.getContext('2d')!;
    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    const W = Math.max(200, wrap.getBoundingClientRect().width);
    const H = 132;
    canvas.width = W * dpr;
    canvas.height = H * dpr;
    canvas.style.width = W + 'px';
    canvas.style.height = H + 'px';
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    ctx.clearRect(0, 0, W, H);

    const am = Math.max(a, 1e-4);
    const rp = K.rHorizon(am);
    const pad = { l: 6, r: 6, t: 14, b: 16 };
    const iw = W - pad.l - pad.r;
    const ih = H - pad.t - pad.b;
    const r0 = rp * 1.005;
    const N = 220;

    // spawn() ile aynı jitter genliği: L ±%7·j, E ±%1.5·j
    const curves = [
      { o: { E: tune.E, L: tune.L, mu: 1 }, kind: 'nom' as const },
      { o: { E: tune.E * (1 + 0.015 * jitter), L: tune.L * (1 - 0.07 * jitter), mu: 1 }, kind: 'deep' as const },
      { o: { E: tune.E * (1 - 0.015 * jitter), L: tune.L * (1 + 0.07 * jitter), mu: 1 }, kind: 'shallow' as const },
    ];
    const f = (r: number, o: K.Orbit) => K.radialR(r, o, am) / (r * r * r * r);
    const rAt = (i: number) => r0 + ((R_MAX - r0) * i) / N;

    // dikey ölçek: dönüş noktası çevresini okunur kılmak için nominal eğrinin
    // ergosfer dışındaki tepe değerine göre
    let top = 1e-3;
    for (let i = 0; i <= N; i++) {
      const r = rAt(i);
      if (r < 1.6) continue;
      top = Math.max(top, f(r, curves[0].o));
    }
    const yMax = top * 1.15;
    const yMin = -0.45 * yMax;
    const X = (r: number) => pad.l + ((r - r0) / (R_MAX - r0)) * iw;
    const Y = (v: number) => pad.t + ((yMax - Math.max(yMin, Math.min(yMax, v))) / (yMax - yMin)) * ih;
    const y0 = Y(0);

    // ergosfer bandı
    ctx.fillStyle = 'rgba(147,51,234,0.12)';
    ctx.fillRect(X(r0), pad.t, X(2) - X(r0), ih);
    ctx.strokeStyle = 'rgba(192,132,252,0.55)';
    ctx.setLineDash([3, 3]);
    ctx.beginPath();
    ctx.moveTo(X(2), pad.t);
    ctx.lineTo(X(2), pad.t + ih);
    ctx.stroke();
    ctx.setLineDash([]);

    // yasak bölge (nominal eğri < 0)
    ctx.fillStyle = 'rgba(244,63,94,0.22)';
    ctx.beginPath();
    ctx.moveTo(X(r0), y0);
    for (let i = 0; i <= N; i++) {
      const r = rAt(i);
      ctx.lineTo(X(r), Math.max(y0, Y(f(r, curves[0].o))));
    }
    ctx.lineTo(X(R_MAX), y0);
    ctx.closePath();
    ctx.fill();

    // sıfır çizgisi
    ctx.strokeStyle = 'rgba(255,255,255,0.25)';
    ctx.beginPath();
    ctx.moveTo(pad.l, y0);
    ctx.lineTo(W - pad.r, y0);
    ctx.stroke();

    for (const c of curves) {
      ctx.beginPath();
      for (let i = 0; i <= N; i++) {
        const r = rAt(i);
        const y = Y(f(r, c.o));
        i === 0 ? ctx.moveTo(X(r), y) : ctx.lineTo(X(r), y);
      }
      if (c.kind === 'nom') {
        ctx.setLineDash([]);
        ctx.strokeStyle = '#38bdf8';
        ctx.lineWidth = 1.6;
      } else {
        ctx.setLineDash([3, 3]);
        ctx.strokeStyle = c.kind === 'deep' ? 'rgba(251,113,133,0.75)' : 'rgba(148,163,184,0.6)';
        ctx.lineWidth = 1;
      }
      ctx.stroke();
    }
    ctx.setLineDash([]);

    // nominal dönüş noktası
    const rt = K.outerTurning(curves[0].o, am);
    ctx.font = '9px ui-monospace, monospace';
    if (rt !== null) {
      ctx.fillStyle = '#fb7185';
      ctx.beginPath();
      ctx.arc(X(rt), y0, 3, 0, Math.PI * 2);
      ctx.fill();
    }

    // ufuk
    ctx.strokeStyle = 'rgba(253,186,116,0.8)';
    ctx.lineWidth = 1.5;
    ctx.beginPath();
    ctx.moveTo(X(r0), pad.t);
    ctx.lineTo(X(r0), pad.t + ih);
    ctx.stroke();

    // etiketler
    ctx.textAlign = 'left';
    ctx.fillStyle = 'rgba(253,186,116,0.85)';
    ctx.fillText(`r₊ ${rp.toFixed(2)}`, X(r0) + 3, H - 4);
    ctx.fillStyle = 'rgba(192,132,252,0.85)';
    ctx.fillText('2M', X(2) + 3, H - 4);
    ctx.fillStyle = 'rgba(148,163,184,0.6)';
    ctx.textAlign = 'right';
    ctx.fillText(`r → ${R_MAX}M`, W - pad.r, H - 4);
    // "yasak" etiketi nominal eğrinin negatif olduğu aralığın ortasına
    let fLo = Infinity;
    let fHi = -Infinity;
    for (let i = 0; i <= N; i++) {
      const r = rAt(i);
      if (f(r, curves[0].o) < 0) {
        fLo = Math.min(fLo, r);
        fHi = Math.max(fHi, r);
      }
    }
    if (fHi > fLo) {
      ctx.textAlign = 'center';
      ctx.fillStyle = 'rgba(251,113,133,0.8)';
      ctx.fillText(t.pcForbidden, X((fLo + fHi) / 2), pad.t + ih - 3);
    }
    ctx.textAlign = 'left';
    ctx.fillStyle = rt !== null ? '#fb7185' : 'rgba(251,113,133,0.9)';
    ctx.fillText(rt !== null ? `${t.pcTurning} ${rt.toFixed(3)}M` : t.pcNoTurning, pad.l + 2, 10);
  }, [a, tune.E, tune.L, tune.r0, jitter, t]);

  return (
    <div ref={wrapRef} className="w-full">
      <canvas ref={ref} className="block w-full" />
    </div>
  );
}
