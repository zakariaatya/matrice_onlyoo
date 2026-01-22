import React, { useEffect, useMemo, useState, useCallback } from "react";
import api from "./api";

/**
 * Matrice Proximus - Vue Agent (version PRO OPTIMISÉE)
 *
 * ✅ Validations
 * - Email obligatoire + format valide
 * - GSM obligatoire (Belgique): 10 chiffres total, commence par 04 (04 + 8 chiffres)
 * - Promotion obligatoire (validation statique)
 *
 * ✅ GSM PRO (quantité-driven) - BASÉ SUR LES SECTIONS
 * - Section "GSM Flex" (titre contient "gsm" mais pas "solo"): max 6 choix au total
 * - Section "GSM Solo" (titre contient "gsm" et "solo"): quantité illimitée
 * - Les deux sections sont indépendantes (Flex et Solo ne partagent pas la limite)
 *
 * ✅ Interface améliorée
 * - Messages d'erreur dans la colonne Alerte en rouge
 * - Icônes pour chaque section
 * - Police optimisée et compacte
 * - Tableau plus grand
 * - Auto-clear après envoi réussi
 */

const GSM_FLEX_MAX = 6;

  const styles = {
  page: {
    fontFamily: "system-ui, -apple-system, Segoe UI, Roboto, Ubuntu, Cantarell, Noto Sans, Arial",
    background: "#0b1220",
    minHeight: "100vh",
    padding: 20,
    color: "#ffffff",
    borderRadius: 15,
  },
  shell: { maxWidth: 1900, margin: "0 auto" },
  header: {
    background: "linear-gradient(135deg, rgba(126,60,255,0.25), rgba(0,153,255,0.18))",
    border: "1px solid rgba(255,255,255,0.10)",
    borderRadius: 16,
    padding: 16,
    boxShadow: "0 10px 30px rgba(0,0,0,0.25)",
  },
  titleRow: {
    display: "flex",
    alignItems: "center",
    justifyContent: "space-between",
    gap: 16,
  },
  h1: { margin: 0, fontSize: 22, fontWeight: 800, letterSpacing: 0.2 },
  badge: {
    padding: "6px 12px",
    borderRadius: 999,
    background: "rgba(255,255,255,0.10)",
    border: "1px solid rgba(255,255,255,0.14)",
    fontSize: 13,
    color: "#dbe6ff",
    whiteSpace: "nowrap",
  },
  headerBtn: {
    padding: "6px 12px",
    borderRadius: 999,
    background: "rgba(255,255,255,0.06)",
    border: "1px solid rgba(255,255,255,0.14)",
    color: "#e8eefc",
    fontSize: 13,
    fontWeight: 900,
    cursor: "pointer",
    whiteSpace: "nowrap",
  },

  gridTop: {
    marginTop: 12,
    display: "grid",
    gridTemplateColumns: "repeat(5, minmax(0,1fr))",
    gap: 10,
  },
  input: {
    width: "100%",
    padding: "10px 12px",
    borderRadius: 10,
    border: "1px solid rgba(255,255,255,0.12)",
    background: "rgba(0, 0, 0, 0.2)",
    color: "#e8eefc",
    outline: "none",
    fontSize: 14,
  },
  select: {
    width: "100%",
    padding: "10px 12px",
    borderRadius: 10,
    border: "1px solid rgba(22, 22, 22, 0.5)",
    background: "rgba(0,0,0,0.35)",
    color: "#e8eefc",
    outline: "none",
    fontSize: 14,
  },
  label: { fontSize: 13, opacity: 0.9, marginBottom: 4, fontWeight: 600 },
  field: { display: "flex", flexDirection: "column", gap: 5 },

  alertRow: {
    marginTop: 10,
    display: "grid",
    gridTemplateColumns: "1fr 1.5fr",
    gap: 10,
  },
  card: {
    background: "rgba(255,255,255,0.06)",
    border: "1px solid rgba(255,255,255,0.10)",
    borderRadius: 14,
    padding: 14,
    boxShadow: "0 10px 30px rgba(0,0,0,0.22)",
  },
  cardTitle: { margin: 0, fontSize: 14, opacity: 0.9, fontWeight: 700 },
  cardValue: { marginTop: 6, fontSize: 16, fontWeight: 800, lineHeight: 1.2 },
  alertBox: {
    marginTop: 6,
    padding: 10,
    borderRadius: 12,
    border: "1px solid rgba(255,255,255,0.12)",
    background: "rgba(0,0,0,0.18)",
    fontSize: 13,
    lineHeight: 1.4,
  },
  alertBoxError: {
    marginTop: 6,
    padding: 10,
    borderRadius: 15,
    border: "2px solid rgba(255,80,80,0.60)",
    background: "rgba(255,0,0,0.20)",
    fontSize: 20,
    lineHeight: 1.4,
    color: "#ffb3b3",
    fontWeight: 700,
    animation: "pulse 2s infinite",
  },

  mainGrid: {
    marginTop: 12,
    display: "grid",
    gridTemplateColumns: "260px 1fr 420px",
    gap: 12,
    alignItems: "start",
  },
  side: { position: "sticky", top: 12 },

  menuBtn: (active) => ({
    width: "100%",
    textAlign: "left",
    padding: "10px 12px",
    borderRadius: 10,
    border: active ? "1px solid rgba(130,80,255,0.70)" : "1px solid rgba(255,255,255,0.10)",
    background: active ? "rgba(36, 35, 39, 0.18)" : "rgba(255,255,255,0.05)",
    color: active ? "#ffffff" : "#e8eefc",
    cursor: "pointer",
    fontSize: 14,
    fontWeight: 700,
    marginBottom: 6,
    transition: "all 0.2s",
  }),

  sectionHead: {
    display: "flex",
    alignItems: "center",
    justifyContent: "space-between",
    gap: 10,
  },
  sectionTitle: { margin: 0, fontSize: 16, fontWeight: 900 },
  tiny: { fontSize: 13, opacity: 0.85 },
  tinyError: { fontSize: 13, color: "#ffd6d6", opacity: 0.95 },

  choiceList: { marginTop: 10, display: "grid", gap: 10 },
  choiceCard: (selected) => ({
    padding: 12,
    borderRadius: 12,
    border: selected ? "1px solid rgba(0,153,255,0.70)" : "1px solid rgba(255,255,255,0.10)",
    background: selected ? "rgba(0,153,255,0.12)" : "rgba(255,255,255,0.05)",
    cursor: "pointer",
    transition: "all 0.2s",
  }),
  choiceTop: {
    display: "flex",
    alignItems: "center",
    justifyContent: "space-between",
    gap: 10,
  },
  choiceLabel: { fontSize: 14, fontWeight: 800, margin: 0 },
  price: { fontSize: 12, opacity: 0.9, whiteSpace: "nowrap" },

  summaryLine: {
    display: "flex",
    justifyContent: "space-between",
    gap: 10,
    fontSize: 13,
    padding: "6px 0",
  },
  divider: { height: 1, background: "rgba(255,255,255,0.10)", margin: "10px 0" },

  btn: (variant) => {
    const base = {
      width: "100%",
      padding: "12px 14px",
      borderRadius: 12,
      border: "1px solid rgba(255,255,255,0.12)",
      fontWeight: 900,
      cursor: "pointer",
      fontSize: 14,
      transition: "all 0.2s",
    };
    if (variant === "primary") {
      return {
        ...base,
        background: "linear-gradient(135deg, rgba(126,60,255,0.95), rgba(0,153,255,0.85))",
        color: "white",
      };
    }
    return { ...base, background: "rgba(255,255,255,0.06)", color: "#e8eefc" };
  },

  // GSM qty UI
  qtyWrap: { display: "flex", alignItems: "center", gap: 8 },
  qtyBtn: {
    width: 32,
    height: 32,
    borderRadius: 8,
    border: "1px solid rgba(255,255,255,0.14)",
    background: "rgba(255,255,255,0.06)",
    color: "#e8eefc",
    cursor: "pointer",
    fontWeight: 900,
    fontSize: 16,
  },
  qtyBtnDisabled: {
    opacity: 0.45,
    cursor: "not-allowed",
  },
  qtyBox: {
    minWidth: 28,
    textAlign: "center",
    fontWeight: 900,
    opacity: 0.95,
    fontSize: 14,
  },
};

