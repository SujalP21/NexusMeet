import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import io from "socket.io-client";
import VideocamIcon from '@mui/icons-material/Videocam';
import VideocamOffIcon from '@mui/icons-material/VideocamOff'
import styles from "../styles/videoComponent.module.css";
import CallEndIcon from '@mui/icons-material/CallEnd'
import MicIcon from '@mui/icons-material/Mic'
import MicOffIcon from '@mui/icons-material/MicOff'
import ScreenShareIcon from '@mui/icons-material/ScreenShare';
import StopScreenShareIcon from '@mui/icons-material/StopScreenShare'
import ChatIcon from '@mui/icons-material/Chat'
import GroupsIcon from '@mui/icons-material/Groups'
import server from '../environment';

const server_url = server;

const peerConfigConnections = {
    iceServers: [
        { urls: "stun:stun.l.google.com:19302" }
    ]
}

export default function VideoMeetComponent() {
    const socketRef = useRef();
    const socketIdRef = useRef();
    const localVideoref = useRef();
    const cameraStreamRef = useRef(null);
    const screenStreamRef = useRef(null);
    const localStreamRef = useRef(null);
    const connectionsRef = useRef({});
    const videoRef = useRef([]);
    const videoEnabledRef = useRef(true);
    const socketConnectingRef = useRef(false);
    const peerSendersRef = useRef({});
    const restoringCameraRef = useRef(false);
    const participantNamesRef = useRef({});
    const pendingSignalsRef = useRef({});
    const pendingIceCandidatesRef = useRef({});

    const [videoAvailable, setVideoAvailable] = useState(true);
    const [audioAvailable, setAudioAvailable] = useState(true);
    const [video, setVideo] = useState(true);
    const [audio, setAudio] = useState(true);
    const [screen, setScreen] = useState(false);
    const [showModal, setModal] = useState(false);
    const [screenAvailable, setScreenAvailable] = useState(false);
    const [messages, setMessages] = useState([])
    const [message, setMessage] = useState("");
    const [newMessages, setNewMessages] = useState(0);
    const [askForUsername, setAskForUsername] = useState(true);
    const [username, setUsername] = useState("");
    const [videos, setVideos] = useState([])
    const [roomCodeCopied, setRoomCodeCopied] = useState(false);

    const setLocalPreview = useCallback((stream) => {
        localStreamRef.current = stream;
        console.debug("local stream", stream);
        if (localVideoref.current && localVideoref.current.srcObject !== stream) {
            localVideoref.current.srcObject = stream;
        }
    }, [])

    const attachLocalVideoRef = useCallback((videoElement) => {
        localVideoref.current = videoElement;
        console.debug("video ref", localVideoref.current);

        if (videoElement && localStreamRef.current && videoElement.srcObject !== localStreamRef.current) {
            videoElement.srcObject = localStreamRef.current;
        }

        console.debug("srcObject assigned", localVideoref.current?.srcObject);
    }, [])

    const ensureLocalPreviewAttached = useCallback((transitionName) => {
        const videoElement = localVideoref.current;
        const localStream = localStreamRef.current;

        if (!videoElement || !localStream) return;

        if (videoElement.srcObject !== localStream) {
            videoElement.srcObject = localStream;
            console.debug("srcObject assigned", videoElement.srcObject);
        }

        if (process.env.NODE_ENV !== "production") {
            console.debug("local preview validation", {
                transition: transitionName,
                hasLocalStream: Boolean(localStream),
                hasVideoRef: Boolean(videoElement),
                srcObjectIsNull: videoElement.srcObject === null,
                srcObjectMatchesLocalStream: videoElement.srcObject === localStream,
            });
        }
    }, [])

    const stopStream = useCallback((stream) => {
        if (!stream) return;
        stream.getTracks().forEach((track) => track.stop());
    }, [])

    const logDiagnostics = useCallback((label) => {
        if (process.env.NODE_ENV === "production") return;

        const localTracks = localStreamRef.current?.getTracks().map((track) => ({
            kind: track.kind,
            enabled: track.enabled,
            readyState: track.readyState,
        })) || [];

        const peerSenders = Object.fromEntries(
            Object.entries(peerSendersRef.current).map(([socketId, senders]) => [
                socketId,
                Object.fromEntries(
                    Object.entries(senders).map(([kind, sender]) => [
                        kind,
                        {
                            enabled: sender.track?.enabled,
                            readyState: sender.track?.readyState,
                        },
                    ])
                ),
            ])
        );

        console.debug("[NexusMeet VideoMeet]", label, {
            socketId: socketIdRef.current,
            socketConnected: socketRef.current?.connected || false,
            peerCount: Object.keys(connectionsRef.current).length,
            localTracks,
            peerSenders,
        });
    }, [])

    const stopScreenStream = useCallback(() => {
        const screenStream = screenStreamRef.current;
        if (!screenStream) return;

        screenStream.getVideoTracks().forEach((track) => {
            track.onended = null;
        });
        stopStream(screenStream);
        screenStreamRef.current = null;
    }, [stopStream])

    const cleanupSocket = useCallback(() => {
        const socket = socketRef.current;
        if (!socket) return;

        socket.off('signal');
        socket.off('chat-message');
        socket.off('connect');
        socket.off('connect_error');
        socket.off('disconnect');
        socket.off('user-left');
        socket.off('user-joined');
        socket.disconnect();
        socketRef.current = null;
        socketConnectingRef.current = false;
    }, [])

    const buildLocalStream = useCallback((videoTrackOverride) => {
        const cameraStream = cameraStreamRef.current;
        if (!cameraStream) return null;

        const videoTrack = videoTrackOverride || cameraStream.getVideoTracks()[0];
        const audioTracks = cameraStream.getAudioTracks();
        const tracks = [
            ...(videoTrack ? [videoTrack] : []),
            ...audioTracks,
        ];

        const nextStream = new MediaStream(tracks);
        setLocalPreview(nextStream);
        return nextStream;
    }, [setLocalPreview])

    const replacePeerTrack = useCallback((kind, track) => {
        Object.entries(connectionsRef.current).forEach(([socketListId, connection]) => {
            const trackedSenders = peerSendersRef.current[socketListId] || {};
            let sender = trackedSenders[kind];

            if (!sender || !connection.getSenders?.().includes(sender)) {
                sender = connection.getSenders?.().find((candidate) => candidate.track?.kind === kind);
            }

            if (sender) {
                peerSendersRef.current[socketListId] = {
                    ...trackedSenders,
                    [kind]: sender,
                };
                sender.replaceTrack(track).catch((error) => console.log(error));
            } else if (track && localStreamRef.current) {
                peerSendersRef.current[socketListId] = {
                    ...trackedSenders,
                    [kind]: connection.addTrack(track, localStreamRef.current),
                };
            }
        });
        logDiagnostics(`replace-${kind}-track`);
    }, [logDiagnostics])

    const applyTrackEnabled = useCallback((kind, enabled) => {
        cameraStreamRef.current?.getTracks()
            .filter((track) => track.kind === kind)
            .forEach((track) => {
                track.enabled = enabled;
            });
    }, [])

    const getPermissions = useCallback(async () => {
        setScreenAvailable(Boolean(navigator.mediaDevices?.getDisplayMedia));

        try {
            let mediaStream;

            try {
                mediaStream = await navigator.mediaDevices.getUserMedia({ video: true, audio: true });
            } catch {
                const fallbackTracks = [];

                try {
                    const videoOnlyStream = await navigator.mediaDevices.getUserMedia({ video: true });
                    fallbackTracks.push(...videoOnlyStream.getVideoTracks());
                } catch {
                    setVideoAvailable(false);
                }

                try {
                    const audioOnlyStream = await navigator.mediaDevices.getUserMedia({ audio: true });
                    fallbackTracks.push(...audioOnlyStream.getAudioTracks());
                } catch {
                    setAudioAvailable(false);
                }

                if (fallbackTracks.length === 0) {
                    throw new Error("No camera or microphone tracks are available.");
                }

                mediaStream = new MediaStream(fallbackTracks);
            }

            cameraStreamRef.current = mediaStream;

            const hasVideo = mediaStream.getVideoTracks().length > 0;
            const hasAudio = mediaStream.getAudioTracks().length > 0;

            setVideoAvailable(hasVideo);
            setAudioAvailable(hasAudio);
            setVideo(hasVideo);
            videoEnabledRef.current = hasVideo;
            setAudio(hasAudio);

            buildLocalStream();
            logDiagnostics("media-ready");
        } catch (error) {
            console.log(error);
            setVideoAvailable(false);
            setAudioAvailable(false);
        }
    }, [buildLocalStream, logDiagnostics])

    useEffect(() => {
        getPermissions();

        return () => {
            cleanupSocket();
            Object.values(connectionsRef.current).forEach((connection) => connection.close());
            connectionsRef.current = {};
            peerSendersRef.current = {};
            stopStream(cameraStreamRef.current);
            stopScreenStream();
        }
    }, [cleanupSocket, getPermissions, stopScreenStream, stopStream])

    useEffect(() => {
        ensureLocalPreviewAttached(`render-state:${askForUsername ? "lobby" : "meeting"}:${screen ? "screen" : "camera"}:${video ? "video-on" : "video-off"}`);
    }, [askForUsername, ensureLocalPreviewAttached, screen, video])

    const renegotiatePeer = useCallback((socketListId) => {
        const connection = connectionsRef.current[socketListId];
        if (!connection) return;

        connection.createOffer().then((description) => {
            connection.setLocalDescription(description)
                .then(() => {
                    socketRef.current?.emit('signal', socketListId, JSON.stringify({ sdp: connection.localDescription }))
                })
                .catch(e => console.log(e))
        }).catch(e => console.log(e))
    }, [])

    const attachLocalStreamToPeer = useCallback((socketListId) => {
        const connection = connectionsRef.current[socketListId];
        const localStream = localStreamRef.current;
        if (!connection || !localStream) return;

        localStream.getTracks().forEach((track) => {
            const trackedSenders = peerSendersRef.current[socketListId] || {};
            const existingSender = trackedSenders[track.kind];

            if (existingSender && connection.getSenders?.().includes(existingSender)) {
                existingSender.replaceTrack(track).catch((error) => console.log(error));
                return;
            }

            peerSendersRef.current[socketListId] = {
                ...trackedSenders,
                [track.kind]: connection.addTrack(track, localStream),
            };
        });
    }, [])

    const handleRemoteStream = useCallback((socketListId, stream) => {
        if (process.env.NODE_ENV !== "production") {
            console.debug("[NexusMeet VideoMeet] handleRemoteStream entered", {
                socketListId,
                hasStream: Boolean(stream),
                trackKinds: stream?.getTracks?.().map((track) => track.kind) || [],
                stream,
            });
        }

        if (!stream) return;

        setVideos(videos => {
            const participantName = participantNamesRef.current[socketListId];
            const existingVideo = videos.find(video => video.socketId === socketListId);
            const videosBySocketId = new Map();

            videos.forEach((video) => {
                if (!videosBySocketId.has(video.socketId)) {
                    videosBySocketId.set(video.socketId, video);
                }
            });

            videosBySocketId.set(socketListId, {
                ...existingVideo,
                socketId: socketListId,
                stream,
                name: participantName || existingVideo?.name,
                autoplay: true,
                playsinline: true,
            });

            const updatedVideos = Array.from(videosBySocketId.values());
            videoRef.current = updatedVideos;
            return updatedVideos;
        });
    }, [])

    const queueSignal = useCallback((fromId, signal) => {
        pendingSignalsRef.current[fromId] = [
            ...(pendingSignalsRef.current[fromId] || []),
            signal,
        ];
    }, [])

    const queueIceCandidate = useCallback((fromId, candidate) => {
        pendingIceCandidatesRef.current[fromId] = [
            ...(pendingIceCandidatesRef.current[fromId] || []),
            candidate,
        ];
    }, [])

    const flushQueuedIceCandidates = useCallback((fromId) => {
        const connection = connectionsRef.current[fromId];
        if (!connection?.remoteDescription) return;

        const queuedCandidates = pendingIceCandidatesRef.current[fromId] || [];
        delete pendingIceCandidatesRef.current[fromId];

        queuedCandidates.forEach((candidate) => {
            connection.addIceCandidate(new RTCIceCandidate(candidate)).catch(e => console.log(e))
        });
    }, [])

    const applySignalToConnection = useCallback((fromId, signal) => {
        const connection = connectionsRef.current[fromId];
        if (!connection) {
            queueSignal(fromId, signal);
            return;
        }

        if (fromId !== socketIdRef.current) {
            if (signal.sdp) {
                connection.setRemoteDescription(new RTCSessionDescription(signal.sdp)).then(() => {
                    flushQueuedIceCandidates(fromId);

                    if (signal.sdp.type === 'offer') {
                        connection.createAnswer().then((description) => {
                            connection.setLocalDescription(description).then(() => {
                                socketRef.current?.emit('signal', fromId, JSON.stringify({ sdp: connection.localDescription }))
                            }).catch(e => console.log(e))
                        }).catch(e => console.log(e))
                    }
                }).catch(e => console.log(e))
            }

            if (signal.ice) {
                if (connection.remoteDescription) {
                    connection.addIceCandidate(new RTCIceCandidate(signal.ice)).catch(e => console.log(e))
                } else {
                    queueIceCandidate(fromId, signal.ice);
                }
            }
        }
    }, [flushQueuedIceCandidates, queueIceCandidate, queueSignal])

    const processQueuedSignals = useCallback((socketListId) => {
        const queuedSignals = pendingSignalsRef.current[socketListId] || [];
        delete pendingSignalsRef.current[socketListId];

        queuedSignals.forEach((signal) => {
            applySignalToConnection(socketListId, signal);
        });
    }, [applySignalToConnection])

    const gotMessageFromServer = useCallback((fromId, message) => {
        const signal = JSON.parse(message)

        applySignalToConnection(fromId, signal);
    }, [applySignalToConnection])

    const addMessage = useCallback((data, sender, socketIdSender) => {
        setMessages((prevMessages) => [
            ...prevMessages,
            { sender: sender, data: data }
        ]);
        if (socketIdSender !== socketIdRef.current) {
            setNewMessages((prevNewMessages) => prevNewMessages + 1);
        }
    }, [])

    const createPeerConnection = useCallback((socketListId) => {
        if (connectionsRef.current[socketListId]) {
            return connectionsRef.current[socketListId];
        }

        const connection = new RTCPeerConnection(peerConfigConnections);
        connectionsRef.current[socketListId] = connection;
        peerSendersRef.current[socketListId] = peerSendersRef.current[socketListId] || {};

        connection.onicecandidate = function (event) {
            if (event.candidate != null) {
                socketRef.current?.emit('signal', socketListId, JSON.stringify({ ice: event.candidate }))
            }
        }

        connection.ontrack = (event) => {
            if (process.env.NODE_ENV !== "production") {
                console.debug("[NexusMeet VideoMeet] ontrack fired", {
                    socketListId,
                    trackKind: event.track?.kind,
                    streamsLength: event.streams.length,
                    firstStream: event.streams[0],
                });

                if (event.streams.length === 0) {
                    console.debug("[NexusMeet VideoMeet] ontrack fired without streams", {
                        socketListId,
                        trackKind: event.track?.kind,
                    });
                }
            }

            handleRemoteStream(socketListId, event.streams[0]);
        };

        connection.onaddstream = (event) => {
            handleRemoteStream(socketListId, event.stream);
        };

        attachLocalStreamToPeer(socketListId);
        processQueuedSignals(socketListId);
        logDiagnostics("peer-created");
        return connection;
    }, [attachLocalStreamToPeer, handleRemoteStream, logDiagnostics, processQueuedSignals])

    const connectToSocketServer = useCallback(() => {
        if (socketRef.current?.connected || socketConnectingRef.current) return;

        socketConnectingRef.current = true;
        const socket = io.connect(server_url, { secure: false })
        socketRef.current = socket;

        socket.on('signal', gotMessageFromServer)
        socket.on('chat-message', addMessage)

        socket.on('connect', () => {
            socketConnectingRef.current = false;
            socketIdRef.current = socket.id
            socket.emit('join-call', {
                path: window.location.href,
                username: username.trim() || "Guest",
            })
            logDiagnostics("socket-connected");
        })

        socket.on('connect_error', (error) => {
            socketConnectingRef.current = false;
            if (process.env.NODE_ENV !== "production") {
                console.log(error);
            }
        })

        socket.on('disconnect', () => {
            socketConnectingRef.current = false;
        })

        socket.on('user-left', (id) => {
            connectionsRef.current[id]?.close();
            delete connectionsRef.current[id];
            delete peerSendersRef.current[id];
            delete participantNamesRef.current[id];

            setVideos((videos) => {
                const updatedVideos = videos.filter((video) => video.socketId !== id);
                videoRef.current = updatedVideos;
                return updatedVideos;
            })
            logDiagnostics("user-left");
        })

        socket.on('user-joined', (id, clients, participantsBySocketId = {}) => {
            participantNamesRef.current = {
                ...participantNamesRef.current,
                ...participantsBySocketId,
            };

            setVideos((videos) => {
                const updatedVideos = videos.map((video) => ({
                    ...video,
                    name: participantNamesRef.current[video.socketId] || video.name,
                }));
                videoRef.current = updatedVideos;
                return updatedVideos;
            });

            if (process.env.NODE_ENV !== "production") {
                console.debug("[NexusMeet VideoMeet] user-joined payload", {
                    id,
                    clients,
                    participantsBySocketId,
                    videosLength: videoRef.current.length,
                    participantCount: videoRef.current.length + 1,
                });
            }

            clients.forEach((socketListId) => {
                if (process.env.NODE_ENV !== "production") {
                    console.debug("[NexusMeet VideoMeet] peer creation check", {
                        localSocketId: socketIdRef.current,
                        socketId: socket.id,
                        targetSocketId: socketListId,
                        roomParticipantCount: clients.length,
                    });
                    console.assert(socketListId !== socket.id, "Target socket id must not match socket.id");
                    console.assert(socketListId !== socketIdRef.current, "Target socket id must not match socketIdRef.current");
                }

                if (socketListId === socket.id || socketListId === socketIdRef.current) {
                    if (process.env.NODE_ENV !== "production") {
                        console.warn("[NexusMeet VideoMeet] skipped self peer creation", {
                            localSocketId: socketIdRef.current,
                            socketId: socket.id,
                            targetSocketId: socketListId,
                            roomParticipantCount: clients.length,
                        });
                    }
                    return;
                }
                createPeerConnection(socketListId);
            })

            if (id === socketIdRef.current) {
                Object.keys(connectionsRef.current).forEach((socketListId) => {
                    renegotiatePeer(socketListId);
                })
            }
        })
    }, [addMessage, createPeerConnection, gotMessageFromServer, logDiagnostics, renegotiatePeer, username])

    const getMedia = useCallback(() => {
        buildLocalStream();
        applyTrackEnabled('video', video);
        applyTrackEnabled('audio', audio);
        connectToSocketServer();
    }, [applyTrackEnabled, audio, buildLocalStream, connectToSocketServer, video])

    const handleVideo = useCallback(() => {
        if (!videoAvailable) return;

        setVideo((currentVideo) => {
            const nextVideo = !currentVideo;
            videoEnabledRef.current = nextVideo;
            applyTrackEnabled('video', nextVideo);
            return nextVideo;
        });
    }, [applyTrackEnabled, videoAvailable])

    const handleAudio = useCallback(() => {
        if (!audioAvailable) return;

        setAudio((currentAudio) => {
            const nextAudio = !currentAudio;
            applyTrackEnabled('audio', nextAudio);
            return nextAudio;
        });
    }, [applyTrackEnabled, audioAvailable])

    const restoreCameraAfterScreenShare = useCallback(() => {
        if (restoringCameraRef.current) return;

        restoringCameraRef.current = true;
        try {
            const cameraTrack = cameraStreamRef.current?.getVideoTracks()[0];
            if (!cameraTrack) return;

            cameraTrack.enabled = videoEnabledRef.current;
            buildLocalStream(cameraTrack);
            replacePeerTrack('video', cameraTrack);
            logDiagnostics("camera-restored");
        } finally {
            restoringCameraRef.current = false;
        }
    }, [buildLocalStream, logDiagnostics, replacePeerTrack])

    const handleScreen = useCallback(async () => {
        if (!screenAvailable) return;

        if (screen) {
            stopScreenStream();
            setScreen(false);
            restoreCameraAfterScreenShare();
            logDiagnostics("screen-share-stopped");
            return;
        }

        try {
            stopScreenStream();
            const displayStream = await navigator.mediaDevices.getDisplayMedia({ video: true });
            const screenTrack = displayStream.getVideoTracks()[0];
            screenStreamRef.current = displayStream;

            screenTrack.onended = () => {
                screenTrack.onended = null;
                screenStreamRef.current = null;
                setScreen(false);
                restoreCameraAfterScreenShare();
                logDiagnostics("screen-share-ended");
            };

            setScreen(true);
            buildLocalStream(screenTrack);
            replacePeerTrack('video', screenTrack);
            logDiagnostics("screen-share-started");
        } catch (error) {
            console.log(error);
        }
    }, [buildLocalStream, logDiagnostics, replacePeerTrack, restoreCameraAfterScreenShare, screen, screenAvailable, stopScreenStream])

    const handleEndCall = useCallback(() => {
        stopStream(cameraStreamRef.current);
        stopScreenStream();
        cleanupSocket();
        Object.values(connectionsRef.current).forEach((connection) => connection.close());
        connectionsRef.current = {};
        peerSendersRef.current = {};
        logDiagnostics("call-ended");
        window.location.href = "/"
    }, [cleanupSocket, logDiagnostics, stopScreenStream, stopStream])

    const openChat = useCallback(() => {
        setModal(true);
        setNewMessages(0);
    }, [])

    const closeChat = useCallback(() => {
        setModal(false);
    }, [])

    const roomCode = useMemo(() => {
        const pathSegments = window.location.pathname.split("/").filter(Boolean);
        return decodeURIComponent(pathSegments[pathSegments.length - 1] || "room");
    }, [])

    const copyRoomCode = useCallback(() => {
        const markCopied = () => {
            setRoomCodeCopied(true);
            window.setTimeout(() => setRoomCodeCopied(false), 1800);
        };

        if (!navigator.clipboard?.writeText) {
            markCopied();
            return;
        }

        navigator.clipboard.writeText(roomCode)
            .then(markCopied)
            .catch((error) => {
                if (process.env.NODE_ENV !== "production") {
                    console.log(error);
                }
            });
    }, [roomCode])

    const handleMessage = useCallback((e) => {
        setMessage(e.target.value);
    }, [])

    const sendMessage = useCallback(() => {
        const trimmedMessage = message.trim();
        if (!trimmedMessage) return;

        socketRef.current?.emit('chat-message', trimmedMessage, username)
        setMessage("");
    }, [message, username])

    const connect = useCallback(() => {
        setAskForUsername(false);
        getMedia();
    }, [getMedia])

    const participantCount = videos.length + 1;
    const gridSize = participantCount > 4 ? "many" : `${participantCount}`;
    const isWaitingForOthers = videos.length === 0;
    const participantLabel = useMemo(() => (
        `${participantCount} participant${participantCount === 1 ? "" : "s"}`
    ), [participantCount])

    useEffect(() => {
        if (process.env.NODE_ENV !== "production") {
            console.debug("[NexusMeet VideoMeet] participant count", {
                videosLength: videos.length,
                participantCount,
            });
        }
    }, [participantCount, videos.length])

    return (
        <main className={styles.meetingPage}>
            {askForUsername === true ?
                <section className={styles.lobby} aria-labelledby="lobby-title">
                    <div className={styles.lobbyPanel}>
                        <div className={styles.lobbyCopy}>
                            <span className={styles.lobbyKicker}>Lobby</span>
                            <h1 id="lobby-title">Set your name before joining.</h1>
                            <p>Check your preview, enter a display name, and step into the room when you are ready.</p>
                        </div>

                        <label className={styles.lobbyField} htmlFor="display-name">
                            <span>Display name</span>
                            <input
                                id="display-name"
                                value={username}
                                onChange={e => setUsername(e.target.value)}
                                placeholder="Your name"
                            />
                        </label>

                        <button className={styles.primaryAction} onClick={connect} type="button">
                            Connect
                        </button>
                    </div>

                    <div className={styles.lobbyPreview}>
                        <video ref={attachLocalVideoRef} autoPlay muted playsInline></video>
                        <div className={styles.tileOverlay}>
                            <span>{username || "Preview"}</span>
                            <span>Local camera</span>
                        </div>
                    </div>
                </section> :

                <section className={styles.meetVideoContainer} data-chat-open={showModal}>
                    <div className={styles.meetingContent}>
                        <div className={styles.meetingTopBar}>
                            <div className={styles.meetingHeaderCluster}>
                                <div className={styles.meetingTitleRow}>
                                    <h1>NexusMeet Room</h1>
                                    <div className={styles.roomMeta}>
                                        <span className={styles.liveBadge}>Live</span>
                                        <span className={styles.metaChip}>{participantLabel}</span>
                                        <span className={styles.metaChip}>Room {roomCode}</span>
                                        {screen ? <span className={`${styles.metaChip} ${styles.metaChipActive}`}>Presenting</span> : null}
                                    </div>
                                </div>
                            </div>
                        </div>

                        <div className={`${styles.videoGrid} ${styles[`videoGrid${gridSize}`]} ${isWaitingForOthers ? styles.videoGridWaiting : ""}`}>
                            <article className={`${styles.videoTile} ${styles.activeTile}`}>
                                <video className={styles.tileVideo} ref={attachLocalVideoRef} autoPlay muted playsInline></video>
                                <div className={styles.tileOverlay}>
                                    <div className={styles.tileNameStrip}>
                                        <span className={styles.tileIdentity}>{username || "You"}</span>
                                        <span>{screen ? "Presenting" : "You"}</span>
                                    </div>
                                    <div className={styles.tileStatusRow} aria-label="Your media status">
                                        <span className={audio === true ? styles.tileStatusOn : styles.tileStatusOff}>{audio === true ? "Mic on" : "Mic muted"}</span>
                                        <span className={video === true ? styles.tileStatusOn : styles.tileStatusOff}>{video === true ? "Camera on" : "Camera off"}</span>
                                        {screen === true ? <span className={styles.tileStatusOn}>Presenting</span> : null}
                                    </div>
                                </div>
                            </article>

                            {isWaitingForOthers ? (
                                <div className={styles.waitingPanel} aria-live="polite">
                                    <span>Waiting for teammates</span>
                                    <p>Share this room code with others to start collaborating. Participants will appear here as they join.</p>
                                    <div className={styles.roomCodeCard}>
                                        <span>{roomCode}</span>
                                        <button type="button" onClick={copyRoomCode}>
                                            {roomCodeCopied ? "Copied" : "Copy code"}
                                        </button>
                                    </div>
                                </div>
                            ) : null}

                            {videos.map((video, index) => {
                                const remoteTracks = video.stream?.getTracks?.() || [];
                                const remoteHasAudio = remoteTracks.some((track) => track.kind === "audio" && track.readyState === "live" && track.enabled !== false);
                                const remoteHasVideo = remoteTracks.some((track) => track.kind === "video" && track.readyState === "live" && track.enabled !== false);

                                return (
                                    <article className={styles.videoTile} key={video.socketId}>
                                        <video
                                            className={styles.tileVideo}
                                            data-socket={video.socketId}
                                            ref={ref => {
                                                if (ref && video.stream) {
                                                    ref.srcObject = video.stream;
                                                    if (process.env.NODE_ENV !== "production") {
                                                        console.debug("[NexusMeet VideoMeet] remote video srcObject assigned", {
                                                            socketId: video.socketId,
                                                            stream: video.stream,
                                                            srcObject: ref.srcObject,
                                                        });
                                                    }
                                                }
                                            }}
                                            autoPlay
                                            playsInline
                                        >
                                        </video>
                                        <div className={styles.tileOverlay}>
                                            <div className={styles.tileNameStrip}>
                                                <span className={styles.tileIdentity}>{video.name || `Participant ${index + 1}`}</span>
                                                <span>Remote participant</span>
                                            </div>
                                            <div className={styles.tileStatusRow} aria-label="Participant media status">
                                                <span className={remoteHasAudio ? styles.tileStatusOn : styles.tileStatusOff}>{remoteHasAudio ? "Mic on" : "Mic muted"}</span>
                                                <span className={remoteHasVideo ? styles.tileStatusOn : styles.tileStatusOff}>{remoteHasVideo ? "Camera on" : "Camera off"}</span>
                                            </div>
                                        </div>
                                    </article>
                                )
                            })}
                        </div>

                        <div className={styles.buttonContainers} aria-label="Meeting controls">
                                <button className={styles.controlButton} onClick={handleAudio} type="button" aria-pressed={audio === true} aria-label={audio === true ? "Mute microphone" : "Unmute microphone"}>
                                    {audio === true ? <MicIcon /> : <MicOffIcon />}
                                    <span>Mic</span>
                                </button>

                                <button className={styles.controlButton} onClick={handleVideo} type="button" aria-pressed={video === true} aria-label={video === true ? "Turn camera off" : "Turn camera on"}>
                                    {(video === true) ? <VideocamIcon /> : <VideocamOffIcon />}
                                    <span>Camera</span>
                                </button>

                            {screenAvailable === true ?
                                <button className={`${styles.controlButton} ${screen === true ? styles.controlButtonActive : ""}`} onClick={handleScreen} type="button" aria-pressed={screen === true} aria-label={screen === true ? "Stop screen sharing" : "Share screen"}>
                                    {screen === true ? <StopScreenShareIcon /> : <ScreenShareIcon />}
                                    <span>Share</span>
                                </button> : null}

                            <button className={styles.controlButton} onClick={openChat} type="button" aria-label="Open chat">
                                <ChatIcon />
                                <span>Chat</span>
                                {newMessages > 0 ? <strong>{newMessages}</strong> : null}
                            </button>

                            <button className={styles.controlButton} type="button" aria-label="Participants">
                                <GroupsIcon />
                                <span>{participantCount}</span>
                            </button>

                            <button className={`${styles.controlButton} ${styles.leaveButton}`} onClick={handleEndCall} type="button" aria-label="Leave meeting">
                                <CallEndIcon />
                                <span>Leave</span>
                            </button>
                        </div>
                    </div>

                    {showModal ? <aside className={styles.chatRoom} aria-label="Meeting chat">
                        <div className={styles.chatContainer}>
                            <div className={styles.chatHeader}>
                                <div>
                                    <h2>Chat</h2>
                                    <p>{messages.length} message{messages.length === 1 ? "" : "s"}</p>
                                </div>
                                <button className={styles.panelButton} onClick={closeChat} type="button">Close</button>
                            </div>

                            <div className={styles.chattingDisplay}>
                                {messages.length !== 0 ? messages.map((item, index) => (
                                    <div className={`${styles.messageItem} ${item.sender === username ? styles.messageItemOwn : ""}`} key={index}>
                                        <p>{item.sender}</p>
                                        <span>{item.data}</span>
                                    </div>
                                )) : <p className={styles.emptyChat}>No messages yet. Start with a short note when the room is ready.</p>}
                            </div>

                            <div className={styles.chattingArea}>
                                <label className={styles.chatInputLabel} htmlFor="meeting-chat">Message</label>
                                <input
                                    id="meeting-chat"
                                    value={message}
                                    onChange={handleMessage}
                                    onKeyDown={(event) => {
                                        if (event.key === "Enter") {
                                            sendMessage();
                                        }
                                    }}
                                    placeholder="Write a message"
                                />
                                <button className={styles.sendButton} type="button" onClick={sendMessage}>Send</button>
                            </div>
                        </div>
                    </aside> : null}
                </section>
            }
        </main>
    )
}
