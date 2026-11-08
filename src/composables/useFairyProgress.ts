import { ref } from 'vue'

/**
 * Whether she has been befriended (she reached the guide phase) in this session. The zone only decides where the first
 * contact happens: from then on she is there everywhere, and the camera app starts her as the guide again.
 */
export const fairyBefriended = ref(false)
