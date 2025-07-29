import { Node, Edge } from 'reactflow'
import { stParser, STBlock, STStatement, STExpression } from './STParser'

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
    // Parse the ST code
    const parsedBlock = stParser.parse(stCode)
    if (!parsedBlock) {
      return { nodes: [], edges: [] }
    }

    return this.generateDiagramFromParsedBlock(parsedBlock)
  }

  private generateDiagramFromParsedBlock(block: STBlock): DiagramGenerationResult {
    this.nodeIdCounter = 0
    this.edgeIdCounter = 0

    const nodes: Node[] = []
    const edges: Edge[] = []

    // Create a function block node for the main block
    if (block.type === 'function' || block.type === 'function_block') {
      const mainBlockNode: Node = {
        id: this.getNextNodeId(),
        type: 'functionBlock',
        position: { x: 400, y: 50 },
        data: {
          label: block.name,
          inputs: block.variables.filter(v => v.kind === 'input').map(v => v.name),
          outputs: block.variables.filter(v => v.kind === 'output').map(v => v.name).concat(block.returnType ? [block.name] : []),
          vendor: 'generic'
        }
      }
      nodes.push(mainBlockNode)
    }

    // Create nodes for input variables
    let inputY = 100
    const inputNodes: Map<string, Node> = new Map()
    block.variables.filter(v => v.kind === 'input').forEach(variable => {
      const node: Node = {
        id: this.getNextNodeId(),
        type: 'contact',
        position: { x: 100, y: inputY },
        data: {
          label: variable.name,
          state: false,
          normally_closed: false
        }
      }
      nodes.push(node)
      inputNodes.set(variable.name, node)
      inputY += 80
    })

    // Analyze statements to create logic nodes
    let logicY = 100
    const logicNodes: Map<string, Node> = new Map()
    
    for (const statement of block.statements) {
      const statementNodes = this.generateNodesFromStatement(statement, logicY, inputNodes, logicNodes)
      nodes.push(...statementNodes.nodes)
      edges.push(...statementNodes.edges)
      logicY += 120
    }

    // Create output nodes
    let outputY = 100
    block.variables.filter(v => v.kind === 'output' || v.kind === 'local').forEach(variable => {
      // Find if this variable is assigned in the statements
      const isAssigned = block.statements.some(stmt => 
        stmt.type === 'assignment' && stmt.target === variable.name
      )
      
      if (isAssigned) {
        const node: Node = {
          id: this.getNextNodeId(),
          type: 'coil',
          position: { x: 600, y: outputY },
          data: {
            label: variable.name,
            state: false,
            normally_open: true
          }
        }
        nodes.push(node)
        logicNodes.set(variable.name, node)
        outputY += 80
      }
    })

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

  private generateNodesFromStatement(
    statement: STStatement, 
    yPosition: number,
    inputNodes: Map<string, Node>,
    logicNodes: Map<string, Node>
  ): { nodes: Node[], edges: Edge[] } {
    const nodes: Node[] = []
    const edges: Edge[] = []

    if (statement.type === 'if') {
      // Handle IF-THEN-ELSE statements
      const conditionNodes = this.generateNodesFromExpression(
        statement.condition!,
        100,
        yPosition,
        inputNodes,
        logicNodes
      )
      nodes.push(...conditionNodes.nodes)
      edges.push(...conditionNodes.edges)

      // Process THEN branch
      if (statement.thenBranch && statement.thenBranch.length > 0) {
        let thenY = yPosition
        for (const thenStmt of statement.thenBranch) {
          const thenNodes = this.generateNodesFromStatement(
            thenStmt,
            thenY,
            inputNodes,
            logicNodes
          )
          nodes.push(...thenNodes.nodes)
          edges.push(...thenNodes.edges)
          thenY += 80
        }
      }
    } else if (statement.type === 'assignment') {
      // Handle assignments
      const exprNodes = this.generateNodesFromExpression(
        statement.expression!,
        100,
        yPosition,
        inputNodes,
        logicNodes
      )
      nodes.push(...exprNodes.nodes)
      edges.push(...exprNodes.edges)

      // Connect to output if it exists
      const outputNode = logicNodes.get(statement.target!)
      if (outputNode && exprNodes.nodes.length > 0) {
        const lastNode = exprNodes.nodes[exprNodes.nodes.length - 1]
        edges.push({
          id: this.getNextEdgeId(),
          source: lastNode.id,
          target: outputNode.id,
          sourceHandle: 'right',
          targetHandle: 'left',
          type: 'smoothstep'
        })
      }
    }

    return { nodes, edges }
  }

  private generateNodesFromExpression(
    expression: STExpression,
    xPosition: number,
    yPosition: number,
    inputNodes: Map<string, Node>,
    logicNodes: Map<string, Node>
  ): { nodes: Node[], edges: Edge[] } {
    const nodes: Node[] = []
    const edges: Edge[] = []

    if (expression.type === 'binary' && (expression.operator === 'AND' || expression.operator === 'OR')) {
      // Handle AND/OR expressions
      const leftNodes = this.generateNodesFromExpression(
        expression.left!,
        xPosition,
        yPosition,
        inputNodes,
        logicNodes
      )
      
      const rightNodes = this.generateNodesFromExpression(
        expression.right!,
        xPosition + 150,
        yPosition,
        inputNodes,
        logicNodes
      )

      nodes.push(...leftNodes.nodes, ...rightNodes.nodes)
      edges.push(...leftNodes.edges, ...rightNodes.edges)

      // Connect nodes based on operator
      if (leftNodes.nodes.length > 0 && rightNodes.nodes.length > 0) {
        const leftLast = leftNodes.nodes[leftNodes.nodes.length - 1]
        const rightFirst = rightNodes.nodes[0]
        
        if (expression.operator === 'AND') {
          // Series connection for AND
          edges.push({
            id: this.getNextEdgeId(),
            source: leftLast.id,
            target: rightFirst.id,
            sourceHandle: 'right',
            targetHandle: 'left',
            type: 'smoothstep'
          })
        }
        // For OR, we'd need parallel connections (more complex)
      }
    } else if (expression.type === 'unary' && expression.operator === 'NOT') {
      // Handle NOT expressions
      const innerNodes = this.generateNodesFromExpression(
        expression.right!,
        xPosition,
        yPosition,
        inputNodes,
        logicNodes
      )
      
      // Mark the first node as normally closed if it's a contact
      if (innerNodes.nodes.length > 0 && innerNodes.nodes[0].type === 'contact') {
        innerNodes.nodes[0].data.normally_closed = true
      }
      
      nodes.push(...innerNodes.nodes)
      edges.push(...innerNodes.edges)
    } else if (expression.type === 'variable') {
      // Check if it's an input variable
      const inputNode = inputNodes.get(expression.name!)
      if (inputNode) {
        // Create a reference contact for this input
        const contactNode: Node = {
          id: this.getNextNodeId(),
          type: 'contact',
          position: { x: xPosition, y: yPosition },
          data: {
            label: expression.name!,
            state: false,
            normally_closed: false
          }
        }
        nodes.push(contactNode)
      } else {
        // Check if it's a local variable
        const localNode = logicNodes.get(expression.name!)
        if (!localNode) {
          // Create a new contact for unrecognized variables
          const contactNode: Node = {
            id: this.getNextNodeId(),
            type: 'contact',
            position: { x: xPosition, y: yPosition },
            data: {
              label: expression.name!,
              state: false,
              normally_closed: false
            }
          }
          nodes.push(contactNode)
        }
      }
    } else if (expression.type === 'literal') {
      // Handle literal values (TRUE/FALSE)
      if (typeof expression.value === 'boolean') {
        const contactNode: Node = {
          id: this.getNextNodeId(),
          type: 'contact',
          position: { x: xPosition, y: yPosition },
          data: {
            label: expression.value ? 'TRUE' : 'FALSE',
            state: expression.value,
            normally_closed: false
          }
        }
        nodes.push(contactNode)
      }
    }

    return { nodes, edges }
  }
}

// Export singleton instance
export const diagramGenerationService = new DiagramGenerationService()