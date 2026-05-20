export const stableStringify = (value: unknown): string => {
  return JSON.stringify(value, (_, entry) => (entry === undefined ? null : entry))
}

export const isSnapshotDirty = (snapshot: unknown, initialSerialized: string | null): boolean => {
  if (initialSerialized === null) return false
  return stableStringify(snapshot) !== initialSerialized
}

export const sortNumericIds = (ids: number[]): number[] => [...ids].sort((a, b) => a - b)
