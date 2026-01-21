const express = require("express");
const path = require("path");
const fs = require("fs");
const router = express.Router();
const { PrismaClient } = require("@prisma/client");
const prisma = new PrismaClient();

const { requireAuth, requireRole } = require("../middleware/auth");
const { buildOutlookCompatibleHtml, buildPlainText } = require("../utils/outlook-builder");
const { sendMail } = require("../utils/mailer");

// Routes
router.get("/ping", (req, res) => res.json({ ok: true, router: "quotes" }));

/**
 * ✅ LISTE DES DEVIS
 */
router.get("/", requireAuth, async (req, res) => {
  try {
    const role = req.user.role;
    const where = role === "AGENT" ? { agentId: req.user.id } : {};

    const quotes = await prisma.quote.findMany({
      where,
      orderBy: { createdAt: "desc" },
      include: {
        agent: { select: { id: true, name: true, email: true, role: true } },
        selections: { include: { choice: { include: { section: true } } } },
      },
    });

    res.json({ quotes });
  } catch (err) {
    console.error("GET /api/quotes ERROR =>", err);
    res.status(500).json({ error: err?.message || "Erreur serveur" });
  }
});

/**
 * ✅ POST /api/quotes
 * Agent crée un devis
 */
router.post("/", requireAuth, requireRole("AGENT"), async (req, res) => {
  try {
    const { customerName, customerEmail, choiceIds, gsmItems, totalY1, totalY2 } = req.body;

    console.log("=== POST /api/quotes ===");
    console.log("user:", req.user?.email, "role:", req.user?.role);
    console.log("body:", JSON.stringify(req.body, null, 2));

    if (!customerName || !customerEmail) {
      console.log("Erreur: customerName ou customerEmail manquant");
      return res.status(400).json({ error: "customerName et customerEmail requis" });
    }

    // Si choiceIds est fourni, on l'utilise, sinon on reconstruit depuis gsmItems
    let ids = [];
    if (Array.isArray(choiceIds) && choiceIds.length > 0) {
      ids = choiceIds.map((x) => Number(x)).filter((x) => Number.isFinite(x));
      console.log("choiceIds fournis:", ids);
    } else if (Array.isArray(gsmItems) && gsmItems.length > 0) {
      ids = gsmItems.map((item) => Number(item.choiceId)).filter((x) => Number.isFinite(x));
      console.log("gsmItems fournis, ids reconstruits:", ids);
    }

    if (ids.length === 0) {
      console.log("Erreur: aucun ID trouvé");
      return res.status(400).json({ error: "Au moins un choix requis" });
    }

    console.log("Recherche des choix en base...");
    const choices = await prisma.matrixChoice.findMany({
      where: { id: { in: ids }, active: true },
      include: { section: true },
    });

    console.log("Choix trouvés:", choices.length);

    if (choices.length === 0) {
      return res.status(400).json({ error: "Aucun choix valide" });
    }

    // Calcul des totaux
    let calcY1 = 0;
    let calcY2 = 0;

    const gsmMap = new Map(
      Array.isArray(gsmItems)
        ? gsmItems.map((item) => [Number(item.choiceId), Number(item.qty) || 1])
        : []
    );

    if (gsmMap.size > 0) {
      choices.forEach((c) => {
        const qty = gsmMap.get(c.id) || 1;
        calcY1 += Number(c.priceY1 || 0) * qty;
        calcY2 += Number(c.priceY2 || 0) * qty;
      });
      console.log("Totaux calculés (avec GSM qty):", { calcY1, calcY2 });
    } else {
      calcY1 = choices.reduce((sum, c) => sum + Number(c.priceY1 || 0), 0);
      calcY2 = choices.reduce((sum, c) => sum + Number(c.priceY2 || 0), 0);
      console.log("Totaux calculés (sans GSM qty):", { calcY1, calcY2 });
    }

    // Remise GSM Flex: -5€ sur Y2 pour chaque quantite au-dela de 1
    let flexQty = 0;
    if (gsmMap.size > 0) {
      choices.forEach((c) => {
        const qty = gsmMap.get(c.id) || 0;
        if (!qty) return;
        const secTitle = (c.section?.title || "").toLowerCase();
        const secKey = (c.section?.key || "").toLowerCase();
        const isGsm = secTitle.includes("gsm") || secKey.includes("gsm");
        const isSolo = secTitle.includes("solo") || secKey.includes("solo");
        if (isGsm && !isSolo) {
          flexQty += Number(qty || 0);
        }
      });
    }

    const flexDiscount = flexQty > 1 ? (flexQty - 1) * 5 : 0;
    const calcY2WithDiscount = calcY2 - flexDiscount;

    const finalY1 = typeof totalY1 === "number" && totalY1 > 0 ? totalY1 : calcY1;
    let finalY2;
    if (typeof totalY2 === "number" && totalY2 > 0) {
      // Si le client n'a pas applique la remise alors qu'elle est attendue, on corrige.
      if (flexDiscount > 0 && Math.abs(totalY2 - calcY2) < 0.01) {
        finalY2 = calcY2WithDiscount;
      } else {
        finalY2 = totalY2;
      }
    } else {
      finalY2 = calcY2WithDiscount;
    }

    console.log("Totaux finaux:", { finalY1, finalY2 });

    console.log("Création du devis...");
    const quote = await prisma.quote.create({
      data: {
        agentId: req.user.id,
        customerName,
        customerEmail,
        totalY1: finalY1,
        totalY2: finalY2,
        emailContent: "",
        status: "TO_SEND",
        selections: {
          create: ids.map((id) => ({ choiceId: id })),
        },
      },
      include: {
        agent: { select: { id: true, name: true, email: true } },
        selections: { include: { choice: { include: { section: true } } } },
      },
    });

    console.log("Devis créé avec ID:", quote.id);

    // Envoi direct au client via SMTP
    const FROM = process.env.SMTP_FROM || process.env.SMTP_USER || "no-reply@eol-ict.net";
    const AGREEMENT_TO =
      process.env.MAIL_AGREEMENT_TO || process.env.MAIL_PREVIEW_TO || FROM;
    const onlyooLogoPath = path.join(__dirname, "../../frontend/public/onlyoo.jpg");
    const proximusLogoPath = path.join(__dirname, "../../frontend/public/proximus.png");
    const hasOnlyooLogo = fs.existsSync(onlyooLogoPath);
    const hasProximusLogo = fs.existsSync(proximusLogoPath);

    const { html: bodyHtml, subject } = buildOutlookCompatibleHtml({
      quote,
      agent: quote.agent,
      choices,
      boEmail: AGREEMENT_TO,
      logoOnlyooSrc: hasOnlyooLogo ? "cid:logo-onlyoo" : undefined,
      logoProximusSrc: hasProximusLogo ? "cid:logo-proximus" : undefined,
    });
    const { text: bodyText } = buildPlainText({ quote, agent: quote.agent, choices });

    const fixedTo = process.env.MAIL_PREVIEW_TO || FROM;
    const clientName = quote.customerName || "Client";
    const clientEmail = quote.customerEmail || "email client inconnu";
    const forcedSubject = `Offre spéciale Onlyoo - ${clientName}  à envoyer svp à : ${clientEmail}`;

    try {
      await sendMail({
        to: fixedTo,
        subject: forcedSubject,
        html: bodyHtml,
        text: bodyText,
        from: FROM,
        attachments: [
          ...(hasOnlyooLogo
            ? [{ filename: "logo-onlyoo.jpg", path: onlyooLogoPath, cid: "logo-onlyoo" }]
            : []),
          ...(hasProximusLogo
            ? [{ filename: "logo-proximus.png", path: proximusLogoPath, cid: "logo-proximus" }]
            : []),
        ],
      });

      await prisma.quote.update({
        where: { id: quote.id },
        data: { status: "MAIL_SENT", emailContent: bodyHtml },
      });

      res.status(201).json({ quote: { ...quote, status: "MAIL_SENT" } });
    } catch (err) {
      console.error("SMTP send failed:", err?.message || err);
      await prisma.quote.update({
        where: { id: quote.id },
        data: { status: "TO_SEND", emailContent: bodyHtml },
      });
      res.status(502).json({
        error: "Envoi email échoué. Le devis reste en attente (Backoffice).",
        quoteId: quote.id,
      });
    }
  } catch (err) {
    console.error("POST /api/quotes ERROR =>", err);
    res.status(500).json({ error: err?.message || "Erreur serveur" });
  }
});

