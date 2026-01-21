const mjml2html = require("mjml");

const MONEY = (n) => Number(n || 0).toFixed(2);

/**
 * Génère le template MJML pour un email de devis - VERSION PRO
 */
function buildMjmlTemplate({ quote, agent, choices, boEmail }) {
  const offerLabel = quote.packTypeLabel || "Offre Proximus";
  
  // Construire les lignes des choix en MJML avec meilleur design
  const choicesHtml = choices
    .map((c) => {
      const sectionLabel = c.section?.title || c.section?.key || "Section";
      const color = c.meta?.color || "#1976d2";
      const desc = c.description || (c.meta?.description ?? "");
      
      return `
        <mj-section background-color="white" padding="0">
          <mj-column>
            <mj-divider border-color="${color}" border-width="4px" width="100%" padding="0" margin="20px 0 0 0"></mj-divider>
            <mj-text font-size="16px" font-weight="bold" color="${color}" margin="16px 0 8px 0">
              ${sectionLabel}: ${c.label}
            </mj-text>
            ${desc ? `<mj-text font-size="14px" color="#555555" margin="0 0 12px 0" line-height="1.5">${desc}</mj-text>` : ""}
            <mj-text font-size="13px" color="#1976d2" font-weight="bold" margin="0">
              Y1 ${MONEY(c.priceY1)}€ / Y2 ${MONEY(c.priceY2)}€
            </mj-text>
          </mj-column>
        </mj-section>
      `;
    })
    .join("");

  const mjmlTemplate = `
<mjml>
  <mj-head>
    <mj-title>${quote.customerName} - Devis Proximus</mj-title>
    <mj-preview>Votre devis Proximus ${offerLabel}</mj-preview>
  </mj-head>
  <mj-body background-color="#f8f9fa">
    
    <!-- En-tête bleu dégradé -->
    <mj-section background-color="#1976d2" padding="50px 20px">
      <mj-column>
        <mj-text font-size="32px" font-weight="bold" color="white" align="center" margin="0 0 12px 0">
          Contrat de mise en service
        </mj-text>
        <mj-text font-size="20px" color="white" align="center" margin="0" opacity="0.9">
          Pack Proximus ${offerLabel}
        </mj-text>
      </mj-column>
    </mj-section>

    <!-- Contenu principal -->
    <mj-section background-color="white" padding="40px 30px">
      <mj-column>
        
        <!-- Salutation -->
        <mj-text font-size="16px" line-height="1.8" color="#333333" margin="0 0 24px 0">
          Bonjour <strong>${quote.customerName}</strong>,
        </mj-text>

        <mj-text font-size="15px" line-height="1.8" color="#555555" margin="0 0 20px 0">
          Nous vous remercions pour notre agréable conversation téléphonique et tenons à vous féliciter pour avoir choisi les services Proximus.
        </mj-text>

        <mj-text font-size="15px" line-height="1.8" color="#555555" margin="0 0 28px 0">
          Comme indiqué lors de notre conversation, voici votre nouveau Pack Proximus :
        </mj-text>

      </mj-column>
    </mj-section>

    <!-- Choix sélectionnés -->
    ${choicesHtml}

    <!-- Tarification - Boîte bleue -->
    <mj-section background-color="white" padding="30px">
      <mj-column>
        <mj-section background-color="#e8f4fd" border="2px solid #1976d2" border-radius="8px" padding="30px">
          <mj-column>
            <mj-text font-size="14px" color="#666666" align="center" margin="0 0 16px 0" font-weight="bold">
              TARIFICATION MENSUELLE (TVAC)
            </mj-text>
            <mj-divider border-color="#1976d2" border-width="1px" width="60%" padding="0" margin="0 0 16px 0"></mj-divider>
            <mj-text font-size="28px" font-weight="bold" color="#1976d2" align="center" margin="0 0 8px 0">
              ${MONEY(quote.totalY1)}€
            </mj-text>
            <mj-text font-size="14px" color="#666666" align="center" margin="0 0 20px 0">
              par mois — Année 1
            </mj-text>
            <mj-divider border-color="#1976d2" border-width="1px" width="60%" padding="0" margin="0 0 16px 0"></mj-divider>
            <mj-text font-size="14px" color="#666666" align="center" margin="0">
              Année 2 : <strong style="color:#1976d2; font-size:18px;">${MONEY(quote.totalY2)}€</strong> par mois
            </mj-text>
          </mj-column>
        </mj-section>
      </mj-column>
    </mj-section>

    <!-- Appel à l'action - Boîte jaune -->
    <mj-section background-color="white" padding="30px">
      <mj-column>
        <mj-section background-color="#fffbea" border="2px solid #ffc107" border-radius="8px" padding="24px">
          <mj-column>
            <mj-text font-size="15px" font-weight="bold" color="#856404" margin="0 0 12px 0">
              ⚠️ VALIDATION DE VOTRE ACCORD
            </mj-text>
            <mj-text font-size="14px" color="#856404" line-height="1.6" margin="0">
              Afin de finaliser votre souscription à cette offre, veuillez confirmer votre accord en répondant à ce mail avec la mention <strong>« Bon pour accord »</strong> suivi de votre nom et prénom.
            </mj-text>
          </mj-column>
        </mj-section>
      </mj-column>
    </mj-section>

    <!-- Bouton de confirmation -->
    <mj-section background-color="white" padding="30px">
      <mj-column>
        <mj-button background-color="#1976d2" color="white" font-weight="bold" font-size="18px" padding="16px 40px" border-radius="8px" href="mailto:${boEmail}?subject=Je%20confirme%20mon%20accord%20pour%20votre%20offre%20sp%C3%A9ciale%20Proximus%20-%20${encodeURIComponent(offerLabel)}&body=Bonjour%2C%0A%0AJe%20confirme%20mon%20accord%20pour%20votre%20offre%20sp%C3%A9ciale%20Proximus.%0A%0ACordialement%2C">
          ✓ CONFIRMER MON ACCORD
        </mj-button>
        <mj-text font-size="12px" color="#999999" align="center" margin="12px 0 0 0">
          Le bouton ouvre votre client mail pour envoyer votre confirmation
        </mj-text>
      </mj-column>
    </mj-section>

    <!-- Signature -->
    <mj-section background-color="white" padding="30px" border-top="1px solid #eeeeee">
      <mj-column>
        <mj-text font-size="14px" color="#333333" font-weight="bold" margin="0 0 8px 0">
          Cordialement,
        </mj-text>
        <mj-text font-size="14px" color="#555555" margin="0 0 4px 0">
          <strong>${agent?.name || "Conseiller Proximus"}</strong>
        </mj-text>
        <mj-text font-size="13px" color="#777777" margin="0 0 2px 0">
          ID Agent : ${agent?.id || "N/A"}
        </mj-text>
        <mj-text font-size="13px" color="#1976d2" margin="0">
          ${agent?.email || ""}
        </mj-text>
      </mj-column>
    </mj-section>

    <!-- Référence -->
    <mj-section background-color="white" padding="20px 30px" border-top="1px solid #eeeeee">
      <mj-column>
        <mj-text font-size="12px" color="#999999" align="center" margin="0">
          Référence devis : <strong>${quote.id}</strong>
        </mj-text>
      </mj-column>
    </mj-section>

    <!-- Pied de page -->
    <mj-section background-color="#f0f0f0" padding="24px">
      <mj-column>
        <mj-text font-size="11px" color="#999999" align="center" margin="0">
          © 2025 EOL ICT - Proximus Partner<br/>
          <span style="font-size:10px;">Cet email a été généré automatiquement. Veuillez ne pas répondre à cette adresse.</span>
        </mj-text>
      </mj-column>
    </mj-section>

  </mj-body>
</mjml>
  `;

  return mjmlTemplate;
}

