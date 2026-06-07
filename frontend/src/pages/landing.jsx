import React from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { BrandMark } from '../components/ui/Primitives'
import styles from '../styles/landingPage.module.css'

export default function LandingPage() {
    const router = useNavigate();

    return (
        <div className={styles.page}>
            <div className={`nm-shell ${styles.shell}`}>
                <nav className={styles.nav} aria-label="Primary navigation">
                    <BrandMark className={styles.brand} />
                    <div className={styles.navActions}>
                        <button className={styles.navGuest} onClick={() => router("/aljk23")} type="button">Join as guest</button>
                        <button className={styles.navRegister} onClick={() => router("/auth")} type="button">Register</button>
                        <button className={`nm-button nm-button-primary ${styles.navLogin}`} onClick={() => router("/auth")} type="button">Login</button>
                    </div>
                </nav>

                <main className={styles.main}>
                    <section className={styles.hero} aria-labelledby="landing-title">
                        <div className={styles.heroCopy}>
                            <span className={styles.heroBadge}>Video rooms for everyday work</span>
                            <h1 id="landing-title">Join the room, check your camera, get to the conversation.</h1>
                            <p>
                                NexusMeet gives teams a simple path into calls: enter with a room code, preview your setup, share your screen when needed, and return through meeting history.
                            </p>

                            <div className={styles.heroActions}>
                                <Link className={`nm-button nm-button-primary ${styles.primaryAction}`} to={"/auth"}>Login to start</Link>
                                <button className={`nm-button nm-button-secondary ${styles.secondaryAction}`} onClick={() => router("/aljk23")} type="button">Join as guest</button>
                            </div>
                        </div>

                        <section className={styles.previewPanel} aria-label="NexusMeet room preview">
                            <div className={styles.previewTopBar}>
                                <div>
                                    <span className={styles.livePill}>Live room</span>
                                    <h2>Weekly planning</h2>
                                </div>
                                <div className={styles.previewMeta}>
                                    <span>4 participants</span>
                                    <span>Guest joined</span>
                                </div>
                            </div>

                            <div className={styles.roomGrid}>
                                <article className={`${styles.roomTile} ${styles.roomTileLarge}`}>
                                    <div className={styles.videoSurface}>
                                        <span className={styles.avatar}>AM</span>
                                    </div>
                                    <div className={styles.tileOverlay}>
                                        <span>Aisha Mehta</span>
                                        <span className={styles.speakingDot}>Speaking</span>
                                    </div>
                                </article>

                                <article className={styles.roomTile}>
                                    <div className={styles.videoSurface}>
                                        <span className={styles.avatar}>RK</span>
                                    </div>
                                    <div className={styles.tileOverlay}>
                                        <span>Rahul Kapoor</span>
                                        <span>Muted</span>
                                    </div>
                                </article>

                                <article className={styles.roomTile}>
                                    <div className={styles.shareSurface}>
                                        <span>Roadmap notes</span>
                                    </div>
                                    <div className={styles.tileOverlay}>
                                        <span>Screen share</span>
                                        <span>Shared</span>
                                    </div>
                                </article>
                            </div>

                            <div className={styles.controlDock} aria-hidden="true">
                                <span>Mic</span>
                                <span>Camera</span>
                                <span>Share</span>
                                <span>Chat</span>
                            </div>
                        </section>
                    </section>

                    <section className={styles.workflow} aria-label="NexusMeet workflow">
                        <ol>
                            <li>Join room</li>
                            <li>Check devices</li>
                            <li>Meet</li>
                            <li>Return later</li>
                        </ol>
                    </section>

                    <section className={styles.highlights} aria-labelledby="landing-highlights">
                        <div className={styles.highlightsHeader}>
                            <span className={styles.sectionKicker}>What the room handles</span>
                            <h2 id="landing-highlights">The pieces teams use before, during, and after a call.</h2>
                        </div>

                        <div className={styles.highlightGrid}>
                            <article className={styles.highlightCard}>
                                <span>01</span>
                                <h3>Join by code</h3>
                                <p>Use a shared room code or enter as a guest.</p>
                            </article>

                            <article className={styles.highlightCard}>
                                <span>02</span>
                                <h3>Saved history</h3>
                                <p>Sign in to keep previous rooms within reach.</p>
                            </article>

                            <article className={styles.highlightCard}>
                                <span>03</span>
                                <h3>Lobby preview</h3>
                                <p>Check your name and camera before joining.</p>
                            </article>

                            <article className={styles.highlightCard}>
                                <span>04</span>
                                <h3>Screen share</h3>
                                <p>Share work without letting controls take over.</p>
                            </article>
                        </div>
                    </section>
                </main>
            </div>
        </div>
    )
}
