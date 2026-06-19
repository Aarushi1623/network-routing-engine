import {
  createContext, useContext, useReducer,
  useCallback, useRef, useEffect,
} from 'react';
import { INITIAL_NODES, INITIAL_EDGES } from '../data/network';
import { astar } from '../utils/astar';
import { autoPosition } from '../utils/layout';

// ─── State shape ────────────────────────────────────────────────────────────
const BLANK_ROUTING = {
  source:      null,
  destination: null,
  path:        null,
  packetIndex: 0,
  packetT:     0,
  animating:   false,
  rerouted:    false,
  noPath:      false,
};

const initialState = {
  mode:       'demo',          // 'demo' | 'custom'
  nodes:      INITIAL_NODES,
  edges:      INITIAL_EDGES,
  terminated: new Set(),
  ...BLANK_ROUTING,
  log: [],
};

// ─── Reducer ─────────────────────────────────────────────────────────────────
function reducer(state, action) {
  switch (action.type) {

    // Switch between demo (preloaded) and custom (blank) modes
    case 'SWITCH_MODE': {
      const demo = action.mode === 'demo';
      return {
        ...initialState,
        mode:       action.mode,
        nodes:      demo ? INITIAL_NODES : [],
        edges:      demo ? INITIAL_EDGES : [],
        terminated: new Set(),
        log:        [],
      };
    }

    case 'SET_SOURCE':
      return { ...state, ...BLANK_ROUTING, source: action.id };

    case 'SET_DESTINATION':
      return { ...state, destination: action.id, path: null,
               packetIndex: 0, packetT: 0, rerouted: false, noPath: false };

    case 'START_ANIMATION':
      return {
        ...state, path: action.path, packetIndex: 0, packetT: 0,
        animating: true, rerouted: false, noPath: false,
        log: [...state.log, { type: 'start', msg: `Routing: ${action.path.join(' → ')}` }],
      };

    case 'TICK':
      return { ...state, packetIndex: action.idx, packetT: action.t };

    case 'TERMINATE_NODE': {
      const terminated = new Set(state.terminated);
      terminated.add(action.id);
      return { ...state, terminated,
               log: [...state.log, { type: 'terminate', msg: `${action.id} terminated` }] };
    }

    case 'RESTORE_NODE': {
      const terminated = new Set(state.terminated);
      terminated.delete(action.id);
      return { ...state, terminated,
               log: [...state.log, { type: 'restore', msg: `${action.id} restored` }] };
    }

    case 'REROUTE':
      return {
        ...state,
        path: action.path, packetIndex: action.packetIndex, packetT: 0,
        rerouted: true, noPath: false,
        log: [...state.log, { type: 'reroute', msg: `Rerouted: ${action.path.join(' → ')}` }],
      };

    case 'NO_PATH':
      return {
        ...state, animating: false, noPath: true,
        log: [...state.log, { type: 'error', msg: 'No valid path — all routes blocked' }],
      };

    case 'PACKET_ARRIVED':
      return {
        ...state, animating: false, packetT: 1,
        log: [...state.log, { type: 'arrive', msg: `Delivered to ${state.destination}` }],
      };

    case 'RESET_ROUTE':
      return { ...state, ...BLANK_ROUTING };

    // Adds an edge, auto-creating either/both nodes if they don't exist yet
    case 'ADD_CUSTOM_EDGE': {
      const { fromName, toName, latency } = action;
      let nodes = [...state.nodes];
      const log = [...state.log];

      if (!nodes.find(n => n.id === fromName)) {
        const pos = autoPosition(nodes);
        nodes.push({ id: fromName, label: fromName, ...pos, type: 'custom' });
        log.push({ type: 'node', msg: `Node "${fromName}" created` });
      }
      // Pass updated nodes so the second node positions itself away from the first
      if (!nodes.find(n => n.id === toName)) {
        const pos = autoPosition(nodes);
        nodes.push({ id: toName, label: toName, ...pos, type: 'custom' });
        log.push({ type: 'node', msg: `Node "${toName}" created` });
      }

      const dup = state.edges.some(e =>
        (e.from === fromName && e.to === toName) ||
        (e.from === toName   && e.to === fromName)
      );
      const edges = dup
        ? state.edges
        : [...state.edges, { from: fromName, to: toName, latency }];

      if (!dup) log.push({ type: 'edge', msg: `${fromName} ↔ ${toName} (${latency}ms)` });

      return { ...state, nodes, edges, log };
    }

    case 'DELETE_NODE': {
      const nodes = state.nodes.filter(n => n.id !== action.id);
      const edges = state.edges.filter(e => e.from !== action.id && e.to !== action.id);
      const terminated = new Set(state.terminated);
      terminated.delete(action.id);
      return {
        ...state, ...BLANK_ROUTING, nodes, edges, terminated,
        log: [...state.log, { type: 'node', msg: `Node "${action.id}" deleted` }],
      };
    }

    case 'DELETE_EDGE': {
      const edges = state.edges.filter(e =>
        !((e.from === action.from && e.to === action.to) ||
          (e.from === action.to   && e.to === action.from))
      );
      return {
        ...state, ...BLANK_ROUTING, edges,
        log: [...state.log, { type: 'edge', msg: `Edge ${action.from}↔${action.to} deleted` }],
      };
    }

    case 'CLEAR_LOG':
      return { ...state, log: [] };

    default:
      return state;
  }
}

