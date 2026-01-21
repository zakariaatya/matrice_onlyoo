import React, { useEffect, useMemo, useState } from "react";
import api from "./api";

function Input(props) {
    return (
        <input
            {...props}
            className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
        />
    );
}

function Textarea(props) {
    return (
        <textarea
            {...props}
            className="w-full px-3 py-2 border border-gray-200 rounded-lg resize-y min-h-[80px] focus:ring-2 focus:ring-purple-500 focus:border-transparent"
        />
    );
}

function Select(props) {
    return (
        <select
            {...props}
            className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
        />
    );
}

function Button({ variant = "primary", loading = false, className = "", ...props }) {
    const base = "px-3 py-1.5 rounded-lg font-medium text-sm transition-colors inline-flex items-center justify-center gap-1";
    const styles = {
        primary: "bg-purple-700 text-white hover:bg-purple-800 disabled:bg-purple-400",
        secondary: "bg-gray-100 text-gray-700 hover:bg-gray-200 border border-gray-300",
        danger: "bg-red-600 text-white hover:bg-red-700",
        success: "bg-green-600 text-white hover:bg-green-700",
    };
    return (
        <button
            {...props}
            disabled={loading || props.disabled}
            className={`${base} ${styles[variant]} ${loading ? "opacity-50 cursor-wait" : ""} ${className}`}
        />
    );
}

function Modal({ isOpen, onClose, title, children }) {
    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
            <div className="bg-white rounded-xl p-6 w-full max-w-lg mx-4 max-h-[90vh] overflow-auto">
                <div className="flex justify-between items-center mb-4">
                    <h2 className="text-xl font-bold">{title}</h2>
                    <button onClick={onClose} className="text-gray-500 hover:text-gray-700 text-2xl leading-none">
                        ×
                    </button>
                </div>
                {children}
            </div>
        </div>
    );
}

function Card({ title, children, className = "" }) {
    return (
        <div className={`bg-white border border-gray-200 rounded-xl shadow-sm ${className}`}>
            {title && (
                <div className="px-4 py-3 border-b border-gray-200 bg-gray-50 rounded-t-xl">
                    <h3 className="font-bold text-lg text-gray-800">{title}</h3>
                </div>
            )}
            <div className="p-4">{children}</div>
        </div>
    );
}

function getApiErrorMessage(err) {
    const msg =
        err?.response?.data?.message ||
        err?.response?.data?.error ||
        err?.message ||
        "Erreur inconnue";
    return String(msg);
}

