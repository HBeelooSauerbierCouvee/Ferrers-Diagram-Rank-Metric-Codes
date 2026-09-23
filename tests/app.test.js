import assert from 'node:assert/strict';
import * as app from '../app.js';
import { createEvaluationContext } from '../bounds/shared.js';
import pMonotoneLowerBound from '../lower bounds/NeriStanojkovsk2024/p-monotone.js';
import strictlyMonotoneLowerBound from '../lower bounds/NeriStanojkovsk2024/strictly-monotone.js';

function test(name, fn) {
  try {
    fn();
    console.log(`ok - ${name}`);
  } catch (error) {
    console.error(`not ok - ${name}`);
    throw error;
  }
}

test('diagonal counts follow the order-n convention', () => {
  assert.deepEqual(app.expandToOrderTuple([1, 2, 3]), [1, 2, 3]);
  assert.deepEqual(app.diagonalCellCounts([1, 2, 3]), [3, 2, 1]);
  assert.equal(app.nuMin([1, 2, 3], 2), 3);
});

test('strictly monotone example attains the upper bound', () => {
  const characteristicInfo = app.characteristicInfoFor(2, '');
  const bounds = app.bestKnownBounds([1, 2, 3], 2, 2, characteristicInfo);

  assert.equal(bounds.upper, 3);
  assert.equal(bounds.lower, 3);
  assert.equal(bounds.lowerRef, 'neri_stanojkovski_2024');
  assert.equal(bounds.construction.label, 'MDS-constructible diagonal construction');
  assert.equal(bounds.construction.family, 'MDS-constructible');
});

test('evaluateUpperBounds chooses the smallest applicable result', () => {
  const result = app.evaluateUpperBounds(
    {},
    [
      { appliesTo: () => true, evaluate: () => ({ id: 'a', value: 5, ref: 'singleton_like' }) },
      { appliesTo: () => false, evaluate: () => ({ id: 'b', value: 1, ref: 'singleton_like' }) },
      { appliesTo: () => true, evaluate: () => ({ id: 'c', value: 2, ref: 'singleton_like' }) },
    ]
  );

  assert.equal(result.id, 'c');
  assert.equal(result.value, 2);
});

test('evaluateLowerBounds keeps the first best applicable result on ties', () => {
  const result = app.evaluateLowerBounds(
    {},
    [
      { appliesTo: () => true, evaluate: () => ({ id: 'first', value: 7, ref: 'neri_stanojkovski_2024' }) },
      { appliesTo: () => true, evaluate: () => ({ id: 'second', value: 7, ref: 'full_space_d1' }) },
      { appliesTo: () => true, evaluate: () => ({ id: 'third', value: 3, ref: 'trivial_code' }) },
    ]
  );

  assert.equal(result.id, 'first');
  assert.equal(result.value, 7);
});

test('NeriStanojkovsk2024 precedence keeps strictly monotone before p-monotone on ties', () => {
  const characteristicInfo = app.characteristicInfoFor(2, '');
  const baseContext = createEvaluationContext([1, 2], 2, 2, characteristicInfo);
  const result = app.evaluateLowerBounds(
    { ...baseContext, bestUpper: app.evaluateUpperBounds(baseContext) },
    [strictlyMonotoneLowerBound, pMonotoneLowerBound]
  );

  assert.equal(result.construction.family, 'strictly monotone');
  assert.equal(result.value, 1);
});

test('stored exact d=1 case is preserved', () => {
  const characteristicInfo = app.characteristicInfoFor(2, '');
  const bounds = app.bestKnownBounds([1, 2, 3, 3], 1, 2, characteristicInfo);

  assert.equal(bounds.upper, 9);
  assert.equal(bounds.lower, 9);
  assert.equal(bounds.source, 'stored');
  assert.equal(bounds.lowerRef, 'full_space_d1');
  assert.equal(bounds.construction.label, 'Stored exact value');
  assert.equal(bounds.construction.family, 'catalogued exact case');
});

test('unsupported cases keep the conservative lower bound', () => {
  const characteristicInfo = app.characteristicInfoFor(4, '');
  const bounds = app.bestKnownBounds([2, 2], 2, 4, characteristicInfo);

  assert.equal(bounds.upper, 2);
  assert.equal(bounds.lower, 0);
  assert.equal(bounds.lowerRef, 'trivial_code');
  assert.equal(bounds.construction.attained, false);
});

test('prime-power and characteristic validation behave conservatively', () => {
  assert.equal(app.isPrimePower(4), true);
  assert.equal(app.isPrimePower(6), false);
  assert.deepEqual(app.characteristicInfoFor(5, ''), {
    characteristic: 5,
    source: 'derived_from_prime_q',
  });
  assert.deepEqual(app.characteristicInfoFor(4, ''), {
    characteristic: null,
    source: 'unknown',
  });
  assert.equal(app.characteristicInfoFor(4, '2').characteristic, 2);
  assert.equal(
    app.characteristicInfoFor(4, '3').error,
    'Field size q = 4 is not a power of the supplied characteristic p = 3.'
  );
});

test('p-height contraction helper follows the block-collapse rule', () => {
  const contraction = app.pHeightAndContraction([0, 0, 2, 2], 2);
  assert.deepEqual(contraction, {
    p: 2,
    height: 1,
    blockSize: 2,
    contraction: [0, 1],
  });
  assert.equal(app.isMonotone(contraction.contraction), true);
});

console.log('All tests passed.');
