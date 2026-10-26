import type { ReactorEngine } from '../sim/engine';
import * as K from '../sim/kerr';
import { Panel, Stat, Bar } from './ui';
import { si, dur, massLabel, sci } from '../lib/format';
import { useLang } from '../i18n';

const WORLD_POWER = 2.0e13; // W — insanlığın toplam birincil enerji tüketim gücü
const SUN_LUM = 3.828e26; // W

export default function Telemetry({ engine }: { engine: ReactorEngine }) {
  const { lang, t } = useLang();
  const rc = engine.reactor;
  const a = rc.aStar;
  const rp = K.rHorizon(a);
  const c2 = K.C * K.C;
  const mIrrFrac = K.mIrrNorm(a);
  const rotJ = rc.Mkg * (1 - mIrrFrac) * c2;
  const rotJ0 = rc.M0 * (1 - K.mIrrNorm(Math.max(rc.aStar, 0.9995))) * c2;
  const nom = engine.nominalSplit();
  const bal = engine.balance;
  const tune = engine.tune;
  const etaMax = (0.5 * (Math.sqrt(tune.E ** 2 + 2 / rp - 1) - tune.E)) / tune.E;
  const etaNow = engine.etaSmooth;
  const rgeo = (K.G * rc.Mkg) / c2;
  const ph = K.hawkingPower(rc.Mkg);
  const net = rc.power - (engine.params.hawking ? ph : 0);
  const tLeft = net > 0 ? rotJ / net : Infinity;
  const worldRatio = net / WORLD_POWER;
  const th = K.hawkingTemp(rc.Mkg, a);
  const tot = engine.counts.harvested + engine.counts.lostEsc;
  const yieldPct = tot > 0 ? engine.counts.harvested / tot : 0;

  const status = rc.depleted
    ? { t: t.stDepleted, c: 'text-rose-400 border-rose-500/40 bg-rose-500/10' }
    : bal.dM > 1e-6
      ? { t: t.stReverse, c: 'text-rose-300 border-rose-500/40 bg-rose-500/10' }
      : !nom || engine.stalled
        ? {
            t: a < 0.78 ? t.stLowSpin : t.stMistuned,
            c: 'text-rose-300 border-rose-500/40 bg-rose-500/10',
          }
        : net <= 0
          ? { t: t.stNetLoss, c: 'text-amber-300 border-amber-500/40 bg-amber-500/10' }
          : a < 0.85
            ? { t: t.stWarn, c: 'text-amber-300 border-amber-500/40 bg-amber-500/10' }
            : { t: t.stNominal, c: 'text-emerald-300 border-emerald-500/40 bg-emerald-500/10' };

  return (
    <div className="flex flex-col gap-2.5">
      <Panel className="overflow-hidden">
        <div className={`mb-2 rounded-md border px-2 py-1 text-center font-mono text-[10px] tracking-[0.12em] ${status.c}`}>
          <span className="pulse-dot">● </span>
          {status.t}
        </div>
        <div className="text-[9.5px] tracking-[0.2em] text-slate-500 uppercase">{t.tmNetPower}</div>
        <div className="flex items-baseline gap-1.5">
          <span
            className={`font-mono text-3xl font-bold tabular-nums ${
              net > 0 ? 'text-amber-300 [text-shadow:0_0_22px_rgba(251,191,36,0.45)]' : 'text-slate-600'
            }`}
          >
            {si(Math.max(net, 0), '', 2).split(' ')[0]}
          </span>
          <span className="font-mono text-lg text-amber-500/80">{si(Math.max(net, 0), 'W', 2).split(' ')[1]}</span>
        </div>
        <div className="mt-1 space-y-0.5 text-[10px] text-slate-500">
          <div>
            ≈{' '}
            <span className="font-mono text-slate-300">
              {worldRatio >= 1 ? `${sci(worldRatio, 2)}×` : `${(worldRatio * 100).toFixed(2)}%`}
            </span>{' '}
            {t.tmWorld}
          </div>
          <div>
            ≈ <span className="font-mono text-slate-300">{sci(Math.max(net, 0) / SUN_LUM, 2)}×</span> {t.tmSun}
          </div>
        </div>
        <div className="mt-2 grid grid-cols-2 gap-1.5">
          <Stat label={t.tmTotal} value={si(rc.energyJ, 'J', 2)} tone="cyan" sub={`${t.tmGross} ${si(rc.grossJ, 'J', 1)}`} />
          <Stat label={t.tmClock} value={dur(rc.clock, lang)} sub={`${t.tmEffective} ${si(engine.effTimeScale, '×', 1)}`} />
        </div>
      </Panel>

      <Panel title={t.tmBalance} icon={<span className="inline-block h-1.5 w-1.5 rounded-full bg-emerald-400" />}>
        <div className="space-y-2">
          <div className="flex items-end justify-between">
            <div>
              <div
                className={`font-mono text-2xl font-bold tabular-nums ${etaNow > 0 ? 'text-emerald-300' : 'text-rose-400'}`}
              >
                {(etaNow * 100).toFixed(2)}
                <span className="text-sm opacity-70">%</span>
              </div>
              <div className="text-[9.5px] text-slate-500">{t.tmEtaSub}</div>
            </div>
            <div className="text-right">
              <div className="font-mono text-[11px] text-slate-400">{t.tmCeiling} {(Math.max(etaMax, 0) * 100).toFixed(2)}%</div>
              <div className="text-[9px] text-slate-600">{t.tmCeilingSub}</div>
            </div>
          </div>
          <Bar
            value={Math.max(etaNow, 0) / 0.2071}
            color="emerald"
            label={t.tmPenroseLimit}
            right={`${((Math.max(etaNow, 0) / 0.2071) * 100).toFixed(0)}%`}
          />
          <div className="rounded-lg border border-white/[0.06] bg-black/30 p-2 font-mono text-[10px] leading-relaxed">
            <div className="mb-1 text-[9px] tracking-wider text-slate-500 uppercase">{t.tmPerMass}</div>
            <Row k={t.tmRowFed} v={bal.Ep.toFixed(4)} c="text-cyan-300" />
            <Row k={t.tmRowNeg} v={bal.Eneg.toFixed(4)} c={bal.Eneg < 0 ? 'text-rose-400' : 'text-amber-300'} />
            <Row k={t.tmRowEsc} v={bal.Eesc.toFixed(4)} c="text-amber-300" />
            <Row k={t.tmRowHarvest} v={bal.harvest.toFixed(4)} c="text-emerald-300" />
            <div className="my-1 border-t border-white/10" />
            <Row k={t.tmRowNet} v={(bal.net >= 0 ? '+' : '') + bal.net.toFixed(4)} c={bal.net > 0 ? 'text-emerald-300' : 'text-rose-400'} />
          </div>
          <div className="grid grid-cols-3 gap-1.5">
            <Stat
              label={t.tmSplitR}
              value={`${tune.r0.toFixed(3)}M`}
              tone="violet"
              sub={tune.mode === 'turning' ? t.tmTurning : tune.mode === 'plunge' ? t.tmPlunge : t.tmNone}
            />
            <Stat label={t.tmBeamE} value={tune.E.toFixed(3)} tone="cyan" sub={`L=${tune.L.toFixed(2)}`} />
            <Stat label={t.tmQuality} value={`${(engine.quality * 100).toFixed(0)}%`} tone={engine.quality > 0.8 ? 'good' : 'warn'} sub={t.tmJitterLoss} />
          </div>
          <p className="text-[9.5px] leading-snug text-slate-600">
            {t.tmNoteA}
            <em>{t.tmNoteDec}</em>
            {t.tmNoteB}
          </p>
        </div>
      </Panel>

      <Panel title={t.tmCore} icon={<span className="inline-block h-1.5 w-1.5 rounded-full bg-violet-400" />}>
        <div className="space-y-2">
          <div className="grid grid-cols-2 gap-1.5">
            <Stat label={t.tmMass} value={massLabel(rc.Mkg)} tone="violet" sub={`${sci(rc.Mkg, 2)} kg`} />
            <Stat
              label={t.tmSpin}
              value={a.toFixed(4)}
              tone={a > 0.85 ? 'good' : a > 0.78 ? 'warn' : 'bad'}
              sub={`Ω_H = ${K.omegaH(a).toFixed(3)}`}
            />
            <Stat label={t.tmHorizon} value={si(rgeo * rp, 'm', 2)} sub={`${rp.toFixed(3)} M`} />
            <Stat label={t.tmErgo} value={si(rgeo * 2, 'm', 2)} sub={t.tmErgoSub} />
            <Stat label={t.tmIrr} value={`${(mIrrFrac * 100).toFixed(2)}% M`} sub={t.tmIrrSub} />
            <Stat
              label={t.tmHawkingT}
              value={si(th, 'K', 2)}
              sub={`${si(ph, 'W', 1)} ${t.tmLoss}`}
              tone={ph > Math.max(rc.power, 1e-30) ? 'bad' : 'default'}
            />
          </div>
          <Bar value={rotJ / Math.max(rotJ0, 1)} color="violet" label={t.tmFuel} right={si(rotJ, 'J', 2)} />
          <div className="flex justify-between text-[9.5px] text-slate-500">
            <span>{t.tmDepletion}</span>
            <span className="font-mono text-slate-300">{dur(tLeft, lang)}</span>
          </div>
          <div className="flex justify-between text-[9.5px] text-slate-500">
            <span>{t.tmFloor}</span>
            <span className="font-mono text-amber-300/80">a* ≈ 0.78</span>
          </div>
        </div>
      </Panel>

      <Panel title={t.tmCounters} icon={<span className="inline-block h-1.5 w-1.5 rounded-full bg-cyan-400" />}>
        <div className="space-y-2">
          <div className="grid grid-cols-3 gap-1.5">
            <Stat label={t.tmInjected} value={engine.counts.injected.toString()} tone="cyan" />
            <Stat label={t.tmSplits} value={engine.counts.split.toString()} tone="violet" />
            <Stat label={t.tmHarvested} value={engine.counts.harvested.toString()} tone="good" />
            <Stat label={t.tmSwallowed} value={engine.counts.lostEsc.toString()} tone="bad" sub={t.tmNoEscape} />
            <Stat
              label={t.tmRejMiss}
              value={`${engine.counts.rejected}/${engine.counts.missed}`}
              tone="warn"
              sub={t.tmShotControl}
            />
            <Stat label={t.tmActive} value={engine.particles.length.toString()} />
          </div>
          <Bar value={yieldPct} color="cyan" label={t.tmYield} right={`${(yieldPct * 100).toFixed(1)}%`} />
        </div>
      </Panel>
    </div>
  );
}

function Row({ k, v, c }: { k: string; v: string; c: string }) {
  return (
    <div className="flex justify-between">
      <span className="text-slate-500">{k}</span>
      <span className={`tabular-nums ${c}`}>{v}</span>
    </div>
  );
}
