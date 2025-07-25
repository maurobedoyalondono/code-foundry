'use client'

import React, { useState } from 'react'
import { AIMessage } from '@/store/AIStore'
import { MessageBubble } from '@/components/atoms/MessageBubble'
import styles from './ChatMessage.module.scss'

interface ChatMessageProps {
  message: AIMessage
  onCodeInsert?: (code: string) => void
}

export const ChatMessage: React.FC<ChatMessageProps> = ({ message, onCodeInsert }) => {
  const [copiedIndex, setCopiedIndex] = useState<number | null>(null)

  const handleCopyCode = (code: string, index: number) => {
    if (typeof globalThis.navigator !== 'undefined') {
      globalThis.navigator.clipboard.writeText(code)
      setCopiedIndex(index)
      if (typeof globalThis.setTimeout !== 'undefined') {
        globalThis.setTimeout(() => setCopiedIndex(null), 2000)
      }
    }
  }

  const handleInsertCode = (code: string) => {
    if (onCodeInsert) {
      onCodeInsert(code)
    }
  }

  const formatTime = (date: Date) => {
    return new Date(date).toLocaleTimeString('en-US', {
      hour: '2-digit',
      minute: '2-digit',
    })
  }

  return (
    <div className={`${styles.chatMessage} ${styles[`chatMessage--${message.role}`]}`}>
      <div className={styles.chatMessage__avatar}>
        {message.role === 'user' ? '👤' : '🤖'}
      </div>
      
      <div className={styles.chatMessage__content}>
        <div className={styles.chatMessage__header}>
          <span className={styles.chatMessage__role}>
            {message.role === 'user' ? 'You' : 'AI Assistant'}
          </span>
          <span className={styles.chatMessage__time}>
            {formatTime(message.timestamp)}
          </span>
        </div>
        
        <MessageBubble content={message.content} role={message.role} />
        
        {message.metadata?.codeBlocks && message.metadata.codeBlocks.length > 0 && (
          <div className={styles.chatMessage__codeBlocks}>
            {message.metadata.codeBlocks.map((block, index) => (
              <div key={index} className={styles.chatMessage__codeBlock}>
                <div className={styles.chatMessage__codeHeader}>
                  <span className={styles.chatMessage__codeLanguage}>
                    {block.language.toUpperCase()}
                  </span>
                  <div className={styles.chatMessage__codeActions}>
                    <button
                      className={styles.chatMessage__codeButton}
                      onClick={() => handleCopyCode(block.code, index)}
                      title="Copy code"
                    >
                      {copiedIndex === index ? '✅' : '📋'}
                    </button>
                    {onCodeInsert && (
                      <button
                        className={styles.chatMessage__codeButton}
                        onClick={() => handleInsertCode(block.code)}
                        title="Insert into editor"
                      >
                        📝
                      </button>
                    )}
                  </div>
                </div>
                <pre className={styles.chatMessage__code}>
                  <code>{block.code}</code>
                </pre>
              </div>
            ))}
          </div>
        )}
        
        {message.metadata?.suggestions && message.metadata.suggestions.length > 0 && (
          <div className={styles.chatMessage__suggestions}>
            <h4 className={styles.chatMessage__suggestionsTitle}>💡 Suggestions:</h4>
            <ul className={styles.chatMessage__suggestionsList}>
              {message.metadata.suggestions.map((suggestion, index) => (
                <li key={index}>{suggestion}</li>
              ))}
            </ul>
          </div>
        )}
      </div>
    </div>
  )
}