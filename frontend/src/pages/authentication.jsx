import * as React from 'react';
import { AuthContext } from '../contexts/AuthContext';
import { BrandMark, ButtonLink, Field, StatusBadge } from '../components/ui/Primitives';

export default function Authentication() {
    const [username, setUsername] = React.useState("");
    const [password, setPassword] = React.useState("");
    const [name, setName] = React.useState("");
    const [error, setError] = React.useState("");
    const [message, setMessage] = React.useState("");
    const [formState, setFormState] = React.useState(0);

    const { handleRegister, handleLogin } = React.useContext(AuthContext);

    const handleAuth = async () => {
        try {
            setError("");
            setMessage("");

            if (formState === 0) {
                await handleLogin(username, password);
            }

            if (formState === 1) {
                const result = await handleRegister(name, username, password);
                setUsername("");
                setMessage(result);
                setFormState(0);
                setPassword("");
                setName("");
            }
        } catch (err) {
            const nextMessage = err?.response?.data?.message || "Authentication failed. Please try again.";
            setError(nextMessage);
        }
    }

    return (
        <main className="authPage">
            <section className="authStory" aria-labelledby="auth-story-title">
                <BrandMark />
                <div>
                    <StatusBadge tone="live">Protected meetings</StatusBadge>
                    <h1 className="nm-page-title" id="auth-story-title">A calmer front door for every conversation.</h1>
                    <p className="nm-body">Sign in to keep meeting history connected to your account, or create a new account and move straight into your room.</p>
                </div>
                <div className="meetingPreview" aria-hidden="true">
                    <div className="previewHeader">
                        <span className="nm-label">Device preview</span>
                        <span className="nm-caption">Ready</span>
                    </div>
                    <div className="previewTile">
                        <span className="previewAvatar">NM</span>
                        <div className="previewMeta">
                            <span>NexusMeet</span>
                            <span>Camera active</span>
                        </div>
                    </div>
                </div>
            </section>

            <section className="authPanel" aria-labelledby="auth-title">
                <div>
                    <h2 className="nm-page-title" id="auth-title">{formState === 0 ? "Welcome back" : "Create account"}</h2>
                    <p className="nm-body">{formState === 0 ? "Use your NexusMeet credentials to continue." : "Set up your account to save meeting activity."}</p>
                </div>

                <div className="authSwitch" role="tablist" aria-label="Authentication mode">
                    <button
                        className={`nm-button ${formState === 0 ? "nm-button-primary" : "nm-button-secondary"}`}
                        onClick={() => setFormState(0)}
                        role="tab"
                        aria-selected={formState === 0}
                        type="button"
                    >
                        Sign in
                    </button>
                    <button
                        className={`nm-button ${formState === 1 ? "nm-button-primary" : "nm-button-secondary"}`}
                        onClick={() => setFormState(1)}
                        role="tab"
                        aria-selected={formState === 1}
                        type="button"
                    >
                        Sign up
                    </button>
                </div>

                <form className="authForm" onSubmit={(event) => {
                    event.preventDefault();
                    handleAuth();
                }}>
                    {formState === 1 ? (
                        <Field
                            id="full-name"
                            label="Full name"
                            value={name}
                            autoComplete="name"
                            onChange={(e) => setName(e.target.value)}
                            required
                        />
                    ) : null}

                    <Field
                        id="username"
                        label="Username"
                        value={username}
                        autoComplete="username"
                        onChange={(e) => setUsername(e.target.value)}
                        required
                    />
                    <Field
                        id="password"
                        label="Password"
                        value={password}
                        type="password"
                        autoComplete={formState === 0 ? "current-password" : "new-password"}
                        onChange={(e) => setPassword(e.target.value)}
                        required
                    />

                    {error ? <p className="authError nm-caption" role="alert">{error}</p> : null}
                    {message ? <p className="authSuccess nm-caption" role="status">{message}</p> : null}

                    <ButtonLink className="authSubmit" type="submit">
                        {formState === 0 ? "Login" : "Register"}
                    </ButtonLink>
                </form>
            </section>
        </main>
    );
}
