import { Building, Shortcut } from '../types';

// UT Austin campus — centered around 30.2849° N, 97.7341° W

export const demoBuildings: Building[] = [
  {
    id: 'pcl',
    name: 'Perry-Castañeda Library',
    coordinates: { lat: 30.2821, lng: -97.7394 },
    entrances: [
      { id: 'pcl-main', coordinates: { lat: 30.2822, lng: -97.7393 }, tags: ['main', 'accessible'] },
      { id: 'pcl-east', coordinates: { lat: 30.2820, lng: -97.7390 }, tags: ['stair-free'] },
    ],
  },
  {
    id: 'ece',
    name: 'Engineering Building',
    coordinates: { lat: 30.2876, lng: -97.7363 },
    entrances: [
      { id: 'ece-main', coordinates: { lat: 30.2877, lng: -97.7362 }, tags: ['main', 'accessible'] },
      { id: 'ece-south', coordinates: { lat: 30.2874, lng: -97.7364 }, tags: ['stair-free'] },
    ],
  },
  {
    id: 'utower',
    name: 'UT Tower (Main Building)',
    coordinates: { lat: 30.2862, lng: -97.7394 },
    entrances: [
      { id: 'utower-main', coordinates: { lat: 30.2863, lng: -97.7393 }, tags: ['main'] },
      { id: 'utower-west', coordinates: { lat: 30.2861, lng: -97.7396 }, tags: ['accessible', 'stair-free'] },
    ],
  },
  {
    id: 'gdc',
    name: 'Gates Dell Complex',
    coordinates: { lat: 30.2863, lng: -97.7365 },
    entrances: [
      { id: 'gdc-main', coordinates: { lat: 30.2864, lng: -97.7364 }, tags: ['main', 'accessible'] },
      { id: 'gdc-north', coordinates: { lat: 30.2866, lng: -97.7366 }, tags: ['stair-free'] },
    ],
  },
  {
    id: 'union',
    name: 'Texas Union',
    coordinates: { lat: 30.2843, lng: -97.7404 },
    entrances: [
      { id: 'union-main', coordinates: { lat: 30.2844, lng: -97.7403 }, tags: ['main', 'accessible'] },
      { id: 'union-east', coordinates: { lat: 30.2842, lng: -97.7401 }, tags: ['stair-free'] },
    ],
  },
  {
    id: 'jester',
    name: 'Jester Center',
    coordinates: { lat: 30.2808, lng: -97.7378 },
    entrances: [
      { id: 'jester-main', coordinates: { lat: 30.2809, lng: -97.7377 }, tags: ['main', 'accessible'] },
      { id: 'jester-north', coordinates: { lat: 30.2811, lng: -97.7379 }, tags: ['stair-free'] },
    ],
  },
  {
    id: 'bur',
    name: 'Burdine Hall',
    coordinates: { lat: 30.2849, lng: -97.7381 },
    entrances: [
      { id: 'bur-main', coordinates: { lat: 30.2850, lng: -97.7380 }, tags: ['main'] },
      { id: 'bur-west', coordinates: { lat: 30.2848, lng: -97.7383 }, tags: ['accessible', 'stair-free'] },
    ],
  },
  {
    id: 'wch',
    name: 'Welch Hall',
    coordinates: { lat: 30.2858, lng: -97.7381 },
    entrances: [
      { id: 'wch-main', coordinates: { lat: 30.2859, lng: -97.7380 }, tags: ['main', 'accessible'] },
    ],
  },
  {
    id: 'sut',
    name: 'Sutton Hall',
    coordinates: { lat: 30.2855, lng: -97.7404 },
    entrances: [
      { id: 'sut-main', coordinates: { lat: 30.2856, lng: -97.7403 }, tags: ['main'] },
      { id: 'sut-east', coordinates: { lat: 30.2854, lng: -97.7401 }, tags: ['accessible', 'stair-free'] },
    ],
  },
  {
    id: 'eer',
    name: 'Engineering Education & Research Center',
    coordinates: { lat: 30.2889, lng: -97.7355 },
    entrances: [
      { id: 'eer-main', coordinates: { lat: 30.2890, lng: -97.7354 }, tags: ['main', 'accessible'] },
      { id: 'eer-south', coordinates: { lat: 30.2887, lng: -97.7356 }, tags: ['stair-free'] },
    ],
  },
  {
    id: 'ssc',
    name: 'Student Services Building',
    coordinates: { lat: 30.2833, lng: -97.7393 },
    entrances: [
      { id: 'ssc-main', coordinates: { lat: 30.2834, lng: -97.7392 }, tags: ['main', 'accessible'] },
    ],
  },
  {
    id: 'rlm',
    name: 'Robert Lee Moore Hall',
    coordinates: { lat: 30.2870, lng: -97.7380 },
    entrances: [
      { id: 'rlm-main', coordinates: { lat: 30.2871, lng: -97.7379 }, tags: ['main'] },
      { id: 'rlm-west', coordinates: { lat: 30.2869, lng: -97.7382 }, tags: ['accessible', 'stair-free'] },
    ],
  },
];

