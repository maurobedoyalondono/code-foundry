import React from 'react'
import styles from './Icon.module.scss'

interface IconProps {
  name: string
  size?: 'sm' | 'md' | 'lg'
  className?: string
}

const iconMap: Record<string, string> = {
  // File types
  'file': '📄',
  'file-st': '📝',
  'file-udt': '📊',
  'file-md': '📃',
  
  // Folders
  'folder': '📁',
  'folder-open': '📂',
  'folder-programs': '📄',
  'folder-routines': '⚙️',
  'folder-data-types': '🔷',
  'folder-tags': '🏷️',
  'folder-specs': '📋',
  
  // Vendors
  'vendor-rockwell': '🔴',
  'vendor-siemens': '🔵',
  'vendor-generic': '⚪',
  
  // Status
  'status-running': '🟢',
  'status-stopped': '🔴',
  'status-warning': '🟡',
  'status-error': '❌',
  
  // Actions
  'add': '➕',
  'delete': '🗑️',
  'edit': '✏️',
  'save': '💾',
  'refresh': '🔄',
  'search': '🔍',
  'settings': '⚙️',
  
  // Industrial
  'motor': '🔧',
  'valve': '🚰',
  'sensor': '📡',
  'plc': '🖥️',
  'hmi': '📱',
  'safety': '🛡️',
}

export const Icon: React.FC<IconProps> = ({ name, size = 'md', className }) => {
  const icon = iconMap[name] || '❓'
  
  return (
    <span 
      className={`${styles.icon} ${styles[`icon--${size}`]} ${className || ''}`}
      role="img"
      aria-label={name}
    >
      {icon}
    </span>
  )
}