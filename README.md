# FinWise AI — AI-Powered Personal Finance Management

An AI-powered personal finance app built for the "AI for Finance" university assignment. It tracks income and expenses, auto-categorises transactions with a real machine-learning model, detects anomalies, forecasts spending, and gives personalised savings recommendations — **all in the browser, no backend, no external AI APIs**.

## Features

- **AI transaction categoriser** — a Multinomial Naive Bayes text classifier (written from scratch in TypeScript) trained on 300+ labelled Indian merchant descriptions across 8 categories. Shows a confidence percentage and the top 3 alternatives for every transaction. Correct a wrong category and the model retrains instantly.
- **Model performance page** — deterministic 80/20 train/test split, overall accuracy, per-category precision / recall / F1, and a confusion-matrix heatmap.
- **Anomaly detection** — per-category z-score flags (above 2 std) plus duplicate-charge detection (same merchant + amount within 2 days), each with a plain-language reason.
- **Spending forecast** — least-squares linear regression on monthly totals with a next-month forecast and a residual-based range.
- **Recommendation engine** — savings-rate vs target, 50/30/20 rule check, rising categories, recurring subscription detection with yearly cost, and "cut X by 15% to save ₹Y a year" suggestions, plus a savings-goal tracker.
- **Persona switcher** — load deterministic sample data for a Student or Salaried professional (6 months, ~150 transactions each, with deliberate anomalies).
- **CSV import / export** — upload `date,description,amount,type` files and download your data.
- **Dark mode**, fully responsive, Indian number formatting (₹, en-IN).

## Tech stack

React + TypeScript + Vite + Tailwind CSS, React Router, Recharts, PapaParse, lucide-react. Data persists in `localStorage`. The machine learning is in `src/ml/` and runs entirely client-side.

## Getting started

```bash
npm install
npm run dev
```

Open the printed local URL in your browser.

## Scripts

```bash
npm run dev        # start the dev server
npm run build      # production build
npm run typecheck  # TypeScript type check
npm test           # run Vitest unit tests
```

## Project structure

```
src/
  ml/                  # Machine learning (all from scratch)
    naiveBayes.ts      # Multinomial Naive Bayes classifier + Laplace smoothing
    performance.ts     # 80/20 split, accuracy, precision/recall/F1, confusion matrix
    anomaly.ts         # z-score + duplicate-charge detection
    forecast.ts        # least-squares linear regression forecast
    recommendations.ts # savings rate, 50/30/20, subscriptions, cut suggestions
    *.test.ts          # Vitest unit tests
  data/
    trainingData.ts    # 300+ labelled merchant descriptions
    generateSample.ts  # seeded PRNG sample data for the two personas
  components/          # reusable UI (cards, badges, layout, etc.)
  pages/               # Dashboard, Transactions, Insights, Model, How AI works
  utils/               # types, formatting, CSV, localStorage store, theme
```

## Demo script (6 steps)

1. Click **Student** in the header to load 6 months of sample transactions. The Dashboard loads with income, spent, saved, savings rate, a category pie chart and a monthly trend bar chart with the dashed forecast bar.
2. Go to **Transactions**. Search "swiggy", sort by amount descending, and see the category and confidence for each row. Click a category badge to correct it — the model retrains instantly.
3. Still in Transactions, click **Add**, type "UPI ZOMATO ORDER" and watch the predicted category update live as you type. Save the transaction.
4. Go to **Insights**. Review the unusual-charge and duplicate-charge cards (the sample data contains one very large purchase and one duplicate charge). Read the forecast and the recommendation cards. Drag the savings-target slider and update the savings goal.
5. Go to **Model performance**. Check the overall accuracy, per-category precision/recall/F1, and the confusion-matrix heatmap. Correct a few categories in Transactions and return here to see the numbers update.
6. Go to **How the AI works** for a plain-language explanation of each technique. Toggle dark mode in the header.

## AI techniques summary

| Component | Technique |
| --- | --- |
| Categorisation | Multinomial Naive Bayes with Laplace smoothing |
| Evaluation | Deterministic 80/20 split, accuracy, precision/recall/F1, confusion matrix |
| Anomaly detection | Per-category z-score (>2σ) + duplicate-charge (same merchant & amount within 2 days) |
| Forecast | Ordinary least-squares linear regression with residual-based range |
| Recommendations | Rule-based engine derived from the user's own numbers |

See `docs/AI_USAGE.md` for a log of how AI tools were used to build this project.
