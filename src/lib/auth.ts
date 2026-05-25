import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import { env } from "./env";

/**
 * Authentication Utilities
 */

const SALT_ROUNDS = 12;
const JWT_SECRET = env.JWT_SECRET;
const JWT_EXPIRY = "7d";

// Password Hashing
export async function hashPassword(password: string): Promise<string> {
  return bcrypt.hash(password, SALT_ROUNDS);
}

export async function comparePassword(
  password: string,
  hash: string,
): Promise<boolean> {
  return bcrypt.compare(password, hash);
}

// JWT Tokens
export interface JWTPayload {
  userId: string;
  email: string;
  role: string;
  sessionId?: string;
  requireMfa?: boolean;
}

export function signToken(payload: JWTPayload): string {
  return jwt.sign(payload, JWT_SECRET, { expiresIn: JWT_EXPIRY });
}

export function verifyToken(token: string): JWTPayload {
  try {
    return jwt.verify(token, JWT_SECRET) as JWTPayload;
  } catch (error) {
    throw new Error("Invalid or expired token");
  }
}

export function decodeToken(token: string): JWTPayload | null {
  try {
    return jwt.decode(token) as JWTPayload;
  } catch {
    return null;
  }
}

// Session Management
export function generateSessionToken(): string {
  return jwt.sign({ type: "session" }, JWT_SECRET, { expiresIn: "30d" });
}

// Password Validation
export function validatePasswordStrength(password: string): {
  isValid: boolean;
  errors: string[];
} {
  const errors: string[] = [];

  if (password.length < 8)
    errors.push("Password must be at least 8 characters");
  if (!/[A-Z]/.test(password)) errors.push("Must contain uppercase letter");
  if (!/[a-z]/.test(password)) errors.push("Must contain lowercase letter");
  if (!/[0-9]/.test(password)) errors.push("Must contain number");
  if (!/[^A-Za-z0-9]/.test(password))
    errors.push("Must contain special character");

  return {
    isValid: errors.length === 0,
    errors,
  };
}
