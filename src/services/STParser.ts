export interface STVariable {
  name: string
  type: string
  kind: 'input' | 'output' | 'local' | 'inout'
}

export interface STExpression {
  type: 'binary' | 'unary' | 'literal' | 'variable' | 'call'
  operator?: string
  left?: STExpression
  right?: STExpression
  value?: string | boolean | number
  name?: string
  arguments?: STExpression[]
}

export interface STStatement {
  type: 'assignment' | 'if' | 'for' | 'while' | 'call' | 'return'
  target?: string
  expression?: STExpression
  condition?: STExpression
  thenBranch?: STStatement[]
  elseBranch?: STStatement[]
  body?: STStatement[]
}

export interface STBlock {
  type: 'program' | 'function' | 'function_block'
  name: string
  returnType?: string
  variables: STVariable[]
  statements: STStatement[]
}

export class STParser {
  private pos = 0
  private input = ''
  private lines: string[] = []
  private currentLine = 0

  parse(code: string): STBlock | null {
    this.input = code
    this.lines = code.split('\n')
    this.pos = 0
    this.currentLine = 0

    // Remove comments and trim lines
    this.lines = this.lines.map(line => {
      // Remove line comments
      const commentIndex = line.indexOf('//')
      if (commentIndex >= 0) {
        line = line.substring(0, commentIndex)
      }
      return line.trim()
    })

    // Find the main block type
    const blockType = this.findBlockType()
    if (!blockType) return null

    return this.parseBlock(blockType)
  }

  private findBlockType(): 'program' | 'function' | 'function_block' | null {
    for (const line of this.lines) {
      if (line.startsWith('PROGRAM')) return 'program'
      if (line.startsWith('FUNCTION_BLOCK')) return 'function_block'
      if (line.startsWith('FUNCTION')) return 'function'
    }
    return null
  }

  private parseBlock(type: 'program' | 'function' | 'function_block'): STBlock | null {
    const block: STBlock = {
      type,
      name: '',
      variables: [],
      statements: []
    }

    let inVarSection = false
    let varKind: 'input' | 'output' | 'local' | 'inout' = 'local'

    for (let i = 0; i < this.lines.length; i++) {
      const line = this.lines[i]
      if (!line) continue

      // Parse block declaration
      if (line.startsWith(type.toUpperCase())) {
        const match = line.match(new RegExp(`${type.toUpperCase()}\\s+(\\w+)(?:\\s*:\\s*(\\w+))?`))
        if (match) {
          block.name = match[1]
          if (match[2]) {
            block.returnType = match[2]
          }
        }
        continue
      }

      // Parse variable sections
      if (line === 'VAR') {
        inVarSection = true
        varKind = 'local'
        continue
      } else if (line === 'VAR_INPUT') {
        inVarSection = true
        varKind = 'input'
        continue
      } else if (line === 'VAR_OUTPUT') {
        inVarSection = true
        varKind = 'output'
        continue
      } else if (line === 'VAR_IN_OUT') {
        inVarSection = true
        varKind = 'inout'
        continue
      } else if (line === 'END_VAR') {
        inVarSection = false
        continue
      }

      // Parse variables
      if (inVarSection) {
        const varMatch = line.match(/^(\w+)\s*:\s*(\w+)(?:\s*:=\s*(.+))?;?$/)
        if (varMatch) {
          block.variables.push({
            name: varMatch[1],
            type: varMatch[2],
            kind: varKind
          })
        }
        continue
      }

      // Skip END_PROGRAM, END_FUNCTION, etc.
      if (line.startsWith('END_')) {
        break
      }

      // Parse statements
      const statement = this.parseStatement(line)
      if (statement) {
        // Handle multi-line IF statements
        if (statement.type === 'if' && line.endsWith('THEN')) {
          const ifBlock = this.parseIfBlock(i)
          if (ifBlock) {
            block.statements.push(ifBlock.statement)
            i = ifBlock.endLine
            continue
          }
        }
        block.statements.push(statement)
      }
    }

    return block
  }

  private parseIfBlock(startLine: number): { statement: STStatement, endLine: number } | null {
    const statement: STStatement = {
      type: 'if',
      condition: undefined,
      thenBranch: [],
      elseBranch: []
    }

    // Parse condition from the IF line
    const ifLine = this.lines[startLine]
    const condMatch = ifLine.match(/^IF\s+(.+)\s+THEN$/)
    if (condMatch) {
      statement.condition = this.parseExpression(condMatch[1])
    }

    let i = startLine + 1
    let inElse = false

    while (i < this.lines.length) {
      const line = this.lines[i]
      
      if (line === 'ELSE') {
        inElse = true
        i++
        continue
      }
      
      if (line === 'END_IF;' || line === 'END_IF') {
        return { statement, endLine: i }
      }

      const stmt = this.parseStatement(line)
      if (stmt) {
        if (inElse) {
          statement.elseBranch!.push(stmt)
        } else {
          statement.thenBranch!.push(stmt)
        }
      }
      i++
    }

    return null
  }

