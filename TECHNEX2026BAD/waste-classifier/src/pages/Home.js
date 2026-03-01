import React, { useState, useRef, useEffect } from 'react';
import { classifyWaste, IMPACT, OBJECT_IMPACT } from '../services/api';
import { addRecord, isDuplicate, claimDailyBonus, ECO_POINTS, calcGreenCredits } from '../services/store';
import ResultCard from '../components/ResultCard';
import ImpactPanel from '../components/ImpactPanel';
import useScrollReveal from '../hooks/useScrollReveal';
import './Home.css';

const CIRC = 653;
const CAT_COLOR = { Recyclable: '#60a5fa', Hazardous: '#f87171', Biodegradable: '#4ade80' };

export default function Home() {
  const [preview, setPreview] = useState(null);
  const [file, setFile] = useState(null);
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState(null);
  const [error, setError] = useState('');
  const [toast, setToast] = useState(null);
  const [isDrag, setIsDrag] = useState(false);
  const [ripple, setRipple] = useState(false);
  const inputRef = useRef();

  /* Typewriter headline */
  const HEADLINE = 'Turn Waste Into\nIntelligence.';
  const [typedH, setTypedH] = useState('');
  useEffect(() => {
    let i = 0;
    const iv = setInterval(() => {
      setTypedH(HEADLINE.slice(0, i + 1));
      i++;
      if (i >= HEADLINE.length) clearInterval(iv);
    }, 45);
    return () => clearInterval(iv);
  }, []);

  function showToast(msg, type = 'success') {
    setToast({ msg, type });
    setTimeout(() => setToast(null), 3000);
  }

  function handleFileChange(e) {
    const f = e.target?.files?.[0] || e.dataTransfer?.files?.[0];
    if (!f) return;
    if (!f.type.startsWith('image/')) { showToast('Please select an image file', 'error'); return; }
    setFile(f); setResult(null); setError('');
    const reader = new FileReader();
    reader.onload = ev => setPreview(ev.target.result);
    reader.readAsDataURL(f);
  }

  function handleDragOver(e) { e.preventDefault(); setIsDrag(true); }
  function handleDragLeave() { setIsDrag(false); }
  function handleDrop(e) { e.preventDefault(); setIsDrag(false); handleFileChange({ dataTransfer: e.dataTransfer }); }

  function handlePanelClick() {
    if (loading || result) return;
    setRipple(true);
    setTimeout(() => setRipple(false), 600);
  }

  async function handleSubmit(e) {
    e.preventDefault();
    if (!file) { showToast('Select an image first', 'error'); return; }
    const duplicate = isDuplicate(file);
    setLoading(true); setError(''); setResult(null);
    try {
      const data = await classifyWaste(file);
      const category = data.prediction;
      const impact = IMPACT[category];
      if (!impact) throw new Error('Unknown category: ' + category);
      const objectKey = (data.object || '').toLowerCase();
      const objectMetrics = OBJECT_IMPACT[objectKey] || {};
      const co2Saved = objectMetrics.co2Saved !== undefined ? objectMetrics.co2Saved : (impact.co2Saved || 0);
      const objectDetected = data.object || null;
      const earned = duplicate ? 0 : (ECO_POINTS[category] || 5);
      const gotBonus = duplicate ? false : claimDailyBonus();
      const totalPts = earned + (gotBonus ? ECO_POINTS.DailyBonus : 0);
      const greenCredits = duplicate ? 0 : calcGreenCredits(co2Saved, category);
      const record = duplicate ? null : addRecord(category, objectMetrics.guidance || impact.guidance, file, co2Saved, objectDetected);
      setResult({
        category,
        impact: { ...impact, ...objectMetrics, detectedObject: data.object || data.detectedObject || null, confidence: data.confidence != null ? Number(data.confidence) : null },
        record, ecoPoints: earned, bonusPoints: gotBonus ? ECO_POINTS.DailyBonus : 0, greenCredits, co2Saved,
      });
      if (duplicate) showToast('Duplicate — no eco-points awarded.', 'error');
      else showToast(`+${totalPts} eco-points earned! 🌱`);
    } catch (err) {
      setError(err.message || 'Something went wrong. Is the server running?');
      showToast(err.message || 'Error', 'error');
    } finally { setLoading(false); }
  }

  function handleReset() {
    setPreview(null); setFile(null); setResult(null); setError('');
    if (inputRef.current) inputRef.current.value = '';
  }

  const confidence = result?.impact?.confidence ?? null;
  const ringOffset = confidence !== null ? CIRC * (1 - confidence) : CIRC;
  const catColor = result ? (CAT_COLOR[result.category] || '#00FF87') : null;
  const catIcon = result ? (IMPACT[result.category]?.icon || '🗑️') : null;

  useScrollReveal([result, preview]);

  return (
    <div className="page-content home-page">

      {/* ══ HERO SECTION ══ */}
      <section className="hero-section">
        <div className="hero-content">

          {/* Tag */}
          <div className="hero-tag">
            <span className="hero-tag-dot" />
            AI Waste Classifier · Sustainability Intelligence
          </div>

          {/* Massive headline */}
          <h1 className="hero-headline">
            {typedH.split('\n').map((line, i) => (
              <React.Fragment key={i}>
                {i > 0 && <br />}
                {i === 1 ? <em>{line}</em> : line}
              </React.Fragment>
            ))}
            <span className="hero-cursor">|</span>
          </h1>

          <p className="hero-sub">
            Upload a photo of any waste item. Our AI identifies the material,
            tells you exactly how to dispose of it, and tracks your environmental footprint.
          </p>

          {/* ─ Upload Panel ─ */}
          <div
            className={`upload-panel${isDrag ? ' drag-over' : ''}${preview ? ' has-preview' : ''}${loading ? ' scanning' : ''}${result ? ' has-result' : ''}`}
            onDragOver={handleDragOver}
            onDragLeave={handleDragLeave}
            onDrop={handleDrop}
            onClick={handlePanelClick}
          >
            {/* File input (idle only) */}
            {!loading && !result && (
              <input type="file" accept="image/*" ref={inputRef} onChange={handleFileChange} title=" " />
            )}

            {/* Ripple */}
            {ripple && <div className="panel-ripple" />}

            {/* SVG scan ring */}
            <div className="scan-ring-container">
              <svg className="scan-ring-svg" viewBox="0 0 240 240">
                <circle className="scan-track" cx="120" cy="120" r="104" />
                <circle
                  className={`scan-fill${loading ? ' scan-animate' : ''}`}
                  cx="120" cy="120" r="104"
                  strokeDasharray={CIRC}
                  strokeDashoffset={loading ? 0 : ringOffset}
                  style={result ? { stroke: catColor, filter: `drop-shadow(0 0 10px ${catColor})` } : {}}
                />
              </svg>

              {/* Inner content */}
              <div className="scan-inner">

                {/* Idle */}
                {!preview && !loading && !result && (
                  <div className="scan-idle">
                    <div className="scan-idle-icon">
                      <svg width="36" height="36" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.2">
                        <rect x="3" y="3" width="5" height="5" rx="1" /><rect x="16" y="3" width="5" height="5" rx="1" />
                        <rect x="3" y="16" width="5" height="5" rx="1" />
                        <path d="M21 16h-3a2 2 0 0 0-2 2v3" /><path d="M21 21h.01" />
                        <circle cx="12" cy="12" r="2" />
                      </svg>
                    </div>
                    <p className="scan-idle-label">Drop image here</p>
                    <p className="scan-idle-sub">or click to browse</p>
                  </div>
                )}

                {/* Preview loaded */}
                {preview && !loading && !result && (
                  <img src={preview} alt="preview" className="scan-preview-img" />
                )}

                {/* Scanning */}
                {loading && (
                  <div className="scan-loading-overlay">
                    {preview && <img src={preview} alt="" className="scan-preview-img scan-blur" />}
                    <div className="scan-beam" />
                    <div className="scan-loading-text">
                      <span className="scan-loading-label">ANALYSING</span>
                      <div className="scan-dots"><span /><span /><span /></div>
                    </div>
                  </div>
                )}

                {/* Result */}
                {result && (
                  <>
                    {preview && <img src={preview} alt="result" className="scan-preview-img" />}
                    <div className="scan-result-badge" style={{ '--cat-c': catColor }}>
                      <span className="scan-result-icon">{catIcon}</span>
                      <span className="scan-result-label" style={{ color: catColor }}>{result.category}</span>
                      {confidence !== null && (
                        <span className="scan-result-conf">{(confidence * 100).toFixed(0)}%</span>
                      )}
                    </div>
                  </>
                )}
              </div>
            </div>

            {/* Panel footer */}
            <div className="panel-footer">
              {!preview && !loading && !result && (
                <span className="panel-footer-text">JPG · PNG · WEBP · up to 10MB</span>
              )}
              {preview && !loading && !result && (
                <span className="panel-footer-text" style={{ color: 'var(--green)' }}>Image ready — classify below ↓</span>
              )}
              {loading && (
                <span className="panel-footer-text scanning-text">AI model processing…</span>
              )}
              {result && (
                <span className="panel-footer-text" style={{ color: catColor }}>
                  {result.impact?.detectedObject || result.category} · {confidence !== null ? `${(confidence * 100).toFixed(0)}% confidence` : 'classified'}
                </span>
              )}
            </div>
          </div>

          {/* Error */}
          {error && (
            <div className="error-strip">
              <span>⚠</span> {error}
            </div>
          )}

          {/* Action buttons */}
          <div className="hero-actions">
            {!preview && !result && (
              <>
                <label className="btn btn-primary" htmlFor="cam-inp">
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8"><path d="M23 19a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4l2-3h6l2 3h4a2 2 0 0 1 2 2z" /><circle cx="12" cy="13" r="4" /></svg>
                  Camera
                  <input id="cam-inp" type="file" accept="image/*" capture="environment" hidden onChange={handleFileChange} />
                </label>
                <label className="btn btn-ghost" htmlFor="gal-inp">
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8"><rect x="3" y="3" width="18" height="18" rx="2" /><circle cx="8.5" cy="8.5" r="1.5" /><polyline points="21 15 16 10 5 21" /></svg>
                  Upload Photo
                  <input id="gal-inp" type="file" accept="image/*" hidden onChange={handleFileChange} />
                </label>
              </>
            )}
            {preview && !result && !loading && (
              <button className="btn btn-classify" onClick={handleSubmit}>
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8"><circle cx="11" cy="11" r="8" /><path d="m21 21-4.35-4.35" /></svg>
                Classify This Item
              </button>
            )}
            {preview && !result && !loading && (
              <button className="btn btn-ghost" onClick={handleReset}>
                Change Image
              </button>
            )}
            {result && (
              <button className="btn btn-ghost btn-full" onClick={handleReset}>
                ↩ &nbsp;Scan Another Item
              </button>
            )}
          </div>

          {/* Impact counters (always visible) */}
          <div className="hero-counters" data-reveal>
            <Counter value="50,000+" label="Items Classified" />
            <div className="counter-sep" />
            <Counter value="1.2 T" label="CO₂ Prevented" />
            <div className="counter-sep" />
            <Counter value="3 Categories" label="AI Accuracy ≥ 95%" />
          </div>
        </div>
      </section>

      {/* ══ RESULT SECTION ══ */}
      {result && (
        <section className="result-section" style={{ animation: 'fadeUp .5s var(--ease-out) both' }}>
          <div className="result-inner">
            <ResultCard
              category={result.category}
              impact={result.impact}
              ecoPoints={result.ecoPoints}
              bonusPoints={result.bonusPoints}
              greenCredits={result.greenCredits}
              co2Saved={result.co2Saved}
            />
            <ImpactPanel impact={result.impact} single />
          </div>
        </section>
      )}

      {/* ══ HOW IT WORKS ══ */}
      {!result && (
        <section className="hiw-section" data-reveal>
          <div className="hiw-inner">
            <div className="section-label" style={{ textAlign: 'center', marginBottom: 48 }}>How It Works</div>
            <div className="hiw-grid">
              {[
                { n: '01', emoji: '📡', title: 'Capture', body: 'Tap or drag-drop a photo of your waste item — any angle, any lighting.' },
                { n: '02', emoji: '🧬', title: 'AI Analyses', body: 'Our computer vision model identifies material type and optimal disposal path.' },
                { n: '03', emoji: '🌱', title: 'Earn & Act', body: 'Get step-by-step disposal guidance, CO₂ data, and Green Credits for your action.' },
              ].map((s, i) => (
                <div className="hiw-card" key={s.n} style={{ animationDelay: `${i * 0.12}s` }}>
                  <div className="hiw-card-num">{s.n}</div>
                  <div className="hiw-card-emoji">{s.emoji}</div>
                  <h3 className="hiw-card-title">{s.title}</h3>
                  <p className="hiw-card-body">{s.body}</p>
                </div>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* ══ STATS BAND ══ */}
      {!result && (
        <section className="stats-band" data-reveal>
          <div className="stats-band-inner">
            <StatBand icon="🌫️" value="0" unit="kg CO₂ today" sub="Scan to contribute" color="var(--green)" />
            <StatBand icon="♻️" value="95%+" unit="classification accuracy" sub="3-class AI model" color="#60a5fa" />
            <StatBand icon="🌳" value="0" unit="tree-days today" sub="Pending your scans" color="#4ade80" />
          </div>
        </section>
      )}

      {toast && <div className={`toast ${toast.type}`}>{toast.msg}</div>}
    </div>
  );
}

function Counter({ value, label }) {
  return (
    <div className="counter-item">
      <span className="counter-value">{value}</span>
      <span className="counter-label">{label}</span>
    </div>
  );
}

function StatBand({ icon, value, unit, sub, color }) {
  return (
    <div className="stat-band-item">
      <span className="stat-band-icon">{icon}</span>
      <div>
        <p className="stat-band-value" style={{ color }}>
          <span className="stat-band-num">{value}</span>
          {' '}<span className="stat-band-unit">{unit}</span>
        </p>
        <p className="stat-band-sub">{sub}</p>
      </div>
    </div>
  );
}
