const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

(async () => {
  try {
    const updated = await prisma.matrixSection.update({
      where: { id: 5 },
      data: { active: true },
    });
    console.log('✅ Section MEHDI activée:', updated.title);
  } catch (e) {
    console.error('❌ Erreur:', e.message);
  } finally {
    await prisma.$disconnect();
  }
})();
