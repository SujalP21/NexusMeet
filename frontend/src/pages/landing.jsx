import React from 'react'
import "../App.css"
import { Link, useNavigate } from 'react-router-dom'
import { BrandMark, StatusBadge } from '../components/ui/Primitives'

export default function LandingPage() {
    const router = useNavigate();

    return (
        <div className='landingPageContainer'>
            <div className="nm-shell">
                <nav className="topNav" aria-label="Primary navigation">
                    <BrandMark />
                    <div className='navlist'>
                        <button className="navTextButton" onClick={() => router("/aljk23")}>Join as guest</button>
                        <button className="navTextButton" onClick={() => router("/auth")}>Register</button>
                        <button className="nm-button nm-button-secondary" onClick={() => router("/auth")}>Login</button>
                    </div>
                </nav>

                <main className="landingMainContainer">
                    <section className="landingCopy" aria-labelledby="landing-title">
                        <span className="landingKicker">Calm video collaboration</span>
                        <h1 id="landing-title">Meet with clarity, without the noise.</h1>
                        <p>NexusMeet keeps the conversation central with precise controls, lightweight chat, and a meeting space that feels composed from the first click.</p>
                        <div className="landingActions">
                            <Link className="nm-button nm-button-primary" to={"/auth"}>Get started</Link>
                            <button className="nm-button nm-button-secondary" onClick={() => router("/aljk23")}>Join as guest</button>
                        </div>
                    </section>

                    <section className="landingVisual" aria-label="Meeting preview">
                        <div className="meetingPreview">
                            <div className="previewHeader">
                                <StatusBadge tone="live">Live room</StatusBadge>
                                <span className="nm-caption">4 participants</span>
                            </div>
                            <div className="previewGrid">
                                <div className="previewTile">
                                    <span className="previewAvatar">SP</span>
                                    <div className="previewMeta">
                                        <span>Sujal</span>
                                        <span>Speaking</span>
                                    </div>
                                </div>
                                <div className="previewTile previewTileSmall">
                                    <span className="previewAvatar">AR</span>
                                    <div className="previewMeta">
                                        <span>Arya</span>
                                        <span>Muted</span>
                                    </div>
                                </div>
                                <div className="previewTile previewTileSmall">
                                    <span className="previewAvatar">MK</span>
                                    <div className="previewMeta">
                                        <span>Mika</span>
                                        <span>Stable</span>
                                    </div>
                                </div>
                            </div>
                            <div className="previewDock" aria-hidden="true">
                                <span></span>
                                <span></span>
                                <span></span>
                                <span></span>
                            </div>
                        </div>
                    </section>
                </main>
            </div>
        </div>
    )
}
