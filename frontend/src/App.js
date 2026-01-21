import React, { useEffect, useState } from "react";
import api from "./api";
import ManagerMatrix from "./ManagerMatrix";
import MatrixAgent from "./MatrixAgent";
import Backoffice from "./Backoffice";
import Admin from "./Admin";

function Button({ variant = "primary", className = "", ...props }) {
  const base = "px-4 py-2 rounded-lg font-semibold transition-all duration-200 transform hover:scale-105";
  const styles = {
    primary: "bg-gradient-to-r from-purple-600 to-blue-600 text-white hover:from-purple-700 hover:to-blue-700 shadow-lg",
    secondary: "bg-white border border-gray-200 hover:bg-gray-50 shadow-md",
    danger: "bg-gradient-to-r from-red-600 to-red-700 text-white hover:from-red-700 hover:to-red-800 shadow-lg",
  };
  return <button {...props} className={`${base} ${styles[variant]} ${className}`} />;
}

function Card({ children, className = "" }) {
  return <div className={`bg-white/90 backdrop-blur-sm border border-white/20 rounded-2xl p-6 shadow-2xl ${className}`}>{children}</div>;
}

function Login({ onLoggedIn }) {
  const [identifier, setIdentifier] = useState("");
  const [password, setPassword] = useState("");
  const [err, setErr] = useState("");
  const [loading, setLoading] = useState(false);

  const submit = async () => {
    setErr("");
    setLoading(true);
    try {
      const { data } = await api.post("/auth/login", { identifier, password });
      localStorage.setItem("eol_token", data.token);
      localStorage.setItem("eol_user", JSON.stringify(data.user));
      onLoggedIn(data.user);
    } catch (e) {
      setErr(e?.response?.data?.error || "Erreur login");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen relative overflow-hidden flex items-center justify-center p-4">
      {/* Animated Background */}
      <div className="absolute inset-0 bg-gradient-to-br from-purple-900 via-blue-900 to-indigo-900">
        <div className="absolute inset-0 opacity-30">
          <div className="absolute top-0 -left-4 w-72 h-72 bg-purple-500 rounded-full mix-blend-multiply filter blur-xl animate-blob"></div>
          <div className="absolute top-0 -right-4 w-72 h-72 bg-blue-500 rounded-full mix-blend-multiply filter blur-xl animate-blob animation-delay-2000"></div>
          <div className="absolute -bottom-8 left-20 w-72 h-72 bg-indigo-500 rounded-full mix-blend-multiply filter blur-xl animate-blob animation-delay-4000"></div>
        </div>
      </div>

      {/* Login Card */}
      <div className="relative w-full max-w-md space-y-6 animate-fade-in">
        <Card className="text-center">
          <div className="text-5xl font-black bg-gradient-to-r from-purple-600 to-blue-600 bg-clip-text text-transparent mb-2">
            Matrice Proximus
          </div>
          <div className="text-base text-gray-600 font-medium">EOL ICT — Connexion Sécurisée</div>
        </Card>

        <Card>
          {err && (
            <div className="bg-red-50 border-l-4 border-red-500 text-red-700 p-4 rounded-lg text-sm mb-4 animate-shake">
              <div className="flex items-center gap-2">
                <span className="text-xl">⚠️</span>
                <span className="font-semibold">{err}</span>
              </div>
            </div>
          )}

          <div className="space-y-4">
            <div>
              <div className="text-sm font-bold text-gray-700 mb-2 flex items-center gap-2">
                <span>👤</span> Identifiant
              </div>
              <input
                className="w-full px-4 py-4 border-2 border-gray-200 rounded-xl focus:border-purple-500 focus:ring-2 focus:ring-purple-200 transition-all duration-200 outline-none text-base"
                value={identifier}
                onChange={(e) => setIdentifier(e.target.value)}
                placeholder="Entrez votre identifiant"
                disabled={loading}
              />
            </div>

            <div>
              <div className="text-sm font-bold text-gray-700 mb-2 flex items-center gap-2">
                <span>🔒</span> Mot de passe
              </div>
              <input
                type="password"
                className="w-full px-4 py-4 border-2 border-gray-200 rounded-xl focus:border-purple-500 focus:ring-2 focus:ring-purple-200 transition-all duration-200 outline-none text-base"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && !loading && submit()}
                placeholder="••••••••"
                disabled={loading}
              />
            </div>

            <Button onClick={submit} className="w-full py-3 text-lg" disabled={loading}>
              {loading ? (
                <span className="flex items-center justify-center gap-2">
                  <svg className="animate-spin h-5 w-5" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                  Connexion...
                </span>
              ) : (
                <span className="flex items-center justify-center gap-2">
                  🚀 Se connecter
                </span>
              )}
            </Button>
          </div>

          <div className="mt-6 p-4 bg-gradient-to-r from-purple-50 to-blue-50 rounded-xl border border-purple-100">
            <div className="text-sm font-bold text-gray-700 mb-2">📝 Comptes de test disponibles:</div>
            <div className="space-y-1 text-sm text-gray-600">
              <div className="flex items-center gap-2">
                <span className="font-bold text-purple-600">👔 Manager:</span> manager / manager123
              </div>
              <div className="flex items-center gap-2">
                <span className="font-bold text-blue-600">👨‍💼 Agent:</span> agent / agent123
              </div>
              <div className="flex items-center gap-2">
                <span className="font-bold text-green-600">🏢 Backoffice:</span> bo / bo123
              </div>
              <div className="flex items-center gap-2">
                <span className="font-bold text-red-600">⚙️ Admin:</span> admin / admin123
              </div>
            </div>
          </div>
        </Card>

        <div className="text-center text-white/70 text-sm">
          © 2026 EOL ICT - Tous droits réservés
        </div>
      </div>

      <style>{`
        @keyframes blob {
          0%, 100% { transform: translate(0, 0) scale(1); }
          33% { transform: translate(30px, -50px) scale(1.1); }
          66% { transform: translate(-20px, 20px) scale(0.9); }
        }
        @keyframes fade-in {
          from { opacity: 0; transform: translateY(20px); }
          to { opacity: 1; transform: translateY(0); }
        }
        @keyframes shake {
          0%, 100% { transform: translateX(0); }
          25% { transform: translateX(-10px); }
          75% { transform: translateX(10px); }
        }
        .animate-blob {
          animation: blob 7s infinite;
        }
        .animation-delay-2000 {
          animation-delay: 2s;
        }
        .animation-delay-4000 {
          animation-delay: 4s;
        }
        .animate-fade-in {
          animation: fade-in 0.6s ease-out;
        }
        .animate-shake {
          animation: shake 0.5s ease-in-out;
        }
      `}</style>
    </div>
  );
}

