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
    background: "transparent",
    minHeight: "100vh",
    padding: 20,
    color: "#ffffff",
    borderRadius: 15,
  },
  shell: { maxWidth: 1900, margin: "0 auto" },
  zoomWrap: { transform: "scale(0.9)", transformOrigin: "top center" },
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
    if (variant === "preview") {
      return {
        ...base,
        background: "linear-gradient(135deg, rgba(34,197,94,0.95), rgba(16,185,129,0.85))",
        color: "#ffffff",
        border: "1px solid rgba(16,185,129,0.65)",
        boxShadow: "0 6px 16px rgba(16,185,129,0.25)",
        textShadow: "0 1px 2px rgba(0,0,0,0.35)",
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
  if (!(digits.startsWith("04") && digits.length === 10)) return false;
  if (digits === "0400000000") return false;
  return true;
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
  // Quantité pour choix non-GSM (ex: Wifi Booster)
  const [choiceQty, setChoiceQty] = useState({});

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
  const [errKind, setErrKind] = useState("");
  const [ok, setOk] = useState("");
  const [lastSentPreviewHtml, setLastSentPreviewHtml] = useState("");
  const [showPreview, setShowPreview] = useState(false);
  const [sending, setSending] = useState(false);
  const [attemptedSend, setAttemptedSend] = useState(false);
  const [dataPhoneNote, setDataPhoneNote] = useState("");


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
    setErrKind("");

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
        setErrKind("system");
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
    Object.values(selectedMulti).forEach((arr) => {
      const list = Array.isArray(arr) ? arr : arr ? [arr] : [];
      list.forEach((id) => ids.push(Number(id)));
    });
    Object.entries(choiceQty)
      .filter(([_, qty]) => Number(qty) > 0)
      .forEach(([idStr]) => ids.push(Number(idStr)));
    return Array.from(new Set(ids));
  }, [selectedSingle, selectedMulti, choiceQty]);

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
  const sectionTitleLower = useCallback((section) => (section?.title || "").toLowerCase(), []);
  const isGsmFlexKey = useCallback(
    (section) => {
      const key = sectionKeyLower(section);
      if (key.startsWith("gsm_flex")) return true;
      const title = sectionTitleLower(section);
      return title.includes("gsm") && title.includes("flex");
    },
    [sectionKeyLower, sectionTitleLower]
  );
  const isGsmOptKey = useCallback(
    (section) => {
      const key = sectionKeyLower(section);
      if (key.startsWith("gsm_opt_") || key.startsWith("gsm_option")) return true;
      const title = sectionTitleLower(section);
      return title.includes("gsm") && (title.includes("opt") || title.includes("option"));
    },
    [sectionKeyLower, sectionTitleLower]
  );
  const isGsmSoloKey = useCallback(
    (section) => {
      const key = sectionKeyLower(section);
      if (key.startsWith("gsm_solo_")) return true;
      const title = sectionTitleLower(section);
      return title.includes("gsm") && title.includes("solo");
    },
    [sectionKeyLower, sectionTitleLower]
  );

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
  const qtyByChoice = useMemo(() => {
    const map = new Map();
    Object.entries(gsmQty).forEach(([idStr, qty]) => {
      const id = Number(idStr);
      if (Number.isFinite(id)) map.set(id, Number(qty || 0));
    });
    Object.entries(choiceQty).forEach(([idStr, qty]) => {
      const id = Number(idStr);
      if (Number.isFinite(id)) map.set(id, Number(qty || 0));
    });
    return map;
  }, [gsmQty, choiceQty]);
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

  const promoSection = useMemo(() => {
    return sections.find(
      (s) =>
        (s.key || "").toLowerCase().includes("promotion") ||
        (s.title || "").toLowerCase().includes("promotion")
    );
  }, [sections]);

  // Promo: récupérer les choix sélectionnés (single ou multi)
  const promoSelectedIds = useMemo(() => {
    if (!promoSection) return [];
    const secKey = promoSection.key;
    const secType = promoSection.type || "single";
    if (secType === "multi") {
      return (selectedMulti[secKey] || []).map((id) => Number(id));
    }
    return selectedSingle[secKey] ? [Number(selectedSingle[secKey])] : [];
  }, [promoSection, selectedMulti, selectedSingle]);

  // Promo: libellés pour les contrôles rapides
  const promoSelectedLabels = useMemo(() => {
    return promoSelectedIds
      .map((id) => choiceById.get(id)?.label || "")
      .filter(Boolean);
  }, [promoSelectedIds, choiceById]);

  // Détecter "Sans promo" sur le choix ou son parent
  const isSansPromoChoice = useCallback(
    (choice) => {
      if (!choice) return false;
      const label = (choice.label || "").toLowerCase();
      if (label.includes("sans promo")) return true;
      if (choice.parentId) {
        const parent = choiceById.get(Number(choice.parentId));
        const parentLabel = (parent?.label || "").toLowerCase();
        if (parentLabel.includes("sans promo")) return true;
      }
      return false;
    },
    [choiceById]
  );

  // Vrai si une promo sélectionnée n'est PAS "Sans promo"
  const hasNonSansPromoSelected = useMemo(() => {
    if (!promoSelectedIds.length) return false;
    return promoSelectedIds.some((id) => {
      const c = choiceById.get(id);
      return c ? !isSansPromoChoice(c) : false;
    });
  }, [promoSelectedIds, choiceById, isSansPromoChoice]);

  // Vrai si GSM Solo main est sélectionné (ignore la section promo)
  const hasGsmSoloMainSelected = useMemo(() => {
    const isSoloMain = (choiceId) => {
      const secKey = getSectionKeyForChoice(Number(choiceId));
      return (secKey || "").toLowerCase() === "gsm_solo_main";
    };
    const isPromoChoiceId = (choiceId) => {
      if (!promoSection) return false;
      const c = choiceById.get(Number(choiceId));
      return c && Number(c.sectionId) === Number(promoSection.id);
    };

    const hasGsmQty = Object.entries(gsmQty).some(([idStr, qty]) => {
      if (Number(qty || 0) <= 0) return false;
      return isSoloMain(idStr);
    });
    if (hasGsmQty) return true;

    const hasChoiceQty = Object.entries(choiceQty).some(([idStr, qty]) => {
      if (Number(qty || 0) <= 0) return false;
      return isSoloMain(idStr);
    });
    if (hasChoiceQty) return true;

    return selectedIds.some((id) => isSoloMain(id));
  }, [gsmQty, choiceQty, selectedIds, getSectionKeyForChoice, promoSection, choiceById]);

  // Vrai s'il existe une autre sélection que gsm_solo_main (ignore la section promo)
  const hasNonSoloMainSelection = useMemo(() => {
    const isSoloMain = (choiceId) => {
      const secKey = getSectionKeyForChoice(Number(choiceId));
      return (secKey || "").toLowerCase() === "gsm_solo_main";
    };
    const isPromoChoiceId = (choiceId) => {
      if (!promoSection) return false;
      const c = choiceById.get(Number(choiceId));
      return c && Number(c.sectionId) === Number(promoSection.id);
    };

    const hasOtherGsmQty = Object.entries(gsmQty).some(([idStr, qty]) => {
      if (Number(qty || 0) <= 0) return false;
      if (isPromoChoiceId(idStr)) return false;
      return !isSoloMain(idStr);
    });
    if (hasOtherGsmQty) return true;

    const hasOtherChoiceQty = Object.entries(choiceQty).some(([idStr, qty]) => {
      if (Number(qty || 0) <= 0) return false;
      if (isPromoChoiceId(idStr)) return false;
      return !isSoloMain(idStr);
    });
    if (hasOtherChoiceQty) return true;

    return selectedIds.some((id) => {
      if (isPromoChoiceId(id)) return false;
      return !isSoloMain(id);
    });
  }, [gsmQty, choiceQty, selectedIds, getSectionKeyForChoice, promoSection, choiceById]);

  // Vrai si GSM Flex est sélectionné tout seul (ignore la section promo)
  const hasGsmFlexOnlySelected = useMemo(() => {
    const isFlex = (choiceId) => {
      const secKey = getSectionKeyForChoice(Number(choiceId));
      return secKey ? isGsmFlexKey({ key: secKey }) : false;
    };
    const isPromoChoiceId = (choiceId) => {
      if (!promoSection) return false;
      const c = choiceById.get(Number(choiceId));
      return c && Number(c.sectionId) === Number(promoSection.id);
    };

    const hasFlex =
      Object.entries(gsmQty).some(
        ([idStr, qty]) => Number(qty || 0) > 0 && !isPromoChoiceId(idStr) && isFlex(idStr)
      ) ||
      Object.entries(choiceQty).some(
        ([idStr, qty]) => Number(qty || 0) > 0 && !isPromoChoiceId(idStr) && isFlex(idStr)
      ) ||
      selectedIds.some((id) => !isPromoChoiceId(id) && isFlex(id));

    if (!hasFlex) return false;

    const hasNonFlex =
      Object.entries(gsmQty).some(
        ([idStr, qty]) => Number(qty || 0) > 0 && !isPromoChoiceId(idStr) && !isFlex(idStr)
      ) ||
      Object.entries(choiceQty).some(
        ([idStr, qty]) => Number(qty || 0) > 0 && !isPromoChoiceId(idStr) && !isFlex(idStr)
      ) ||
      selectedIds.some((id) => !isPromoChoiceId(id) && !isFlex(id));

    return hasFlex && !hasNonFlex;
  }, [gsmQty, choiceQty, selectedIds, getSectionKeyForChoice, isGsmFlexKey, promoSection, choiceById]);

  // Vrai si "Sans promo" est sélectionné dans la promo
  const hasSansPromoSelected = useMemo(() => {
    if (!promoSelectedIds.length) return false;
    return promoSelectedIds.some((id) => isSansPromoChoice(choiceById.get(id)));
  }, [promoSelectedIds, choiceById, isSansPromoChoice]);

  // Gestion des quantités GSM + règles Solo/Flex + plafond Flex
  const setGsmQuantity = useCallback(
    (choiceId, nextQty) => {
      const sectionKey = getSectionKeyForChoice(choiceId);
      const isSoloSection = sectionKey ? isGsmSoloSection(sectionKey) : false;
      const isOptSection = sectionKey ? isGsmOptSection(sectionKey) : false;
      const isSoloMain = (sectionKey || "").toLowerCase() === "gsm_solo_main";
      const qty = Math.max(0, Number(nextQty || 0));

      setGsmQty((prev) => {
        if (isSoloMain && qty > 0 && hasNonSansPromoSelected && !hasNonSoloMainSelection) {
          setErr("⚠️ En GSM Solo, seule la promo Sans promo est autorisée.");
          setErrKind("selection");
          return prev;
        }
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
    [
      getSectionKeyForChoice,
      isGsmSoloSection,
      isGsmOptSection,
      hasNonSansPromoSelected,
      hasNonSoloMainSelection,
    ]
  );

  const hasAvantageMultiSelected = useMemo(() => {
    const ids = new Set();
    const singles = selectedSingle && typeof selectedSingle === "object" ? Object.values(selectedSingle) : [];
    const multis = selectedMulti && typeof selectedMulti === "object" ? Object.values(selectedMulti) : [];
    singles.forEach((id) => {
      if (id) ids.add(Number(id));
    });
    multis.forEach((arr) => {
      if (!Array.isArray(arr)) return;
      arr.forEach((id) => ids.add(Number(id)));
    });
    return Array.from(ids).some((id) => choiceById.get(id)?.key === "Avantage_Multi");
  }, [selectedSingle, selectedMulti, choiceById]);

  const setChoiceQuantity = useCallback(
    (choiceId, nextQty, sectionKey, sectionType) => {
      const c = choiceById.get(choiceId);
      if (!c || !c.allowQty) return;
      const max = c.maxQty ? Number(c.maxQty) : null;
      const qty = Math.max(0, Number(nextQty || 0));
      const capped = max ? Math.min(qty, max) : qty;
      if (sectionKey === "pack_type" && capped > 0 && hasAvantageMultiSelected) {
        setErr("⚠️ Avantage Multi n'est pas compatible avec Pack Flex.");
        setErrKind("selection");
        return;
      }

      setChoiceQty((prev) => {
        let next = { ...prev };
        if (sectionType === "single" && sectionKey) {
          const sec = sections.find((s) => s.key === sectionKey);
          if (sec) {
            (sec.choices || []).forEach((ch) => {
              if (ch.allowQty) delete next[ch.id];
            });
          }
        }

        if (capped <= 0) {
          delete next[choiceId];
          return next;
        }

        next[choiceId] = capped;
        return next;
      });
    },
    [choiceById, sections, hasAvantageMultiSelected]
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

    const ids = new Set(selectedIds);
    qtyByChoice.forEach((_qty, id) => ids.add(id));

    ids.forEach((id) => {
      const c = choiceById.get(id);
      if (!c) return;
      const q = qtyByChoice.get(id) || 1;
      y1 += Number(c.priceY1 || 0) * q;
      y2 += Number(c.priceY2 || 0) * q;
    });

    // GSM Flex promo: -5€ sur Y1 et Y2 si quantite Flex >= 2 (une seule fois)
    if (gsmFlexDiscount > 0) {
      y1 -= gsmFlexDiscount;
      y2 -= gsmFlexDiscount;
    }

    return { y1, y2 };
  }, [selectedIds, qtyByChoice, choiceById, gsmFlexDiscount]);

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

  const hasPromoSelected = useCallback(() => {
    if (!promoSection) return false;
    return selectedIds.some((id) => {
      const c = choiceById.get(Number(id));
      return c && Number(c.sectionId) === Number(promoSection.id);
    });
  }, [promoSection, selectedIds, choiceById]);

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

  const hasCadeauxChildSelected = useMemo(() => {
    if (!promoSelectedIds.length) return false;
    return promoSelectedIds.some((id) => {
      const c = choiceById.get(id);
      if (!c?.parentId) return false;
      const parent = choiceById.get(Number(c.parentId));
      return (parent?.label || "").toLowerCase().includes("cadeaux");
    });
  }, [promoSelectedIds, choiceById]);

  const isPromo6Mois = useMemo(() => {
    return promoSelectedLabels.some((label) => {
      const p = label.toLowerCase();
      return p.includes("6 mois") || p.includes("6mois");
    });
  }, [promoSelectedLabels]);

  const isPromo12Mois = useMemo(() => {
    return promoSelectedLabels.some((label) => {
      const p = label.toLowerCase();
      return p.includes("12 mois") || p.includes("12mois");
    });
  }, [promoSelectedLabels]);

  // Selection handlers
  const toggleMulti = (sectionKey, choiceId) => {
    if (errKind === "selection") {
      setErr("");
      setErrKind("");
    }
    setSelectedMulti((prev) => {
      const cur = Array.isArray(prev[sectionKey]) ? prev[sectionKey] : [];
      const exists = cur.includes(choiceId);
      const nextChoice = choiceById.get(Number(choiceId));
      if (nextChoice?.key === "Avantage_Multi" && hasAnyPackTypeSelected && !exists) {
        setErr("⚠️ Avantage Multi n'est pas compatible avec Pack Flex.");
        setErrKind("selection");
        return prev;
      }

      if (promoSection && sectionKey === promoSection.key && !exists) {
        const label = (nextChoice?.label || "").toLowerCase();
        const is6 = label.includes("6 mois") || label.includes("6mois");
        const is12 = label.includes("12 mois") || label.includes("12mois");
        const isCadeaux = label.includes("cadeaux");
        const isSansPromo = label.includes("sans promo");
        const isMobileFlex = nextChoice?.key === "Promotion_Mobile_Flex";
        const isAvantageMulti = nextChoice?.key === "Avantage_Multi";

        if (hasGsmSoloMainSelected && !hasNonSoloMainSelection && !isSansPromoChoice(nextChoice)) {
          setErr("⚠️ En GSM Solo, seule la promo Sans promo est autorisée.");
          setErrKind("selection");
          return prev;
        }
        if (hasGsmFlexOnlySelected && !isSansPromoChoice(nextChoice) && !isAvantageMulti) {
          setErr("⚠️ En GSM Flex seul, seules les promos Sans promo ou Avantage Multi sont autorisées.");
          setErrKind("selection");
          return prev;
        }

        const hasCadeaux = promoSelectedLabels.some((l) => l.toLowerCase().includes("cadeaux"));
        const hasSansPromo = promoSelectedLabels.some((l) => l.toLowerCase().includes("sans promo"));
        const hasMobileFlex = promoSelectedIds.some(
          (id) => choiceById.get(id)?.key === "Promotion_Mobile_Flex"
        );

        if (is6 && isPromo12Mois) {
          setErr("⚠️ Impossible de sélectionner 6 mois et 12 mois en même temps.");
          setErrKind("selection");
          return prev;
        }
        if (is12 && isPromo6Mois) {
          setErr("⚠️ Impossible de sélectionner 6 mois et 12 mois en même temps.");
          setErrKind("selection");
          return prev;
        }
        if ((isCadeaux || isSansPromo) && hasMobileFlex) {
          setErr("⚠️ Promotion Mobile Flex n'est pas compatible avec Cadeaux ou Sans promo.");
          setErrKind("selection");
          return prev;
        }
        if (isMobileFlex && (hasCadeaux || hasSansPromo)) {
          setErr("⚠️ Promotion Mobile Flex n'est pas compatible avec Cadeaux ou Sans promo.");
          setErrKind("selection");
          return prev;
        }
        if (isAvantageMulti && hasAnyPackTypeSelected) {
          setErr("⚠️ Avantage Multi n'est pas compatible avec Pack Flex.");
          setErrKind("selection");
          return prev;
        }
        if (isAvantageMulti && gsmFlexQtyForDiscount === 0) {
          setErr("⚠️ Pour Avantage Multi, sélectionnez au moins un GSM Flex.");
          setErrKind("selection");
          return prev;
        }

        // Promotions are single-choice, except allow Mobile Flex as extra with 6 or 12 months.
        const otherIds = cur.filter((id) => {
          const c = choiceById.get(Number(id));
          const l = (c?.label || "").toLowerCase();
          const otherIs6 = l.includes("6 mois") || l.includes("6mois");
          const otherIs12 = l.includes("12 mois") || l.includes("12mois");
          const otherIsMobileFlex = c?.key === "Promotion_Mobile_Flex";
          if (isMobileFlex) {
            return otherIs6 || otherIs12;
          }
          if (is6 || is12) {
            return otherIsMobileFlex;
          }
          return false;
        });
        return { ...prev, [sectionKey]: [...otherIds, choiceId] };
      }

      if (sectionKey === "pack_type") {
        const choice = choiceById.get(Number(choiceId));
        if (choice && isFlexPackChoice(choice) && hasAvantageMultiSelected && !exists) {
          setErr("⚠️ Avantage Multi n'est pas compatible avec Pack Flex.");
          setErrKind("selection");
          return prev;
        }
        const isInternetPack = choice && internetPackKeys.has(choice.key);
        if (isInternetPack && !exists) {
          // Remplacer tout autre choix Internet par le nouveau
          const filtered = cur.filter((id) => {
            const c = choiceById.get(Number(id));
            return !(c && internetPackKeys.has(c.key));
          });
          return { ...prev, [sectionKey]: [...filtered, choiceId] };
        }
      }

      const next = exists ? cur.filter((x) => x !== choiceId) : [...cur, choiceId];
      return { ...prev, [sectionKey]: next };
    });
  };

  const setSingle = (sectionKey, choiceId) => {
    if (errKind === "selection") {
      setErr("");
      setErrKind("");
    }
    const choice = choiceId ? choiceById.get(Number(choiceId)) : null;
    if (choice?.key === "Avantage_Multi" && hasAnyPackTypeSelected) {
      setErr("⚠️ Avantage Multi n'est pas compatible avec Pack Flex.");
      setErrKind("selection");
      return;
    }
    if (sectionKey === "pack_type" && choiceId) {
      if (choice && hasAvantageMultiSelected) {
        setErr("⚠️ Avantage Multi n'est pas compatible avec Pack Flex.");
        setErrKind("selection");
        return;
      }
    }
    if (promoSection && sectionKey === promoSection.key && choiceId) {
      if (hasGsmSoloMainSelected && !hasNonSoloMainSelection && !isSansPromoChoice(choice)) {
        setErr("⚠️ En GSM Solo, seule la promo Sans promo est autorisée.");
        setErrKind("selection");
        return;
      }
      if (hasGsmFlexOnlySelected && !isSansPromoChoice(choice) && choice?.key !== "Avantage_Multi") {
        setErr("⚠️ En GSM Flex seul, seules les promos Sans promo ou Avantage Multi sont autorisées.");
        setErrKind("selection");
        return;
      }
    }
    setSelectedSingle((prev) => ({ ...prev, [sectionKey]: choiceId }));
  };

  const resetSelection = () => {
    setSelectedSingle({});
    setSelectedMulti({});
    setGsmQty({});
    setChoiceQty({});
    setOk("");
    setLastSentPreviewHtml("");
    setShowPreview(false);
    setErr("");
    setErrKind("");
    setAttemptedSend(false);
  };

  const resetClientInfo = () => {
    setClient({ civility: "", lastName: "", firstName: "", email: "", phone: "" });
    setClientErrors({ email: "", phone: "" });
  };


  // Summary items
  const summaryItems = useMemo(() => {
    const items = [];

    for (const sec of sections) {
      if (isGsmSection(sec.key)) continue;

      const secTitle = sec.title || sec.key;
      const type = sec.type || "single";

      if (type === "multi") {
        const baseIds = selectedMulti[sec.key] || [];
        const qtyIds = (sec.choices || [])
          .filter((c) => c.allowQty && Number(choiceQty[c.id] || 0) > 0)
          .map((c) => c.id);
        const arr = Array.from(new Set([...baseIds, ...qtyIds]));
        arr.forEach((id) => {
          const c = choiceById.get(Number(id));
          if (!c) return;
          const qty = c.allowQty ? Number(choiceQty[c.id] || 0) : 1;
          if (c.allowQty && qty === 0) return;
          items.push({ secTitle, label: c.label, y1: c.priceY1, y2: c.priceY2, qty });
        });
      } else {
        const baseId = selectedSingle[sec.key];
        const qtyIds = (sec.choices || [])
          .filter((c) => c.allowQty && Number(choiceQty[c.id] || 0) > 0)
          .map((c) => c.id);
        const ids = Array.from(new Set([baseId, ...qtyIds].filter(Boolean)));
        ids.forEach((id) => {
          const c = choiceById.get(Number(id));
          if (!c) return;
          const qty = c.allowQty ? Number(choiceQty[c.id] || 0) : 1;
          if (c.allowQty && qty === 0) return;
          items.push({ secTitle, label: c.label, y1: c.priceY1, y2: c.priceY2, qty });
        });
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
  }, [sections, selectedSingle, selectedMulti, gsmQty, choiceQty, choiceById, isGsmSection]);

  const summaryFlexDiscountByIndex = useMemo(() => {
    if (gsmFlexDiscount <= 0 || summaryItems.length === 0) return new Map();
    const flexIndexes = [];
    summaryItems.forEach((it, idx) => {
      const sec = (it.secTitle || "").toLowerCase();
      const isGsm = sec.includes("gsm");
      const isSolo = sec.includes("solo");
      if (isGsm && !isSolo) flexIndexes.push(idx);
    });
    if (!flexIndexes.length) return new Map();
    const map = new Map();
    map.set(flexIndexes[flexIndexes.length - 1], gsmFlexDiscount);
    return map;
  }, [summaryItems, gsmFlexDiscount]);

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

  const isDataPhoneSection = useCallback((section) => {
    const key = String(section?.key || "").toLowerCase();
    const title = String(section?.title || "").toLowerCase();
    return (
      key.includes("data_phone") ||
      key.includes("dataphone") ||
      title.includes("data phone") ||
      title.includes("dataphone")
    );
  }, []);

  const isInstallationChoice = useCallback((choice, section) => {
    const key = String(choice?.key || "").trim().toLowerCase();
    const label = String(choice?.label || "").trim().toLowerCase();
    const secKey = String(section?.key || "").trim().toLowerCase();
    const secTitle = String(section?.title || "").trim().toLowerCase();
    return (
      key === "installation_proximus" ||
      label.includes("installation") ||
      secKey.includes("installation") ||
      secTitle.includes("installation")
    );
  }, []);

  const isDataPhoneSelected = useMemo(() => {
    const dataPhoneIds = [];
    sections.forEach((sec) => {
      if (!isDataPhoneSection(sec)) return;
      (sec.choices || []).forEach((c) => dataPhoneIds.push(c.id));
    });
    if (!dataPhoneIds.length) return false;
    return dataPhoneIds.some((id) => {
      if (gsmQty[id]) return true;
      if (choiceQty[id]) return Number(choiceQty[id] || 0) > 0;
      if (selectedIds.includes(id)) return true;
      return false;
    });
  }, [sections, isDataPhoneSection, gsmQty, choiceQty, selectedIds]);

  const isSoloWithDataPhone = useMemo(() => {
    return gsmTotals.soloQty > 0 && isDataPhoneSelected;
  }, [gsmTotals.soloQty, isDataPhoneSelected]);

  const isFlexPackChoice = useCallback(
    (choice) => {
      const key = String(choice?.key || "").toLowerCase();
      const label = String(choice?.label || "").toLowerCase();
      return key.includes("flex") || label.includes("flex");
    },
    []
  );

  const isPackFlexSection = useCallback(
    (section) => {
      const key = String(section?.key || "").toLowerCase();
      const title = String(section?.title || "").toLowerCase();
      if (key.includes("pack_flex")) return true;
      return (key.includes("pack") && key.includes("flex")) || (title.includes("pack") && title.includes("flex"));
    },
    []
  );

  const hasPackFlexSelected = useMemo(() => {
    const packSections = sections.filter((s) => s.key === "pack_type" || isPackFlexSection(s));
    if (packSections.length === 0) return false;

    return packSections.some((sec) => {
      const secType = sec.type || "single";
      const ids =
        secType === "multi"
          ? (selectedMulti[sec.key] || [])
          : selectedSingle[sec.key]
          ? [selectedSingle[sec.key]]
          : [];
      if (ids.length > 0) {
        // Any selection inside Pack Flex section (pack_type) counts as Pack Flex.
        return true;
      }
      const secChoiceIds = (sec.choices || []).map((c) => c.id);
      return secChoiceIds.some(
        (id) =>
          Number(choiceQty[id] || 0) > 0 ||
          selectedIds.includes(id)
      );
    });
  }, [
    sections,
    selectedSingle,
    selectedMulti,
    choiceById,
    isFlexPackChoice,
    isPackFlexSection,
    choiceQty,
    selectedIds,
  ]);

  const hasAnyPackTypeSelected = useMemo(() => {
    const packSec = sections.find((s) => s.key === "pack_type") || null;
    if (!packSec) return false;
    const secType = packSec.type || "single";
    const ids =
      secType === "multi"
        ? (selectedMulti[packSec.key] || [])
        : selectedSingle[packSec.key]
        ? [selectedSingle[packSec.key]]
        : [];
    if (ids.length > 0) return true;
    const packChoiceIds = (packSec.choices || []).map((c) => c.id);
    return packChoiceIds.some((id) => Number(choiceQty[id] || 0) > 0);
  }, [sections, selectedSingle, selectedMulti, choiceQty]);

  const isInstallationSelected = useMemo(() => {
    const installationIds = [];
    sections.forEach((sec) => {
      (sec.choices || []).forEach((c) => {
        if (isInstallationChoice(c, sec)) installationIds.push(c.id);
      });
    });
    if (!installationIds.length) return false;
    return installationIds.some((id) => {
      if (gsmQty[id]) return true;
      if (choiceQty[id]) return Number(choiceQty[id] || 0) > 0;
      if (selectedIds.includes(id)) return true;
      return false;
    });
  }, [sections, isInstallationChoice, gsmQty, choiceQty, selectedIds]);

  const isGsmFlexOrSoloSelected = useMemo(() => {
    if (gsmTotals.flexQty > 0 || gsmTotals.soloQty > 0) return true;
    const gsmMainIds = [];
    sections.forEach((sec) => {
      if (!isGsmFlexKey(sec) && !isGsmSoloKey(sec)) return;
      (sec.choices || []).forEach((c) => gsmMainIds.push(c.id));
    });
    if (!gsmMainIds.length) return false;
    return gsmMainIds.some((id) => {
      if (choiceQty[id]) return Number(choiceQty[id] || 0) > 0;
      if (selectedIds.includes(id)) return true;
      return false;
    });
  }, [
    sections,
    isGsmFlexKey,
    isGsmSoloKey,
    gsmTotals.flexQty,
    gsmTotals.soloQty,
    choiceQty,
    selectedIds,
  ]);

  const hasNonGsmFlexSoloSelection = useMemo(() => {
    const isNonFlexSoloChoice = (choiceId) => {
      const c = choiceById.get(Number(choiceId));
      if (!c) return false;
      const sec = sections.find((s) => s.id === c.sectionId);
      if (!sec) return false;
      if (promoSection && Number(sec.id) === Number(promoSection.id)) {
        // Promotions don't require installation when GSM Flex/Solo is selected alone.
        return false;
      }
      return !isGsmFlexKey(sec) && !isGsmSoloKey(sec);
    };

    for (const id of selectedIds) {
      if (isNonFlexSoloChoice(id)) return true;
    }

    for (const [idStr, qty] of Object.entries(choiceQty)) {
      if (Number(qty || 0) <= 0) continue;
      if (isNonFlexSoloChoice(idStr)) return true;
    }

    for (const [idStr, qty] of Object.entries(gsmQty)) {
      if (Number(qty || 0) <= 0) continue;
      if (isNonFlexSoloChoice(idStr)) return true;
    }

    return false;
  }, [
    selectedIds,
    choiceQty,
    gsmQty,
    choiceById,
    sections,
    isGsmFlexKey,
    isGsmSoloKey,
    promoSection,
    isCadeauxSelected,
  ]);

  // Validation avant envoi de l'offre
  const getValidationError = useCallback(() => {
    if (attemptedSend && (requiredMissing.length > 0 || !isClientFormatOk || !hasAnySelection)) {
      return (
        "⚠️ Champs requis manquants / format invalide / pas de sélection.\n" +
        (requiredMissing.length ? `Manquant: ${requiredMissing.join(", ")}\n` : "") +
        (!isClientFormatOk ? "Format invalide: email ou mobile.\n" : "") +
        (!hasAnySelection ? "Sélectionne au moins une option." : "")
      );
    }

    // GSM Flex seul: promo obligatoire et limitée à Sans promo / Avantage Multi
    if (promoSection && hasGsmFlexOnlySelected) {
      if (!hasPromoSelected() && !hasAvantageMultiSelected) {
        return "⚠️ Pour GSM Flex seul, sélectionnez une promotion (Sans promo ou Avantage Multi).";
      }
      if (hasPromoSelected() && !hasSansPromoSelected && !hasAvantageMultiSelected) {
        return "⚠️ Pour GSM Flex seul, seules les promos Sans promo ou Avantage Multi sont autorisées.";
      }
    }

    // Règle globale: promo obligatoire sauf GSM Solo seul ou cas GSM Flex seul déjà traité
    if (
      promoSection &&
      !hasPromoSelected() &&
      !hasAvantageMultiSelected &&
      !(hasGsmSoloMainSelected && !hasNonSoloMainSelection) &&
      !hasGsmFlexOnlySelected
    ) {
      return "⚠️ Vous devez sélectionner au minimum une promotion avant l’envoi de l’offre.";
    }

    // Validations promo (Cadeaux, Mobile Flex, durées, etc.)
    if (promoSection && hasPromoSelected()) {
      if (hasGsmSoloMainSelected && hasNonSansPromoSelected && !hasNonSoloMainSelection) {
        return "⚠️ En GSM Solo, seule la promo Sans promo est autorisée.";
      }
      if (isCadeauxSelected && !hasCadeauxChildSelected) {
        return "⚠️ Merci de sélectionner un cadeau dans la liste avant l’envoi.";
      }
      if (isCadeauxSelected) {
        if (gsmFlexQtyForDiscount === 0) {
          return "⚠️ Pour une promotion Cadeaux, sélectionnez au moins un GSM Flex.";
        }
        if (!hasTvPackSelected || !hasInternetPackSelected) {
          return "⚠️ Pour une promotion Cadeaux, sélectionnez 1 TV Proximus et 1 Internet dans Pack Flex.";
        }
      }
      const isPremierMobileFlex = (() => {
        if (!promoSection) return false;
        const secKey = promoSection.key;
        const secType = promoSection.type || "single";
        const ids =
          secType === "multi"
            ? (selectedMulti[secKey] || []).map((id) => Number(id))
            : selectedSingle[secKey]
            ? [Number(selectedSingle[secKey])]
            : [];
        return ids.some((id) => choiceById.get(id)?.key === "Promotion_Mobile_Flex");
      })();
      const isAvantageMulti = (() => {
        if (!promoSection) return false;
        const secKey = promoSection.key;
        const secType = promoSection.type || "single";
        const ids =
          secType === "multi"
            ? (selectedMulti[secKey] || []).map((id) => Number(id))
            : selectedSingle[secKey]
            ? [Number(selectedSingle[secKey])]
            : [];
        return ids.some((id) => choiceById.get(id)?.key === "Avantage_Multi");
      })();
      const hasSansPromoSelected = promoSelectedLabels.some((l) => l.toLowerCase().includes("sans promo"));
      const hasCadeauxSelected = promoSelectedLabels.some((l) => l.toLowerCase().includes("cadeaux"));
      if (isPremierMobileFlex && (hasCadeauxSelected || hasSansPromoSelected)) {
        return "⚠️ Promotion Mobile Flex n'est pas compatible avec Cadeaux ou Sans promo.";
      }
      if (isPromo6Mois && isPromo12Mois) {
        return "⚠️ Impossible de sélectionner 6 mois et 12 mois en même temps.";
      }
      if (isPremierMobileFlex && gsmFlexQtyForDiscount === 0) {
        return "⚠️ Pour la promo Premier Mobile Flex, sélectionnez au moins un GSM Flex.";
      }
      if (isAvantageMulti && hasAnyPackTypeSelected) {
        return "⚠️ Avantage Multi n'est pas compatible avec Pack Flex.";
      }
      if (isAvantageMulti && gsmFlexQtyForDiscount === 0) {
        return "⚠️ Pour Avantage Multi, sélectionnez au moins un GSM Flex.";
      }
    }

    if (isInstallationSelected && !hasPackFlexSelected) {
      return "⚠️ Pour choisir l'installation, sélectionnez d'abord un Pack Flex.";
    }

    if (hasPackFlexSelected && !isInstallationSelected) {
      return "⚠️ Pour un Pack Flex, l'installation est obligatoire.";
    }

    if (isDataPhoneSelected && !dataPhoneNote.trim()) {
      return "⚠️ Merci de remplir le commentaire pour Data Phone.";
    }

    return "";
  }, [
    attemptedSend,
    requiredMissing,
    isClientFormatOk,
    hasAnySelection,
    promoSection,
    hasPromoSelected,
    hasGsmSoloMainSelected,
    hasNonSoloMainSelection,
    hasNonSansPromoSelected,
    hasGsmFlexOnlySelected,
    hasSansPromoSelected,
    isCadeauxSelected,
    hasCadeauxChildSelected,
    gsmFlexQtyForDiscount,
    hasTvPackSelected,
    hasInternetPackSelected,
    selectedMulti,
    selectedSingle,
    choiceById,
    promoSelectedLabels,
    isPromo6Mois,
    isPromo12Mois,
    isInstallationSelected,
    hasPackFlexSelected,
    hasAnyPackTypeSelected,
    isDataPhoneSelected,
    dataPhoneNote,
  ]);

  // Auto-update/clear alert when corrected
  useEffect(() => {
    if (!err || errKind !== "validation") return;
    const nextErr = getValidationError();
    if (!nextErr) {
      setErr("");
      setErrKind("");
      return;
    }
    if (nextErr !== err) setErr(nextErr);
  }, [err, errKind, getValidationError]);

  const canSend = useMemo(() => {
    if (requiredMissing.length > 0) return false;
    if (!isClientFormatOk) return false;
    if (!hasAnySelection) return false;
    return true;
  }, [requiredMissing, isClientFormatOk, hasAnySelection]);

  const sendToBackOffice = async () => {
    if (sending) return;
    setErr("");
    setErrKind("");
    setOk("");
    setAttemptedSend(true);

    const validationError = getValidationError();
    if (validationError) {
      validateClient(client);
      setErr(validationError);
      setErrKind("validation");
      return;
    }

    setSending(true);
    try {
      const gsmItems = Object.entries(gsmQty)
        .filter(([_, qty]) => Number(qty) > 0)
        .map(([choiceId, qty]) => ({ choiceId: Number(choiceId), qty: Number(qty) }));
      const qtyItems = Object.entries(choiceQty)
        .filter(([_, qty]) => Number(qty) > 0)
        .map(([choiceId, qty]) => ({ choiceId: Number(choiceId), qty: Number(qty) }));

      const gsmChoiceIds = gsmItems.map((item) => item.choiceId);
      const qtyChoiceIds = qtyItems.map((item) => item.choiceId);
      const allChoiceIds = Array.from(
        new Set([...(selectedIds || []), ...gsmChoiceIds, ...qtyChoiceIds])
      ).filter(Boolean);

      const payload = {
        customerName: `${client.civility?.trim() || ""} ${client.firstName?.trim() || ""} ${client.lastName?.trim() || ""
          }`.trim(),
        customerEmail: normalizeEmail(client.email),
        customerPhone: normalizeBeMobile(client.phone),

        choiceIds: allChoiceIds,
        gsmItems,
        qtyItems,
        dataPhoneNote: dataPhoneNote.trim(),
        status: "TO_SEND",
        packTypeLabel: computedPackType,
        alertMessage: computedAlert,
        totalY1: totals.y1,
        totalY2: totals.y2,
      };

      const { data } = await api.post("/quotes/", payload);

      setOk(
        `✅ Offre envoyé au Back-Office avec succès!\n` +
        `ID: ${data?.quote?.id || data?.id || "id inconnu"}\n` +
        `Total Y1: ${money(totals.y1)} | Total Y2: ${money(totals.y2)}`
      );
      const previewHtml =
        data?.emailHtml || data?.emailContent || data?.quote?.emailContent || "";
      setLastSentPreviewHtml(previewHtml);
      setShowPreview(false);
      setSending(false);
    } catch (e) {
      const msg = e?.response?.data?.message || e?.response?.data?.error || e?.message || "500";
      setErr("⚠️ Erreur envoi devis (Back-Office).\n" + msg);
      setErrKind("system");
      setSending(false);
    }
  };

  return (
    <div style={styles.page}>
      <div style={styles.zoomWrap}>
        <div style={styles.shell}>
        <div style={styles.header}>
          <div style={styles.titleRow}>
            <h1 style={styles.h1}>Matrice Proximus</h1>

            <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
              <button style={styles.btn("secondary")} onClick={resetClientInfo} type="button">
                🧹 Clear Client
              </button>
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
                <option value="Pr">Pr</option>
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
              🔄 Réinitialiser les choix
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

                    const isQtyChoice = !showQty && c.allowQty;
                    const qty = showQty
                      ? Number(gsmQty[c.id] || 0)
                      : isQtyChoice
                      ? Number(choiceQty[c.id] || 0)
                      : 0;
                    const gsmChecked = qty > 0;

                    // Logic to see if "Parent" is visually selected (itself OR one of its children)
                    const myChildren = childrenMap.get(c.id) || [];
                    const hasChildren = myChildren.length > 0;

                    // Current selected ID in this section
                    const currentSelectedId = Number(selectedSingle[activeSection.key] || 0);

                    const selectedList = secType === "multi" ? (selectedMulti[activeSection.key] || []) : [];
                    // Is this parent selected directly?
                    const isSelfSelected = secType === "multi"
                      ? selectedList.includes(c.id)
                      : currentSelectedId === c.id;
                    // Is one of its children selected?
                    const selectedChild = secType === "multi"
                      ? myChildren.find((child) => selectedList.includes(child.id))
                      : myChildren.find((child) => child.id === currentSelectedId);
                    const isChildSelected = !!selectedChild;

                    // Visual state: Parent looks selected if itself/child is active
                    const isParentVisuallySelected = isSelfSelected || isChildSelected;

                    // Which child is active?
                    const activeChildId = selectedChild ? selectedChild.id : "";

                    const selectedForCard = showQty || isQtyChoice
                      ? gsmChecked
                      : secType === "multi"
                      ? (hasChildren ? isParentVisuallySelected : isSelectedNonGsm)
                      : isParentVisuallySelected;

                    const isInstallation = isInstallationChoice(c, activeSection);
                    const isAlreadySelected = isQtyChoice
                      ? qty > 0
                      : secType === "multi"
                      ? isSelectedNonGsm
                      : currentSelectedId === c.id;

                    const click = () => {
                      if (!showQty) {
                        if (isInstallation && !hasPackFlexSelected && !isAlreadySelected) {
                          setErr("⚠️ Pour choisir l'installation, sélectionnez d'abord un Pack Flex.");
                          setErrKind("selection");
                          return;
                        }
                        if (isQtyChoice) {
                          setChoiceQuantity(c.id, qty > 0 ? 0 : 1, activeSection.key, secType);
                          return;
                        }
                        if (secType === "multi") {
                          toggleMulti(activeSection.key, c.id);
                        } else {
                          if (isParentVisuallySelected) {
                            setSingle(activeSection.key, "");
                            return;
                          }
                          if (
                            promoSection &&
                            activeSection.key === promoSection.key &&
                            c.key === "Promotion_Mobile_Flex"
                          ) {
                            const hasSansPromoSelected = promoSelectedLabels.some((l) =>
                              l.toLowerCase().includes("sans promo")
                            );
                            const hasCadeauxSelected = promoSelectedLabels.some((l) =>
                              l.toLowerCase().includes("cadeaux")
                            );
                            if (hasCadeauxSelected || hasSansPromoSelected) {
                              setErr("⚠️ Promotion Mobile Flex n'est pas compatible avec Cadeaux ou Sans promo.");
                              setErrKind("selection");
                              return;
                            }
                          }
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
                    const maxQty = isQtyChoice ? Number(c.maxQty || 0) : 0;
                    const canInc = isQtyChoice
                      ? (maxQty ? qty < maxQty : true)
                      : isSoloSection
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
                            {showQty || isQtyChoice ? (
                              <div
                                style={styles.qtyWrap}
                                onClick={(e) => e.stopPropagation()}
                                title={
                                  isSoloSection
                                    ? `Solo: ${qty} (illimité)`
                                    : showQty
                                    ? `Flex: ${gsmTotals.flexQty}/${GSM_FLEX_MAX}`
                                    : c.maxQty
                                    ? `Max: ${c.maxQty}`
                                    : "Quantité"
                                }
                              >
                                <button
                                  type="button"
                                  style={{
                                    ...styles.qtyBtn,
                                    ...(canDec ? {} : styles.qtyBtnDisabled),
                                  }}
                                  onClick={() =>
                                    showQty
                                      ? decGsm(c.id)
                                      : setChoiceQuantity(c.id, qty - 1, activeSection.key, secType)
                                  }
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
                                  onClick={() =>
                                    showQty
                                      ? incGsm(c.id)
                                      : setChoiceQuantity(c.id, qty + 1, activeSection.key, secType)
                                  }
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
                        {isDataPhoneSection(activeSection) && (selectedForCard || qty > 0) ? (
                          <div style={{ marginTop: 8 }}>
                            <div style={{ fontSize: 13, fontWeight: 700, color: "#cbd5f5", marginBottom: 4 }}>
                              📝 Commentaire obligatoire
                            </div>
                            <textarea
                              style={{
                                width: "100%",
                                padding: "8px 10px",
                                borderRadius: 8,
                                border: "1px solid rgba(255,255,255,0.2)",
                                background: "rgba(0,0,0,0.3)",
                                color: "white",
                                fontSize: 13,
                                minHeight: 70,
                                outline: "none"
                              }}
                              value={dataPhoneNote}
                              onChange={(e) => setDataPhoneNote(e.target.value)}
                              placeholder="Ajouter un commentaire..."
                              onClick={(e) => e.stopPropagation()}
                            />
                          </div>
                        ) : null}
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
                                if (secType === "multi") {
                                  setSelectedMulti((prev) => {
                                    const cur = Array.isArray(prev[activeSection.key]) ? prev[activeSection.key] : [];
                                    const childIds = myChildren.map((child) => child.id);
                                    let next = cur.filter((id) => id !== c.id && !childIds.includes(id));
                                    if (val) next = [...next, val];
                                    return { ...prev, [activeSection.key]: next };
                                  });
                                } else {
                                  setSingle(activeSection.key, val ? val : c.id);
                                }
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
                        <div>
                          Y1{" "}
                          {money(
                            Math.max(
                              0,
                              Number(it.y1 || 0) * Number(it.qty || 1) -
                                (summaryFlexDiscountByIndex.get(idx) || 0)
                            )
                          )}
                        </div>
                        <div>
                          Y2{" "}
                          {money(
                            Math.max(
                              0,
                              Number(it.y2 || 0) * Number(it.qty || 1) -
                                (summaryFlexDiscountByIndex.get(idx) || 0)
                            )
                          )}
                        </div>
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
                    ) : isSoloWithDataPhone ? (
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
                      Promo GSM Flex appliquée: -{money(gsmFlexDiscount)} sur Y1 et Y2
                    </div>
                  ) : null}
                </div>

                <div style={styles.card}>
                  <p style={styles.cardTitle}>⚠️ Alerte (rappel)</p>
                  <div
                    style={
                      err && (errKind === "selection" || (attemptedSend && errKind === "validation") || errKind === "system")
                        ? styles.alertBoxError
                        : styles.alertBox
                    }
                  >
                    {(err &&
                      (errKind === "selection" || (attemptedSend && errKind === "validation") || errKind === "system") &&
                      err) ||
                      computedAlert}
                  </div>
                  <div style={{ ...styles.tiny, marginTop: 4 }}>
                    {err && (errKind === "selection" || (attemptedSend && errKind === "validation") || errKind === "system")
                      ? "❌ Erreur de validation"
                      : "✅ Règles automatiques"}
                  </div>
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
                      color: "#rgb(255 255 255)",
                      fontSize: 11,
                      whiteSpace: "pre-wrap",
                      fontWeight: 600,
                    }}
                  >
                    {ok}
                  </div>
                ) : null}

                {lastSentPreviewHtml ? (
                  <div style={{ marginTop: 8 }}>
                    <button
                      style={styles.btn("preview")}
                      onClick={() => setShowPreview((v) => !v)}
                      type="button"
                    >
                      📧 Aperçu de l’e-mail
                    </button>
                  </div>
                ) : null}

                <div style={{ ...styles.tiny, opacity: 0.7, marginTop: 4 }}>
                  💡 Le Back-Office transmettra l’offre au client.'
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* <div style={{ ...styles.tiny, opacity: 0.6, marginTop: 12, textAlign: "center" }}>
          💻 Backend: <span style={{ fontWeight: 900 }}>/api/matrix/runtime</span>
        </div> */}
        </div>
      </div>

      {showPreview && lastSentPreviewHtml ? (
        <div
          style={{
            position: "fixed",
            inset: 0,
            background: "rgba(8,12,28,0.75)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            zIndex: 9999,
            padding: 16,
          }}
          onClick={() => setShowPreview(false)}
        >
          <div
            style={{
              width: "90vw",
              maxWidth: 980,
              height: "85vh",
              background: "#ffffff",
              borderRadius: 16,
              boxShadow: "0 18px 48px rgba(0,0,0,0.35)",
              display: "flex",
              flexDirection: "column",
              overflow: "hidden",
            }}
            onClick={(e) => e.stopPropagation()}
          >
            <div
              style={{
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
                padding: "10px 14px",
                background: "#0f172a",
                color: "#fff",
                fontWeight: 700,
                fontSize: 18,
              }}
            >
              <span>📧 Aperçu de l’e-mail</span>
              <button
                style={{
                  padding: "10px 35px",
                  borderRadius: 10,
                  border: "1px solid rgba(255,255,255,0.25)",
                  background: "rgb(251 0 0 / 76%)",
                  color: "#rgb(255 255 255)",
                  fontWeight: 700,
                  fontSize: 12,
                  cursor: "pointer",
                }}
                onClick={() => setShowPreview(false)}
                type="button"
              >
                ✖ Fermer
              </button>
            </div>
            <div
              style={{
                flex: 1,
                overflow: "auto",
                padding: 18,
                fontSize: 15,
                lineHeight: 1.5,
                fontFamily: "\"Segoe UI\", \"Calibri\", \"Arial\", sans-serif",
                color: "#111",
              }}
              dangerouslySetInnerHTML={{ __html: lastSentPreviewHtml }}
            />
          </div>
        </div>
      ) : null}

      <style>{`
        @keyframes pulse {
          0%, 100% { opacity: 1; }
          50% { opacity: 0.7; }
        }
      `}</style>
    </div>
  );
}
