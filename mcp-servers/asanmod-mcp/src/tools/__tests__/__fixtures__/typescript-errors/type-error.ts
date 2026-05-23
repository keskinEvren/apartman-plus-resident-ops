// @ts-nocheck
// TypeScript type errors
export function processUser(user: { id: number; name: string }) {
  // Type error: string cannot be assigned to number
  const id: number = user.name;

  // Type error: property doesn't exist
  const email = user.email;

  return {
    id: user.id,
    name: user.name,
  };
}

// Missing return type annotation
export function getValue() {
  return "test";
}

// Type mismatch
const numberValue: number = "string";
