import { describe, it, expect } from 'vitest';
import { NaiveBayesClassifier } from '@/ml/naiveBayes';
import { TRAINING_DATA } from '@/data/trainingData';

describe('NaiveBayesClassifier', () => {
  it('trains and predicts a known category', () => {
    const clf = new NaiveBayesClassifier();
    clf.train(TRAINING_DATA);
    const pred = clf.predict('UPI SWIGGY BANGALORE');
    expect(pred.category).toBe('Food');
    expect(pred.confidence).toBeGreaterThan(0.1);
    expect(pred.alternatives.length).toBeLessThanOrEqual(3);
  });

  it('is robust to case and noise prefixes', () => {
    const clf = new NaiveBayesClassifier();
    clf.train(TRAINING_DATA);
    const pred = clf.predict('upi SWIGGY bangalore order');
    expect(pred.category).toBe('Food');
  });

  it('handles unseen text without throwing', () => {
    const clf = new NaiveBayesClassifier();
    clf.train(TRAINING_DATA);
    expect(() => clf.predict('totally unknown merchant xyz')).not.toThrow();
    const pred = clf.predict('totally unknown merchant xyz');
    expect(pred.confidence).toBeGreaterThan(0);
    expect(pred.confidence).toBeLessThanOrEqual(1);
  });

  it('incorporates user corrections and retrains', () => {
    const clf = new NaiveBayesClassifier();
    clf.train(TRAINING_DATA);
    // Correct a misclassification by adding a correction
    const before = clf.predict('UPI UNKNOWNFOOD MERCHANT').category;
    clf.train([...TRAINING_DATA, { text: 'UNKNOWNFOOD MERCHANT', category: 'Food' }]);
    const after = clf.predict('UPI UNKNOWNFOOD MERCHANT').category;
    // The correction should push the prediction toward Food.
    expect(after).toBe('Food');
    // Before may or may not be Food, but after must be.
    void before;
  });

  it('throws if not trained', () => {
    const clf = new NaiveBayesClassifier();
    expect(() => clf.predict('swiggy')).toThrow();
  });
});
