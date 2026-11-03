// Multinomial Naive Bayes text classifier for transaction categorisation.
//
// The model treats a transaction description as a "document" and its words as
// features. For each category it learns the probability of a word appearing
// given that category from labelled training data, using Laplace (add-one)
// smoothing so unseen words do not zero out an entire prediction.
//
// Prediction computes the posterior probability of each category given the
// input text using the Naive Bayes assumption that words are conditionally
// independent. Despite the simplifying assumption it works very well for
// short merchant strings, which are usually dominated by a few keyword
// tokens (e.g. "swiggy", "zomato", "bescom").

import { Category, CATEGORIES } from '@/utils/types';

export interface TrainingExample {
  text: string;
  category: Category;
}

export interface Prediction {
  category: Category;
  confidence: number; // posterior probability of top class, 0..1
  alternatives: { category: Category; probability: number }[];
}

// Tokeniser: lowercase, split on non-alphanumeric, drop very short tokens and
// common UPI/POS noise prefixes so they do not dominate the vocabulary.
const STOP_TOKENS = new Set([
  'upi',
  'pos',
  'txn',
  'ref',
  'no',
  'to',
  'via',
  'at',
  'in',
  'for',
  'the',
  'of',
  'on',
  'dr',
  'cr',
]);

export function tokenize(text: string): string[] {
  return text
    .toLowerCase()
    .split(/[^a-z0-9]+/)
    .filter((t) => t.length > 1 && !STOP_TOKENS.has(t));
}

export class NaiveBayesClassifier {
  private categories: Category[] = CATEGORIES;
  // log priors log P(category)
  private priors = new Map<Category, number>();
  // log likelihoods: category -> word -> log P(word | category)
  private likelihoods = new Map<Category, Map<string, number>>();
  // vocabulary size for Laplace smoothing denominator
  private vocab = new Set<string>();
  private trained = false;

  get isTrained(): boolean {
    return this.trained;
  }

  train(examples: TrainingExample[]): void {
    // Reset
    this.priors.clear();
    this.likelihoods.clear();
    this.vocab.clear();

    const counts = new Map<Category, number>();
    const wordCounts = new Map<Category, Map<string, number>>();

    for (const cat of this.categories) {
      counts.set(cat, 0);
      wordCounts.set(cat, new Map());
    }

    // Count occurrences
    for (const ex of examples) {
      const cat = ex.category;
      counts.set(cat, (counts.get(cat) ?? 0) + 1);
      const tokens = tokenize(ex.text);
      const catWords = wordCounts.get(cat)!;
      for (const tok of tokens) {
        this.vocab.add(tok);
        catWords.set(tok, (catWords.get(tok) ?? 0) + 1);
      }
    }

    const total = examples.length || 1;
    const vocabSize = this.vocab.size;

    // Compute log priors and log likelihoods with Laplace smoothing.
    // P(word|category) = (count + 1) / (totalWordsInCategory + vocabSize)
    for (const cat of this.categories) {
      const classCount = counts.get(cat) ?? 0;
      this.priors.set(cat, Math.log(classCount / total));

      const catWords = wordCounts.get(cat)!;
      let totalWords = 0;
      for (const [, c] of catWords) totalWords += c;

      const denom = totalWords + vocabSize;
      const lh = new Map<string, number>();
      for (const [word, c] of catWords) {
        lh.set(word, Math.log((c + 1) / denom));
      }
      this.likelihoods.set(cat, lh);
    }

    this.trained = true;
  }

  predict(text: string): Prediction {
    if (!this.trained) {
      throw new Error('Classifier not trained');
    }
    const tokens = tokenize(text);
    const scores: { category: Category; logProb: number }[] = [];

    for (const cat of this.categories) {
      let score = this.priors.get(cat) ?? 0;
      const lh = this.likelihoods.get(cat)!;
      const denom = (this.vocab.size || 1); // smoothing denom already baked into stored likelihoods
      for (const tok of tokens) {
        // log P(word|cat): use learned value if seen, else uniform smoothing
        const p = lh.get(tok) ?? Math.log(1 / ((lh.size || 1) + denom));
        score += p;
      }
      scores.push({ category: cat, logProb: score });
    }

    // Convert log scores to a softmax-style probability distribution so the
    // top value reads as a confidence percentage.
    scores.sort((a, b) => b.logProb - a.logProb);
    const max = scores[0].logProb;
    const exps = scores.map((s) => ({ ...s, e: Math.exp(s.logProb - max) }));
    const sumExp = exps.reduce((acc, s) => acc + s.e, 0);

    const probs = exps
      .map((s) => ({ category: s.category, probability: s.e / sumExp }))
      .sort((a, b) => b.probability - a.probability);

    return {
      category: probs[0].category,
      confidence: probs[0].probability,
      alternatives: probs.slice(1, 4),
    };
  }
}
