import React, { useContext, useEffect, useState } from 'react'
import { AuthContext } from '../contexts/AuthContext'
import { useNavigate } from 'react-router-dom';
import HomeIcon from '@mui/icons-material/Home';
import VideocamIcon from '@mui/icons-material/Videocam';
import withAuth from '../utils/withAuth';
import { BrandMark, StatusBadge } from '../components/ui/Primitives';

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
        <main className="historyPage">
            <div className="nm-shell">
                <header className="historyHeader">
                    <div>
                        <BrandMark />
                        <h1 className="nm-page-title">Meeting history</h1>
                        <p className="nm-body">A clean record of rooms you have joined from this account.</p>
                    </div>
                    <div className="historyHeaderActions">
                        <button className="nm-button nm-button-secondary" onClick={() => routeTo("/home")}>
                            <HomeIcon fontSize="small" />
                            Home
                        </button>
                    </div>
                </header>

                {isLoading ? (
                    <section className="emptyState nm-surface" aria-live="polite">
                        <StatusBadge>Loading</StatusBadge>
                        <h2 className="nm-section-title">Getting your recent rooms</h2>
                        <p className="nm-body">This should only take a moment.</p>
                    </section>
                ) : error ? (
                    <section className="emptyState nm-surface" role="alert">
                        <StatusBadge>Unavailable</StatusBadge>
                        <h2 className="nm-section-title">History is temporarily unavailable</h2>
                        <p className="nm-body">{error}</p>
                    </section>
                ) : meetings.length !== 0 ? (
                    <section className="historyList" aria-label="Previous meetings">
                        {meetings.map((meeting, index) => (
                            <article className="historyItem nm-surface" key={meeting._id || `${meeting.meetingCode}-${index}`}>
                                <div>
                                    <p className="historyCode">Code: {meeting.meetingCode}</p>
                                    <p className="nm-caption">Joined {formatDate(meeting.date)}</p>
                                </div>
                                <button className="nm-button nm-button-secondary" onClick={() => routeTo(`/${meeting.meetingCode}`)}>
                                    <VideocamIcon fontSize="small" />
                                    Rejoin
                                </button>
                            </article>
                        ))}
                    </section>
                ) : (
                    <section className="emptyState nm-surface">
                        <StatusBadge>Empty</StatusBadge>
                        <h2 className="nm-section-title">No meetings yet</h2>
                        <p className="nm-body">Rooms you join from the dashboard will appear here.</p>
                        <button className="nm-button nm-button-primary" onClick={() => routeTo("/home")}>Join a meeting</button>
                    </section>
                )}
            </div>
        </main>
    )
}

export default withAuth(History)
