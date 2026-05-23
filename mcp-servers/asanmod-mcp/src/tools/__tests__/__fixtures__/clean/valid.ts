// Valid TypeScript file with no errors
export function add(a: number, b: number): number {
  return a + b;
}

export function multiply(x: number, y: number): number {
  return x * y;
}

export interface User {
  id: string;
  name: string;
  email: string;
}

export class Calculator {
  private value: number = 0;

  add(n: number): void {
    this.value += n;
  }

  getValue(): number {
    return this.value;
  }
}
