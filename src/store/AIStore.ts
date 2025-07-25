import { create } from 'zustand'
import { devtools } from 'zustand/middleware'
import { claudeCodeClient } from '@/services/ClaudeCodeClientService'

export interface AIMessage {
  id: string
  role: 'user' | 'assistant' | 'system'
  content: string
  timestamp: Date
  metadata?: {
    codeBlocks?: Array<{
      language: string
      code: string
    }>
    suggestions?: string[]
  }
}

export interface AISession {
  id: string
  projectId: string
  messages: AIMessage[]
  context: {
    currentFile?: string
    selectedCode?: string
    activeRoutines?: string[]
  }
  mode: 'conversation' | 'feature' | 'debug'
  createdAt: Date
  updatedAt: Date
}

interface AIStore {
  // State
  sessions: Map<string, AISession>
  activeSessionId: string | null
  isProcessing: boolean
  error: string | null
  claudeCodeReady: boolean

  // Actions
  initializeAI: () => Promise<void>
  createSession: (projectId: string, mode?: AISession['mode']) => string
  deleteSession: (sessionId: string) => void
  setActiveSession: (sessionId: string | null) => void
  sendMessage: (sessionId: string, message: string) => Promise<void>
  updateContext: (sessionId: string, context: Partial<AISession['context']>) => void
  setMode: (sessionId: string, mode: AISession['mode']) => void
  clearHistory: (sessionId: string) => void
  reset: () => void
}

const initialState = {
  sessions: new Map<string, AISession>(),
  activeSessionId: null,
  isProcessing: false,
  error: null,
  claudeCodeReady: false,
}

