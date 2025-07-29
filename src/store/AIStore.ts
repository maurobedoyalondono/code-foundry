import { create } from 'zustand'
import { devtools } from 'zustand/middleware'
import { claudeCodeClient } from '@/services/ClaudeCodeClientService'
import { featureWorkflowService } from '@/services/FeatureWorkflowService'

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
  featureWorkflow?: {
    state: 'collecting-answers' | 'generating-specs' | 'ready-to-implement'
    questions?: string[]
    currentQuestionIndex?: number
    answers?: string[]
    specPath?: string
  }
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
            projectPath: '/home/negrito/src/projects/code-foundry/workspace',
            projectType: session.mode === 'debug' ? 'rockwell' : 'generic',
            currentFile: session.context.currentFile,
            selectedCode: session.context.selectedCode
          }
          
          // Handle different modes
          let response
          let assistantContent = ''
          
          if (session.mode === 'feature') {
            // Handle feature workflow
            if (!session.featureWorkflow) {
              // Start new feature workflow
              const workflowResult = await featureWorkflowService.startFeatureWorkflow(sessionId, message)
              
              // Update session with workflow state
              set(state => {
                const newSessions = new Map(state.sessions)
                const currentSession = newSessions.get(sessionId)!
                currentSession.featureWorkflow = {
                  state: 'collecting-answers',
                  questions: workflowResult.questions,
                  currentQuestionIndex: 0,
                  answers: []
                }
                newSessions.set(sessionId, currentSession)
                return { sessions: newSessions }
              })
              
              assistantContent = `I'll help you create a complete feature specification. Let me ask you some questions to better understand your requirements:\n\n${workflowResult.questions.join('\n\n')}\n\nPlease answer these questions one by one, or all at once separated by "---".`
              response = { finalMessage: assistantContent }
              
            } else if (session.featureWorkflow.state === 'collecting-answers') {
              // Process answers
              const answers = message.includes('---') 
                ? message.split('---').map(a => a.trim())
                : [message]
              
              const currentAnswers = session.featureWorkflow.answers || []
              const updatedAnswers = [...currentAnswers, ...answers]
              
              // Check if all questions are answered
              if (updatedAnswers.length >= (session.featureWorkflow.questions?.length || 0)) {
                // All questions answered, process them
                const result = await featureWorkflowService.processAnswers(sessionId, updatedAnswers)
                
                // Update workflow state
                set(state => {
                  const newSessions = new Map(state.sessions)
                  const currentSession = newSessions.get(sessionId)!
                  currentSession.featureWorkflow = {
                    ...currentSession.featureWorkflow!,
                    state: 'generating-specs',
                    answers: updatedAnswers
                  }
                  newSessions.set(sessionId, currentSession)
                  return { sessions: newSessions }
                })
                
                assistantContent = `Great! Based on your answers, I've clarified the feature idea:\n\n${result.clarifiedIdea}\n\nNow I'll generate the complete specification documents...\n\n📝 Generating user stories...`
                response = { finalMessage: assistantContent }
                
                // Generate specs in background
                if (typeof globalThis.setTimeout !== 'undefined') {
                  globalThis.setTimeout(async () => {
                  try {
                    // Generate user stories
                    await featureWorkflowService.generateUserStories(sessionId)
                    
                    // Add progress message
                    const progressMsg1: AIMessage = {
                      id: `msg-${Date.now()}-1`,
                      role: 'assistant',
                      content: '✅ User stories generated!\n📐 Creating technical design...',
                      timestamp: new Date()
                    }
                    
                    set(state => {
                      const newSessions = new Map(state.sessions)
                      const currentSession = newSessions.get(sessionId)!
                      currentSession.messages = [...currentSession.messages, progressMsg1]
                      newSessions.set(sessionId, currentSession)
                      return { sessions: newSessions }
                    })
                    
                    // Generate design
                    await featureWorkflowService.generateDesign(sessionId)
                    
                    // Add progress message
                    const progressMsg2: AIMessage = {
                      id: `msg-${Date.now()}-2`,
                      role: 'assistant',
                      content: '✅ Technical design created!\n📋 Generating implementation plan...',
                      timestamp: new Date()
                    }
                    
                    set(state => {
                      const newSessions = new Map(state.sessions)
                      const currentSession = newSessions.get(sessionId)!
                      currentSession.messages = [...currentSession.messages, progressMsg2]
                      newSessions.set(sessionId, currentSession)
                      return { sessions: newSessions }
                    })
                    
                    // Generate plan
                    await featureWorkflowService.generatePlan(sessionId)
                    const workflowState = featureWorkflowService.getWorkflowState(sessionId)
                    
                    // Final message
                    const finalMsg: AIMessage = {
                      id: `msg-${Date.now()}-3`,
                      role: 'assistant',
                      content: `✅ Feature specification complete!\n\n📁 All specification documents have been created in:\n${workflowState?.folderPath}\n\nGenerated files:\n- idea.md (Feature description)\n- user-stories.md (User requirements)\n- design.md (Technical design)\n- plan.md (Implementation plan)\n\nYou can now review these documents and start implementation. Switch back to Chat mode if you need help with the implementation!`,
                      timestamp: new Date()
                    }
                    
                    set(state => {
                      const newSessions = new Map(state.sessions)
                      const currentSession = newSessions.get(sessionId)!
                      currentSession.messages = [...currentSession.messages, finalMsg]
                      currentSession.featureWorkflow = {
                        ...currentSession.featureWorkflow!,
                        state: 'ready-to-implement',
                        specPath: workflowState?.folderPath
                      }
                      newSessions.set(sessionId, currentSession)
                      return { sessions: newSessions }
                    })
                    
                  } catch (error) {
                    const errorMsg: AIMessage = {
                      id: `msg-${Date.now()}-error`,
                      role: 'assistant',
                      content: `❌ Error generating specifications: ${error instanceof Error ? error.message : 'Unknown error'}`,
                      timestamp: new Date()
                    }
                    
                    set(state => {
                      const newSessions = new Map(state.sessions)
                      const currentSession = newSessions.get(sessionId)!
                      currentSession.messages = [...currentSession.messages, errorMsg]
                      newSessions.set(sessionId, currentSession)
                      return { sessions: newSessions }
                    })
                  }
                  }, 100)
                }
                
              } else {
                // More questions to answer
                set(state => {
                  const newSessions = new Map(state.sessions)
                  const currentSession = newSessions.get(sessionId)!
                  currentSession.featureWorkflow = {
                    ...currentSession.featureWorkflow!,
                    answers: updatedAnswers,
                    currentQuestionIndex: updatedAnswers.length
                  }
                  newSessions.set(sessionId, currentSession)
                  return { sessions: newSessions }
                })
                
                const remainingQuestions = session.featureWorkflow.questions?.slice(updatedAnswers.length) || []
                assistantContent = remainingQuestions.length > 0
                  ? `Thank you! Here are the remaining questions:\n\n${remainingQuestions.join('\n\n')}`
                  : 'Processing your answers...'
                response = { finalMessage: assistantContent }
              }
              
            } else {
              // Feature workflow completed or in other state
              assistantContent = 'The feature specification has been generated. You can find the documents in the specs folder. Switch to Chat mode if you need help with implementation!'
              response = { finalMessage: assistantContent }
            }
          } else if (session.mode === 'debug') {
            response = await claudeCodeClient.debugCode(
              session.context.selectedCode || '',
              message,
              'st',
              context
            )
          } else {
            // Regular conversation or command
            response = await claudeCodeClient.executeCommand(message, context)
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
            // Reset feature workflow when switching modes
            if (mode !== 'feature') {
              delete session.featureWorkflow
            }
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