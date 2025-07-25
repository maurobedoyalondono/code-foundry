'use client'

import React from 'react'
import styles from './MessageBubble.module.scss'

interface MessageBubbleProps {
  content: string
  role: 'user' | 'assistant' | 'system'
}

export const MessageBubble: React.FC<MessageBubbleProps> = ({ content, role }) => {
  // Simple markdown-like rendering
  const renderContent = (text: string) => {
    // Split by code blocks first
    const parts = text.split(/```[\s\S]*?```/g)
    const codeBlocks = text.match(/```[\s\S]*?```/g) || []
    
    return parts.map((part, index) => (
      <React.Fragment key={index}>
        {renderTextWithFormatting(part)}
        {codeBlocks[index] && (
          <pre className={styles.messageBubble__inlineCode}>
            <code>{codeBlocks[index].replace(/```\w*\n?|\n?```/g, '')}</code>
          </pre>
        )}
      </React.Fragment>
    ))
  }

  const renderTextWithFormatting = (text: string) => {
    // Handle line breaks
    const lines = text.split('\n')
    
    return lines.map((line, lineIndex) => {
      // Handle bold text
      let formattedLine: React.ReactNode = line
      
      // Bold: **text** or __text__
      formattedLine = line.split(/(\*\*[^*]+\*\*|__[^_]+__)/g).map((part, partIndex) => {
        if (part.match(/^\*\*[^*]+\*\*$|^__[^_]+__$/)) {
          return (
            <strong key={partIndex}>
              {part.replace(/^\*\*|\*\*$|^__|__$/g, '')}
            </strong>
          )
        }
        
        // Italic: *text* or _text_
        return part.split(/(\*[^*]+\*|_[^_]+_)/g).map((subPart, subIndex) => {
          if (subPart.match(/^\*[^*]+\*$|^_[^_]+_$/)) {
            return (
              <em key={`${partIndex}-${subIndex}`}>
                {subPart.replace(/^\*|\*$|^_|_$/g, '')}
              </em>
            )
          }
          
          // Inline code: `code`
          return subPart.split(/(`[^`]+`)/g).map((codePart, codeIndex) => {
            if (codePart.match(/^`[^`]+`$/)) {
              return (
                <code key={`${partIndex}-${subIndex}-${codeIndex}`} className={styles.messageBubble__code}>
                  {codePart.replace(/^`|`$/g, '')}
                </code>
              )
            }
            return codePart
          })
        })
      })
      
      return (
        <React.Fragment key={lineIndex}>
          {lineIndex > 0 && <br />}
          {formattedLine}
        </React.Fragment>
      )
    })
  }

  return (
    <div className={`${styles.messageBubble} ${styles[`messageBubble--${role}`]}`}>
      {renderContent(content)}
    </div>
  )
}