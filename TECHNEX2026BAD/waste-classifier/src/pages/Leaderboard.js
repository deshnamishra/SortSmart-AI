import React, { useState, useEffect } from 'react';
import { getRecords, getTotalEcoPoints } from '../services/store';
import useScrollReveal from '../hooks/useScrollReveal';
import './Leaderboard.css';

const MOCK_CONTRIBUTORS = [
    { name: 'Priya S.', pts: 342, streak: 14, scans: 68 },
    { name: 'Rahul M.', pts: 287, streak: 9, scans: 57 },
    { name: 'Ananya K.', pts: 251, streak: 7, scans: 50 },
    { name: 'Vikram T.', pts: 198, streak: 5, scans: 39 },
    { name: 'Meera P.', pts: 167, streak: 3, scans: 33 },
    { name: 'Arjun D.', pts: 140, streak: 2, scans: 28 },
    { name: 'Sneha R.', pts: 112, streak: 1, scans: 22 },
];

function buildLeaderboard(userPts, userScans) {
    return [
        ...MOCK_CONTRIBUTORS,
        { name: 'You', pts: userPts, streak: null, scans: userScans, isUser: true },
    ]
        .sort((a, b) => b.pts - a.pts)
        .map((e, i) => ({ ...e, rank: i + 1 }));
}

export default function Leaderboard() {
    const [records, setRecords] = useState([]);
    const [titleTyped, setTitleTyped] = useState('');

    useEffect(() => { setRecords(getRecords()); }, []);

    useEffect(() => {
        const T = 'Leaderboard';
        let i = 0;
        const iv = setInterval(() => {
            setTitleTyped(T.slice(0, i + 1));
            i++;
            if (i >= T.length) clearInterval(iv);
        }, 70);
        return () => clearInterval(iv);
    }, []);

    useScrollReveal([records]);

    const totalPts = getTotalEcoPoints(records);
    const totalScans = records.length;
    const board = buildLeaderboard(totalPts, totalScans);
    const userEntry = board.find(e => e.isUser);

    return (
        <div className="page-content lb-page">

            {/* ── Header ── */}
            <div className="lb-page-header">
                <div>
                    <h1 className="lb-page-title">
                        {titleTyped}<span className="lb-cursor">|</span>
                    </h1>
                    <p className="lb-page-sub">
                        <span className="lb-brand">SortSmart AI</span> · Community Rankings
                    </p>
                </div>
            </div>

            {/* ── Your Rank Card ── */}
            {totalPts > 0 && userEntry && (
                <section className="lb-section" data-reveal>
                    <div className="lb-section-label">Your Standing</div>
                    <div className="lb-you-card">
                        <div className="lb-you-rank">
                            <span className="lb-you-rank-num">#{userEntry.rank}</span>
                            <span className="lb-you-rank-label">Rank</span>
                        </div>
                        <div className="lb-you-divider" />
                        <div className="lb-you-stat">
                            <span className="lb-you-stat-val">{userEntry.pts}</span>
                            <span className="lb-you-stat-label">Eco-Points</span>
                        </div>
                        <div className="lb-you-divider" />
                        <div className="lb-you-stat">
                            <span className="lb-you-stat-val">{totalScans}</span>
                            <span className="lb-you-stat-label">Scans</span>
                        </div>
                        <div className="lb-you-glow" />
                    </div>
                </section>
            )}

            {/* ── Full Leaderboard ── */}
            <section className="lb-section" data-reveal data-reveal-delay="80">
                <div className="lb-section-label">Top Contributors · This Month</div>
                <div className="lb-list">
                    {board.map((entry, idx) => (
                        <LeaderboardRow key={entry.name} entry={entry} index={idx} />
                    ))}
                </div>
            </section>

            {/* ── How Points Work ── */}
            <section className="lb-section" data-reveal data-reveal-delay="160" style={{ paddingBottom: 40 }}>
                <div className="lb-section-label">How Points Are Earned</div>
                <div className="lb-points-grid">
                    <PointCard icon="♻️" label="Recyclable" pts={5} color="#60a5fa" />
                    <PointCard icon="🌿" label="Biodegradable" pts={7} color="#4ade80" />
                    <PointCard icon="⚠️" label="Hazardous" pts={10} color="#f87171" />
                    <PointCard icon="🎁" label="Daily Bonus" pts={5} color="#F5A623" />
                </div>
            </section>
        </div>
    );
}

function LeaderboardRow({ entry, index }) {
    const medal =
        entry.rank === 1 ? '🥇' : entry.rank === 2 ? '🥈' : entry.rank === 3 ? '🥉' : null;
    const glowColor =
        entry.rank === 1 ? '#FFD700' : entry.rank === 2 ? '#C0C0C0' : entry.rank === 3 ? '#CD7F32' : null;

    return (
        <div
            className={`lb-row${entry.isUser ? ' lb-row-you' : ''}`}
            style={{
                '--lb-glow': glowColor || 'transparent',
                '--lb-delay': `${index * 0.04}s`,
            }}
        >
            <div className="lb-row-rank">
                {medal
                    ? <span className="lb-medal">{medal}</span>
                    : <span className="lb-rank-num">{entry.rank}</span>
                }
            </div>

            <div className="lb-row-info">
                <p className="lb-row-name">
                    {entry.name}{entry.isUser ? <span className="lb-you-chip">YOU</span> : null}
                </p>
                {entry.scans != null && (
                    <p className="lb-row-meta">{entry.scans} scan{entry.scans !== 1 ? 's' : ''}</p>
                )}
            </div>

            {/* Streak */}
            {entry.streak != null && (
                <div className="lb-row-streak">
                    <span>🔥</span>
                    <span className="lb-streak-num">{entry.streak}</span>
                </div>
            )}

            {/* Points */}
            <div className="lb-row-pts">
                <span className="lb-pts-num">{entry.pts}</span>
                <span className="lb-pts-unit">pts</span>
            </div>

            {/* Top-3 glow bar */}
            {glowColor && <div className="lb-row-glow-bar" style={{ background: glowColor }} />}
        </div>
    );
}

function PointCard({ icon, label, pts, color }) {
    return (
        <div className="lb-point-card" style={{ '--pc': color }}>
            <span className="lb-point-icon">{icon}</span>
            <p className="lb-point-label">{label}</p>
            <p className="lb-point-pts" style={{ color }}>+{pts} <span className="lb-point-pts-unit">pts</span></p>
        </div>
    );
}
