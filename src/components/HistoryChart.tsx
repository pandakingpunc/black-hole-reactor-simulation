import { useEffect, useRef } from 'react';
import type { Sample } from '../sim/engine';
import { si } from '../lib/format';
import { useLang } from '../i18n';

interface Props {
  history: Sample[];
  maxPower: number;
}

export default function HistoryChart({ history, maxPower }: Props) {
  const ref = useRef<HTMLCanvasElement | null>(null);
  const wrapRef = useRef<HTMLDivElement | null>(null);
  const { t } = useLang();

  useEffect(() => {
    const canvas = ref.current!;
    const wrap = wrapRef.current!;
    const ctx = canvas.getContext('2d')!;
    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    const rect = wrap.getBoundingClientRect();
    const W = Math.max(200, rect.width);
    const H = Math.max(80, rect.height);
    canvas.width = W * dpr;
    canvas.height = H * dpr;
    canvas.style.width = W + 'px';
    canvas.style.height = H + 'px';
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    ctx.clearRect(0, 0, W, H);

    const pad = { l: 4, r: 4, t: 8, b: 12 };
    const iw = W - pad.l - pad.r;
    const ih = H - pad.t - pad.b;

    // ızgara
    ctx.strokeStyle = 'rgba(255,255,255,0.05)';
    ctx.lineWidth = 1;
    for (let i = 0; i <= 4; i++) {
      const y = pad.t + (ih * i) / 4;
      ctx.beginPath();
      ctx.moveTo(pad.l, y);
      ctx.lineTo(W - pad.r, y);
      ctx.stroke();
    }

    const n = history.length;
    if (n < 2) {
      ctx.fillStyle = 'rgba(148,163,184,0.45)';
      ctx.font = '10px ui-monospace, monospace';
      ctx.textAlign = 'center';
      ctx.fillText(t.chWaiting, W / 2, H / 2);
      return;
    }

    const x = (i: number) => pad.l + (iw * i) / (n - 1);
    const pmax = Math.max(maxPower, 1e-30);

    // güç (log normalize)
    const lg = (v: number) => {
      if (v <= 0) return 0;
      const lo = Math.log10(pmax) - 6;
      const hi = Math.log10(pmax);
      return Math.max(0, Math.min(1, (Math.log10(v) - lo) / (hi - lo)));
    };

    ctx.beginPath();
    for (let i = 0; i < n; i++) {
      const y = pad.t + ih * (1 - lg(history[i].power));
      i === 0 ? ctx.moveTo(x(i), y) : ctx.lineTo(x(i), y);
    }
    ctx.lineTo(x(n - 1), pad.t + ih);
    ctx.lineTo(x(0), pad.t + ih);
    ctx.closePath();
    const grad = ctx.createLinearGradient(0, pad.t, 0, pad.t + ih);
    grad.addColorStop(0, 'rgba(251,191,36,0.32)');
    grad.addColorStop(1, 'rgba(251,191,36,0)');
    ctx.fillStyle = grad;
    ctx.fill();

    ctx.beginPath();
    for (let i = 0; i < n; i++) {
      const y = pad.t + ih * (1 - lg(history[i].power));
      i === 0 ? ctx.moveTo(x(i), y) : ctx.lineTo(x(i), y);
    }
    ctx.strokeStyle = '#fbbf24';
    ctx.lineWidth = 1.6;
    ctx.stroke();

    // spin a*
    ctx.beginPath();
    for (let i = 0; i < n; i++) {
      const y = pad.t + ih * (1 - history[i].aStar);
      i === 0 ? ctx.moveTo(x(i), y) : ctx.lineTo(x(i), y);
    }
    ctx.strokeStyle = '#c084fc';
    ctx.lineWidth = 1.4;
    ctx.stroke();

    // verim
    ctx.beginPath();
    for (let i = 0; i < n; i++) {
      const y = pad.t + ih * (1 - Math.min(1, history[i].eta / 0.21));
      i === 0 ? ctx.moveTo(x(i), y) : ctx.lineTo(x(i), y);
    }
    ctx.strokeStyle = 'rgba(45,212,191,0.75)';
    ctx.setLineDash([3, 3]);
    ctx.lineWidth = 1.1;
    ctx.stroke();
    ctx.setLineDash([]);

    // efsane
    ctx.font = '9px ui-monospace, monospace';
    ctx.textAlign = 'left';
    ctx.fillStyle = '#fbbf24';
    ctx.fillText(`${t.chPower}  ${si(history[n - 1].power, 'W', 1)}`, pad.l + 2, H - 3);
    ctx.fillStyle = '#c084fc';
    ctx.fillText(`a* ${history[n - 1].aStar.toFixed(3)}`, pad.l + 110, H - 3);
    ctx.fillStyle = 'rgba(45,212,191,0.9)';
    ctx.fillText(`η ${(history[n - 1].eta * 100).toFixed(1)}%`, pad.l + 170, H - 3);
    ctx.textAlign = 'right';
    ctx.fillStyle = 'rgba(148,163,184,0.5)';
    ctx.fillText(t.chLog, W - pad.r - 2, H - 3);
  }, [t, history, maxPower, history.length > 0 ? history[history.length - 1].t : 0]);

  return (
    <div ref={wrapRef} className="h-full w-full">
      <canvas ref={ref} className="block h-full w-full" />
    </div>
  );
}
