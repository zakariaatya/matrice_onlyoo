import React, { useEffect, useState } from "react";
import api from "./api";

const ROLES = ["ADMIN", "MANAGER", "AGENT", "BACKOFFICE"];

export default function Admin() {
  const [users, setUsers] = useState([]);
  const [err, setErr] = useState("");
  const [ok, setOk] = useState("");

  const [form, setForm] = useState({
    name: "",
    identifier: "",
    password: "",
    role: "AGENT",
  });

  const loadUsers = async () => {
    setErr("");
    try {
      const { data } = await api.get("/users");
      setUsers(data.users || []);
    } catch (e) {
      setErr(e?.response?.data?.error || e?.response?.data?.message || e?.message || "Erreur chargement users");
    }
  };

  useEffect(() => {
    loadUsers();
  }, []);

  const createUser = async () => {
    setErr("");
    setOk("");
    try {
      const { data } = await api.post("/users", form);
      setOk("✅ Utilisateur créé");
      setForm({ name: "", identifier: "", password: "", role: "AGENT" });
      setUsers((prev) => [data.user, ...prev]);
    } catch (e) {
      setErr(e?.response?.data?.error || e?.response?.data?.message || e?.message || "Erreur création user");
    }
  };

const deleteUser = async (id) => {
  setErr("");
  setOk("");
  const yes = window.confirm("Supprimer cet utilisateur définitivement ?");
  if (!yes) return;

  try {
    await api.delete(`/users/${id}`);
    setOk("✅ Utilisateur supprimé");
    setUsers((prev) => prev.filter((u) => u.id !== id));
  } catch (e) {
    setErr(
      e?.response?.data?.error ||
      e?.response?.data?.message ||
      e?.message ||
      "Erreur suppression user"
    );
  }
};


  return (
    <div style={{ padding: 20 }}>
      <h2 style={{ fontWeight: 900, marginBottom: 10 }}>Admin — Utilisateurs</h2>

      {err && (
        <div style={{ background: "#ffe5e5", border: "1px solid #ffb3b3", padding: 10, borderRadius: 8, color: "#a60000", marginBottom: 10 }}>
          {err}
        </div>
      )}
      {ok && (
        <div style={{ background: "#e7ffef", border: "1px solid #a6f2c1", padding: 10, borderRadius: 8, color: "#0a6a2a", marginBottom: 10 }}>
          {ok}
        </div>
      )}

      {/* Create user */}
      <div style={{ background: "white", border: "1px solid #eee", borderRadius: 12, padding: 14, marginBottom: 16 }}>
        <div style={{ fontWeight: 800, marginBottom: 10 }}>➕ Ajouter un utilisateur</div>

        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr 160px 120px", gap: 10 }}>
          <input
            value={form.name}
            onChange={(e) => setForm((p) => ({ ...p, name: e.target.value }))}
            placeholder="Nom"
            style={{ padding: 10, borderRadius: 10, border: "1px solid #ddd" }}
          />
          <input
            value={form.identifier}
            onChange={(e) => setForm((p) => ({ ...p, identifier: e.target.value }))}
            placeholder="Identifiant"
            style={{ padding: 10, borderRadius: 10, border: "1px solid #ddd" }}
          />
          <input
            type="password"
            value={form.password}
            onChange={(e) => setForm((p) => ({ ...p, password: e.target.value }))}
            placeholder="Mot de passe"
            style={{ padding: 10, borderRadius: 10, border: "1px solid #ddd" }}
          />
          <select
            value={form.role}
            onChange={(e) => setForm((p) => ({ ...p, role: e.target.value }))}
            style={{ padding: 10, borderRadius: 10, border: "1px solid #ddd" }}
          >
            {ROLES.map((r) => (
              <option key={r} value={r}>
                {r}
              </option>
            ))}
          </select>

          <button
            onClick={createUser}
            style={{ padding: 10, borderRadius: 10, border: "none", background: "#6d28d9", color: "white", fontWeight: 800 }}
          >
            Créer
          </button>
        </div>
      </div>

      {/* Users list */}
      <div style={{ background: "white", border: "1px solid #eee", borderRadius: 12, padding: 14 }}>
        <div style={{ fontWeight: 800, marginBottom: 10 }}>👤 Liste des utilisateurs</div>

        <table style={{ width: "100%", borderCollapse: "collapse" }}>
          <thead>
            <tr style={{ textAlign: "left", borderBottom: "1px solid #eee" }}>
              <th style={{ padding: 10 }}>Nom</th>
              <th style={{ padding: 10 }}>Identifiant</th>
              <th style={{ padding: 10 }}>Email</th>
              <th style={{ padding: 10 }}>Rôle</th>
              <th style={{ padding: 10 }}>Actif</th>
              <th style={{ padding: 10 }}>Actions</th>
            </tr>
          </thead>

          <tbody>
            {users.map((u) => (
              <tr key={u.id} style={{ borderBottom: "1px solid #f3f3f3" }}>
                <td style={{ padding: 10 }}>{u.name}</td>
                <td style={{ padding: 10 }}>{u.identifier}</td>
                <td style={{ padding: 10 }}>{u.email}</td>
                <td style={{ padding: 10, fontWeight: 700 }}>{u.role}</td>
                <td style={{ padding: 10 }}>
                  <span style={{ display: "inline-block", padding: "4px 8px", borderRadius: 4, background: u.active ? "#d1fae5" : "#fee2e2", color: u.active ? "#065f46" : "#7f1d1d", fontSize: 12, fontWeight: 600 }}>
                    {u.active ? "✓ Actif" : "✗ Inactif"}
                  </span>
                </td>
                <td style={{ padding: 10 }}>
                  <div style={{ display: "flex", gap: 8 }}>
                    <button
                      onClick={() => deleteUser(u.id)}
                      style={{
                        padding: "8px 10px",
                        borderRadius: 10,
                        border: "none",
                        background: "#dc2626",
                        color: "white",
                        fontWeight: 700,
                      }}
                    >
                      Supprimer
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>

        {users.length === 0 && <div style={{ padding: 10, color: "#666" }}>Aucun utilisateur.</div>}
      </div>
    </div>
  );
}


