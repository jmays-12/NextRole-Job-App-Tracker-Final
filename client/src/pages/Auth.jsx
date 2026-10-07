import { useState } from "react";
import { api } from "../utils/api";
import { theme } from "../utils/theme";

export default function AuthForm({ onAuth }) {
    const [isSignup, setIsSignup] = useState(false);
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [error, setError] = useState("");

    const handleSubmit = async (e) => {
        e.preventDefault();
        try {
            const user = isSignup
                ? await api.signup({ email, password })
                : await api.login({ email, password });
            onAuth(user);
        } catch (err) {
            setError(err.message);
        }
    };

    return (
        <div className={theme.page}>
            <div className={theme.container}>
                <div className={theme.header}>
                    <h1 className={theme.title}>NextRole</h1>
                    <span className={theme.tagline}>Job Application Tracker</span>
                </div><p className={theme.tagline}>{isSignup ? "Sign up" : "Log in"}</p>
                {error && <p className={theme.error}>{error}</p>}
                <form onSubmit={handleSubmit}>
                    <input
                        className={theme.input}
                        type="email"
                        placeholder="Email"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                    />
                    <input
                        className={theme.input}
                        type="password"
                        placeholder="Password"
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                    />
                    <button className={theme.button} type="submit">
                        {isSignup ? "Create account" : "Log in"}
                    </button>
                </form>
                <p className={theme.switchText}>
                    {isSignup ? "Have an account? " : "No account yet? "}
                    <span className={theme.link} onClick={() => setIsSignup(!isSignup)}>
                        {isSignup ? "Log in" : "Sign up"}
                    </span>
                </p>
            </div>
        </div>
    );
}