export const demoShortcuts: Shortcut[] = [
  {
    id: 'sc-01',
    coordinates: [
      { lat: 30.2822, lng: -97.7393 },
      { lat: 30.2830, lng: -97.7390 },
      { lat: 30.2843, lng: -97.7388 },
    ],
    tags: ['crowded-between-classes'],
    upvotes: 42,
    downvotes: 3,
    popularityScore: 39,
  },
  {
    id: 'sc-02',
    coordinates: [
      { lat: 30.2843, lng: -97.7404 },
      { lat: 30.2850, lng: -97.7400 },
      { lat: 30.2858, lng: -97.7394 },
      { lat: 30.2862, lng: -97.7394 },
    ],
    tags: ['indoor'],
    upvotes: 31,
    downvotes: 2,
    popularityScore: 29,
  },
  {
    id: 'sc-03',
    coordinates: [
      { lat: 30.2863, lng: -97.7365 },
      { lat: 30.2868, lng: -97.7362 },
      { lat: 30.2876, lng: -97.7363 },
    ],
    tags: ['hidden-shortcut'],
    upvotes: 18,
    downvotes: 1,
    popularityScore: 17,
  },
  {
    id: 'sc-04',
    coordinates: [
      { lat: 30.2808, lng: -97.7378 },
      { lat: 30.2814, lng: -97.7382 },
      { lat: 30.2821, lng: -97.7394 },
    ],
    tags: ['unsafe-at-night'],
    upvotes: 5,
    downvotes: 12,
    popularityScore: -7,
  },
  {
    id: 'sc-05',
    coordinates: [
      { lat: 30.2849, lng: -97.7381 },
      { lat: 30.2855, lng: -97.7381 },
      { lat: 30.2858, lng: -97.7381 },
    ],
    tags: ['indoor', 'crowded-between-classes'],
    upvotes: 27,
    downvotes: 5,
    popularityScore: 22,
  },
  {
    id: 'sc-06',
    coordinates: [
      { lat: 30.2862, lng: -97.7394 },
      { lat: 30.2866, lng: -97.7385 },
      { lat: 30.2870, lng: -97.7380 },
    ],
    tags: ['hidden-shortcut'],
    upvotes: 14,
    downvotes: 0,
    popularityScore: 14,
  },
  {
    id: 'sc-07',
    coordinates: [
      { lat: 30.2876, lng: -97.7363 },
      { lat: 30.2882, lng: -97.7358 },
      { lat: 30.2889, lng: -97.7355 },
    ],
    tags: ['indoor'],
    upvotes: 35,
    downvotes: 4,
    popularityScore: 31,
  },
  {
    id: 'sc-08',
    coordinates: [
      { lat: 30.2833, lng: -97.7393 },
      { lat: 30.2827, lng: -97.7390 },
      { lat: 30.2821, lng: -97.7394 },
    ],
    tags: ['unsafe-at-night', 'hidden-shortcut'],
    upvotes: 8,
    downvotes: 15,
    popularityScore: -7,
  },
  {
    id: 'sc-09',
    coordinates: [
      { lat: 30.2855, lng: -97.7404 },
      { lat: 30.2849, lng: -97.7400 },
      { lat: 30.2843, lng: -97.7404 },
    ],
    tags: ['crowded-between-classes'],
    upvotes: 20,
    downvotes: 6,
    popularityScore: 14,
  },
  {
    id: 'sc-10',
    coordinates: [
      { lat: 30.2870, lng: -97.7380 },
      { lat: 30.2873, lng: -97.7371 },
      { lat: 30.2876, lng: -97.7363 },
    ],
    tags: ['hidden-shortcut', 'unsafe-at-night'],
    upvotes: 9,
    downvotes: 7,
    popularityScore: 2,
  },
  {
    id: 'sc-11',
    coordinates: [
      { lat: 30.2821, lng: -97.7394 },
      { lat: 30.2833, lng: -97.7393 },
      { lat: 30.2843, lng: -97.7404 },
    ],
    tags: ['indoor', 'crowded-between-classes'],
    upvotes: 50,
    downvotes: 8,
    popularityScore: 42,
  },
  {
    id: 'sc-12',
    coordinates: [
      { lat: 30.2858, lng: -97.7381 },
      { lat: 30.2863, lng: -97.7375 },
      { lat: 30.2863, lng: -97.7365 },
    ],
    tags: ['hidden-shortcut'],
    upvotes: 11,
    downvotes: 2,
    popularityScore: 9,
  },
];
