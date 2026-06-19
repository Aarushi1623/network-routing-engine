import { useNetwork } from '../context/NetworkContext';

const ICONS = {
  start:     { i: '▶', c: '#34d399' },
  arrive:    { i: '✓', c: '#a78bfa' },
  terminate: { i: '✕', c: '#ef4444' },
  restore:   { i: '↺', c: '#22d3ee' },
  reroute:   { i: '⇝', c: '#f59e0b' },
  error:     { i: '!', c: '#f97316' },
  node:      { i: '◉', c: '#6ee7b7' },
  edge:      { i: '—', c: '#7dd3fc' },
};

export default function EventLog() {
  const { log, clearLog } = useNetwork();
  if (!log.length) return null;

  return (
    <div className="event-log">
      <div className="log-bar">
        <span className="log-label">Event Log</span>
        <button className="log-clear" onClick={clearLog}>Clear</button>
      </div>
      <div className="log-entries">
        {[...log].reverse().map((entry, i) => {
          const { i: icon, c: color } = ICONS[entry.type] ?? { i: '·', c: '#64748b' };
          return (
            <div key={i} className="log-row">
              <span style={{ color, flexShrink: 0 }}>{icon}</span>
              <span className="log-text" style={{ color }}>{entry.msg}</span>
            </div>
          );
        })}
      </div>
    </div>
  );
}
