/**
 * AST Parser Utility
 * Extracts functions, classes, and imports from TypeScript/JavaScript files
 * Token optimization: Enables function/class-based selective reading
 */

interface FunctionInfo {
  name: string;
  startLine: number;
  endLine: number;
  type: "function" | "method" | "arrow";
}

interface ClassInfo {
  name: string;
  startLine: number;
  endLine: number;
  methods: FunctionInfo[];
}

export interface ParseResult {
  functions: FunctionInfo[];
  classes: ClassInfo[];
  imports: string[];
}

/**
 * Parse file content and extract functions, classes, and imports
 * Uses simple regex parsing (lightweight, no TypeScript compiler dependency)
 */
export function parseAST(content: string, filePath?: string): ParseResult {
  try {
    const lines = content.split("\n");
    const functions: FunctionInfo[] = [];
    const classes: ClassInfo[] = [];
    const imports: string[] = [];

    let currentClass: ClassInfo | null = null;
    let braceDepth = 0;
    let inClass = false;

    for (let i = 0; i < lines.length; i++) {
      const line = lines[i];
      const trimmed = line.trim();

      // Skip comments and empty lines
      if (
        trimmed.startsWith("//") ||
        trimmed.startsWith("/*") ||
        trimmed.startsWith("*") ||
        trimmed === ""
      ) {
        continue;
      }

      // Extract imports
      if (trimmed.startsWith("import ")) {
        const importMatch = trimmed.match(
          /import\s+(?:.*?\s+from\s+)?["']([^"']+)["']/
        );
        if (importMatch) {
          imports.push(importMatch[1]);
        }
        continue;
      }

      // Extract classes
      const classMatch = trimmed.match(
        /(?:export\s+)?(?:abstract\s+)?class\s+(\w+)/
      );
      if (classMatch) {
        const className = classMatch[1];
        const startLine = i + 1; // 1-indexed

        // Find class end (simplified - looks for closing brace at same indentation)
        let endLine = startLine;
        let classBraceDepth = 0;
        let classStarted = false;

        for (let j = i; j < lines.length; j++) {
          const classLine = lines[j];
          for (const char of classLine) {
            if (char === "{") {
              classBraceDepth++;
              classStarted = true;
            }
            if (char === "}") {
              classBraceDepth--;
              if (classStarted && classBraceDepth === 0) {
                endLine = j + 1;
                break;
              }
            }
          }
          if (classStarted && classBraceDepth === 0) break;
        }

        currentClass = {
          name: className,
          startLine,
          endLine: endLine || startLine + 10, // Fallback
          methods: [],
        };
        classes.push(currentClass);
        inClass = true;
        continue;
      }

      // Extract functions (outside classes)
      if (!inClass) {
        const functionMatch = trimmed.match(
          /(?:export\s+)?(?:async\s+)?function\s+(\w+)/
        );
        const arrowMatch = trimmed.match(
          /(?:export\s+)?(?:const|let|var)\s+(\w+)\s*[:=]\s*(?:async\s+)?\(/
        );
        const methodMatch = trimmed.match(
          /(?:public|private|protected)?\s*(?:async\s+)?(\w+)\s*\(/
        );

        if (functionMatch) {
          const funcName = functionMatch[1];
          const startLine = i + 1;
          // Simple end detection (look for closing brace)
          let endLine = startLine;
          let funcBraceDepth = 0;
          let funcStarted = false;

          for (let j = i; j < lines.length; j++) {
            const funcLine = lines[j];
            for (const char of funcLine) {
              if (char === "{") {
                funcBraceDepth++;
                funcStarted = true;
              }
              if (char === "}") {
                funcBraceDepth--;
                if (funcStarted && funcBraceDepth === 0) {
                  endLine = j + 1;
                  break;
                }
              }
            }
            if (funcStarted && funcBraceDepth === 0) break;
          }

          functions.push({
            name: funcName,
            startLine,
            endLine: endLine || startLine + 10,
            type: "function",
          });
        } else if (arrowMatch) {
          const funcName = arrowMatch[1];
          const startLine = i + 1;
          // Arrow functions can be single line or multi-line
          let endLine = startLine;
          if (trimmed.includes("=>")) {
            // Single line arrow function
            endLine = startLine;
          } else {
            // Multi-line, find closing
            let arrowBraceDepth = 0;
            let arrowStarted = false;
            for (let j = i; j < lines.length; j++) {
              const arrowLine = lines[j];
              for (const char of arrowLine) {
                if (char === "{") {
                  arrowBraceDepth++;
                  arrowStarted = true;
                }
                if (char === "}") {
                  arrowBraceDepth--;
                  if (arrowStarted && arrowBraceDepth === 0) {
                    endLine = j + 1;
                    break;
                  }
                }
              }
              if (arrowStarted && arrowBraceDepth === 0) break;
            }
          }

          functions.push({
            name: funcName,
            startLine,
            endLine,
            type: "arrow",
          });
        }
      } else if (currentClass) {
        // Extract class methods
        const methodMatch = trimmed.match(
          /(?:public|private|protected)?\s*(?:async\s+)?(\w+)\s*\(/
        );
        if (methodMatch && !trimmed.includes("constructor")) {
          const methodName = methodMatch[1];
          const startLine = i + 1;
          let endLine = startLine;
          let methodBraceDepth = 0;
          let methodStarted = false;

          for (let j = i; j < lines.length && j < currentClass.endLine; j++) {
            const methodLine = lines[j];
            for (const char of methodLine) {
              if (char === "{") {
                methodBraceDepth++;
                methodStarted = true;
              }
              if (char === "}") {
                methodBraceDepth--;
                if (methodStarted && methodBraceDepth === 0) {
                  endLine = j + 1;
                  break;
                }
              }
            }
            if (methodStarted && methodBraceDepth === 0) break;
          }

          currentClass.methods.push({
            name: methodName,
            startLine,
            endLine: endLine || startLine + 5,
            type: "method",
          });
        }
      }

      // Track brace depth for class detection
      for (const char of line) {
        if (char === "{") braceDepth++;
        if (char === "}") {
          braceDepth--;
          if (braceDepth === 0 && inClass) {
            inClass = false;
            currentClass = null;
          }
        }
      }
    }

    return {
      functions,
      classes,
      imports,
    };
  } catch (error: any) {
    // Fallback: Return empty result on parse error
    console.warn(
      `[ASTParser] Failed to parse ${filePath || "file"}: ${error.message}`
    );
    return {
      functions: [],
      classes: [],
      imports: [],
    };
  }
}

/**
 * Find function by name
 */
export function findFunction(
  parseResult: ParseResult,
  functionName: string
): FunctionInfo | null {
  return parseResult.functions.find((f) => f.name === functionName) || null;
}

/**
 * Find class by name
 */
export function findClass(
  parseResult: ParseResult,
  className: string
): ClassInfo | null {
  return parseResult.classes.find((c) => c.name === className) || null;
}

/**
 * Find method in class
 */
export function findMethod(
  classInfo: ClassInfo,
  methodName: string
): FunctionInfo | null {
  return classInfo.methods.find((m) => m.name === methodName) || null;
}
