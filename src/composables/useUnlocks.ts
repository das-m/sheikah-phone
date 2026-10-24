import { ref } from 'vue'

const STORAGE_KEY = 'sheikah-unlocks'

function load(): string[] {
  try {
    const parsed: unknown = JSON.parse(localStorage.getItem(STORAGE_KEY) ?? '[]')
    return Array.isArray(parsed) ? parsed.filter((id) => typeof id === 'string') : []
  } catch {
    return []
  }
}

const unlocked = ref<string[]>(load())

/** Ids unlocked by scanning, kept in localStorage. Works without storage, it just forgets on reload. */
export function useUnlocks() {
  function unlock(id: string) {
    if (unlocked.value.includes(id)) return
    unlocked.value = [...unlocked.value, id]
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(unlocked.value))
    } catch {
      // Storage blocked: keep the in-memory state.
    }
  }

  function isUnlocked(id: string): boolean {
    return unlocked.value.includes(id)
  }

  return { unlocked, unlock, isUnlocked }
}
