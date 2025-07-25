'use client'

import React, { ReactNode } from 'react'
import styles from './IDELayout.module.scss'

export interface IDELayoutProps {
  leftPanel: ReactNode
  rightPanelUpper: ReactNode
  rightPanelLower: ReactNode
  onLayoutChange?: (layout: LayoutConfig) => void
}

export interface LayoutConfig {
  leftPanelWidth: number
  bottomPanelHeight: number
  leftPanelCollapsed: boolean
  bottomPanelCollapsed: boolean
}

export const IDELayout: React.FC<IDELayoutProps> = ({
  leftPanel,
  rightPanelUpper,
  rightPanelLower,
  onLayoutChange: _onLayoutChange,
}) => {
  const [leftPanelCollapsed, setLeftPanelCollapsed] = React.useState(false)
  const [bottomPanelCollapsed, setBottomPanelCollapsed] = React.useState(false)

  const toggleLeftPanel = () => {
    setLeftPanelCollapsed(!leftPanelCollapsed)
  }

  const toggleBottomPanel = () => {
    setBottomPanelCollapsed(!bottomPanelCollapsed)
  }

  return (
    <div className={styles.ideLayout}>
      <header className={styles.ideLayout__header}>
        <div className={styles.ideLayout__headerContent}>
          <div className={styles.ideLayout__logo}>
            <h1>Industrial Automation IDE</h1>
          </div>
          <nav className={styles.ideLayout__nav}>
            {/* Navigation items will go here */}
          </nav>
          <div className={styles.ideLayout__actions}>
            {/* User actions will go here */}
          </div>
        </div>
      </header>

      <div className={styles.ideLayout__body}>
        <aside 
          className={`${styles.ideLayout__sidebar} ${
            leftPanelCollapsed ? styles['ideLayout__sidebar--collapsed'] : ''
          }`}
        >
          <div className={styles.ideLayout__sidebarHeader}>
            <button
              onClick={toggleLeftPanel}
              className={styles.ideLayout__collapseBtn}
              aria-label={leftPanelCollapsed ? 'Expand sidebar' : 'Collapse sidebar'}
            >
              {leftPanelCollapsed ? '→' : '←'}
            </button>
          </div>
          {!leftPanelCollapsed && (
            <div className={styles.ideLayout__sidebarContent}>
              {leftPanel}
            </div>
          )}
        </aside>

        <main className={styles.ideLayout__main}>
          <div className={styles.ideLayout__editorArea}>
            {rightPanelUpper}
          </div>
          
          <div 
            className={`${styles.ideLayout__terminal} ${
              bottomPanelCollapsed ? styles['ideLayout__terminal--collapsed'] : ''
            }`}
          >
            <div className={styles.ideLayout__terminalHeader}>
              <div className={styles.ideLayout__terminalTabs}>
                <div className={styles.ideLayout__terminalTab}>
                  AI Terminal
                </div>
              </div>
              <button
                onClick={toggleBottomPanel}
                className={styles.ideLayout__collapseBtn}
                aria-label={bottomPanelCollapsed ? 'Expand terminal' : 'Collapse terminal'}
              >
                {bottomPanelCollapsed ? '↑' : '↓'}
              </button>
            </div>
            {!bottomPanelCollapsed && (
              <div className={styles.ideLayout__terminalContent}>
                {rightPanelLower}
              </div>
            )}
          </div>
        </main>
      </div>

      <footer className={styles.ideLayout__footer}>
        <div className={styles.ideLayout__statusBar}>
          <div className={styles.ideLayout__statusItem}>
            <span className={styles['ideLayout__statusItem--success']}>●</span>
            Ready
          </div>
          <div className={styles.ideLayout__statusItem}>
            Industrial Automation IDE v0.1.0
          </div>
        </div>
      </footer>
    </div>
  )
}