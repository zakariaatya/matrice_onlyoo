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
    const where = role === "AGENT" || role === "FORMATION" ? { agentId: req.user.id } : {};

    const quotes = await prisma.quote.findMany({
      where,
      orderBy: { createdAt: "desc" },
      include: {
        agent: { select: { id: true, name: true, email: true, role: true } },
        selections: { include: { choice: { include: { section: true, parent: true } } } },
      },
    });

    res.json({ quotes });
  } catch (err) {
    console.error("GET /api/quotes ERROR =>", err);
    res.status(500).json({ error: err?.message || "Erreur serveur" });
  }
});

/**
 * ✅ GET /api/quotes/export-emails
 * Exporte les emails envoyes par agent (CSV)
 */
router.get("/export-emails", requireAuth, requireRole("BACKOFFICE"), async (req, res) => {
  try {
    const { startDate, endDate } = req.query;

    let gte;
    let lte;
    if (startDate) {
      const start = new Date(String(startDate));
      if (!Number.isNaN(start.getTime())) {
        start.setHours(0, 0, 0, 0);
        gte = start;
      }
    }
    if (endDate) {
      const end = new Date(String(endDate));
      if (!Number.isNaN(end.getTime())) {
        end.setHours(23, 59, 59, 999);
        lte = end;
      }
    }

    const where = { status: "MAIL_SENT" };
    if (gte || lte) {
      where.createdAt = { ...(gte ? { gte } : {}), ...(lte ? { lte } : {}) };
    }

    const quotes = await prisma.quote.findMany({
      where,
      orderBy: { createdAt: "desc" },
      include: { agent: { select: { id: true, name: true, email: true } } },
    });

    const escapeCsv = (value) => {
      const str = String(value ?? "");
      if (/[\";\n\r]/.test(str)) {
        return `"${str.replace(/\"/g, "\"\"")}"`;
      }
      return str;
    };

    const header = [
      "ID",
      "Agent",
      "Agent Email",
      "Client",
      "Client Email",
      "Telephone",
      "Statut",
      "Date",
    ];

    const rows = quotes.map((q) => [
      q.id,
      q.agent?.name || "",
      q.agent?.email || "",
      q.customerName || "",
      q.customerEmail || "",
      q.customerPhone || "",
      q.status || "",
      q.createdAt ? new Date(q.createdAt).toLocaleString("fr-BE") : "",
    ]);

    const csvLines = [header, ...rows].map((line) => line.map(escapeCsv).join(";"));
    const csvContent = `\ufeff${csvLines.join("\r\n")}\r\n`;

    const stamp = new Date().toISOString().slice(0, 10);
    res.setHeader("Content-Type", "text/csv; charset=utf-8");
    res.setHeader("Content-Disposition", `attachment; filename="emails_agents_${stamp}.csv"`);
    res.send(csvContent);
  } catch (err) {
    console.error("GET /api/quotes/export-emails ERROR =>", err);
    res.status(500).json({ error: err?.message || "Erreur serveur" });
  }
});

/**
 * ✅ POST /api/quotes
 * Agent crée un devis
 */
router.post("/", requireAuth, requireRole("AGENT", "FORMATION"), async (req, res) => {
  try {
    const { customerName, customerEmail, customerPhone, choiceIds, gsmItems, qtyItems, dataPhoneNote, totalY1, totalY2 } = req.body;

    console.log("=== POST /api/quotes ===");
    console.log("user:", req.user?.email, "role:", req.user?.role);
    console.log("body:", JSON.stringify(req.body, null, 2));

    if (!customerName || !customerEmail) {
      console.log("Erreur: customerName ou customerEmail manquant");
      return res.status(400).json({ error: "customerName et customerEmail requis" });
    }

    // Si choiceIds est fourni, on l'utilise, sinon on reconstruit depuis gsmItems/qtyItems
    let ids = [];
    if (Array.isArray(choiceIds) && choiceIds.length > 0) {
      ids = choiceIds.map((x) => Number(x)).filter((x) => Number.isFinite(x));
      console.log("choiceIds fournis:", ids);
    } else {
      const gsmIds = Array.isArray(gsmItems)
        ? gsmItems.map((item) => Number(item.choiceId)).filter((x) => Number.isFinite(x))
        : [];
      const qtyIds = Array.isArray(qtyItems)
        ? qtyItems.map((item) => Number(item.choiceId)).filter((x) => Number.isFinite(x))
        : [];
      ids = Array.from(new Set([...gsmIds, ...qtyIds]));
      if (ids.length) {
        console.log("ids reconstruits:", ids);
      }
    }

    if (ids.length === 0) {
      console.log("Erreur: aucun ID trouvé");
      return res.status(400).json({ error: "Au moins un choix requis" });
    }

    console.log("Recherche des choix en base...");
    const choices = await prisma.matrixChoice.findMany({
      where: { id: { in: ids }, active: true },
      include: { section: true, parent: true },
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
    const qtyMap = new Map(
      Array.isArray(qtyItems)
        ? qtyItems.map((item) => [Number(item.choiceId), Number(item.qty) || 1])
        : []
    );
    const qtyByChoice = new Map();
    for (const [id, qty] of gsmMap.entries()) qtyByChoice.set(id, qty);
    for (const [id, qty] of qtyMap.entries()) qtyByChoice.set(id, qty);

    choices.forEach((c) => {
      const qty = qtyByChoice.get(c.id) || 1;
      calcY1 += Number(c.priceY1 || 0) * qty;
      calcY2 += Number(c.priceY2 || 0) * qty;
    });
    console.log("Totaux calculés:", { calcY1, calcY2 });

    // Remise GSM Flex: -5€ sur Y1 et Y2 pour chaque quantite au-dela de 1
    let flexQty = 0;
    if (qtyByChoice.size > 0) {
      choices.forEach((c) => {
        const qty = qtyByChoice.get(c.id) || 0;
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
    const calcY1WithDiscount = calcY1 - flexDiscount;
    const calcY2WithDiscount = calcY2 - flexDiscount;

    let finalY1;
    if (typeof totalY1 === "number" && totalY1 > 0) {
      // Si le client n'a pas applique la remise alors qu'elle est attendue, on corrige.
      if (flexDiscount > 0 && Math.abs(totalY1 - calcY1) < 0.01) {
        finalY1 = calcY1WithDiscount;
      } else {
        finalY1 = totalY1;
      }
    } else {
      finalY1 = calcY1WithDiscount;
    }

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
    const createData = {
      agentId: req.user.id,
      customerName,
      customerEmail,
      customerPhone: customerPhone || null,
      totalY1: finalY1,
      totalY2: finalY2,
      emailContent: "",
      status: "TO_SEND",
      selections: {
        create: ids.map((id) => ({
          choiceId: id,
          qty: qtyByChoice.get(id) || 1,
        })),
      },
    };

    let quote;
    try {
      quote = await prisma.quote.create({
        data: createData,
        include: {
          agent: { select: { id: true, name: true, email: true } },
          selections: { include: { choice: { include: { section: true, parent: true } } } },
        },
      });
    } catch (err) {
      const msg = String(err?.message || "");
      if (msg.includes("Unknown argument `customerPhone`")) {
        const { customerPhone: _unused, ...fallbackData } = createData;
        quote = await prisma.quote.create({
          data: fallbackData,
          include: {
            agent: { select: { id: true, name: true, email: true } },
            selections: { include: { choice: { include: { section: true, parent: true } } } },
          },
        });
      } else {
        throw err;
      }
    }

    console.log("Devis créé avec ID:", quote.id);

    // Envoi direct au client via SMTP
    const FROM = process.env.SMTP_FROM || process.env.SMTP_USER || "no-reply@eol-ict.net";
    const AGREEMENT_TO =
      process.env.MAIL_AGREEMENT_TO || process.env.MAIL_PREVIEW_TO || FROM;
    const onlyooLogoPath = path.join(__dirname, "../../assets/onlyoo.jpg");
    const proximusLogoPath = path.join(__dirname, "../../assets/proximus.png");
    const hasOnlyooLogo = fs.existsSync(onlyooLogoPath);
    const hasProximusLogo = fs.existsSync(proximusLogoPath);

    const choicesWithQty = choices.map((c) => ({
      ...c,
      qty: qtyByChoice.get(c.id) || 1,
    }));

    const sortedChoices = choicesWithQty
      .slice()
      .sort((a, b) => {
        const secA = Number(a.section?.sortOrder ?? 0);
        const secB = Number(b.section?.sortOrder ?? 0);
        if (secA !== secB) return secA - secB;
        const chA = Number(a.sortOrder ?? 0);
        const chB = Number(b.sortOrder ?? 0);
        if (chA !== chB) return chA - chB;
        return a.id - b.id;
      });

    const { html: bodyHtml, subject } = buildOutlookCompatibleHtml({
      quote,
      agent: quote.agent,
      choices: sortedChoices,
      boEmail: AGREEMENT_TO,
      logoOnlyooSrc: hasOnlyooLogo ? "cid:logo-onlyoo" : undefined,
      logoProximusSrc: hasProximusLogo ? "cid:logo-proximus" : undefined,
      dataPhoneNote: dataPhoneNote ? String(dataPhoneNote) : "",
    });
    const { text: bodyText } = buildPlainText({ quote, agent: quote.agent, choices: sortedChoices });

    const fixedTo = process.env.MAIL_PREVIEW_TO || FROM;
    const clientEmail = quote.customerEmail || "email client inconnu";
    const forcedSubject = `${subject} - ${clientEmail}`;

    if (req.user?.role === "FORMATION") {
      const trainingQuote = await prisma.quote.update({
        where: { id: quote.id },
        data: { status: "DRAFT", emailContent: bodyHtml },
        include: {
          agent: { select: { id: true, name: true, email: true } },
          selections: { include: { choice: { include: { section: true, parent: true } } } },
        },
      });

      return res.status(201).json({
        trainingMode: true,
        message: "Mode formation: aucun email envoyé au Back-Office.",
        quote: trainingQuote,
        emailHtml: bodyHtml,
        emailText: bodyText,
        subject: forcedSubject,
      });
    }

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

      res.status(201).json({
        quote: { ...quote, status: "MAIL_SENT" },
        emailHtml: bodyHtml,
        emailText: bodyText,
        subject: forcedSubject,
      });
    } catch (err) {
      console.error("SMTP send failed:", err?.message || err);
      await prisma.quote.update({
        where: { id: quote.id },
        data: { status: "TO_SEND", emailContent: bodyHtml },
      });
      res.status(502).json({
        error: "Envoi email échoué. Le devis reste en attente (Backoffice).",
        quoteId: quote.id,
        emailHtml: bodyHtml,
        emailText: bodyText,
        subject: forcedSubject,
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
        selections: { include: { choice: { include: { section: true, parent: true } } } },
      },
    });

    if (!quote) return res.status(404).json({ error: "Devis introuvable" });

    const choices = quote.selections
      .map((s) => ({
        ...s.choice,
        section: s.choice.section,
        qty: s.qty || 1,
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
      title = "Contrat de mise en service du Pack Proximus";
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
      dataPhoneNote: "",
    });

    const { text: bodyText } = buildPlainText({ quote, agent: quote.agent, choices, dataPhoneNote: "" });

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
 * ✅ DELETE /api/quotes/:id
 * Supprime un devis (Backoffice)
 */
router.delete("/:id", requireAuth, requireRole("BACKOFFICE"), async (req, res) => {
  try {
    const id = Number(req.params.id);
    if (!Number.isFinite(id)) return res.status(400).json({ error: "ID invalide" });

    await prisma.quote.delete({ where: { id } });
    res.json({ ok: true });
  } catch (err) {
    console.error("DELETE /api/quotes/:id ERROR =>", err);
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
