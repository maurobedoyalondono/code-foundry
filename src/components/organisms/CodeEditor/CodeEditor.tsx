'use client'

import React, { useEffect, useRef, useState } from 'react'
import Editor, { OnMount, Monaco } from '@monaco-editor/react'
import { useEditorStore, getActiveTab } from '@/store'
import { stValidationService } from '@/services/STValidationService'
import { stKeywords, stSnippets, stDataTypes } from '@/lib/monaco/stLanguageConfig'
import styles from './CodeEditor.module.scss'

interface CodeEditorProps {
  className?: string
}

export const CodeEditor: React.FC<CodeEditorProps> = ({ className }) => {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const editorRef = useRef<any>(null)
  const monacoRef = useRef<Monaco | null>(null)
  const [isLoading, setIsLoading] = useState(true)

  const { 
    openTabs, 
    activeTabId, 
    theme, 
    fontSize, 
    showMinimap, 
    wordWrap,
    updateTabContent,
    saveTab,
    closeTab,
    setActiveTab,
  } = useEditorStore()

  const activeTab = getActiveTab(useEditorStore.getState())

  const handleEditorDidMount: OnMount = (editor, monaco) => {
    editorRef.current = editor
    monacoRef.current = monaco
    setIsLoading(false)

    // Register Structured Text language
    registerStructuredText(monaco)

    // Configure editor options
    editor.updateOptions({
      minimap: { enabled: showMinimap },
      wordWrap: wordWrap ? 'on' : 'off',
      fontSize: fontSize,
      theme: theme === 'dark' ? 'vs-dark' : 'vs',
      automaticLayout: true,
      folding: true,
      foldingStrategy: 'indentation',
      showFoldingControls: 'mouseover',
      renderLineHighlight: 'all',
      scrollBeyondLastLine: false,
    })

    // Set up keyboard shortcuts
    editor.addCommand(monaco.KeyMod.CtrlCmd | monaco.KeyCode.KeyS, () => {
      if (activeTabId) {
        saveTab(activeTabId)
      }
    })
    
    // Find and replace
    editor.addCommand(monaco.KeyMod.CtrlCmd | monaco.KeyCode.KeyF, () => {
      editor.trigger('', 'actions.find', null)
    })
    
    editor.addCommand(monaco.KeyMod.CtrlCmd | monaco.KeyCode.KeyH, () => {
      editor.trigger('', 'editor.action.startFindReplaceAction', null)
    })
    
    // Format document
    editor.addCommand(monaco.KeyMod.CtrlCmd | monaco.KeyMod.Shift | monaco.KeyCode.KeyF, () => {
      editor.trigger('', 'editor.action.formatDocument', null)
    })
    
    // Toggle comment
    editor.addCommand(monaco.KeyMod.CtrlCmd | monaco.KeyCode.Slash, () => {
      editor.trigger('', 'editor.action.commentLine', null)
    })
    
    // Go to line
    editor.addCommand(monaco.KeyMod.CtrlCmd | monaco.KeyCode.KeyG, () => {
      editor.trigger('', 'editor.action.gotoLine', null)
    })
  }

  const registerStructuredText = (monaco: Monaco) => {
    // Register Structured Text language
    monaco.languages.register({ id: 'st' })
    
    // Register completion provider
    monaco.languages.registerCompletionItemProvider('st', {
      triggerCharacters: ['.', ':', ' ', '('],
      provideCompletionItems: (model, position) => {
        const word = model.getWordUntilPosition(position)
        const range = {
          startLineNumber: position.lineNumber,
          endLineNumber: position.lineNumber,
          startColumn: word.startColumn,
          endColumn: word.endColumn
        }
        
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const suggestions: any[] = []
        
        // Add snippets
        stSnippets.forEach(snippet => {
          suggestions.push({
            label: snippet.label,
            kind: monaco.languages.CompletionItemKind.Snippet,
            insertText: snippet.insertText,
            insertTextRules: monaco.languages.CompletionItemInsertTextRule.InsertAsSnippet,
            documentation: snippet.documentation,
            range
          })
        })
        
        // Add keywords
        stKeywords.forEach(keyword => {
          if (!stSnippets.find(s => s.label === keyword)) {
            suggestions.push({
              label: keyword,
              kind: monaco.languages.CompletionItemKind.Keyword,
              insertText: keyword,
              range
            })
          }
        })
        
        // Add data types
        stDataTypes.forEach(dataType => {
          suggestions.push({
            label: dataType,
            kind: monaco.languages.CompletionItemKind.Class,
            insertText: dataType,
            range
          })
        })
        
        return { suggestions }
      }
    })
    
    // Register hover provider
    monaco.languages.registerHoverProvider('st', {
      provideHover: (model, position) => {
        const word = model.getWordAtPosition(position)
        if (!word) return null
        
        const hoverInfo: Record<string, string> = {
          'TON': 'Timer On Delay - Delays the output by the specified time',
          'TOF': 'Timer Off Delay - Delays turning off by the specified time',
          'CTU': 'Count Up - Increments counter on rising edge',
          'CTD': 'Count Down - Decrements counter on rising edge',
          'R_TRIG': 'Rising Edge Trigger - Detects FALSE to TRUE transition',
          'F_TRIG': 'Falling Edge Trigger - Detects TRUE to FALSE transition',
        }
        
        if (hoverInfo[word.word]) {
          return {
            contents: [{ value: hoverInfo[word.word] }]
          }
        }
        
        return null
      }
    })

    // Define language tokens
    monaco.languages.setMonarchTokensProvider('st', {
      keywords: [
        'PROGRAM', 'END_PROGRAM', 'FUNCTION', 'END_FUNCTION', 'FUNCTION_BLOCK', 'END_FUNCTION_BLOCK',
        'VAR', 'VAR_INPUT', 'VAR_OUTPUT', 'VAR_IN_OUT', 'VAR_GLOBAL', 'END_VAR',
        'IF', 'THEN', 'ELSIF', 'ELSE', 'END_IF', 'CASE', 'OF', 'END_CASE',
        'FOR', 'TO', 'BY', 'DO', 'END_FOR', 'WHILE', 'END_WHILE', 'REPEAT', 'UNTIL', 'END_REPEAT',
        'RETURN', 'EXIT', 'CONTINUE', 'TRUE', 'FALSE', 'NULL',
        'BOOL', 'BYTE', 'WORD', 'DWORD', 'LWORD', 'SINT', 'INT', 'DINT', 'LINT',
        'USINT', 'UINT', 'UDINT', 'ULINT', 'REAL', 'LREAL', 'TIME', 'DATE', 'STRING',
        'ARRAY', 'STRUCT', 'END_STRUCT', 'TYPE', 'END_TYPE',
        'AT', 'RETAIN', 'CONSTANT', 'PERSISTENT',
      ],

      operators: [
        ':=', '=', '<>', '<', '>', '<=', '>=',
        '+', '-', '*', '/', 'MOD', '**',
        'AND', 'OR', 'XOR', 'NOT',
        '&', '|', '^', '~',
        '.', ',', ';', ':', '[', ']', '(', ')',
      ],

      tokenizer: {
        root: [
          // Comments
          [/\/\/.*$/, 'comment'],
          [/\(\*/, 'comment', '@comment'],
          
          // Keywords
          [/\b(PROGRAM|END_PROGRAM|FUNCTION|END_FUNCTION|FUNCTION_BLOCK|END_FUNCTION_BLOCK)\b/, 'keyword.control'],
          [/\b(VAR|VAR_INPUT|VAR_OUTPUT|VAR_IN_OUT|VAR_GLOBAL|END_VAR)\b/, 'keyword.declaration'],
          [/\b(IF|THEN|ELSIF|ELSE|END_IF|CASE|OF|END_CASE)\b/, 'keyword.control'],
          [/\b(FOR|TO|BY|DO|END_FOR|WHILE|END_WHILE|REPEAT|UNTIL|END_REPEAT)\b/, 'keyword.control'],
          [/\b(RETURN|EXIT|CONTINUE)\b/, 'keyword.control'],
          [/\b(TRUE|FALSE|NULL)\b/, 'constant'],
          [/\b(BOOL|BYTE|WORD|DWORD|LWORD|SINT|INT|DINT|LINT)\b/, 'type'],
          [/\b(USINT|UINT|UDINT|ULINT|REAL|LREAL|TIME|DATE|STRING)\b/, 'type'],
          [/\b(ARRAY|STRUCT|END_STRUCT|TYPE|END_TYPE)\b/, 'type'],
          [/\b(AT|RETAIN|CONSTANT|PERSISTENT)\b/, 'keyword'],

          // Numbers
          [/\b\d+\.\d+\b/, 'number.float'],
          [/\b\d+\b/, 'number'],
          [/\b16#[0-9A-Fa-f]+\b/, 'number.hex'],
          [/\b2#[01]+\b/, 'number.binary'],

          // Strings
          [/'[^']*'/, 'string'],
          [/"[^"]*"/, 'string'],

          // Time literals
          [/T#\d+(\.\d+)?(ms|s|m|h|d)/, 'number'],

          // Identifiers
          [/[a-zA-Z_]\w*/, 'identifier'],

          // Operators
          [/:=/, 'operator'],
          [/[<>]=?/, 'operator'],
          // eslint-disable-next-line no-useless-escape
          [/[+\-*\/]/, 'operator'],
          [/\b(AND|OR|XOR|NOT|MOD)\b/, 'operator'],
        ],

        comment: [
          [/\*\)/, 'comment', '@pop'],
          [/./, 'comment'],
        ],
      },
    })

    // Configure language
    monaco.languages.setLanguageConfiguration('st', {
      comments: {
        lineComment: '//',
        blockComment: ['(*', '*)'],
      },
      brackets: [
        ['{', '}'],
        ['[', ']'],
        ['(', ')'],
      ],
      autoClosingPairs: [
        { open: '{', close: '}' },
        { open: '[', close: ']' },
        { open: '(', close: ')' },
        { open: "'", close: "'", notIn: ['string', 'comment'] },
        { open: '"', close: '"', notIn: ['string', 'comment'] },
        { open: '(*', close: '*)' },
      ],
      surroundingPairs: [
        { open: '{', close: '}' },
        { open: '[', close: ']' },
        { open: '(', close: ')' },
        { open: "'", close: "'" },
        { open: '"', close: '"' },
      ],
    })
  }

  const handleEditorChange = (value: string | undefined) => {
    if (activeTabId && value !== undefined) {
      updateTabContent(activeTabId, value)
      
      // Run validation for ST files
      const activeTab = getActiveTab(useEditorStore.getState())
      if (activeTab?.language === 'st' && editorRef.current && monacoRef.current) {
        const errors = stValidationService.validate(value)
        const model = editorRef.current.getModel()
        
        if (model) {
          // Convert validation errors to Monaco markers
          const markers = errors.map(error => ({
            severity: error.severity === 'error' 
              ? monacoRef.current!.MarkerSeverity.Error
              : error.severity === 'warning'
              ? monacoRef.current!.MarkerSeverity.Warning
              : monacoRef.current!.MarkerSeverity.Info,
            startLineNumber: error.line,
            startColumn: error.column || 1,
            endLineNumber: error.line,
            endColumn: error.column ? error.column + 1 : model.getLineMaxColumn(error.line),
            message: error.message,
          }))
          
          monacoRef.current.editor.setModelMarkers(model, 'st-validator', markers)
        }
      }
    }
  }

  const handleTabClick = (tabId: string) => {
    setActiveTab(tabId)
  }

  const handleTabClose = (e: React.MouseEvent, tabId: string) => {
    e.stopPropagation()
    closeTab(tabId)
  }

  // Update editor options when store changes
  useEffect(() => {
    if (editorRef.current) {
      editorRef.current.updateOptions({
        minimap: { enabled: showMinimap },
        wordWrap: wordWrap ? 'on' : 'off',
        fontSize: fontSize,
        theme: theme === 'dark' ? 'vs-dark' : 'vs',
      })
    }
  }, [theme, fontSize, showMinimap, wordWrap])

  if (openTabs.length === 0) {
    return (
      <div className={`${styles.codeEditor} ${className || ''}`}>
        <div className={styles.codeEditor__empty}>
          <h3>No files open</h3>
          <p>Select a file from the Project Explorer to start editing</p>
        </div>
      </div>
    )
  }

  return (
    <div className={`${styles.codeEditor} ${className || ''}`}>
      <div className={styles.codeEditor__tabs}>
        {openTabs.map(tab => (
          <div
            key={tab.id}
            className={`${styles.codeEditor__tab} ${
              tab.id === activeTabId ? styles['codeEditor__tab--active'] : ''
            }`}
            onClick={() => handleTabClick(tab.id)}
          >
            <span className={styles.codeEditor__tabName}>
              {tab.isDirty && <span className={styles.codeEditor__dirty}>•</span>}
              {tab.name}
            </span>
            <button
              className={styles.codeEditor__tabClose}
              onClick={(e) => handleTabClose(e, tab.id)}
              aria-label="Close tab"
            >
              ×
            </button>
          </div>
        ))}
      </div>

      <div className={styles.codeEditor__content}>
        {isLoading && (
          <div className={styles.codeEditor__loading}>
            Loading editor...
          </div>
        )}
        
        {activeTab && (
          <Editor
            height="100%"
            language={activeTab.language}
            value={activeTab.content}
            theme={theme === 'dark' ? 'vs-dark' : 'vs'}
            onChange={handleEditorChange}
            onMount={handleEditorDidMount}
            options={{
              minimap: { enabled: showMinimap },
              wordWrap: wordWrap ? 'on' : 'off',
              fontSize: fontSize,
              automaticLayout: true,
              scrollBeyondLastLine: false,
              readOnly: activeTab.readOnly,
            }}
          />
        )}
      </div>
    </div>
  )
}