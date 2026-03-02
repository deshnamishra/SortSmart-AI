import React, { useEffect, useRef, useState } from 'react';
import './CameraModal.css';

/**
 * CameraModal
 * Opens the device camera via getUserMedia, shows a live preview,
 * lets the user capture a frame, then calls onCapture(file) or onClose().
 */
export default function CameraModal({ onCapture, onClose }) {
    const videoRef = useRef(null);
    const canvasRef = useRef(null);
    const streamRef = useRef(null);

    const [ready, setReady] = useState(false);
    const [captured, setCaptured] = useState(null); // dataURL of snapshot
    const [error, setError] = useState('');
    const [facingMode, setFacingMode] = useState('environment'); // 'environment' | 'user'

    /* ── Start stream ── */
    useEffect(() => {
        startStream(facingMode);
        return () => stopStream();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [facingMode]);

    async function startStream(facing) {
        stopStream();
        setReady(false);
        setError('');
        setCaptured(null);
        try {
            const stream = await navigator.mediaDevices.getUserMedia({
                video: { facingMode: facing, width: { ideal: 1280 }, height: { ideal: 720 } },
                audio: false,
            });
            streamRef.current = stream;
            if (videoRef.current) {
                videoRef.current.srcObject = stream;
                videoRef.current.onloadedmetadata = () => setReady(true);
            }
        } catch (err) {
            setError(
                err.name === 'NotAllowedError'
                    ? 'Camera permission denied. Please allow camera access in your browser and try again.'
                    : `Camera error: ${err.message}`
            );
        }
    }

    function stopStream() {
        streamRef.current?.getTracks().forEach(t => t.stop());
        streamRef.current = null;
    }

    function handleCapture() {
        const video = videoRef.current;
        const canvas = canvasRef.current;
        if (!video || !canvas) return;
        canvas.width = video.videoWidth;
        canvas.height = video.videoHeight;
        canvas.getContext('2d').drawImage(video, 0, 0);
        const dataURL = canvas.toDataURL('image/jpeg', 0.92);
        setCaptured(dataURL);
        stopStream(); // freeze — don't waste resources
    }

    function handleRetake() {
        setCaptured(null);
        startStream(facingMode);
    }

    function handleUse() {
        if (!captured) return;
        // Convert dataURL → File
        const byteString = atob(captured.split(',')[1]);
        const ab = new ArrayBuffer(byteString.length);
        const ia = new Uint8Array(ab);
        for (let i = 0; i < byteString.length; i++) ia[i] = byteString.charCodeAt(i);
        const blob = new Blob([ab], { type: 'image/jpeg' });
        const file = new File([blob], `capture-${Date.now()}.jpg`, { type: 'image/jpeg' });
        stopStream();
        onCapture(file, captured);
    }

    function handleClose() {
        stopStream();
        onClose();
    }

    function handleFlip() {
        setFacingMode(f => (f === 'environment' ? 'user' : 'environment'));
    }

    return (
        <div className="cam-modal-backdrop" onClick={handleClose}>
            <div className="cam-modal" onClick={e => e.stopPropagation()}>

                {/* Header */}
                <div className="cam-modal-header">
                    <span className="cam-modal-title">
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
                            <path d="M23 19a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4l2-3h6l2 3h4a2 2 0 0 1 2 2z" />
                            <circle cx="12" cy="13" r="4" />
                        </svg>
                        Live Camera
                    </span>
                    <button className="cam-close-btn" onClick={handleClose} title="Close">✕</button>
                </div>

                {/* Viewfinder / snapshot */}
                <div className="cam-viewfinder">
                    {error ? (
                        <div className="cam-error">
                            <span>⚠️</span>
                            <p>{error}</p>
                        </div>
                    ) : (
                        <>
                            {/* Live video — hidden once captured */}
                            <video
                                ref={videoRef}
                                autoPlay
                                playsInline
                                muted
                                className={`cam-video${captured ? ' cam-hidden' : ''}${ready ? ' cam-ready' : ''}`}
                            />

                            {/* Snapshot preview */}
                            {captured && (
                                <img src={captured} alt="captured" className="cam-snapshot" />
                            )}

                            {/* Loading overlay */}
                            {!ready && !captured && !error && (
                                <div className="cam-loading">
                                    <div className="cam-spinner" />
                                    <span>Starting camera…</span>
                                </div>
                            )}

                            {/* Corner brackets */}
                            {!captured && ready && <div className="cam-corners" />}

                            {/* Scan line when live */}
                            {!captured && ready && <div className="cam-scan-line" />}
                        </>
                    )}
                </div>

                {/* Hidden canvas for capture */}
                <canvas ref={canvasRef} style={{ display: 'none' }} />

                {/* Controls */}
                <div className="cam-controls">
                    {!captured && !error && (
                        <>
                            <button className="cam-btn cam-btn-ghost" onClick={handleFlip} title="Flip camera" disabled={!ready}>
                                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
                                    <path d="M1 4v6h6" /><path d="M3.51 15a9 9 0 1 0 .49-4.96" />
                                </svg>
                                Flip
                            </button>
                            <button
                                className="cam-btn cam-btn-capture"
                                onClick={handleCapture}
                                disabled={!ready}
                                title="Take photo"
                            >
                                <div className="cam-shutter" />
                            </button>
                            <div style={{ width: 80 }} /> {/* spacer to centre shutter */}
                        </>
                    )}

                    {captured && (
                        <>
                            <button className="cam-btn cam-btn-ghost" onClick={handleRetake}>
                                ↩ Retake
                            </button>
                            <button className="cam-btn cam-btn-use" onClick={handleUse}>
                                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                    <polyline points="20 6 9 17 4 12" />
                                </svg>
                                Scan This Photo
                            </button>
                        </>
                    )}
                </div>
            </div>
        </div>
    );
}
