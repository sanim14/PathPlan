import { Route } from '../types';

/**
 * Generates a concise, human-readable explanation for a route.
 * References active constraints and segment characteristics.
 * Output is ≤15 words.
 */
export function generateExplanation(route: Route): string {
  const { activeConstraints, segments } = route;

  const hasShortcut = segments.some((seg) => seg.shortcutId !== undefined);
  const hasIndoor = segments.some((seg) => seg.tags.includes('indoor'));

  const factors: string[] = [];

  if (activeConstraints.includes('accessibility')) {
    factors.push('avoids stairs');
  }
  if (activeConstraints.includes('safety')) {
    factors.push('well-lit safe paths');
  }
  if (activeConstraints.includes('fastest')) {
    factors.push('fastest route');
  }
  if (activeConstraints.includes('low-crowd')) {
    factors.push('avoids crowds');
  }
  if (hasShortcut) {
    factors.push('uses student shortcut');
  }
  if (hasIndoor && !hasShortcut) {
    factors.push('uses indoor path');
  }

  if (factors.length === 0) {
    return 'balanced route via main campus walkways';
  }

  if (factors.length === 1) {
    return factors[0];
  }

  // Join first factor with "and" for the rest
  const [first, ...rest] = factors;
  return `${first} and ${rest.join(', ')}`;
}
