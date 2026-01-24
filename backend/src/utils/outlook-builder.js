const MONEY = (n) => Number(n || 0).toFixed(2).replace(".", ",");

/**
* Génère un HTML email compatible Outlook
*/
function buildOutlookCompatibleHtml({ quote, agent, choices, boEmail, logoOnlyooSrc, logoProximusSrc, dataPhoneNote }) {
// Vérifier si GSM ou Pack
const hasGsm = choices.some(c =>
c.section?.title?.toLowerCase()?.includes("gsm") ||
c.section?.key?.toLowerCase()?.includes("gsm")
);
const hasPack = choices.some(c =>
c.section?.title?.toLowerCase()?.includes("pack") ||
c.section?.key?.toLowerCase()?.includes("pack")
);

// Titre selon le type
let title = "Offre spéciale Onlyoo";
if (hasGsm && hasPack) {
title = "Contrat de mise en service Pack Proximus";
} else if (hasGsm) {
title = "Contrat de mise en service du GSM Proximus";
} else if (hasPack) {
title = "Contrat de mise en service du Pack Proximus";
}

const isPromoSection = (c) => {
  const title = (c.section?.title || "").toLowerCase();
  const key = (c.section?.key || "").toLowerCase();
  return title.includes("promotion") || key.includes("promotion");
};

const isCadeauxChoice = (c) => {
  const label = (c.label || "").toLowerCase();
  const parentLabel = (c.parent?.label || "").toLowerCase();
  return label.includes("cadeaux") || parentLabel.includes("cadeaux");
};

const isDataPhoneChoice = (c) => {
  const key = String(c.key || "").trim().toLowerCase();
  const secKey = String(c.section?.key || "").trim().toLowerCase();
  const secTitle = String(c.section?.title || "").trim().toLowerCase();
  return (
    key.startsWith("data_phone") ||
    secKey.includes("data_phone") ||
    secKey.includes("dataphone") ||
    secTitle.includes("data phone") ||
    secTitle.includes("dataphone")
  );
};
const isInstallationChoice = (c) => {
  const key = String(c.key || "").trim().toLowerCase();
  const label = String(c.label || "").trim().toLowerCase();
  const secKey = String(c.section?.key || "").trim().toLowerCase();
  const secTitle = String(c.section?.title || "").trim().toLowerCase();
  return (
    key === "installation_proximus" ||
    label.includes("installation") ||
    secKey.includes("installation") ||
    secTitle.includes("installation")
  );
};
const dataPhoneChoices = choices.filter((c) => isDataPhoneChoice(c));
const installationChoices = choices.filter((c) => isInstallationChoice(c));
const displayChoices = choices.filter(
  (c) =>
    (!isPromoSection(c) || isCadeauxChoice(c)) &&
    !isInstallationChoice(c)
);
const cadeauxChoices = displayChoices.filter((c) => isCadeauxChoice(c));
const mainChoices = displayChoices.filter((c) => !isCadeauxChoice(c));

const formatChoiceLabel = (c) => {
  const qty = Number(c.qty || 1);
  return qty > 1 ? `${c.label} x${qty}` : c.label;
};

// Construire le sujet avec les offres
const choicesShort = displayChoices.map((c) => formatChoiceLabel(c)).join(" + ");

// Détection de la durée promo (6 ou 12 mois) et logique Prix
const promoChoice = choices.find(c => c.section?.title?.toLowerCase().includes("promotion") ||
c.section?.key?.toLowerCase().includes("promotion"))
|| choices.find(c => c.label.toLowerCase().includes("promo") || c.label.toLowerCase().includes("cadeaux"));

const promoLabel = promoChoice ? promoChoice.label.toLowerCase() : "";
const hasCadeaux = choices.some(c => {
  const label = (c.label || "").toLowerCase();
  const parentLabel = (c.parent?.label || "").toLowerCase();
  return label.includes("cadeaux") || parentLabel.includes("cadeaux");
});
const hasSansPromo = choices.some(c => (c.label || "").toLowerCase().includes("sans promo"));
const isStablePrice = promoLabel.includes("cadeaux") || promoLabel.includes("sans promo") || hasCadeaux || hasSansPromo;
const has6Mois = promoLabel.includes("6 mois") || promoLabel.includes("6mois");
const duration = has6Mois ? 6 : 12;

let priceHtml = "";
if (isStablePrice) {
priceHtml = `
<p
    style="margin: 0 0 10px 0; font-size: 16px; font-weight: bold; color: #000000; text-transform: uppercase; font-family: Arial, sans-serif;">
    Par Mois (TVAC)
</p>
<p style="margin: 0; font-size: 42px; font-weight: bold; color: #CC0000; font-family: Arial, sans-serif;">
    ${MONEY(quote.totalY2)}<span style="font-size: 32px; color: #CC0000; font-weight: bold;">&euro;</span>
</p>`;
} else {
priceHtml = `
<p
    style="margin: 0 0 8px 0; font-size: 16px; font-weight: bold; color: #000000; text-transform: uppercase; font-family: Arial, sans-serif;">
    Tarification mensuelle (TVAC)
</p>
<p style="margin: 0; font-size: 42px; font-weight: bold; color: #CC0000; font-family: Arial, sans-serif;">
    ${MONEY(quote.totalY1)}<span style="font-size: 32px; color: #CC0000; font-weight: bold;">&euro;</span>
</p>
<p style="margin: 5px 0 0 0; font-size: 18px; color: #CC0000; font-weight: bold; font-family: Arial, sans-serif;">
    Pendant ${duration} mois sans engagement
</p>
<p style="margin: 15px 0 0 0; font-size: 18px; color: #000000; font-weight: bold; font-family: Arial, sans-serif;">
    Suivi d'un tarif mensuel de ${MONEY(quote.totalY2)}&euro;
</p>`;
}
const subject = `Offre speciale Onlyoo - ${choicesShort}`;

// Couleurs pour les lignes
const colors = ["#0066CC", "#E65100", "#2E7D32", "#7B1FA2", "#C62828", "#00838F"];

// Tableau des choix avec couleurs
const choicesLines = mainChoices.map((c, index) => {
const color = colors[index % colors.length];
const desc = c.description ? `<br><span
    style="font-size: 12px; color: #666666; font-style: italic;">${c.description}</span>` : "";
const note = isDataPhoneChoice(c) && dataPhoneNote
  ? `<br><span style="font-size: 12px; color: #333333;">${String(dataPhoneNote).replace(/</g, "&lt;").replace(/>/g, "&gt;")}</span>`
  : "";
return `<tr>
    <td
        style="padding: 12px 15px; border-left: 4px solid ${color}; border-bottom: 1px solid #e0e0e0; background-color: #fafafa; font-size: 15px; color: #333333; font-family: Arial, sans-serif;">
        <strong style="color: ${color}; font-size: 16px;">${formatChoiceLabel(c)}</strong>${desc}${note}
    </td>
</tr>`;
}).join("");

// Corps du mail pour le bouton "Bon pour accord"
const mailtoBody = isStablePrice
  ? `Je confirme mon accord pour votre offre speciale du pack proximus, au tarif de ${MONEY(quote.totalY2)} euro/mois, ${quote.customerName}.`
  : `Je confirme mon accord pour votre offre speciale du pack proximus, au tarif de ${MONEY(quote.totalY1)} euro/mois pendant ${duration} mois. Suivi d'un tarif mensuel de ${MONEY(quote.totalY2)} euro/mois, ${quote.customerName}.`;

const mailtoSubject = `Contrat de mise en service - conseiller:  ${agent?.name || ""}`;
const mailtoTo = String(boEmail || "").trim();
const mailtoLink = `mailto:${mailtoTo}?subject=${encodeURIComponent(mailtoSubject)}&body=${encodeURIComponent(mailtoBody)}`;

const rawName = quote.customerName || "Client";
let salutation = "Bonjour";
let displayName = rawName;
if (rawName.toLowerCase().startsWith("madame ")) {
  salutation = "Chère Madame";
  displayName = rawName.slice("Madame ".length);
} else if (rawName.toLowerCase().startsWith("monsieur ")) {
  salutation = "Cher Monsieur";
  displayName = rawName.slice("Monsieur ".length);
} else if (rawName.toLowerCase().startsWith("pro ")) {
  salutation = "Bonjour";
  displayName = rawName.slice("Pro ".length);
}

const html = `
<!DOCTYPE html>
<html>

<head>
    <meta http-equiv="Content-Type" content="text/html; charset=UTF-8" />
    <title>${title}</title>
    <style type="text/css">
        body {
            font-family: Arial, sans-serif;
        }

        a {
            color: #0066CC;
        }
    </style>
</head>

<body style="margin: 0; padding: 0; background-color: #f0f0f0; font-family: Arial, sans-serif;">

    <table width="100%" border="0" cellpadding="0" cellspacing="0" style="background-color: #f0f0f0;">
        <tr>
            <td align="center" style="padding: 20px 10px;">

                <!-- Header - TITRE GRAND -->
                <table width="620" border="0" cellpadding="0" cellspacing="0" style="background-color: #5c2d91;">
                    <tr>
                        <td align="center" style="padding: 35px 20px;">
                            <h1
                                style="margin: 0; font-size: 34px; font-weight: bold; color: #FFFFFF; font-family: Arial, sans-serif; letter-spacing: 1px;">
                                ${title}</h1>
                        </td>
                    </tr>
                </table>

                <!-- Contenu -->
                <table width="620" border="0" cellpadding="0" cellspacing="0" style="background-color: #FFFFFF;">
                    <tr>
                        <td style="padding: 30px;">

                            <p
                                style="margin: 0 0 15px 0; font-size: 16px; color: #000000; font-family: Arial, sans-serif;">
                                ${salutation} <strong
                                    style="color: #000000; font-size: 17px;">${displayName}</strong>,
                            </p>

                            <p
                                style="margin: 0 0 15px 0; font-size: 16px; line-height: 1.6; color: #000000; font-family: Arial, sans-serif;">
                                Nous vous remercions pour notre agréable conversation téléphonique et tenons à
                                vous féliciter pour avoir choisi les services Proximus.
                            </p>

                            <p
                                style="margin: 0 0 20px 0; font-size: 16px; line-height: 1.6; color: #000000; font-family: Arial, sans-serif;">
                                Comme indiqué lors de notre conversation, votre nouveau Pack Proximus vous offre
                                les avantages suivants :
                            </p>

                            <!-- Choix Sans Bordures -->
                            <table width="100%" border="0" cellpadding="0" cellspacing="0" style="margin-bottom: 25px;">
                                <tr>
                                    <td style="padding: 0;">
                                        <table width="100%" border="0" cellpadding="0" cellspacing="0">
                                            ${mainChoices.map((c) => {
                                            const isCadeauxChoiceItem = isCadeauxChoice(c);
                                            const note = isDataPhoneChoice(c) && dataPhoneNote
                                              ? `<br><span style="font-size: 13px; color: #333333;">${String(dataPhoneNote).replace(/</g, "&lt;").replace(/>/g, "&gt;")}</span>`
                                              : "";
                                            const desc = c.description ? `<br><span
                                                style="font-size: 14px; color: #666666; font-style: italic;">${c.description}</span>`
                                            : "";
                                            return `<tr>
                                                <td
                                                    style="padding: 10px 0; border-bottom: 1px solid #eeeeee; font-size: 16px; color: #000000; font-family: Arial, sans-serif;">
                                                    <strong
                                                        style="color: ${isCadeauxChoiceItem ? "#CC0000" : "#000000"}; font-size: 17px;">${formatChoiceLabel(c)}</strong>${desc}${note}
                                                </td>
                                            </tr>`;
                                            }).join("")}
                                        </table>
                                    </td>
                                </tr>
                            </table>

                            <!-- Prix -->
                            <table width="100%" border="0" cellpadding="0" cellspacing="0"
                                style="border-radius: 8px; margin-bottom: 25px;">
                                <tr>
                                    <td align="center" style="padding: 20px;">
                                        ${priceHtml}
                                    </td>
                                </tr>
                            </table>

                            ${cadeauxChoices.length ? `
                            <table width="100%" border="0" cellpadding="0" cellspacing="0" style="margin-bottom: 25px;">
                              <tr>
                                <td style="padding: 0;">
                                  <table width="100%" border="0" cellpadding="0" cellspacing="0">
                                    ${cadeauxChoices.map((c) => {
                                    const desc = c.description ? `<br><span
                                        style="font-size: 14px; color: #666666; font-style: italic;">${c.description}</span>`
                                    : "";
                                    return `<tr>
                                        <td
                                            style="padding: 10px 0; border-bottom: 1px solid #eeeeee; font-size: 16px; color: #000000; font-family: Arial, sans-serif;">
                                            <strong
                                                style="color: #CC0000; font-size: 17px;">${formatChoiceLabel(c)}</strong>${desc}
                                        </td>
                                    </tr>`;
                                    }).join("")}
                                  </table>
                                </td>
                              </tr>
                            </table>` : ""}

                            ${installationChoices.length ? `
                            <div style="margin-bottom: 14px; font-size: 15px; font-weight: bold; color: #CC0000;">
                              ${installationChoices.map((c) => formatChoiceLabel(c)).join(" + ")}
                            </div>` : ""}

                            <!-- Bouton Bon pour accord -->
                            <table width="100%" border="0" cellpadding="0" cellspacing="0"
                                style="background-color: #F0FBFF; border: 2px solid #00AEEF; border-radius: 10px; margin-bottom: 30px;">
                                <tr>
                                    <td style="padding: 28px 24px;" align="center">
                                        <p
                                            style="margin: 0 0 10px 0; font-size: 20px; font-weight: bold; color: #0077CC; font-family: Arial, sans-serif;">
                                            Validation de votre accord</p>

                                        <p
                                            style="margin: 0 0 22px 0; font-size: 15px; line-height: 1.6; color: #444444; font-family: Arial, sans-serif;">
                                            Pour finaliser votre souscription, cliquez sur le bouton ci-dessous
                                            et envoyez le mail de confirmation.
                                        </p>

                                        <table border="0" cellpadding="0" cellspacing="0" style="margin: 0 auto;">
                                            <tr>
                                                <td align="center" bgcolor="#0066CC"
                                                    style="border-radius: 8px;">
                                                    <a href="${mailtoLink}" target="_blank"
                                                        style="display: inline-block; padding: 18px 52px; font-size: 20px; font-weight: bold; color: #FFFFFF; text-decoration: none; border-radius: 8px; font-family: Arial, sans-serif; letter-spacing: 0.6px;">
                                                        ✅ BON POUR ACCORD
                                                    </a>
                                                </td>
                                            </tr>
                                            <tr>
                                                <td align="center"
                                                    style="padding-top: 10px; font-size: 12px; color: #666666; font-family: Arial, sans-serif;">
                                                    (Cliquez pour ouvrir le mail de confirmation)
                                                </td>
                                            </tr>
                                        </table>
                                    </td>
                                </tr>
                            </table>

                            <!-- Informations importantes -->
                            <table width="100%" border="0" cellpadding="0" cellspacing="0" style="margin-bottom: 20px;">
                                <tr>
                                    <td style="padding: 25px;">
                                        <p
                                            style="margin: 0 0 15px 0; font-size: 15px; line-height: 1.7; color: #333333; font-family: Arial, sans-serif;">
                                            Veuillez aussi compléter et signer le bon de commande relatif à votre
                                            contrat Proximus et le renvoyer accompagné d'une copie de votre carte
                                            d'identité soit par mail ou par courrier.
                                        </p>

                                        <p
                                            style="margin: 0 0 15px 0; font-size: 15px; line-height: 1.7; color: #333333; font-family: Arial, sans-serif;">
                                            En communiquant votre code Easy Switch ; Proximus se chargera de toutes les
                                            démarches administratives relatives à la résiliation de vos abonnements
                                            Télévision et internet lors du transfert de vos abonnements téléphoniques,
                                            autrement vous devez vous-même résilier votre abonnement internet et TV
                                            auprès de votre ancien opérateur.
                                        </p>
                                        <p
                                            style="margin: 0; font-size: 15px; line-height: 1.7; color: #333333; font-family: Arial, sans-serif;">
                                            Cette lettre de résiliation doit être envoyée à votre opérateur actuel dès
                                            l'activation de vos services Proximus.
                                        </p>
                                    </td>
                                </tr>
                            </table>

                            <!-- FAQ Section -->
                            <table width="100%" border="0" cellpadding="0" cellspacing="0"
                                style="border-radius: 8px; margin-bottom: 20px;">
                                <tr>
                                    <td style="padding: 15px;">
                                        <p
                                            style="margin: 0 0 12px 0; font-size: 15px; font-weight: bold; text-decoration: underline; color: #000000; font-family: Arial, sans-serif;">
                                            ❓ FAQ - Questions Fréquentes</p>

                                        <p style="margin: 0 0 8px 0; font-size: 13px; font-family: Arial, sans-serif;">
                                            <a href="https://www.proximus.be/fr/id_cr_dkyc_faqs/particuliers/mobile/abonnements-gsm/identification-online-faq.html"
                                                target="_blank" style="color:#000000; text-decoration: none;">
                                                🔒 Pourquoi dois je vérifier ma carte d'identité ?
                                            </a>
                                        </p>
                                        <p style="margin: 0 0 8px 0; font-size: 13px; font-family: Arial, sans-serif;">
                                            <a href="https://www.proximus.be/fr/id_cr_local_partners/particuliers/r-orphans/partenaires-proximus-locaux.html"
                                                target="_blank" style="color: #000000; text-decoration: none;">
                                                🤝 Partenaires officiels Proximus
                                            </a>
                                        </p>
                                        <p style="margin: 0 0 16px 0; font-size: 13px; font-family: Arial, sans-serif;">
                                            <a href="https://www.onlyoo.be" target="_blank"
                                                style="color: #000000; text-decoration: none;">
                                                🌐 www.onlyoo.be
                                            </a>
                                        </p>

                                    </td>
                                </tr>
                            </table>




                            <!-- Signature avec logos -->
                            <table width="100%" border="0" cellpadding="0" cellspacing="0"
                                style="border-top: 2px solid #00AEEF; padding-top: 20px; margin-top: 25px;">
                                <tr>
                                    <td width="180" valign="middle"
                                        style="padding-right: 20px; border-right: 2px solid #00AEEF; text-align: center;">
                                        <img src="${logoOnlyooSrc || "https://www.onlyoo.be/wp-content/uploads/2022/03/logo-onlyoo.jpg"}"
                                            alt="Onlyoo" width="160"
                                            style="display: block; margin: 0 auto 15px auto; max-width: 160px; border: 0;" />
                                        <img src="${logoProximusSrc || "https://lh3.googleusercontent.com/d/14V5O26JOO6sY8MEXgNU7C0QIUP0deRm8"}"
                                            alt="Proximus Partner" width="170"
                                            style="display: block; margin: 0 auto; max-width: 170px; border: 0;" />
                                    </td>
                                    <td valign="top" style="padding-left: 20px; font-family: Arial, sans-serif;">
                                        <!-- Nom Agent -->
                                        <p
                                            style="margin: 0 0 20px 0; font-size: 16px; font-weight: bold; color: #555555; font-family: Arial, sans-serif;">
                                            ${agent?.name || "Nom de l'agent"}
                                        </p>

                                        <!-- Onlyoo Proximus Partenaire -->
                                        <p
                                            style="margin: 0 0 5px 0; font-size: 14px; color: #333333; font-family: Arial, sans-serif;">
                                            <strong>Onlyoo</strong>
                                            <strong style="color: #666666;">Proximus Partenaire</strong>
                                        </p>

                                        <p
                                            style="margin: 0 0 20px 0; font-size: 14px; color: #777777; font-family: Arial, sans-serif;">
                                            Conseiller Produit Proximus
                                        </p>

                                        <!-- Téléphones -->
                                        <p style="margin: 0 0 2px 0; font-size: 13px; font-family: Arial, sans-serif;">
                                            <a href="tel:+3228997400"
                                                style="color: #0066CC; text-decoration: underline;">+32 2 899 74 00</a>
                                            <span style="color: #0066CC;"> | </span>
                                            <a href="tel:+32470243878"
                                                style="color: #0066CC; text-decoration: underline;">+32 470 24 38 78</a>
                                        </p>

                                        <!-- Adresse -->
                                        <p
                                            style="margin: 0 0 20px 0; font-size: 13px; color: #888888; font-family: Arial, sans-serif;">
                                            Drève Richelle 7/0 1410 Waterloo
                                        </p>

                                        <!-- Email | Site -->
                                        <p style="margin: 0 0 25px 0; font-size: 13px; font-family: Arial, sans-serif;">
                                            <a href="mailto:Proximus@onlyoo.be"
                                                style="color: #0066CC; text-decoration: underline;">Proximus@onlyoo.be</a>
                                            <span style="color: #0066CC;"> | </span>
                                            <a href="https://www.onlyoo.be" target="_blank"
                                                style="color: #0066CC; text-decoration: underline;">www.onlyoo.be</a>
                                        </p>
                                        <p
                                            style="margin: 0; font-size: 14px; color: #00AEEF; font-family: Arial, sans-serif;">
                                            ID :11445
                                        </p>
                                    </td>
                                </tr>
                            </table>

                        </td>
                    </tr>
                </table>

            </td>
        </tr>
    </table>

</body>

</html>`;

return { html, subject };
}

