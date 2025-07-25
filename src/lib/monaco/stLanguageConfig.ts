// ST Language configuration for Monaco Editor
// This file contains only data, no imports to avoid SSR issues

export const stKeywords = [
  'PROGRAM', 'END_PROGRAM', 'FUNCTION', 'END_FUNCTION', 'FUNCTION_BLOCK', 'END_FUNCTION_BLOCK',
  'VAR', 'VAR_INPUT', 'VAR_OUTPUT', 'VAR_IN_OUT', 'VAR_GLOBAL', 'END_VAR',
  'IF', 'THEN', 'ELSIF', 'ELSE', 'END_IF', 'CASE', 'OF', 'END_CASE',
  'FOR', 'TO', 'BY', 'DO', 'END_FOR', 'WHILE', 'END_WHILE', 'REPEAT', 'UNTIL', 'END_REPEAT',
  'RETURN', 'EXIT', 'CONTINUE', 'TRUE', 'FALSE', 'NULL',
  'BOOL', 'BYTE', 'WORD', 'DWORD', 'LWORD', 'SINT', 'INT', 'DINT', 'LINT',
  'USINT', 'UINT', 'UDINT', 'ULINT', 'REAL', 'LREAL', 'TIME', 'DATE', 'STRING',
  'ARRAY', 'STRUCT', 'END_STRUCT', 'TYPE', 'END_TYPE',
  'AT', 'RETAIN', 'CONSTANT', 'PERSISTENT',
]

export const stOperators = [
  ':=', '=', '<>', '<', '>', '<=', '>=',
  '+', '-', '*', '/', 'MOD', '**',
  'AND', 'OR', 'XOR', 'NOT',
  '&', '|', '^', '~',
  '.', ',', ';', ':', '[', ']', '(', ')',
]

export const stSnippets = [
  {
    label: 'PROGRAM',
    insertText: 'PROGRAM ${1:ProgramName}\n\t$0\nEND_PROGRAM',
    documentation: 'Defines a program block'
  },
  {
    label: 'FUNCTION',
    insertText: 'FUNCTION ${1:FunctionName} : ${2:BOOL}\n\t$0\nEND_FUNCTION',
    documentation: 'Defines a function'
  },
  {
    label: 'FUNCTION_BLOCK',
    insertText: 'FUNCTION_BLOCK ${1:FBName}\n\t$0\nEND_FUNCTION_BLOCK',
    documentation: 'Defines a function block'
  },
  {
    label: 'VAR',
    insertText: 'VAR\n\t${1:variable} : ${2:BOOL};\n\t$0\nEND_VAR',
    documentation: 'Variable declaration block'
  },
  {
    label: 'IF',
    insertText: 'IF ${1:condition} THEN\n\t$0\nEND_IF;',
    documentation: 'IF statement'
  },
  {
    label: 'FOR',
    insertText: 'FOR ${1:i} := ${2:0} TO ${3:10} DO\n\t$0\nEND_FOR;',
    documentation: 'FOR loop'
  },
  {
    label: 'WHILE',
    insertText: 'WHILE ${1:condition} DO\n\t$0\nEND_WHILE;',
    documentation: 'WHILE loop'
  },
  {
    label: 'TON',
    insertText: 'TON(IN := ${1:Start}, PT := T#${2:5s})',
    documentation: 'On-delay timer'
  },
  {
    label: 'TOF',
    insertText: 'TOF(IN := ${1:Start}, PT := T#${2:5s})',
    documentation: 'Off-delay timer'
  },
  {
    label: 'CTU',
    insertText: 'CTU(CU := ${1:CountUp}, R := ${2:Reset}, PV := ${3:100})',
    documentation: 'Count up counter'
  },
  {
    label: 'CTD',
    insertText: 'CTD(CD := ${1:CountDown}, LD := ${2:Load}, PV := ${3:100})',
    documentation: 'Count down counter'
  },
  {
    label: 'R_TRIG',
    insertText: 'R_TRIG(CLK := ${1:Signal})',
    documentation: 'Rising edge detection'
  },
  {
    label: 'F_TRIG',
    insertText: 'F_TRIG(CLK := ${1:Signal})',
    documentation: 'Falling edge detection'
  }
]

export const stDataTypes = [
  'BOOL', 'BYTE', 'WORD', 'DWORD', 'LWORD',
  'SINT', 'INT', 'DINT', 'LINT',
  'USINT', 'UINT', 'UDINT', 'ULINT',
  'REAL', 'LREAL', 'TIME', 'DATE', 'STRING'
]