// ─── Provider ────────────────────────────────────────────────────────────────
const NetworkContext = createContext(null);

const TICK_MS       = 16;   // ~60 fps
const SEGMENT_TICKS = 55;   // frames per edge segment

export function NetworkProvider({ children }) {
  const [state, dispatch] = useReducer(reducer, initialState);
  const ref = useRef(state);
  // eslint-disable-next-line react-hooks/refs
  ref.current = state;

  // Animation loop
  const tick = useCallback(() => {
    const s = ref.current;
    if (!s.animating || !s.path) return;

    let t   = s.packetT   + 1 / SEGMENT_TICKS;
    let idx = s.packetIndex;

    if (t >= 1) {
      idx += 1;
      t    = 0;
      if (idx >= s.path.length - 1) { dispatch({ type: 'PACKET_ARRIVED' }); return; }
    }

    dispatch({ type: 'TICK', idx, t });
  }, []);

  useEffect(() => {
    if (!state.animating) return;
    const id = setInterval(tick, TICK_MS);
    return () => clearInterval(id);
  }, [state.animating, tick]);

  // ── Public API ────────────────────────────────────────────────────────────
  const switchMode = useCallback(
    (mode) => dispatch({ type: 'SWITCH_MODE', mode }),
    []
  );

  const setSource = useCallback((id) => {
    if (!ref.current.animating) dispatch({ type: 'SET_SOURCE', id });
  }, []);

  const setDestination = useCallback((id) => {
    if (!ref.current.animating) dispatch({ type: 'SET_DESTINATION', id });
  }, []);

  const startRouting = useCallback(() => {
    const { source, destination, nodes, edges, terminated } = ref.current;
    if (!source || !destination || source === destination) return;
    const path = astar(nodes, edges, source, destination, terminated);
    if (!path) { dispatch({ type: 'NO_PATH' }); return; }
    dispatch({ type: 'START_ANIMATION', path });
  }, []);

  const terminateNode = useCallback((id) => {
    const s = ref.current;
    if (s.terminated.has(id)) return;
    dispatch({ type: 'TERMINATE_NODE', id });

    if (s.animating && s.path) {
      const blocked = new Set(s.terminated);
      blocked.add(id);
      const cur     = s.path[s.packetIndex];
      const dst     = s.path[s.path.length - 1];
      const newPath = astar(s.nodes, s.edges, cur, dst, blocked);
      if (!newPath)
        dispatch({ type: 'NO_PATH' });
      else if (newPath.join() !== s.path.slice(s.packetIndex).join())
        dispatch({ type: 'REROUTE', path: newPath, packetIndex: 0 });
    }
  }, []);

  const restoreNode   = useCallback((id)  => dispatch({ type: 'RESTORE_NODE', id }),   []);
  const resetRoute    = useCallback(()     => dispatch({ type: 'RESET_ROUTE' }),         []);
  const addCustomEdge = useCallback((d)    => dispatch({ type: 'ADD_CUSTOM_EDGE', ...d }),[]);
  const deleteNode    = useCallback((id)  => dispatch({ type: 'DELETE_NODE', id }),     []);
  const deleteEdge    = useCallback((from, to) => dispatch({ type: 'DELETE_EDGE', from, to }), []);
  const clearLog      = useCallback(()     => dispatch({ type: 'CLEAR_LOG' }),           []);

  return (
    <NetworkContext.Provider value={{
      ...state,
      switchMode, setSource, setDestination, startRouting,
      terminateNode, restoreNode, resetRoute, addCustomEdge,
      deleteNode, deleteEdge, clearLog,
    }}>
      {children}
    </NetworkContext.Provider>
  );
}

// eslint-disable-next-line react-refresh/only-export-components
export const useNetwork = () => {
  const ctx = useContext(NetworkContext);
  if (!ctx) throw new Error('useNetwork must be used within NetworkProvider');
  return ctx;
};
