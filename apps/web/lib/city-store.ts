import { useEffect } from 'react'
import { create } from 'zustand'

export type CityViewMode = 'city' | 'list'

interface CityState {
  hovered: string | null
  selected: string | null
  /** District highlighted from the legend; other districts are dimmed. */
  focused: string | null
  view: CityViewMode
  hover: (id: string | null) => void
  select: (id: string | null) => void
  focus: (id: string | null) => void
  setView: (view: CityViewMode) => void
  reset: () => void
}

const initial = { hovered: null, selected: null, focused: null, view: 'city' as const }

/** Interaction state of the city on screen. Layers reset it when they mount. */
export const useCityStore = create<CityState>((set) => ({
  ...initial,
  hover: (hovered) => set({ hovered }),
  select: (selected) => set({ selected }),
  focus: (id) => set((s) => ({ focused: s.focused === id ? null : id })),
  setView: (view) => set({ view }),
  reset: () => set(initial),
}))

/** Query parameters that make a view shareable: /en/?select=React&focus=frontend&view=list */
const PARAMS = { selected: 'select', focused: 'focus', view: 'view' } as const

function stateFromUrl(search: string) {
  const params = new URLSearchParams(search)
  return {
    ...initial,
    selected: params.get(PARAMS.selected),
    focused: params.get(PARAMS.focused),
    view: params.get(PARAMS.view) === 'list' ? ('list' as const) : ('city' as const),
  }
}

function writeUrl(state: Pick<CityState, 'selected' | 'focused' | 'view'>) {
  const url = new URL(window.location.href)
  const set = (key: string, value: string | null) =>
    value ? url.searchParams.set(key, value) : url.searchParams.delete(key)
  set(PARAMS.selected, state.selected)
  set(PARAMS.focused, state.focused)
  set(PARAMS.view, state.view === 'list' ? 'list' : null)
  if (url.href !== window.location.href) window.history.replaceState(window.history.state, '', url)
}

/**
 * Gives a layer a clean slate, restores selection, focus and view from the URL, and keeps the
 * URL in sync afterwards, so every view can be shared or bookmarked. Other query parameters
 * (like ?repo=) are left alone.
 */
export function useLayerState() {
  useEffect(() => {
    useCityStore.setState(stateFromUrl(window.location.search))
    const unsubscribe = useCityStore.subscribe((s, prev) => {
      if (s.selected !== prev.selected || s.focused !== prev.focused || s.view !== prev.view)
        writeUrl(s)
    })
    return () => {
      unsubscribe()
      useCityStore.getState().reset()
    }
  }, [])
}
