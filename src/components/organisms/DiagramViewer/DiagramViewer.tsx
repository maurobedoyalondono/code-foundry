'use client'

import React, { useCallback } from 'react'
import ReactFlow, {
  Node,
  Edge,
  addEdge,
  ConnectionLineType,
  useNodesState,
  useEdgesState,
  Controls,
  MiniMap,
  Background,
  Connection,
  ReactFlowProvider,
} from 'reactflow'
import 'reactflow/dist/style.css'
import styles from './DiagramViewer.module.scss'
import { FunctionBlockNode } from '@/components/atoms/NodeTypes/FunctionBlockNode'
import { CoilNode } from '@/components/atoms/NodeTypes/CoilNode'
import { ContactNode } from '@/components/atoms/NodeTypes/ContactNode'
import { TimerNode } from '@/components/atoms/NodeTypes/TimerNode'

interface DiagramViewerProps {
  diagram?: {
    nodes: Node[]
    edges: Edge[]
  }
  className?: string
  onNodeClick?: (node: Node) => void
  readOnly?: boolean
}

// Define nodeTypes outside the component to prevent recreation
const nodeTypes = {
  functionBlock: FunctionBlockNode,
  coil: CoilNode,
  contact: ContactNode,
  timer: TimerNode,
}

export const DiagramViewer: React.FC<DiagramViewerProps> = ({
  diagram,
  className = '',
  onNodeClick,
  readOnly = false,
}) => {
  const [nodes, setNodes, onNodesChange] = useNodesState(diagram?.nodes || [])
  const [edges, setEdges, onEdgesChange] = useEdgesState(diagram?.edges || [])

  // Update nodes and edges when diagram prop changes
  React.useEffect(() => {
    if (diagram) {
      setNodes(diagram.nodes)
      setEdges(diagram.edges)
    }
  }, [diagram, setNodes, setEdges])

  const onConnect = useCallback(
    (params: Connection) => {
      if (!readOnly) {
        setEdges((eds) => addEdge({ ...params, type: 'smoothstep' }, eds))
      }
    },
    [readOnly, setEdges]
  )

  const onNodeClickHandler = useCallback(
    (_event: React.MouseEvent, node: Node) => {
      if (onNodeClick) {
        onNodeClick(node)
      }
    },
    [onNodeClick]
  )

  const defaultViewport = { x: 0, y: 0, zoom: 1 }

  return (
    <div className={`${styles.diagramViewer} ${className}`}>
      <ReactFlowProvider>
        <ReactFlow
          nodes={nodes}
          edges={edges}
          onNodesChange={readOnly ? undefined : onNodesChange}
          onEdgesChange={readOnly ? undefined : onEdgesChange}
          onConnect={onConnect}
          onNodeClick={onNodeClickHandler}
          nodeTypes={nodeTypes}
          connectionLineType={ConnectionLineType.SmoothStep}
          defaultViewport={defaultViewport}
          fitView
        >
          <Background color="#e2e8f0" gap={16} />
          <Controls />
          <MiniMap
            nodeColor={(node) => {
              switch (node.type) {
                case 'functionBlock':
                  return '#2563eb'
                case 'timer':
                  return '#f59e0b'
                case 'coil':
                  return '#10b981'
                case 'contact':
                  return '#6366f1'
                default:
                  return '#6b7280'
              }
            }}
          />
        </ReactFlow>
      </ReactFlowProvider>
    </div>
  )
}

// Export a default demo diagram for testing
export const createDemoDiagram = (): { nodes: Node[]; edges: Edge[] } => {
  const nodes: Node[] = [
    {
      id: '1',
      type: 'contact',
      position: { x: 100, y: 100 },
      data: { label: 'Start_PB', state: true },
    },
    {
      id: '2',
      type: 'contact',
      position: { x: 100, y: 200 },
      data: { label: 'Stop_PB', state: false, normally_closed: true },
    },
    {
      id: '3',
      type: 'functionBlock',
      position: { x: 300, y: 150 },
      data: {
        label: 'Motor_Control',
        inputs: ['Start', 'Stop', 'Speed_SP'],
        outputs: ['Running', 'Fault'],
      },
    },
    {
      id: '4',
      type: 'timer',
      position: { x: 550, y: 150 },
      data: {
        label: 'Startup_Timer',
        preset: 5000,
        accumulated: 0,
      },
    },
    {
      id: '5',
      type: 'coil',
      position: { x: 750, y: 150 },
      data: { label: 'Motor_Running', state: false },
    },
  ]

  const edges: Edge[] = [
    {
      id: 'e1-3',
      source: '1',
      target: '3',
      sourceHandle: 'right',
      targetHandle: 'input-0',
      type: 'smoothstep',
    },
    {
      id: 'e2-3',
      source: '2',
      target: '3',
      sourceHandle: 'right',
      targetHandle: 'input-1',
      type: 'smoothstep',
    },
    {
      id: 'e3-4',
      source: '3',
      target: '4',
      sourceHandle: 'output-0',
      targetHandle: 'left',
      type: 'smoothstep',
    },
    {
      id: 'e4-5',
      source: '4',
      target: '5',
      sourceHandle: 'done',
      targetHandle: 'left',
      type: 'smoothstep',
    },
  ]

  return { nodes, edges }
}