import type { Params, Reactor, Tune } from '../sim/engine';
import { Panel, Slider, Toggle } from './ui';
import { si, massLabel } from '../lib/format';
import * as K from '../sim/kerr';
import { useLang } from '../i18n';

interface Props {
  params: Params;
  reactor: Reactor;
  rSplit: number;
  tune: Tune;
  set: (p: Partial<Params>) => void;
  setReactor: (p: Partial<Reactor>) => void;
}

const Dot = ({ c }: { c: string }) => (
  <span className={`inline-block h-1.5 w-1.5 rounded-full ${c}`} />
);

export default function ControlPanel({ params, reactor, rSplit, tune, set, setReactor }: Props) {
  const { t } = useLang();
  const a = reactor.aStar;
  const rp = K.rHorizon(a);
  const rgeo = (K.G * reactor.Mkg) / (K.C * K.C);

  return (
    <div className="flex flex-col gap-2.5">
      <Panel title={t.cpCore} icon={<Dot c="bg-violet-400" />}>
        <div className="space-y-3">
          <Slider
            label={t.cpSpin}
            value={a}
            min={0}
            max={0.9995}
            step={0.0005}
            accent="violet"
            onChange={(v) => setReactor({ aStar: v })}
            display={a.toFixed(4)}
            hint={t.cpSpinHint((2 - rp).toFixed(2), (K.rotEnergyFraction(a) * 100).toFixed(1))}
          />
          <Slider
            label={t.cpMass}
            value={Math.log10(Math.max(reactor.Mkg, 1e6))}
            min={9}
            max={31}
            step={0.05}
            accent="violet"
            onChange={(v) => setReactor({ Mkg: Math.pow(10, v), M0: Math.pow(10, v) })}
            display={massLabel(reactor.Mkg)}
            hint={`r₊ = ${si(rgeo * rp, 'm', 2)} · Hawking ${si(K.hawkingPower(reactor.Mkg), 'W', 1)}`}
          />
        </div>
      </Panel>

      <Panel title={t.cpBeam} icon={<Dot c="bg-cyan-400" />}>
        <div className="space-y-3">
          <Toggle
            label={t.cpAuto}
            checked={params.auto}
            onChange={(v) => set({ auto: v })}
            hint={t.cpAutoHint}
          />
          <Slider
            label={t.cpSplit}
            value={params.splitFrac}
            min={0}
            max={1}
            step={0.01}
            accent="rose"
            onChange={(v) => set({ splitFrac: v })}
            display={`${rSplit.toFixed(3)} M`}
            hint={t.cpSplitHint(rp.toFixed(3))}
          />
          <Slider
            label={params.auto ? t.cpLSolved : t.cpL}
            value={params.auto ? Math.max(-1, Math.min(4.2, tune.L)) : params.Lp}
            min={-1}
            max={4.2}
            step={0.05}
            disabled={params.auto}
            onChange={(v) => set({ Lp: v })}
            display={(params.auto ? tune.L : params.Lp).toFixed(2)}
            hint={t.cpLHint}
          />
          <Slider
            label={params.auto ? t.cpESolved : t.cpE}
            value={params.auto ? Math.max(0.82, Math.min(1.4, tune.E)) : params.Ep}
            min={0.82}
            max={1.4}
            step={0.005}
            disabled={params.auto}
            onChange={(v) => set({ Ep: v })}
            display={(params.auto ? tune.E : params.Ep).toFixed(3)}
            hint={t.cpEHint}
          />
          <Slider
            label={t.cpPsi}
            value={params.psi}
            min={0}
            max={1.4}
            step={0.01}
            accent="rose"
            onChange={(v) => set({ psi: v })}
            display={`${((params.psi * 180) / Math.PI).toFixed(0)}°`}
            hint={t.cpPsiHint}
          />
          <Slider
            label={t.cpJitter}
            value={params.jitter}
            min={0}
            max={1}
            step={0.01}
            onChange={(v) => set({ jitter: v })}
            display={`${(params.jitter * 100).toFixed(0)}%`}
            hint={t.cpJitterHint}
          />
          <div className="grid grid-cols-2 gap-2">
            <Slider
              label={t.cpRate}
              value={params.rate}
              min={1}
              max={24}
              step={1}
              onChange={(v) => set({ rate: v })}
              display={`${params.rate}/s`}
            />
            <Slider
              label={t.cpAnim}
              value={params.microSpeed}
              min={0.15}
              max={3}
              step={0.05}
              onChange={(v) => set({ microSpeed: v })}
              display={`${params.microSpeed.toFixed(2)}×`}
            />
          </div>
        </div>
      </Panel>

      <Panel title={t.cpCycle} icon={<Dot c="bg-amber-400" />}>
        <div className="space-y-3">
          <Slider
            label={t.cpMdot}
            value={Math.log10(params.mdot)}
            min={-3}
            max={12}
            step={0.05}
            accent="amber"
            onChange={(v) => set({ mdot: Math.pow(10, v) })}
            display={si(params.mdot, 'kg/s', 2)}
            hint={t.cpMdotHint}
          />
          <Slider
            label={t.cpTime}
            value={Math.log10(params.timeScale)}
            min={0}
            max={14}
            step={0.1}
            accent="amber"
            onChange={(v) => set({ timeScale: Math.pow(10, v) })}
            display={`${si(params.timeScale, '×', 1)}`}
            hint={t.cpTimeHint}
          />
          <Slider
            label={t.cpSpinUp}
            value={params.spinUpFrac}
            min={0}
            max={1}
            step={0.01}
            accent="emerald"
            onChange={(v) => set({ spinUpFrac: v })}
            display={`${(params.spinUpFrac * 100).toFixed(0)}%`}
            hint={t.cpSpinUpHint}
          />
          <Toggle
            label={t.cpHawking}
            checked={params.hawking}
            onChange={(v) => set({ hawking: v })}
            hint={t.cpHawkingHint}
          />
        </div>
      </Panel>
    </div>
  );
}
