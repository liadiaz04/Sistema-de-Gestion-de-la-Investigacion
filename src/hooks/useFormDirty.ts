import { useCallback, useRef } from "react"
import { isSnapshotDirty, stableStringify } from "../utils/formDirty"

export const useFormDirty = () => {
  const initialRef = useRef<string | null>(null)

  const captureInitial = useCallback((snapshot: unknown) => {
    initialRef.current = stableStringify(snapshot)
  }, [])

  const resetDirtyTracking = useCallback(() => {
    initialRef.current = null
  }, [])

  const hasInitialSnapshot = useCallback(() => initialRef.current !== null, [])

  const isDirty = useCallback((snapshot: unknown) => {
    return isSnapshotDirty(snapshot, initialRef.current)
  }, [])

  return { captureInitial, resetDirtyTracking, hasInitialSnapshot, isDirty }
}
