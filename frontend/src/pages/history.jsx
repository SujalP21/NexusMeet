import React, { useContext, useEffect, useState } from 'react'
import { AuthContext } from '../contexts/AuthContext'
import { useNavigate } from 'react-router-dom';
import HomeIcon from '@mui/icons-material/Home';
import VideocamIcon from '@mui/icons-material/Videocam';
import withAuth from '../utils/withAuth';
import { BrandMark, StatusBadge } from '../components/ui/Primitives';
import styles from '../styles/historyPage.module.css';

function History() {
    const { getHistoryOfUser } = useContext(AuthContext);
    const [meetings, setMeetings] = useState([])
    const [isLoading, setIsLoading] = useState(true)
    const [error, setError] = useState("")
    const routeTo = useNavigate();

    useEffect(() => {
        const fetchHistory = async () => {
            try {
                setIsLoading(true);
                const history = await getHistoryOfUser();
                setMeetings(Array.isArray(history) ? history : []);
                setError("");
            } catch {
                setError("Meeting history could not be loaded.");
            } finally {
                setIsLoading(false);
            }
        }

        fetchHistory();
    }, [getHistoryOfUser])

    const formatDate = (dateString) => {
        const date = new Date(dateString);
        const day = date.getDate().toString().padStart(2, "0");
        const month = (date.getMonth() + 1).toString().padStart(2, "0")
        const year = date.getFullYear();

        return `${day}/${month}/${year}`
    }

    return (
        <main className={styles.page}>
            <div className={`nm-shell ${styles.shell}`}>
                <header className={styles.header}>
                    <div className={styles.headerCopy}>
                        <BrandMark className={styles.brand} />
                        <span className={styles.kicker}>History</span>
                        <h1>Meeting activity</h1>
                        <p>Review rooms you've joined and quickly return to previous conversations.</p>
                    </div>

                    <button className={styles.homeButton} onClick={() => routeTo("/home")} type="button">
                        <HomeIcon fontSize="small" />
                        Home
                    </button>
                </header>

                {isLoading ? (
                    <section className={styles.activityList} aria-label="Loading meeting history" aria-live="polite">
                        {[0, 1, 2].map((item) => (
                            <article className={`${styles.activityCard} ${styles.skeletonCard}`} key={item}>
                                <div>
                                    <span className={styles.skeletonLine}></span>
                                    <span className={styles.skeletonMeta}></span>
                                </div>
                                <span className={styles.skeletonButton}></span>
                            </article>
                        ))}
                    </section>
                ) : error ? (
                    <section className={styles.statePanel} role="alert">
                        <StatusBadge>Unavailable</StatusBadge>
                        <h2>History is temporarily unavailable</h2>
                        <p>{error}</p>
                        <button className={styles.secondaryButton} onClick={() => routeTo("/home")} type="button">Back home</button>
                    </section>
                ) : meetings.length !== 0 ? (
                    <section className={styles.activityList} aria-label="Previous meetings">
                        {meetings.map((meeting, index) => (
                            <article className={styles.activityCard} key={meeting._id || `${meeting.meetingCode}-${index}`}>
                                <div className={styles.activityDetails}>
                                    <span className={styles.roomLabel}>Room code</span>
                                    <h2>{meeting.meetingCode}</h2>
                                    <p>Joined {formatDate(meeting.date)}</p>
                                </div>
                                <button className={styles.rejoinButton} onClick={() => routeTo(`/${meeting.meetingCode}`)} type="button">
                                    <VideocamIcon fontSize="small" />
                                    Rejoin
                                </button>
                            </article>
                        ))}
                    </section>
                ) : (
                    <section className={styles.statePanel}>
                        <StatusBadge>Empty</StatusBadge>
                        <h2>No meeting activity yet</h2>
                        <p>Join a room and your recent activity will appear here for quick access later.</p>
                        <button className={styles.primaryButton} onClick={() => routeTo("/home")} type="button">Join a meeting</button>
                    </section>
                )}
            </div>
        </main>
    )
}

export default withAuth(History)
