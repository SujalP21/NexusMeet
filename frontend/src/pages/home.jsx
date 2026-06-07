import React, { useContext, useEffect, useMemo, useState } from 'react'
import withAuth from '../utils/withAuth'
import { useNavigate } from 'react-router-dom'
import RestoreIcon from '@mui/icons-material/Restore';
import LogoutIcon from '@mui/icons-material/Logout';
import VideocamIcon from '@mui/icons-material/Videocam';
import { AuthContext } from '../contexts/AuthContext';
import { BrandMark, ButtonLink, Field, StatusBadge } from '../components/ui/Primitives';
import styles from '../styles/homeDashboard.module.css';

function HomeComponent() {
    const navigate = useNavigate();
    const [meetingCode, setMeetingCode] = useState("");
    const [joinError, setJoinError] = useState("");
    const [meetings, setMeetings] = useState([]);
    const [isHistoryLoading, setIsHistoryLoading] = useState(true);
    const [historyError, setHistoryError] = useState("");

    const { addToUserHistory, getHistoryOfUser } = useContext(AuthContext);

    useEffect(() => {
        let isMounted = true;

        const fetchRecentRooms = async () => {
            try {
                setIsHistoryLoading(true);
                const history = await getHistoryOfUser();
                if (!isMounted) return;
                setMeetings(Array.isArray(history) ? history : []);
                setHistoryError("");
            } catch {
                if (!isMounted) return;
                setMeetings([]);
                setHistoryError("Recent rooms are unavailable right now.");
            } finally {
                if (isMounted) {
                    setIsHistoryLoading(false);
                }
            }
        }

        fetchRecentRooms();

        return () => {
            isMounted = false;
        }
    }, [getHistoryOfUser])

    const recentRooms = useMemo(() => (
        [...meetings]
            .sort((first, second) => new Date(second.date || 0) - new Date(first.date || 0))
            .slice(0, 3)
    ), [meetings])

    const lastRoom = recentRooms[0];

    const getMeetingCode = (meeting) => meeting?.meetingCode || meeting?.meeting_code || "";

    const formatDate = (dateString) => {
        if (!dateString) return "Recently joined";

        return new Intl.DateTimeFormat(undefined, {
            month: "short",
            day: "numeric",
        }).format(new Date(dateString));
    }

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

    const handleRejoin = (code) => {
        if (!code) return;
        navigate(`/${code}`);
    }

    return (
        <main className={styles.page}>
            <div className={`nm-shell ${styles.shell}`}>
                <nav className={styles.nav} aria-label="Dashboard navigation">
                    <BrandMark className={styles.brand} />

                    <div className={styles.navActions}>
                        <button className={styles.navButton} onClick={() => navigate("/history")} type="button">
                            <RestoreIcon fontSize="small" />
                            History
                        </button>

                        <button className={`${styles.navButton} ${styles.logoutButton}`} onClick={() => {
                            localStorage.removeItem("token")
                            navigate("/auth")
                        }} type="button">
                            <LogoutIcon fontSize="small" />
                            Logout
                        </button>
                    </div>
                </nav>

                <section className={styles.dashboard} aria-labelledby="dashboard-title">
                    <div className={styles.primaryColumn}>
                        <div className={styles.intro}>
                            <span className={styles.kicker}>Meeting hub</span>
                            <h1 id="dashboard-title">Your rooms are ready.</h1>
                            <p>Join by code, or pick up from a recent room.</p>
                        </div>

                        <section className={styles.joinPanel} aria-labelledby="join-title">
                            <div className={styles.joinHeader}>
                                <div>
                                    <StatusBadge tone="live">Ready to join</StatusBadge>
                                    <h2 id="join-title">Join a meeting</h2>
                                </div>
                                <span>Room code</span>
                            </div>

                            <div className={styles.joinForm}>
                                <Field
                                    id="meeting-code"
                                    label="Meeting code"
                                    caption="Paste the code or room slug shared by your teammate."
                                    value={meetingCode}
                                    placeholder="team-sync-124"
                                    aria-describedby={joinError ? "meeting-code-error" : undefined}
                                    onChange={e => setMeetingCode(e.target.value)}
                                    onKeyDown={e => {
                                        if (e.key === "Enter") {
                                            handleJoinVideoCall();
                                        }
                                    }}
                                />
                                <ButtonLink className={styles.joinButton} onClick={handleJoinVideoCall}>Join room</ButtonLink>
                            </div>

                            {joinError ? <p className={styles.errorMessage} id="meeting-code-error" role="alert">{joinError}</p> : null}
                        </section>

                        <section className={styles.lastRoomPanel} aria-labelledby="last-room-title">
                            <div>
                                <span className={styles.panelLabel}>Quick return</span>
                                <h2 id="last-room-title">{lastRoom ? "Last joined room" : "No recent rooms yet"}</h2>
                                <p>{lastRoom ? "The fastest route back into your latest room." : "Join a room once and it will appear here for a faster return."}</p>
                            </div>

                            {lastRoom ? (
                                <button className={styles.rejoinButton} onClick={() => handleRejoin(getMeetingCode(lastRoom))} type="button">
                                    <VideocamIcon fontSize="small" />
                                    Rejoin {getMeetingCode(lastRoom)}
                                </button>
                            ) : (
                                <button className={styles.secondaryButton} onClick={() => navigate("/history")} type="button">
                                    Open history
                                </button>
                            )}
                        </section>
                    </div>

                    <aside className={styles.sideColumn} aria-label="Recent rooms and account continuity">
                        <section className={styles.recentPanel} aria-labelledby="recent-title">
                            <div className={styles.panelHeader}>
                                <div>
                                    <span className={styles.panelLabel}>Recent rooms</span>
                                    <h2 id="recent-title">Pick up where you left off</h2>
                                </div>
                                <button className={styles.textButton} onClick={() => navigate("/history")} type="button">View all</button>
                            </div>

                            {isHistoryLoading ? (
                                <div className={styles.emptyState} aria-live="polite">
                                    <span>Loading recent rooms</span>
                                    <p>Checking your saved meeting activity.</p>
                                </div>
                            ) : historyError ? (
                                <div className={styles.emptyState} role="alert">
                                    <span>History unavailable</span>
                                    <p>{historyError}</p>
                                </div>
                            ) : recentRooms.length > 0 ? (
                                <div className={styles.roomList}>
                                    {recentRooms.map((meeting, index) => {
                                        const code = getMeetingCode(meeting);
                                        return (
                                            <article className={styles.roomItem} key={meeting._id || `${code}-${index}`}>
                                                <div>
                                                    <span>{code}</span>
                                                    <p>{formatDate(meeting.date)}</p>
                                                </div>
                                                <button onClick={() => handleRejoin(code)} type="button">Rejoin</button>
                                            </article>
                                        )
                                    })}
                                </div>
                            ) : (
                                <div className={styles.emptyState}>
                                    <span>Your recent rooms will live here</span>
                                    <p>Use the join form to enter a room. NexusMeet will keep the trail available for later.</p>
                                </div>
                            )}
                        </section>

                        <section className={styles.readinessPanel} aria-labelledby="readiness-title">
                            <span className={styles.panelLabel}>Room flow</span>
                            <h2 id="readiness-title">Code, lobby, meeting.</h2>
                            <p>Enter a room code here. Confirm camera and name in the lobby, then step into the call.</p>
                            <div className={styles.readinessSteps} aria-hidden="true">
                                <span>Code</span>
                                <span>Lobby</span>
                                <span>Room</span>
                            </div>
                        </section>
                    </aside>
                </section>
            </div>
        </main>
    )
}

export default withAuth(HomeComponent)
