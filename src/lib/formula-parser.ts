/**
 * Safe formula parser for mathematical expressions
 * Replaces eval() with a safer alternative that only supports basic math operations
 * 
 * This module provides a secure way to evaluate mathematical formulas by:
 * - Tokenizing expressions into safe components
 * - Converting infix notation to postfix (RPN)
 * - Evaluating expressions without executing arbitrary code
 * - Supporting only basic arithmetic operations (+, -, *, /, parentheses)
 */

interface Token {
  type: 'number' | 'operator' | 'parenthesis' | 'variable';
  value: string;
}

/**
 * Tokenizes a mathematical expression
 */
function tokenize(expression: string): Token[] {
  const tokens: Token[] = [];
  let current = '';
  
  for (let i = 0; i < expression.length; i++) {
    const char = expression[i];
    
    if (/\d|\./.test(char)) {
      // Number
      current += char;
    } else if (/[+\-*/]/.test(char)) {
      // Operator
      if (current) {
        tokens.push({ type: 'number', value: current });
        current = '';
      }
      tokens.push({ type: 'operator', value: char });
    } else if (/[()]/.test(char)) {
      // Parenthesis
      if (current) {
        tokens.push({ type: 'number', value: current });
        current = '';
      }
      tokens.push({ type: 'parenthesis', value: char });
    } else if (/[a-zA-Z_][a-zA-Z0-9_]*/.test(char)) {
      // Variable (column name) - this should have been replaced before parsing
      throw new Error('Variables must be replaced with numbers before parsing');
    } else if (char === ' ') {
      // Skip whitespace
      if (current) {
        tokens.push({ type: 'number', value: current });
        current = '';
      }
    } else {
      throw new Error(`Invalid character: ${char}`);
    }
  }
  
  if (current) {
    tokens.push({ type: 'number', value: current });
  }
  
  return tokens;
}

/**
 * Converts infix notation to postfix (RPN) using Shunting Yard algorithm
 */
function infixToPostfix(tokens: Token[]): Token[] {
  const output: Token[] = [];
  const operators: Token[] = [];
  
  for (const token of tokens) {
    if (token.type === 'number') {
      output.push(token);
    } else if (token.type === 'operator') {
      while (
        operators.length > 0 &&
        operators[operators.length - 1].type === 'operator' &&
        getPrecedence(operators[operators.length - 1].value) >= getPrecedence(token.value)
      ) {
        output.push(operators.pop()!);
      }
      operators.push(token);
    } else if (token.value === '(') {
      operators.push(token);
    } else if (token.value === ')') {
      while (operators.length > 0 && operators[operators.length - 1].value !== '(') {
        output.push(operators.pop()!);
      }
      if (operators.length === 0) {
        throw new Error('Mismatched parentheses');
      }
      operators.pop(); // Remove '('
    }
  }
  
  while (operators.length > 0) {
    const op = operators.pop()!;
    if (op.value === '(' || op.value === ')') {
      throw new Error('Mismatched parentheses');
    }
    output.push(op);
  }
  
  return output;
}

/**
 * Gets operator precedence
 */
function getPrecedence(operator: string): number {
  switch (operator) {
    case '+':
    case '-':
      return 1;
    case '*':
    case '/':
      return 2;
    default:
      return 0;
  }
}

/**
 * Evaluates postfix expression
 */
function evaluatePostfix(tokens: Token[]): number {
  const stack: number[] = [];
  
  for (const token of tokens) {
    if (token.type === 'number') {
      const num = parseFloat(token.value);
      if (isNaN(num)) {
        throw new Error(`Invalid number: ${token.value}`);
      }
      stack.push(num);
    } else if (token.type === 'operator') {
      if (stack.length < 2) {
        throw new Error('Insufficient operands for operator');
      }
      
      const b = stack.pop()!;
      const a = stack.pop()!;
      let result: number;
      
      switch (token.value) {
        case '+':
          result = a + b;
          break;
        case '-':
          result = a - b;
          break;
        case '*':
          result = a * b;
          break;
        case '/':
          if (b === 0) {
            throw new Error('Division by zero');
          }
          result = a / b;
          break;
        default:
          throw new Error(`Unknown operator: ${token.value}`);
      }
      
      stack.push(result);
    }
  }
  
  if (stack.length !== 1) {
    throw new Error('Invalid expression');
  }
  
  return stack[0];
}

/**
 * Safely evaluates a mathematical formula
 * @param formula - The formula to evaluate (should only contain numbers, operators, and parentheses)
 * @returns The result of the calculation
 */
export function safeEvaluate(formula: string): number {
  try {
    // Remove any non-math characters for safety
    const cleanFormula = formula.replace(/[^0-9+\-*/.() ]/g, '');
    
    if (!cleanFormula.trim()) {
      throw new Error('Empty formula');
    }
    
    const tokens = tokenize(cleanFormula);
    const postfix = infixToPostfix(tokens);
    const result = evaluatePostfix(postfix);
    
    if (!isFinite(result)) {
      throw new Error('Result is not a finite number');
    }
    
    return result;
  } catch (error) {
    throw new Error(`Formula evaluation failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
}

/**
 * Validates if a formula is safe to evaluate
 * @param formula - The formula to validate
 * @returns true if the formula is safe, false otherwise
 */
export function isValidFormula(formula: string): boolean {
  try {
    // Check for dangerous patterns
    const dangerousPatterns = [
      /eval\s*\(/i,
      /function\s*\(/i,
      /setTimeout\s*\(/i,
      /setInterval\s*\(/i,
      /require\s*\(/i,
      /import\s+/i,
      /\.\w+\s*\(/g, // Method calls
      /\[\s*\]/g, // Array access
      /{\s*}/g, // Object literals
    ];
    
    for (const pattern of dangerousPatterns) {
      if (pattern.test(formula)) {
        return false;
      }
    }
    
    // Try to parse it
    safeEvaluate(formula);
    return true;
  } catch {
    return false;
  }
}
