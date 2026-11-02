/**
 * Whether the current history entry was pushed with `state: { direct: true }`: an app opened straight from another one
 * (the scanner's "select" goes to the map) plays no loader and no sound (its own intro still runs). The state belongs to the entry, so a
 * reload or a later visit to the map from the home screen is a normal one.
 */
export function isDirectNavigation(): boolean {
  return typeof history !== 'undefined' && history.state?.direct === true
}
