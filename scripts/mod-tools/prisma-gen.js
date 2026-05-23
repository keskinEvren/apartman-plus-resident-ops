import fs from "fs";
import path from "path";

const schemaPath = path.resolve(process.cwd(), "prisma/schema.prisma");

const modelName = process.argv[2];

if (!modelName) {
  console.error("Usage: node prisma-gen.js <ModelName>");
  process.exit(1);
}

if (!fs.existsSync(schemaPath)) {
  console.error("Schema file not found:", schemaPath);
  process.exit(1);
}

const template = `
model ${modelName} {
  id        String   @id @default(cuid())
  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt

  // Add fields here
}
`;

const currentContent = fs.readFileSync(schemaPath, "utf-8");

if (currentContent.includes(`model ${modelName}`)) {
  console.error(`Model ${modelName} already exists.`);
  process.exit(1);
}

fs.appendFileSync(schemaPath, template);
console.log(`Added model ${modelName} to schema.prisma`);
