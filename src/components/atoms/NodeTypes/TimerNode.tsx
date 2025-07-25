'use client'

/* eslint-disable react/prop-types */
import React, { memo } from 'react'
import { Handle, Position, NodeProps } from 'reactflow'
import styles from './NodeTypes.module.scss'

export interface TimerNodeData {
  label: string
  preset: number
  accumulated: number
  type?: 'TON' | 'TOF' | 'RTO'
}

export const TimerNode = memo<NodeProps<TimerNodeData>>(({ data, selected }) => {
  const percentage = (data.accumulated / data.preset) * 100
  const timerType = data.type || 'TON'

  return (
    <div className={`${styles.timer} ${selected ? styles['timer--selected'] : ''}`}>
      <Handle
        type="target"
        position={Position.Left}
        className={styles.timer__handle}
      />
      
      <div className={styles.timer__header}>
        <span className={styles.timer__type}>{timerType}</span>
        <span className={styles.timer__label}>{data.label}</span>
      </div>
      
      <div className={styles.timer__values}>
        <div className={styles.timer__preset}>PT: {data.preset}ms</div>
        <div className={styles.timer__accumulated}>ET: {data.accumulated}ms</div>
      </div>
      
      <div className={styles.timer__progress}>
        <div 
          className={styles.timer__progressBar} 
          style={{ width: `${Math.min(percentage, 100)}%` }}
        />
      </div>
      
      <Handle
        type="source"
        position={Position.Right}
        id="done"
        style={{ top: '30%' }}
        className={styles.timer__handle}
      />
      <Handle
        type="source"
        position={Position.Right}
        id="timing"
        style={{ top: '70%' }}
        className={styles.timer__handle}
      />
    </div>
  )
})

TimerNode.displayName = 'TimerNode'