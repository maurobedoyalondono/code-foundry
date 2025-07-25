export interface ValidationError {
  line: number
  column: number
  message: string
  severity: 'error' | 'warning' | 'info'
}

export class STValidationService {
  private keywords = new Set([
    'PROGRAM', 'END_PROGRAM', 'FUNCTION', 'END_FUNCTION', 'FUNCTION_BLOCK', 'END_FUNCTION_BLOCK',
    'VAR', 'VAR_INPUT', 'VAR_OUTPUT', 'VAR_IN_OUT', 'VAR_GLOBAL', 'END_VAR',
    'IF', 'THEN', 'ELSIF', 'ELSE', 'END_IF', 'CASE', 'OF', 'END_CASE',
    'FOR', 'TO', 'BY', 'DO', 'END_FOR', 'WHILE', 'END_WHILE', 'REPEAT', 'UNTIL', 'END_REPEAT',
    'RETURN', 'EXIT', 'CONTINUE', 'TRUE', 'FALSE', 'NULL',
    'BOOL', 'BYTE', 'WORD', 'DWORD', 'LWORD', 'SINT', 'INT', 'DINT', 'LINT',
    'USINT', 'UINT', 'UDINT', 'ULINT', 'REAL', 'LREAL', 'TIME', 'DATE', 'STRING',
    'ARRAY', 'STRUCT', 'END_STRUCT', 'TYPE', 'END_TYPE',
    'AT', 'RETAIN', 'CONSTANT', 'PERSISTENT',
  ])

  private operators = new Set([
    ':=', '=', '<>', '<', '>', '<=', '>=',
    '+', '-', '*', '/', 'MOD', '**',
    'AND', 'OR', 'XOR', 'NOT',
  ])

  validate(code: string): ValidationError[] {
    const errors: ValidationError[] = []
    const lines = code.split('\n')
    
    // Track block nesting
    const blockStack: { type: string; line: number }[] = []
    
    lines.forEach((line, lineIndex) => {
      const trimmedLine = line.trim()
      
      // Skip empty lines and comments
      if (!trimmedLine || trimmedLine.startsWith('//') || trimmedLine.startsWith('(*')) {
        return
      }
      
      // Check for block start/end matching
      this.checkBlockMatching(trimmedLine, lineIndex + 1, blockStack, errors)
      
      // Check for missing semicolons
      this.checkSemicolons(trimmedLine, lineIndex + 1, errors)
      
      // Check for variable declarations
      this.checkVariableDeclarations(trimmedLine, lineIndex + 1, errors)
      
      // Check for assignment statements
      this.checkAssignments(trimmedLine, lineIndex + 1, errors)
      
      // Check for function calls
      this.checkFunctionCalls(trimmedLine, lineIndex + 1, errors)
    })
    
    // Check for unclosed blocks
    blockStack.forEach(block => {
      errors.push({
        line: block.line,
        column: 0,
        message: `Unclosed ${block.type} block`,
        severity: 'error'
      })
    })
    
    return errors
  }

  private checkBlockMatching(
    line: string, 
    lineNumber: number, 
    blockStack: { type: string; line: number }[], 
    errors: ValidationError[]
  ): void {
    // Check for block starts
    if (line.match(/^(PROGRAM|FUNCTION|FUNCTION_BLOCK)\s+\w+/)) {
      const blockType = line.split(/\s+/)[0]
      blockStack.push({ type: blockType, line: lineNumber })
    } else if (line.match(/^(IF|CASE|FOR|WHILE|REPEAT)\b/)) {
      const blockType = line.split(/\s+/)[0]
      blockStack.push({ type: blockType, line: lineNumber })
    } else if (line.startsWith('VAR')) {
      blockStack.push({ type: 'VAR', line: lineNumber })
    }
    
    // Check for block ends
    if (line.match(/^END_(PROGRAM|FUNCTION|FUNCTION_BLOCK|VAR|IF|CASE|FOR|WHILE|REPEAT)/)) {
      const endType = line.replace('END_', '').split(/\s+/)[0]
      
      if (blockStack.length === 0) {
        errors.push({
          line: lineNumber,
          column: 0,
          message: `Unexpected ${line}`,
          severity: 'error'
        })
      } else {
        const lastBlock = blockStack[blockStack.length - 1]
        if (lastBlock.type !== endType) {
          errors.push({
            line: lineNumber,
            column: 0,
            message: `Expected END_${lastBlock.type} but found END_${endType}`,
            severity: 'error'
          })
        } else {
          blockStack.pop()
        }
      }
    }
  }