export const useAIStore = create<AIStore>()(
  devtools(
    (set, get) => ({
      ...initialState,

      initializeAI: async () => {
        try {
          // Claude Code client is ready immediately
          set({ claudeCodeReady: true })
        } catch (error) {
          set({ 
            error: error instanceof Error ? error.message : 'Failed to initialize AI',
            claudeCodeReady: false 
          })
        }
      },

      createSession: (projectId: string, mode: AISession['mode'] = 'conversation') => {
        const sessionId = `session-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`
        const now = new Date()
        
        const session: AISession = {
          id: sessionId,
          projectId,
          messages: [],
          context: {},
          mode,
          createdAt: now,
          updatedAt: now,
        }

        set(state => {
          const newSessions = new Map(state.sessions)
          newSessions.set(sessionId, session)
          return { 
            sessions: newSessions,
            activeSessionId: sessionId 
          }
        })

        return sessionId
      },

      deleteSession: (sessionId: string) => {
        set(state => {
          const newSessions = new Map(state.sessions)
          newSessions.delete(sessionId)
          return {
            sessions: newSessions,
            activeSessionId: state.activeSessionId === sessionId ? null : state.activeSessionId,
          }
        })
      },

      setActiveSession: (sessionId: string | null) => {
        if (sessionId === null || get().sessions.has(sessionId)) {
          set({ activeSessionId: sessionId })
        }
      },

      sendMessage: async (sessionId: string, message: string) => {
        const session = get().sessions.get(sessionId)
        if (!session) return

        set({ isProcessing: true, error: null })

        const userMessage: AIMessage = {
          id: `msg-${Date.now()}`,
          role: 'user',
          content: message,
          timestamp: new Date(),
        }

        // Add user message
        set(state => {
          const newSessions = new Map(state.sessions)
          const updatedSession = { ...session }
          updatedSession.messages = [...updatedSession.messages, userMessage]
          updatedSession.updatedAt = new Date()
          newSessions.set(sessionId, updatedSession)
          return { sessions: newSessions }
        })

        try {
          // Prepare context for Claude Code API
          const context = {
            projectPath: '/home/negrito/src/projects/code-foundry',
            projectType: session.mode === 'debug' ? 'rockwell' : 'generic',
            currentFile: session.context.currentFile,
            selectedCode: session.context.selectedCode
          }
          
          // Handle different modes
          let response
          if (session.mode === 'feature') {
            response = await claudeCodeClient.createFeature(message, context, (chunk) => {
              // Update streaming message in real-time
              set(state => {
                const newSessions = new Map(state.sessions)
                const currentSession = newSessions.get(sessionId)!
                const messages = [...currentSession.messages]
                
                // Find or create streaming assistant message
                let streamingMessage = messages.find(m => m.id.includes('streaming'))
                if (!streamingMessage) {
                  streamingMessage = {
                    id: `msg-streaming-${Date.now()}`,
                    role: 'assistant',
                    content: '',
                    timestamp: new Date()
                  }
                  messages.push(streamingMessage)
                }
                
                streamingMessage.content = chunk
                currentSession.messages = messages
                newSessions.set(sessionId, currentSession)
                return { sessions: newSessions }
              })
            })
          } else if (session.mode === 'debug') {
            response = await claudeCodeClient.debugCode(
              session.context.selectedCode || '',
              message,
              'st',
              context,
              (chunk) => {
                set(state => {
                  const newSessions = new Map(state.sessions)
                  const currentSession = newSessions.get(sessionId)!
                  const messages = [...currentSession.messages]
                  
                  let streamingMessage = messages.find(m => m.id.includes('streaming'))
                  if (!streamingMessage) {
                    streamingMessage = {
                      id: `msg-streaming-${Date.now()}`,
                      role: 'assistant',
                      content: '',
                      timestamp: new Date()
                    }
                    messages.push(streamingMessage)
                  }
                  
                  streamingMessage.content = chunk
                  currentSession.messages = messages
                  newSessions.set(sessionId, currentSession)
                  return { sessions: newSessions }
                })
              }
            )
          } else {
            // Regular conversation or command
            response = await claudeCodeClient.executeCommand(message, context, (chunk) => {
              set(state => {
                const newSessions = new Map(state.sessions)
                const currentSession = newSessions.get(sessionId)!
                const messages = [...currentSession.messages]
                
                let streamingMessage = messages.find(m => m.id.includes('streaming'))
                if (!streamingMessage) {
                  streamingMessage = {
                    id: `msg-streaming-${Date.now()}`,
                    role: 'assistant',
                    content: '',
                    timestamp: new Date()
                  }
                  messages.push(streamingMessage)
                }
                
                streamingMessage.content = chunk
                currentSession.messages = messages
                newSessions.set(sessionId, currentSession)
                return { sessions: newSessions }
              })
            })
          }
          
          const assistantMessage: AIMessage = {
            id: `msg-${Date.now()}`,
            role: 'assistant',
            content: response.finalMessage || 'No response received',
            timestamp: new Date(),
            metadata: {
              codeBlocks: response.codeBlocks,
              suggestions: response.suggestions
            }
          }

          // Add assistant response
          set(state => {
            const newSessions = new Map(state.sessions)
            const currentSession = newSessions.get(sessionId)!
            currentSession.messages = [...currentSession.messages, assistantMessage]
            currentSession.updatedAt = new Date()
            newSessions.set(sessionId, currentSession)
            return { sessions: newSessions, isProcessing: false }
          })
        } catch (error) {
          set({ 
            error: error instanceof Error ? error.message : 'Failed to process message',
            isProcessing: false 
          })
        }
      },

      updateContext: (sessionId: string, context: Partial<AISession['context']>) => {
        set(state => {
          const newSessions = new Map(state.sessions)
          const session = newSessions.get(sessionId)
          if (session) {
            session.context = { ...session.context, ...context }
            session.updatedAt = new Date()
            newSessions.set(sessionId, session)
          }
          return { sessions: newSessions }
        })
      },

      setMode: (sessionId: string, mode: AISession['mode']) => {
        set(state => {
          const newSessions = new Map(state.sessions)
          const session = newSessions.get(sessionId)
          if (session) {
            session.mode = mode
            session.updatedAt = new Date()
            newSessions.set(sessionId, session)
          }
          return { sessions: newSessions }
        })
      },

      clearHistory: (sessionId: string) => {
        set(state => {
          const newSessions = new Map(state.sessions)
          const session = newSessions.get(sessionId)
          if (session) {
            session.messages = []
            session.updatedAt = new Date()
            newSessions.set(sessionId, session)
          }
          return { sessions: newSessions }
        })
      },

      reset: () => {
        set(initialState)
      },
    })
  )
)

// Selectors
export const getActiveSession = (state: AIStore) =>
  state.activeSessionId ? state.sessions.get(state.activeSessionId) : null

export const getSessionMessages = (state: AIStore, sessionId: string) =>
  state.sessions.get(sessionId)?.messages || []