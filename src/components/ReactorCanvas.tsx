import { useEffect, useRef } from 'react';
import * as K from '../sim/kerr';
import { ReactorEngine, R_COLLECT, R_INJECT, TRAIL_MAX } from '../sim/engine';
import { useLang } from '../i18n';

const WORLD = 13.2;
const DUST_N = 520;

interface Props {
  engine: ReactorEngine;
  onTick: () => void;
  showLabels: boolean;
  showDust: boolean;
}

interface Star {
  x: number;
  y: number;
  m: number;
}
interface Dust {
  r: number;
  phi: number;
  s: number;
}

export default function ReactorCanvas({ engine, onTick, showLabels, showDust }: Props) {
  const ref = useRef<HTMLCanvasElement | null>(null);
  const wrapRef = useRef<HTMLDivElement | null>(null);
  const starsRef = useRef<Star[]>([]);
  const dustRef = useRef<Dust[]>([]);
  // çizim döngüsünü yeniden başlatmadan güncel dili okumak için
  const { t } = useLang();
  const tRef = useRef(t);
  tRef.current = t;

  if (starsRef.current.length === 0) {
    const s: Star[] = [];
    for (let i = 0; i < 420; i++) {
      const ang = Math.random() * Math.PI * 2;
      const rad = 3 + Math.pow(Math.random(), 0.55) * WORLD * 1.6;
      s.push({ x: Math.cos(ang) * rad, y: Math.sin(ang) * rad, m: Math.random() });
    }
    starsRef.current = s;
    const d: Dust[] = [];
    for (let i = 0; i < DUST_N; i++) {
      d.push({ r: 1.05 + Math.pow(Math.random(), 1.4) * 6.4, phi: Math.random() * Math.PI * 2, s: Math.random() });
    }
    dustRef.current = d;
  }

  useEffect(() => {
    const canvas = ref.current!;
    const wrap = wrapRef.current!;
    const ctx = canvas.getContext('2d', { alpha: false })!;
    let raf = 0;
    let last = performance.now();
    let tickAcc = 0;
    let W = 0;
    let H = 0;

    const resize = () => {
      const dpr = Math.min(window.devicePixelRatio || 1, 2);
      const rect = wrap.getBoundingClientRect();
      W = Math.max(320, rect.width);
      H = Math.max(320, rect.height);
      canvas.width = Math.floor(W * dpr);
      canvas.height = Math.floor(H * dpr);
      canvas.style.width = W + 'px';
      canvas.style.height = H + 'px';
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    };
    resize();
    const ro = new ResizeObserver(resize);
    ro.observe(wrap);

    const draw = (now: number) => {
      raf = requestAnimationFrame(draw);
      const dt = Math.min((now - last) / 1000, 0.05);
      last = now;

      engine.step(dt);
      tickAcc += dt;
      if (tickAcc > 0.1) {
        tickAcc = 0;
        onTick();
      }

      const a = Math.max(engine.reactor.aStar, 1e-5);
      const rp = K.rHorizon(a);
      const cx = W / 2;
      const cy = H / 2;
      const scale = (Math.min(W, H) / 2 / WORLD) * 0.97;
      const X = (r: number, phi: number) => cx + r * Math.cos(phi) * scale;
      const Y = (r: number, phi: number) => cy + r * Math.sin(phi) * scale;

      // --- arka plan ---
      const bg = ctx.createRadialGradient(cx, cy, 0, cx, cy, Math.max(W, H) * 0.75);
      bg.addColorStop(0, '#0a0b1d');
      bg.addColorStop(0.45, '#05060f');
      bg.addColorStop(1, '#010103');
      ctx.fillStyle = bg;
      ctx.fillRect(0, 0, W, H);

      // --- yıldızlar + kaba kütleçekimsel mercek ---
      const shadow = rp * 2.55;
      ctx.globalCompositeOperation = 'lighter';
      for (const s of starsRef.current) {
        const d = Math.hypot(s.x, s.y);
        const dd = d + (4.2 * rp * rp) / d;
        if (dd < shadow) continue;
        const k = dd / d;
        const px = cx + s.x * k * scale;
        const py = cy + s.y * k * scale;
        if (px < -5 || py < -5 || px > W + 5 || py > H + 5) continue;
        const br = 0.25 + s.m * 0.7;
        ctx.fillStyle = `rgba(${190 + s.m * 60},${200 + s.m * 50},255,${br * 0.8})`;
        const sz = s.m > 0.93 ? 1.7 : 1;
        ctx.fillRect(px, py, sz, sz);
      }
      ctx.globalCompositeOperation = 'source-over';

      // --- çerçeve sürüklenme tozu ---
      if (showDust) {
        ctx.globalCompositeOperation = 'lighter';
        for (const d of dustRef.current) {
          if (d.r < rp * 1.02) {
            d.r = 4 + Math.random() * 3.5;
            d.phi = Math.random() * Math.PI * 2;
          }
          const om = K.omegaDrag(d.r, a);
          d.phi += om * dt * 10 * engine.params.microSpeed * (engine.params.running ? 1 : 0);
          const px = X(d.r, d.phi);
          const py = Y(d.r, d.phi);
          const fade = Math.max(0, Math.min(1, (7.6 - d.r) / 4.5)) * (0.1 + d.s * 0.32);
          const inErgo = d.r < 2;
          ctx.fillStyle = inErgo
            ? `rgba(196,132,252,${fade * 1.5})`
            : `rgba(99,138,220,${fade})`;
          ctx.fillRect(px, py, 1.3, 1.3);
        }
        ctx.globalCompositeOperation = 'source-over';
      }

      // --- ergosfer ---
      const erg = ctx.createRadialGradient(cx, cy, rp * scale, cx, cy, 2 * scale);
      erg.addColorStop(0, 'rgba(147,51,234,0.30)');
      erg.addColorStop(0.75, 'rgba(126,34,206,0.13)');
      erg.addColorStop(1, 'rgba(168,85,247,0.02)');
      ctx.fillStyle = erg;
      ctx.beginPath();
      ctx.arc(cx, cy, 2 * scale, 0, Math.PI * 2);
      ctx.fill();

      ctx.save();
      ctx.setLineDash([5, 5]);
      ctx.strokeStyle = 'rgba(192,132,252,0.75)';
      ctx.lineWidth = 1.2;
      ctx.beginPath();
      ctx.arc(cx, cy, 2 * scale, 0, Math.PI * 2);
      ctx.stroke();
      ctx.restore();

      // --- foton halkaları ---
      ctx.save();
      ctx.setLineDash([2, 6]);
      ctx.strokeStyle = 'rgba(250,204,21,0.18)';
      ctx.lineWidth = 1;
      for (const pr of [K.rPhoton(a, true), K.rPhoton(a, false)]) {
        ctx.beginPath();
        ctx.arc(cx, cy, pr * scale, 0, Math.PI * 2);
        ctx.stroke();
      }
      ctx.restore();

      // --- bölünme yarıçapı halkası ---
      const rs = engine.rSplit;
      ctx.save();
      ctx.setLineDash([1, 4]);
      ctx.strokeStyle = 'rgba(244,63,94,0.5)';
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.arc(cx, cy, rs * scale, 0, Math.PI * 2);
      ctx.stroke();
      ctx.restore();

      // --- olay ufku ---
      const halo = ctx.createRadialGradient(cx, cy, rp * scale * 0.92, cx, cy, rp * scale * 1.7);
      halo.addColorStop(0, 'rgba(255,186,90,0.55)');
      halo.addColorStop(0.3, 'rgba(255,120,40,0.16)');
      halo.addColorStop(1, 'rgba(255,80,0,0)');
      ctx.fillStyle = halo;
      ctx.beginPath();
      ctx.arc(cx, cy, rp * scale * 1.7, 0, Math.PI * 2);
      ctx.fill();

      ctx.fillStyle = '#000';
      ctx.beginPath();
      ctx.arc(cx, cy, rp * scale, 0, Math.PI * 2);
      ctx.fill();
      ctx.strokeStyle = 'rgba(255,205,120,0.85)';
      ctx.lineWidth = 1.1;
      ctx.stroke();

      // --- toplayıcı halka ---
      ctx.strokeStyle = 'rgba(56,189,248,0.22)';
      ctx.lineWidth = 2.5;
      ctx.beginPath();
      ctx.arc(cx, cy, R_COLLECT * scale, 0, Math.PI * 2);
      ctx.stroke();
      ctx.setLineDash([]);

      ctx.globalCompositeOperation = 'lighter';
      for (const f of engine.collectorFlashes) {
        const al = Math.max(0, 1 - f.t / 0.9);
        ctx.strokeStyle = `rgba(253,224,71,${al * 0.9})`;
        ctx.lineWidth = 4 + al * 7;
        ctx.beginPath();
        ctx.arc(cx, cy, R_COLLECT * scale, f.phi - 0.08 - al * 0.05, f.phi + 0.08 + al * 0.05);
        ctx.stroke();
      }
      ctx.globalCompositeOperation = 'source-over';

      // --- enjektör ---
      const injPhi = -0.3;
      const ix = X(R_INJECT + 1.1, injPhi);
      const iy = Y(R_INJECT + 1.1, injPhi);
      ctx.save();
      ctx.translate(ix, iy);
      ctx.rotate(injPhi + Math.PI);
      ctx.fillStyle = engine.params.running ? 'rgba(34,211,238,0.9)' : 'rgba(100,116,139,0.6)';
      ctx.fillRect(-2, -7, 14, 14);
      ctx.fillStyle = 'rgba(8,47,73,0.95)';
      ctx.fillRect(0, -4, 10, 8);
      ctx.restore();

      // --- bölünme patlamaları ---
      ctx.globalCompositeOperation = 'lighter';
      for (const f of engine.splitFlashes) {
        const k = f.t / 0.7;
        const al = Math.max(0, 1 - k);
        const rad = (4 + k * 26) * (0.5 + Math.min(1, f.gain * 6));
        const px = X(f.r, f.phi);
        const py = Y(f.r, f.phi);
        const g = ctx.createRadialGradient(px, py, 0, px, py, rad);
        const col = f.gain > 0.001 ? '255,240,180' : '255,120,120';
        g.addColorStop(0, `rgba(${col},${al * 0.55})`);
        g.addColorStop(0.5, `rgba(${col},${al * 0.16})`);
        g.addColorStop(1, 'rgba(0,0,0,0)');
        ctx.fillStyle = g;
        ctx.beginPath();
        ctx.arc(px, py, rad, 0, Math.PI * 2);
        ctx.fill();
        ctx.strokeStyle = `rgba(${col},${al * 0.5})`;
        ctx.lineWidth = 1;
        ctx.beginPath();
        ctx.arc(px, py, rad * 0.75, 0, Math.PI * 2);
        ctx.stroke();
      }

      // --- parçacıklar ---
      for (const p of engine.particles) {
        const col =
          p.kind === 'feed' ? [56, 189, 248] : p.kind === 'neg' ? [244, 63, 94] : [252, 211, 77];
        const n = p.trailLen;
        if (n > 1) {
          for (let i = 1; i < n; i++) {
            const i0 = (p.trailHead - n + i - 1 + TRAIL_MAX * 2) % TRAIL_MAX;
            const i1 = (p.trailHead - n + i + TRAIL_MAX * 2) % TRAIL_MAX;
            const x0 = cx + p.trail[i0 * 2] * scale;
            const y0 = cy + p.trail[i0 * 2 + 1] * scale;
            const x1 = cx + p.trail[i1 * 2] * scale;
            const y1 = cy + p.trail[i1 * 2 + 1] * scale;
            const t = i / n;
            ctx.strokeStyle = `rgba(${col[0]},${col[1]},${col[2]},${t * t * 0.55})`;
            ctx.lineWidth = 0.6 + t * 1.5;
            ctx.beginPath();
            ctx.moveTo(x0, y0);
            ctx.lineTo(x1, y1);
            ctx.stroke();
          }
        }
        const px = X(p.r, p.phi);
        const py = Y(p.r, p.phi);
        const rad = p.kind === 'feed' ? 2.2 : 2.6;
        const g = ctx.createRadialGradient(px, py, 0, px, py, rad * 4.5);
        g.addColorStop(0, `rgba(${col[0]},${col[1]},${col[2]},0.95)`);
        g.addColorStop(0.35, `rgba(${col[0]},${col[1]},${col[2]},0.35)`);
        g.addColorStop(1, 'rgba(0,0,0,0)');
        ctx.fillStyle = g;
        ctx.beginPath();
        ctx.arc(px, py, rad * 4.5, 0, Math.PI * 2);
        ctx.fill();
        ctx.fillStyle = '#fff';
        ctx.beginPath();
        ctx.arc(px, py, rad * 0.45, 0, Math.PI * 2);
        ctx.fill();
      }
      ctx.globalCompositeOperation = 'source-over';

      // --- dönüş yönü oku ---
      ctx.strokeStyle = 'rgba(168,85,247,0.45)';
      ctx.lineWidth = 1.4;
      ctx.beginPath();
      ctx.arc(cx, cy, 3.2 * scale, -0.9, -0.1);
      ctx.stroke();
      const ax = X(3.2, -0.1);
      const ay = Y(3.2, -0.1);
      ctx.fillStyle = 'rgba(192,132,252,0.8)';
      ctx.beginPath();
      ctx.moveTo(ax, ay);
      ctx.lineTo(ax - 7, ay - 5);
      ctx.lineTo(ax - 2, ay + 6);
      ctx.closePath();
      ctx.fill();

      // --- etiketler ---
      if (showLabels) {
        const t = tRef.current;
        ctx.font = '500 10.5px ui-monospace, SFMono-Regular, Menlo, monospace';
        ctx.textAlign = 'center';
        ctx.fillStyle = 'rgba(216,180,254,0.85)';
        ctx.fillText(t.cvErgo, cx, cy - 2 * scale - 8);
        ctx.fillStyle = 'rgba(253,186,116,0.8)';
        ctx.fillText(`${t.cvHorizon}${rp.toFixed(2)}M`, cx, cy + rp * scale + 16);
        ctx.fillStyle = 'rgba(56,189,248,0.6)';
        ctx.fillText(t.cvCollector, cx, cy - R_COLLECT * scale + 14);
        ctx.fillStyle = 'rgba(244,63,94,0.75)';
        ctx.textAlign = 'left';
        ctx.fillText(`${t.cvSplit}${rs.toFixed(2)}M`, cx + 6, cy - rs * scale - 5);
        ctx.fillStyle = 'rgba(34,211,238,0.8)';
        ctx.fillText(t.cvInjector, ix - 70, iy + 22);
        ctx.fillStyle = 'rgba(192,132,252,0.55)';
        ctx.fillText(t.cvDrag, cx + 3.4 * scale * Math.cos(-0.52), cy + 3.4 * scale * Math.sin(-0.52) - 10);
      }
    };

    raf = requestAnimationFrame(draw);
    return () => {
      cancelAnimationFrame(raf);
      ro.disconnect();
    };
  }, [engine, onTick, showLabels, showDust]);

  return (
    <div ref={wrapRef} className="relative h-full w-full overflow-hidden">
      <canvas ref={ref} className="block h-full w-full" />
    </div>
  );
}