  private checkSemicolons(line: string, lineNumber: number, errors: ValidationError[]): void {
    // Skip block declarations and control structures
    if (
      line.match(/^(PROGRAM|FUNCTION|FUNCTION_BLOCK|VAR|IF|CASE|FOR|WHILE|REPEAT|END_)/i) ||
      line.match(/^(THEN|ELSE|ELSIF|DO|TO|BY|OF|UNTIL)\b/i)
    ) {
      return
    }
    
    // Check if line should end with semicolon
    if (
      line.match(/:=/) || // Assignment
      line.match(/^\w+\s*\(/) || // Function call
      line.match(/^(RETURN|EXIT|CONTINUE)\b/i) // Control statements
    ) {
      if (!line.endsWith(';')) {
        errors.push({
          line: lineNumber,
          column: line.length,
          message: 'Missing semicolon',
          severity: 'warning'
        })
      }
    }
  }

  private checkVariableDeclarations(line: string, lineNumber: number, errors: ValidationError[]): void {
    // Check for variable declaration pattern
    const varDeclMatch = line.match(/^\s*(\w+)\s*:\s*(\w+)/)
    if (varDeclMatch) {
      const [, varName, varType] = varDeclMatch
      
      // Check if variable name starts with number
      if (/^\d/.test(varName)) {
        errors.push({
          line: lineNumber,
          column: line.indexOf(varName),
          message: 'Variable name cannot start with a number',
          severity: 'error'
        })
      }
      
      // Check if type is valid
      const validTypes = [
        'BOOL', 'BYTE', 'WORD', 'DWORD', 'LWORD',
        'SINT', 'INT', 'DINT', 'LINT',
        'USINT', 'UINT', 'UDINT', 'ULINT',
        'REAL', 'LREAL', 'TIME', 'DATE', 'STRING'
      ]
      
      if (!validTypes.includes(varType.toUpperCase()) && !varType.match(/^(ARRAY|STRUCT)/)) {
        errors.push({
          line: lineNumber,
          column: line.indexOf(varType),
          message: `Unknown type: ${varType}`,
          severity: 'warning'
        })
      }
    }
  }

  private checkAssignments(line: string, lineNumber: number, errors: ValidationError[]): void {
    // Check for assignment operator
    if (line.includes(':=')) {
      const parts = line.split(':=')
      
      if (parts.length !== 2) {
        errors.push({
          line: lineNumber,
          column: line.indexOf(':='),
          message: 'Invalid assignment syntax',
          severity: 'error'
        })
        return
      }
      
      const leftSide = parts[0].trim()
      const rightSide = parts[1].trim().replace(/;$/, '')
      
      // Check left side is a valid identifier
      // eslint-disable-next-line no-useless-escape
      if (!leftSide.match(/^[\w\[\]\.]+$/)) {
        errors.push({
          line: lineNumber,
          column: 0,
          message: 'Invalid left-hand side of assignment',
          severity: 'error'
        })
      }
      
      // Basic check for balanced parentheses
      const openParens = (rightSide.match(/\(/g) || []).length
      const closeParens = (rightSide.match(/\)/g) || []).length
      
      if (openParens !== closeParens) {
        errors.push({
          line: lineNumber,
          column: line.indexOf(':=') + 2,
          message: 'Unbalanced parentheses',
          severity: 'error'
        })
      }
    }
  }

  private checkFunctionCalls(line: string, lineNumber: number, errors: ValidationError[]): void {
    // Check for function call pattern
    const funcCallMatch = line.match(/^(\w+)\s*\(/)
    if (funcCallMatch && !this.keywords.has(funcCallMatch[1].toUpperCase())) {
      // Check for balanced parentheses
      const openParens = (line.match(/\(/g) || []).length
      const closeParens = (line.match(/\)/g) || []).length
      
      if (openParens !== closeParens) {
        errors.push({
          line: lineNumber,
          column: line.indexOf('('),
          message: 'Unbalanced parentheses in function call',
          severity: 'error'
        })
      }
      
      // Check parameter syntax
      const paramsMatch = line.match(/\(([^)]*)\)/)
      if (paramsMatch && paramsMatch[1]) {
        const params = paramsMatch[1].split(',')
        params.forEach((param, index) => {
          const trimmedParam = param.trim()
          if (trimmedParam && !trimmedParam.match(/^\w+\s*:=\s*.+$/)) {
            errors.push({
              line: lineNumber,
              column: line.indexOf(param),
              message: `Parameter ${index + 1} should use named parameter syntax (name := value)`,
              severity: 'info'
            })
          }
        })
      }
    }
  }
}

// Export singleton instance
export const stValidationService = new STValidationService()