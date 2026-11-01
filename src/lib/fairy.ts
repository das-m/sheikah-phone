import type { Vec3 } from './gesture'

/** Vertical field of view of the camera image as shown on screen, in degrees. Tune on a real phone. */
export const CAMERA_VFOV_DEG = 50

/** Anything closer to the camera plane than this (m) counts as behind the camera. */
const NEAR = 0.1

/** How fast the fairy circles the user on average, in rad/s. The sines below make her speed up, slow down and turn back. */
const AZIMUTH_SPEED = 0.25

/** Device orientation as `deviceorientation` reports it, in degrees. */
export interface Orientation {
  alpha: number
  beta: number
  gamma: number
}

const toRad = Math.PI / 180

/**
 * Where the fairy is `tSec` seconds after she appeared, in metres around the user's head.
 * World frame: x east, y north, z up. Azimuth, elevation and radius are each a few incommensurate sines, so the path
 * looks organic but is deterministic (no state, easy to test). Elevation stays about -0.07..0.67 rad, radius 1.1..1.9 m.
 */
export function fairyPosition(tSec: number): Vec3 {
  const azimuth =
    AZIMUTH_SPEED * tSec + 0.8 * Math.sin(0.37 * tSec) + 0.4 * Math.sin(0.91 * tSec + 1.3)
  const elevation = 0.3 + 0.25 * Math.sin(0.53 * tSec + 2.1) + 0.12 * Math.sin(1.37 * tSec)
  const radius = 1.5 + 0.3 * Math.sin(0.71 * tSec + 0.5) + 0.1 * Math.sin(1.9 * tSec)
  const flat = radius * Math.cos(elevation)
  return {
    x: flat * Math.sin(azimuth),
    y: flat * Math.cos(azimuth),
    z: radius * Math.sin(elevation)
  }
}

/** Her speed in m/s at `tSec`, from two nearby positions. Along her path it ranges from about 0 to 1.6, the median is about 0.5. */
export function fairySpeed(tSec: number): number {
  const dt = 0.05
  const a = fairyPosition(tSec)
  const b = fairyPosition(tSec + dt)
  return Math.hypot(b.x - a.x, b.y - a.y, b.z - a.z) / dt
}

/** Her sound plays at this rate when she is slow and fast. The fast end is the one to tune by ear. */
const SOUND_RATE_SLOW = 3
const SOUND_RATE_FAST = 5
/** Speed (m/s) at which the sound reaches its fast rate. */
const SOUND_SPEED_FULL = 1.4

/** Playback rate (pitch and tempo) for the fairy sound at a given speed: faster flight, faster and higher sound. */
export function fairyPlaybackRate(speed: number): number {
  const t = Math.min(Math.max(speed / SOUND_SPEED_FULL, 0), 1)
  return SOUND_RATE_SLOW + (SOUND_RATE_FAST - SOUND_RATE_SLOW) * t
}

/**
 * Turns a world position (x east, y north, z up, the phone at the origin) into the rear camera's view:
 * x right, y up, z forward (distance in front of the camera, negative behind it).
 * `screenAngle` is `screen.orientation.angle`, since the orientation angles are relative to the device's natural (portrait) pose.
 */
export function worldToCamera(p: Vec3, orientation: Orientation, screenAngle: number): Vec3 {
  const a = orientation.alpha * toRad
  const b = orientation.beta * toRad
  const g = orientation.gamma * toRad
  const [cA, sA, cB, sB, cG, sG] = [
    Math.cos(a),
    Math.sin(a),
    Math.cos(b),
    Math.sin(b),
    Math.cos(g),
    Math.sin(g)
  ]
  // W3C rotation Rz(alpha) * Rx(beta) * Ry(gamma), device -> world. The transpose takes world -> device.
  const dx = (cA * cG - sA * sB * sG) * p.x + (cG * sA + cA * sB * sG) * p.y - cB * sG * p.z
  const dy = -cB * sA * p.x + cA * cB * p.y + sB * p.z
  const dz = (cG * sA * sB + cA * sG) * p.x + (sA * sG - cA * cG * sB) * p.y + cB * cG * p.z

  // Device axes: x right, y up the screen, z out of the screen. The rear camera looks along -z.
  const forward = -dz
  switch (((Math.round(screenAngle / 90) % 4) + 4) % 4) {
    case 1:
      return { x: -dy, y: dx, z: forward }
    case 2:
      return { x: -dx, y: -dy, z: forward }
    case 3:
      return { x: dy, y: -dx, z: forward }
    default:
      return { x: dx, y: dy, z: forward }
  }
}

export interface ScreenPoint {
  x: number
  y: number
  /** 1 / distance: for sizing things so that near ones look bigger. */
  scale: number
}

/** Pinhole projection of a camera-space point onto a `width` x `height` screen, or null when it is behind the camera. */
export function project(
  camera: Vec3,
  width: number,
  height: number,
  vfovDeg: number = CAMERA_VFOV_DEG
): ScreenPoint | null {
  if (camera.z < NEAR) return null
  const focal = height / 2 / Math.tan((vfovDeg * toRad) / 2)
  return {
    x: width / 2 + (focal * camera.x) / camera.z,
    y: height / 2 - (focal * camera.y) / camera.z,
    scale: 1 / camera.z
  }
}
