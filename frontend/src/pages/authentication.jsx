import * as React from 'react';
import { AuthContext } from '../contexts/AuthContext';
import { BrandMark, ButtonLink, Field, StatusBadge } from '../components/ui/Primitives';
import styles from '../styles/authPage.module.css';

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
        <main className={styles.page}>
            <section className={styles.story} aria-labelledby="auth-story-title">
                <BrandMark className={styles.brand} />

                <div className={styles.storyCopy}>
                    <StatusBadge tone="live">Protected meetings</StatusBadge>
                    <h1 id="auth-story-title">Continue to NexusMeet</h1>
                    <p>Save meeting history, return to previous rooms, and move from lobby to call with your account.</p>
                </div>

                <div className={styles.preview} aria-hidden="true">
                    <div className={styles.previewHeader}>
                        <div>
                            <span className={styles.livePill}>Lobby ready</span>
                            <h2>Device check</h2>
                        </div>
                        <span className={styles.previewChip}>Account entry</span>
                    </div>

                    <div className={styles.previewTile}>
                        <div className={styles.previewAvatar}>NM</div>
                        <div className={styles.tileOverlay}>
                            <span>NexusMeet lobby</span>
                            <span>Camera ready</span>
                        </div>
                    </div>

                    <div className={styles.previewSteps}>
                        <span>Name</span>
                        <span>Lobby</span>
                        <span>Room</span>
                    </div>
                </div>
            </section>

            <section className={styles.panel} aria-labelledby="auth-title">
                <div className={styles.panelHeader}>
                    <span className={styles.panelKicker}>{formState === 0 ? "Sign in" : "New account"}</span>
                    <h2 id="auth-title">{formState === 0 ? "Welcome back" : "Create account"}</h2>
                    <p>{formState === 0 ? "Use your NexusMeet account to continue." : "Save activity history and return to rooms faster."}</p>
                </div>

                <div className={styles.authSwitch} role="tablist" aria-label="Authentication mode">
                    <button
                        className={`${styles.switchButton} ${formState === 0 ? styles.switchButtonActive : ""}`}
                        onClick={() => setFormState(0)}
                        role="tab"
                        aria-selected={formState === 0}
                        type="button"
                    >
                        Sign in
                    </button>
                    <button
                        className={`${styles.switchButton} ${formState === 1 ? styles.switchButtonActive : ""}`}
                        onClick={() => setFormState(1)}
                        role="tab"
                        aria-selected={formState === 1}
                        type="button"
                    >
                        Sign up
                    </button>
                </div>

                <form className={styles.form} onSubmit={(event) => {
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

                    {error ? <p className={styles.errorMessage} role="alert">{error}</p> : null}
                    {message ? <p className={styles.successMessage} role="status">{message}</p> : null}

                    <ButtonLink className={styles.submit} type="submit">
                        {formState === 0 ? "Login" : "Register"}
                    </ButtonLink>
                </form>
            </section>
        </main>
    );
}
