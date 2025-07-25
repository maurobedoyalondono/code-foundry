'use client'

import React, { useState, useRef, useEffect } from 'react'
import { useAIStore } from '@/store'
import { ChatMessage } from '@/components/molecules/ChatMessage'
import { AISession } from '@/store/AIStore'
import styles from './AITerminal.module.scss'

interface AITerminalProps {
  projectId?: string
  className?: string
  onCodeInsert?: (code: string) => void
}

export const AITerminal: React.FC<AITerminalProps> = ({ 
  projectId = 'default', 
  className = '',
  onCodeInsert 
}) => {
  const [input, setInput] = useState('')
  const [isComposing, setIsComposing] = useState(false)
  const messagesEndRef = useRef<globalThis.HTMLDivElement>(null)
  const inputRef = useRef<globalThis.HTMLTextAreaElement>(null)

  const {
    sessions,
    activeSessionId,
    isProcessing,
    error,
    createSession,
    setActiveSession,
    sendMessage,
    setMode,
    clearHistory,
  } = useAIStore()

  // Get or create session
  useEffect(() => {
    if (!activeSessionId || !sessions.has(activeSessionId)) {
      const sessionId = createSession(projectId)
      setActiveSession(sessionId)
    }
  }, [activeSessionId, sessions, projectId, createSession, setActiveSession])

  const activeSession = activeSessionId ? sessions.get(activeSessionId) : null

  // Scroll to bottom when messages update
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [activeSession?.messages])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!input.trim() || !activeSessionId || isProcessing || isComposing) return

    const message = input.trim()
    setInput('')
    
    // Reset textarea height
    if (inputRef.current) {
      inputRef.current.style.height = 'auto'
    }

    await sendMessage(activeSessionId, message)
  }

  const handleKeyDown = (e: React.KeyboardEvent<globalThis.HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey && !isComposing) {
      e.preventDefault()
      // Create a synthetic form event
      const formEvent = {
        preventDefault: () => {},
      } as React.FormEvent
      handleSubmit(formEvent)
    }
  }

  const handleInputChange = (e: React.ChangeEvent<globalThis.HTMLTextAreaElement>) => {
    setInput(e.target.value)
    
    // Auto-resize textarea
    const textarea = e.target
    textarea.style.height = 'auto'
    textarea.style.height = `${Math.min(textarea.scrollHeight, 200)}px`
  }

  const handleModeChange = (mode: AISession['mode']) => {
    if (activeSessionId) {
      setMode(activeSessionId, mode)
    }
  }

  const handleClearHistory = () => {
    if (activeSessionId && globalThis.window?.confirm('Clear chat history?')) {
      clearHistory(activeSessionId)
    }
  }

  const handleCodeInsert = (code: string) => {
    if (onCodeInsert) {
      onCodeInsert(code)
    }
  }

  return (
    <div className={`${styles.aiTerminal} ${className}`}>
      <div className={styles.aiTerminal__header}>
        <div className={styles.aiTerminal__title}>
          <span className={styles.aiTerminal__icon}>🤖</span>
          <span>AI Assistant</span>
        </div>
        
        <div className={styles.aiTerminal__controls}>
          <div className={styles.aiTerminal__modeSelector}>
            <button
              className={`${styles.aiTerminal__modeButton} ${
                activeSession?.mode === 'conversation' ? styles['aiTerminal__modeButton--active'] : ''
              }`}
              onClick={() => handleModeChange('conversation')}
            >
              💬 Chat
            </button>
            <button
              className={`${styles.aiTerminal__modeButton} ${
                activeSession?.mode === 'feature' ? styles['aiTerminal__modeButton--active'] : ''
              }`}
              onClick={() => handleModeChange('feature')}
            >
              ⚡ Feature
            </button>
            <button
              className={`${styles.aiTerminal__modeButton} ${
                activeSession?.mode === 'debug' ? styles['aiTerminal__modeButton--active'] : ''
              }`}
              onClick={() => handleModeChange('debug')}
            >
              🐛 Debug
            </button>
          </div>
          
          <button
            className={styles.aiTerminal__clearButton}
            onClick={handleClearHistory}
            title="Clear history"
          >
            🗑️
          </button>
        </div>
      </div>

      <div className={styles.aiTerminal__messages}>
        {activeSession?.messages.map((message) => (
          <ChatMessage
            key={message.id}
            message={message}
            onCodeInsert={handleCodeInsert}
          />
        ))}
        
        {isProcessing && (
          <div className={styles.aiTerminal__processing}>
            <div className={styles.aiTerminal__processingDot} />
            <div className={styles.aiTerminal__processingDot} />
            <div className={styles.aiTerminal__processingDot} />
          </div>
        )}
        
        {error && (
          <div className={styles.aiTerminal__error}>
            ⚠️ {error}
          </div>
        )}
        
        <div ref={messagesEndRef} />
      </div>

      <form onSubmit={handleSubmit} className={styles.aiTerminal__inputForm}>
        <div className={styles.aiTerminal__inputWrapper}>
          <textarea
            ref={inputRef}
            value={input}
            onChange={handleInputChange}
            onKeyDown={handleKeyDown}
            onCompositionStart={() => setIsComposing(true)}
            onCompositionEnd={() => setIsComposing(false)}
            placeholder={
              activeSession?.mode === 'feature' 
                ? "Describe the feature you want to create..."
                : activeSession?.mode === 'debug'
                ? "Describe the issue you're facing..."
                : "Ask me anything about industrial automation..."
            }
            className={styles.aiTerminal__input}
            disabled={isProcessing}
            rows={1}
          />
          <button
            type="submit"
            className={styles.aiTerminal__sendButton}
            disabled={!input.trim() || isProcessing}
          >
            {isProcessing ? '⏳' : '📤'}
          </button>
        </div>
        
        <div className={styles.aiTerminal__hints}>
          {activeSession?.mode === 'conversation' && (
            <span>💡 Try: &quot;Generate a motor control function block&quot;</span>
          )}
          {activeSession?.mode === 'feature' && (
            <span>💡 Try: &quot;Create a conveyor system with safety interlocks&quot;</span>
          )}
          {activeSession?.mode === 'debug' && (
            <span>💡 Try: &quot;Why is my timer not resetting?&quot;</span>
          )}
        </div>
      </form>
    </div>
  )
}