import type { FairyConfig } from '@/lib/fairyBrain'
import type { LatLng } from '@/lib/geo'

/**
 * How the fairy plays with the player. All times in seconds, angles in degrees, distances in metres around the head.
 * Everything here is a guess to tune on a real phone.
 */
export const fairyConfig: FairyConfig = {
  // The player "has her in focus" when she is this close to the middle of the view (about the scope overlay).
  focusConeDeg: 12,

  // Phases 1-2: keep her in focus this long, losing her for up to the grace time does not reset it.
  focusSeconds: 5,
  focusGraceSeconds: 0.5,

  // Phase 3: she plays: a bit faster, hopping left and right. Keep her in focus this long, or start over.
  escapeSeconds: 5,
  escapeGraceSeconds: 1.5,
  escapeSpeedFactor: 1.3,
  escapeMaxDegPerSecond: 35,
  escapeHopSeconds: 1.2,
  escapeHopDeg: 18,
  escapeMaxDodgeDeg: 50,

  // Phases 4-6: "hey", she shoots up and fades, then hides behind the player, closer each round.
  fleeSeconds: 0.8,
  fleeRiseMeters: 8,
  hideRadii: [1.5, 1.2, 0.9],
  hideBehindSpreadDeg: 50,
  hideFadeInSeconds: 0.8,
  hideFindSeconds: 1,
  hideGraceSeconds: 0.3,
  hideBobMeters: 0.12,
  hideLoudness: 0.45,

  // Befriending: a loop in front of the view that ends in a close hover.
  befriendSeconds: 5,
  befriendEndDistance: 0.8,

  // Guide: hovers in the direction of the target, "hey" now and then.
  guideRadius: 1.2,
  guideElevationRad: 0.2,
  guideMaxDegPerSecond: 90,
  guideHeySeconds: 8,
  guideBobMeters: 0.15
}

/** Where the befriended fairy points to. Placeholder: Residenzschloss Ludwigsburg. */
export const fairyGuideTarget: LatLng = { lat: 48.899614, lng: 9.195613 }
