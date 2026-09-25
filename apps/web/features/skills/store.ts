import { create } from 'zustand'

interface SkillsState {
  hovered: string | null
  selected: string | null
  /** Category highlighted from the legend; other districts are dimmed. */
  focusedCategory: string | null
  hover: (id: string | null) => void
  select: (id: string | null) => void
  focusCategory: (id: string | null) => void
}

export const useSkillsStore = create<SkillsState>((set) => ({
  hovered: null,
  selected: null,
  focusedCategory: null,
  hover: (hovered) => set({ hovered }),
  select: (selected) => set({ selected }),
  focusCategory: (id) => set((s) => ({ focusedCategory: s.focusedCategory === id ? null : id })),
}))
