import React, { useState, useEffect } from 'react';
import { getRecords, clearRecords, getTotalGreenCredits, getTotalCO2, GREEN_CREDIT_MULTIPLIER } from '../services/store';
import { calcImpact, calcEcoScore, generateInsights, IMPACT } from '../services/api';
import WastePieChart from '../components/WastePieChart';
import DailyBarChart from '../components/DailyBarChart';
import ImpactPanel from '../components/ImpactPanel';
import useScrollReveal from '../hooks/useScrollReveal';
import './Dashboard.css';

export default function Dashboard() {
  const [records, setRecords] = useState([]);
  const [showClearConfirm, setShowClear] = useState(false);
  const [titleTyped, setTitleTyped] = useState('');

  useEffect(() => { setRecords(getRecords()); }, []);

  /* Typewriter for title */
  useEffect(() => {
    const T = 'Analytics';
    let i = 0;
    const iv = setInterval(() => {
      setTitleTyped(T.slice(0, i + 1));
      i++;
      if (i >= T.length) clearInterval(iv);
    }, 70);
    return () => clearInterval(iv);
  }, []);

  const total = records.length;
  const recyclable = records.filter(r => r.category === 'Recyclable').length;
  const biodegradable = records.filter(r => r.category === 'Biodegradable').length;
  const hazardous = records.filter(r => r.category === 'Hazardous').length;
  const impact = calcImpact(records);
  const ecoScore = calcEcoScore(records);
  const insights = generateInsights(records);
  const totalGreenCredits = getTotalGreenCredits(records);
  const totalCO2 = getTotalCO2(records);
  const hazardAlert = hazardous >= 3;

  const commScans = (total * 180 + 8420).toLocaleString();
  const commCO2 = (impact.co2 * 180 + 1247).toFixed(1) + ' kg';

  useScrollReveal([records]);
  const pct = n => total ? Math.round((n / total) * 100) : 0;

  const scoreColor = ecoScore >= 70 ? '#00FF87' : ecoScore >= 40 ? '#F5A623' : '#f87171';
  const scoreLabel = ecoScore >= 70 ? 'Excellent' : ecoScore >= 40 ? 'Good Progress' : 'Needs Improvement';

  function handleClear() { clearRecords(); setRecords([]); setShowClear(false); }

  return (
    <div className="page-content dashboard-page">

      {/* ── Header ── */}
      <div className="dash-header">
        <div>
          <h1 className="dash-title">
            {titleTyped}<span className="dash-cursor">|</span>
          </h1>
          <p className="dash-sub">
            <span className="dash-sub-brand">Verdant AI</span> · Sustainability Overview
          </p>
        </div>
        {total > 0 && (
          <button
            className="clear-btn"
            onClick={() => setShowClear(true)}
            title="Clear all data"
          >✕</button>
        )}
      </div>

      {total === 0 ? <EmptyState /> : (
        <>
          {/* Hazard alert */}
          {hazardAlert && (
            <div className="hazard-alert" data-reveal>
              <span className="hazard-alert-icon">⚠️</span>
              <div>
                <p className="hazard-alert-title">Hazardous Waste Alert</p>
                <p className="hazard-alert-msg">
                  {hazardous} hazardous items detected — dispose at a certified collection point. Do NOT mix with regular waste.
                </p>
              </div>
            </div>
          )}

          {/* ── Summary Metrics ── */}
          <section className="dash-section" data-reveal>
            <div className="dash-section-label">Summary</div>
            <div className="metrics-grid">
              <MetricCard icon="📦" value={total} label="Total Scanned" color="#00FF87" />
              <MetricCard icon="♻️" value={pct(recyclable) + '%'} label="Recyclable" color="#60a5fa" />
              <MetricCard icon="🌿" value={pct(biodegradable) + '%'} label="Biodegradable" color="#4ade80" />
              <MetricCard icon="⚠️" value={hazardous} label="Hazardous" color="#f87171" />
              <MetricCard icon="🌫️" value={totalCO2.toFixed(2) + ' kg'} label="CO₂ Prevented" color="#00FF87" wide />
            </div>
          </section>

          {/* ── Eco Score ── */}
          <section className="dash-section" data-reveal data-reveal-delay="80">
            <div className="dash-section-label">Sustainability Score</div>
            <div className="eco-score-card">
              <div className="score-ring-wrap">
                <svg className="score-ring-svg" viewBox="0 0 120 120">
                  <circle cx="60" cy="60" r="50" fill="none" stroke="rgba(255,255,255,.06)" strokeWidth="8" />
                  <circle
                    cx="60" cy="60" r="50" fill="none"
                    stroke={scoreColor} strokeWidth="8"
                    strokeLinecap="round"
                    strokeDasharray={`${(ecoScore / 100) * 314} 314`}
                    transform="rotate(-90 60 60)"
                    style={{ transition: 'stroke-dasharray 1.5s var(--ease-out)', filter: `drop-shadow(0 0 8px ${scoreColor})` }}
                  />
                  <text x="60" y="56" textAnchor="middle" fontSize="22" fontWeight="800" fill={scoreColor} fontFamily="Outfit,sans-serif">{ecoScore}</text>
                  <text x="60" y="72" textAnchor="middle" fontSize="9" fill="rgba(255,255,255,.3)" fontFamily="Outfit,sans-serif">/100</text>
                </svg>
                {ecoScore >= 70 && <div className="score-pulse-ring" style={{ '--sc': scoreColor }} />}
              </div>
              <div className="score-info">
                <p className="score-label-text" style={{ color: scoreColor }}>{scoreLabel}</p>
                <p className="score-detail">Based on recycling rate, disposal accuracy, and hazardous compliance.</p>
                <div className="score-bars">
                  <ScoreBar label="Recycling Rate" value={pct(recyclable)} color="#60a5fa" />
                  <ScoreBar label="Correct Disposal" value={pct(recyclable + biodegradable)} color="#00FF87" />
                  <ScoreBar label="Hazard Control" value={hazardous === 0 ? 100 : Math.max(0, 100 - Math.round((hazardous / total) * 200))} color="#f87171" />
                </div>
              </div>
            </div>
          </section>

          {/* ── Green Credits ── */}
          <section className="dash-section" data-reveal data-reveal-delay="100">
            <div className="dash-section-label">Green Credits</div>
            <div className="green-credits-card">
              <div className="gc-leaf-particles" aria-hidden="true">
                {Array.from({ length: 8 }).map((_, i) => (
                  <span key={i} className="gc-leaf" style={{
                    left: `${10 + i * 11}%`,
                    '--leaf-dur': `${1.5 + i * 0.3}s`,
                    '--leaf-delay': `${i * 0.25}s`,
                  }}>🍃</span>
                ))}
              </div>
              <div className="gc-header">
                <div className="gc-icon-wrap">
                  <span className="gc-icon">🟢</span>
                  <div className="gc-icon-glow" />
                </div>
                <div>
                  <p className="gc-total-num">{totalGreenCredits}</p>
                  <p className="gc-total-label">Total Green Credits</p>
                </div>
              </div>
              <div className="gc-breakdown">
                <GcRow icon="♻️" label="Recyclable" mult={GREEN_CREDIT_MULTIPLIER.Recyclable} count={recyclable} color="#60a5fa" records={records} />
                <GcRow icon="🌿" label="Biodegradable" mult={GREEN_CREDIT_MULTIPLIER.Biodegradable} count={biodegradable} color="#4ade80" records={records} />
                <GcRow icon="⚠️" label="Hazardous" mult={GREEN_CREDIT_MULTIPLIER.Hazardous} count={hazardous} color="#f87171" records={records} />
              </div>
              <div className="gc-redeem">
                <span>🎟️</span>
                <p>Redeemable for: transit discounts · campus incentives · eco rewards</p>
              </div>
            </div>
          </section>

          <section className="dash-section" data-reveal data-reveal-delay="140">
            <div className="dash-section-label">Waste Distribution</div>
            <div className="chart-card" style={{ display: 'flex', justifyContent: 'center' }}>
              <div style={{ width: '100%', maxWidth: 300 }}>
                <WastePieChart records={records} />
              </div>
            </div>
          </section>
          <section className="dash-section" data-reveal data-reveal-delay="160">
            <div className="dash-section-label">Daily Trends · Last 7 Days</div>
            <div className="chart-card"><DailyBarChart records={records} /></div>
          </section>

          {/* ── Environmental Impact ── */}
          <section className="dash-section" data-reveal data-reveal-delay="180">
            <div className="dash-section-label">Environmental Impact</div>
            <ImpactPanel co2={impact.co2} energy={impact.energy} landfill={impact.landfill} trees={impact.trees} />
          </section>

          {/* ── AI Insights (terminal) ── */}
          <section className="dash-section" data-reveal data-reveal-delay="200">
            <div className="dash-section-label">AI Insights</div>
            <TerminalInsights insights={insights} />
          </section>

          {/* ── Activity Feed ── */}
          <section className="dash-section" data-reveal data-reveal-delay="240">
            <div className="dash-section-label">Recent Activity</div>
            <div className="activity-feed">
              <div className="activity-timeline-line" />
              {records.slice(0, 20).map((r, i) => (
                <ActivityItem key={r.id} record={r} index={i} />
              ))}
              {records.length > 20 && (
                <p className="activity-more">+ {records.length - 20} more items</p>
              )}
            </div>
          </section>

          {/* ── Community ── */}
          <section className="dash-section" data-reveal data-reveal-delay="280">
            <div className="dash-section-label">Community Impact</div>
            <div className="community-card">
              <CommStat icon="👥" value="2,341" label="Active participants" />
              <CommStat icon="🌍" value={commCO2} label="Community CO₂ prevented" />
              <CommStat icon="♻️" value={commScans} label="Items correctly sorted" />
              <CommStat icon="🌱" value="44,800+" label="Community eco-points" />
            </div>
          </section>


        </>
      )}

      {/* Clear confirm modal */}
      {showClearConfirm && (
        <div className="modal-overlay">
          <div className="modal-card">
            <div className="modal-icon">🗑️</div>
            <h3 className="modal-title">Clear All Data?</h3>
            <p className="modal-body">This permanently deletes all scan history and resets your dashboard.</p>
            <div className="modal-actions">
              <button className="modal-btn modal-btn-cancel" onClick={() => setShowClear(false)}>Cancel</button>
              <button className="modal-btn modal-btn-danger" onClick={handleClear}>Clear All</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

/* ── Sub-components ── */
function MetricCard({ icon, value, label, color, wide }) {
  return (
    <div className={`metric-card${wide ? ' metric-wide' : ''}`} style={{ '--mc': color }}>
      <div className="metric-icon-wrap">
        <span className="metric-icon">{icon}</span>
        <div className="metric-icon-glow" />
      </div>
      <div>
        <span className="metric-value">{value}</span>
        <p className="metric-label">{label}</p>
      </div>
    </div>
  );
}

function ScoreBar({ label, value, color }) {
  return (
    <div className="score-bar-row">
      <span className="score-bar-label">{label}</span>
      <div className="score-bar-track">
        <div className="score-bar-fill" style={{ width: value + '%', background: color, boxShadow: `0 0 8px ${color}` }} />
      </div>
      <span className="score-bar-pct">{value}%</span>
    </div>
  );
}

function GcRow({ icon, label, mult, count, color, records }) {
  const total = records.filter(r => r.category === label).reduce((s, r) => s + (r.green_credits || 0), 0);
  return (
    <div className="ep-row">
      <div className="ep-row-left">
        <span className="ep-row-icon">{icon}</span>
        <div>
          <p className="ep-row-label">{label}</p>
          <p className="ep-row-count">×{mult} multiplier · {count} item{count !== 1 ? 's' : ''}</p>
        </div>
      </div>
      <span className="ep-row-pts" style={{ color }}>{total} <span className="ep-pts-unit">credits</span></span>
    </div>
  );
}

function ActivityItem({ record, index }) {
  const imp = IMPACT[record.category] || {};
  const dt = new Date(record.timestamp);
  const timeStr = dt.toLocaleDateString('en-IN', { day: '2-digit', month: 'short' })
    + ' · ' + dt.toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' });
  return (
    <div className="activity-item" style={{ '--ai-color': imp.color, '--ai-delay': `${index * 0.05}s` }}>
      <div className="activity-dot" />
      <span className="activity-icon">{imp.icon}</span>
      <div className="activity-info">
        <div className="activity-top-row">
          <p className="activity-category" style={{ color: imp.color }}>
            {record.category}{record.object_detected ? ` · ${record.object_detected}` : ''}
          </p>
          {record.green_credits ? (
            <span className="activity-gc-badge">🟢 {record.green_credits}</span>
          ) : null}
        </div>
        {record.co2_saved > 0 && (
          <p className="activity-co2">🌫️ {record.co2_saved.toFixed(2)} kg CO₂ prevented</p>
        )}
        <p className="activity-time">{timeStr}</p>
      </div>
    </div>
  );
}

function CommStat({ icon, value, label }) {
  return (
    <div className="comm-stat">
      <span className="comm-stat-icon" style={{ animation: `floatYSm ${2 + Math.random()}s ease-in-out infinite` }}>{icon}</span>
      <p className="comm-stat-value">{value}</p>
      <p className="comm-stat-label">{label}</p>
    </div>
  );
}



/* Terminal-style AI insights */
function TerminalInsights({ insights }) {
  const [displayed, setDisplayed] = useState([]);
  const [current, setCurrent] = useState('');
  const [lineIdx, setLineIdx] = useState(0);
  const [charIdx, setCharIdx] = useState(0);

  useEffect(() => {
    if (!insights.length || lineIdx >= insights.length) return;
    const line = insights[lineIdx];
    if (charIdx < line.length) {
      const t = setTimeout(() => {
        setCurrent(line.slice(0, charIdx + 1));
        setCharIdx(c => c + 1);
      }, 28);
      return () => clearTimeout(t);
    } else {
      const t = setTimeout(() => {
        setDisplayed(d => [...d, line]);
        setCurrent('');
        setCharIdx(0);
        setLineIdx(i => i + 1);
      }, 400);
      return () => clearTimeout(t);
    }
  }, [insights, lineIdx, charIdx]);

  return (
    <div className="terminal-card">
      <div className="terminal-header">
        <div className="terminal-dots">
          <span style={{ background: '#f87171' }} />
          <span style={{ background: '#F5A623' }} />
          <span style={{ background: '#4ade80' }} />
        </div>
        <span className="terminal-title">AI_INSIGHTS.log</span>
      </div>
      <div className="terminal-body">
        <p className="terminal-prompt">{'>'} Analysing your waste patterns…</p>
        {displayed.map((ins, i) => (
          <p key={i} className="terminal-line">
            <span className="terminal-arrow">›</span> {ins}
          </p>
        ))}
        {lineIdx < insights.length && (
          <p className="terminal-line terminal-active">
            <span className="terminal-arrow">›</span> {current}
            <span className="terminal-cursor-blink">▮</span>
          </p>
        )}
      </div>
    </div>
  );
}


function EmptyState() {
  return (
    <div className="empty-state">
      <div className="empty-icon-wrap">
        <span className="empty-icon">📊</span>
        <div className="empty-icon-glow" />
      </div>
      <h3 className="empty-title">No Scans Yet</h3>
      <p className="empty-desc">Head to the Scan tab and classify your first waste item — your sustainability data will appear here.</p>
    </div>
  );
}
