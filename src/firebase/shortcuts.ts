import {
  getFirestore,
  collection,
  addDoc,
  getDocs,
  runTransaction,
  doc,
  serverTimestamp,
  Firestore,
} from 'firebase/firestore';
import app from './config';
import { Shortcut } from '../types';

let db: Firestore;

function getDb(): Firestore {
  if (!db) {
    db = getFirestore(app);
  }
  return db;
}

/**
 * Saves a new shortcut to Firestore.
 * Throws if coordinates.length < 2.
 */
export async function saveShortcut(
  shortcut: Omit<Shortcut, 'id'>
): Promise<Shortcut> {
  if (shortcut.coordinates.length < 2) {
    throw new Error('A shortcut must have at least 2 coordinate points.');
  }

  try {
    const ref = await addDoc(collection(getDb(), 'shortcuts'), {
      ...shortcut,
      popularityScore: shortcut.upvotes - shortcut.downvotes,
      createdAt: serverTimestamp(),
    });

    return { ...shortcut, id: ref.id };
  } catch (err) {
    throw new Error(
      `Failed to save shortcut: ${err instanceof Error ? err.message : String(err)}`
    );
  }
}

/**
 * Fetches all shortcuts from Firestore.
 */
export async function fetchShortcuts(): Promise<Shortcut[]> {
  try {
    const snapshot = await getDocs(collection(getDb(), 'shortcuts'));
    return snapshot.docs.map((d) => {
      const data = d.data();
      return {
        id: d.id,
        coordinates: data.coordinates ?? [],
        tags: data.tags ?? [],
        upvotes: data.upvotes ?? 0,
        downvotes: data.downvotes ?? 0,
        popularityScore: data.popularityScore ?? 0,
      } as Shortcut;
    });
  } catch (err) {
    throw new Error(
      `Failed to fetch shortcuts: ${err instanceof Error ? err.message : String(err)}`
    );
  }
}

/**
 * Atomically increments the vote counter and recomputes popularityScore.
 * Returns the updated vote counts.
 */
export async function voteOnShortcut(
  id: string,
  direction: 'up' | 'down'
): Promise<{ upvotes: number; downvotes: number; popularityScore: number }> {
  const docRef = doc(getDb(), 'shortcuts', id);

  try {
    return await runTransaction(getDb(), async (tx) => {
      const snap = await tx.get(docRef);
      if (!snap.exists()) {
        throw new Error(`Shortcut with id "${id}" does not exist.`);
      }

      const data = snap.data();
      const upvotes: number =
        (data.upvotes ?? 0) + (direction === 'up' ? 1 : 0);
      const downvotes: number =
        (data.downvotes ?? 0) + (direction === 'down' ? 1 : 0);
      const popularityScore = upvotes - downvotes;

      tx.update(docRef, { upvotes, downvotes, popularityScore });

      return { upvotes, downvotes, popularityScore };
    });
  } catch (err) {
    throw new Error(
      `Failed to vote on shortcut: ${err instanceof Error ? err.message : String(err)}`
    );
  }
}
