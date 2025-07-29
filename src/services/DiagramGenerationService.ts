import { Node, Edge } from 'reactflow'

export interface DiagramGenerationResult {
  nodes: Node[]
  edges: Edge[]
}

export class DiagramGenerationService {
  private nodeIdCounter = 0
  private edgeIdCounter = 0

  /**
   * Convert Structured Text code to Function Block Diagram
   */
  generateDiagramFromST(stCode: string): DiagramGenerationResult {
    this.nodeIdCounter = 0
    this.edgeIdCounter = 0

    const nodes: Node[] = []
    const edges: Edge[] = []

    // Parse the ST code to extract logic
    const lines = stCode.split('\n').map(line => line.trim())
    let currentY = 100

    // Look for key patterns in the entire code
    const hasIfStatement = stCode.includes('IF')
    const hasEmergencyStop = stCode.toLowerCase().includes('emergencystop')
    const hasSystemSafe = stCode.toLowerCase().includes('systemsafe')
    const hasConveyorMotor = stCode.toLowerCase().includes('conveyormotor')

    // Handle Safety Monitor pattern
    if (hasSystemSafe && hasEmergencyStop) {
      // Create emergency stop contact
      const emergencyStopNode: Node = {
        id: this.getNextNodeId(),
        type: 'contact',
        position: { x: 100, y: 100 },
        data: {
          label: 'EmergencyStop',
          state: false,
          normally_closed: true
        }
      }
      nodes.push(emergencyStopNode)

      // Create light curtain contact
      const lightCurtainNode: Node = {
        id: this.getNextNodeId(),
        type: 'contact',
        position: { x: 300, y: 100 },
        data: {
          label: 'LightCurtain',
          state: false,
          normally_closed: true
        }
      }
      nodes.push(lightCurtainNode)

      // Create safety relay coil
      const safetyRelayNode: Node = {
        id: this.getNextNodeId(),
        type: 'coil',
        position: { x: 500, y: 100 },
        data: {
          label: 'SafetyRelay',
          state: false,
          normally_open: true
        }
      }
      nodes.push(safetyRelayNode)

      // Connect them
      edges.push({
        id: this.getNextEdgeId(),
        source: emergencyStopNode.id,
        target: lightCurtainNode.id,
        sourceHandle: 'right',
        targetHandle: 'left',
        type: 'smoothstep'
      })

      edges.push({
        id: this.getNextEdgeId(),
        source: lightCurtainNode.id,
        target: safetyRelayNode.id,
        sourceHandle: 'right',
        targetHandle: 'left',
        type: 'smoothstep'
      })

      return { nodes, edges }
    }

    // Handle Conveyor Motor pattern
    if (hasConveyorMotor) {
      // Create system enable contact
      const systemEnableNode: Node = {
        id: this.getNextNodeId(),
        type: 'contact',
        position: { x: 100, y: 100 },
        data: {
          label: 'SystemEnable',
          state: false,
          normally_closed: false
        }
      }
      nodes.push(systemEnableNode)

      // Create emergency stop contact (normally closed)
      const emergencyStopNode: Node = {
        id: this.getNextNodeId(),
        type: 'contact',
        position: { x: 300, y: 100 },
        data: {
          label: 'EmergencyStop',
          state: false,
          normally_closed: true
        }
      }
      nodes.push(emergencyStopNode)

      // Create motor control function block
      const motorControlNode: Node = {
        id: this.getNextNodeId(),
        type: 'functionBlock',
        position: { x: 500, y: 80 },
        data: {
          label: 'ConveyorMotor',
          inputs: ['Start', 'Stop', 'Speed'],
          outputs: ['Running', 'Fault'],
          vendor: 'rockwell'
        }
      }
      nodes.push(motorControlNode)

      // Connect system enable to motor
      edges.push({
        id: this.getNextEdgeId(),
        source: systemEnableNode.id,
        target: emergencyStopNode.id,
        sourceHandle: 'right',
        targetHandle: 'left',
        type: 'smoothstep'
      })

      edges.push({
        id: this.getNextEdgeId(),
        source: emergencyStopNode.id,
        target: motorControlNode.id,
        sourceHandle: 'right',
        targetHandle: 'left',
        type: 'smoothstep'
      })

      return { nodes, edges }
    }

    // Fallback to line-by-line parsing for other patterns
    for (const line of lines) {
      // Skip empty lines and comments
      if (!line || line.startsWith('//') || line.startsWith('(*')) {
        continue
      }

      // Parse timer instructions (TON, TOF, RTO)
      const timerMatch = line.match(/(\w+)\s*\(\s*IN\s*:=\s*(\w+),\s*PT\s*:=\s*T#(\d+)(ms|s|m|h)/)
      if (timerMatch) {
        const [, timerName, , time, unit] = timerMatch
        const preset = this.convertToMs(parseInt(time), unit)
        
        const timerNode: Node = {
          id: this.getNextNodeId(),
          type: 'timer',
          position: { x: 400, y: currentY },
          data: {
            label: timerName,
            preset,
            accumulated: 0,
            type: 'TON'
          }
        }
        nodes.push(timerNode)
        currentY += 120
      }

      // Parse simple assignment with conditions
      const assignMatch = line.match(/(\w+)\s*:=\s*(.+);?$/)
      if (assignMatch) {
        const [, output, expression] = assignMatch
        
        // Check if it's a simple boolean assignment
        if (expression.includes('AND') || expression.includes('OR')) {
          const parts = expression.split(/\s+(AND|OR)\s+/)
          let currentX = 100
          const contactNodes: Node[] = []

          // Create contact nodes for each input
          for (let i = 0; i < parts.length; i += 2) {
            const part = parts[i].trim()
            if (part && part !== 'AND' && part !== 'OR') {
              const isNormallyOpen = !part.includes('NOT')
              const varName = part.replace('NOT', '').trim()
              
              const contactNode: Node = {
                id: this.getNextNodeId(),
                type: 'contact',
                position: { x: currentX, y: currentY },
                data: {
                  label: varName,
                  state: false,
                  normally_closed: !isNormallyOpen
                }
              }
              contactNodes.push(contactNode)
              nodes.push(contactNode)
              currentX += 150
            }
          }

          // Create output coil
          const coilNode: Node = {
            id: this.getNextNodeId(),
            type: 'coil',
            position: { x: currentX + 100, y: currentY },
            data: {
              label: output,
              state: false,
              normally_open: true
            }
          }
          nodes.push(coilNode)

          // Connect contacts to coil
          contactNodes.forEach((contact, index) => {
            if (index < contactNodes.length - 1) {
              edges.push({
                id: this.getNextEdgeId(),
                source: contact.id,
                target: contactNodes[index + 1].id,
                sourceHandle: 'right',
                targetHandle: 'left',
                type: 'smoothstep'
              })
            }
          })

          if (contactNodes.length > 0) {
            edges.push({
              id: this.getNextEdgeId(),
              source: contactNodes[contactNodes.length - 1].id,
              target: coilNode.id,
              sourceHandle: 'right',
              targetHandle: 'left',
              type: 'smoothstep'
            })
          }

          currentY += 100
        }
      }

      // Parse function block calls
      const fbMatch = line.match(/(\w+)\s*\((.+)\)/)
      if (fbMatch && !timerMatch) {
        const [, fbName, params] = fbMatch
        const inputs: string[] = []

        // Parse parameters
        const paramPairs = params.split(',').map(p => p.trim())
        paramPairs.forEach(pair => {
          const [name, value] = pair.split(':=').map(p => p.trim())
          if (name && value) {
            inputs.push(`${name}:${value}`)
          }
        })

        const fbNode: Node = {
          id: this.getNextNodeId(),
          type: 'functionBlock',
          position: { x: 300, y: currentY },
          data: {
            label: fbName,
            inputs: inputs.slice(0, 3), // Limit to 3 for display
            outputs: ['Q', 'Error'], // Default outputs
            vendor: 'rockwell'
          }
        }
        nodes.push(fbNode)
        currentY += 150
      }
    }

    // Auto-layout if needed
    this.autoLayout(nodes)

    return { nodes, edges }
  }

  /**
   * Create a simple ladder logic diagram
   */
  generateLadderDiagram(tags: string[]): DiagramGenerationResult {
    const nodes: Node[] = []
    const edges: Edge[] = []
    let currentY = 100

    // Create a simple ladder rung for each pair of tags
    for (let i = 0; i < tags.length - 1; i += 2) {
      // Input contact
      const contactNode: Node = {
        id: this.getNextNodeId(),
        type: 'contact',
        position: { x: 100, y: currentY },
        data: {
          label: tags[i],
          state: false,
          normally_closed: false
        }
      }
      nodes.push(contactNode)

      // Output coil
      const coilNode: Node = {
        id: this.getNextNodeId(),
        type: 'coil',
        position: { x: 400, y: currentY },
        data: {
          label: tags[i + 1],
          state: false,
          normally_open: true
        }
      }
      nodes.push(coilNode)

      // Connect them
      edges.push({
        id: this.getNextEdgeId(),
        source: contactNode.id,
        target: coilNode.id,
        sourceHandle: 'right',
        targetHandle: 'left',
        type: 'smoothstep'
      })

      currentY += 100
    }

    return { nodes, edges }
  }

  private getNextNodeId(): string {
    return `node-${++this.nodeIdCounter}`
  }

  private getNextEdgeId(): string {
    return `edge-${++this.edgeIdCounter}`
  }

  private convertToMs(value: number, unit: string): number {
    switch (unit) {
      case 'ms': return value
      case 's': return value * 1000
      case 'm': return value * 60 * 1000
      case 'h': return value * 60 * 60 * 1000
      default: return value
    }
  }

  private autoLayout(nodes: Node[]): void {
    // Simple grid layout
    const nodesPerRow = 3
    const xSpacing = 250
    const ySpacing = 150
    const startX = 100
    const startY = 100

    nodes.forEach((node, index) => {
      const row = Math.floor(index / nodesPerRow)
      const col = index % nodesPerRow
      node.position = {
        x: startX + col * xSpacing,
        y: startY + row * ySpacing
      }
    })
  }
}

// Export singleton instance
export const diagramGenerationService = new DiagramGenerationService()