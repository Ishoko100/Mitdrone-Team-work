'use client';

import { create } from 'zustand';

interface SidebarState {
  mobileOpen: boolean;
  collapsed: boolean;
  setMobileOpen: (open: boolean) => void;
  toggleCollapsed: () => void;
}

export const useSidebarStore = create<SidebarState>((set) => ({
  mobileOpen: false,
  collapsed: false,
  setMobileOpen: (mobileOpen) => set({ mobileOpen }),
  toggleCollapsed: () => set((s) => ({ collapsed: !s.collapsed })),
}));