function money(v) {
  const n = Number(v || 0);
  return `${n.toFixed(2)} €`;
}

// Validation helpers
function normalizeEmail(v) {
  return String(v || "").trim().toLowerCase();
}
function normalizeBeMobile(v) {
  return String(v || "").replace(/\D/g, "");
}
function isValidEmail(v) {
  const email = normalizeEmail(v);
  return /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(email);
}
function isValidBeMobile(v) {
  const digits = normalizeBeMobile(v);
  return digits.startsWith("04") && digits.length === 10;
}

// Fonction pour obtenir l'icône de section
function getSectionIcon(key, title) {
  const k = (key || "").toLowerCase();
  const t = (title || "").toLowerCase();

  if (k.includes("pack") || t.includes("pack")) return "📦";
  if (k.includes("gsm") || t.includes("gsm") || t.includes("mobile")) return "📱";
  if (k.includes("promo") || t.includes("promo")) return "🎁";
  if (k.includes("tv") || t.includes("télé") || t.includes("tele")) return "📺";
  if (k.includes("internet") || t.includes("internet") || t.includes("wifi")) return "🌐";
  if (k.includes("fixe") || t.includes("fixe") || t.includes("phone")) return "☎️";
  if (k.includes("option") || t.includes("option")) return "⚙️";
  return "📋";
}

