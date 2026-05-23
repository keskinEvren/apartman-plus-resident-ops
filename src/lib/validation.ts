import { z } from "zod";

/**
 * Common Validation Schemas
 */

// Email
export const emailSchema = z.string().email("Invalid email address");

// Password - minimum 8 chars, 1 uppercase, 1 lowercase, 1 number
export const passwordSchema = z
  .string()
  .min(8, "Password must be at least 8 characters")
  .regex(/[A-Z]/, "Password must contain at least one uppercase letter")
  .regex(/[a-z]/, "Password must contain at least one lowercase letter")
  .regex(/[0-9]/, "Password must contain at least one number");

// UUID
export const uuidSchema = z.string().uuid("Invalid UUID");

// Pagination
export const paginationSchema = z.object({
  page: z.number().int().min(1).default(1),
  limit: z.number().int().min(1).max(100).default(20),
});

// Date range
export const dateRangeSchema = z.object({
  startDate: z.coerce.date(),
  endDate: z.coerce.date(),
});

// Search
export const searchSchema = z.object({
  query: z.string().min(1).max(100),
});

/**
 * Form validation helpers
 */
export function getZodErrors(error: z.ZodError): Record<string, string> {
  const errors: Record<string, string> = {};
  error.errors.forEach((err) => {
    const path = err.path.join(".");
    if (!errors[path]) {
      errors[path] = err.message;
    }
  });
  return errors;
}

/**
 * Create form validator
 */
export function createValidator<T extends z.ZodSchema>(schema: T) {
  return {
    validate: (data: unknown) => schema.parse(data),
    safeParse: (data: unknown) => schema.safeParse(data),
    isValid: (data: unknown) => schema.safeParse(data).success,
  };
}
