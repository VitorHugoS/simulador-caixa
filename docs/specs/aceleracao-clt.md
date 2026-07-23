## Problem Statement

Users of the real estate financing simulator need to manually calculate and input their complex annual benefits (such as 13th salary, vacations) and their monthly FGTS deposits to see how these impact their financing. This manual calculation is error-prone, tedious, and discourages users from discovering how much time and money they can save by injecting these benefits.

## Solution

A "1-Click Acceleration Hub" (Hub de Aceleração CLT) that allows users to simply input their gross salary and instantly activate automated schedules for 13º Salário, Férias, and FGTS. The system automatically calculates the correct amounts, frequencies, and start dates for these benefits, applying them to the simulation as "term reduction" (reduzir prazo) amortizations.

## User Stories

1. As a CLT worker, I want to input my gross salary once, so that I don't have to manually calculate my benefits.
2. As a CLT worker, I want to toggle my 13th salary on, so that the simulator automatically schedules an extra amortization every 12 months starting on month 12.
3. As a CLT worker, I want to toggle my Vacation bonus (1/3 of salary) on, so that the simulator automatically schedules an extra amortization every 12 months starting on month 6.
4. As a worker with FGTS, I want the simulator to automatically calculate 8% of my gross salary as my monthly FGTS deposit, so that I don't have to check my paycheck.
5. As a worker with FGTS, I want to explicitly see the estimated monthly FGTS deposit, so that I can verify it matches my reality.
6. As a worker with specific FGTS discounts or multiple income sources, I want to be able to manually override the calculated FGTS deposit amount, so that my simulation remains accurate.
7. As a worker using FGTS, I want to specify how often (in months) I will withdraw my Saque-Aniversário to amortize my balance, so that the simulation reflects my real-life strategy.
8. As a user experimenting with scenarios, I want these automatic benefits to be visually distinct in my "Extra Amortizations" list, so that I know they are managed by the acceleration panel and not manual entries.
9. As a user experimenting with scenarios, I want the automatic benefits to always apply the "reduce term" (reduzir prazo) effect, so that I maximize my interest savings.

## Implementation Decisions

- We built the `CLTTemplates` component to act as the Hub de Aceleração 1-Click.
- The state of the UI is driven by `params.fgtsDeposito` (for FGTS) and the existence of specific `id`s in the `eventos` array (for 13º and Férias).
- When the user modifies their `salario` (Gross Salary) input, the component automatically updates the values of active 13º and Férias events, and overrides the `fgtsDeposito` (recalculating 8% of the salary) seamlessly via `useEffect`.
- `EventoAporte` interface was extended with `geradoPor: 'template'` to track automatic events.
- In `EventList.tsx`, events with `geradoPor: 'template'` cannot be directly deleted via the list (the 'X' button removes them by interacting with the state, which untoggles the button in the Hub). They receive a distinct "Automático" badge.
- FGTS was integrated into the hub and removed from the main `InputPanel.tsx`, centralizing all benefit-related configurations in one place.

## Testing Decisions

- Tests should verify that when the gross salary changes, the `onUpdateParam` callback is called with exactly 8% of the new salary for FGTS.
- Tests should verify that toggling 13th Salary calls `onUpsert` with `frequencia: 12`, `mesInicio: 12`, and `valor` equal to the gross salary.
- Tests should verify that toggling Férias calls `onUpsert` with `frequencia: 12`, `mesInicio: 6`, and `valor` equal to 1/3 of the gross salary.
- Engine/Integration tests should verify that `CenarioBuilder` correctly applies an event marked as `geradoPor: 'template'` without mutating its intrinsic properties differently than manual events.
- The `CLTTemplates` UI component is the primary module for these tests.
- Prior art: React Testing Library component tests checking for button clicks and callback assertions.

## Out of Scope

- Calculating exact income tax deductions to derive net salary from gross salary automatically (too complex, depends on dependents, other deductions, etc.). We rely on the user providing their preferred base salary.
- Allowing the user to change the start month of the 13º or Férias directly from the UI (they default to 12 and 6, respectively, to maintain the "1-Click" simplicity).

## Further Notes

- The decision to keep the explicit `Depósito mensal FGTS` input visible while defaulting it to 8% of the gross salary provides a perfect balance between automation and flexibility for advanced users.
