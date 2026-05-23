/**
 * ASANMOD v1.1.1: FEATURE SCAFFOLDER
 * Usage: node scripts/mod-tools/generate-feature.js [FeatureName]
 *
 * Automates the creation of strict, pattern-compliant feature structures.
 */

const fs = require("fs");
const path = require("path");
const readline = require("readline");

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout,
});

const PROJECT_ROOT = path.resolve(__dirname, "../../");

const COLORS = {
  reset: "\x1b[0m",
  green: "\x1b[32m",
  blue: "\x1b[34m",
  yellow: "\x1b[33m",
  red: "\x1b[31m",
};

const TEMPLATES = {
  CONTROLLER: (name) => `
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

// ASANMOD v1.1.1 Pattern: Validation Layer First
// NOTE: Add Joi or Zod validation schema here (template placeholder)

/**
 * ${name} Controller
 * Handles business logic for ${name} module.
 */

exports.getAll = async (req, res) => {
  try {
    const { organizationId } = req.user; // Multi-tenant strictness
    // const data = await prisma.${name.toLowerCase()}.findMany({ where: { organizationId } });
    res.json({ success: true, data: [] });
  } catch (error) {
    console.error('[${name}] Error:', error);
    res.status(500).json({ success: false, error: 'Internal Server Error' });
  }
};

exports.create = async (req, res) => {
    // Implement creation logic
    res.status(501).json({ message: 'Not Implemented' });
};
`,
  ROUTE: (name) => `
const express = require('express');
const router = express.Router();
const ${name}Controller = require('../controllers/${name}Controller');
const { authenticateToken, checkRole } = require('../middleware/authMiddleware.js'); // Updated imports

/**
 * ${name} Routes
 * Base Path: /api/${name.toLowerCase()}
 */

// Secure all routes by default
router.use(authenticateToken);

router.get('/', checkRole(['ADMIN', 'MANAGER', 'USER']), ${name}Controller.getAll);
router.post('/', checkRole(['ADMIN', 'MANAGER']), ${name}Controller.create);

module.exports = router;
`,
  PAGE: (name) => `
'use client';

import { useState, useEffect } from 'react';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Plus } from 'lucide-react';

/**
 * ${name} Page
 * Route: /dashboard/${name.toLowerCase()}
 */
export default function ${name}Page() {
  const [loading, setLoading] = useState(true);

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold tracking-tight">${name} Management</h1>
        <Button>
            <Plus className="mr-2 h-4 w-4" /> New ${name}
        </Button>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {/* Mobile-First Grid Pattern */}
        <Card>
            <CardHeader>
                <CardTitle>Overview</CardTitle>
            </CardHeader>
            <CardContent>
                <p>Welcome to ${name} module.</p>
            </CardContent>
        </Card>
      </div>
    </div>
  );
}
`,
};

function createDirectory(dirPath) {
  if (!fs.existsSync(dirPath)) {
    fs.mkdirSync(dirPath, { recursive: true });
    console.log(
      `${COLORS.green}✔ Created directory:${COLORS.reset} ${dirPath}`,
    );
  }
}

function writeFile(filePath, content) {
  if (fs.existsSync(filePath)) {
    console.log(
      `${COLORS.yellow}⚠ Skipped (Exists):${COLORS.reset} ${filePath}`,
    );
  } else {
    fs.writeFileSync(filePath, content.trim());
    console.log(`${COLORS.green}✔ Created file:${COLORS.reset} ${filePath}`);
  }
}

const askQuestion = (query) =>
  new Promise((resolve) => rl.question(query, resolve));

async function main() {
  console.log(
    `${COLORS.blue}╔════════════════════════════════════════════════════════╗${COLORS.reset}`,
  );
  console.log(
    `${COLORS.blue}║  🏗️  ASANMOD v1.1.1: Feature Scaffolder                    ║${COLORS.reset}`,
  );
  console.log(
    `${COLORS.blue}╚════════════════════════════════════════════════════════╝${COLORS.reset}`,
  );

  let featureName = process.argv[2];

  if (!featureName) {
    featureName = await askQuestion(
      `${COLORS.yellow}Feature Name (PascalCase, e.g. Payroll): ${COLORS.reset}`,
    );
  }

  if (!featureName) {
    console.error(
      `${COLORS.red}❌ Error: Feature name is required.${COLORS.reset}`,
    );
    process.exit(1);
  }

  // 1. Backend
  console.log(`\n${COLORS.blue}--- Backend Scaffolding ---${COLORS.reset}`);
  createDirectory(path.join(PROJECT_ROOT, "backend/src/controllers"));
  createDirectory(path.join(PROJECT_ROOT, "backend/src/routes"));

  writeFile(
    path.join(
      PROJECT_ROOT,
      `backend/src/controllers/${featureName}Controller.js`,
    ),
    TEMPLATES.CONTROLLER(featureName),
  );
  writeFile(
    path.join(PROJECT_ROOT, `backend/src/routes/${featureName}Routes.js`),
    TEMPLATES.ROUTE(featureName),
  );

  // 2. Frontend
  console.log(`\n${COLORS.blue}--- Frontend Scaffolding ---${COLORS.reset}`);
  const pageDir = path.join(
    PROJECT_ROOT,
    `frontend/app/dashboard/${featureName.toLowerCase()}`,
  );
  createDirectory(pageDir);

  writeFile(path.join(pageDir, "page.tsx"), TEMPLATES.PAGE(featureName));

  console.log(
    `\n${COLORS.green}✅ Feature '${featureName}' scaffolding complete!${COLORS.reset}`,
  );
  console.log(`\n${COLORS.yellow}NEXT STEPS:${COLORS.reset}`);
  console.log(
    `1. Implement 'prisma.${featureName.toLowerCase()}' model in schema.prisma`,
  );
  console.log(`2. Register route in 'backend/src/server.js' (or app.js)`);
  console.log(`3. Run 'npm run verify' to check linting.`);

  rl.close();
}

main();