export default function App() {
  const [user, setUser] = useState(null);
  const [view, setView] = useState("home");

  // Restore session
  useEffect(() => {
    const u = localStorage.getItem("eol_user");
    if (!u) return;
    try {
      setUser(JSON.parse(u));
    } catch {}
  }, []);

  const role = user?.role;

  // Default view by role
  useEffect(() => {
    if (!role) return;
    if (role === "ADMIN") setView("admin");
    else if (role === "MANAGER") setView("manager");
    else if (role === "AGENT") setView("agent");
    else if (role === "BACKOFFICE") setView("bo");
    else setView("home");
  }, [role]);

  const logout = () => {
    localStorage.removeItem("eol_token");
    localStorage.removeItem("eol_user");
    setUser(null);
    setView("home");
  };

  // IMPORTANT: hooks are above, now conditional return is OK
  if (!user) return <Login onLoggedIn={(u) => setUser(u)} />;

  const roleIcons = {
    ADMIN: "⚙️",
    MANAGER: "👔",
    AGENT: "👨‍💼",
    BACKOFFICE: "🏢"
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100">
      <div className="bg-white border-b shadow-sm">
        <div className="max-w-7xl mx-auto px-4 py-3 flex items-center justify-between">
          <div>
            <div className="font-black text-2xl bg-gradient-to-r from-purple-600 to-blue-600 bg-clip-text text-transparent">
              Matrice Proximus
            </div>
            <div className="text-xs text-gray-500 font-medium">
              EOL ICT • {roleIcons[role]} {user.name} ({role})
            </div>
          </div>

          <div className="flex gap-2 items-center">
            {role === "ADMIN" && (
              <Button variant={view === "admin" ? "primary" : "secondary"} onClick={() => setView("admin")}>
                ⚙️ Admin
              </Button>
            )}

            {role === "MANAGER" && (
              <Button variant={view === "manager" ? "primary" : "secondary"} onClick={() => setView("manager")}>
                👔 Manager
              </Button>
            )}

            {role === "AGENT" && (
              <Button variant={view === "agent" ? "primary" : "secondary"} onClick={() => setView("agent")}>
                👨‍💼 {user.name}
              </Button>
            )}

            {role === "BACKOFFICE" && (
              <Button variant={view === "bo" ? "primary" : "secondary"} onClick={() => setView("bo")}>
                🏢 Back-office
              </Button>
            )}

            <Button variant="danger" onClick={logout}>
              🚪 Déconnexion
            </Button>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto p-4">
        {view === "home" && (
          <Card>
            <div className="font-bold text-xl">👋 Bienvenue</div>
            <div className="text-sm text-gray-600 mt-1">Choisis une vue selon ton rôle.</div>
          </Card>
        )}

        {view === "admin" && role === "ADMIN" && <Admin />}
        {view === "manager" && role === "MANAGER" && <ManagerMatrix />}
        {view === "agent" && role === "AGENT" && <MatrixAgent currentUser={user} />}
        {view === "bo" && role === "BACKOFFICE" && <Backoffice />}
      </div>
    </div>
  );
}
