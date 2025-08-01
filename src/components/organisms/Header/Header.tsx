import React from 'react'
import styles from './Header.module.scss'

interface HeaderProps {
  onMenuClick?: () => void
  onSettingsClick?: () => void
}

export const Header: React.FC<HeaderProps> = ({ onMenuClick, onSettingsClick }) => {
  return (
    <header className={styles.header}>
      <div className={styles.header__content}>
        <div className={styles.header__left}>
          <button 
            className={styles.header__menuBtn}
            onClick={onMenuClick}
            aria-label="Toggle menu"
          >
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 12h18M3 6h18M3 18h18" />
            </svg>
          </button>
          <div className={styles.header__logo}>
            <span className={styles.header__logoIcon}>⚙️</span>
            <h1 className={styles.header__title}>Industrial Automation IDE</h1>
          </div>
        </div>

        <nav className={styles.header__nav}>
          <a href="#" className={styles.header__navLink}>File</a>
          <a href="#" className={styles.header__navLink}>Edit</a>
          <a href="#" className={styles.header__navLink}>View</a>
          <a href="#" className={styles.header__navLink}>Tools</a>
          <a href="#" className={styles.header__navLink}>Help</a>
        </nav>

        <div className={styles.header__actions}>
          <button 
            className={styles.header__actionBtn}
            aria-label="Notifications"
          >
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
            </svg>
          </button>
          <button 
            className={styles.header__actionBtn}
            onClick={onSettingsClick}
            aria-label="Settings"
          >
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
            </svg>
          </button>
          <div className={styles.header__user}>
            <span className={styles.header__userAvatar}>U</span>
          </div>
        </div>
      </div>
    </header>
  )
}