const express = require("express");
const bcrypt = require("bcryptjs");
const { PrismaClient } = require("@prisma/client");
const { requireAuth } = require("../middleware/auth");       // adapte si nom différent
const { requireRole } = require("../middleware/roles");      // adapte si nom différent

const prisma = new PrismaClient();
const router = express.Router();

/**
 * ADMIN: list users
 * GET /api/users
 */
router.get("/", requireAuth, requireRole("ADMIN"), async (req, res) => {
  const users = await prisma.user.findMany({
    orderBy: { createdAt: "desc" },
    select: { id: true, name: true, email: true, role: true, active: true, createdAt: true },
  });
  res.json({ users });
});

/**
 * ADMIN: create user
 * POST /api/users
 */
router.post("/", requireAuth, requireRole("ADMIN"), async (req, res) => {
  const { name, email, password, role } = req.body;

  if (!name || !email || !password || !role) {
    return res.status(400).json({ error: "name, email, password, role requis" });
  }

  const existing = await prisma.user.findUnique({ where: { email } });
  if (existing) return res.status(409).json({ error: "Email déjà utilisé" });

  const passwordHash = await bcrypt.hash(password, 10);

  const user = await prisma.user.create({
    data: { name, email, passwordHash, role, active: true },
    select: { id: true, name: true, email: true, role: true, active: true, createdAt: true },
  });

  res.json({ user });
});

/**
 * ADMIN: update role / active / name
 * PATCH /api/users/:id
 */
router.patch("/:id", requireAuth, requireRole("ADMIN"), async (req, res) => {
  const { role, active, name } = req.body;

  const user = await prisma.user.update({
    where: { id: req.params.id },
    data: {
      ...(role ? { role } : {}),
      ...(typeof active === "boolean" ? { active } : {}),
      ...(name ? { name } : {}),
    },
    select: { id: true, name: true, email: true, role: true, active: true, createdAt: true },
  });

  res.json({ user });
});

module.exports = router;

