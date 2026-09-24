import { useEffect } from 'react'
import { create } from 'zustand'

interface CityState {
  hovered: string | null
  selected: string | null
  /** District highlighted from the legend; other districts are dimmed. */
  focused: string | null
  hover: (id: string | null) => void
  select: (id: string | null) => void
  focus: (id: string | null) => void
  reset: () => void
}

/** Interaction state of the city on screen. Layers reset it when they mount. */
export const useCityStore = create<CityState>((set) => ({
  hovered: null,
  selected: null,
  focused: null,
  hover: (hovered) => set({ hovered }),
  select: (selected) => set({ selected }),
  focus: (id) => set((s) => ({ focused: s.focused === id ? null : id })),
  reset: () => set({ hovered: null, selected: null, focused: null }),
}))

/** Gives a layer a clean slate: no hover, selection or focus carried over from another layer. */
export function useLayerState() {
  const reset = useCityStore((s) => s.reset)
  useEffect(() => {
    reset()
    return reset
  }, [reset])
}
