import {
  Tag,
  BarChart3,
  AlertTriangle,
  TrendingUp,
  Lightbulb,
} from 'lucide-react';

export default function HowAIWorks() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-xl font-semibold text-brand-800 dark:text-white">
          How the AI works
        </h1>
        <p className="mt-1 text-sm text-brand-500">
          A plain-language explanation of the four machine-learning techniques FinWise AI uses. Everything runs in your browser — no data is sent anywhere.
        </p>
      </div>

      <Section
        icon={Tag}
        title="1. Transaction categorisation — Multinomial Naive Bayes"
      >
        <p>
          When you add or import a transaction, the app predicts its category from the
          description text. The model is a <strong>Multinomial Naive Bayes</strong>{' '}
          classifier, a classic probabilistic text classifier. It was trained on over
          300 labelled Indian merchant descriptions (Swiggy, Zomato, BigBasket, Uber,
          Ola, Amazon, Myntra, Netflix, Spotify, Airtel, BESCOM, Apollo Pharmacy and
          more) across eight categories: Food, Transport, Rent, Utilities, Shopping,
          Entertainment, Health and Education.
        </p>
        <p>
          For each category, the model learns how often each word appears in that
          category from the training data. To avoid assigning zero probability to a
          word it has never seen, it uses <strong>Laplace (add-one) smoothing</strong>.
          When predicting, it multiplies the probabilities of the words in your
          description under each category (technically it sums log-probabilities for
          numerical stability) and picks the category with the highest posterior
          probability. The top probability is shown as a confidence percentage, and
          the next three are shown as alternatives.
        </p>
        <p>
          When you correct a wrong category, the correction is added to the training
          set and the model retrains instantly — so it learns from your data as you use
          it. No if/else rules are used anywhere; every prediction comes from the
          learned probabilities.
        </p>
      </Section>

      <Section
        icon={BarChart3}
        title="2. Model performance — deterministic 80/20 split"
      >
        <p>
          To measure how well the classifier works, the training data is split
          deterministically into 80% training and 20% test examples (every fifth
          example goes into the test set, so the split is identical on every run). The
          model trains on the 80%, predicts the 20%, and the page reports overall
          accuracy, per-category <strong>precision</strong>, <strong>recall</strong>{' '}
          and <strong>F1 score</strong>, plus a confusion-matrix heatmap showing exactly
          which categories get confused with which.
        </p>
        <ul className="list-disc space-y-1 pl-5">
          <li>
            <strong>Precision</strong> — of all the times the model guessed a category,
            how often it was right.
          </li>
          <li>
            <strong>Recall</strong> — of all the true examples of a category, how many
            the model found.
          </li>
          <li>
            <strong>F1 score</strong> — the harmonic mean of precision and recall, a
            single balanced score.
          </li>
        </ul>
      </Section>

      <Section
        icon={AlertTriangle}
        title="3. Anomaly detection — z-scores and duplicate charges"
      >
        <p>
          Two signals flag unusual transactions:
        </p>
        <ul className="list-disc space-y-1 pl-5">
          <li>
            <strong>Per-category z-score:</strong> for each category the app computes
            the mean and standard deviation of your expense amounts. Any expense more
            than <strong>2 standard deviations</strong> above the mean for its category
            is flagged as unusually high, with a plain-language explanation of how much
            bigger it is than your usual spending.
          </li>
          <li>
            <strong>Duplicate-charge detection:</strong> two expenses with the same
            merchant keyword and the same amount within a <strong>2-day window</strong>{' '}
            are flagged as a possible duplicate charge.
          </li>
        </ul>
      </Section>

      <Section
        icon={TrendingUp}
        title="4. Spending forecast — least-squares linear regression"
      >
        <p>
          To forecast next month's spending, the app fits a straight line to your
          monthly totals using <strong>ordinary least-squares linear regression</strong>.
          Each month is a point (month index on x, total spend on y), and the line's
          slope and intercept are computed with the standard closed-form formula. The
          forecast for the next month is the value of the line at the next month index.
          A range is computed from the <strong>standard error of the residuals</strong>{' '}
          (forecast ± 1.96 × SE for an approximate 95% interval), giving a realistic
          band rather than a single point estimate. The same technique is available
          per category on the Insights page.
        </p>
      </Section>

      <Section
        icon={Lightbulb}
        title="5. Recommendation engine — rules from your numbers"
      >
        <p>
          The recommendation engine generates advice entirely from your own data:
        </p>
        <ul className="list-disc space-y-1 pl-5">
          <li>
            <strong>Savings rate</strong> compared against your target (default 20%),
            with the exact amount you would need to save to hit it.
          </li>
          <li>
            <strong>50/30/20 rule check</strong> — needs, wants and savings as a share
            of income, with a flag if any bucket is off balance.
          </li>
          <li>
            <strong>Categories that rose</strong> versus the previous month, so you
            know where spending crept up.
          </li>
          <li>
            <strong>Recurring subscription detection</strong> — charges from the same
            merchant for the same amount in at least 3 different months, with the
            estimated yearly cost.
          </li>
          <li>
            <strong>Cut suggestions</strong> — "if you cut X by 15% you save ₹Y a year"
            for your biggest discretionary categories.
          </li>
        </ul>
      </Section>
    </div>
  );
}

function Section({
  icon: Icon,
  title,
  children,
}: {
  icon: React.ComponentType<{ className?: string }>;
  title: string;
  children: React.ReactNode;
}) {
  return (
    <div className="card p-5 animate-fade-in">
      <div className="flex items-center gap-3">
        <div className="rounded-lg bg-savings-100 p-2 text-savings-600 dark:bg-savings-900/40 dark:text-savings-400">
          <Icon className="h-5 w-5" />
        </div>
        <h2 className="text-base font-semibold text-brand-800 dark:text-brand-100">
          {title}
        </h2>
      </div>
      <div className="mt-3 space-y-2 text-sm leading-relaxed text-brand-600 dark:text-brand-300">
        {children}
      </div>
    </div>
  );
}


