const express = require('express');
const router = express.Router();
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { PrismaClient } = require('@prisma/client');
const { requireAuth } = require('../middleware/auth');

const prisma = new PrismaClient();

router.post('/login', async (req, res) => {
  try {
    // Accepter 'identifier' OU 'email' pour la rétro-compatibilité
    const loginValue = req.body.identifier || req.body.email;
    const { password } = req.body;
    
    if (!loginValue || !password) return res.status(400).json({ error: 'Identifiant et mot de passe requis' });

    // Chercher par identifier d'abord, puis par email pour rétro-compatibilité
    let user = await prisma.user.findUnique({ where: { identifier: loginValue } });
    if (!user) {
      user = await prisma.user.findUnique({ where: { email: loginValue } });
    }
    
    if (!user) return res.status(401).json({ error: 'Identifiant ou mot de passe incorrect' });
    if (!user.active) return res.status(403).json({ error: 'Compte désactivé' });

    const ok = await bcrypt.compare(password, user.password);
    if (!ok) return res.status(401).json({ error: 'Identifiant ou mot de passe incorrect' });

    const token = jwt.sign(
      { id: user.id, identifier: user.identifier, role: user.role, email: user.email, name: user.name },
      process.env.JWT_SECRET,
      { expiresIn: process.env.JWT_EXPIRES_IN || '24h' }
    );

    res.json({ token, user: { id: user.id, identifier: user.identifier, name: user.name, role: user.role, email: user.email } });
  } catch (e) {
    console.error(e);
    res.status(500).json({ error: 'Erreur serveur' });
  }
});

router.get('/me', requireAuth, async (req, res) => {
  const user = await prisma.user.findUnique({
    where: { id: req.user.id },
    select: { id: true, identifier: true, email: true, name: true, role: true, active: true }
  });
  if (!user || !user.active) return res.status(404).json({ error: 'Utilisateur non trouvé' });
  res.json({ user });
});

module.exports = router;
