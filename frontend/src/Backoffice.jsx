import React, { useEffect, useState } from "react";
import api from "./api";

export default function Backoffice() {
  const [quotes, setQuotes] = useState([]);
  const [loading, setLoading] = useState(false);
  const [actionId, setActionId] = useState(null);
  const [error, setError] = useState("");
  const [selectedQuote, setSelectedQuote] = useState(null);
  const [mailPreview, setMailPreview] = useState(null);
  const [query, setQuery] = useState("");
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [exporting, setExporting] = useState(false);
  const [page, setPage] = useState(1);
  const [total, setTotal] = useState(0);
  const [totalPages, setTotalPages] = useState(1);
  const pageSize = 20;

  const load = async (nextPage = page) => {
    try {
      setError("");
      setLoading(true);
      const { data } = await api.get("/quotes", {
        params: {
          page: nextPage,
          limit: pageSize,
          query: query.trim() || undefined,
          startDate: startDate || undefined,
          endDate: endDate || undefined,
        },
      });
      setQuotes(data?.quotes || []);
      setTotal(Number(data?.total || 0));
      setTotalPages(Math.max(1, Number(data?.totalPages || 1)));
    } catch (e) {
      console.error(e);
      setError(e?.response?.data?.error || e?.message || "Erreur lors du chargement");
      setQuotes([]);
      setTotal(0);
      setTotalPages(1);
    } finally {
      setLoading(false);
    }
  };

  const formatCustomerName = (name) => {
    const raw = String(name || "").trim();
    return raw.replace(/^(monsieur|madame|m|mme|mr|pr|pro)\s+/i, "");
  };

  useEffect(() => {
    load(page);
  }, [page]);

  const viewMail = async (q) => {
    try {
      setError("");
      setActionId(q.id);
      const { data } = await api.get(`/quotes/${q.id}/preview`);
      setMailPreview(data);
      setSelectedQuote(q);
    } catch (e) {
      console.error(e);
      setError(e?.response?.data?.error || e?.message || "Erreur chargement mail");
    } finally {
      setActionId(null);
    }
  };

  const deleteQuote = async (q) => {
    if (!window.confirm(`Supprimer le devis #${q.id} ?`)) return;
    try {
      setError("");
      setActionId(q.id);
      await api.delete(`/quotes/${q.id}`);
      await load(page);
      if (selectedQuote?.id === q.id) {
        setMailPreview(null);
        setSelectedQuote(null);
      }
    } catch (e) {
      console.error(e);
      setError(e?.response?.data?.error || e?.message || "Erreur suppression");
    } finally {
      setActionId(null);
    }
  };

  const exportEmails = async () => {
    try {
      setError("");
      setExporting(true);
      const params = {};
      if (startDate) params.startDate = startDate;
      if (endDate) params.endDate = endDate;
      const response = await api.get("/quotes/export-emails", {
        params,
        responseType: "blob",
      });
      const disposition = response.headers?.["content-disposition"] || "";
      const match = disposition.match(/filename="?([^"]+)"?/i);
      const filename = match?.[1] || "emails_agents.csv";
      const blob = new Blob([response.data], { type: "text/csv" });
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.download = filename;
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(url);
    } catch (e) {
      console.error(e);
      setError(e?.response?.data?.error || e?.message || "Erreur export");
    } finally {
      setExporting(false);
    }
  };

  return (
    <div className="space-y-4">
      <div className="bg-white border rounded-xl p-4">
        <div className="flex items-center justify-between gap-3 mb-3">
          <div className="font-bold text-lg">Back-office - Devis</div>
          <div className="flex items-center gap-2">
            <button
              className="px-3 py-1 rounded border bg-green-600 text-white hover:bg-green-700 disabled:opacity-60"
              onClick={exportEmails}
              disabled={exporting || loading}
            >
              {exporting ? "Export..." : "Exporter Excel"}
            </button>
            <button className="px-3 py-1 rounded border" onClick={() => load(page)} disabled={loading}>
              {loading ? "Chargement..." : "Rafraichir"}
            </button>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-3 mb-4">
          <input
            className="border rounded px-3 py-2 text-sm"
            placeholder="Filtrer: nom, email, tel, agent, statut, ID..."
            value={query}
            onChange={(e) => {
              setQuery(e.target.value);
              setPage(1);
            }}
            onKeyDown={(e) => {
              if (e.key === "Enter") load(1);
            }}
          />
          <input
            className="border rounded px-3 py-2 text-sm"
            type="date"
            value={startDate}
            onChange={(e) => {
              setStartDate(e.target.value);
              setPage(1);
            }}
          />
          <input
            className="border rounded px-3 py-2 text-sm"
            type="date"
            value={endDate}
            onChange={(e) => {
              setEndDate(e.target.value);
              setPage(1);
            }}
          />
        </div>
        <div className="mb-4">
          <button
            className="px-3 py-1 rounded border bg-blue-600 text-white hover:bg-blue-700 disabled:opacity-60"
            onClick={() => load(1)}
            disabled={loading}
          >
            Appliquer les filtres
          </button>
        </div>

        {error && (
          <div className="mb-3 p-3 rounded-lg border border-red-200 bg-red-50 text-red-700 text-sm">
            {error}
          </div>
        )}

        <div className="overflow-auto">
          <table className="w-full text-sm">
            <thead className="text-left text-gray-500">
              <tr className="border-b">
                <th className="py-2">ID</th>
                <th>Client</th>
                <th>Email</th>
                <th>Téléphone</th>
                <th>Agent</th>
                <th>Status</th>
                <th>Date</th>
                <th className="text-right">Actions</th>
              </tr>
            </thead>

            <tbody>
              {quotes.map((q) => (
                <tr key={q.id} className="border-b last:border-0">
                  <td className="py-2">#{q.id}</td>
                  <td>{formatCustomerName(q.customerName)}</td>
                  <td>{q.customerEmail}</td>
                  <td>{q.customerPhone || "—"}</td>
                  <td>{q.agent?.name || "—"}</td>
                  <td>{q.status}</td>
                  <td>{q.createdAt ? new Date(q.createdAt).toLocaleDateString() : "—"}</td>

                  <td className="text-right space-x-2">
                    <button
                      className="px-4 py-2 rounded bg-blue-600 text-white disabled:opacity-60 hover:bg-blue-700"
                      onClick={() => viewMail(q)}
                      disabled={actionId === q.id}
                    >
                      {actionId === q.id ? "..." : "Voir"}
                    </button>
                    <button
                      className="px-4 py-2 rounded bg-red-600 text-white disabled:opacity-60 hover:bg-red-700"
                      onClick={() => deleteQuote(q)}
                      disabled={actionId === q.id}
                    >
                      Supprimer
                    </button>
                  </td>
                </tr>
              ))}

              {quotes.length === 0 && (
                <tr>
                  <td className="py-3 text-gray-500" colSpan={8}>
                    Aucun devis.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        <div className="flex items-center justify-between mt-3 text-sm">
          <div>
            {total} devis • page {page} / {totalPages}
          </div>
          <div className="space-x-2">
            <button
              className="px-3 py-1 rounded border disabled:opacity-50"
              onClick={() => setPage((p) => Math.max(1, p - 1))}
              disabled={page <= 1}
            >
              Précédent
            </button>
            <button
              className="px-3 py-1 rounded border disabled:opacity-50"
              onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
              disabled={page >= totalPages}
            >
              Suivant
            </button>
          </div>
        </div>
      </div>

      {mailPreview && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl max-w-4xl w-full max-h-[90vh] overflow-y-auto">
            <div className="sticky top-0 bg-gradient-to-r from-blue-600 to-blue-800 text-white p-6">
              <div className="flex items-center justify-between">
                <div>
                  <h2 className="text-2xl font-bold mb-1">Aperçu du mail</h2>
                </div>
                <button
                  className="text-white hover:text-gray-200 text-3xl w-10 h-10 flex items-center justify-center rounded-full hover:bg-white/20"
                  onClick={() => {
                    setMailPreview(null);
                    setSelectedQuote(null);
                  }}
                >
                  X
                </button>
              </div>
            </div>

            <div className="p-4">
              <div className="border rounded-lg overflow-hidden mb-4">
                <iframe
                  title="Mail Preview"
                  className="w-full h-[400px]"
                  srcDoc={mailPreview.bodyHtml}
                />
              </div>
            </div>

            <div className="sticky bottom-0 bg-white border-t p-4 flex gap-3 justify-end">
              <button
                className="px-4 py-2 rounded bg-gray-500 text-white hover:bg-gray-600"
                onClick={() => {
                  setMailPreview(null);
                  setSelectedQuote(null);
                }}
              >
                Fermer
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
