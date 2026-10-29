import { useCallback, useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";

import { getAllBases, deleteBase } from "../api/base.js";
import {
    getBackups,
    getGlobalBackups,
    createGlobalBackup,
    downloadBackup
} from "../api/backup.js";
import {
    getAlerts,
    markAlertAsRead,
    deleteAlert,
} from "../api/alerts.js";

import "./Home.css";

function isAlertRead(alert) {
    return alert.isRead ?? alert.read ?? false;
}

function sortBackups(backups) {
    return [...backups].sort((a, b) => {
        const dateA = new Date(a.createdAt || 0).getTime();
        const dateB = new Date(b.createdAt || 0).getTime();

        return dateB - dateA || Number(b.id) - Number(a.id);
    });
}

export default function Home() {
    const navigate = useNavigate();

    const [bases, setBases] = useState([]);
    const [backups, setBackups] = useState([]);
    const [alerts, setAlerts] = useState([]);
    const [notifications, setNotifications] = useState([]);
    const [toast, setToast] = useState(null);
    const [loading, setLoading] = useState(true);
    const [creatingBackup, setCreatingBackup] = useState(false);

    const seenAlerts = useRef(new Set());
    const dismissedAlerts = useRef(new Set());

    const showToast = useCallback((message, type = "info") => {
        setToast({ id: Date.now(), message, type });
    }, []);

    const loadAlerts = useCallback(async (basesToLoad) => {
        const results = await Promise.all(
            basesToLoad.map(async (base) => {
                try {
                    const data = await getAlerts(base.id);

                    return (Array.isArray(data) ? data : []).map((alert) => ({
                        ...alert,
                        baseId: base.id,
                        baseName: base.name,
                    }));
                } catch (error) {
                    console.error(
                        `Erreur de chargement des alertes de ${base.name} :`,
                        error
                    );
                    return [];
                }
            })
        );

        const allAlerts = results.flat();
        setAlerts(allAlerts);

        const unreadAlerts = allAlerts.filter(
            (alert) => !isAlertRead(alert)
        );

        setNotifications((current) => {
            const next = [...current];

            for (const alert of unreadAlerts) {
                const key = `${alert.baseId}-${alert.id}`;

                if (
                    !seenAlerts.current.has(key) &&
                    !dismissedAlerts.current.has(key)
                ) {
                    seenAlerts.current.add(key);
                    next.push({ ...alert, notificationKey: key });
                }
            }

            return next;
        });
    }, []);

    const refreshBackups = useCallback(async (basesToLoad) => {
        const [baseBackupResults, globalData] = await Promise.all([
            Promise.all(
                basesToLoad.map(async (base) => {
                    try {
                        const data = await getBackups(base.id);

                        return (Array.isArray(data) ? data : []).map(
                            (backup) => ({
                                ...backup,
                                baseId: base.id,
                                baseName: base.name,
                            })
                        );
                    } catch (error) {
                        console.error(
                            `Erreur de chargement des sauvegardes de ${base.name} :`,
                            error
                        );
                        return [];
                    }
                })
            ),
            getGlobalBackups(),
        ]);

        const globalBackups = (Array.isArray(globalData) ? globalData : []).map(
            (backup) => ({
                ...backup,
                baseId: null,
                baseName: "Sauvegarde globale",
            })
        );

        setBackups(
            sortBackups([...baseBackupResults.flat(), ...globalBackups])
        );
    }, []);

    useEffect(() => {
        let cancelled = false;
        let alertInterval;
        let backupInterval;

        async function loadDashboard() {
            try {
                const data = await getAllBases();
                if (cancelled) return;

                const safeBases = Array.isArray(data) ? data : [];
                setBases(safeBases);

                await Promise.all([
                    refreshBackups(safeBases),
                    loadAlerts(safeBases),
                ]);

                if (cancelled) return;

                alertInterval = window.setInterval(() => {
                    if (!cancelled) loadAlerts(safeBases);
                }, 10000);

                backupInterval = window.setInterval(() => {
                    if (!cancelled) {
                        refreshBackups(safeBases).catch((error) =>
                            console.error(
                                "Erreur de mise à jour des sauvegardes :",
                                error
                            )
                        );
                    }
                }, 10000);
            } catch (error) {
                console.error("Erreur lors du chargement du tableau de bord :", error);
                showToast("Impossible de charger le tableau de bord.", "error");
            } finally {
                if (!cancelled) setLoading(false);
            }
        }

        loadDashboard();

        return () => {
            cancelled = true;
            if (alertInterval) window.clearInterval(alertInterval);
            if (backupInterval) window.clearInterval(backupInterval);
        };
    }, [loadAlerts, refreshBackups, showToast]);

    useEffect(() => {
        if (!toast) return;

        const timer = window.setTimeout(() => setToast(null), 4500);
        return () => window.clearTimeout(timer);
    }, [toast]);

    async function handleCreateBackup() {
        if (creatingBackup) return;

        setCreatingBackup(true);

        try {
            const newBackup = await createGlobalBackup();

            setBackups((current) =>
                sortBackups([
                    {
                        ...newBackup,
                        baseId: null,
                        baseName: "Sauvegarde globale",
                    },
                    ...current,
                ])
            );

            showToast("Sauvegarde globale créée.", "success");
        } catch (error) {
            console.error(
                "Erreur de sauvegarde globale :",
                error.response?.data || error.message
            );

            showToast(
                error.response?.data?.message ||
                "Impossible de créer la sauvegarde globale.",
                "error"
            );
        } finally {
            setCreatingBackup(false);
        }
    }

    async function handleDownloadBackup(backup) {
        try {
            await downloadBackup(
                backup.id,
                backup.filename || `sauvegarde-${backup.id}.sql`
            );

            showToast("Téléchargement lancé.", "success");
        } catch (error) {
            console.error(
                "Erreur de téléchargement :",
                error.response?.data || error.message
            );

            showToast(
                error.response?.data?.message ||
                "Impossible de télécharger cette sauvegarde.",
                "error"
            );
        }
    }
    async function handleDeleteBase(id) {
        if (!window.confirm("Voulez-vous vraiment supprimer cette base ?")) {
            return;
        }

        try {
            await deleteBase(id);

            setBases((current) =>
                current.filter((base) => String(base.id) !== String(id))
            );
            setBackups((current) =>
                current.filter(
                    (backup) => String(backup.baseId) !== String(id)
                )
            );
            setAlerts((current) =>
                current.filter(
                    (alert) => String(alert.baseId) !== String(id)
                )
            );
            setNotifications((current) =>
                current.filter(
                    (alert) => String(alert.baseId) !== String(id)
                )
            );

            showToast("Base supprimée.", "success");
        } catch (error) {
            console.error("Erreur lors de la suppression :", error);
            showToast("Impossible de supprimer cette base.", "error");
        }
    }

    async function handleMarkAlertAsRead(alert) {
        try {
            await markAlertAsRead(alert.id);

            setAlerts((current) =>
                current.map((item) =>
                    String(item.id) === String(alert.id) &&
                        String(item.baseId) === String(alert.baseId)
                        ? { ...item, isRead: true, read: true }
                        : item
                )
            );

            setNotifications((current) =>
                current.filter(
                    (item) =>
                        item.notificationKey !== alert.notificationKey
                )
            );
        } catch (error) {
            console.error("Erreur de mise à jour de l’alerte :", error);
            showToast(
                error.response?.data?.message ||
                "Impossible de marquer l’alerte comme lue.",
                "error"
            );
        }
    }

    async function handleDeleteAlert(alert) {
        try {
            await deleteAlert(alert.id);

            setAlerts((current) =>
                current.filter(
                    (item) =>
                        !(
                            String(item.id) === String(alert.id) &&
                            String(item.baseId) === String(alert.baseId)
                        )
                )
            );

            setNotifications((current) =>
                current.filter(
                    (item) =>
                        item.notificationKey !== alert.notificationKey
                )
            );
        } catch (error) {
            console.error("Erreur de suppression de l’alerte :", error);
            showToast(
                error.response?.data?.message ||
                "Impossible de supprimer l’alerte.",
                "error"
            );
        }
    }

    function dismissNotification(alert) {
        dismissedAlerts.current.add(alert.notificationKey);
        setNotifications((current) =>
            current.filter(
                (item) =>
                    item.notificationKey !== alert.notificationKey
            )
        );
    }

    const unreadAlerts = alerts.filter((alert) => !isAlertRead(alert));

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
                    <p>Gérez vos bases et sauvegardes au même endroit.</p>
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
                        <p>Gérez vos bases de données.</p>
                    </div>
                    <span className="count-badge">{bases.length}</span>
                </div>

                {bases.length === 0 ? (
                    <div className="empty-state">
                        <h3>Aucune base pour le moment</h3>
                        <p>Créez votre première base pour commencer.</p>
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
                        <p>Historique des sauvegardes des bases et globales.</p>
                    </div>
                    <span className="count-badge">{backups.length}</span>
                </div>

                {backups.length === 0 ? (
                    <div className="empty-state compact-empty">
                        <p>Aucune sauvegarde pour le moment.</p>
                    </div>
                ) : (
                    <div className="global-list">
                        {backups.map((backup) => (
                            <article
                                className="global-backup-row"
                                key={`${backup.baseId ?? "global"}-${backup.id}`}
                            >
                                <span className="file-icon">⇩</span>

                                <div className="item-main">
                                    <strong>
                                        {backup.filename || "Sauvegarde"}
                                    </strong>
                                    <small>
                                        {backup.baseName || "Sauvegarde globale"}
                                        {backup.createdAt &&
                                            ` · ${new Date(
                                                backup.createdAt
                                            ).toLocaleString()}`}
                                    </small>
                                </div>

                                <span className="status-pill">
                                    <button
                                        className="button button-quiet"
                                        onClick={() => handleDownloadBackup(backup)}
                                    >
                                        Télécharger
                                    </button>
                                </span>
                            </article>
                        ))}
                    </div>
                )}

                <div className="backup-controls">
                    <p>
                        Cette action lance une sauvegarde globale de
                        l’application.
                    </p>

                    <button
                        className="button button-primary"
                        onClick={handleCreateBackup}
                        disabled={creatingBackup}
                    >
                        {creatingBackup
                            ? "Sauvegarde en cours…"
                            : "↥ Lancer une sauvegarde globale"}
                    </button>
                </div>
            </section>

            <aside className="notification-stack" aria-label="Notifications">
                {notifications.map((alert) => (
                    <article
                        className="notification-card"
                        key={alert.notificationKey}
                        role="status"
                    >
                        <span className="notification-icon">!</span>

                        <div className="notification-content">
                            <strong>
                                {alert.baseName || "Alerte SafeBase"}
                            </strong>
                            <p>
                                {alert.message ||
                                    alert.type ||
                                    "Nouvelle alerte"}
                            </p>

                            <button
                                className="notification-action"
                                onClick={() => handleMarkAlertAsRead(alert)}
                            >
                                Marquer comme lue
                            </button>

                            <button
                                className="notification-action"
                                onClick={() => handleDeleteAlert(alert)}
                            >
                                Supprimer
                            </button>
                        </div>

                        <button
                            className="notification-close"
                            onClick={() => dismissNotification(alert)}
                            aria-label="Masquer la notification"
                            title="Masquer"
                        >
                            ×
                        </button>
                    </article>
                ))}
            </aside>

            {toast && (
                <div
                    className={`toast toast-${toast.type}`}
                    role="status"
                    aria-live="polite"
                >
                    <span>{toast.message}</span>
                    <button
                        onClick={() => setToast(null)}
                        aria-label="Fermer"
                    >
                        ×
                    </button>
                </div>
            )}
        </main>
    );
}