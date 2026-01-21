const express = require("express");
const router = express.Router();
const { PrismaClient } = require("@prisma/client");
const prisma = new PrismaClient();
const { requireAuth } = require("../middleware/auth");

router.get("/", requireAuth, async (req, res) => {
  const role = req.user.role;
  const audience =
    role === "AGENT" ? ["ALL", "AGENT"] :
    role === "BACKOFFICE" ? ["ALL", "BACKOFFICE"] :
    role === "MANAGER" ? ["ALL", "MANAGER"] :
    ["ALL"];

  const items = await prisma.notification.findMany({
    where: { audience: { in: audience } },
    orderBy: { createdAt: "desc" },
    take: 20,
  });

  res.json({ notifications: items });
});

router.post("/", requireAuth, async (req, res) => {
  if (!["MANAGER", "ADMIN"].includes(req.user.role)) {
    return res.status(403).json({ error: "Accès refusé" });
  }
  const { title, message, audience } = req.body;
  if (!title || !message || !audience) {
    return res.status(400).json({ error: "Champs requis" });
  }

  const created = await prisma.notification.create({
    data: {
      title,
      message,
      audience,
      createdBy: req.user.id,
    },
  });

  res.status(201).json({ notification: created });
});

module.exports = router;
