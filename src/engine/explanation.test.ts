import { describe, it, expect } from 'vitest';
import { generateExplanation } from './explanation';
import { Route, PathSegment } from '../types';

function makeRoute(overrides: Partial<Route> = {}): Route {
  return {
    segments: [],
    totalDistance: 100,
    estimatedTime: 1,
    explanation: '',
    activeConstraints: [],
    ...overrides,
  };
}

function makeSeg(overrides: Partial<PathSegment> = {}): PathSegment {
  return {
    id: 'seg1',
    from: 'a',
    to: 'b',
    distance: 50,
    tags: [],
    weights: { distance: 50, crowdLevel: 0.2, safetyScore: 0.8, accessibilityScore: 0.9, popularity: 5 },
    ...overrides,
  };
}

describe('generateExplanation', () => {
  it('returns default explanation when no constraints and no special segments', () => {
    const result = generateExplanation(makeRoute());
    expect(result).toBe('balanced route via main campus walkways');
  });

  it('mentions avoiding stairs for accessibility constraint', () => {
    const result = generateExplanation(makeRoute({ activeConstraints: ['accessibility'] }));
    expect(result).toContain('avoids stairs');
  });

  it('mentions well-lit paths for safety constraint', () => {
    const result = generateExplanation(makeRoute({ activeConstraints: ['safety'] }));
    expect(result).toContain('well-lit');
  });

  it('mentions fastest for fastest constraint', () => {
    const result = generateExplanation(makeRoute({ activeConstraints: ['fastest'] }));
    expect(result).toContain('fastest');
  });

  it('mentions avoiding crowds for low-crowd constraint', () => {
    const result = generateExplanation(makeRoute({ activeConstraints: ['low-crowd'] }));
    expect(result).toContain('avoids crowds');
  });

  it('mentions student shortcut when a segment has shortcutId', () => {
    const seg = makeSeg({ shortcutId: 'sc1' });
    const result = generateExplanation(makeRoute({ segments: [seg] }));
    expect(result).toContain('student shortcut');
  });

  it('mentions indoor path when segment has indoor tag (no shortcut)', () => {
    const seg = makeSeg({ tags: ['indoor'] });
    const result = generateExplanation(makeRoute({ segments: [seg] }));
    expect(result).toContain('indoor');
  });

  it('does not mention indoor separately when shortcut is also present', () => {
    const seg = makeSeg({ tags: ['indoor'], shortcutId: 'sc1' });
    const result = generateExplanation(makeRoute({ segments: [seg] }));
    expect(result).toContain('student shortcut');
    // indoor should not appear as a separate factor alongside shortcut
    expect(result).not.toContain('indoor path');
  });

  it('combines multiple constraints naturally', () => {
    const result = generateExplanation(makeRoute({ activeConstraints: ['accessibility', 'safety'] }));
    expect(result).toContain('avoids stairs');
    expect(result).toContain('and');
    expect(result).toContain('well-lit');
  });

  it('output is 15 words or fewer', () => {
    const result = generateExplanation(makeRoute({
      activeConstraints: ['accessibility', 'safety', 'fastest', 'low-crowd'],
      segments: [makeSeg({ shortcutId: 'sc1', tags: ['indoor'] })],
    }));
    const wordCount = result.trim().split(/\s+/).length;
    expect(wordCount).toBeLessThanOrEqual(15);
  });
});
