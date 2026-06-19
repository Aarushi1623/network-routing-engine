import { useMemo, useState, useCallback, useEffect, useRef } from 'react';
import { useNetwork } from '../context/NetworkContext';

const NODE_R = 26;

function packetPos(path, idx, t, nodeMap) {
  if (!path || path.length < 2) return null;
  const i = Math.min(idx, path.length - 2);
  const a = nodeMap[path[i]], b = nodeMap[path[i + 1]];
  if (!a || !b) return null;
  return { x: a.x + (b.x - a.x) * t, y: a.y + (b.y - a.y) * t };
}

function ekey(e) { return [e.from, e.to].sort().join('|'); }

export default function NetworkGraph() {
  const {
    mode, nodes, edges, terminated,
    source, destination, path,
    packetIndex, packetT, animating,
    setSource, setDestination,
    terminateNode, restoreNode,
    deleteNode, deleteEdge,
  } = useNetwork();

  const [ctxMenu, setCtxMenu] = useState(null); // { type, x, y, nodeId? | from?, to? }
  const svgRef = useRef(null);

  const nodeMap = useMemo(
    () => Object.fromEntries(nodes.map(n => [n.id, n])),
    [nodes]
  );

  const pathEdges = useMemo(() => {
    if (!path) return new Set();
    const s = new Set();
    for (let i = 0; i < path.length - 1; i++)
      s.add([path[i], path[i + 1]].sort().join('|'));
    return s;
  }, [path]);

  const pkt = packetPos(path, packetIndex, packetT, nodeMap);

  const PAD = 76;
  const xs  = nodes.length ? nodes.map(n => n.x) : [400];
  const ys  = nodes.length ? nodes.map(n => n.y) : [280];
  const vx  = Math.min(...xs) - PAD;
  const vy  = Math.min(...ys) - PAD;
  const vw  = Math.max(...xs) + PAD - vx;
  const vh  = Math.max(...ys) + PAD - vy;

  const closeCtx = useCallback(() => setCtxMenu(null), []);

  useEffect(() => {
    if (!ctxMenu) return;
    const handler = () => closeCtx();
    window.addEventListener('click', handler);
    window.addEventListener('keydown', (e) => e.key === 'Escape' && closeCtx());
    return () => {
      window.removeEventListener('click', handler);
    };
  }, [ctxMenu, closeCtx]);

  function onNodeClick(node) {
    if (animating) {
      terminated.has(node.id) ? restoreNode(node.id) : terminateNode(node.id);
      return;
    }
    if (node.id === source)      { setSource(null);      return; }
    if (node.id === destination) { setDestination(null); return; }
    if (!source)                 { setSource(node.id);   return; }
    if (!destination)            { setDestination(node.id); return; }
    setSource(node.id);
  }

  function onNodeRightClick(e, node) {
    e.preventDefault();
    if (mode !== 'custom' || animating) return;
    setCtxMenu({ type: 'node', nodeId: node.id, x: e.clientX, y: e.clientY });
  }

  function onEdgeRightClick(e, edge) {
    e.preventDefault();
    if (mode !== 'custom' || animating) return;
    setCtxMenu({ type: 'edge', from: edge.from, to: edge.to, x: e.clientX, y: e.clientY });
  }

  if (nodes.length === 0) {
    return (
      <div className="graph-empty">
        <div className="graph-empty__hex">⬡</div>
        <div className="graph-empty__title">Blank Canvas</div>
        <div className="graph-empty__hint">
          Use the <strong>Add Custom Edge</strong> form on the left.<br />
          Nodes are created automatically when you name them.
        </div>
      </div>
    );
  }

  function fill(node) {
    if (terminated.has(node.id)) return '#1a1a2e';
    if (node.id === source)      return '#0e4d6e';
    if (node.id === destination) return '#3b2e6e';
    if (path?.includes(node.id)) return '#0e4d3a';
    return '#1e293b';
  }

  function stroke(node) {
    if (terminated.has(node.id)) return '#ef4444';
    if (node.id === source)      return '#22d3ee';
    if (node.id === destination) return '#a78bfa';
    if (path?.includes(node.id)) return '#34d399';
    return '#334155';
  }

  return (
    <div style={{ position: 'absolute', inset: 0 }}>
      <svg
        ref={svgRef}
        viewBox={`${vx} ${vy} ${vw} ${vh}`}
        className="graph-svg"
        preserveAspectRatio="xMidYMid meet"
      >
        <defs>
          <filter id="g1" x="-40%" y="-40%" width="180%" height="180%">
            <feGaussianBlur stdDeviation="3" result="b" />
            <feMerge><feMergeNode in="b" /><feMergeNode in="SourceGraphic" /></feMerge>
          </filter>
          <filter id="g2" x="-60%" y="-60%" width="220%" height="220%">
            <feGaussianBlur stdDeviation="7" result="b" />
            <feMerge><feMergeNode in="b" /><feMergeNode in="SourceGraphic" /></feMerge>
          </filter>
          <radialGradient id="pg" cx="40%" cy="35%" r="60%">
            <stop offset="0%"   stopColor="#fde68a" />
            <stop offset="100%" stopColor="#f59e0b" />
          </radialGradient>
        </defs>

        {/* ── Edges ─────────────────────────────────────────────────────── */}
        {edges.map(e => {
          const a = nodeMap[e.from], b = nodeMap[e.to];
          if (!a || !b) return null;
          const key  = ekey(e);
          const hot  = pathEdges.has(key);
          const dead = terminated.has(e.from) || terminated.has(e.to);
          const mx   = (a.x + b.x) / 2, my = (a.y + b.y) / 2;

          return (
            <g key={key} onContextMenu={(ev) => onEdgeRightClick(ev, e)}>
              {/* Wide invisible hit area for easier right-click */}
              <line
                x1={a.x} y1={a.y} x2={b.x} y2={b.y}
                stroke="transparent" strokeWidth={18}
                style={{ cursor: mode === 'custom' && !animating ? 'context-menu' : 'default' }}
              />
              <line
                x1={a.x} y1={a.y} x2={b.x} y2={b.y}
                stroke={dead ? '#2d3748' : hot ? '#34d399' : '#2a3f5a'}
                strokeWidth={hot ? 2.5 : 1.5}
                strokeDasharray={dead ? '6 4' : undefined}
                filter={hot ? 'url(#g1)' : undefined}
                opacity={dead ? 0.35 : 1}
              />
              <rect x={mx - 15} y={my - 9} width={30} height={16} rx={4}
                fill="#080e1c"
                stroke={hot ? '#34d399' : '#1e2d40'}
                strokeWidth={1}
                opacity={dead ? 0.3 : 0.92}
              />
              <text x={mx} y={my + 4} textAnchor="middle"
                fontSize={10} fontFamily="monospace"
                fill={dead ? '#334155' : hot ? '#34d399' : '#4d6a8a'}
              >
                {e.latency}ms
              </text>
            </g>
          );
        })}

        {/* ── Nodes ─────────────────────────────────────────────────────── */}
        {nodes.map(node => {
          const dead   = terminated.has(node.id);
          const onPath = path?.includes(node.id);
          const f = fill(node), s = stroke(node);

          return (
            <g
              key={node.id}
              onClick={() => onNodeClick(node)}
              onContextMenu={(e) => onNodeRightClick(e, node)}
              style={{ cursor: mode === 'custom' && !animating ? 'context-menu' : 'pointer' }}
            >
              {(node.id === source || node.id === destination || onPath) && !dead && (
                <circle cx={node.x} cy={node.y} r={NODE_R + 8}
                  fill="none" stroke={s} strokeWidth={1} opacity={0.28} />
              )}
              <circle
                cx={node.x} cy={node.y} r={NODE_R}
                fill={f} stroke={s} strokeWidth={2.5}
                filter={onPath && !dead ? 'url(#g1)' : undefined}
              />
              {dead && (
                <>
                  <line x1={node.x-11} y1={node.y-11} x2={node.x+11} y2={node.y+11}
                    stroke="#fca5a5" strokeWidth={2.5} strokeLinecap="round" />
                  <line x1={node.x+11} y1={node.y-11} x2={node.x-11} y2={node.y+11}
                    stroke="#fca5a5" strokeWidth={2.5} strokeLinecap="round" />
                </>
              )}
              <text
                x={node.x} y={node.y + 4}
                textAnchor="middle"
                fontSize={node.label.length > 7 ? 8 : 10}
                fontFamily="monospace" fontWeight="600"
                fill={dead ? '#4b5563' : '#dde6f0'}
                pointerEvents="none"
              >
                {node.label}
              </text>
            </g>
          );
        })}

        {/* ── Animated packet ───────────────────────────────────────────── */}
        {pkt && (
          <g filter="url(#g2)">
            <circle cx={pkt.x} cy={pkt.y} r={12} fill="url(#pg)" />
            <circle cx={pkt.x} cy={pkt.y} r={12}
              fill="none" stroke="#fbbf24" strokeWidth={1.5} />
            <text x={pkt.x} y={pkt.y + 4} textAnchor="middle"
              fontSize={8} fontFamily="monospace" fontWeight="bold"
              fill="#1c1917" pointerEvents="none">
              PKT
            </text>
          </g>
        )}
      </svg>

      {/* ── Context menu ────────────────────────────────────────────────── */}
      {ctxMenu && (
        <div
          onClick={(e) => e.stopPropagation()}
          style={{
            position: 'fixed',
            top: ctxMenu.y,
            left: ctxMenu.x,
            background: '#0f172a',
            border: '1px solid #334155',
            borderRadius: 6,
            padding: '4px 0',
            zIndex: 9999,
            minWidth: 160,
            boxShadow: '0 4px 20px rgba(0,0,0,0.6)',
          }}
        >
          <div style={{
            padding: '4px 12px 6px',
            fontSize: 10,
            color: '#64748b',
            fontFamily: 'monospace',
            borderBottom: '1px solid #1e293b',
            marginBottom: 2,
          }}>
            {ctxMenu.type === 'node'
              ? `NODE: ${ctxMenu.nodeId}`
              : `EDGE: ${ctxMenu.from} ↔ ${ctxMenu.to}`}
          </div>
          <button
            onClick={() => {
              if (ctxMenu.type === 'node') deleteNode(ctxMenu.nodeId);
              else deleteEdge(ctxMenu.from, ctxMenu.to);
              closeCtx();
            }}
            style={{
              display: 'block', width: '100%', textAlign: 'left',
              padding: '6px 12px', background: 'none', border: 'none',
              color: '#f87171', fontFamily: 'monospace', fontSize: 12,
              cursor: 'pointer',
            }}
            onMouseEnter={(e) => e.currentTarget.style.background = '#1e293b'}
            onMouseLeave={(e) => e.currentTarget.style.background = 'none'}
          >
            {ctxMenu.type === 'node' ? 'Delete Node' : 'Delete Edge'}
          </button>
        </div>
      )}
    </div>
  );
}
