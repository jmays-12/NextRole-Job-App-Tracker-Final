import { useEffect, useState } from "react";
import { api } from "./utils/api";
import { theme } from "./utils/theme";

const STATUSES = ["applied", "interviewing", "offer", "rejected", "withdrawn"];

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

const normalizeUrl = (url) => {
    if (!url) return "";
    return url.startsWith("http://") || url.startsWith("https://")
        ? url
        : `https://${url}`;
};

export default function Dashboard({ user, onLogout }) {

    const [apps, setApps] = useState([]);
    const [company, setCompany] = useState("");
    const [role, setRole] = useState("");

    const [error, setError] = useState("");

    const [editingId, setEditingId] = useState(null);
    const [draft, setDraft] = useState({});

    const [link, setLink] = useState("");
    const [dateApplied, setDateApplied] = useState(today());

    const [showHelp, setShowHelp] = useState(false);

    useEffect(() => {
        api.getApps().then(setApps).catch((err) => setError(err.message));
    }, []);

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
        await api.logout();
        onLogout();
    };

    const startEdit = (app) => {
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
        try {
            setError("");
            const updated = await api.updateApp(id, draft);
            setApps((currentApps) =>
                currentApps.map((a) => (a.id === id ? updated : a))
            );
            setEditingId(null);
        } catch (err) {
            setError(err.message);
        }
    };

    return (
        <div className={theme.page}>
            <div className={theme.container}>
                <div className={theme.header}>
                    <h1 className={theme.title}>NextRole</h1>
                    <p className={theme.tagline}>Job Application Tracker</p>
                    <div className={theme.userControls}>
                        <span className={theme.username}>{user.email}</span>

                        <div className="relative">
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
                                    <p>Use the <i>Status buttons</i> to track where you are in the hiring process.</p>
                                    <p>Click <i>Edit</i> to add notes or update application details.</p>
                                    <p>Click <i>Delete</i> to remove an application.</p>
                                    <p>Job links will open in a new tab.</p>
                                    <p>Good luck on your next career!</p>
                                </div>
                            )}
                        </div>

                        <button
                            className={theme.logoutButton}
                            onClick={handleLogout}
                        >
                            Log out
                        </button>
                    </div>
                </div>


                {error && <p className={theme.error}>{error}</p>}

                <form className={theme.card} onSubmit={handleAdd}>
                    <input className={theme.input} placeholder="Company" value={company} onChange={(e) => setCompany(e.target.value)} />
                    <input className={theme.input} placeholder="Role" value={role} onChange={(e) => setRole(e.target.value)} />
                    <input className={theme.input} placeholder="Link (optional)" value={link} onChange={(e) => setLink(e.target.value)} />
                    <input className={theme.input} type="date" value={dateApplied} onChange={(e) => setDateApplied(e.target.value)} />
                    <button className={theme.button} type="submit">Add application</button>
                </form>

                {apps.length === 0 && <p className={theme.info}>No applications yet. Fill out the form above to add your first application to track!</p>}
                {apps.map((app) =>
                    editingId === app.id ? (
                        <div className={theme.card} key={app.id}>
                            <input className={theme.input} value={draft.company} onChange={(e) => setDraft({ ...draft, company: e.target.value })} />
                            <input className={theme.input} value={draft.role} onChange={(e) => setDraft({ ...draft, role: e.target.value })} />
                            <input className={theme.input} placeholder="Link" value={draft.link} onChange={(e) => setDraft({ ...draft, link: e.target.value })} />
                            <input className={theme.input} type="date" value={draft.date_applied} onChange={(e) => setDraft({ ...draft, date_applied: e.target.value })} />
                            <textarea className={theme.input} placeholder="Notes" value={draft.notes} onChange={(e) => setDraft({ ...draft, notes: e.target.value })} />
                            <div className={theme.row}>
                                <button type="button" className={theme.button} onClick={() => saveEdit(app.id)}>Save</button>
                                <button type="button" className={theme.button} onClick={() => setEditingId(null)}>Cancel</button>
                            </div>
                        </div>
                    ) : (
                        <div className={theme.card} key={app.id}>
                            <p className={theme.companyName}><strong>{app.company}</strong></p>
                            <span className={theme.role}>Position: {app.role}</span>
                            <p className={theme.date}>Applied: {formatDate(app.date_applied)}</p>
                            {app.link && <a className={theme.appLink} href={normalizeUrl(app.link)} target="_blank" rel="noreferrer">{app.link}</a>}
                            {app.notes && <><span className={theme.notesTitle}>Notes:</span><p className={theme.notes}>{app.notes}</p></>}
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
    );
}
