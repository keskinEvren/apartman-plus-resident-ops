const { PrismaClient } = require("@prisma/client");
const dotenv = require("dotenv");
const path = require("path");

// Load environment variables
dotenv.config({ path: path.join(__dirname, "../../backend/.env") });

const prisma = new PrismaClient();

/**
 * Resolves a department name to a departmentId within an organization.
 * If the department doesn't exist, it creates it.
 */
async function resolveDepartmentId(organizationId, departmentName) {
  if (!organizationId || !departmentName || !departmentName.trim()) {
    return null;
  }

  const name = departmentName.trim();

  try {
    // Find existing department
    let department = await prisma.department.findFirst({
      where: {
        organizationId,
        name: {
          equals: name,
          mode: "insensitive", // Be robust to casing
        },
      },
    });

    // If not found, create it
    if (!department) {
      department = await prisma.department.create({
        data: {
          organizationId,
          name,
          description: `Auto-normalized from existing text: ${name}`,
        },
      });
      console.log(`[Department] Created: "${name}" for Org: ${organizationId}`);
    }

    return department.id;
  } catch (error) {
    console.error(
      `[Error] Resolving department "${departmentName}":`,
      error.message,
    );
    return null;
  }
}

async function main() {
  console.log("🚀 Starting Great Normalization Process...");

  const models = [
    { name: "User", field: "department" },
    { name: "JobPosting", field: "department" },
    { name: "Candidate", field: "department" },
    { name: "OfferTemplate", field: "department" },
    { name: "JobOffer", field: "department" },
  ];

  for (const modelInfo of models) {
    const modelName = modelInfo.name;
    const fieldName = modelInfo.field;
    const prismaModel =
      prisma[modelName.charAt(0).toLowerCase() + modelName.slice(1)];

    console.log(`\n📋 Processing Model: ${modelName}...`);

    const records = await prismaModel.findMany({
      where: {
        departmentId: null,
        [fieldName]: { not: null, not: "" },
      },
      select: {
        id: true,
        organizationId: true,
        [fieldName]: true,
      },
    });

    console.log(`Found ${records.length} records needing normalization.`);

    let updatedCount = 0;
    for (const record of records) {
      const deptId = await resolveDepartmentId(
        record.organizationId,
        record[fieldName],
      );

      if (deptId) {
        await prismaModel.update({
          where: { id: record.id },
          data: { departmentId: deptId },
        });
        updatedCount++;
      }
    }

    console.log(
      `✅ Normalized ${updatedCount}/${records.length} records in ${modelName}.`,
    );
  }

  console.log("\n✨ Normalization complete!");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
