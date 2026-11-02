import type { FairyConfig } from '@/lib/fairyBrain'
import type { LatLng } from '@/lib/geo'

/**
 * How the fairy plays with the player. All times in seconds, angles in degrees, distances in metres around the head.
 * Everything here is a guess to tune on a real phone.
 */
export const fairyConfig: FairyConfig = {
  // The player "has her in focus" while she is inside this central share of the screen. The camera cannot see her,
  // so she shows it herself: she gets nervous (she shivers by about this much, glows and sparkles more).
  focusScreenShare: 0.9,
  nervousJitterMeters: 0.07,

  // Phases 1-2: keep her in focus this long, losing her for up to the grace time does not reset it.
  focusSeconds: 5,
  focusGraceSeconds: 1,

  // Phase 3: she plays catch me: she hovers in front of the player and hops sideways now and then (mostly to the
  // other side, sometimes a feint). Keep her in focus this long, or start over.
  escapeSeconds: 5,
  escapeGraceSeconds: 1.5,
  escapeRadius: 1.5,
  escapeElevationRad: 0.2,
  escapeHopMinDeg: 18,
  escapeHopMaxDeg: 30,
  escapeHopMinSeconds: 0.7,
  escapeHopMaxSeconds: 0.9,
  escapeDwellMinSeconds: 0.6,
  escapeDwellMaxSeconds: 1.2,
  escapeFeintChance: 0.3,
  escapeFrontLimitDeg: 50,

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
  hideLookSeconds: 6,

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