/**
 * Convertit MJML en HTML
 */
function mjmlToHtml(mjmlTemplate) {
  try {
    const { html, errors } = mjml2html(mjmlTemplate);
    if (errors.length > 0) {
      console.warn("⚠️  Erreurs MJML:", errors);
    }
    return html;
  } catch (error) {
    console.error("❌ Erreur conversion MJML:", error);
    throw error;
  }
}

/**
 * Génère le texte brut pour fallback
 */
function buildPlainText({ quote, agent, choices }) {
  const offerLabel = quote.packTypeLabel || "Offre Proximus";
  const linesText = choices
    .map((c) => {
      const sectionLabel = c.section?.title || c.section?.key || "Section";
      const desc = c.description || (c.meta?.description ?? "");
      return `• ${sectionLabel}: ${c.label}${desc ? " — " + desc : ""} (Y1 ${MONEY(c.priceY1)}€ / Y2 ${MONEY(c.priceY2)}€)`;
    })
    .join("\n");

  return `Bonjour ${quote.customerName},

Nous vous remercions pour notre agréable conversation téléphonique.

Voici votre devis Proximus :

${linesText}

TOTAL:
Année 1: ${MONEY(quote.totalY1)}€/mois
Année 2: ${MONEY(quote.totalY2)}€/mois

Pour confirmer votre accord, répondez à ce mail avec "Bon pour accord" suivi de votre nom et prénom.

Cordialement,
${agent?.name || "Conseiller Proximus"}
ID Agent: ${agent?.id || ""}
${agent?.email || ""}`;
}

module.exports = { buildMjmlTemplate, mjmlToHtml, buildPlainText };
