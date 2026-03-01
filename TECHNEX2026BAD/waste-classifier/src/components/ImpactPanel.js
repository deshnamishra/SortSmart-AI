import React from 'react';
import './ImpactPanel.css';

export default function ImpactPanel({ impact, co2, trees, landfill, energy, single }) {
  const d = single
    ? {
      co2: impact?.co2Saved,
      energy: impact?.energySaved,
      landfill: impact?.landfillSaved,
      trees: impact?.treeDays,
    }
    : { co2, trees, landfill, energy };

  const items = [
    { icon: '🌫️', value: (d.co2?.toFixed(2) ?? '—') + ' kg', label: 'CO₂ Prevented', color: '#00FF87' },
    { icon: '🗑️', value: (d.landfill?.toFixed(2) ?? '—') + ' kg', label: 'Landfill Avoided', color: '#00D4FF' },
    { icon: '⚡', value: (d.energy?.toFixed(2) ?? '—') + ' kWh', label: 'Energy Saved', color: '#F5A623' },
    { icon: '🌳', value: (d.trees?.toFixed(1) ?? '—') + ' days', label: 'Tree Equivalent', color: '#4ade80' },
  ];

  return (
    <section className="impact-panel" data-reveal>
      <div className="impact-label">🌍 Environmental Impact</div>
      <div className="impact-strip">
        {items.map((it, i) => (
          <div className="impact-tile" key={i} style={{ '--tile-color': it.color, '--tile-delay': `${i * 0.08}s` }}>
            <div className="impact-tile-icon-wrap">
              <span className="impact-tile-icon">{it.icon}</span>
              <div className="impact-tile-glow" />
            </div>
            <span className="impact-tile-value">{it.value}</span>
            <span className="impact-tile-label">{it.label}</span>
            <div className="impact-tile-bar">
              <div className="impact-tile-bar-fill" />
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}