export default function MatrixAgent({ currentUser }) {
  const [sections, setSections] = useState([]);
  const [rules, setRules] = useState([]);
  const [activeKey, setActiveKey] = useState(null);

  const [selectedSingle, setSelectedSingle] = useState({});
  const [selectedMulti, setSelectedMulti] = useState({});

  // GSM qty: choiceId -> qty (qty>0 = selected)
  const [gsmQty, setGsmQty] = useState({});

  const [client, setClient] = useState({
    civility: "",
    lastName: "",
    firstName: "",
    email: "",
    phone: "",
  });

  const [clientErrors, setClientErrors] = useState({ email: "", phone: "" });

  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState("");
  const [ok, setOk] = useState("");
  const [sending, setSending] = useState(false);

  const validateClient = useCallback((c) => {
    const emailOk = isValidEmail(c.email);
    const phoneOk = isValidBeMobile(c.phone);

    const next = {
      email: emailOk ? "" : "Email invalide (ex: nom@domaine.com)",
      phone: phoneOk ? "" : "Mobile invalide doit commencer par 04 et contenir 10 chiffres",
    };
    setClientErrors(next);
    return emailOk && phoneOk;
  }, []);

  // Load runtime matrix
  useEffect(() => {
    let mounted = true;
    setLoading(true);
    setErr("");

    api
      .get("/matrix/runtime")
      .then(({ data }) => {
        if (!mounted) return;

        const secs = (data.sections || [])
          .filter((s) => s.active !== false)
          .slice()
          .sort((a, b) => (a.sortOrder || 0) - (b.sortOrder || 0))
          .map((s) => ({
            ...s,
            choices: (s.choices || [])
              .filter((c) => c.active !== false)
              .slice()
              .sort((a, b) => (a.sortOrder || 0) - (b.sortOrder || 0)),
          }));

        setSections(secs);
        setRules(data.rules || []);
        setActiveKey(secs[0]?.key || null);
      })
      .catch((e) => {
        if (!mounted) return;
        setErr("Erreur chargement matrice.\n" + (e?.response?.data?.error || e?.message || "500"));
      })
      .finally(() => mounted && setLoading(false));

    return () => {
      mounted = false;
    };
  }, []);

  // Selected IDs (non-GSM selections)
  const selectedIds = useMemo(() => {
    const ids = [];
    Object.values(selectedSingle).forEach((v) => v && ids.push(Number(v)));
    Object.values(selectedMulti).forEach((arr) =>
      (arr || []).forEach((id) => ids.push(Number(id)))
    );
    return ids;
  }, [selectedSingle, selectedMulti]);

  const isVisibleChoice = useCallback(
    (choiceId) => {
      const showRules = (rules || []).filter(
        (r) => r.type === "SHOW_IF" && Number(r.targetId) === Number(choiceId)
      );
      if (showRules.length === 0) return true;
      return showRules.some((r) => selectedIds.includes(Number(r.dependsOnId)));
    },
    [rules, selectedIds]
  );

  const visibleSections = useMemo(() => {
    return (sections || [])
      .map((sec) => {
        const visibleChoices = (sec.choices || []).filter((c) => isVisibleChoice(c.id));
        return { ...sec, visibleChoices };
      })
      .filter((sec) => (sec.visibleChoices || []).length > 0);
  }, [sections, isVisibleChoice]);

  useEffect(() => {
    if (!activeKey && visibleSections[0]) setActiveKey(visibleSections[0].key);
    if (activeKey && !visibleSections.find((s) => s.key === activeKey)) {
      setActiveKey(visibleSections[0]?.key || null);
    }
  }, [activeKey, visibleSections]);

  const activeSection = useMemo(
    () => visibleSections.find((s) => s.key === activeKey),
    [visibleSections, activeKey]
  );

  const choiceById = useMemo(() => {
    const map = new Map();
    sections.forEach((s) => (s.choices || []).forEach((c) => map.set(c.id, c)));
    return map;
  }, [sections]);

  const sectionHasToken = useCallback((section, token) => {
    const key = (section?.key || "").toLowerCase();
    const title = (section?.title || "").toLowerCase();
    return key.includes(token) || title.includes(token);
  }, []);

  const sectionKeyLower = useCallback((section) => (section?.key || "").toLowerCase(), []);
  const isGsmFlexKey = useCallback((section) => sectionKeyLower(section).startsWith("gsm_flex_"), [sectionKeyLower]);
  const isGsmOptKey = useCallback((section) => sectionKeyLower(section).startsWith("gsm_opt_"), [sectionKeyLower]);
  const isGsmSoloKey = useCallback((section) => sectionKeyLower(section).startsWith("gsm_solo_"), [sectionKeyLower]);

  // Detect GSM section keys - séparé en Flex, Opt et Solo (basé sur key)
  const gsmSectionInfo = useMemo(() => {
    const flexKeys = [];
    const optKeys = [];
    const soloKeys = [];
    const allGsmKeys = [];

    sections.forEach((s) => {
      if (isGsmFlexKey(s)) {
        allGsmKeys.push(s.key);
        flexKeys.push(s.key);
      } else if (isGsmOptKey(s)) {
        allGsmKeys.push(s.key);
        optKeys.push(s.key);
      } else if (isGsmSoloKey(s)) {
        allGsmKeys.push(s.key);
        soloKeys.push(s.key);
      }
    });

    return { flexKeys, optKeys, soloKeys, allGsmKeys };
  }, [sections, isGsmFlexKey, isGsmOptKey, isGsmSoloKey]);

  const isGsmSection = useCallback(
    (sectionKey) => gsmSectionInfo.allGsmKeys.includes(sectionKey),
    [gsmSectionInfo]
  );

  const isGsmSoloSection = useCallback(
    (sectionKey) => gsmSectionInfo.soloKeys.includes(sectionKey),
    [gsmSectionInfo]
  );

  const isGsmFlexSection = useCallback(
    (sectionKey) => gsmSectionInfo.flexKeys.includes(sectionKey),
    [gsmSectionInfo]
  );

  const isGsmOptSection = useCallback(
    (sectionKey) => gsmSectionInfo.optKeys.includes(sectionKey),
    [gsmSectionInfo]
  );

  // GSM totals
  const gsmTotals = useMemo(() => {
    let soloQty = 0;
    let flexQty = 0;
    let optQty = 0;

    Object.entries(gsmQty).forEach(([idStr, qty]) => {
      const id = Number(idStr);
      const q = Number(qty || 0);
      const c = choiceById.get(id);
      if (!c) return;
      const sec = sections.find((s) => s.id === c.sectionId);
      if (!sec) return;

      if (gsmSectionInfo.soloKeys.includes(sec.key)) {
        soloQty += q;
      } else if (gsmSectionInfo.optKeys.includes(sec.key)) {
        optQty += q;
      } else {
        flexQty += q;
      }
    });

    return { soloQty, flexQty, optQty, totalQty: soloQty + flexQty + optQty };
  }, [gsmQty, choiceById, sections, gsmSectionInfo]);

  const gsmTotalQty = gsmTotals.totalQty;
  const gsmCoreQty = useMemo(() => gsmTotals.flexQty + gsmTotals.soloQty, [gsmTotals.flexQty, gsmTotals.soloQty]);
  const gsmFlexQtyForDiscount = useMemo(() => {
    let qty = 0;
    Object.entries(gsmQty).forEach(([idStr, q]) => {
      const id = Number(idStr);
      const c = choiceById.get(id);
      if (!c) return;
      const sec = sections.find((s) => s.id === c.sectionId);
      if (!sec) return;
      if (isGsmFlexKey(sec)) {
        qty += Number(q || 0);
      }
    });
    return qty;
  }, [gsmQty, choiceById, sections, isGsmFlexKey]);

  const gsmFlexDiscount = useMemo(
    () => (gsmFlexQtyForDiscount > 1 ? (gsmFlexQtyForDiscount - 1) * 5 : 0),
    [gsmFlexQtyForDiscount]
  );

  const getSectionKeyForChoice = useCallback(
    (choiceId) => {
      const c = choiceById.get(choiceId);
      if (!c) return null;
      const sec = sections.find((s) => s.id === c.sectionId);
      return sec?.key || null;
    },
    [choiceById, sections]
  );

  const setGsmQuantity = useCallback(
    (choiceId, nextQty) => {
      const sectionKey = getSectionKeyForChoice(choiceId);
      const isSoloSection = sectionKey ? isGsmSoloSection(sectionKey) : false;
      const isOptSection = sectionKey ? isGsmOptSection(sectionKey) : false;
      const qty = Math.max(0, Number(nextQty || 0));

      setGsmQty((prev) => {
        if (qty === 0) {
          const copy = { ...prev };
          delete copy[choiceId];
          return copy;
        }

        if (isSoloSection) {
          return { ...prev, [choiceId]: qty };
        }

        let currentFlexTotal = 0;
        let currentOptTotal = 0;
        Object.entries(prev).forEach(([idStr, q]) => {
          const id = Number(idStr);
          const secKey = getSectionKeyForChoice(id);
          const isThisSolo = secKey ? isGsmSoloSection(secKey) : false;
          if (!isThisSolo && secKey && isGsmOptSection(secKey)) {
            currentOptTotal += Number(q || 0);
          } else if (!isThisSolo) {
            currentFlexTotal += Number(q || 0);
          }
        });

        const currentQty = Number(prev[choiceId] || 0);
        if (isOptSection) {
          const optWithoutThis = currentOptTotal - currentQty;
          if (optWithoutThis + qty > GSM_FLEX_MAX) {
            return prev;
          }
        } else {
          const flexWithoutThis = currentFlexTotal - currentQty;
          if (flexWithoutThis + qty > GSM_FLEX_MAX) {
            return prev;
          }
        }

        return { ...prev, [choiceId]: qty };
      });
    },
    [getSectionKeyForChoice, isGsmSoloSection, isGsmOptSection]
  );

  const incGsm = useCallback(
    (choiceId) => setGsmQuantity(choiceId, Number(gsmQty[choiceId] || 0) + 1),
    [gsmQty, setGsmQuantity]
  );
  const decGsm = useCallback(
    (choiceId) => setGsmQuantity(choiceId, Number(gsmQty[choiceId] || 0) - 1),
    [gsmQty, setGsmQuantity]
  );

  // Totals
  const totals = useMemo(() => {
    let y1 = 0;
    let y2 = 0;

    selectedIds.forEach((id) => {
      const c = choiceById.get(id);
      if (!c) return;
      y1 += Number(c.priceY1 || 0);
      y2 += Number(c.priceY2 || 0);
    });

    Object.entries(gsmQty).forEach(([idStr, qty]) => {
      const id = Number(idStr);
      const c = choiceById.get(id);
      if (!c) return;
      const q = Number(qty || 0);
      y1 += Number(c.priceY1 || 0) * q;
      y2 += Number(c.priceY2 || 0) * q;
    });

    // GSM Flex promo: -5€ sur Y2 si quantite Flex >= 2 (une seule fois)
    if (gsmFlexDiscount > 0) {
      y2 -= gsmFlexDiscount;
    }

    return { y1, y2 };
  }, [selectedIds, gsmQty, choiceById, gsmFlexDiscount]);

  // Pack label
  const packLabel = useMemo(() => {
    const packSec =
      sections.find((s) => s.key === "pack_type") ||
      sections.find((s) => sectionHasToken(s, "pack")) ||
      null;

    if (!packSec) return "";
    const packChoiceId = selectedSingle[packSec.key];
    if (!packChoiceId) return "";
    const c = choiceById.get(Number(packChoiceId));
    return c?.label || "";
  }, [sections, selectedSingle, choiceById, sectionHasToken]);

  const packChoiceKey = useMemo(() => {
    const packSec =
      sections.find((s) => s.key === "pack_type") ||
      sections.find((s) => sectionHasToken(s, "pack")) ||
      null;
    if (!packSec) return "";
    const packChoiceId = selectedSingle[packSec.key];
    if (!packChoiceId) return "";
    const c = choiceById.get(Number(packChoiceId));
    return c?.key || "";
  }, [sections, selectedSingle, choiceById, sectionHasToken]);

  const gsmSelected = useMemo(() => gsmCoreQty > 0, [gsmCoreQty]);

  const computedPackType = useMemo(() => {
    const p = (packLabel || "").trim();
    if (!p) return "";
    if (p.toLowerCase() === "go") return "Internet Seul";
    if (p.toLowerCase().includes("flex") && p.toLowerCase().includes("xs"))
      return "Internet + mobiles";
    if (p.toLowerCase().includes("flex") && p.toLowerCase().includes("s"))
      return "Internet TV mobiles";
    if (p.toLowerCase().includes("flex+")) return "Int + TV + FIXE + Mobile";
    return "";
  }, [packLabel]);

  const computedAlert = useMemo(() => {
    const p = (packLabel || "").trim();
    if (!p) return "Offre financière";

    const lower = p.toLowerCase();
    const isXS = lower.includes("xs");
    const isFlexS = lower.includes("flex") && lower.includes(" s") && !isXS;
    const isFlex = lower.includes("flex+") && !isXS;

    if (isXS) return "Offre Cadeau Interdite XS!";
    if ((isFlexS || isFlex) && !gsmSelected) return "Offre Cadeau Interdite Sans GSM!";
    if (isFlexS || isFlex) return "Informer le client de l'avance et de l'IBAN";
    return "Offre financière";
  }, [packLabel, gsmSelected]);

  const promoSection = useMemo(() => {
    return sections.find(
      (s) =>
        (s.key || "").toLowerCase().includes("promotion") ||
        (s.title || "").toLowerCase().includes("promotion")
    );
  }, [sections]);

  const hasPromoSelected = useCallback(() => {
    if (!promoSection) return false;
    const secKey = promoSection.key;
    const secType = promoSection.type || "single";
    if (secType === "multi") {
      const promoSelections = selectedMulti[secKey] || [];
      return promoSelections.length > 0;
    }
    return !!selectedSingle[secKey];
  }, [promoSection, selectedMulti, selectedSingle]);

  // Selected Promotion Label
  const selectedPromoLabel = useMemo(() => {
    if (!promoSection) return "";

    const secKey = promoSection.key;
    // Single
    if (selectedSingle[secKey]) {
      const c = choiceById.get(Number(selectedSingle[secKey]));
      // Si c'est un enfant (cadeau), on veut le label du parent ("Cadeaux") !
      if (c?.parentId) {
        const parent = choiceById.get(Number(c.parentId));
        return parent?.label || "";
      }
      return c?.label || "";
    }
    // Multi (take first)
    if (selectedMulti[secKey] && selectedMulti[secKey].length > 0) {
      const c = choiceById.get(Number(selectedMulti[secKey][0]));
      // Check parent here too if needed
      if (c?.parentId) {
        const parent = choiceById.get(Number(c.parentId));
        return parent?.label || "";
      }
      return c?.label || "";
    }
    return "";
  }, [promoSection, selectedSingle, selectedMulti, choiceById]);

  const isCadeauxSelected = useMemo(() => {
    if (!promoSection) return false;
    const secKey = promoSection.key;
    const secType = promoSection.type || "single";
    const ids =
      secType === "multi"
        ? (selectedMulti[secKey] || []).map((id) => Number(id))
        : selectedSingle[secKey]
        ? [Number(selectedSingle[secKey])]
        : [];

    return ids.some((id) => {
      const c = choiceById.get(id);
      if (!c) return false;
      const label = (c.label || "").toLowerCase();
      if (label.includes("cadeaux")) return true;
      if (c.parentId) {
        const parent = choiceById.get(Number(c.parentId));
        const parentLabel = (parent?.label || "").toLowerCase();
        if (parentLabel.includes("cadeaux")) return true;
      }
      return false;
    });
  }, [promoSection, selectedMulti, selectedSingle, choiceById]);

  const isCadeauOrSansPromo = useMemo(() => {
    const p = (selectedPromoLabel || "").toLowerCase();
    return p.includes("cadeaux") || p.includes("sans promo");
  }, [selectedPromoLabel]);

  const tvPackKeys = useMemo(() => new Set(["flex_easy"]), []);
  const internetPackKeys = useMemo(
    () => new Set(["packflex", "flex_xs", "Giga_Fiber", "Ultra_Fiber"]),
    []
  );

  const hasTvPackSelected = useMemo(() => {
    if (packChoiceKey) return tvPackKeys.has(packChoiceKey);
    const packSec = sections.find((s) => s.key === "pack_type");
    if (!packSec) return false;
    const secKey = packSec.key;
    const ids = selectedMulti[secKey] || [];
    return ids.some((id) => tvPackKeys.has(choiceById.get(Number(id))?.key));
  }, [tvPackKeys, packChoiceKey, sections, selectedMulti, choiceById]);

  const hasInternetPackSelected = useMemo(() => {
    if (packChoiceKey) return internetPackKeys.has(packChoiceKey);
    const packSec = sections.find((s) => s.key === "pack_type");
    if (!packSec) return false;
    const secKey = packSec.key;
    const ids = selectedMulti[secKey] || [];
    return ids.some((id) => internetPackKeys.has(choiceById.get(Number(id))?.key));
  }, [internetPackKeys, packChoiceKey, sections, selectedMulti, choiceById]);



  const isPromo6Mois = useMemo(() => {
    const p = (selectedPromoLabel || "").toLowerCase();
    return p.includes("6 mois") || p.includes("6mois");
  }, [selectedPromoLabel]);

  // Selection handlers
  const toggleMulti = (sectionKey, choiceId) => {
    setSelectedMulti((prev) => {
      const cur = Array.isArray(prev[sectionKey]) ? prev[sectionKey] : [];
      const exists = cur.includes(choiceId);
      const next = exists ? cur.filter((x) => x !== choiceId) : [...cur, choiceId];
      return { ...prev, [sectionKey]: next };
    });
  };

  const setSingle = (sectionKey, choiceId) => {
    setSelectedSingle((prev) => ({ ...prev, [sectionKey]: choiceId }));
  };

  const resetSelection = () => {
    setSelectedSingle({});
    setSelectedMulti({});
    setGsmQty({});
    setOk("");
    setErr("");
  };


  // Summary items
  const summaryItems = useMemo(() => {
    const items = [];

    for (const sec of sections) {
      if (isGsmSection(sec.key)) continue;

      const secTitle = sec.title || sec.key;
      const type = sec.type || "single";

      if (type === "multi") {
        const arr = selectedMulti[sec.key] || [];
        arr.forEach((id) => {
          const c = choiceById.get(Number(id));
          if (!c) return;
          items.push({ secTitle, label: c.label, y1: c.priceY1, y2: c.priceY2, qty: 1 });
        });
      } else {
        const id = selectedSingle[sec.key];
        if (!id) continue;
        const c = choiceById.get(Number(id));
        if (!c) continue;
        items.push({ secTitle, label: c.label, y1: c.priceY1, y2: c.priceY2, qty: 1 });
      }
    }

    const gsmSec =
      sections.find((s) => isGsmSection(s.key)) ||
      sections.find((s) => (s.title || "").toLowerCase().includes("gsm")) ||
      null;

    const gsmTitle = gsmSec?.title || "GSM";

    Object.entries(gsmQty)
      .filter(([_, qty]) => Number(qty) > 0)
      .forEach(([idStr, qty]) => {
        const id = Number(idStr);
        const c = choiceById.get(id);
        if (!c) return;
        items.push({
          secTitle: gsmTitle,
          label: c.label,
          y1: c.priceY1,
          y2: c.priceY2,
          qty: Number(qty),
        });
      });

    return items;
  }, [sections, selectedSingle, selectedMulti, gsmQty, choiceById, isGsmSection]);

  // Required + format
  const requiredMissing = useMemo(() => {
    const miss = [];
    if (!client.civility.trim()) miss.push("Civilité");
    if (!client.lastName.trim()) miss.push("Nom");
    if (!client.firstName.trim()) miss.push("Prénom");
    if (!client.email.trim()) miss.push("Email");
    if (!client.phone.trim()) miss.push("Téléphone");
    return miss;
  }, [client]);

  const isClientFormatOk = useMemo(() => {
    return isValidEmail(client.email) && isValidBeMobile(client.phone);
  }, [client.email, client.phone]);

  const hasAnySelection = useMemo(() => {
    return selectedIds.length > 0 || gsmTotalQty > 0;
  }, [selectedIds, gsmTotalQty]);

  const canSend = useMemo(() => {
    if (requiredMissing.length > 0) return false;
    if (!isClientFormatOk) return false;
    if (!hasAnySelection) return false;
    return true;
  }, [requiredMissing, isClientFormatOk, hasAnySelection]);

  const sendToBackOffice = async () => {
    if (sending) return;
    setErr("");
    setOk("");

    if (!canSend) {
      validateClient(client);
      setErr(
        "⚠️ Champs requis manquants / format invalide / pas de sélection.\n" +
        (requiredMissing.length ? `Manquant: ${requiredMissing.join(", ")}\n` : "") +
        (!isClientFormatOk ? "Format invalide: email ou mobile.\n" : "") +
        (!hasAnySelection ? "Sélectionne au moins une option." : "")
      );
      return;
    }

    const okClient = validateClient(client);
    if (!okClient) {
      setErr("⚠️ Email ou téléphone invalide. Corrige les champs avant d'envoyer.");
      return;
    }

    // ✅ VALIDATION STATIQUE: Vérifier qu'au moins une promotion est sélectionnée
    if (promoSection && !hasPromoSelected()) {
      setErr("⚠️ Vous devez sélectionner au minimum une promotion avant l’envoi de l’offre.");
      return;
    }

    // ✅ VALIDATION: Si promo = "Cadeaux", GSM Flex + Internet + TV requis
    if (promoSection && hasPromoSelected()) {
      if (isCadeauxSelected) {
        if (gsmFlexQtyForDiscount === 0) {
          setErr("⚠️ Pour une promotion Cadeaux, sélectionnez au moins un GSM Flex.");
          return;
        }
        if (!hasTvPackSelected || !hasInternetPackSelected) {
          setErr("⚠️ Pour une promotion Cadeaux, sélectionnez 1 TV Proximus et 1 Internet dans Pack Flex.");
          return;
        }
      }
    }

    setSending(true);
    try {
      const gsmItems = Object.entries(gsmQty)
        .filter(([_, qty]) => Number(qty) > 0)
        .map(([choiceId, qty]) => ({ choiceId: Number(choiceId), qty: Number(qty) }));

      const gsmChoiceIds = gsmItems.map((item) => item.choiceId);
      const allChoiceIds = Array.from(
        new Set([...(selectedIds || []), ...gsmChoiceIds])
      ).filter(Boolean);

      const payload = {
        customerName: `${client.civility?.trim() || ""} ${client.firstName?.trim() || ""} ${client.lastName?.trim() || ""
          }`.trim(),
        customerEmail: normalizeEmail(client.email),
        customerPhone: normalizeBeMobile(client.phone),

        choiceIds: allChoiceIds,
        gsmItems,
        status: "TO_SEND",
        packTypeLabel: computedPackType,
        alertMessage: computedAlert,
        totalY1: totals.y1,
        totalY2: totals.y2,
      };

      const { data } = await api.post("/quotes/", payload);

      setOk(
        `✅ Devis envoyé au Back-Office avec succès!\n` +
        `ID: ${data?.quote?.id || data?.id || "id inconnu"}\n` +
        `Total Y1: ${money(totals.y1)} | Total Y2: ${money(totals.y2)}\n` +
        `Réinitialisation automatique dans 3 secondes.`
      );

      // ✅ AUTO-CLEAR: Réinitialiser toutes les informations après envoi réussi
      setTimeout(() => {
        resetSelection();
        setClient({ civility: "", lastName: "", firstName: "", email: "", phone: "" });
        setClientErrors({ email: "", phone: "" });
        setOk("");
        setErr("");
        setSending(false);
      }, 3000);
    } catch (e) {
      const msg = e?.response?.data?.message || e?.response?.data?.error || e?.message || "500";
      setErr("⚠️ Erreur envoi devis (Back-Office).\n" + msg);
      setSending(false);
    }
  };

  return (
    <div style={styles.page}>
      <div style={styles.shell}>
        <div style={styles.header}>
          <div style={styles.titleRow}>
            <h1 style={styles.h1}>Matrice Proximus</h1>

            <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
              <div style={styles.badge}>
                👤 {currentUser?.name || "Utilisateur"}
              </div>
            </div>
          </div>

          {/* Client fields */}
          <div style={styles.gridTop}>
            <div style={styles.field}>
              <div style={styles.label}>👤 Civilité *</div>
              <select
                style={styles.select}
                className="matrix-select"
                value={client.civility}
                onChange={(e) => setClient((p) => ({ ...p, civility: e.target.value }))}
              >
                <option value="">-- Choisir --</option>
                <option value="Monsieur">Monsieur</option>
                <option value="Madame">Madame</option>
                <option value="Pro">Pro</option>
              </select>
            </div>
            <div style={styles.field}>
              <div style={styles.label}>👤 Nom du client *</div>
              <input
                style={styles.input}
                value={client.lastName}
                onChange={(e) => setClient((p) => ({ ...p, lastName: e.target.value }))}
                placeholder="Nom"
              />
            </div>

            <div style={styles.field}>
              <div style={styles.label}>👤 Prénom du client *</div>
              <input
                style={styles.input}
                value={client.firstName}
                onChange={(e) => setClient((p) => ({ ...p, firstName: e.target.value }))}
                placeholder="Prénom"
              />
            </div>

            <div style={styles.field}>
              <div style={styles.label}>📧 Email client *</div>
              <input
                style={styles.input}
                value={client.email}
                onChange={(e) => setClient((p) => ({ ...p, email: e.target.value }))}
                onBlur={() => validateClient(client)}
                placeholder="client@exemple.com"
                type="email"
              />
              {clientErrors.email ? <div style={styles.tinyError}>{clientErrors.email}</div> : null}
            </div>

            <div style={styles.field}>
              <div style={styles.label}>📱 Téléphone / GSM *</div>
              <input
                style={styles.input}
                value={client.phone}
                onChange={(e) => {
                  const digits = normalizeBeMobile(e.target.value).slice(0, 10);
                  setClient((p) => ({ ...p, phone: digits }));
                }}
                onBlur={() => validateClient(client)}
                placeholder="0470123456"
                inputMode="numeric"
              />
              {clientErrors.phone ? <div style={styles.tinyError}>{clientErrors.phone}</div> : null}
            </div>
          </div>

          {/* Pack type + Alert */}
          <div style={styles.alertRow}>
            <div style={styles.card}>
              <p style={styles.cardTitle}>📦 Type de pack (auto)</p>
              <div style={styles.cardValue}>{computedPackType || "—"}</div>
              <div style={{ ...styles.tiny, marginTop: 4 }}>
                Basé sur le pack sélectionné
              </div>
            </div>

            <div style={styles.card}>
              <p style={styles.cardTitle}>⚠️ Alerte (auto)</p>
              <div style={err ? styles.alertBoxError : styles.alertBox}>
                {err || computedAlert}
              </div>
              <div style={{ ...styles.tiny, marginTop: 4 }}>
                {err ? "❌ Erreur de validation" : "✅ Règles automatiques"}
              </div>
            </div>
          </div>
        </div>

        <div style={styles.mainGrid}>
          {/* Left menu */}
          <div style={{ ...styles.card, ...styles.side }}>
            <div style={styles.sectionHead}>
              <h3 style={styles.sectionTitle}>📋 Menu</h3>
              <span style={styles.tiny}>
                {loading ? "⏳" : `${visibleSections.length} sections`}
              </span>
            </div>

            <div style={{ marginTop: 10 }}>
              {visibleSections.map((sec) => {
                const icon = getSectionIcon(sec.key, sec.title);
                return (
                  <button
                    key={sec.key}
                    style={styles.menuBtn(sec.key === activeKey)}
                    onClick={() => setActiveKey(sec.key)}
                    type="button"
                  >
                    {icon} {sec.title || sec.key}
                  </button>
                );
              })}
            </div>

            <div style={styles.divider} />

            <button style={styles.btn("secondary")} onClick={resetSelection} type="button">
              🔄 Réinitialiser
            </button>
          </div>

          {/* Center: active section */}
          <div style={styles.card}>
            <div style={styles.sectionHead}>
              <h3 style={styles.sectionTitle}>
                {activeSection ? `${getSectionIcon(activeSection.key, activeSection.title)} ${activeSection.title}` : "Matrice"}
              </h3>

              {activeSection && isGsmFlexSection(activeSection.key) ? (
                <span style={styles.tiny}>
                  📱 GSM Flex: {gsmTotals.flexQty}/{GSM_FLEX_MAX}
                </span>
              ) : activeSection && isGsmSoloSection(activeSection.key) ? (
                <span style={styles.tiny}>📱 GSM Solo: {gsmTotals.soloQty} (∞)</span>
              ) : (
                <span style={styles.tiny}>
                  {activeSection?.type === "multi" ? "☑️ Multi" : "⭕ Single"}
                </span>
              )}
            </div>

            {loading ? (
              <div style={{ marginTop: 10, opacity: 0.9 }}>⏳ Chargement...</div>
            ) : !activeSection ? (
              <div style={{ marginTop: 10, opacity: 0.9 }}>Aucune section disponible.</div>
            ) : (
              <div style={styles.choiceList}>
                {(() => {
                  // 1. Root vs Children
                  const choices = activeSection.visibleChoices || [];
                  const roots = choices
                    .filter((c) => !c.parentId)
                    .sort((a, b) => (a.sortOrder || 0) - (b.sortOrder || 0));

                  // Children map
                  const childrenMap = new Map();
                  choices.filter(c => c.parentId).forEach(child => {
                    if (!childrenMap.has(child.parentId)) childrenMap.set(child.parentId, []);
                    childrenMap.get(child.parentId).push(child);
                  });
                  // Sort children lists
                  childrenMap.forEach(list => list.sort((a, b) => (a.sortOrder || 0) - (b.sortOrder || 0)));

                  return roots.map((c) => {
                    const showQty = isGsmSection(activeSection.key);
                    const secType = activeSection.type || "single";

                    const isSelectedNonGsm =
                      secType === "multi"
                        ? (selectedMulti[activeSection.key] || []).includes(c.id)
                        : Number(selectedSingle[activeSection.key] || 0) === Number(c.id);

                    const qty = Number(gsmQty[c.id] || 0);
                    const gsmChecked = qty > 0;

                    // Logic to see if "Parent" is visually selected (itself OR one of its children)
                    const myChildren = childrenMap.get(c.id) || [];
                    const hasChildren = myChildren.length > 0;

                    // Current selected ID in this section
                    const currentSelectedId = Number(selectedSingle[activeSection.key] || 0);

                    // Is this parent selected directly?
                    const isSelfSelected = currentSelectedId === c.id;
                    // Is one of its children selected?
                    const isChildSelected = myChildren.some(child => child.id === currentSelectedId);

                    // Visual state: Parent looks selected if itself/child is active
                    const isParentVisuallySelected = isSelfSelected || isChildSelected;

                    // Which child is active?
                    const activeChildId = isChildSelected ? currentSelectedId : "";

                    const selectedForCard = showQty ? gsmChecked : isParentVisuallySelected;

                    const click = () => {
                      if (!showQty) {
                        if (secType === "multi") {
                          toggleMulti(activeSection.key, c.id);
                        } else {
                          // If has children, resetting to Parent ID
                          setSingle(activeSection.key, c.id);
                        }
                        return;
                      }

                      if (qty > 0) {
                        setGsmQuantity(c.id, 0);
                      } else {
                        const isSoloSec = isGsmSoloSection(activeSection.key);
                        const isOptSec = isGsmOptSection(activeSection.key);
                        if (isSoloSec || (isOptSec ? gsmTotals.optQty < GSM_FLEX_MAX : gsmTotals.flexQty < GSM_FLEX_MAX)) {
                          setGsmQuantity(c.id, 1);
                        }
                      }
                    };

                    const canDec = qty > 0;
                    const isSoloSection = isGsmSoloSection(activeSection.key);
                    const isOptSection = isGsmOptSection(activeSection.key);
                    const canInc = isSoloSection
                      ? true
                      : isOptSection
                      ? gsmTotals.optQty < GSM_FLEX_MAX
                      : gsmTotals.flexQty < GSM_FLEX_MAX;

                    return (
                      <div
                        key={c.id}
                        style={styles.choiceCard(selectedForCard)}
                        onClick={click}
                        role="button"
                        tabIndex={0}
                        onKeyDown={(e) => e.key === "Enter" && click()}
                      >
                        <div style={styles.choiceTop}>
                          <p style={styles.choiceLabel}>
                            {showQty
                              ? gsmChecked ? "☑ " : "☐ "
                              : secType === "multi"
                                ? isSelectedNonGsm ? "☑ " : "☐ "
                                : isParentVisuallySelected ? "◉ " : "○ "}
                            {c.label}
                          </p>

                          <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                            {showQty ? (
                              <div
                                style={styles.qtyWrap}
                                onClick={(e) => e.stopPropagation()}
                                title={
                                  isSoloSection
                                    ? `Solo: ${qty} (illimité)`
                                    : `Flex: ${gsmTotals.flexQty}/${GSM_FLEX_MAX}`
                                }
                              >
                                <button
                                  type="button"
                                  style={{
                                    ...styles.qtyBtn,
                                    ...(canDec ? {} : styles.qtyBtnDisabled),
                                  }}
                                  onClick={() => decGsm(c.id)}
                                  disabled={!canDec}
                                >
                                  -
                                </button>

                                <div style={styles.qtyBox}>{qty}</div>

                                <button
                                  type="button"
                                  style={{
                                    ...styles.qtyBtn,
                                    ...(canInc ? {} : styles.qtyBtnDisabled),
                                  }}
                                  onClick={() => incGsm(c.id)}
                                  disabled={!canInc}
                                >
                                  +
                                </button>
                              </div>
                            ) : null}

                            <div style={styles.price}>
                              Y1: {money(c.priceY1)} / Y2: {money(c.priceY2)}
                            </div>
                          </div>
                        </div>
                        {/* DROPDOWN SUB-CHOICE */}
                        {hasChildren && isParentVisuallySelected && (
                          <div
                            style={{ marginTop: 12, paddingLeft: 24, paddingRight: 10 }}
                            onClick={(e) => e.stopPropagation()}
                          >
                            <div style={{ marginBottom: 4, fontSize: 13, fontWeight: "bold", color: "#82aaff" }}>
                              🎁 Sélectionner le cadeau :
                            </div>
                            <select
                              style={{
                                width: "100%",
                                padding: "8px",
                                borderRadius: 8,
                                border: "1px solid rgba(255,255,255,0.2)",
                                background: "#19202c",
                                color: "white",
                                fontSize: 14,
                                outline: "none"
                              }}
                              value={activeChildId}
                              onChange={(e) => {
                                const val = Number(e.target.value);
                                setSingle(activeSection.key, val ? val : c.id);
                              }}
                            >
                              <option value="">-- Aucun cadeau --</option>
                              {myChildren.map(child => (
                                <option key={child.id} value={child.id}>
                                  {child.label} ({money(child.priceY1)})
                                </option>
                              ))}
                            </select>
                          </div>
                        )}
                      </div>
                    );
                  });
                })()}
              </div>
            )}
          </div>

          {/* Right: summary & totals & send */}
          <div style={{ ...styles.card, position: "sticky", top: 12 }}>
            <div style={styles.sectionHead}>
              <h3 style={styles.sectionTitle}>📊 Résumé</h3>
              <span style={styles.tiny}>Auto</span>
            </div>

            <div style={{ marginTop: 8 }}>
              {summaryItems.length === 0 ? (
                <div style={{ ...styles.tiny, padding: 8, opacity: 0.9 }}>
                  Aucun choix pour le moment.
                </div>
              ) : (
                <>
                  {summaryItems.slice(0, 15).map((it, idx) => (
                    <div key={idx} style={styles.summaryLine}>
                      <div style={{ opacity: 0.92 }}>
                        <div style={{ fontWeight: 800, fontSize: 10, opacity: 0.8 }}>
                          {it.secTitle}
                        </div>
                        <div style={{ fontWeight: 800 }}>
                          {it.label}
                          {it.qty > 1 ? ` (x${it.qty})` : ""}
                        </div>
                      </div>
                      <div style={{ textAlign: "right", opacity: 0.9 }}>
                        <div>Y1 {money(Number(it.y1 || 0) * Number(it.qty || 1))}</div>
                        <div>Y2 {money(Number(it.y2 || 0) * Number(it.qty || 1))}</div>
                      </div>
                    </div>
                  ))}
                  {summaryItems.length > 15 ? (
                    <div style={{ ...styles.tiny, marginTop: 4, opacity: 0.85 }}>
                      + {summaryItems.length - 15} autres éléments…
                    </div>
                  ) : null}
                </>
              )}

              <div style={styles.divider} />

              <div style={{ display: "grid", gap: 8 }}>
                <div style={styles.card}>
                  <p style={styles.cardTitle}>💰 Total mensuel</p>
                  <div style={{ display: "flex", gap: 8, marginTop: 6 }}>
                    {isCadeauOrSansPromo ? (
                      <div style={{ flex: 1 }}>
                        <div style={{ fontSize: 16, fontWeight: 950 }}>{money(totals.y2)}</div>
                      </div>
                    ) : isPromo6Mois ? (
                      <>
                        <div style={{ flex: 1 }}>
                          <div style={{ ...styles.tiny, marginBottom: 4 }}>Pendant 6 mois</div>
                          <div style={{ fontSize: 16, fontWeight: 950 }}>{money(totals.y1)}</div>
                        </div>
                        <div style={{ flex: 1 }}>
                          <div style={{ ...styles.tiny, marginBottom: 4 }}>Après 6 mois</div>
                          <div style={{ fontSize: 16, fontWeight: 950 }}>{money(totals.y2)}</div>
                        </div>
                      </>
                    ) : (
                      <>
                        <div style={{ flex: 1 }}>
                          <div style={{ ...styles.tiny, marginBottom: 4 }}>Année 1</div>
                          <div style={{ fontSize: 16, fontWeight: 950 }}>{money(totals.y1)}</div>
                        </div>
                        <div style={{ flex: 1 }}>
                          <div style={{ ...styles.tiny, marginBottom: 4 }}>Année 2</div>
                          <div style={{ fontSize: 16, fontWeight: 950 }}>{money(totals.y2)}</div>
                        </div>
                      </>
                    )}
                  </div>
                  {gsmFlexDiscount > 0 ? (
                    <div style={{ ...styles.tiny, marginTop: 8, color: "#bfe0ff" }}>
                      Promo GSM Flex appliquée: -{money(gsmFlexDiscount)} sur Y2
                    </div>
                  ) : null}
                </div>

                <button
                  style={styles.btn("primary")}
                  onClick={sendToBackOffice}
                  disabled={!canSend || sending}
                  type="button"
                >
                  {sending ? "Envoi..." : "🚀 Envoyer au Back-Office"}
                </button>

                {!canSend && (
                  <div style={{ ...styles.tiny, opacity: 0.9, color: "#ffb3b3" }}>
                    {requiredMissing.length
                      ? `⚠️ Champs requis: ${requiredMissing.join(", ")}`
                      : !isClientFormatOk
                        ? "⚠️ Email ou mobile invalide"
                        : !hasAnySelection
                          ? "⚠️ Fais au moins une sélection"
                          : ""}
                  </div>
                )}

                {ok ? (
                  <div
                    style={{
                      marginTop: 8,
                      padding: 10,
                      borderRadius: 12,
                      background: "rgba(0,255,170,0.15)",
                      border: "1px solid rgba(0,255,170,0.30)",
                      color: "#c9ffef",
                      fontSize: 11,
                      whiteSpace: "pre-wrap",
                      fontWeight: 600,
                    }}
                  >
                    {ok}
                  </div>
                ) : null}

                <div style={{ ...styles.tiny, opacity: 0.7, marginTop: 4 }}>
                  💡 Le Back-Office transmettra l’offre au client.'
                </div>
              </div>
            </div>
          </div>
        </div>

        <div style={{ ...styles.tiny, opacity: 0.6, marginTop: 12, textAlign: "center" }}>
          💻 Backend: <span style={{ fontWeight: 900 }}>/api/matrix/runtime</span>
        </div>
      </div>

      <style>{`
        @keyframes pulse {
          0%, 100% { opacity: 1; }
          50% { opacity: 0.7; }
        }
      `}</style>
    </div>
  );
}
