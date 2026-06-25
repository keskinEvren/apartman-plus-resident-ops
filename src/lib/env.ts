import { z } from "zod";

/**
 * Environment Variable Validation
 *
 * Validates all required and optional environment variables at startup
 * Provides type-safe access to environment variables
 * Exits with helpful error messages if validation fails
 */

const envSchema = z.object({
  // Database
  DATABASE_URL: z
    .string()
    .url("DATABASE_URL must be a valid PostgreSQL connection string"),

  // Authentication
  JWT_SECRET: z
    .string()
    .min(
      32,
      "JWT_SECRET must be at least 32 characters for security. Generate with: openssl rand -base64 32",
    ),

  // App Configuration
  NODE_ENV: z
    .enum(["development", "production", "test"])
    .default("development"),

  PORT: z.coerce.number().default(3000),

  NEXT_PUBLIC_APP_URL: z.string().url().optional(),

  // Optional External Services
  SENTRY_DSN: z.string().url().optional(),

  REDIS_URL: z.string().url().optional(),

  // Email (optional)
  EMAIL_FROM: z.string().email().optional(),

  EMAIL_SERVER: z.string().optional(),
});

export type Env = z.infer<typeof envSchema>;

/**
 * Validates environment variables against schema
 * Exits process with code 1 if validation fails
 * Returns type-safe environment object
 */
export function validateEnv(): Env {
  try {
    const validated = envSchema.parse(process.env);
    return validated;
  } catch (error) {
    console.error("\n❌ Environment Validation Failed:\n");

    if (error instanceof z.ZodError) {
      error.errors.forEach((err) => {
        const path = err.path.join(".");
        console.error(`  ❌ ${path}: ${err.message}`);
      });
    }

    console.error("\n💡 Fix your .env file and restart the server.\n");
    console.error("See .env.example for reference.\n");

    process.exit(1);
  }
}

// Validate immediately on import
export const env = validateEnv();

