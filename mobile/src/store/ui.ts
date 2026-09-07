// Small UI state: the left drawer open/closed.
import { create } from 'zustand'

interface UiState {
  drawerOpen: boolean
  openDrawer: () => void
  closeDrawer: () => void
  toggleDrawer: () => void
}

export const useUi = create<UiState>((set) => ({
  drawerOpen: false,
  openDrawer: () => set({ drawerOpen: true }),
  closeDrawer: () => set({ drawerOpen: false }),
  toggleDrawer: () => set((s) => ({ drawerOpen: !s.drawerOpen })),
}))
