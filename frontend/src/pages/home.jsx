import React, { useContext, useState } from 'react'
import withAuth from '../utils/withAuth'
import { useNavigate } from 'react-router-dom'
import "../App.css";
import RestoreIcon from '@mui/icons-material/Restore';
import LogoutIcon from '@mui/icons-material/Logout';
import { AuthContext } from '../contexts/AuthContext';
import { BrandMark, ButtonLink, Field, StatusBadge } from '../components/ui/Primitives';

function HomeComponent() {
    const navigate = useNavigate();
    const [meetingCode, setMeetingCode] = useState("");
    const [joinError, setJoinError] = useState("");

    const { addToUserHistory } = useContext(AuthContext);

    const handleJoinVideoCall = async () => {
        const trimmedCode = meetingCode.trim();
        if (!trimmedCode) {
            setJoinError("Enter a meeting code to continue.");
            return;
        }

        setJoinError("");
        await addToUserHistory(trimmedCode);
        navigate(`/${trimmedCode}`);
    }

    return (
        <main className="dashboardPage">
            <div className="nm-shell">
                <nav className="navBar" aria-label="Dashboard navigation">
                    <BrandMark />

                    <div className="navActions">
                        <button className="nm-button nm-button-secondary" onClick={() => navigate("/history")}>
                            <RestoreIcon fontSize="small" />
                            History
                        </button>

                        <button className="nm-button nm-button-secondary" onClick={() => {
                            localStorage.removeItem("token")
                            navigate("/auth")
                        }}>
                            <LogoutIcon fontSize="small" />
                            Logout
                        </button>
                    </div>
                </nav>

                <section className="dashboardHero" aria-labelledby="dashboard-title">
                    <div className="dashboardCopy">
                        <span className="dashboardKicker">Personal meeting console</span>
                        <h1 className="nm-page-title" id="dashboard-title">Start with a code. Stay focused on the room.</h1>
                        <p className="nm-body">Join an existing NexusMeet room and keep your activity trail available for later. The interface is intentionally quiet so setup never competes with the conversation.</p>

                        <div className="joinPanel nm-surface">
                            <div>
                                <h2 className="nm-section-title">Join a meeting</h2>
                                <p className="nm-caption">Paste a room code or shared meeting slug.</p>
                            </div>

                            <div className="joinForm">
                                <Field
                                    id="meeting-code"
                                    label="Meeting code"
                                    value={meetingCode}
                                    placeholder="team-sync-124"
                                    onChange={e => setMeetingCode(e.target.value)}
                                    onKeyDown={e => {
                                        if (e.key === "Enter") {
                                            handleJoinVideoCall();
                                        }
                                    }}
                                />
                                <ButtonLink onClick={handleJoinVideoCall}>Join</ButtonLink>
                            </div>
                            {joinError ? <p className="authError nm-caption" role="alert">{joinError}</p> : null}
                        </div>
                    </div>

                    <aside className="dashboardVisual" aria-label="Workspace summary">
                        <div className="quickStats">
                            <div className="statTile nm-surface">
                                <span className="statValue">01</span>
                                <span className="nm-caption">Room entry</span>
                            </div>
                            <div className="statTile nm-surface">
                                <span className="statValue">02</span>
                                <span className="nm-caption">Device check</span>
                            </div>
                            <div className="statTile nm-surface">
                                <span className="statValue">03</span>
                                <span className="nm-caption">Live call</span>
                            </div>
                        </div>

                        <div className="historyPanel nm-surface">
                            <StatusBadge tone="live">Ready</StatusBadge>
                            <h2 className="nm-section-title">Fast return paths</h2>
                            <p className="nm-body">History keeps previous meeting codes one click away without turning the dashboard into a heavy workspace.</p>
                            <button className="nm-button nm-button-secondary" onClick={() => navigate("/history")}>Open history</button>
                        </div>
                    </aside>
                </section>
            </div>
        </main>
    )
}

export default withAuth(HomeComponent)
