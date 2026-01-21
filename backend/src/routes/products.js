const express = require('express');
const router = express.Router();
const { PrismaClient } = require('@prisma/client');
const { requireAuth, requireRole } = require('../middleware/auth');

const prisma = new PrismaClient();

function ensureProductModel(req, res) {
  if (!prisma.product || typeof prisma.product.findMany !== "function") {
    res.status(501).json({ error: "Product model non disponible" });
    return false;
  }
  return true;
}

router.get('/', requireAuth, async (req, res) => {
  if (!ensureProductModel(req, res)) return;
  const showAll = req.user.role === 'MANAGER' || req.user.role === 'ADMIN';
  const products = await prisma.product.findMany({
    where: showAll ? {} : { active: true },
    orderBy: [{ category: 'asc' }, { type: 'asc' }, { name: 'asc' }]
  });
  res.json({ products });
});

router.post('/', requireAuth, requireRole('MANAGER','ADMIN'), async (req, res) => {
  if (!ensureProductModel(req, res)) return;
  const { type, name, category, priceY1, priceY2, description, active } = req.body;
  if (!type || !name || !category || priceY1 == null || priceY2 == null) {
    return res.status(400).json({ error: 'type,name,category,priceY1,priceY2 requis' });
  }

  const product = await prisma.product.create({
    data: {
      type,
      name,
      category,
      priceY1: Number(priceY1),
      priceY2: Number(priceY2),
      description: description || null,
      active: active !== undefined ? Boolean(active) : true
    }
  });

  res.status(201).json({ product });
});

router.put('/:id', requireAuth, requireRole('MANAGER','ADMIN'), async (req, res) => {
  if (!ensureProductModel(req, res)) return;
  const id = Number(req.params.id);
  const { type, name, category, priceY1, priceY2, description, active } = req.body;

  const product = await prisma.product.update({
    where: { id },
    data: {
      ...(type !== undefined ? { type } : {}),
      ...(name !== undefined ? { name } : {}),
      ...(category !== undefined ? { category } : {}),
      ...(priceY1 !== undefined ? { priceY1: Number(priceY1) } : {}),
      ...(priceY2 !== undefined ? { priceY2: Number(priceY2) } : {}),
      ...(description !== undefined ? { description: description || null } : {}),
      ...(active !== undefined ? { active: Boolean(active) } : {}),
    }
  });

  res.json({ product });
});

router.delete('/:id', requireAuth, requireRole('MANAGER','ADMIN'), async (req, res) => {
  if (!ensureProductModel(req, res)) return;
  const id = Number(req.params.id);
  await prisma.product.update({ where: { id }, data: { active: false } });
  res.json({ message: 'Produit désactivé' });
});

module.exports = router;
