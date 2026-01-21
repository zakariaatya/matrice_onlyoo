const express = require("express");
const router = express.Router();
const { PrismaClient } = require("@prisma/client");
const prisma = new PrismaClient();

/**
 * GET /api/matrix/runtime
 * Retourne la matrice active (sections + choices + rules)
 * Utilisé par Agent
 */


router.get("/runtime", async (req, res) => {
  try {
    const sections = await prisma.matrixSection.findMany({
      where: { active: true },
      orderBy: { sortOrder: "asc" },
      include: {
        choices: {
          where: { active: true },
          orderBy: { sortOrder: "asc" },
          include: {
            children: {
              where: { active: true },
              orderBy: { sortOrder: "asc" },
            },
          },
        },
      },
    });

    const rules = await prisma.matrixRule.findMany();

    // Récupérer les alertes actives
    const alerts = await prisma.matrixAlert.findMany({
      where: { active: true },
      orderBy: { sortOrder: "asc" },
    });

    let config = {};
    if (prisma.matrixConfig) {
      try {
        const configRows = await prisma.matrixConfig.findMany();
        config = Object.fromEntries(
          configRows.map((r) => [r.key, r.value])
        );
      } catch (e) {
        console.error("MatrixConfig ignored:", e.message);
      }
    }

    res.json({ sections, rules, alerts, config });
  } catch (e) {
    console.error("Matrix runtime error:", e);
    res.status(500).json({ error: "Matrix runtime failed" });
  }
});



/**
 * ===== MANAGER CRUD =====
 * GET /api/matrix/sections
 * POST /api/matrix/sections
 * PUT /api/matrix/sections/:id
 * DELETE /api/matrix/sections/:id  (désactive)
 */
router.get("/sections", async (req, res) => {
  const sections = await prisma.matrixSection.findMany({
    orderBy: { sortOrder: "asc" },
  });
  res.json({ sections });
});

router.post("/sections", async (req, res) => {
  const { key, title, type, sortOrder } = req.body;
  if (!key || !title || !type) return res.status(400).json({ error: "key,title,type requis" });

  const section = await prisma.matrixSection.create({
    data: { key, title, type, sortOrder: Number(sortOrder) || 0, active: true },
  });
  res.status(201).json({ section });
});

router.put("/sections/:id", async (req, res) => {
  const id = Number(req.params.id);
  const { title, type, sortOrder, active } = req.body;

  const section = await prisma.matrixSection.update({
    where: { id },
    data: {
      title: title ?? undefined,
      type: type ?? undefined,
      sortOrder: sortOrder !== undefined ? Number(sortOrder) : undefined,
      active: active !== undefined ? Boolean(active) : undefined,
    },
  });
  res.json({ section });
});

router.delete("/sections/:id", async (req, res) => {
  const id = Number(req.params.id);
  
  try {
    // Supprimer d'abord les règles qui dépendent de cette section
    await prisma.matrixRule.deleteMany({
      where: {
        OR: [
          { targetId: { in: await prisma.matrixChoice.findMany({ where: { sectionId: id }, select: { id: true } }).then(arr => arr.map(c => c.id)) } },
          { dependsOnId: { in: await prisma.matrixChoice.findMany({ where: { sectionId: id }, select: { id: true } }).then(arr => arr.map(c => c.id)) } },
        ],
      },
    });

    // Supprimer les choix
    await prisma.matrixChoice.deleteMany({
      where: { sectionId: id },
    });

    // Supprimer la section
    const section = await prisma.matrixSection.delete({
      where: { id },
    });

    res.json({ section, message: "Section supprimée avec cascade" });
  } catch (e) {
    console.error("Delete section error:", e);
    res.status(500).json({ error: e.message });
  }
});

/**
 * CRUD choices
 */
router.get("/choices", async (req, res) => {
  const choices = await prisma.matrixChoice.findMany({
    orderBy: [{ sectionId: "asc" }, { sortOrder: "asc" }],
    include: {
      children: {
        where: { active: true },
        orderBy: { sortOrder: "asc" },
      },
      parent: true,
    },
  });
  res.json({ choices });
});

router.post("/choices", async (req, res) => {
  const { sectionId, key, label, priceY1, priceY2, sortOrder, active, parentId, description } = req.body;
  if (!sectionId || !key || !label) return res.status(400).json({ error: "sectionId,key,label requis" });

  const choice = await prisma.matrixChoice.create({
    data: {
      sectionId: Number(sectionId),
      key,
      label,
      description: description || null,
      priceY1: Number(priceY1) || 0,
      priceY2: Number(priceY2) || 0,
      sortOrder: Number(sortOrder) || 0,
      active: active !== undefined ? Boolean(active) : true,
      parentId: parentId ? Number(parentId) : null,
    },
  });

  res.status(201).json({ choice });
});

