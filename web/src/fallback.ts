import raw from '../../api/data/profile.json';
import type { Profile } from './types';

/**
 * The bundled copy of api/data/profile.json.
 *
 * It is the first paint, so the terminal never shows an empty state, and it
 * doubles as an offline fallback. /api/profile refreshes it at runtime, which
 * is what actually keeps the content current (MongoDB is the source of truth).
 */
export const FALLBACK_PROFILE = raw as unknown as Profile;
