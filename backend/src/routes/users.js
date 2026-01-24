const express = require('express');
const router = express.Router();
const bcrypt = require('bcryptjs');
const { PrismaClient } = require('@prisma/client');
const { requireAuth, requireRole } = require('../middleware/auth');

const prisma = new PrismaClient();

router.get('/', requireAuth, requireRole('ADMIN'), async (req, res) => {
  const users = await prisma.user.findMany({
    select: { id:true, identifier:true, email:true, name:true, role:true, active:true, createdAt:true }
  });
  res.json({ users });
});

router.post("/", requireAuth, requireRole("ADMIN"), async (req, res) => {
  const { identifier, password, name, role } = req.body;

  if (!identifier) {
    return res.status(400).json({ error: "identifier requis" });
  }

  if (!password || !name || !role) {
    return res.status(400).json({ error: "password, name, role requis" });
  }

  const existing = await prisma.user.findUnique({ where: { identifier } });
  if (existing) return res.status(409).json({ error: "Cet identifiant est déjà utilisé" });

  const generatedEmail = `${identifier}@eol-ict.local`;
  const existingEmail = await prisma.user.findUnique({ where: { email: generatedEmail } });
  if (existingEmail) {
    return res.status(409).json({ error: "Email auto-généré déjà utilisé" });
  }

  const hashed = await bcrypt.hash(password, 10);

  const user = await prisma.user.create({
    data: {
      identifier,
      email: generatedEmail,
      password: hashed,
      name,
      role,
      active: true,
    },
    select: { id: true, identifier: true, email: true, name: true, role: true, active: true, createdAt: true },
  });

  res.status(201).json({ user });
});


router.put("/:id", requireAuth, requireRole("ADMIN"), async (req, res) => {
  const id = Number(req.params.id);
  const { name, active, identifier, password } = req.body;

  if (identifier) {
    const existing = await prisma.user.findUnique({ where: { identifier } });
    if (existing && existing.id !== id) {
      return res.status(409).json({ error: "Cet identifiant est déjà utilisé" });
    }
  }

  let hashedPassword;
  if (password) {
    hashedPassword = await bcrypt.hash(password, 10);
  }

  const user = await prisma.user.update({
    where: { id },
    data: {
      ...(name !== undefined ? { name } : {}),
      ...(identifier !== undefined ? { identifier } : {}),
      ...(hashedPassword ? { password: hashedPassword } : {}),
      ...(active !== undefined ? { active: Boolean(active) } : {}),
    },
    select: { id: true, identifier: true, email: true, name: true, role: true, active: true, createdAt: true },
  });

  res.json({ user });
});


// DELETE /api/users/:id (ADMIN only) - supprimer un user
router.delete("/:id", requireAuth, requireRole("ADMIN"), async (req, res) => {
  const id = Number(req.params.id);

  // (Optionnel) empêcher l'admin de se supprimer lui-même
  if (req.user && Number(req.user.id) === id) {
    return res.status(400).json({ error: "Tu ne peux pas supprimer ton propre compte." });
  }

  await prisma.user.delete({ where: { id } });
  res.json({ ok: true });
});



module.exports = router;
