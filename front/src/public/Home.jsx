import { useCallback, useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";

import { getAllBases, deleteBase } from "../api/base.js";
import {
    getBackups,
    createGlobalBackup,
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

export default function Home() {
    const navigate = useNavigate();

    const [bases, setBases] = useState([]);
    const [backups, setBackups] = useState([]);
    const [alerts, setAlerts] = useState([]);
    const [loading, setLoading] = useState(true);
    const [creatingBackup, setCreatingBackup] = useState(false);
    const [notifications, setNotifications] = useState([]);
    const [toast, setToast] = useState(null);

    // Évite de réafficher la même alerte à chaque vérification.
    const seenAlerts = useRef(new Set());
    const dismissedAlerts = useRef(new Set());
    const firstAlertLoad = useRef(true);

    const showToast = useCallback((message, type = "info") => {
        setToast({ id: Date.now(), message, type });
    }, []);

    const loadAlerts = useCallback(
        async (basesToLoad, showExisting = false) => {
            const results = await Promise.all(
                basesToLoad.map(async (base) => {
                    try {
                        const data = await getAlerts(base.id);

                        return (Array.isArray(data) ? data : []).map(
                            (alert) => ({
                                ...alert,
                                baseId: base.id,
                                baseName: base.name,
                            })
                        );
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

            const unread = allAlerts.filter((alert) => !isAlertRead(alert));

            setNotifications((current) => {
                const next = showExisting ? [] : [...current];

                for (const alert of unread) {
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
        },
        []
    );

    useEffect(() => {
        let cancelled = false;
        let alertInterval;

        async function loadDashboard() {
            try {
                const data = await getAllBases();
                if (cancelled) return;

                const safeBases = Array.isArray(data) ? data : [];
                setBases(safeBases);

                setSelectedBaseId((current) => {
                    if (
                        current &&
                        safeBases.some(
                            (base) => String(base.id) === String(current)
                        )
                    ) {
                        return current;
                    }

                    return safeBases[0] ? String(safeBases[0].id) : "";
                });

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

                if (cancelled) return;

                const allBackups = results
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
                    );

                setBackups(allBackups);

                const allAlerts = results.flatMap(
                    ({ base, alerts: baseAlerts }) =>
                        baseAlerts.map((alert) => ({
                            ...alert,
                            baseId: base.id,
                            baseName: base.name,
                        }))
                );

                setAlerts(allAlerts);

                // Affiche une fois les alertes non lues déjà présentes.
                setNotifications(
                    allAlerts
                        .filter((alert) => !isAlertRead(alert))
                        .map((alert) => {
                            const key = `${alert.baseId}-${alert.id}`;
                            seenAlerts.current.add(key);
                            return { ...alert, notificationKey: key };
                        })
                );

                firstAlertLoad.current = false;

                // Détecte ensuite les nouvelles alertes créées côté serveur.
                alertInterval = window.setInterval(async () => {
                    if (cancelled || firstAlertLoad.current) return;
                    await loadAlerts(safeBases);
                }, 10000);
            } catch (error) {
                console.error("Erreur lors du chargement :", error);
            } finally {
                if (!cancelled) setLoading(false);
            }
        }

        loadDashboard();

        return () => {
            cancelled = true;
            if (alertInterval) window.clearInterval(alertInterval);
        };
    }, [loadAlerts, showToast]);

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
                [
                    {
                        ...newBackup,
                        baseId: null,
                        baseName: "Sauvegarde globale",
                    },
                    ...current,
                ].sort(
                    (a, b) =>
                        new Date(b.createdAt || 0) -
                        new Date(a.createdAt || 0)
                )
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
                current.filter((alert) => String(alert.baseId) !== String(id))
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
                    (item) => item.notificationKey !== alert.notificationKey
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
                    (item) => item.notificationKey !== alert.notificationKey
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
                (item) => item.notificationKey !== alert.notificationKey
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
                        <p>Historique regroupé de toutes vos bases.</p>
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
                                <span className="status-pill">
                                    {backup.status || "inconnue"}
                                </span>
                            </article>
                        ))}
                    </div>
                )}

                {bases.length > 0 && (
                    <div className="backup-controls">
                        <p>
                            Cette action lance une sauvegarde pour toutes vos bases.
                        </p>

                        <button
                            className="button button-primary"
                            onClick={handleCreateBackup}
                            disabled={creatingBackup || bases.length === 0}
                        >
                            {creatingBackup
                                ? "Sauvegardes en cours…"
                                : "↥ Sauvegarder toutes les bases"}
                        </button>
                    </div>
                )}
            </section>

            {/* Les alertes sont affichées en notifications fixes en bas à droite. */}
            <aside className="notification-stack" aria-label="Notifications">
                {notifications.map((alert) => (
                    <article
                        className="notification-card"
                        key={alert.notificationKey}
                        role="status"
                    >
                        <span className="notification-icon">!</span>

                        <div className="notification-content">
                            <strong>{alert.baseName || "Alerte SafeBase"}</strong>
                            <p>{alert.message || alert.type || "Nouvelle alerte"}</p>

                            <button
                                className="notification-action"
                                onClick={() => handleMarkAlertAsRead(alert)}
                            >
                                Marquer comme lue
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