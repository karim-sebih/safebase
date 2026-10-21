import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";

import { getAllBases, deleteBase } from "../api/base.js";
import { getBackups, createBackup } from "../api/backup.js";
import {
    getAlerts,
    markAlertAsRead,
    deleteAlert,
} from "../api/alerts.js";

import "./Home.css";

export default function Home() {
    const navigate = useNavigate();

    const [bases, setBases] = useState([]);
    const [backups, setBackups] = useState([]);
    const [alerts, setAlerts] = useState([]);
    const [selectedBaseId, setSelectedBaseId] = useState("");
    const [loading, setLoading] = useState(true);
    const [creatingBackup, setCreatingBackup] = useState(false);
    const [toast, setToast] = useState(null);

    useEffect(() => {
        async function fetchData() {
            try {
                const basesData = await getAllBases();
                const safeBases = Array.isArray(basesData) ? basesData : [];

                setBases(safeBases);
                if (safeBases.length > 0) {
                    setSelectedBaseId(String(safeBases[0].id));
                }

                const results = await Promise.all(
                    safeBases.map(async (base) => {
                        try {
                            const [baseBackups, baseAlerts] = await Promise.all([
                                getBackups(base.id),
                                getAlerts(base.id),
                            ]);

                            return {
                                base,
                                backups: Array.isArray(baseBackups)
                                    ? baseBackups
                                    : [],
                                alerts: Array.isArray(baseAlerts)
                                    ? baseAlerts
                                    : [],
                            };
                        } catch (error) {
                            console.error(
                                `Erreur de chargement pour ${base.name} :`,
                                error
                            );
                            return { base, backups: [], alerts: [] };
                        }
                    })
                );

                setBackups(
                    results
                        .flatMap(({ base, backups: baseBackups }) =>
                            baseBackups.map((backup) => ({
                                ...backup,
                                baseId: base.id,
                                baseName: base.name,
                            }))
                        )
                        .sort(
                            (a, b) =>
                                new Date(b.createdAt || 0) -
                                new Date(a.createdAt || 0)
                        )
                );

                setAlerts(
                    results.flatMap(({ base, alerts: baseAlerts }) =>
                        baseAlerts.map((alert) => ({
                            ...alert,
                            baseId: base.id,
                            baseName: base.name,
                        }))
                    )
                );
            } catch (error) {
                console.error("Erreur lors du chargement :", error);
                showToast("Impossible de charger les données.", "error");
            } finally {
                setLoading(false);
            }
        }

        fetchData();
    }, []);

    useEffect(() => {
        if (!toast) return;

        const timer = window.setTimeout(() => setToast(null), 5000);
        return () => window.clearTimeout(timer);
    }, [toast]);

    function showToast(message, type = "info") {
        setToast({ message, type, id: Date.now() });
    }

    const unreadAlerts = alerts.filter(
        (alert) => !(alert.isRead ?? alert.read ?? false)
    );

    async function handleDeleteBase(id) {
        if (!window.confirm("Voulez-vous vraiment supprimer cette base ?")) {
            return;
        }

        try {
            await deleteBase(id);
            setBases((current) => current.filter((base) => base.id !== id));
            setBackups((current) =>
                current.filter((backup) => String(backup.baseId) !== String(id))
            );
            setAlerts((current) =>
                current.filter((alert) => String(alert.baseId) !== String(id))
            );

            if (String(selectedBaseId) === String(id)) {
                const nextBase = bases.find(
                    (base) => String(base.id) !== String(id)
                );
                setSelectedBaseId(nextBase ? String(nextBase.id) : "");
            }

            showToast("Base supprimée.", "success");
        } catch (error) {
            console.error("Erreur lors de la suppression :", error);
            showToast("Impossible de supprimer la base.", "error");
        }
    }

    async function handleCreateBackup() {
        if (!selectedBaseId) {
            showToast("Sélectionne une base avant de lancer la sauvegarde.", "error");
            return;
        }

        const base = bases.find(
            (item) => String(item.id) === String(selectedBaseId)
        );

        if (!base) return;

        setCreatingBackup(true);

        try {
            const newBackup = await createBackup(base.id);

            setBackups((current) =>
                [
                    {
                        ...newBackup,
                        baseId: base.id,
                        baseName: base.name,
                    },
                    ...current,
                ].sort(
                    (a, b) =>
                        new Date(b.createdAt || 0) -
                        new Date(a.createdAt || 0)
                )
            );

            showToast(`Sauvegarde créée pour « ${base.name} ».`, "success");
        } catch (error) {
            console.error(
                "Erreur lors de la création :",
                error.response?.data || error.message
            );

            const message =
                error.code === "ECONNABORTED"
                    ? "La sauvegarde dépasse le délai d’attente."
                    : error.response?.data?.message ||
                    "Impossible de créer la sauvegarde.";

            showToast(message, "error");
        } finally {
            setCreatingBackup(false);
        }
    }

    async function handleMarkAlertAsRead(alert) {
        try {
            await markAlertAsRead(alert.id);
            setAlerts((current) =>
                current.map((item) =>
                    item.id === alert.id
                        ? { ...item, isRead: true, read: true }
                        : item
                )
            );
        } catch (error) {
            console.error("Erreur de mise à jour de l’alerte :", error);
            showToast("Impossible de marquer l’alerte comme lue.", "error");
        }
    }

    async function handleDeleteAlert(alert) {
        try {
            await deleteAlert(alert.id);
            setAlerts((current) =>
                current.filter((item) => item.id !== alert.id)
            );
        } catch (error) {
            console.error("Erreur de suppression de l’alerte :", error);
            showToast("Impossible de supprimer l’alerte.", "error");
        }
    }

    if (loading) {
        return (
            <main className="home-page">
                <div className="loading-card">Chargement de SafeBase…</div>
            </main>
        );
    }

    return (
        <main className="home-page">
            <header className="home-header">
                <div>
                    <span className="eyebrow">SAFEBASE · CONSOLE</span>
                    <h1>Tableau de bord</h1>
                    <p>Gérez vos bases, sauvegardes et alertes au même endroit.</p>
                </div>

                <button
                    className="button button-primary"
                    onClick={() => navigate("/create")}
                >
                    ＋ Créer une base
                </button>
            </header>

            <section className="summary-row">
                <div className="summary-card">
                    <span className="summary-icon">▦</span>
                    <div>
                        <strong>{bases.length}</strong>
                        <span>Bases</span>
                    </div>
                </div>

                <div className="summary-card">
                    <span className="summary-icon">⇩</span>
                    <div>
                        <strong>{backups.length}</strong>
                        <span>Sauvegardes</span>
                    </div>
                </div>

                <div className="summary-card">
                    <span className="summary-icon summary-icon-warning">!</span>
                    <div>
                        <strong>{unreadAlerts.length}</strong>
                        <span>Alertes non lues</span>
                    </div>
                </div>
            </section>

            <section className="dashboard-section">
                <div className="section-title">
                    <div>
                        <h2>Vos bases</h2>
                        <p>Modifiez ou supprimez vos bases de données.</p>
                    </div>
                    <span className="count-badge">{bases.length}</span>
                </div>

                {bases.length === 0 ? (
                    <div className="empty-state">
                        <h3>Aucune base pour le moment</h3>
                        <p>Créez votre première base pour commencer.</p>
                        <button
                            className="button button-primary"
                            onClick={() => navigate("/create")}
                        >
                            Créer une base
                        </button>
                    </div>
                ) : (
                    <div className="database-grid">
                        {bases.map((base) => (
                            <article className="database-card" key={base.id}>
                                <div className="database-card-header">
                                    <div className="database-avatar">
                                        {(base.name || "B")
                                            .charAt(0)
                                            .toUpperCase()}
                                    </div>

                                    <div className="database-title">
                                        <h3>{base.name}</h3>
                                        <span className="status-label">
                                            <i /> Disponible
                                        </span>
                                    </div>

                                    <button
                                        className="button-icon"
                                        title="Modifier la base"
                                        aria-label={`Modifier ${base.name}`}
                                        onClick={() =>
                                            navigate(`/modify/${base.id}`)
                                        }
                                    >
                                        ✎
                                    </button>
                                </div>

                                <p className="database-description">
                                    {base.description || "Aucune description."}
                                </p>

                                <button
                                    className="button button-quiet"
                                    onClick={() => handleDeleteBase(base.id)}
                                >
                                    Supprimer
                                </button>
                            </article>
                        ))}
                    </div>
                )}
            </section>

            <section className="dashboard-section">
                <div className="section-title">
                    <div>
                        <h2>Toutes les sauvegardes</h2>
                        <p>Historique regroupé de toutes vos bases.</p>
                    </div>
                    <span className="count-badge">{backups.length}</span>
                </div>

                {backups.length === 0 ? (
                    <div className="empty-state compact-empty">
                        <p>Aucune sauvegarde n’a encore été créée.</p>
                    </div>
                ) : (
                    <div className="global-list">
                        {backups.map((backup) => (
                            <article
                                className="global-backup-row"
                                key={`${backup.baseId}-${backup.id}`}
                            >
                                <span className="file-icon">⇩</span>

                                <div className="item-main">
                                    <strong>
                                        {backup.filename || "Sauvegarde"}
                                    </strong>
                                    <small>
                                        Base : {backup.baseName || "Inconnue"}
                                        {backup.createdAt &&
                                            ` · ${new Date(
                                                backup.createdAt
                                            ).toLocaleString()}`}
                                    </small>
                                </div>

                                <span
                                    className={`status-pill ${backup.status === "success"
                                        ? "status-success"
                                        : "status-neutral"
                                        }`}
                                >
                                    {backup.status || "inconnue"}
                                </span>
                            </article>
                        ))}
                    </div>
                )}

                {bases.length > 0 && (
                    <div className="backup-controls">

                        <div className="backup-control-row">


                            <button
                                className="button button-primary"
                                onClick={handleCreateBackup}
                                disabled={creatingBackup || !selectedBaseId}
                            >
                                {creatingBackup
                                    ? "Sauvegarde en cours…"
                                    : "↥ Lancer une sauvegarde"}
                            </button>
                        </div>
                    </div>
                )}
            </section>

            <section className="dashboard-section">
                <div className="section-title">
                    <div>
                        <h2>Alertes</h2>
                        <p>Alertes regroupées de toutes vos bases.</p>
                    </div>
                    <span className="count-badge">{alerts.length}</span>
                </div>

                {alerts.length === 0 ? (
                    <div className="empty-state compact-empty">
                        <p>Aucune alerte.</p>
                    </div>
                ) : (
                    <div className="global-list">
                        {alerts.map((alert) => {
                            const isRead = alert.isRead ?? alert.read ?? false;

                            return (
                                <article
                                    className="global-backup-row"
                                    key={`${alert.baseId}-${alert.id}`}
                                >
                                    <span className="alert-dot" />

                                    <div className="item-main">
                                        <strong>
                                            {alert.message ||
                                                alert.type ||
                                                "Alerte"}
                                        </strong>
                                        <small>
                                            Base : {alert.baseName || "Inconnue"}
                                            {" · "}
                                            {isRead ? "Lue" : "Non lue"}
                                        </small>
                                    </div>

                                    {!isRead && (
                                        <button
                                            className="text-button"
                                            onClick={() =>
                                                handleMarkAlertAsRead(alert)
                                            }
                                        >
                                            Marquer comme lue
                                        </button>
                                    )}

                                    <button
                                        className="button-icon button-icon-small"
                                        aria-label="Supprimer l’alerte"
                                        onClick={() =>
                                            handleDeleteAlert(alert)
                                        }
                                    >
                                        ×
                                    </button>
                                </article>
                            );
                        })}
                    </div>
                )}
            </section>

            {toast && (
                <div
                    className={`toast toast-${toast.type}`}
                    role="status"
                    aria-live="polite"
                >
                    <span className="toast-symbol">
                        {toast.type === "error" ? "!" : "✓"}
                    </span>
                    <span className="toast-message">{toast.message}</span>
                    <button
                        className="toast-close"
                        onClick={() => setToast(null)}
                        aria-label="Fermer la notification"
                    >
                        ×
                    </button>
                </div>
            )}

            <aside className="toast-stack" aria-label="Alertes non lues">
                {unreadAlerts.map((alert) => (
                    <div
                        className="toast toast-alert"
                        key={`${alert.baseId}-${alert.id}`}
                    >
                        <span className="toast-symbol">!</span>
                        <span className="toast-message">
                            <strong>{alert.baseName}</strong>
                            <span>
                                {alert.message || alert.type || "Nouvelle alerte"}
                            </span>
                            <button
                                className="toast-action"
                                onClick={() => handleMarkAlertAsRead(alert)}
                            >
                                Marquer comme lue
                            </button>
                        </span>
                        <button
                            className="toast-close"
                            onClick={() => handleDeleteAlert(alert)}
                            aria-label="Supprimer l’alerte"
                        >
                            ×
                        </button>
                    </div>
                ))}
            </aside>
        </main>
    );
}