/**
 * Tool: asanmod_verify_migration_sync
 * Migration senkronizasyon kontrolü
 */

import { execSync } from "child_process";
import { join } from "path";

export interface MigrationSyncResult {
  success: boolean;
  schema: {
    devTables: number;
    prodTables: number;
    devEnums: number;
    prodEnums: number;
    devIndexes: number;
    prodIndexes: number;
    synced: boolean;
  };
  constraints: {
    devConstraints: number;
    prodConstraints: number;
    synced: boolean;
  };
  migrations: {
    pendingMigrations: number;
    appliedMigrations: number;
  };
  errors: string[];
}

export async function verifyMigrationSync(): Promise<MigrationSyncResult> {
  const result: MigrationSyncResult = {
    success: true,
    schema: {
      devTables: 0,
      prodTables: 0,
      devEnums: 0,
      prodEnums: 0,
      devIndexes: 0,
      prodIndexes: 0,
      synced: false,
    },
    constraints: {
      devConstraints: 0,
      prodConstraints: 0,
      synced: false,
    },
    migrations: {
      pendingMigrations: 0,
      appliedMigrations: 0,
    },
    errors: [],
  };

  const dbUser = process.env.DB_USER || "asanmoduser";
  const dbHost = process.env.DB_HOST || "localhost";
  const dbPort = process.env.DB_PORT || "5432";
  const devDb = process.env.DB_NAME_DEV || "asanmod_dev_db";
  const prodDb = process.env.DB_NAME_PROD || "asanmod_prod_db";
  const password = process.env.PGPASSWORD || process.env.DB_PASSWORD || process.env.DB_PASS || "";
  const env = password ? { ...process.env, PGPASSWORD: password } : { ...process.env };

  // Schema comparison
  try {
    const devTables = execSync(
      `psql -h ${dbHost} -p ${dbPort} -U ${dbUser} -d ${devDb} -t -c "SELECT COUNT(*) FROM pg_tables WHERE schemaname = 'public' AND tablename NOT LIKE '\\_%';" 2>/dev/null || echo "0"`,
      { encoding: "utf-8", env }
    ).trim();
    result.schema.devTables = parseInt(devTables) || 0;
  } catch (e) {
    result.errors.push(`Cannot get DEV tables: ${e}`);
  }

  try {
    const prodTables = execSync(
      `psql -h ${dbHost} -p ${dbPort} -U ${dbUser} -d ${prodDb} -t -c "SELECT COUNT(*) FROM pg_tables WHERE schemaname = 'public' AND tablename NOT LIKE '\\_%';" 2>/dev/null || echo "0"`,
      { encoding: "utf-8", env }
    ).trim();
    result.schema.prodTables = parseInt(prodTables) || 0;
  } catch (e) {
    result.errors.push(`Cannot get PROD tables: ${e}`);
  }

  try {
    const devEnums = execSync(
      `psql -h ${dbHost} -p ${dbPort} -U ${dbUser} -d ${devDb} -t -c "SELECT COUNT(*) FROM pg_type WHERE typtype = 'e' AND typnamespace = (SELECT oid FROM pg_namespace WHERE nspname = 'public');" 2>/dev/null || echo "0"`,
      { encoding: "utf-8", env }
    ).trim();
    result.schema.devEnums = parseInt(devEnums) || 0;
  } catch (e) {
    result.errors.push(`Cannot get DEV enums: ${e}`);
  }

  try {
    const prodEnums = execSync(
      `psql -h ${dbHost} -p ${dbPort} -U ${dbUser} -d ${prodDb} -t -c "SELECT COUNT(*) FROM pg_type WHERE typtype = 'e' AND typnamespace = (SELECT oid FROM pg_namespace WHERE nspname = 'public');" 2>/dev/null || echo "0"`,
      { encoding: "utf-8", env }
    ).trim();
    result.schema.prodEnums = parseInt(prodEnums) || 0;
  } catch (e) {
    result.errors.push(`Cannot get PROD enums: ${e}`);
  }

  // Index comparison
  try {
    const devIndexes = execSync(
      `psql -h ${dbHost} -p ${dbPort} -U ${dbUser} -d ${devDb} -t -c "SELECT COUNT(*) FROM pg_indexes WHERE schemaname = 'public' AND indexname NOT LIKE '%_pkey';" 2>/dev/null || echo "0"`,
      { encoding: "utf-8", env }
    ).trim();
    result.schema.devIndexes = parseInt(devIndexes) || 0;
  } catch (e) {
    result.errors.push(`Cannot get DEV indexes: ${e}`);
  }

  try {
    const prodIndexes = execSync(
      `psql -h ${dbHost} -p ${dbPort} -U ${dbUser} -d ${prodDb} -t -c "SELECT COUNT(*) FROM pg_indexes WHERE schemaname = 'public' AND indexname NOT LIKE '%_pkey';" 2>/dev/null || echo "0"`,
      { encoding: "utf-8", env }
    ).trim();
    result.schema.prodIndexes = parseInt(prodIndexes) || 0;
  } catch (e) {
    result.errors.push(`Cannot get PROD indexes: ${e}`);
  }

  result.schema.synced =
    result.schema.devTables === result.schema.prodTables &&
    result.schema.devEnums === result.schema.prodEnums &&
    result.schema.devIndexes === result.schema.prodIndexes;

  // Constraints comparison
  try {
    const devConstraints = execSync(
      `psql -h ${dbHost} -p ${dbPort} -U ${dbUser} -d ${devDb} -t -c "SELECT COUNT(*) FROM pg_constraint WHERE connamespace = (SELECT oid FROM pg_namespace WHERE nspname = 'public') AND contype IN ('u', 'f', 'c');" 2>/dev/null || echo "0"`,
      { encoding: "utf-8", env }
    ).trim();
    result.constraints.devConstraints = parseInt(devConstraints) || 0;
  } catch (e) {
    result.errors.push(`Cannot get DEV constraints: ${e}`);
  }

  try {
    const prodConstraints = execSync(
      `psql -h ${dbHost} -p ${dbPort} -U ${dbUser} -d ${prodDb} -t -c "SELECT COUNT(*) FROM pg_constraint WHERE connamespace = (SELECT oid FROM pg_namespace WHERE nspname = 'public') AND contype IN ('u', 'f', 'c');" 2>/dev/null || echo "0"`,
      { encoding: "utf-8", env }
    ).trim();
    result.constraints.prodConstraints = parseInt(prodConstraints) || 0;
  } catch (e) {
    result.errors.push(`Cannot get PROD constraints: ${e}`);
  }

  result.constraints.synced =
    result.constraints.devConstraints === result.constraints.prodConstraints;

  // Migration status
  try {
    // Use getWorkspaceRoot to find the correct project root
    const { getWorkspaceRoot } = await import("../utils/paths.js");
    const workspaceRoot = getWorkspaceRoot(import.meta.url);
    const backendPath = join(workspaceRoot, "backend");

    const migrationStatus = execSync(`npx prisma migrate status 2>&1 || echo ""`, {
      encoding: "utf-8",
      cwd: backendPath,
    });

    if (migrationStatus.includes("Database schema is up to date")) {
      result.migrations.pendingMigrations = 0;
    } else {
      const pendingMatch = migrationStatus.match(/(\d+)\s+migration/i);
      if (pendingMatch) {
        result.migrations.pendingMigrations = parseInt(pendingMatch[1]) || 0;
      }
    }
  } catch (e) {
    result.errors.push(`Cannot get migration status: ${e}`);
  }

  // Success kontrolü
  if (!result.schema.synced || !result.constraints.synced || result.errors.length > 0) {
    result.success = false;
  }

  return result;
}
