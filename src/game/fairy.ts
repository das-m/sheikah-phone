import type { FairyConfig } from '@/lib/fairyBrain'
import type { LatLng } from '@/lib/geo'
import type { Zone } from '@/lib/zone'

/**
 * How the fairy plays with the player. All times in seconds, angles in degrees, distances in metres around the head.
 * Everything here is a guess to tune on a real phone.
 */
export const fairyConfig: FairyConfig = {
  // The player "has her in focus" while she is inside this central share of the screen. The camera cannot see her,
  // so she shows it herself: she glows and sparkles more (a shiver, if set, by about this much).
  focusScreenShare: 0.9,
  nervousJitterMeters: 0,

  // Phase 1: watch her this long, losing her for up to the grace time does not reset it.
  focusSeconds: 4,
  focusGraceSeconds: 1,

  // Phase 2: she notices the player, darts up close in front of the view and circles the head, then flies off.
  noticeSeconds: 4,
  noticeNearMeters: 0.5,
  noticeCircleRadius: 0.7,
  noticeCircleTurns: 1,

  // Phases 3-4: she shoots up and fades, then hides behind the player, closer each round.
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

/** Where the befriended fairy points to. Test coordinates. */
export const fairyGuideTarget: LatLng = { lat: 48.7886009, lng: 9.1758919 }

/** She only shows up in the camera app while the player is inside this zone (the radius is a guess to tune outdoors). */
export const fairyZone: Zone = { center: fairyGuideTarget, radiusMeters: 200 }