export default function ManagerMatrix() {
    const [sections, setSections] = useState([]);
    const [choices, setChoices] = useState([]);
    const [loading, setLoading] = useState(false);

    // Modal state for choices
    const [editModalOpen, setEditModalOpen] = useState(false);
    const [editingChoice, setEditingChoice] = useState(null);
    const [editForm, setEditForm] = useState({});
    const [saving, setSaving] = useState(false);

    // Modal state for sections
    const [sectionModalOpen, setSectionModalOpen] = useState(false);
    const [editingSection, setEditingSection] = useState(null);
    const [sectionForm, setSectionForm] = useState({});
    const [savingSection, setSavingSection] = useState(false);
    const [draggingChoiceId, setDraggingChoiceId] = useState(null);
    const [dragOverChoiceId, setDragOverChoiceId] = useState(null);

    const [secForm, setSecForm] = useState({
        key: "",
        title: "",
        type: "single",
        sortOrder: 0,
    });

    const [choiceForm, setChoiceForm] = useState({
        sectionId: "",
        key: "",
        label: "",
        description: "",
        priceY1: 0,
        priceY2: 0,
        sortOrder: 0,
        active: true,
        parentId: "", // Added parentId field
    });

    const loadAll = async () => {
        setLoading(true);
        try {
            const [s, c] = await Promise.all([
                api.get("/matrix/sections"),
                api.get("/matrix/choices"),
            ]);
            setSections(s.data.sections || []);
            setChoices(c.data.choices || []);
        } catch (err) {
            console.error("Erreur chargement données:", err);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        loadAll();
    }, []);

    // Tri stable des sections
    const sortedSections = useMemo(() => {
        return [...sections].sort((a, b) => (a.sortOrder ?? 0) - (b.sortOrder ?? 0));
    }, [sections]);

    // Organisation des choix par section et hierarchie (parent/enfant)
    const choicesBySection = useMemo(() => {
        const map = new Map();
        sortedSections.forEach((sec) => map.set(sec.id, []));

        // 1. Identifier tous les choix racine (sans parentId)
        const rootChoices = choices.filter((ch) => !ch.parentId);

        // 2. Construire des objets racine sans muter l'état
        rootChoices.forEach((root) => {
            const children = choices
                .filter((ch) => ch.parentId === root.id)
                .sort((a, b) => (a.sortOrder ?? 0) - (b.sortOrder ?? 0));

            const rootWithChildren = { ...root, children };
            if (!map.has(root.sectionId)) map.set(root.sectionId, []);
            map.get(root.sectionId).push(rootWithChildren);
        });

        // 3. Trier les racines
        for (const [k, arr] of map.entries()) {
            arr.sort((a, b) => (a.sortOrder ?? 0) - (b.sortOrder ?? 0));
            map.set(k, arr);
        }
        return map;
    }, [sortedSections, choices]);

    // Modal d'édition pour les choix
    const openChoiceModal = (ch) => {
        setEditingChoice(ch);
        setEditForm({
            label: ch.label || "",
            description: ch.description || "",
            priceY1: ch.priceY1 || 0,
            priceY2: ch.priceY2 || 0,
            parentId: ch.parentId || "", // Gérer parentId
        });
        setEditModalOpen(true);
    };

    const saveChoiceFromModal = async () => {
        if (!editingChoice) return;
        setSaving(true);
        try {
            // Convertir parentId en nombre ou null
            const payload = { ...editForm, parentId: editForm.parentId ? Number(editForm.parentId) : null };
            await api.put(`/matrix/choices/${editingChoice.id}`, payload);
            await loadAll();
            setEditModalOpen(false);
            setEditingChoice(null);
            setEditForm({});
        } catch (err) {
            alert(`Erreur: ${getApiErrorMessage(err)}`);
        } finally {
            setSaving(false);
        }
    };

    // Modal d'édition pour les sections
    const openSectionModal = (sec) => {
        setEditingSection(sec);
        setSectionForm({
            title: sec.title || "",
            key: sec.key || "",
            type: sec.type || "single",
        });
        setSectionModalOpen(true);
    };

    const saveSectionFromModal = async () => {
        if (!editingSection) return;
        setSavingSection(true);
        try {
            await api.put(`/matrix/sections/${editingSection.id}`, sectionForm);
            await loadAll();
            setSectionModalOpen(false);
            setEditingSection(null);
            setSectionForm({});
        } catch (err) {
            alert(`Erreur: ${getApiErrorMessage(err)}`);
        } finally {
            setSavingSection(false);
        }
    };

    // SECTION ACTIONS
    const createSection = async () => {
        if (!secForm.key || !secForm.title) return alert("key + title requis");
        await api.post("/matrix/sections", secForm);
        setSecForm({ key: "", title: "", type: "single", sortOrder: 0 });
        await loadAll();
    };

    const moveSectionUp = async (sec) => {
        const sorted = sortedSections;
        const idx = sorted.findIndex((s) => s.id === sec.id);
        if (idx <= 0) return;
        const prev = sorted[idx - 1];
        const newOrder = (prev.sortOrder ?? 0) - 1;
        await api.put(`/matrix/sections/${sec.id}`, { sortOrder: newOrder });
        await loadAll();
    };

    const moveSectionDown = async (sec) => {
        const sorted = sortedSections;
        const idx = sorted.findIndex((s) => s.id === sec.id);
        if (idx >= sorted.length - 1) return;
        const next = sorted[idx + 1];
        const newOrder = (next.sortOrder ?? 0) + 1;
        await api.put(`/matrix/sections/${sec.id}`, { sortOrder: newOrder });
        await loadAll();
    };

    const reorderSections = async (sourceId, targetId) => {
        const list = sortedSections.slice();
        const from = list.findIndex((s) => s.id === sourceId);
        const to = list.findIndex((s) => s.id === targetId);
        if (from < 0 || to < 0 || from === to) return;

        const next = list.slice();
        const [moved] = next.splice(from, 1);
        next.splice(to, 0, moved);

        const updates = next.map((s, idx) => ({
            id: s.id,
            sortOrder: idx,
        }));

        await Promise.all(
            updates
                .filter((u) => (sortedSections.find((s) => s.id === u.id)?.sortOrder ?? 0) !== u.sortOrder)
                .map((u) => api.put(`/matrix/sections/${u.id}`, { sortOrder: u.sortOrder }))
        );
        await loadAll();
    };

    const startSectionDrag = (sectionId) => {
        setDraggingChoiceId(sectionId);
    };

    const handleSectionDrop = async (targetId) => {
        if (!draggingChoiceId || draggingChoiceId === targetId) return;
        await reorderSections(draggingChoiceId, targetId);
        setDraggingChoiceId(null);
        setDragOverChoiceId(null);
    };

    const deleteSection = async (sec) => {
        const ok = window.confirm(`Supprimer "${sec.title}" ?`);
        if (!ok) return;
        try {
            await api.delete(`/matrix/sections/${sec.id}`);
            await loadAll();
        } catch (err) {
            alert(`Impossible de supprimer: ${getApiErrorMessage(err)}`);
        }
    };

    // CHOICE ACTIONS
    const createChoice = async () => {
        if (!choiceForm.sectionId || !choiceForm.key || !choiceForm.label)
            return alert("sectionId + key + label requis");

        try {
            await api.post("/matrix/choices", {
                ...choiceForm,
                sectionId: Number(choiceForm.sectionId),
                parentId: choiceForm.parentId ? Number(choiceForm.parentId) : null,
            });
            setChoiceForm({
                sectionId: "",
                key: "",
                label: "",
                description: "",
                priceY1: 0,
                priceY2: 0,
                sortOrder: 0,
                active: true,
                parentId: "",
            });
            await loadAll();
        } catch (err) {
            alert(`Erreur création choix: ${getApiErrorMessage(err)}`);
        }
    };

    const reorderChoices = async (sourceId, targetId) => {
        const source = choices.find((c) => c.id === sourceId);
        const target = choices.find((c) => c.id === targetId);
        if (!source || !target) return;

        const sourceParentId = source.parentId || null;
        const targetParentId = target.parentId || null;
        if (source.sectionId !== target.sectionId) return;
        if (sourceParentId !== targetParentId) return;

        const siblings = choices
            .filter((c) => c.sectionId === source.sectionId && (c.parentId || null) === sourceParentId)
            .slice()
            .sort((a, b) => (a.sortOrder ?? 0) - (b.sortOrder ?? 0));

        const from = siblings.findIndex((c) => c.id === sourceId);
        const to = siblings.findIndex((c) => c.id === targetId);
        if (from < 0 || to < 0 || from === to) return;

        const next = siblings.slice();
        const [moved] = next.splice(from, 1);
        next.splice(to, 0, moved);

        const updates = next.map((c, idx) => ({
            id: c.id,
            sortOrder: idx,
        }));

        await Promise.all(
            updates
                .filter((u) => (choices.find((c) => c.id === u.id)?.sortOrder ?? 0) !== u.sortOrder)
                .map((u) => api.put(`/matrix/choices/${u.id}`, { sortOrder: u.sortOrder }))
        );
        await loadAll();
    };

    const startDrag = (choiceId) => {
        setDraggingChoiceId(choiceId);
    };

    const handleDrop = async (targetId) => {
        if (!draggingChoiceId || draggingChoiceId === targetId) return;
        await reorderChoices(draggingChoiceId, targetId);
        setDraggingChoiceId(null);
        setDragOverChoiceId(null);
    };

    const deleteChoice = async (ch) => {
        const ok = window.confirm(`Supprimer "${ch.label}" ?`);
        if (!ok) return;
        try {
            await api.delete(`/matrix/choices/${ch.id}`);
            await loadAll();
        } catch (err) {
            alert(`Impossible de supprimer: ${getApiErrorMessage(err)}`);
        }
    };

    return (
        <div className="space-y-8 p-4">
            {/* Modal choix */}
            <Modal
                isOpen={editModalOpen}
                onClose={() => setEditModalOpen(false)}
                title="Modifier le choix"
            >
                <div className="space-y-4">
                    <div>
                        <div className="text-sm font-semibold text-gray-600 mb-1">Label</div>
                        <Input
                            value={editForm.label}
                            onChange={(e) => setEditForm({ ...editForm, label: e.target.value })}
                        />
                    </div>
                    <div>
                        <div className="text-sm font-semibold text-gray-600 mb-1">Description</div>
                        <Textarea
                            value={editForm.description || ""}
                            onChange={(e) => setEditForm({ ...editForm, description: e.target.value })}
                            placeholder="Vous pouvez écrire plusieurs lignes..."
                        />
                    </div>
                    {/* Parent selection in Edit Modal */}
                    {editingChoice && (
                        <div>
                            <div className="text-sm font-semibold text-gray-600 mb-1">Choix Parent (optionnel)</div>
                            <Select
                                value={editForm.parentId || ""}
                                onChange={(e) => setEditForm({ ...editForm, parentId: e.target.value })}
                            >
                                <option value="">-- Aucun (choix principal) --</option>
                                {/* Lister uniquement les choix de la même section qui ne sont pas lui-même */}
                                {choices
                                    .filter(c => c.sectionId === editingChoice.sectionId && c.id !== editingChoice.id && !c.parentId)
                                    .map((c) => (
                                        <option key={c.id} value={c.id}>{c.label}</option>
                                    ))}
                            </Select>
                        </div>
                    )}

                    <div className="grid grid-cols-2 gap-3">
                        <div>
                            <div className="text-sm font-semibold text-gray-600 mb-1">Prix Année 1</div>
                            <Input
                                type="number"
                                step="0.01"
                                value={editForm.priceY1}
                                onChange={(e) => setEditForm({ ...editForm, priceY1: Number(e.target.value) })}
                                disabled={!!editForm.parentId}
                                title={editForm.parentId ? "Hérité du parent" : ""}
                                className={editForm.parentId ? "bg-gray-100" : ""}
                            />
                        </div>
                        <div>
                            <div className="text-sm font-semibold text-gray-600 mb-1">Prix Année 2</div>
                            <Input
                                type="number"
                                step="0.01"
                                value={editForm.priceY2}
                                onChange={(e) => setEditForm({ ...editForm, priceY2: Number(e.target.value) })}
                                disabled={!!editForm.parentId}
                                title={editForm.parentId ? "Hérité du parent" : ""}
                                className={editForm.parentId ? "bg-gray-100" : ""}
                            />
                        </div>
                    </div>
                    <div className="flex gap-2 pt-2">
                        <Button variant="success" onClick={saveChoiceFromModal} loading={saving} className="flex-1">
                            Sauvegarder
                        </Button>
                        <Button variant="secondary" onClick={() => setEditModalOpen(false)} disabled={saving} className="flex-1">
                            Annuler
                        </Button>
                    </div>
                </div>
            </Modal>

            {/* Modal section */}
            <Modal
                isOpen={sectionModalOpen}
                onClose={() => setSectionModalOpen(false)}
                title="Modifier la section"
            >
                <div className="space-y-4">
                    <div>
                        <div className="text-sm font-semibold text-gray-600 mb-1">Titre</div>
                        <Input
                            value={sectionForm.title}
                            onChange={(e) => setSectionForm({ ...sectionForm, title: e.target.value })}
                        />
                    </div>
                    <div>
                        <div className="text-sm font-semibold text-gray-600 mb-1">Key (unique)</div>
                        <Input
                            value={sectionForm.key}
                            disabled
                            className="bg-gray-100"
                        />
                    </div>
                    <div>
                        <div className="text-sm font-semibold text-gray-600 mb-1">Type</div>
                        <Select
                            value={sectionForm.type}
                            onChange={(e) => setSectionForm({ ...sectionForm, type: e.target.value })}
                        >
                            <option value="single">single</option>
                            <option value="multi">multi</option>
                            <option value="boolean">boolean</option>
                        </Select>
                    </div>
                    <div className="flex gap-2 pt-2">
                        <Button variant="success" onClick={saveSectionFromModal} loading={savingSection} className="flex-1">
                            Sauvegarder
                        </Button>
                        <Button variant="secondary" onClick={() => setSectionModalOpen(false)} disabled={savingSection} className="flex-1">
                            Annuler
                        </Button>
                    </div>
                </div>
            </Modal>

            {/* SECTION FORM */}
            <Card title="➕ Ajouter une section">
                <div className="grid md:grid-cols-4 gap-3">
                    <div>
                        <div className="text-xs font-semibold text-gray-600 mb-1">Key (unique)</div>
                        <Input
                            value={secForm.key}
                            onChange={(e) => setSecForm({ ...secForm, key: e.target.value })}
                            placeholder="pack_type"
                        />
                    </div>
                    <div>
                        <div className="text-xs font-semibold text-gray-600 mb-1">Titre</div>
                        <Input
                            value={secForm.title}
                            onChange={(e) => setSecForm({ ...secForm, title: e.target.value })}
                            placeholder="Type de pack"
                        />
                    </div>
                    <div>
                        <div className="text-xs font-semibold text-gray-600 mb-1">Type</div>
                        <Select
                            value={secForm.type}
                            onChange={(e) => setSecForm({ ...secForm, type: e.target.value })}
                        >
                            <option value="single">single</option>
                            <option value="multi">multi</option>
                            <option value="boolean">boolean</option>
                        </Select>
                    </div>
                    <div className="flex items-end">
                        <Button onClick={createSection} disabled={loading} className="w-full">
                            Ajouter section
                        </Button>
                    </div>
                </div>
            </Card>

            {/* SECTIONS LIST */}
            <Card title="📋 Sections existantes">
                {loading && <div className="text-gray-500 mb-2">Chargement...</div>}
                <div className="overflow-x-auto">
                    <table className="w-full text-sm">
                        <thead className="text-left text-gray-500 bg-gray-50">
                            <tr>
                                <th className="py-2 px-3">Titre</th>
                                <th className="py-2 px-3">Key</th>
                                <th className="py-2 px-3">Type</th>
                                <th className="py-2 px-3 text-center">Actif</th>
                                <th className="py-2 px-3 text-center">Drag</th>
                                <th className="py-2 px-3 text-right">Actions</th>
                            </tr>
                        </thead>
                        <tbody>
                            {sortedSections.map((sec) => (
                                <tr
                                    key={sec.id}
                                    className={`border-b last:border-0 ${dragOverChoiceId === sec.id ? "bg-blue-50" : "hover:bg-gray-50"}`}
                                    onDragOver={(e) => {
                                        e.preventDefault();
                                        setDragOverChoiceId(sec.id);
                                    }}
                                    onDrop={(e) => {
                                        e.preventDefault();
                                        handleSectionDrop(sec.id);
                                    }}
                                    onDragLeave={() => setDragOverChoiceId(null)}
                                >
                                    <td className="py-2 px-3 font-medium">{sec.title}</td>
                                    <td className="py-2 px-3 text-gray-500 font-mono text-xs">{sec.key}</td>
                                    <td className="py-2 px-3">
                                        <span className="px-2 py-0.5 bg-purple-100 text-purple-700 rounded text-xs">
                                            {sec.type}
                                        </span>
                                    </td>
                                    <td className="py-2 px-3 text-center">
                                        <input
                                            type="checkbox"
                                            checked={sec.active !== false}
                                            onChange={(e) => api.put(`/matrix/sections/${sec.id}`, { active: e.target.checked }).then(loadAll)}
                                            className="cursor-pointer w-4 h-4"
                                        />
                                    </td>
                                    <td className="py-2 px-3 text-center">
                                        <span
                                            className="inline-flex items-center justify-center w-7 h-7 rounded bg-gray-100 text-gray-600 cursor-move select-none"
                                            title="Glisser pour reordonner"
                                            draggable
                                            onDragStart={() => startSectionDrag(sec.id)}
                                            onDragEnd={() => {
                                                setDraggingChoiceId(null);
                                                setDragOverChoiceId(null);
                                            }}
                                        >
                                            ⠿
                                        </span>
                                    </td>
                                    <td className="py-2 px-3 text-right">
                                        <span className="inline-flex gap-1">
                                            <Button variant="secondary" onClick={() => openSectionModal(sec)} disabled={loading}>
                                                Modifier
                                            </Button>
                                            <Button variant="danger" onClick={() => deleteSection(sec)} disabled={loading}>
                                                Supprimer
                                            </Button>
                                        </span>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </Card>

            {/* CHOICE FORM */}
            <Card title="➕ Ajouter un choix">
                <div className="grid md:grid-cols-4 gap-3">
                    <div>
                        <div className="text-xs font-semibold text-gray-600 mb-1">Section</div>
                        <Select
                            value={choiceForm.sectionId}
                            onChange={(e) => setChoiceForm({ ...choiceForm, sectionId: e.target.value })}
                        >
                            <option value="">-- choisir --</option>
                            {sortedSections.map((s) => (
                                <option key={s.id} value={s.id}>{s.title}</option>
                            ))}
                        </Select>
                    </div>
                    <div>
                        {/* PARENT SELECTOR IN ADD FORM */}
                        <div className="text-xs font-semibold text-gray-600 mb-1">Choix Parent (optionnel)</div>
                        <Select
                            value={choiceForm.parentId}
                            onChange={(e) => setChoiceForm({ ...choiceForm, parentId: e.target.value })}
                            disabled={!choiceForm.sectionId}
                        >
                            <option value="">-- Aucun (choix principal) --</option>
                            {choiceForm.sectionId && sortedSections.length > 0 &&
                                // Filtrer les choix de la section actuelle qui n'ont pas de parent (pour éviter n niveaux)
                                choices
                                    .filter(c => c.sectionId === Number(choiceForm.sectionId) && !c.parentId)
                                    .map((c) => (
                                        <option key={c.id} value={c.id}>↳ {c.label}</option>
                                    ))
                            }
                        </Select>
                    </div>
                    <div>
                        <div className="text-xs font-semibold text-gray-600 mb-1">Key (unique)</div>
                        <Input
                            value={choiceForm.key}
                            onChange={(e) => setChoiceForm({ ...choiceForm, key: e.target.value })}
                            placeholder="flex_xs"
                        />
                    </div>
                    <div>
                        <div className="text-xs font-semibold text-gray-600 mb-1">Label</div>
                        <Input
                            value={choiceForm.label}
                            onChange={(e) => setChoiceForm({ ...choiceForm, label: e.target.value })}
                            placeholder="Flex+ XS"
                        />
                    </div>
                    <div>
                        <div className="text-xs font-semibold text-gray-600 mb-1">Prix Y1 (€)</div>
                        <Input
                            type="number"
                            step="0.01"
                            value={choiceForm.priceY1}
                            onChange={(e) => setChoiceForm({ ...choiceForm, priceY1: Number(e.target.value) })}
                            disabled={!!choiceForm.parentId} // Disabled if sub-choice
                            className={choiceForm.parentId ? "bg-gray-100" : ""}
                        />
                    </div>
                    <div>
                        <div className="text-xs font-semibold text-gray-600 mb-1">Prix Y2 (€)</div>
                        <Input
                            type="number"
                            step="0.01"
                            value={choiceForm.priceY2}
                            onChange={(e) => setChoiceForm({ ...choiceForm, priceY2: Number(e.target.value) })}
                            disabled={!!choiceForm.parentId}
                            className={choiceForm.parentId ? "bg-gray-100" : ""}
                        />
                    </div>
                    <div className="md:col-span-2">
                        <div className="text-xs font-semibold text-gray-600 mb-1">Description</div>
                        <Input
                            value={choiceForm.description}
                            onChange={(e) => setChoiceForm({ ...choiceForm, description: e.target.value })}
                            placeholder="Description optionnelle..."
                        />
                    </div>
                    <div className="flex items-end">
                        <Button onClick={createChoice} disabled={loading} className="w-full">
                            {choiceForm.parentId ? "Ajouter sous-choix" : "Ajouter choix"}
                        </Button>
                    </div>
                </div>
                {choiceForm.parentId && (
                    <div className="mt-2 text-xs text-purple-600 bg-purple-50 p-2 rounded border border-purple-100">
                        ℹ️ Les sous-choix héritent automatiquement du prix de leur parent.
                    </div>
                )}
            </Card>

            {/* CHOICES LIST - Séparé par section */}
            <div className="space-y-6">
                <h2 className="text-xl font-bold text-gray-800">📦 Choix par section</h2>
                {loading && <div className="text-gray-500">Chargement...</div>}

                {sortedSections.map((sec) => (
                    <Card key={sec.id} title={`${sec.title} (${sec.key})`} className="border-l-4 border-l-purple-500">
                        <div className="overflow-x-auto">
                            <table className="w-full text-sm">
                                <thead className="text-left text-gray-500 bg-gray-50">
                                    <tr>
                                        <th className="py-2 px-3">Label</th>
                                        <th className="py-2 px-3">Key</th>
                                        <th className="py-2 px-3">Description</th>
                                        <th className="py-2 px-3 text-right">Y1 (€)</th>
                                        <th className="py-2 px-3 text-right">Y2 (€)</th>
                                        <th className="py-2 px-3 text-center">Actif</th>
                                        <th className="py-2 px-3 text-center">Drag</th>
                                        <th className="py-2 px-3 text-right">Actions</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {(choicesBySection.get(sec.id) || []).map((ch) => (
                                        <React.Fragment key={ch.id}>
                                            {/* ROOT CHOICE ROW */}
                                            <tr
                                                className={`border-b last:border-0 bg-white ${dragOverChoiceId === ch.id ? "bg-blue-50" : "hover:bg-gray-50"}`}
                                                onDragOver={(e) => {
                                                    e.preventDefault();
                                                    setDragOverChoiceId(ch.id);
                                                }}
                                                onDrop={(e) => {
                                                    e.preventDefault();
                                                    handleDrop(ch.id);
                                                }}
                                                onDragLeave={() => setDragOverChoiceId(null)}
                                            >
                                                <td className="py-2 px-3 font-medium text-gray-900">{ch.label}</td>
                                                <td className="py-2 px-3 text-gray-500 font-mono text-xs">{ch.key}</td>
                                                <td className="py-2 px-3 text-gray-600 text-xs max-w-xs truncate">
                                                    {ch.description || "-"}
                                                </td>
                                                <td className="py-2 px-3 text-right font-mono">{ch.priceY1?.toFixed(2)}</td>
                                                <td className="py-2 px-3 text-right font-mono">{ch.priceY2?.toFixed(2)}</td>
                                                <td className="py-2 px-3 text-center">
                                                    <input
                                                        type="checkbox"
                                                        checked={ch.active !== false}
                                                        onChange={(e) => api.put(`/matrix/choices/${ch.id}`, { active: e.target.checked }).then(loadAll)}
                                                        className="cursor-pointer w-4 h-4"
                                                    />
                                                </td>
                                                <td className="py-2 px-3 text-center">
                                                    <span
                                                        className="inline-flex items-center justify-center w-7 h-7 rounded bg-gray-100 text-gray-600 cursor-move select-none"
                                                        title="Glisser pour reordonner"
                                                        draggable
                                                        onDragStart={() => startDrag(ch.id)}
                                                        onDragEnd={() => {
                                                            setDraggingChoiceId(null);
                                                            setDragOverChoiceId(null);
                                                        }}
                                                    >
                                                        ⠿
                                                    </span>
                                                </td>
                                                <td className="py-2 px-3 text-right">
                                                    <span className="inline-flex gap-1">
                                                        <Button variant="secondary" onClick={() => openChoiceModal(ch)} disabled={loading}>
                                                            Modifier
                                                        </Button>
                                                        <Button variant="danger" onClick={() => deleteChoice(ch)} disabled={loading}>
                                                            Supprimer
                                                        </Button>
                                                    </span>
                                                </td>
                                            </tr>

                                            {/* CHILDREN ROWS */}
                                            {ch.children && ch.children.map(subCh => (
                                                <tr
                                                    key={subCh.id}
                                                    className={`border-b bg-purple-50/50 ${dragOverChoiceId === subCh.id ? "bg-blue-50" : "hover:bg-purple-50"}`}
                                                    onDragOver={(e) => {
                                                        e.preventDefault();
                                                        setDragOverChoiceId(subCh.id);
                                                    }}
                                                    onDrop={(e) => {
                                                        e.preventDefault();
                                                        handleDrop(subCh.id);
                                                    }}
                                                    onDragLeave={() => setDragOverChoiceId(null)}
                                                >
                                                    <td className="py-2 px-3 font-medium text-purple-700 pl-8 relative">
                                                        <span className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400">↳</span>
                                                        {subCh.label}
                                                    </td>
                                                    <td className="py-2 px-3 text-gray-500 font-mono text-xs">{subCh.key}</td>
                                                    <td className="py-2 px-3 text-gray-600 text-xs max-w-xs truncate">
                                                        {subCh.description || "-"}
                                                    </td>
                                                    <td className="py-2 px-3 text-right font-mono text-gray-400 italic" title="Hérité">
                                                        {ch.priceY1?.toFixed(2)}
                                                    </td>
                                                    <td className="py-2 px-3 text-right font-mono text-gray-400 italic" title="Hérité">
                                                        {ch.priceY2?.toFixed(2)}
                                                    </td>
                                                    <td className="py-2 px-3 text-center">
                                                        <input
                                                            type="checkbox"
                                                            checked={subCh.active !== false}
                                                            onChange={(e) => api.put(`/matrix/choices/${subCh.id}`, { active: e.target.checked }).then(loadAll)}
                                                            className="cursor-pointer w-4 h-4"
                                                        />
                                                    </td>
                                                    <td className="py-2 px-3 text-center">
                                                        <span
                                                            className="inline-flex items-center justify-center w-7 h-7 rounded bg-purple-100 text-purple-700 cursor-move select-none"
                                                            title="Glisser pour reordonner"
                                                            draggable
                                                            onDragStart={() => startDrag(subCh.id)}
                                                            onDragEnd={() => {
                                                                setDraggingChoiceId(null);
                                                                setDragOverChoiceId(null);
                                                            }}
                                                        >
                                                            ⠿
                                                        </span>
                                                    </td>
                                                    <td className="py-2 px-3 text-right">
                                                        <span className="inline-flex gap-1">
                                                            <Button variant="secondary" onClick={() => openChoiceModal(subCh)} disabled={loading}>
                                                                Modifier
                                                            </Button>
                                                            <Button variant="danger" onClick={() => deleteChoice(subCh)} disabled={loading}>
                                                                Supprimer
                                                            </Button>
                                                        </span>
                                                    </td>
                                                </tr>
                                            ))}
                                        </React.Fragment>
                                    ))}
                                    {(choicesBySection.get(sec.id) || []).length === 0 && (
                                        <tr>
                                            <td colSpan="8" className="py-4 text-center text-gray-400 italic">
                                                Aucun choix dans cette section
                                            </td>
                                        </tr>
                                    )}
                                </tbody>
                            </table>
                        </div>
                    </Card>
                ))}
            </div>
        </div>
    );
}