/**
 * ✅ GET /api/quotes/:id/preview
 * Retourne le HTML et texte du mail pour affichage/copie
 */
router.get("/:id/preview", requireAuth, requireRole("BACKOFFICE"), async (req, res) => {
  try {
    const id = Number(req.params.id);
    if (!Number.isFinite(id)) return res.status(400).json({ error: "ID invalide" });

    const quote = await prisma.quote.findUnique({
      where: { id },
      include: {
        agent: { select: { id: true, name: true, email: true } },
        selections: { include: { choice: { include: { section: true } } } },
      },
    });

    if (!quote) return res.status(404).json({ error: "Devis introuvable" });

    const choices = quote.selections
      .map((s) => ({
        ...s.choice,
        section: s.choice.section,
      }))
      .sort((a, b) => {
        const secA = Number(a.section?.sortOrder ?? 0);
        const secB = Number(b.section?.sortOrder ?? 0);
        if (secA !== secB) return secA - secB;
        const chA = Number(a.sortOrder ?? 0);
        const chB = Number(b.sortOrder ?? 0);
        return chA - chB;
      });

    // Générer le titre selon le type
    const hasGsm = choices.some(c =>
      c.section?.title?.toLowerCase()?.includes("gsm") ||
      c.section?.key?.toLowerCase()?.includes("gsm")
    );
    const hasPack = choices.some(c =>
      c.section?.title?.toLowerCase()?.includes("pack") ||
      c.section?.key?.toLowerCase()?.includes("pack")
    );

    let title = "Offre spéciale Onlyoo";
    if (hasGsm && hasPack) {
      title = "Contrat de mise en service Pack Proximus";
    } else if (hasGsm) {
      title = "Contrat de mise en service du GSM Proximus";
    } else if (hasPack) {
      title = "Contrat de mise en service du Pack Proximus";
    }

    const BO_EMAIL =
      process.env.MAIL_AGREEMENT_TO ||
      process.env.MAIL_PREVIEW_TO ||
      "z.atya@eolcenter.net";

    // Générer le HTML compatible Outlook
    const { html: bodyHtml, subject } = buildOutlookCompatibleHtml({
      quote,
      agent: quote.agent,
      choices,
      boEmail: BO_EMAIL,
    });

    const { text: bodyText } = buildPlainText({ quote, agent: quote.agent, choices });

    res.json({
      quoteId: quote.id,
      customerEmail: quote.customerEmail,
      customerName: quote.customerName,
      title,
      subject,
      bodyHtml,
      bodyText,
    });
  } catch (err) {
    console.error("GET /api/quotes/:id/preview ERROR =>", err);
    res.status(500).json({ error: err?.message || "Erreur serveur" });
  }
});

