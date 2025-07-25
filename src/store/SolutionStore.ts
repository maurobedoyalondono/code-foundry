import { create } from 'zustand'
import { devtools, persist } from 'zustand/middleware'
import { Solution, Project } from '@/types/project.types'
import { fileSystemService } from '@/services/FileSystemService'

interface SolutionStore {
  // State
  solutions: Solution[]
  activeSolution: string | null
  activeProject: string | null
  activeFile: string | null
  loading: boolean
  error: string | null

  // Actions
  loadSolutions: () => Promise<void>
  createSolution: (name: string, description?: string) => Promise<Solution>
  updateSolution: (id: string, updates: Partial<Solution>) => Promise<void>
  deleteSolution: (id: string) => Promise<void>
  setActiveSolution: (id: string | null) => void
  setActiveProject: (id: string | null) => void
  setActiveFile: (path: string | null) => void
  reset: () => void
}

const initialState = {
  solutions: [],
  activeSolution: null,
  activeProject: null,
  activeFile: null,
  loading: false,
  error: null,
}

export const useSolutionStore = create<SolutionStore>()(
  devtools(
    persist(
      (set, _get) => ({
        ...initialState,

        loadSolutions: async () => {
          set({ loading: true, error: null })
          try {
            const solutions = await fileSystemService.loadSolutions()
            set({ solutions, loading: false })
          } catch (error) {
            set({ 
              error: error instanceof Error ? error.message : 'Failed to load solutions',
              loading: false 
            })
          }
        },

        createSolution: async (name: string, description?: string) => {
          set({ loading: true, error: null })
          try {
            const solution = await fileSystemService.createSolution(name, description)
            set(state => ({ 
              solutions: [...state.solutions, solution],
              loading: false 
            }))
            return solution
          } catch (error) {
            set({ 
              error: error instanceof Error ? error.message : 'Failed to create solution',
              loading: false 
            })
            throw error
          }
        },

        updateSolution: async (id: string, updates: Partial<Solution>) => {
          set({ loading: true, error: null })
          try {
            set(state => ({
              solutions: state.solutions.map(sol =>
                sol.id === id ? { ...sol, ...updates, updatedAt: new Date() } : sol
              ),
              loading: false
            }))
          } catch (error) {
            set({ 
              error: error instanceof Error ? error.message : 'Failed to update solution',
              loading: false 
            })
          }
        },

        deleteSolution: async (id: string) => {
          set({ loading: true, error: null })
          try {
            set(state => ({
              solutions: state.solutions.filter(sol => sol.id !== id),
              loading: false,
              activeSolution: state.activeSolution === id ? null : state.activeSolution,
              activeProject: state.activeProject && 
                state.solutions.find(s => s.id === id)?.projects.some(p => p.id === state.activeProject) 
                ? null : state.activeProject,
            }))
          } catch (error) {
            set({ 
              error: error instanceof Error ? error.message : 'Failed to delete solution',
              loading: false 
            })
          }
        },

        setActiveSolution: (id: string | null) => {
          set({ activeSolution: id })
        },

        setActiveProject: (id: string | null) => {
          set({ activeProject: id })
        },

        setActiveFile: (path: string | null) => {
          set({ activeFile: path })
        },

        reset: () => {
          set(initialState)
        },
      }),
      {
        name: 'solution-storage',
        partialize: (state) => ({ 
          activeSolution: state.activeSolution,
          activeProject: state.activeProject,
          activeFile: state.activeFile,
        }),
      }
    )
  )
)

// Selectors
export const getActiveSolution = (state: SolutionStore) => 
  state.solutions.find(s => s.id === state.activeSolution)

export const getActiveProject = (state: SolutionStore): Project | undefined => {
  const solution = getActiveSolution(state)
  return solution?.projects.find(p => p.id === state.activeProject)
}