/**
* Version texte plain
*/
function buildPlainText({ quote, agent, choices, dataPhoneNote }) {
const rawName = quote.customerName || "Client";
let salutation = "Bonjour";
let displayName = rawName;
if (rawName.toLowerCase().startsWith("madame ")) {
salutation = "Chère Madame";
displayName = rawName.slice("Madame ".length);
} else if (rawName.toLowerCase().startsWith("monsieur ")) {
salutation = "Cher Monsieur";
displayName = rawName.slice("Monsieur ".length);
} else if (rawName.toLowerCase().startsWith("pro ")) {
salutation = "Bonjour";
displayName = rawName.slice("Pro ".length);
}
const isPromoSection = (c) => {
const title = (c.section?.title || "").toLowerCase();
const key = (c.section?.key || "").toLowerCase();
return title.includes("promotion") || key.includes("promotion");
};

const isCadeauxChoice = (c) => {
const label = (c.label || "").toLowerCase();
const parentLabel = (c.parent?.label || "").toLowerCase();
return label.includes("cadeaux") || parentLabel.includes("cadeaux");
};

const isDataPhoneChoice = (c) =>
  String(c.key || "").trim().toLowerCase().startsWith("data_phone");
const isInstallationChoice = (c) =>
  String(c.key || "").trim().toLowerCase() === "installation_proximus";
const dataPhoneChoices = choices.filter((c) => isDataPhoneChoice(c));
const installationChoices = choices.filter((c) => isInstallationChoice(c));
const displayChoices = choices.filter(
  (c) =>
    (!isPromoSection(c) || isCadeauxChoice(c)) &&
    !isInstallationChoice(c)
);
const cadeauxChoices = displayChoices.filter((c) => isCadeauxChoice(c));
const mainChoices = displayChoices.filter((c) => !isCadeauxChoice(c));

const formatChoiceLabel = (c) => {
const qty = Number(c.qty || 1);
return qty > 1 ? `${c.label} x${qty}` : c.label;
};

const choicesShort = displayChoices.map((c) => formatChoiceLabel(c)).join(" + ");
const subject = `Contrat de mise en service Pack Proximus - ${choicesShort}`;

const choicesList = mainChoices.map((c) => {
const desc = c.description ? ` - ${c.description}` : "";
return `- ${formatChoiceLabel(c)}${desc}`;
}).join("\n");

const cadeauxList = cadeauxChoices.map((c) => {
const desc = c.description ? ` - ${c.description}` : "";
return `- ${formatChoiceLabel(c)}${desc}`;
}).join("\n");

const text = `Offre speciale Onlyoo - ${choicesShort}

${salutation} ${displayName},

Voici le recapulatif de votre nouvelle installation :

${choicesList}

${dataPhoneNote || dataPhoneChoices.length ? `Data Phone: ${dataPhoneChoices.map((c) => formatChoiceLabel(c)).join(" + ")}${dataPhoneNote ? ` - ${String(dataPhoneNote)}` : ""}` : ""}
${installationChoices.length ? `Installation: ${installationChoices.map((c) => formatChoiceLabel(c)).join(" + ")}` : ""}

${cadeauxList ? `Cadeaux:\n${cadeauxList}\n` : ""}

TARIFICATION:
Annee 1: ${MONEY(quote.totalY1)}€/mois
Annee 2: ${MONEY(quote.totalY2)}€/mois

Pour finaliser, cliquez sur "Bon pour accord" dans le mail recu.

---
${agent?.name || "Conseiller"}
Onlyoo - Proximus Partner
Tel: +32 2 899 74 00 | +32 470 24 38 78
Proximus@onlyoo.be | www.onlyoo.be
ID: 11445`;

return { text, subject };
}

module.exports = { buildOutlookCompatibleHtml, buildPlainText };
