import { create } from 'zustand'
import { devtools } from 'zustand/middleware'

export interface EditorTab {
  id: string
  path: string
  name: string
  content: string
  language: string
  isDirty: boolean
  readOnly?: boolean
}

interface EditorStore {
  // State
  openTabs: EditorTab[]
  activeTabId: string | null
  theme: 'light' | 'dark'
  fontSize: number
  showMinimap: boolean
  wordWrap: boolean

  // Actions
  openTab: (tab: Omit<EditorTab, 'isDirty'>) => void
  closeTab: (id: string) => void
  closeAllTabs: () => void
  closeOtherTabs: (id: string) => void
  setActiveTab: (id: string) => void
  updateTabContent: (id: string, content: string) => void
  saveTab: (id: string) => Promise<void>
  markTabClean: (id: string) => void
  
  // Settings
  setTheme: (theme: 'light' | 'dark') => void
  setFontSize: (size: number) => void
  toggleMinimap: () => void
  toggleWordWrap: () => void
}

export const useEditorStore = create<EditorStore>()(
  devtools(
    (set, get) => ({
      // Initial state
      openTabs: [],
      activeTabId: null,
      theme: 'light',
      fontSize: 14,
      showMinimap: true,
      wordWrap: false,

      // Tab management
      openTab: (tab) => {
        const existingTab = get().openTabs.find(t => t.path === tab.path)
        
        if (existingTab) {
          set({ activeTabId: existingTab.id })
        } else {
          const newTab: EditorTab = {
            ...tab,
            isDirty: false,
          }
          set(state => ({
            openTabs: [...state.openTabs, newTab],
            activeTabId: newTab.id,
          }))
        }
      },

      closeTab: (id) => {
        set(state => {
          const tabIndex = state.openTabs.findIndex(t => t.id === id)
          const newTabs = state.openTabs.filter(t => t.id !== id)
          
          let newActiveId = state.activeTabId
          if (state.activeTabId === id && newTabs.length > 0) {
            // If closing active tab, activate adjacent tab
            const newIndex = Math.min(tabIndex, newTabs.length - 1)
            newActiveId = newTabs[newIndex].id
          } else if (newTabs.length === 0) {
            newActiveId = null
          }

          return {
            openTabs: newTabs,
            activeTabId: newActiveId,
          }
        })
      },

      closeAllTabs: () => {
        set({ openTabs: [], activeTabId: null })
      },

      closeOtherTabs: (id) => {
        set(state => ({
          openTabs: state.openTabs.filter(t => t.id === id),
          activeTabId: id,
        }))
      },

      setActiveTab: (id) => {
        const tab = get().openTabs.find(t => t.id === id)
        if (tab) {
          set({ activeTabId: id })
        }
      },

      updateTabContent: (id, content) => {
        set(state => ({
          openTabs: state.openTabs.map(tab =>
            tab.id === id 
              ? { ...tab, content, isDirty: true }
              : tab
          ),
        }))
      },

      saveTab: async (id) => {
        const tab = get().openTabs.find(t => t.id === id)
        if (!tab) return

        try {
          // In a real implementation, save to file system
          await new Promise(resolve => {
            if (typeof globalThis.setTimeout !== 'undefined') {
              globalThis.setTimeout(resolve, 100)
            } else {
              resolve(undefined)
            }
          })
          
          set(state => ({
            openTabs: state.openTabs.map(t =>
              t.id === id ? { ...t, isDirty: false } : t
            ),
          }))
        } catch {
          throw new Error('Failed to save file')
        }
      },

      markTabClean: (id) => {
        set(state => ({
          openTabs: state.openTabs.map(tab =>
            tab.id === id ? { ...tab, isDirty: false } : tab
          ),
        }))
      },

      // Settings
      setTheme: (theme) => {
        set({ theme })
      },

      setFontSize: (fontSize) => {
        const size = Math.max(10, Math.min(24, fontSize))
        set({ fontSize: size })
      },

      toggleMinimap: () => {
        set(state => ({ showMinimap: !state.showMinimap }))
      },

      toggleWordWrap: () => {
        set(state => ({ wordWrap: !state.wordWrap }))
      },
    })
  )
)

// Selectors
export const getActiveTab = (state: EditorStore) =>
  state.openTabs.find(t => t.id === state.activeTabId)

export const hasUnsavedChanges = (state: EditorStore) =>
  state.openTabs.some(t => t.isDirty)