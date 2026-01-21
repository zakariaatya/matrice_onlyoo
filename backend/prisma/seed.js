const { PrismaClient } = require("@prisma/client");
const bcrypt = require("bcryptjs");

const prisma = new PrismaClient();

async function upsertUser(email, password, name, role) {
  const hashed = await bcrypt.hash(password, 10);
  const identifier = email.split('@')[0];
  const existing = await prisma.user.findUnique({ where: { email } });
  if (existing) return;
  await prisma.user.create({
    data: { email, identifier, password: hashed, name, role, active: true },
  });
}

async function upsertSection(key, title, type, sortOrder) {
  const existing = await prisma.matrixSection.findUnique({ where: { key } });
  if (existing) return existing;
  return prisma.matrixSection.create({
    data: { key, title, type, sortOrder, active: true },
  });
}

async function upsertChoice(key, sectionId, label, priceY1, priceY2, sortOrder = 0) {
  const existing = await prisma.matrixChoice.findUnique({ where: { key } });
  if (existing) return existing;
  return prisma.matrixChoice.create({
    data: { key, sectionId, label, priceY1, priceY2, sortOrder, active: true },
  });
}

async function main() {
  console.log("🌱 Seeding users...");
  await upsertUser("admin@eol-ict.local", "admin123", "Admin", "ADMIN");
  await upsertUser("manager@eol-ict.local", "manager123", "Manager", "MANAGER");
  await upsertUser("agent@eol-ict.local", "agent123", "Agent", "AGENT");
  await upsertUser("bo@eol-ict.local", "bo123", "Backoffice", "BACKOFFICE");

  console.log("🌱 Seeding matrix...");

  const secPack = await upsertSection("pack_type", "Type de pack", "single", 1);
  const secGsm = await upsertSection("gsm", "GSM", "single", 2);
  const secOpt = await upsertSection("options", "Options", "multi", 3);

  const flexXS = await upsertChoice("flex_xs", secPack.id, "Flex+ XS", 52.99, 57.99, 1);
  await upsertChoice("flex_easy", secPack.id, "Flex+ EASY", 64.99, 84.99, 2);

  await upsertChoice("gsm_20", secGsm.id, "20GB", 18.15, 18.15, 1);
  await upsertChoice("gsm_10", secGsm.id, "10GB", 9.99, 9.99, 2);

  const roaming = await upsertChoice("roaming", secOpt.id, "Roaming International", 5, 5, 1);
  await upsertChoice("data10", secOpt.id, "Data Extra 10GB", 10, 10, 2);

  const existingRule = await prisma.matrixRule.findFirst({
    where: { type: "SHOW_IF", targetId: roaming.id, dependsOnId: flexXS.id },
  });
  if (!existingRule) {
    await prisma.matrixRule.create({
      data: { type: "SHOW_IF", targetId: roaming.id, dependsOnId: flexXS.id, message: "Option dispo si Flex+ XS" },
    });
  }

  console.log("✅ Seed done.");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });

