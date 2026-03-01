import React, { useEffect, useRef, useState } from 'react';
import './ResultCard.css';

const CAT_GRADIENT = {
  Recyclable: 'linear-gradient(135deg, #1a3a6e 0%, #60a5fa 100%)',
  Biodegradable: 'linear-gradient(135deg, #0d3320 0%, #4ade80 100%)',
  Hazardous: 'linear-gradient(135deg, #3d1010 0%, #f87171 100%)',
};

// Per-category guidance panel configuration
const GUIDANCE_CONFIG = {
  Recyclable: {
    accentColor: '#60a5fa',
    bg: 'rgba(60,134,255,0.06)',
    border: 'rgba(60,134,255,0.2)',
    headerIcon: '♻️',
    headerLabel: 'Recycling Instructions',
    tipIcon: '💡',
    tip: 'Clean items increase recycling yield by up to 40% — a quick rinse makes a real difference.',
  },
  Biodegradable: {
    accentColor: '#4ade80',
    bg: 'rgba(64,145,108,0.07)',
    border: 'rgba(64,145,108,0.22)',
    headerIcon: '🌿',
    headerLabel: 'Composting Instructions',
    tipIcon: '🌱',
    tip: 'Home composting reduces household methane emissions by up to 25% — every peel counts.',
  },
  Hazardous: {
    accentColor: '#f87171',
    bg: 'rgba(230,57,70,0.07)',
    border: 'rgba(230,57,70,0.22)',
    headerIcon: '⚠️',
    headerLabel: '⚡ Special Disposal Required',
    tipIcon: '🚫',
    tip: 'Hazardous waste in landfill can contaminate groundwater for decades. Never bin it.',
  },
};

const ECO_MESSAGES = {
  Recyclable: 'Recycling conserves raw materials and cuts energy use by up to 95%.',
  Biodegradable: 'Composting prevents methane and returns nutrients to soil naturally.',
  Hazardous: 'Safe disposal protects water sources and prevents toxic contamination.',
};

const CONFETTI_COLORS = ['#00FF87', '#39FF14', '#00D4FF', '#F5A623', '#ffffff'];

export default function ResultCard({ category, impact, ecoPoints, bonusPoints, greenCredits, co2Saved }) {
  const [showConfetti, setShowConfetti] = useState(false);
  const confettiSpawned = useRef(false);

  useEffect(() => {
    if (ecoPoints > 0 && !confettiSpawned.current) {
      confettiSpawned.current = true;
      setShowConfetti(true);
      setTimeout(() => setShowConfetti(false), 1200);
    }
  }, [ecoPoints]);

  if (!category || !impact) return null;

  const displayCO2 = (co2Saved !== undefined ? co2Saved : impact.co2Saved || 0).toFixed(2);
  const displayTrees = (impact.treeDays || 0).toFixed(1);
  const displayGC = greenCredits || 0;
  const totalPts = ecoPoints + (bonusPoints || 0);
  const catGradient = CAT_GRADIENT[category] || CAT_GRADIENT.Biodegradable;

  // 20 confetti pieces with random dirs
  const confetti = Array.from({ length: 20 }, (_, i) => ({
    id: i,
    color: CONFETTI_COLORS[i % CONFETTI_COLORS.length],
    x: -60 + Math.random() * 120,
    spin: -180 + Math.random() * 360,
    dur: 0.7 + Math.random() * 0.5,
    delay: Math.random() * 0.25,
    size: 4 + Math.random() * 5,
  }));

  return (
    <div className="result-card" data-category={category}>
      {/* Confetti burst */}
      {showConfetti && (
        <div className="result-confetti" aria-hidden="true">
          {confetti.map(c => (
            <span
              key={c.id}
              className="confetti-piece"
              style={{
                '--tx': `${c.x}px`,
                '--spin': `${c.spin}deg`,
                background: c.color,
                width: c.size,
                height: c.size,
                animationDuration: `${c.dur}s`,
                animationDelay: `${c.delay}s`,
              }}
            />
          ))}
        </div>
      )}

      {/* ── Category Banner ── */}
      <div className="result-banner" style={{ background: catGradient }}>
        <div className="result-banner-glow" />
        <span className="result-banner-icon" aria-label={category}>{impact.icon}</span>
        <div className="result-banner-text">
          <p className="result-banner-label">Classified As</p>
          <h2 className="result-banner-cat">{category}</h2>
          {(impact.detectedObject || impact.confidence != null) && (
            <p className="result-banner-meta">
              {impact.detectedObject ? `${impact.detectedObject}` : ''}
              {impact.detectedObject && impact.confidence != null ? ' · ' : ''}
              {impact.confidence != null ? `${Math.round(impact.confidence * 100)}% confidence` : ''}
            </p>
          )}
        </div>
        {/* Bin sticker */}
        <div className="result-bin-sticker" style={{ color: impact.color, borderColor: `${impact.color}60` }}>
          <span className="result-bin-sticker-label">BIN</span>
          <span className="result-bin-sticker-value">{impact.bin}</span>
        </div>
      </div>

      {/* ── Metrics Row ── */}
      <div className="result-metrics">
        <div className="result-metric" style={{ '--mc': impact.color }}>
          <span className="rm-icon">🌫️</span>
          <span className="rm-value">{displayCO2}<span className="rm-unit">kg</span></span>
          <span className="rm-label">CO₂ Saved</span>
        </div>
        <div className="result-metric-divider" />
        <div className="result-metric" style={{ '--mc': '#4ade80' }}>
          <span className="rm-icon">🌳</span>
          <span className="rm-value">{displayTrees}<span className="rm-unit">days</span></span>
          <span className="rm-label">Tree Equiv.</span>
        </div>
        <div className="result-metric-divider" />
        <div className="result-metric" style={{ '--mc': '#00FF87' }}>
          <span className="rm-icon">🟢</span>
          <span className="rm-value rm-credits">{displayGC}</span>
          <span className="rm-label">Credits</span>
        </div>
      </div>

      {/* ── Guidance ── */}
      <GuidanceBlock category={category} guidance={impact.guidance} object={impact.detectedObject} />

      {/* ── Eco Reward Banner ── */}
      {ecoPoints > 0 && (
        <div className="eco-reward-banner">
          <div className="eco-reward-icon-wrap">
            <span>🌱</span>
            <div className="eco-reward-glow" />
          </div>
          <div className="eco-reward-info">
            <p className="eco-reward-pts">+{totalPts} Eco-Points &nbsp;·&nbsp; +{displayGC} Credits</p>
            {bonusPoints > 0 && (
              <span className="eco-bonus-chip">+{bonusPoints} daily bonus 🎉</span>
            )}
            <p className="eco-reward-msg">{ECO_MESSAGES[category] || ''}</p>
          </div>
        </div>
      )}
    </div>
  );
}

function GuidanceBlock({ category, guidance, object }) {
  const cfg = GUIDANCE_CONFIG[category] || GUIDANCE_CONFIG.Recyclable;
  return (
    <div
      className="guidance-block"
      style={{
        '--gb-bg': cfg.bg,
        '--gb-accent': cfg.accentColor,
        '--gb-border': cfg.border,
      }}
    >
      <div className="guidance-header">
        <span className="guidance-header-icon">{cfg.headerIcon}</span>
        <span className="guidance-header-label">{cfg.headerLabel}</span>
        {object && <span className="guidance-object-chip">{object}</span>}
      </div>
      <p className="guidance-body-text">{guidance}</p>
      <div className="guidance-tip">
        <span className="guidance-tip-icon">{cfg.tipIcon}</span>
        <span className="guidance-tip-text">{cfg.tip}</span>
      </div>
    </div>
  );
}
