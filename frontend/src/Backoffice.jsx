import React, { useEffect, useMemo, useState } from "react";
import api from "./api";

export default function Backoffice() {
  const [quotes, setQuotes] = useState([]);
  const [loading, setLoading] = useState(false);
  const [actionId, setActionId] = useState(null);
  const [error, setError] = useState("");
  const [selectedQuote, setSelectedQuote] = useState(null);
  const [mailPreview, setMailPreview] = useState(null);

  const toSendQuotes = useMemo(
    () => quotes.filter((q) => q.status === "TO_SEND"),
    [quotes]
  );

  const load = async () => {
    try {
      setError("");
      setLoading(true);
      const { data } = await api.get("/quotes");
      setQuotes(data.quotes || []);
    } catch (e) {
      console.error(e);
      setError(e?.response?.data?.error || e?.message || "Erreur lors du chargement");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, []);

  const viewAndSendMail = async (q) => {
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

  const copyHtmlToClipboard = async () => {
    try {
      if (!mailPreview?.bodyHtml) return;

      const html = mailPreview.bodyHtml;

      try {
        const blob = new Blob([html], { type: "text/html" });
        const data = [new ClipboardItem({ "text/html": blob })];
        await navigator.clipboard.write(data);
        alert("Mail copie avec formatage ! Collez-le dans Outlook (Ctrl+V).");
      } catch (e) {
        await navigator.clipboard.writeText(html);
        alert("HTML copie ! Collez-le dans Outlook (Ctrl+V).");
      }
    } catch (e) {
      console.error(e);
      alert("Erreur lors de la copie");
    }
  };

  const buildEml = () => {
    if (!mailPreview?.bodyHtml) return "";
    const to = mailPreview.customerEmail || "";
    const subject = mailPreview.subject || "Offre Proximus";
    const html = mailPreview.bodyHtml;
    return [
      `To: ${to}`,
      `Subject: ${subject}`,
      "MIME-Version: 1.0",
      'Content-Type: text/html; charset="UTF-8"',
      "Content-Transfer-Encoding: 7bit",
      "",
      html,
      "",
    ].join("\r\n");
  };


  const openEml = () => {
    const eml = buildEml();
    if (!eml) return;
    const blob = new Blob([eml], { type: "message/rfc822" });
    const url = URL.createObjectURL(blob);
    window.open(url, "_blank", "noopener,noreferrer");
    setTimeout(() => URL.revokeObjectURL(url), 10000);
  };




  const markAsSent = async () => {
    try {
      setError("");
      setActionId(selectedQuote.id);
      await api.post(`/quotes/${selectedQuote.id}/send`);
      await load();
      setMailPreview(null);
      setSelectedQuote(null);
    } catch (e) {
      console.error(e);
      setError(e?.response?.data?.error || e?.message || "Erreur envoi");
    } finally {
      setActionId(null);
    }
  };

  return (
    <div className="space-y-4">
      <div className="bg-white border rounded-xl p-4">
        <div className="flex items-center justify-between gap-3 mb-3">
          <div className="font-bold text-lg">Back-office - Devis a envoyer</div>
          <button className="px-3 py-1 rounded border" onClick={load} disabled={loading}>
            {loading ? "Chargement..." : "Rafraichir"}
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
                <th>Status</th>
                <th>Y1</th>
                <th>Y2</th>
                <th className="text-right">Actions</th>
              </tr>
            </thead>

            <tbody>
              {toSendQuotes.map((q) => (
                <tr key={q.id} className="border-b last:border-0">
                  <td className="py-2">#{q.id}</td>
                  <td>{q.customerName}</td>
                  <td>{q.customerEmail}</td>
                  <td>{q.status}</td>
                  <td>{Number(q.totalY1 || 0).toFixed(2)}</td>
                  <td>{Number(q.totalY2 || 0).toFixed(2)}</td>

                  <td className="text-right">
                    <button
                      className="px-4 py-2 rounded bg-blue-600 text-white disabled:opacity-60 hover:bg-blue-700"
                      onClick={() => viewAndSendMail(q)}
                      disabled={actionId === q.id}
                    >
                      {actionId === q.id ? "..." : "Envoyer"}
                    </button>
                  </td>
                </tr>
              ))}

              {toSendQuotes.length === 0 && (
                <tr>
                  <td className="py-3 text-gray-500" colSpan={7}>
                    Aucun devis a envoyer.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {mailPreview && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl max-w-4xl w-full max-h-[90vh] overflow-y-auto">
            <div className="sticky top-0 bg-gradient-to-r from-blue-600 to-blue-800 text-white p-6">
              <div className="flex items-center justify-between">
                <div>
                  <h2 className="text-2xl font-bold mb-1">{mailPreview.subject}</h2>
                  <div className="opacity-90">{mailPreview.customerName} ({mailPreview.customerEmail})</div>
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
              <div className="mb-4 p-3 bg-gray-100 rounded border">
                <div className="text-sm text-gray-600">
                  <strong>A :</strong> {mailPreview.customerEmail}
                </div>
                <div className="text-sm text-gray-600">
                  <strong>Sujet :</strong> {mailPreview.subject}
                </div>
              </div>

              <div className="border rounded-lg overflow-hidden mb-4">
                <iframe
                  title="Mail Preview"
                  className="w-full h-[400px]"
                  srcDoc={mailPreview.bodyHtml}
                />
              </div>

              <div className="mb-4 p-3 bg-blue-50 border border-blue-200 rounded text-sm text-blue-800">
                <strong>Comment envoyer :</strong>
                <ul className="mt-2 space-y-1 ml-4 list-disc">
                  <li>Cliquez sur "Copier le mail" pour copier tout le format HTML</li>
                  <li>Creez un nouveau mail dans Outlook</li>
                  <li>Collez le contenu (Ctrl+V)</li>
                  <li>Le client recevra le mail complet avec tous les styles</li>
                </ul>
              </div>
            </div>

            <div className="sticky bottom-0 bg-white border-t p-4 flex gap-3 justify-end">
              <button
                className="px-4 py-2 rounded border hover:bg-gray-100"
                onClick={openEml}
              >
                Ouvrir EML
              </button>
              <button
                className="px-4 py-2 rounded border hover:bg-gray-100"
                onClick={copyHtmlToClipboard}
              >
                Copier le mail
              </button>
              <button
                className="px-4 py-2 rounded bg-green-600 text-white hover:bg-green-700 disabled:opacity-60"
                onClick={markAsSent}
                disabled={actionId === selectedQuote?.id}
              >
                Marque comme envoye
              </button>
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
