import { useCallback, useEffect, useReducer, useRef, useState } from 'react';
import ReactorCanvas from './components/ReactorCanvas';
import ControlPanel from './components/ControlPanel';
import Telemetry from './components/Telemetry';
import HistoryChart from './components/HistoryChart';
import PhysicsModal from './components/PhysicsModal';
import { ReactorEngine, type Params, type Reactor } from './sim/engine';
import * as K from './sim/kerr';
import { si, dur } from './lib/format';
import { cn } from './utils/cn';
import { useLang, type Dict } from './i18n';

interface Preset {
  id: keyof Dict['presets'];
  M: number;
  a: number;
  p: Partial<Params>;
}

const PRESETS: Preset[] = [
  {
    id: 'lab',
    M: 1e12,
    a: 0.95,
    p: { mdot: 1e3, timeScale: 1e6, splitFrac: 0.05, psi: 0, jitter: 0.08, spinUpFrac: 0, auto: true },
  },
  {
    id: 'ind',
    M: 1e18,
    a: 0.9,
    p: { mdot: 1e6, timeScale: 1e8, splitFrac: 0.04, psi: 0, jitter: 0.15, spinUpFrac: 0, auto: true },
  },
  {
    id: 'stellar',
    M: 1.98892e31,
    a: 0.98,
    p: { mdot: 1e12, timeScale: 1e11, splitFrac: 0.03, psi: 0, jitter: 0.18, spinUpFrac: 0, auto: true },
  },
  {
    id: 'extreme',
    M: 1e12,
    a: 0.9995,
    p: { mdot: 1e3, timeScale: 1e5, splitFrac: 0, psi: 0, jitter: 0.03, spinUpFrac: 0, auto: true },
  },
  {
    id: 'dying',
    M: 1e12,
    a: 0.62,
    p: { mdot: 1e4, timeScale: 1e6, splitFrac: 0.05, psi: 0, jitter: 0.12, spinUpFrac: 0.6, auto: true },
  },
];

