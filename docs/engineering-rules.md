# Engineering Rules

These rules define how we build and evolve interactive game-like features in this project. They are intentionally general and should be applied across new code, refactors, and reviews.

## 1. Runtime Boundaries

- Keep React responsible for application shell, layout, and non-real-time UI.
- Keep the game/runtime loop outside React.
- Do not put frame-driven logic, physics, or animation orchestration into React state/effects when it can live in the runtime layer.
- Define explicit boundaries between UI state, gameplay state, and rendering state.

## 2. Architecture

- Prefer a small number of clear layers: UI, orchestration, gameplay systems, rendering, and data/config.
- Favor composition of focused systems over large god-objects.
- Keep contracts between systems explicit and stable.
- Avoid hidden coupling through globals or incidental shared mutable state.
- Every new abstraction must remove real complexity; do not add framework-like layers without a clear payoff.

## 3. State And Events

- Use events for domain transitions, not as a substitute for direct data flow everywhere.
- Event names must be domain-oriented and predictable.
- State transitions must be explicit and finite; gameplay should run through a clear state machine.
- Avoid duplicate sources of truth for the same runtime state.
- Debug hooks are allowed, but they must be isolated from production behavior.

## 4. Performance First Principles

- Treat mobile and low-end devices as first-class targets.
- Optimize for stable frame time, not just average FPS.
- Prefer fixed-timestep or accumulator-based simulation for physics and deterministic gameplay.
- Minimize per-frame allocations and avoid unnecessary object churn in hot paths.
- Pool transient runtime objects when they are created frequently.
- Avoid unnecessary interactivity traversal, redraws, texture uploads, and expensive scene graph updates.
- Use adaptive quality settings for resolution, antialiasing, and visual effects.

## 5. Rendering

- Keep rendering decoupled from gameplay rules.
- Use the cheapest visual representation that satisfies the design goal.
- Reserve expensive animated assets for elements that materially improve player perception.
- Prefer atlases, compressed textures, and batched assets where supported.
- Frequently updated text should use performance-oriented rendering strategies.
- Measure draw calls, active animated instances, texture memory, and frame timing during development.

## 6. Physics

- Physics must serve gameplay, not dictate it.
- Use deterministic and bounded simulation settings.
- Clamp or normalize delta values only as a safeguard, not as the main timing strategy.
- Keep collision rules simple, explicit, and easy to inspect.
- Avoid rebuilding physics entities unnecessarily when reuse or pooling is viable.

## 7. Assets And Loading

- All runtime assets should go through a unified loading pipeline.
- Asset manifests/configs should remain declarative and human-readable.
- Runtime code should consume assets through stable identifiers, not hardcoded ad hoc paths.
- Loading should support progressive feedback and graceful failure.
- Fonts, audio, textures, and scene assets should follow the same lifecycle expectations where possible.

## 8. Configuration And Content

- Put tuning values in config, not inside imperative logic.
- Keep gameplay constants centralized and named by intent.
- Content configuration should be editable without touching engine code.
- Avoid scattering hidden magic numbers across systems.

## 9. Language And Type Safety

- Prefer strong typing for gameplay systems, events, manifests, and shared contracts.
- New platform or engine-facing code should move toward TypeScript-compatible boundaries even if surrounding legacy code remains JavaScript.
- Public APIs between subsystems must be narrow and documented by types or equivalent schema.

## 10. Observability And Tooling

- Every complex runtime feature should be debuggable without modifying core logic.
- Add lightweight profiling and diagnostic hooks for frame time, memory-heavy features, and active entities.
- Keep development tooling available, but make sure it degrades to zero cost in production.
- Measure before and after significant performance work.

## 11. Maintainability

- Code should be understandable by engineers who did not author the internal engine layer.
- Prefer boring and explicit solutions over clever but opaque ones.
- Keep module responsibilities narrow.
- Refactors should reduce coupling and simplify future changes, not only reorganize files.
- Remove dead paths, stale experiments, and commented-out alternatives once a direction is chosen.

## 12. Review Standards

- Changes to runtime code must be evaluated for correctness, performance impact, and architecture fit.
- New dependencies or abstractions require justification.
- Performance-sensitive changes should include a note on expected runtime cost.
- If a feature increases visual richness, confirm the cost is acceptable on target devices.

## 13. Decision Heuristics

- If logic updates every frame, it belongs in the runtime layer.
- If logic describes business flow or page state, it belongs in the app layer.
- If a feature needs an event bus, state machine, animation timeline, and physics hook, keep the contract minimal before adding another abstraction.
- When in doubt, choose the implementation that is easier to profile, type, and replace later.