/**
 * ✅ POST /api/quotes/:id/send
 * Marque le devis comme envoyé
 */
router.post("/:id/send", requireAuth, requireRole("BACKOFFICE"), async (req, res) => {
  try {
    const id = Number(req.params.id);
    if (!Number.isFinite(id)) return res.status(400).json({ error: "ID invalide" });

    const quote = await prisma.quote.update({
      where: { id },
      data: { status: "MAIL_SENT" },
    });

    res.json({
      success: true,
      message: "Devis marqué comme envoyé",
      quote,
    });
  } catch (err) {
    console.error("POST /api/quotes/:id/send ERROR =>", err);
    res.status(500).json({ error: err?.message || "Erreur serveur" });
  }
});

/**
 * ✅ PUT /api/quotes/:id/status
 */
router.put("/:id/status", requireAuth, requireRole("BACKOFFICE"), async (req, res) => {
  try {
    const id = Number(req.params.id);
    const { status } = req.body;

    const allowed = ["TO_SEND", "MAIL_SENT", "NEED_FIX", "REJECTED"];
    if (!allowed.includes(status)) return res.status(400).json({ error: "Status invalide" });

    const quote = await prisma.quote.update({
      where: { id },
      data: { status },
    });

    res.json({ quote });
  } catch (err) {
    console.error("PUT /api/quotes/:id/status ERROR =>", err);
    res.status(500).json({ error: err?.message || "Erreur serveur" });
  }
});

/**
 * ✅ PUT /api/quotes/:id/mark-sent
 */
router.put("/:id/mark-sent", requireAuth, requireRole("BACKOFFICE"), async (req, res) => {
  try {
    const id = Number(req.params.id);

    const quote = await prisma.quote.update({
      where: { id },
      data: { status: "MAIL_SENT" },
    });

    res.json({ quote });
  } catch (err) {
    console.error("PUT /api/quotes/:id/mark-sent ERROR =>", err);
    res.status(500).json({ error: err?.message || "Erreur serveur" });
  }
});

module.exports = router;
