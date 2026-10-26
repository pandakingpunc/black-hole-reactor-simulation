import type { ReactNode } from 'react';
import { cn } from '../utils/cn';

export function Panel({
  title,
  icon,
  children,
  className,
  right,
}: {
  title?: string;
  icon?: ReactNode;
  children: ReactNode;
  className?: string;
  right?: ReactNode;
}) {
  return (
    <div
      className={cn(
        'rounded-xl border border-white/10 bg-slate-950/60 backdrop-blur-sm shadow-[0_0_24px_-12px_rgba(56,189,248,0.5)]',
        className
      )}
    >
      {title && (
        <div className="flex items-center justify-between gap-2 border-b border-white/[0.07] px-3 py-2">
          <div className="flex items-center gap-2">
            {icon}
            <h3 className="font-mono text-[10.5px] font-semibold tracking-[0.18em] text-slate-300 uppercase">
              {title}
            </h3>
          </div>
          {right}
        </div>
      )}
      <div className="p-3">{children}</div>
    </div>
  );
}

export function Slider({
  label,
  value,
  min,
  max,
  step,
  onChange,
  display,
  hint,
  accent = 'cyan',
  disabled,
}: {
  label: string;
  value: number;
  min: number;
  max: number;
  step: number;
  onChange: (v: number) => void;
  display: string;
  hint?: string;
  accent?: 'cyan' | 'violet' | 'amber' | 'rose' | 'emerald';
  disabled?: boolean;
}) {
  const accents: Record<string, string> = {
    cyan: 'accent-cyan-400 text-cyan-300',
    violet: 'accent-violet-400 text-violet-300',
    amber: 'accent-amber-400 text-amber-300',
    rose: 'accent-rose-400 text-rose-300',
    emerald: 'accent-emerald-400 text-emerald-300',
  };
  return (
    <div className={cn('group', disabled && 'opacity-40')}>
      <div className="flex items-baseline justify-between gap-2">
        <span className="text-[11px] font-medium text-slate-400">{label}</span>
        <span className={cn('font-mono text-[11px] font-semibold tabular-nums', accents[accent].split(' ')[1])}>
          {display}
        </span>
      </div>
      <input
        type="range"
        min={min}
        max={max}
        step={step}
        value={value}
        disabled={disabled}
        onChange={(e) => onChange(parseFloat(e.target.value))}
        className={cn('slider mt-1 w-full', accents[accent])}
      />
      {hint && <p className="mt-0.5 text-[9.5px] leading-tight text-slate-600">{hint}</p>}
    </div>
  );
}

export function Stat({
  label,
  value,
  unit,
  tone = 'default',
  sub,
}: {
  label: string;
  value: string;
  unit?: string;
  tone?: 'default' | 'good' | 'warn' | 'bad' | 'cyan' | 'violet';
  sub?: string;
}) {
  const tones: Record<string, string> = {
    default: 'text-slate-100',
    good: 'text-emerald-300',
    warn: 'text-amber-300',
    bad: 'text-rose-400',
    cyan: 'text-cyan-300',
    violet: 'text-violet-300',
  };
  return (
    <div className="rounded-lg border border-white/[0.06] bg-white/[0.02] px-2.5 py-1.5">
      <div className="text-[9.5px] font-medium tracking-wide text-slate-500 uppercase">{label}</div>
      <div className={cn('font-mono text-[13px] leading-tight font-semibold tabular-nums', tones[tone])}>
        {value}
        {unit && <span className="ml-0.5 text-[10px] font-normal text-slate-500">{unit}</span>}
      </div>
      {sub && <div className="mt-0.5 font-mono text-[9px] text-slate-600">{sub}</div>}
    </div>
  );
}

export function Toggle({
  label,
  checked,
  onChange,
  hint,
}: {
  label: string;
  checked: boolean;
  onChange: (v: boolean) => void;
  hint?: string;
}) {
  return (
    <button
      onClick={() => onChange(!checked)}
      className="flex w-full items-center justify-between gap-2 rounded-lg border border-white/[0.06] bg-white/[0.02] px-2.5 py-1.5 text-left transition hover:border-white/15 hover:bg-white/[0.05]"
    >
      <span>
        <span className="block text-[11px] text-slate-300">{label}</span>
        {hint && <span className="block text-[9px] text-slate-600">{hint}</span>}
      </span>
      <span
        className={cn(
          'relative h-4 w-8 shrink-0 rounded-full transition',
          checked ? 'bg-cyan-500/80' : 'bg-slate-700'
        )}
      >
        <span
          className={cn(
            'absolute top-0.5 h-3 w-3 rounded-full bg-white transition-all',
            checked ? 'left-4.5' : 'left-0.5'
          )}
        />
      </span>
    </button>
  );
}

export function Bar({
  value,
  color = 'cyan',
  label,
  right,
}: {
  value: number;
  color?: string;
  label?: string;
  right?: string;
}) {
  const colors: Record<string, string> = {
    cyan: 'from-cyan-500 to-sky-400',
    violet: 'from-violet-500 to-fuchsia-400',
    amber: 'from-amber-500 to-yellow-300',
    rose: 'from-rose-600 to-rose-400',
    emerald: 'from-emerald-500 to-teal-300',
  };
  return (
    <div>
      {(label || right) && (
        <div className="mb-0.5 flex justify-between text-[9.5px] text-slate-500">
          <span>{label}</span>
          <span className="font-mono text-slate-400">{right}</span>
        </div>
      )}
      <div className="h-1.5 w-full overflow-hidden rounded-full bg-white/[0.06]">
        <div
          className={cn('h-full rounded-full bg-gradient-to-r transition-all duration-200', colors[color])}
          style={{ width: `${Math.max(0, Math.min(100, value * 100))}%` }}
        />
      </div>
    </div>
  );
}