export default function App() {
  const engineRef = useRef<ReactorEngine | null>(null);
  if (!engineRef.current) engineRef.current = new ReactorEngine();
  const engine = engineRef.current;
  const { lang, setLang, t } = useLang();

  const [, force] = useReducer((x: number) => x + 1, 0);
  const [showInfo, setShowInfo] = useState(false);
  const [labels, setLabels] = useState(true);
  const [dust, setDust] = useState(true);
  const [active, setActive] = useState<Preset['id']>('lab');
  const maxPowerRef = useRef(1);

  const onTick = useCallback(() => force(), []);

  const set = useCallback(
    (p: Partial<Params>) => {
      Object.assign(engine.params, p);
      force();
    },
    [engine]
  );
  const setReactor = useCallback(
    (p: Partial<Reactor>) => {
      Object.assign(engine.reactor, p);
      if (p.aStar !== undefined) engine.reactor.depleted = false;
      force();
    },
    [engine]
  );

  const applyPreset = useCallback(
    (pr: Preset) => {
      engine.reset(pr.M, pr.a);
      Object.assign(engine.params, pr.p);
      engine.params.running = true;
      maxPowerRef.current = 1;
      setActive(pr.id);
      force();
    },
    [engine]
  );

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.code === 'Space') {
        e.preventDefault();
        set({ running: !engine.params.running });
      }
      if (e.key === 'r' || e.key === 'R') {
        const pr = PRESETS.find((x) => x.id === active) ?? PRESETS[0];
        applyPreset(pr);
      }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [engine, set, applyPreset, active]);

  const rc = engine.reactor;
  const a = rc.aStar;
  const rp = K.rHorizon(a);
  for (const h of engine.history) if (h.power > maxPowerRef.current) maxPowerRef.current = h.power;

  const legend = [
    { c: 'bg-cyan-400', t: t.legendFeed },
    { c: 'bg-rose-500', t: t.legendNeg },
    { c: 'bg-amber-300', t: t.legendEsc },
  ];

  return (
    <div className="flex min-h-screen flex-col bg-[#04050c] text-slate-200 lg:h-screen lg:overflow-hidden">
      {/* ÜST BAR */}
      <header className="flex shrink-0 flex-wrap items-center gap-x-4 gap-y-2 border-b border-white/10 bg-gradient-to-r from-violet-950/40 via-slate-950 to-cyan-950/30 px-4 py-2.5">
        <div className="flex items-center gap-2.5">
          <div className="relative h-8 w-8 shrink-0">
            <div className="absolute inset-0 rounded-full bg-violet-600/30 blur-[6px]" />
            <div className="absolute inset-[3px] rounded-full border border-violet-400/50" />
            <div className="absolute inset-[9px] rounded-full bg-black shadow-[0_0_8px_2px_rgba(251,191,36,0.6)]" />
          </div>
          <div>
            <h1 className="text-[13px] leading-tight font-bold tracking-[0.14em] text-slate-100 uppercase">
              {t.title}
            </h1>
            <p className="font-mono text-[9.5px] tracking-wider text-slate-500">{t.subtitle}</p>
          </div>
        </div>

        <div className="ml-auto flex flex-wrap items-center gap-1.5">
          {PRESETS.map((p) => (
            <button
              key={p.id}
              onClick={() => applyPreset(p)}
              title={t.presets[p.id].desc}
              className={cn(
                'rounded-md border px-2 py-1 text-[10px] transition',
                active === p.id
                  ? 'border-violet-400/60 bg-violet-500/15 text-violet-200'
                  : 'border-white/10 text-slate-500 hover:border-white/25 hover:text-slate-200'
              )}
            >
              {t.presets[p.id].name}
            </button>
          ))}
          <div className="mx-1 h-5 w-px bg-white/10" />
          <button
            onClick={() => set({ running: !engine.params.running })}
            className={cn(
              'rounded-md border px-3 py-1 font-mono text-[10px] tracking-wider transition',
              engine.params.running
                ? 'border-emerald-400/40 bg-emerald-500/10 text-emerald-300 hover:bg-emerald-500/20'
                : 'border-amber-400/40 bg-amber-500/10 text-amber-300 hover:bg-amber-500/20'
            )}
          >
            {engine.params.running ? t.pause : t.run}
          </button>
          <button
            onClick={() => applyPreset(PRESETS.find((x) => x.id === active) ?? PRESETS[0])}
            className="rounded-md border border-white/10 px-3 py-1 font-mono text-[10px] tracking-wider text-slate-400 transition hover:border-white/25 hover:text-white"
          >
            {t.reset}
          </button>
          <button
            onClick={() => setShowInfo(true)}
            className="rounded-md border border-cyan-400/30 bg-cyan-500/10 px-3 py-1 font-mono text-[10px] tracking-wider text-cyan-300 transition hover:bg-cyan-500/20"
          >
            {t.physics}
          </button>
          <div className="flex overflow-hidden rounded-md border border-white/10 font-mono text-[10px]">
            {(['en', 'tr'] as const).map((l) => (
              <button
                key={l}
                onClick={() => setLang(l)}
                aria-pressed={lang === l}
                className={cn(
                  'px-2 py-1 tracking-wider transition',
                  lang === l ? 'bg-white/10 text-slate-100' : 'text-slate-500 hover:text-slate-200'
                )}
              >
                {l.toUpperCase()}
              </button>
            ))}
          </div>
        </div>
      </header>

      {/* ANA IZGARA */}
      <main className="grid min-h-0 flex-1 grid-cols-1 gap-2.5 p-2.5 lg:grid-cols-[288px_minmax(0,1fr)_332px]">
        <aside className="min-h-0 lg:overflow-y-auto lg:pr-1">
          <ControlPanel
            params={engine.params}
            reactor={rc}
            rSplit={engine.rSplit}
            tune={engine.tune}
            set={set}
            setReactor={setReactor}
          />
        </aside>

        <section className="flex min-h-0 flex-col gap-2.5">
          <div className="relative min-h-[420px] flex-1 overflow-hidden rounded-xl border border-white/10 bg-black">
            <ReactorCanvas engine={engine} onTick={onTick} showLabels={labels} showDust={dust} />

            {/* sol üst okuma */}
            <div className="pointer-events-none absolute top-2.5 left-3 space-y-0.5 font-mono text-[10px] text-slate-500">
              <div className="text-slate-300">
                a* <span className="text-violet-300">{a.toFixed(4)}</span>
                <span className="mx-2 text-slate-700">│</span>
                r₊ <span className="text-amber-300">{rp.toFixed(3)} M</span>
                <span className="mx-2 text-slate-700">│</span>
                ω_H <span className="text-cyan-300">{K.omegaH(a).toFixed(3)}</span>
              </div>
              <div>{t.coords}</div>
              <div>
                {t.reactorClock} <span className="text-slate-300">{dur(rc.clock, lang)}</span> · {t.scale}{' '}
                {si(engine.params.timeScale, '×', 0)}
              </div>
            </div>

            {/* sağ üst güç */}
            <div className="pointer-events-none absolute top-2.5 right-3 text-right">
              <div className="font-mono text-[9px] tracking-[0.2em] text-slate-600 uppercase">{t.output}</div>
              <div className="font-mono text-base font-bold text-amber-300 [text-shadow:0_0_14px_rgba(251,191,36,0.5)]">
                {si(rc.power, 'W', 2)}
              </div>
              <div className="font-mono text-[10px] text-emerald-300/80">
                η = {(engine.etaSmooth * 100).toFixed(2)}%
              </div>
            </div>

            {/* efsane */}
            <div className="pointer-events-none absolute bottom-2.5 left-3 space-y-1">
              {legend.map((l) => (
                <div key={l.t} className="flex items-center gap-1.5 font-mono text-[9.5px] text-slate-500">
                  <span className={cn('h-1.5 w-1.5 rounded-full', l.c)} />
                  {l.t}
                </div>
              ))}
              <div className="max-w-[330px] pt-1 text-[9.5px] leading-tight text-slate-600">
                {t.legendA}
                <span className="text-rose-400">{t.legendStop}</span>
                {t.legendB}
              </div>
            </div>

            {/* görünüm anahtarları */}
            <div className="absolute right-3 bottom-2.5 flex gap-1.5">
              <button
                onClick={() => setLabels((v) => !v)}
                className={cn(
                  'rounded border px-2 py-0.5 font-mono text-[9.5px] transition',
                  labels ? 'border-white/20 text-slate-300' : 'border-white/10 text-slate-600'
                )}
              >
                {t.labels}
              </button>
              <button
                onClick={() => setDust((v) => !v)}
                className={cn(
                  'rounded border px-2 py-0.5 font-mono text-[9.5px] transition',
                  dust ? 'border-white/20 text-slate-300' : 'border-white/10 text-slate-600'
                )}
              >
                {t.dust}
              </button>
            </div>

            {!engine.params.running && (
              <div className="pointer-events-none absolute inset-0 flex items-center justify-center bg-black/30">
                <span className="rounded-lg border border-amber-400/40 bg-black/70 px-4 py-2 font-mono text-xs tracking-[0.2em] text-amber-300">
                  {t.paused}
                </span>
              </div>
            )}
          </div>

          <div className="h-[116px] shrink-0 rounded-xl border border-white/10 bg-slate-950/60 px-2 pt-1">
            <div className="flex items-center justify-between px-1 pb-0.5">
              <span className="font-mono text-[9.5px] tracking-[0.18em] text-slate-500 uppercase">
                {t.historyTitle}
              </span>
              <span className="font-mono text-[9px] text-slate-600">
                {t.peakPower} {si(maxPowerRef.current, 'W', 1)}
              </span>
            </div>
            <div className="h-[84px]">
              <HistoryChart history={engine.history} maxPower={maxPowerRef.current} />
            </div>
          </div>
        </section>

        <aside className="min-h-0 lg:overflow-y-auto lg:pr-1">
          <Telemetry engine={engine} />
        </aside>
      </main>

      {showInfo && <PhysicsModal onClose={() => setShowInfo(false)} />}
    </div>
  );
}