router.put("/choices/:id", async (req, res) => {
  const id = Number(req.params.id);
  const { label, priceY1, priceY2, sortOrder, active, description, parentId } = req.body;

  const choice = await prisma.matrixChoice.update({
    where: { id },
    data: {
      label: label ?? undefined,
      priceY1: priceY1 !== undefined ? Number(priceY1) : undefined,
      priceY2: priceY2 !== undefined ? Number(priceY2) : undefined,
      sortOrder: sortOrder !== undefined ? Number(sortOrder) : undefined,
      active: active !== undefined ? Boolean(active) : undefined,
      description: description ?? undefined,
      parentId: parentId !== undefined ? (parentId ? Number(parentId) : null) : undefined,
    },
  });

  res.json({ choice });
});

router.delete("/choices/:id", async (req, res) => {
  const id = Number(req.params.id);
  
  try {
    // Supprimer les règles liées à ce choix
    await prisma.matrixRule.deleteMany({
      where: {
        OR: [
          { targetId: id },
          { dependsOnId: id },
        ],
      },
    });

    // Supprimer le choix
    const choice = await prisma.matrixChoice.delete({
      where: { id },
    });

    res.json({ choice, message: "Choix supprimé avec ses règles" });
  } catch (e) {
    console.error("Delete choice error:", e);
    res.status(500).json({ error: e.message });
  }
});

/**
 * CRUD rules
 */
router.get("/rules", async (req, res) => {
  const rules = await prisma.matrixRule.findMany();
  res.json({ rules });
});

router.post("/rules", async (req, res) => {
  const { type, targetId, dependsOnId, message } = req.body;
  if (!type || !targetId || !dependsOnId) return res.status(400).json({ error: "type,targetId,dependsOnId requis" });

  const rule = await prisma.matrixRule.create({
    data: {
      type,
      targetId: Number(targetId),
      dependsOnId: Number(dependsOnId),
      message: message || null,
    },
  });

  res.status(201).json({ rule });
});

router.delete("/rules/:id", async (req, res) => {
  const id = Number(req.params.id);
  await prisma.matrixRule.delete({ where: { id } });
  res.json({ ok: true });
});

/**
 * ===== ALERTS CRUD =====
 * Alertes gérées par le Manager
 * GET /api/matrix/alerts
 * POST /api/matrix/alerts
 * PUT /api/matrix/alerts/:id
 * DELETE /api/matrix/alerts/:id
 */
router.get("/alerts", async (req, res) => {
  try {
    const alerts = await prisma.matrixAlert.findMany({
      orderBy: { sortOrder: "asc" },
    });
    res.json({ alerts });
  } catch (e) {
    console.error("Get alerts error:", e);
    res.status(500).json({ error: e.message });
  }
});

router.post("/alerts", async (req, res) => {
  try {
    const { name, message, conditionType, conditionConfig, blocking, active, sortOrder } = req.body;
    
    if (!name || !message || !conditionType) {
      return res.status(400).json({ error: "name, message, conditionType requis" });
    }

    const alert = await prisma.matrixAlert.create({
      data: {
        name,
        message,
        conditionType,
        conditionConfig: conditionConfig || {},
        blocking: blocking !== undefined ? Boolean(blocking) : true,
        active: active !== undefined ? Boolean(active) : true,
        sortOrder: Number(sortOrder) || 0,
      },
    });

    res.status(201).json({ alert });
  } catch (e) {
    console.error("Create alert error:", e);
    res.status(500).json({ error: e.message });
  }
});

router.put("/alerts/:id", async (req, res) => {
  try {
    const id = Number(req.params.id);
    const { name, message, conditionType, conditionConfig, blocking, active, sortOrder } = req.body;

    const alert = await prisma.matrixAlert.update({
      where: { id },
      data: {
        name: name ?? undefined,
        message: message ?? undefined,
        conditionType: conditionType ?? undefined,
        conditionConfig: conditionConfig ?? undefined,
        blocking: blocking !== undefined ? Boolean(blocking) : undefined,
        active: active !== undefined ? Boolean(active) : undefined,
        sortOrder: sortOrder !== undefined ? Number(sortOrder) : undefined,
      },
    });

    res.json({ alert });
  } catch (e) {
    console.error("Update alert error:", e);
    res.status(500).json({ error: e.message });
  }
});

router.delete("/alerts/:id", async (req, res) => {
  try {
    const id = Number(req.params.id);
    await prisma.matrixAlert.delete({ where: { id } });
    res.json({ ok: true });
  } catch (e) {
    console.error("Delete alert error:", e);
    res.status(500).json({ error: e.message });
  }
});

module.exports = router;

