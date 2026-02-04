import React, { useCallback, useEffect, useMemo, useState } from "react";
import api from "./api";

function formatDate(value) {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "-";
  return new Intl.DateTimeFormat("fr-BE", {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(date);
}

export default function AgentOffers({ currentUser }) {
  const [offers, setOffers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [selectedOffer, setSelectedOffer] = useState(null);
  const [query, setQuery] = useState("");
  const [appliedQuery, setAppliedQuery] = useState("");
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [total, setTotal] = useState(0);
  const limit = 8;

  const loadOffers = useCallback(async (nextPage, searchValue = appliedQuery) => {
    setLoading(true);
    setError("");
    try {
      const { data } = await api.get("/quotes/my-offers", {
        params: { page: nextPage, limit, query: searchValue || undefined },
      });
      setOffers(Array.isArray(data?.quotes) ? data.quotes : []);
      setTotalPages(Math.max(1, Number(data?.totalPages || 1)));
      setTotal(Number(data?.total || 0));
    } catch (e) {
      setError(e?.response?.data?.error || e?.message || "Erreur de chargement");
      setOffers([]);
      setTotalPages(1);
      setTotal(0);
    } finally {
      setLoading(false);
    }
  }, [appliedQuery, limit]);

  useEffect(() => {
    loadOffers(page);
  }, [loadOffers, page]);

  const canPrev = useMemo(() => page > 1 && !loading, [loading, page]);
  const canNext = useMemo(() => page < totalPages && !loading, [loading, page, totalPages]);

  return (
    <div className="space-y-4">
      <div className="bg-white border border-gray-200 rounded-xl p-4 shadow-sm">
        <div className="flex flex-wrap items-center justify-between gap-3 mb-4">
          <div>
            <h2 className="text-xl font-bold text-gray-900">Mes offres envoyées</h2>
            <p className="text-sm text-gray-600">
              Agent: <span className="font-semibold">{currentUser?.name || "-"}</span> · {total} offre(s) sur 30 jours
            </p>
          </div>
          <div className="flex items-center gap-2">
            <input
              type="text"
              value={query}
              onChange={(e) => {
                setQuery(e.target.value);
              }}
              onKeyDown={(e) => {
                if (e.key === "Enter") {
                  const value = query.trim();
                  setAppliedQuery(value);
                  setPage(1);
                }
              }}
              placeholder="Rechercher client, email, tel, ID..."
              className="w-72 px-3 py-2 rounded-lg border border-gray-300 text-sm"
            />
            <button
              type="button"
              onClick={() => {
                const value = query.trim();
                setAppliedQuery(value);
                setPage(1);
              }}
              className="px-3 py-2 rounded-lg bg-blue-600 text-white text-sm font-semibold hover:bg-blue-700"
              disabled={loading}
            >
              Rechercher
            </button>
            <button
              type="button"
              onClick={() => loadOffers(page)}
              className="px-3 py-2 rounded-lg border border-gray-300 text-sm font-semibold hover:bg-gray-50"
              disabled={loading}
            >
              Actualiser
            </button>
          </div>
        </div>

        {error ? (
          <div className="mb-4 rounded-lg border border-red-300 bg-red-50 p-3 text-sm text-red-700">{error}</div>
        ) : null}

        <div className="overflow-x-auto">
          <table className="w-full min-w-[850px] text-sm">
            <thead>
              <tr className="border-b bg-gray-50 text-gray-700">
                <th className="text-left p-2">Date</th>
                <th className="text-left p-2">Nom client</th>
                <th className="text-left p-2">Téléphone</th>
                <th className="text-left p-2">Email</th>
                <th className="text-right p-2">Action</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td className="p-4 text-gray-500" colSpan={5}>Chargement...</td>
                </tr>
              ) : offers.length === 0 ? (
                <tr>
                  <td className="p-4 text-gray-500" colSpan={5}>
                    Aucune offre envoyée pour le moment.
                  </td>
                </tr>
              ) : (
                offers.map((offer) => (
                  <tr key={offer.id} className="border-b align-top">
                    <td className="p-2 whitespace-nowrap">{formatDate(offer.createdAt)}</td>
                    <td className="p-2 font-medium text-gray-900">{offer.customerName || "-"}</td>
                    <td className="p-2 whitespace-nowrap">{offer.customerPhone || "-"}</td>
                    <td className="p-2 whitespace-nowrap">{offer.customerEmail || "-"}</td>
                    <td className="p-2 text-right">
                      <button
                        type="button"
                        onClick={() => setSelectedOffer(offer)}
                        className="px-4 py-2 rounded bg-blue-600 text-white hover:bg-blue-700"
                      >
                        Voir
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        <div className="mt-4 flex items-center justify-end gap-2">
          <button
            type="button"
            onClick={() => setPage((p) => Math.max(1, p - 1))}
            className="px-3 py-2 rounded-lg border border-gray-300 text-sm font-semibold disabled:opacity-50"
            disabled={!canPrev}
          >
            Précédent
          </button>
          <span className="text-sm text-gray-600">
            Page {page} / {totalPages}
          </span>
          <button
            type="button"
            onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
            className="px-3 py-2 rounded-lg border border-gray-300 text-sm font-semibold disabled:opacity-50"
            disabled={!canNext}
          >
            Suivant
          </button>
        </div>
      </div>

      {selectedOffer && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl max-w-4xl w-full max-h-[90vh] overflow-y-auto">
            <div className="sticky top-0 bg-gradient-to-r from-blue-600 to-blue-800 text-white p-6">
              <div className="flex items-center justify-between">
                <div>
                  <h2 className="text-2xl font-bold mb-1">Aperçu du mail</h2>
                  <p className="text-blue-100 text-sm">
                    {selectedOffer.customerName || "-"} · {selectedOffer.customerEmail || "-"}
                  </p>
                </div>
                <button
                  className="text-white hover:text-gray-200 text-3xl w-10 h-10 flex items-center justify-center rounded-full hover:bg-white/20"
                  onClick={() => setSelectedOffer(null)}
                  type="button"
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
                  srcDoc={selectedOffer.emailContent || "<p style='padding:16px'>Aucun contenu</p>"}
                />
              </div>
            </div>

            <div className="sticky bottom-0 bg-white border-t p-4 flex gap-3 justify-end">
              <button
                className="px-4 py-2 rounded bg-gray-500 text-white hover:bg-gray-600"
                onClick={() => setSelectedOffer(null)}
                type="button"
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
