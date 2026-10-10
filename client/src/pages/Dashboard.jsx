import { useEffect, useState, useRef } from "react";
import { useAutoAnimate } from "@formkit/auto-animate/react";

import { api } from "../utils/api";
import { theme } from "../utils/theme";

const STATUSES = ["applied", "interviewing", "offer", "rejected", "withdrawn", "no response", "offer declined"];
const CLOSED_STATUSES = ["rejected", "withdrawn", "no response", "offer declined"];

const SORT_OPTIONS = {
    dateNewest: "Date applied (newest)",
    dateOldest: "Date applied (oldest)",
    company: "Company (A-Z)",
};

// Today's date as YYYY-MM-DD (the date picker and database need this format)
const today = () => {
    const d = new Date();
    const month = String(d.getMonth() + 1).padStart(2, "0");
    const day = String(d.getDate()).padStart(2, "0");
    return `${d.getFullYear()}-${month}-${day}`;
};

// Turns YYYY-MM-DD into MM/DD/YYYY for display
const formatDate = (iso) => {
    if (!iso) return "";
    const [year, month, day] = iso.split("-");
    return `${month}/${day}/${year}`;
};
// Turns a URL into a clickable link, adding https:// if needed
const normalizeUrl = (url) => {
    if (!url) return "";
    return url.startsWith("http://") || url.startsWith("https://")
        ? url
        : `https://${url}`;
};
// Returns the number of days since the last activity on an application (or since it was applied if no activity yet)
const STALE_DAYS = 7;

const idleDays = (app) => {
    const [y, m, d] = (app.last_activity_at || app.date_applied).split("-").map(Number);
    return Math.floor((new Date() - new Date(y, m - 1, d)) / 86400000);
};

const isStale = (app) =>
    ["applied", "interviewing"].includes(app.status) && idleDays(app) >= STALE_DAYS;

