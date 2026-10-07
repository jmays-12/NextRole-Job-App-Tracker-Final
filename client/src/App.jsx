import { useEffect, useState } from "react";

import { api } from "./utils/api";
import { theme } from "./utils/theme"
import Auth from "./pages/Auth";
import Dashboard from "./pages/Dashboard";

export default function App() {
    const [user, setUser] = useState(null);
    const [loading, setLoading] = useState(true);

    // On page load, ask the server if our session cookie is still valid
    useEffect(() => {
        api.me()
            .then((data) => setUser(data.user))
            .catch(() => setUser(null))
            .finally(() => setLoading(false));
    }, []);

    if (loading) {
        return (
            <div className={theme.page}>
                <p className={theme.loading}>Loading...</p>
            </div>
        );
    }

    return user ? (
        <Dashboard user={user} onLogout={() => setUser(null)} />
    ) : (
        <Auth onAuth={setUser} />
    );
}