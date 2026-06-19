import { useState } from 'react';
import { useNetwork } from '../context/NetworkContext';

export default function CustomEdgeForm() {
  const { addCustomEdge } = useNetwork();

  const [from,    setFrom]    = useState('');
  const [to,      setTo]      = useState('');
  const [latency, setLatency] = useState('');
  const [fb,      setFb]      = useState(null); // { type, msg }

  function submit(e) {
    e.preventDefault();
    const f   = from.trim();
    const t   = to.trim();
    const lat = parseInt(latency, 10);

    if (!f || !t)         return flash('error', 'Enter both node names');
    if (f === t)          return flash('error', 'Source and target must differ');
    if (!lat || lat <= 0) return flash('error', 'Latency must be > 0');

    addCustomEdge({ fromName: f, toName: t, latency: lat });
    setFrom(''); setTo(''); setLatency('');
    flash('success', `${f} ↔ ${t} (${lat}ms) added`);
  }

  function flash(type, msg) {
    setFb({ type, msg });
    if (type === 'success') setTimeout(() => setFb(null), 2500);
  }

  return (
    <form className="edge-form" onSubmit={submit}>
      <div className="section-label">Add Custom Edge</div>

      <div className="form-field">
        <label className="form-label">Source Node Name</label>
        <input
          className="form-input"
          placeholder='e.g. "Server-A" or "Node 1"'
          value={from}
          onChange={e => { setFrom(e.target.value); setFb(null); }}
          autoComplete="off"
          spellCheck={false}
        />
      </div>

      <div className="form-field">
        <label className="form-label">Target Node Name</label>
        <input
          className="form-input"
          placeholder='e.g. "Router-1" or "DC-West"'
          value={to}
          onChange={e => { setTo(e.target.value); setFb(null); }}
          autoComplete="off"
          spellCheck={false}
        />
      </div>

      <div className="form-field">
        <label className="form-label">Latency (ms)</label>
        <input
          className="form-input"
          type="number"
          min="1"
          max="9999"
          placeholder="e.g. 20"
          value={latency}
          onChange={e => { setLatency(e.target.value); setFb(null); }}
        />
      </div>

      {fb && (
        <div className={`form-fb form-fb--${fb.type}`}>{fb.msg}</div>
      )}

      <button
        type="submit"
        className="btn btn-accent btn--full"
        disabled={!from.trim() || !to.trim() || !latency}
      >
        + Add Edge
      </button>

      <p className="edge-form__note">
        Unknown node names are created automatically on the canvas.
      </p>
    </form>
  );
}
