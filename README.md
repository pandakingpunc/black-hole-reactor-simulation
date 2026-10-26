# Kerr–Penrose Black Hole Reactor

[![DOI](https://zenodo.org/badge/DOI/10.5281/zenodo.23674565.svg)](https://doi.org/10.5281/zenodo.23674565)

An interactive simulation of a power plant that extracts energy from a spinning black hole through the **Penrose process**. Particles are fired into the ergosphere of a Kerr black hole, split in two at their turning point, and the negative-energy fragment falls through the horizon while the other escapes with more energy than was sent in. The black hole spins down; the difference goes to the grid.

The particles are not animated along made-up curves: each one follows a real Kerr geodesic, every split conserves four-momentum exactly, and the reactor's mass and spin evolve under the Hawking area theorem.

**[▶ Open the simulation](https://pandakingpunc.github.io/black-hole-reactor-simulation/)** (GitHub Pages)

## What it simulates

- **Kerr geometry in the equatorial plane:** event horizon, ergosphere, frame-dragging angular velocity, photon orbits and the ISCO, in Boyer–Lindquist coordinates (G = c = M = 1).
- **Geodesic motion:** massive feed particles and the photons produced by each split are integrated with RK4 in the affine parameter, with turning points handled explicitly.
- **The Penrose split:** the parent particle decays into two photons in its rest frame. The emission axis is chosen to maximize the negative energy among directions whose escaping photon can actually reach the collector. In the extremal limit this reproduces the classic ceiling η = (√2 − 1)/2 ≈ 20.7%.
- **Automatic beam focusing:** for a target split radius the solver finds the (E, L) pair whose turning point lands there, and backs off to the deepest radius that still has a turning point under worst-case beam jitter.
- **Macro bookkeeping:** mass flux, reactor clock, net power to the grid, total output, black hole mass and spin. The irreducible mass is never allowed to decrease (area theorem), so the reactor runs out of fuel as a* falls.
- **Losses and refuelling:** photons that fail to escape, missed shots, Hawking evaporation for small cores, and an optional prograde ISCO accretion stream that spins the hole back up.
- **Physics notebook:** the `? PHYSICS` button opens a write-up of every equation the simulation uses and of its simplifications.

## Presets

| Preset | Core | Notes |
| --- | --- | --- |
| Lab Core | 10¹² kg, a* = 0.95 | horizon ≈ 1 fm |
| Industrial Plant | 10¹⁸ kg, a* = 0.90 | horizon ≈ 1 nm |
| Stellar Class | 10 M☉, a* = 0.98 | horizon ≈ 18 km |
| Extremal Test | 10¹² kg, a* = 0.9995 | close to the maximum efficiency |
| Spun-Down Core | 10¹² kg, a* = 0.62 | too slow for the Penrose cycle; 60% of the flux spins it back up |

## Usage

- **Language:** the app opens in English. The `EN | TR` switch in the top bar changes to Turkish without reloading; the choice is remembered in the browser and can also be set in the link with `?lang=en` or `?lang=tr`.
- **Keyboard:** `Space` pauses and resumes, `R` resets the current preset.
- **Left panel:** black hole spin and mass, beam settings (split radius, angular momentum, energy, emission angle ψ, jitter, fire rate) and the reactor cycle (mass flux, time scale, spin-up share, Hawking evaporation).
- **Right panel:** net power, energy balance per unit rest mass, core status (horizon, ergosphere, irreducible mass, Hawking temperature, remaining rotational fuel) and beam counters.

The first few seconds after a reset can show a net loss while the collection yield is still being measured; the reactor settles to its steady state shortly after.

## Simplifications

This is an engineering thought experiment built on real physics, not a model of an actual device.

- Motion is restricted to the equatorial plane; there is no θ motion or orbital inclination.
- Particles are test bodies: their own gravity and radiation reaction are ignored.
- The collector ring is a perfect absorber, and the cost of accelerating the beam is not counted.
- Hawking power uses the non-rotating (Schwarzschild) formula.
- The macro power is computed from the nominal (jitter-free) split, scaled by a quality factor and collection yield measured in the on-screen micro simulation.
- In real astrophysics the Penrose process is impractical (the fragments need relativistic relative speeds); nature extracts black hole spin through the Blandford–Znajek mechanism instead.

## Running locally

Requires Node.js 20.19 or newer.

```bash
npm install
npm run dev
```

`npm run build` produces a single self-contained `dist/index.html` that opens directly in a browser.

## Project structure

- `src/sim/kerr.ts`: Kerr metric, geodesic equations, the Penrose split, beam tuning, ISCO and Hawking formulas.
- `src/sim/engine.ts`: the reactor engine (particle spawning, splits, collection, macro mass and spin evolution).
- `src/components/`: canvas renderer, control panel, telemetry, history chart and the physics notebook.
- `src/i18n.tsx`: English and Turkish interface strings.

Built with React, TypeScript, Vite and Tailwind CSS.

## License

[MIT](LICENSE) © 2026 Mustafa Karatüm.

## Citation

If you use this software, please cite it using [CITATION.cff](CITATION.cff) or the Zenodo record:

> Karatüm, M. (2026). *Kerr–Penrose Black Hole Reactor* (v1.0.0). Zenodo. https://doi.org/10.5281/zenodo.23674566

The concept DOI [10.5281/zenodo.23674565](https://doi.org/10.5281/zenodo.23674565) covers all versions and always resolves to the latest one.
