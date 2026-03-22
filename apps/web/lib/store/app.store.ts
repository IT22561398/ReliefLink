'use client'

import { create } from 'zustand'

interface AppState {
  sidebarOpen: boolean
  darkMode: boolean

  // Actions
  toggleSidebar: () => void
  toggleDarkMode: () => void
  setSidebarOpen: (open: boolean) => void
  setDarkMode: (dark: boolean) => void
}

export const useAppStore = create<AppState>((set) => ({
  sidebarOpen: true,
  darkMode: false,

  toggleSidebar: () => set((state) => ({ sidebarOpen: !state.sidebarOpen })),
  toggleDarkMode: () => set((state) => ({ darkMode: !state.darkMode })),
  setSidebarOpen: (open) => set({ sidebarOpen: open }),
  setDarkMode: (dark) => set({ darkMode: dark }),
}))
