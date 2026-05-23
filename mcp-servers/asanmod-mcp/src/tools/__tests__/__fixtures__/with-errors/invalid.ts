// @ts-nocheck
// Invalid TypeScript file with errors
export function add(a: number, b: number): number {
  return a + b;
}

// Missing type annotation
export function subtract(x, y) {
  return x - y;
}

// Type error
const value: string = 123;

// Unused variable
const unused = "test";

// Missing return type
export function divide(a: number, b: number) {
  if (b === 0) {
    throw new Error("Division by zero");
  }
  return a / b;
}
