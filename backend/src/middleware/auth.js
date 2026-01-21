const jwt = require("jsonwebtoken");

function requireAuth(req, res, next) {
  const header = req.headers.authorization || "";
  const token = header.startsWith("Bearer ") ? header.slice(7) : null;
  
  if (!token) {
    console.log("Token manquant");
    return res.status(401).json({ error: "Token manquant" });
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    console.log("Token décodé:", JSON.stringify(decoded));

    // Chercher l'id dans différentes propriétés possibles
    const id = decoded.id ?? decoded.userId ?? decoded.sub ?? decoded.user_id;

    if (!id) {
      console.log("Token invalide: pas d'id trouvé");
      return res.status(401).json({ error: "Token invalide (id manquant)" });
    }

    req.user = {
      id: Number(id),
      role: decoded.role,
      email: decoded.email,
      name: decoded.name,
      identifier: decoded.identifier,
    };

    return next();
  } catch (e) {
    console.log("Token invalide:", e.message);
    return res.status(401).json({ error: "Token invalide" });
  }
}

function requireRole(...roles) {
  return (req, res, next) => {
    if (!req.user?.role || !roles.includes(req.user.role)) {
      return res.status(403).json({ error: "Accès refusé" });
    }
    return next();
  };
}

module.exports = { requireAuth, requireRole };

