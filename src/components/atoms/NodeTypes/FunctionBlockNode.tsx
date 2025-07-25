'use client'

/* eslint-disable react/prop-types */
import React, { memo } from 'react'
import { Handle, Position, NodeProps } from 'reactflow'
import styles from './NodeTypes.module.scss'

export interface FunctionBlockNodeData {
  label: string
  inputs?: string[]
  outputs?: string[]
  vendor?: 'rockwell' | 'siemens'
}

export const FunctionBlockNode = memo<NodeProps<FunctionBlockNodeData>>(({ data, selected }) => {
  const vendorIcon = data.vendor === 'rockwell' ? '🔴' : data.vendor === 'siemens' ? '🔵' : '📦'

  return (
    <div className={`${styles.functionBlock} ${selected ? styles['functionBlock--selected'] : ''}`}>
      <div className={styles.functionBlock__header}>
        <span className={styles.functionBlock__icon}>{vendorIcon}</span>
        <span className={styles.functionBlock__label}>{data.label}</span>
      </div>
      
      <div className={styles.functionBlock__body}>
        <div className={styles.functionBlock__inputs}>
          {data.inputs?.map((input, index) => (
            <div key={input} className={styles.functionBlock__port}>
              <Handle
                type="target"
                position={Position.Left}
                id={`input-${index}`}
                style={{ top: `${(index + 1) * (100 / (data.inputs!.length + 1))}%` }}
                className={styles.functionBlock__handle}
              />
              <span>{input}</span>
            </div>
          ))}
        </div>
        
        <div className={styles.functionBlock__outputs}>
          {data.outputs?.map((output, index) => (
            <div key={output} className={styles.functionBlock__port}>
              <span>{output}</span>
              <Handle
                type="source"
                position={Position.Right}
                id={`output-${index}`}
                style={{ top: `${(index + 1) * (100 / (data.outputs!.length + 1))}%` }}
                className={styles.functionBlock__handle}
              />
            </div>
          ))}
        </div>
      </div>
    </div>
  )
})

FunctionBlockNode.displayName = 'FunctionBlockNode'