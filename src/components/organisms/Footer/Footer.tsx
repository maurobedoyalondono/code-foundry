'use client'

import React from 'react'
import styles from './Footer.module.scss'

interface FooterProps {
  className?: string
}

export const Footer: React.FC<FooterProps> = ({ className }) => {
  const [connectionStatus] = React.useState<'connected' | 'disconnected' | 'error'>('connected')
  
  return (
    <footer className={`${styles.footer} ${className || ''}`}>
      <div className={styles.footer__content}>
        <div className={styles.footer__left}>
          <div className={styles.footer__statusItem}>
            <span 
              className={`${styles.footer__statusIndicator} ${
                styles[`footer__statusIndicator--${connectionStatus}`]
              }`}
            />
            <span className={styles.footer__statusText}>
              {connectionStatus === 'connected' ? 'PLC Connected' : 
               connectionStatus === 'disconnected' ? 'PLC Disconnected' : 
               'Connection Error'}
            </span>
          </div>
          <div className={styles.footer__statusItem}>
            <span>Line: 1, Col: 1</span>
          </div>
          <div className={styles.footer__statusItem}>
            <span>Structured Text</span>
          </div>
        </div>

        <div className={styles.footer__center}>
          <span className={styles.footer__version}>
            Industrial Automation IDE v0.1.0
          </span>
        </div>

        <div className={styles.footer__right}>
          <div className={styles.footer__statusItem}>
            <span>UTF-8</span>
          </div>
          <div className={styles.footer__statusItem}>
            <span>CRLF</span>
          </div>
          <div className={styles.footer__statusItem}>
            <span className={styles.footer__clock}>
              {new Date().toLocaleTimeString()}
            </span>
          </div>
        </div>
      </div>
    </footer>
  )
}