export default function Dashboard({ user, onLogout }) {

    const helpRef = useRef(null);

    const [listRef] = useAutoAnimate({ duration: 250 });
    const [pageRef] = useAutoAnimate({ duration: 250 });
    const [containerRef] = useAutoAnimate({ duration: 250 });

    const [apps, setApps] = useState([]);
    const [appsLoading, setAppsLoading] = useState(true);
    const [appsLoadError, setAppsLoadError] = useState("");
    const [loadAttempt, setLoadAttempt] = useState(0);
    const [company, setCompany] = useState("");
    const [role, setRole] = useState("");

    const [error, setError] = useState("");

    const [editingId, setEditingId] = useState(null);
    const [draft, setDraft] = useState({});
    const [editError, setEditError] = useState("");

    const [link, setLink] = useState("");
    const [dateApplied, setDateApplied] = useState(today());

    const [showHelp, setShowHelp] = useState(false);

    const [statusFilter, setStatusFilter] = useState("all");
    const [search, setSearch] = useState("");
    const [sortBy, setSortBy] = useState("dateNewest");

    const [showClosed, setShowClosed] = useState(false);

    useEffect(() => {
        let active = true;
        setAppsLoading(true);
        setAppsLoadError("");
        api.getApps()
            .then((data) => {
                if (active) setApps(data);
            })
            .catch((err) => {
                if (active) setAppsLoadError(err.message);
            })
            .finally(() => {
                if (active) setAppsLoading(false);
            });
        return () => {
            active = false;
        };
    }, [loadAttempt]);

    useEffect(() => {
        if (!showHelp) return;

        const handleClick = (e) => {
            if (helpRef.current && !helpRef.current.contains(e.target)) {
                setShowHelp(false);
            }
        };
        const handleKey = (e) => {
            if (e.key === "Escape") setShowHelp(false);
        };

        document.addEventListener("mousedown", handleClick);
        document.addEventListener("keydown", handleKey);
        return () => {
            document.removeEventListener("mousedown", handleClick);
            document.removeEventListener("keydown", handleKey);
        };
    }, [showHelp]);

    const handleAdd = async (e) => {
        e.preventDefault();
        try {
            setError("");
            const created = await api.createApp({ company, role, link, date_applied: dateApplied });
            setApps((currentApps) => [created, ...currentApps]);
            setCompany("");
            setRole("");
            setLink("");
            setDateApplied(today());
        } catch (err) {
            setError(err.message);
        }
    };
    // Update the status of an application (applied, interviewing, offer, rejected, withdrawn, no response, offer declined)
    const handleStatus = async (id, status) => {
        try {
            setError("");
            const updated = await api.updateStatus(id, status);
            setApps((currentApps) =>
                currentApps.map((a) => (a.id === id ? updated : a))
            );
        } catch (err) {
            setError(err.message);
        }
    };
    // Mark an application as "touched" to update its last_activity_at timestamp
    const handleDismiss = async (id) => {
        try {
            setError("");
            const updated = await api.touchApp(id);
            setApps((currentApps) => currentApps.map((a) => (a.id === id ? updated : a)));
        } catch (err) {
            setError(err.message);
        }
    };

    const handleDelete = async (id) => {
        if (!window.confirm("Delete this application?")) return;
        try {
            setError("");
            await api.deleteApp(id);
            setApps((currentApps) =>
                currentApps.filter((a) => a.id !== id)
            );
        } catch (err) {
            setError(err.message);
        }
    };

    const handleLogout = async () => {
        try {
            setError("");
            await api.logout();
            onLogout();
        } catch (err) {
            setError(err.message);
        }
    };

    const hasUnsavedChanges = () => {
        const original = apps.find((a) => a.id === editingId);
        if (!original) return false;
        return Object.keys(draft).some((key) => draft[key] !== original[key]);
    };

    const cancelEdit = () => {
        setEditingId(null);
        setEditError("");
    };

    const startEdit = (app) => {
        if (editingId !== null && editingId !== app.id && hasUnsavedChanges()) {
            if (!window.confirm("Discard unsaved changes to the other application?")) return;
        }
        setEditError("");
        setEditingId(app.id);
        setDraft({
            company: app.company,
            role: app.role,
            link: app.link,
            date_applied: app.date_applied,
            notes: app.notes,
        });
    };

    const saveEdit = async (id) => {
        if (!draft.company.trim() || !draft.role.trim()) {
            setEditError("Company and role are required.");
            return;
        }
        try {
            setEditError("");
            const updated = await api.updateApp(id, {
                ...draft,
                company: draft.company.trim(),
                role: draft.role.trim(),
            });
            setApps((currentApps) =>
                currentApps.map((a) => (a.id === id ? updated : a))
            );
            setEditingId(null);
        } catch (err) {
            setEditError(err.message);
        }
    };

    const query = search.trim().toLowerCase();
    const closedCount = apps.filter((a) => CLOSED_STATUSES.includes(a.status)).length;
    const visibleApps = apps.filter((a) => {
        const isClosed = CLOSED_STATUSES.includes(a.status);
        const matchesStatus =
            statusFilter === "all" ? showClosed || !isClosed : a.status === statusFilter;
        const matchesSearch =
            !query ||
            a.company.toLowerCase().includes(query) ||
            a.role.toLowerCase().includes(query);

        return matchesStatus && matchesSearch;
    });

    visibleApps.sort((a, b) => {
        if (sortBy === "dateNewest") return b.date_applied.localeCompare(a.date_applied) || b.id - a.id;
        if (sortBy === "dateOldest") return a.date_applied.localeCompare(b.date_applied) || a.id - b.id;
        if (sortBy === "company") return a.company.localeCompare(b.company, undefined, { sensitivity: "base" });
        return b.id - a.id;
    });

    return (
        <div className={theme.page} ref={pageRef}>
            <div className={theme.container} ref={containerRef}>
                <div className={theme.header}>
                    <h1 className={theme.title}>NextRole</h1>
                    <p className={theme.tagline}>Job Application Tracker</p>
                    <div className={theme.userControls}>
                        <span className={theme.username}>{user.email}</span>

                        <button
                            className={theme.logoutButton}
                            onClick={handleLogout}
                        >
                            Log out
                        </button>

                        <div className="relative" ref={helpRef}>
                            <button
                                type="button"
                                className={theme.helpButton}
                                onClick={() => setShowHelp(!showHelp)}
                                aria-label="How to use NextRole"
                            >
                                ?
                            </button>

                            {showHelp && (
                                <div className={theme.helpPopup}>
                                    <button
                                        type="button"
                                        className={theme.helpClose}
                                        onClick={() => setShowHelp(false)}
                                        aria-label="Close help"
                                    >
                                        X
                                    </button>

                                    <p className={theme.helpPopupTitle}><strong><u>How to use NextRole</u></strong></p>
                                    <p>Add a job application using the form below.</p>
                                    <p>Use the <i>Status</i> buttons to track where you are in the hiring process.</p>
                                    <p>Click <i>Edit</i> to add notes or update application.</p>
                                    <p>Click <i>Delete</i> to remove an application.</p>
                                    <p><i>Sort</i>, <i>search</i> and <i>filter</i> buttons are underneath new application form.</p>
                                    <p>Job links will open in a new tab.</p>
                                </div>
                            )}
                        </div>


                    </div>
                </div>


                {error && <p className={theme.error}>{error}</p>}
                {appsLoadError && (
                    <div className={theme.error}>
                        <p>Could not load your applications: {appsLoadError}</p>
                        <button
                            type="button"
                            className={theme.button}
                            onClick={() => setLoadAttempt((attempt) => attempt + 1)}
                        >
                            Try again
                        </button>
                    </div>
                )}

                <form className={theme.appFormCard} onSubmit={handleAdd}>
                    <input className={theme.input} placeholder="Company" value={company} onChange={(e) => setCompany(e.target.value)} />
                    <input className={theme.input} placeholder="Role" value={role} onChange={(e) => setRole(e.target.value)} />
                    <input className={theme.input} placeholder="Link (optional)" value={link} onChange={(e) => setLink(e.target.value)} />
                    <input className={theme.input} type="date" value={dateApplied} onChange={(e) => setDateApplied(e.target.value)} />
                    <button className={theme.button} type="submit">Add application</button>
                </form>
                {apps.length > 0 && (
                    <>
                        <div className={theme.searchRow}>
                            <input
                                className={theme.searchInput}
                                placeholder="Search company or role"
                                value={search}
                                onChange={(e) => setSearch(e.target.value)}
                            />
                            <label className={theme.sortWrap}>
                                Sort by:
                                <select
                                    className={theme.sortBy}
                                    value={sortBy}
                                    onChange={(e) => setSortBy(e.target.value)}
                                >
                                    {Object.entries(SORT_OPTIONS).map(([value, label]) => (
                                        <option key={value} value={value}>{label}</option>
                                    ))}
                                </select>
                            </label>
                        </div>
                        <div className={theme.filterRow}>
                            {["all", ...STATUSES].map((s) => (
                                <button
                                    key={s}
                                    type="button"
                                    className={
                                        statusFilter === s
                                            ? s === "all" ? theme.chipOnAll : theme.chipOn[s]
                                            : theme.chipOff
                                    }
                                    onClick={() => setStatusFilter(s)}
                                >
                                    {s}
                                </button>
                            ))}
                        </div>
                        {statusFilter === "all" && closedCount > 0 && (
                            <button type="button" className={theme.toggleClosed} onClick={() => setShowClosed(!showClosed)}>
                                {showClosed ? "Hide closed" : `Show closed (${closedCount})`}
                            </button>
                        )}
                    </>
                )}

                {appsLoading && <p className={theme.info}>Loading applications...</p>}
                {!appsLoading && !appsLoadError && apps.length === 0 && (
                    <p className={theme.info}>No applications yet. Fill out the form above to add your first application to track!</p>
                )}
                {!appsLoading && !appsLoadError && apps.length > 0 && visibleApps.length === 0 && (
                    <p className={theme.info}>No applications match your filters.</p>
                )}
                <div ref={listRef}>
                    {visibleApps.map((app) =>
                        editingId === app.id ? (
                            <div className={theme.card} key={app.id}>
                                {editError && <p className={theme.error}>{editError}</p>}
                                <input className={theme.input} value={draft.company} onChange={(e) => setDraft({ ...draft, company: e.target.value })} />
                                <input className={theme.input} value={draft.role} onChange={(e) => setDraft({ ...draft, role: e.target.value })} />
                                <input className={theme.input} placeholder="Link" value={draft.link} onChange={(e) => setDraft({ ...draft, link: e.target.value })} />
                                <input className={theme.input} type="date" value={draft.date_applied} onChange={(e) => setDraft({ ...draft, date_applied: e.target.value })} />
                                <textarea className={theme.input} placeholder="Notes" value={draft.notes} onChange={(e) => setDraft({ ...draft, notes: e.target.value })} />
                                <div className={theme.row}>
                                    <button type="button" className={theme.button} onClick={() => saveEdit(app.id)}>Save</button>
                                    <button type="button" className={theme.button} onClick={cancelEdit}>Cancel</button>
                                </div>
                            </div>
                        ) : (
                            <div className={theme.card} key={app.id}>
                                <p className={theme.companyName}><strong>{app.company}</strong></p>
                                <span className={theme.role}>Position: {app.role}</span>
                                <p className={theme.date}>Applied: {formatDate(app.date_applied)}</p>
                                {app.link && <><p className={theme.companyWebsite}>Company website: </p>
                                    <a className={theme.appLink} href={normalizeUrl(app.link)} target="_blank" rel="noreferrer">{app.link}</a></>}
                                {app.notes && <><span className={theme.notesTitle}>Notes</span><p className={theme.notes}>{app.notes}</p></>}
                                <div className={theme.statusRow}>
                                    {STATUSES.map((s) => (
                                        <button
                                            key={s}
                                            type="button"
                                            className={app.status === s ? theme.chipOn[s] : theme.chipOff}
                                            onClick={() => app.status !== s && handleStatus(app.id, s)}
                                        >
                                            {s}
                                        </button>
                                    ))}
                                </div>
                                {isStale(app) && (
                                    <div className={theme.reminder}>
                                        <span>No update in {idleDays(app)} days.</span>
                                        <button type="button" className={theme.button} onClick={() => handleStatus(app.id, "no response")}>Mark no response</button>
                                        <button type="button" className={theme.button} onClick={() => handleDismiss(app.id)}>Still waiting</button>
                                    </div>
                                )}
                                <div className={theme.row}>
                                    <div className={theme.editButtons}>
                                        <button type="button" className={theme.button} onClick={() => startEdit(app)}>Edit</button>
                                        <button type="button" className={theme.buttonDanger} onClick={() => handleDelete(app.id)}>Delete</button>
                                    </div>
                                </div>
                            </div>
                        )
                    )}
                </div>
            </div>
        </div>
    );
}
