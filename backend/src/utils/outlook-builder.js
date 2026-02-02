const MONEY = (n) => Number(n || 0).toFixed(2).replace(".", ",");

/**
 * Génère un HTML email compatible Outlook (Web + Desktop + Mobile)
 * Fixes appliqués pour Outlook Desktop:
 * - Utilisation de tableaux imbriqués au lieu de divs
 * - Suppression des border-radius non supportés
 * - VML pour les boutons
 * - Styles inline uniquement
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
    title = "Contrat de mise en service du Pack Proximus";
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
  const promoChoice =
    choices.find(
      (c) =>
        c.section?.title?.toLowerCase().includes("promotion") ||
        c.section?.key?.toLowerCase().includes("promotion")
    ) || choices.find((c) => c.label.toLowerCase().includes("promo") || c.label.toLowerCase().includes("cadeaux"));

  const promoLabel = promoChoice ? promoChoice.label.toLowerCase() : "";
  const hasCadeaux = choices.some(c => {
    const label = (c.label || "").toLowerCase();
    const parentLabel = (c.parent?.label || "").toLowerCase();
    return label.includes("cadeaux") || parentLabel.includes("cadeaux");
  });
  const hasSansPromo = choices.some(c => (c.label || "").toLowerCase().includes("sans promo"));
  const isStablePrice = promoLabel.includes("cadeaux") || promoLabel.includes("sans promo") || hasCadeaux || hasSansPromo;
  const promoChoices = choices.filter((c) => isPromoSection(c));
  const promoLabels = promoChoices.map((c) => (c.label || "").toLowerCase());
  const promoParentLabels = promoChoices
    .map((c) => (c.parent?.label || "").toLowerCase())
    .filter(Boolean);
  const allPromoLabels = [...promoLabels, ...promoParentLabels];

  const has6Mois = allPromoLabels.some((label) => label.includes("6 mois") || label.includes("6mois"));
  const has12Mois = allPromoLabels.some((label) => label.includes("12 mois") || label.includes("12mois"));
  const duration = has6Mois ? 6 : has12Mois ? 12 : 12;

  let priceHtml = "";
  if (isStablePrice) {
    priceHtml = `
    <table width="100%" border="0" cellpadding="0" cellspacing="0">
      <tr>
        <td align="center" style="padding: 20px 10px;">
          <table border="0" cellpadding="0" cellspacing="0">
            <tr>
              <td style="font-size: 16px; font-weight: bold; color: #000000; text-transform: uppercase; font-family: Arial, sans-serif; padding-bottom: 10px;">
                Par Mois (TVAC)
              </td>
            </tr>
            <tr>
              <td align="center" style="font-size: 42px; font-weight: bold; color: #CC0000; font-family: Arial, sans-serif; text-align: center;">
                ${MONEY(quote.totalY2)}<span style="font-size: 32px; color: #CC0000; font-weight: bold;">&euro;</span>
              </td>
            </tr>
          </table>
        </td>
      </tr>
    </table>`;
  } else {
    priceHtml = `
    <table width="100%" border="0" cellpadding="0" cellspacing="0">
      <tr>
        <td align="center" style="padding: 20px 10px;">
          <table border="0" cellpadding="0" cellspacing="0">
            <tr>
              <td style="font-size: 16px; font-weight: bold; color: #000000; text-transform: uppercase; font-family: Arial, sans-serif; padding-bottom: 8px;">
                Tarification mensuelle (TVAC)
              </td>
            </tr>
            <tr>
              <td align="center" style="font-size: 42px; font-weight: bold; color: #CC0000; font-family: Arial, sans-serif; text-align: center;">
                ${MONEY(quote.totalY1)}<span style="font-size: 32px; color: #CC0000; font-weight: bold;">&euro;</span>
              </td>
            </tr>
            <tr>
              <td style="font-size: 18px; color: #CC0000; font-weight: bold; font-family: Arial, sans-serif; padding-top: 5px;">
                Pendant ${duration} mois sans engagement
              </td>
            </tr>
            <tr>
              <td style="font-size: 18px; color: #000000; font-weight: bold; font-family: Arial, sans-serif; padding-top: 15px; padding-bottom: 12px;">
                Suivi d'un tarif mensuel de ${MONEY(quote.totalY2)}&euro;
              </td>
            </tr>
          </table>
        </td>
      </tr>
    </table>`;
  }

  const subject = title;

  // Corps du mail pour le bouton "Bon pour accord"
  const mailtoBody = isStablePrice
    ? `Je confirme mon accord pour votre offre speciale du pack proximus, au tarif de ${MONEY(quote.totalY2)} euro/mois, ${quote.customerName}.`
    : `Je confirme mon accord pour votre offre speciale du pack proximus, au tarif de ${MONEY(quote.totalY1)} euro/mois pendant ${duration} mois. Suivi d'un tarif mensuel de ${MONEY(quote.totalY2)} euro/mois, ${quote.customerName}.`;

  const mailtoSubject = `Bon pour accord offre Onlyoo,Commercial : ${agent?.name || ""}`;
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

  const html = `<!DOCTYPE html>
<html>
<head>
    <meta http-equiv="Content-Type" content="text/html; charset=UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <title>${title}</title>
    <!--[if mso]>
    <style type="text/css">
        body, table, td {font-family: Arial, sans-serif !important;}
    </style>
    <![endif]-->
</head>
<body style="margin: 0; padding: 0; background-color: #f0f0f0; font-family: Arial, sans-serif;" bgcolor="#f0f0f0">
    
    <!-- Wrapper principal -->
    <table width="100%" border="0" cellpadding="0" cellspacing="0" style="background-color: #f0f0f0;" bgcolor="#f0f0f0">
        <tr>
            <td align="center" style="padding: 20px 10px;">
                
                <!-- Container principal 620px -->
                <table width="620" border="0" cellpadding="0" cellspacing="0" style="background-color: #FFFFFF;" bgcolor="#FFFFFF">
                    
                    <!-- Header violet -->
                    <tr>
                        <td style="background-color: #5c2d91; padding: 35px 20px;" bgcolor="#5c2d91" align="center">
                            <table border="0" cellpadding="0" cellspacing="0" width="100%">
                                <tr>
                                    <td align="center" style="font-size: 34px; font-weight: bold; color: #FFFFFF; font-family: Arial, sans-serif; letter-spacing: 1px;">
                                        ${title}
                                    </td>
                                </tr>
                            </table>
                        </td>
                    </tr>
                    
                    <!-- Contenu principal -->
                    <tr>
                        <td style="padding: 30px;">
                            
                            <!-- Salutation -->
                            <table width="100%" border="0" cellpadding="0" cellspacing="0">
                                <tr>
                                    <td style="font-size: 16px; color: #000000; font-family: Arial, sans-serif; padding-bottom: 15px;">
                                        ${salutation} <strong style="color: #000000; font-size: 17px;">${displayName}</strong>,
                                    </td>
                                </tr>
                            </table>
                            
                            <!-- Paragraphe intro -->
                            <table width="100%" border="0" cellpadding="0" cellspacing="0">
                                <tr>
                                    <td style="font-size: 16px; line-height: 1.6; color: #000000; font-family: Arial, sans-serif; padding-bottom: 15px;">
                                        Nous vous remercions pour notre agréable conversation téléphonique et tenons à vous féliciter pour avoir choisi les services Proximus.
                                    </td>
                                </tr>
                                <tr>
                                    <td style="font-size: 16px; line-height: 1.6; color: #000000; font-family: Arial, sans-serif; padding-bottom: 20px;">
                                        Comme indiqué lors de notre conversation, votre nouveau Pack Proximus vous offre les avantages suivants :
                                    </td>
                                </tr>
                            </table>
                            
                            <!-- Liste des choix principaux -->
                            <table width="100%" border="0" cellpadding="0" cellspacing="0" style="margin-bottom: 25px;">
                                ${mainChoices.map((c) => {
                                  const isCadeauxChoiceItem = isCadeauxChoice(c);
                                  const note = isDataPhoneChoice(c) && dataPhoneNote
                                    ? `<br><span style="font-size: 13px; color: #333333; font-family: Arial, sans-serif;">${String(dataPhoneNote).replace(/</g, "&lt;").replace(/>/g, "&gt;")}</span>`
                                    : "";
                                  const desc = c.description 
                                    ? `<br><span style="font-size: 14px; color: #666666; font-style: italic; font-family: Arial, sans-serif;">${c.description}</span>`
                                    : "";
                                  return `
                                <tr>
                                    <td style="padding: 10px 0; border-bottom: 1px solid #eeeeee; font-size: 16px; color: #000000; font-family: Arial, sans-serif;">
                                        <strong style="color: ${isCadeauxChoiceItem ? "#CC0000" : "#000000"}; font-size: 17px;">${formatChoiceLabel(c)}</strong>${desc}${note}
                                    </td>
                                </tr>`;
                                }).join("")}
                            </table>
                            
                            <!-- Prix -->
                            ${priceHtml}
                            
                            <!-- Cadeaux (si applicable) -->
                            ${cadeauxChoices.length ? `
                            <table width="100%" border="0" cellpadding="0" cellspacing="0" style="margin-bottom: 25px;">
                                ${cadeauxChoices.map((c) => {
                                  const desc = c.description 
                                    ? `<br><span style="font-size: 14px; color: #666666; font-style: italic; font-family: Arial, sans-serif;">${c.description}</span>`
                                    : "";
                                  return `
                                <tr>
                                    <td style="padding: 10px 0; border-bottom: 1px solid #eeeeee; font-size: 16px; color: #000000; font-family: Arial, sans-serif;">
                                        <strong style="color: #CC0000; font-size: 17px;">${formatChoiceLabel(c)}</strong>${desc}
                                    </td>
                                </tr>`;
                                }).join("")}
                            </table>` : ""}
                            
                            <!-- Installation (si applicable) -->
                            ${installationChoices.length ? `
                            <table width="100%" border="0" cellpadding="0" cellspacing="0" style="margin: 6px 0 10px;">
                                <tr>
                                    <td style="border-top: 1px solid #e5e5e5; font-size: 1px; line-height: 1px;">&nbsp;</td>
                                </tr>
                            </table>
                            <table width="100%" border="0" cellpadding="0" cellspacing="0" style="margin-bottom: 14px;">
                                <tr>
                                    <td style="font-size: 15px; font-weight: bold; color: #CC0000; font-family: Arial, sans-serif;">
                                        ${installationChoices.map((c) => formatChoiceLabel(c)).join(" + ")}
                                    </td>
                                </tr>
                            </table>` : ""}
                            
                            <!-- Bloc Validation avec bouton BON POUR ACCORD -->
                            <table width="100%" border="0" cellpadding="0" cellspacing="0" style="background-color: #F0FBFF; border: 2px solid #00AEEF; border-radius: 10px; margin-bottom: 30px;" bgcolor="#F0FBFF">
                                <tr>
                                    <td style="padding: 28px 24px;">
                                        
                                        <!-- Texte explicatif -->
                                        <table width="100%" border="0" cellpadding="0" cellspacing="0">
                                            <tr>
                                                <td align="center" style="font-size: 15px; line-height: 1.6; color: #444444; font-family: Arial, sans-serif; padding-bottom: 22px;">
                                                    Pour finaliser votre souscription, cliquez sur le bouton ci-dessous et envoyez le mail de confirmation.
                                                </td>
                                            </tr>
                                        </table>
                                        
                                        <!-- Bouton BON POUR ACCORD avec icône -->
                                        <table border="0" cellpadding="0" cellspacing="0" align="center">
                                            <tr>
                                                <td align="center" style="background-color: #0066CC; padding: 18px 50px; border-radius: 8px; -webkit-border-radius: 8px; -moz-border-radius: 8px;" bgcolor="#0066CC">
                                                    <!--[if mso]>
                                                    <a href="${mailtoLink}" style="font-size: 20px; font-weight: bold; color: #FFFFFF; text-decoration: none; font-family: Arial, sans-serif; display: block; line-height: 22px;">✓ BON POUR ACCORD</a>
                                                    <![endif]-->
                                                    <!--[if !mso]><!-->
                                                    <a href="${mailtoLink}" style="font-size: 20px; font-weight: bold; color: #FFFFFF; text-decoration: none; font-family: Arial, sans-serif; display: block; line-height: 22px;">
                                                        <span style="display: inline-block; width: 24px; height: 24px; background-color: #28a745; border-radius: 50%; text-align: center; line-height: 24px; margin-right: 8px; vertical-align: middle; font-size: 16px;">✓</span>
                                                        <span style="vertical-align: middle;">BON POUR ACCORD</span>
                                                    </a>
                                                    <!--<![endif]-->
                                                </td>
                                            </tr>
                                            <tr>
                                                <td align="center" style="padding-top: 10px; font-size: 12px; color: #666666; font-family: Arial, sans-serif;">
                                                    (Cliquez pour ouvrir le mail de confirmation)
                                                </td>
                                            </tr>
                                        </table>
                                        
                                    </td>
                                </tr>
                            </table>
                            
                            <!-- Informations importantes -->
                            <table width="100%" border="0" cellpadding="0" cellspacing="0" style="background-color: #ffffff; margin-bottom: 20px;" bgcolor="#ffffff">
                                <tr>
                                    <td style="padding: 25px;">
                                        
                                        <table width="100%" border="0" cellpadding="0" cellspacing="0">
                                            <tr>
                                                <td style="font-size: 15px; line-height: 1.7; color: #333333; font-family: Arial, sans-serif; padding-bottom: 15px;">
                                                    Veuillez aussi compléter et signer le bon de commande relatif à votre contrat Proximus et le renvoyer accompagné d'une copie de votre carte d'identité soit par mail ou par courrier.
                                                </td>
                                            </tr>
                                            <tr>
                                                <td style="font-size: 15px; line-height: 1.7; color: #333333; font-family: Arial, sans-serif; padding-bottom: 15px;">
                                                    En communiquant votre code Easy Switch ; Proximus se chargera de toutes les démarches administratives relatives à la résiliation de vos abonnements Télévision et internet lors du transfert de vos abonnements téléphoniques, autrement vous devez vous-même résilier votre abonnement internet et TV auprès de votre ancien opérateur.
                                                </td>
                                            </tr>
                                            <tr>
                                                <td style="font-size: 15px; line-height: 1.7; color: #333333; font-family: Arial, sans-serif;">
                                                    Cette lettre de résiliation doit être envoyée à votre opérateur actuel dès l'activation de vos services Proximus.
                                                </td>
                                            </tr>
                                        </table>
                                        
                                    </td>
                                </tr>
                            </table>
                            
                            <!-- FAQ Section -->
                            <table width="100%" border="0" cellpadding="0" cellspacing="0" style="margin-bottom: 20px;">
                                <tr>
                                    <td style="padding: 15px;">
                                        
                                        <table width="100%" border="0" cellpadding="0" cellspacing="0">
                                            <tr>
                                                <td style="font-size: 15px; font-weight: bold; text-decoration: underline; color: #000000; font-family: Arial, sans-serif; padding-bottom: 12px;">
                                                    ❓ FAQ - Questions Fréquentes
                                                </td>
                                            </tr>
                                            <tr>
                                                <td style="font-size: 13px; font-family: Arial, sans-serif; padding-bottom: 8px;">
                                                    <a href="https://www.proximus.be/fr/id_cr_dkyc_faqs/particuliers/mobile/abonnements-gsm/identification-online-faq.html" target="_blank" style="color: #000000; text-decoration: none;">
                                                        🔒 Pourquoi dois je vérifier ma carte d'identité ?
                                                    </a>
                                                </td>
                                            </tr>
                                            <tr>
                                                <td style="font-size: 13px; font-family: Arial, sans-serif; padding-bottom: 8px;">
                                                    <a href="https://www.proximus.be/fr/id_cr_local_partners/particuliers/r-orphans/partenaires-proximus-locaux.html" target="_blank" style="color: #000000; text-decoration: none;">
                                                        🤝 Partenaires officiels Proximus
                                                    </a>
                                                </td>
                                            </tr>
                                            <tr>
                                                <td style="font-size: 13px; font-family: Arial, sans-serif; padding-bottom: 8px;">
                                                    <a href="https://www.onlyoo.be" target="_blank" style="color: #000000; text-decoration: none;">
                                                        🌐 www.onlyoo.be
                                                    </a>
                                                </td>
                                            </tr>
                                            <tr>
                                                <td style="font-size: 13px; font-family: Arial, sans-serif; padding-bottom: 8px;">
                                                    <a href="https://api.whatsapp.com/send/?phone=32470243878&text&type=phone_number&app_absent=0" target="_blank" style="color: #000000; text-decoration: none;">
                                                        📞 Envoyer ma carte d'identite par Whatsapp
                                                    </a>
                                                </td>
                                            </tr>
                                        </table>
                                        
                                    </td>
                                </tr>
                            </table>
                            
                            <!-- Signature avec logos -->
                            <table width="100%" border="0" cellpadding="0" cellspacing="0" style="border-top: 2px solid #00AEEF; padding-top: 20px; margin-top: 25px;">
                                <tr>
                                    <td width="180" valign="middle" style="padding-right: 20px; border-right: 2px solid #00AEEF;">
                                        
                                        <!-- Logos -->
                                        <table width="100%" border="0" cellpadding="0" cellspacing="0">
                                            <tr>
                                                <td align="center" style="padding-bottom: 15px;">
                                                    <img src="${logoOnlyooSrc || ""}" alt="Onlyoo" width="160" style="display: block; max-width: 160px; height: auto; border: 0;" />
                                                </td>
                                            </tr>
                                            <tr>
                                                <td align="center">
                                                    <img src="${logoProximusSrc || ""}" alt="Proximus Partner" width="170" style="display: block; max-width: 170px; height: auto; border: 0;" />
                                                </td>
                                            </tr>
                                        </table>
                                        
                                    </td>
                                    <td valign="top" style="padding-left: 20px;">
                                        
                                        <!-- Infos agent -->
                                        <table width="100%" border="0" cellpadding="0" cellspacing="0">
                                            <tr>
                                                <td style="font-size: 16px; font-weight: bold; color: #555555; font-family: Arial, sans-serif; padding-bottom: 20px;">
                                                    ${agent?.name || "Nom de l'agent"}
                                                </td>
                                            </tr>
                                            <tr>
                                                <td style="font-size: 14px; color: #333333; font-family: Arial, sans-serif; padding-bottom: 5px;">
                                                    <strong style="color: #666666;">Onlyoo</strong> <strong style="color: #666666;">Proximus partner</strong>
                                                </td>
                                            </tr>
                                            <tr>
                                                <td style="font-size: 14px; color: #777777; font-family: Arial, sans-serif; padding-bottom: 20px;">
                                                    Conseiller Produit Proximus
                                                </td>
                                            </tr>
                                            <tr>
                                                <td style="font-size: 13px; font-family: Arial, sans-serif; padding-bottom: 2px;">
                                                    <a href="tel:+3228997400" style="color: #0066CC; text-decoration: underline;">+32 2 899 74 00</a>
                                                    <span style="color: #0066CC;"> | </span>
                                                    <a href="tel:+32470243878" style="color: #0066CC; text-decoration: underline;">+32 470 24 38 78</a>
                                                </td>
                                            </tr>
                                            <tr>
                                                <td style="font-size: 13px; color: #888888; font-family: Arial, sans-serif; padding-bottom: 20px;">
                                                    Drève Richelle 7/0 1410 Waterloo
                                                </td>
                                            </tr>
                                            <tr>
                                                <td style="font-size: 13px; font-family: Arial, sans-serif; padding-bottom: 25px;">
                                                    <a href="mailto:Proximus@onlyoo.be" style="color: #0066CC; text-decoration: underline;">Proximus@onlyoo.be</a>
                                                    <span style="color: #0066CC;"> | </span>
                                                    <a href="https://www.onlyoo.be" target="_blank" style="color: #0066CC; text-decoration: underline;">www.onlyoo.be</a>
                                                </td>
                                            </tr>
                                            <tr>
                                                <td style="font-size: 14px; color: #00AEEF; font-family: Arial, sans-serif;">
                                                    ID :11445
                                                </td>
                                            </tr>
                                        </table>
                                        
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
 * Version texte plain (inchangée)
 */
function buildPlainText({ quote, agent, choices, dataPhoneNote }) {
  const hasGsm = choices.some((c) =>
    c.section?.title?.toLowerCase()?.includes("gsm") ||
    c.section?.key?.toLowerCase()?.includes("gsm")
  );
  const hasPack = choices.some((c) =>
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
  const subject = title;

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
