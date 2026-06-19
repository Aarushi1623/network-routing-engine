import { useNetwork } from '../context/NetworkContext';
import { pathCost }   from '../utils/astar';
import EventLog       from './EventLog';
import CustomEdgeForm from './CustomEdgeForm';

export default function ControlPanel() {
  const {
    mode, nodes, edges, terminated,
    source, destination, path, animating, rerouted, noPath,
    switchMode, startRouting, resetRoute, restoreNode,
  } = useNetwork();

  const cost     = pathCost(path, edges);
  const hasGraph = nodes.length > 0;

  function statusInfo() {
    if (noPath)       return { text: 'No path — all routes blocked', c: '#ef4444' };
    if (rerouted)     return { text: 'Path rerouted dynamically',    c: '#f59e0b' };
    if (animating)    return { text: 'Packet in transit…',           c: '#34d399' };
    if (path)         return { text: `Delivered — ${cost}ms total`,  c: '#a78bfa' };
    if (!hasGraph)    return { text: 'Add edges to begin',            c: '#334155' };
    if (!source)      return { text: 'Click a node → set source',    c: '#64748b' };
    if (!destination) return { text: 'Click a node → set destination',c: '#64748b' };
    return              { text: 'Ready — press Send Packet',          c: '#22d3ee' };
  }

  const { text: stTxt, c: stCol } = statusInfo();

  return (
    <aside className="sidebar">

      {/* ── Mode tabs ─────────────────────────────────────────────────── */}
      <div className="mode-tabs">
        {['demo', 'custom'].map(m => (
          <button
            key={m}
            className={`mode-tab ${mode === m ? 'mode-tab--on' : ''}`}
            onClick={() => { if (mode !== m) switchMode(m); }}
          >
            {m === 'demo' ? 'Demo Mode' : 'Custom Mode'}
          </button>
        ))}
      </div>

      {/* ── Scrollable panel body ──────────────────────────────────────── */}
      <div className="sidebar__body">

        {/* Status */}
        <div className="status-pill" style={{ borderColor: stCol }}>
          <span className="dot" style={{ background: stCol }} />
          <span style={{ color: stCol }}>{stTxt}</span>
        </div>

        {/* Route display */}
        <div className="route-card">
          <div className="route-row">
            <span className="route-lbl">Source</span>
            <span className="route-val" style={{ color: '#22d3ee' }}>{source ?? '—'}</span>
          </div>
          <div className="route-divider">↓</div>
          <div className="route-row">
            <span className="route-lbl">Destination</span>
            <span className="route-val" style={{ color: '#a78bfa' }}>{destination ?? '—'}</span>
          </div>
        </div>

        {/* Optimal path */}
        {path && (
          <div className="path-card">
            <div className="path-head">
              <span className="section-label">Optimal Path</span>
              <span className="path-cost">{cost}ms</span>
            </div>
            <div className="path-nodes">
              {path.map((id, i) => (
                <span key={id} className="path-hop">
                  {id}
                  {i < path.length - 1 && <span className="path-arr">→</span>}
                </span>
              ))}
            </div>
          </div>
        )}

        {/* Action buttons */}
        <div className="btn-row">
          <button
            className="btn btn-primary"
            disabled={!source || !destination || animating || !hasGraph}
            onClick={startRouting}
          >
            {animating ? 'In Transit…' : 'Send Packet'}
          </button>
          <button className="btn btn-ghost" onClick={resetRoute}>
            Reset
          </button>
        </div>

        {/* Custom edge form — only in Custom Mode */}
        {mode === 'custom' && <CustomEdgeForm />}

        {/* Terminated nodes */}
        {terminated.size > 0 && (
          <div className="terminated-card">
            <div className="section-label">Terminated</div>
            {[...terminated].map(id => (
              <div key={id} className="terminated-row">
                <span className="terminated-id">{id}</span>
                <button className="restore-btn" onClick={() => restoreNode(id)}>
                  Restore
                </button>
              </div>
            ))}
          </div>
        )}

        {/* Contextual hint */}
        <p className="hint">
          {mode === 'custom' && !hasGraph
            ? 'Type free-form node names in the form above — nodes appear on the canvas automatically.'
            : animating
              ? 'Click any live node to terminate it. The packet recalculates its route instantly.'
              : 'Click any node to set it as source or destination.'}
        </p>

        {/* Legend */}
        <div className="legend">
          {[
            ['#22d3ee', 'Source',      false],
            ['#a78bfa', 'Destination', false],
            ['#34d399', 'Active Path', false],
            ['#ef4444', 'Terminated',  false],
            ['#f59e0b', 'Packet',      true ],
          ].map(([col, lbl, circ]) => (
            <div key={lbl} className="legend-item">
              <span className="legend-dot"
                style={{ background: col, borderRadius: circ ? '50%' : 3 }} />
              <span>{lbl}</span>
            </div>
          ))}
        </div>

      </div>{/* end sidebar__body */}

      {/* ── Event log — hard-docked at bottom, OUTSIDE scroll ─────────── */}
      <EventLog />

    </aside>
  );
}