  private parseStatement(line: string): STStatement | null {
    // Remove trailing semicolon
    line = line.replace(/;$/, '').trim()
    if (!line) return null

    // Parse assignment
    const assignMatch = line.match(/^(\w+)\s*:=\s*(.+)$/)
    if (assignMatch) {
      return {
        type: 'assignment',
        target: assignMatch[1],
        expression: this.parseExpression(assignMatch[2])
      }
    }

    // Parse IF statement (single line)
    if (line.startsWith('IF')) {
      const condition = this.parseExpression(line.substring(2).trim())
      return {
        type: 'if',
        condition
      }
    }

    // Parse function/block calls
    const callMatch = line.match(/^(\w+)\s*\((.+)\)$/)
    if (callMatch) {
      return {
        type: 'call',
        target: callMatch[1],
        expression: {
          type: 'call',
          name: callMatch[1],
          arguments: this.parseArguments(callMatch[2])
        }
      }
    }

    // Parse return (for functions)
    const returnMatch = line.match(/^(\w+)\s*:=\s*(.+)$/)
    if (returnMatch) {
      return {
        type: 'assignment',
        target: returnMatch[1],
        expression: this.parseExpression(returnMatch[2])
      }
    }

    return null
  }

  private parseExpression(expr: string): STExpression {
    expr = expr.trim()

    // Parse boolean literals
    if (expr === 'TRUE' || expr === 'FALSE') {
      return {
        type: 'literal',
        value: expr === 'TRUE'
      }
    }

    // Parse numeric literals
    const numMatch = expr.match(/^-?\d+(\.\d+)?$/)
    if (numMatch) {
      return {
        type: 'literal',
        value: parseFloat(expr)
      }
    }

    // Parse NOT expression
    if (expr.startsWith('NOT ')) {
      return {
        type: 'unary',
        operator: 'NOT',
        right: this.parseExpression(expr.substring(4))
      }
    }

    // Parse binary expressions (AND, OR)
    for (const op of ['AND', 'OR']) {
      const parts = this.splitByOperator(expr, op)
      if (parts.length > 1) {
        let result = this.parseExpression(parts[0])
        for (let i = 1; i < parts.length; i++) {
          result = {
            type: 'binary',
            operator: op,
            left: result,
            right: this.parseExpression(parts[i])
          }
        }
        return result
      }
    }

    // Parse comparison operators
    for (const op of ['<>', '<=', '>=', '=', '<', '>']) {
      const index = expr.indexOf(op)
      if (index > 0) {
        return {
          type: 'binary',
          operator: op,
          left: this.parseExpression(expr.substring(0, index)),
          right: this.parseExpression(expr.substring(index + op.length))
        }
      }
    }

    // Parse function calls
    const callMatch = expr.match(/^(\w+)\s*\((.+)\)$/)
    if (callMatch) {
      return {
        type: 'call',
        name: callMatch[1],
        arguments: this.parseArguments(callMatch[2])
      }
    }

    // Default to variable
    return {
      type: 'variable',
      name: expr
    }
  }

  private splitByOperator(expr: string, operator: string): string[] {
    const parts: string[] = []
    let depth = 0
    let start = 0

    for (let i = 0; i < expr.length; i++) {
      if (expr[i] === '(') depth++
      else if (expr[i] === ')') depth--
      
      if (depth === 0) {
        const opIndex = expr.indexOf(operator, i)
        if (opIndex === i) {
          parts.push(expr.substring(start, i).trim())
          start = i + operator.length
          i = start - 1
        }
      }
    }
    
    if (start < expr.length) {
      parts.push(expr.substring(start).trim())
    }

    return parts.length > 1 ? parts : [expr]
  }

  private parseArguments(args: string): STExpression[] {
    const result: STExpression[] = []
    const parts = args.split(',')
    
    for (const part of parts) {
      const trimmed = part.trim()
      // Handle named parameters
      const namedMatch = trimmed.match(/^(\w+)\s*:=\s*(.+)$/)
      if (namedMatch) {
        result.push(this.parseExpression(namedMatch[2]))
      } else {
        result.push(this.parseExpression(trimmed))
      }
    }
    
    return result
  }
}

export const stParser = new STParser()