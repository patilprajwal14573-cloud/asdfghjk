# AI tool usage log

This document logs how AI tools were used to design and build FinWise AI, per the assignment's documentation requirement.

## Planning

- Used an AI assistant to break the assignment brief into a concrete feature list and to decide the module layout (`src/ml/`, `src/data/`, `src/components/`, `src/pages/`, `src/utils/`).
- Discussed which algorithms satisfy the "real machine learning, not hard-coded if/else" requirement and settled on: Multinomial Naive Bayes for categorisation, z-score and duplicate detection for anomalies, ordinary least-squares regression for the forecast, and a rule-based recommendation engine driven by the user's own data.
- Used AI to outline a deterministic 80/20 evaluation split and the confusion-matrix design before writing any code.

## Code generation

- The Naive Bayes classifier, including tokenisation, stop-word handling for UPI/POS noise, Laplace smoothing and softmax-style confidence, was generated and then reviewed for correctness of the log-probability math.
- The anomaly detector, forecast (least-squares fit + residual standard error), recommendation engine and performance evaluator were generated and iterated against the test cases.
- UI components, pages, routing, the dark-mode provider and the localStorage-backed store were generated to match the codebase conventions (TypeScript strict, Tailwind, lucide-react icons, `@/` path alias).

## Sample data

- Used an AI assistant to design a seeded PRNG (Mulberry32) so the two personas produce identical data on every load.
- Generated realistic Indian merchant templates (Swiggy, Zomato, BigBasket, Uber, Ola, Amazon, Myntra, Netflix, Spotify, Airtel, BESCOM, Apollo Pharmacy, etc.) and seeded deliberate anomalies: one very large purchase and one duplicate charge in the most recent month.

## Debugging

- Used AI to debug the initial confidence computation (log-space scores needed a softmax-style normalisation to read as percentages) and to fix the confusion-matrix heatmap colour scaling.
- Wrote Vitest unit tests for the classifier, anomaly detection and forecast, and used AI to iterate on edge cases (unseen words, single-point fits, negative forecasts, 2-day duplicate window).

## Review

- Reviewed generated code for the assignment's non-negotiables: no external AI APIs, no backend, all ML in `src/ml/`, strict TypeScript types, plain-language copy, Indian number formatting, light/dark themes, responsive layout, and helpful empty states.

No code was committed without a human review pass. The AI tools were used as an assistant, not an autonomous developer.
