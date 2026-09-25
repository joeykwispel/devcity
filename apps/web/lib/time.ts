const DAY = 24 * 60 * 60 * 1000

/** Start of the current UTC day in ms. Stable within a day, which useSyncExternalStore needs. */
export const today = () => Math.floor(Date.now() / DAY) * DAY
