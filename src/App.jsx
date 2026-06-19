import { NetworkProvider } from './context/NetworkContext';
import ControlPanel        from './components/ControlPanel';
import NetworkGraph        from './components/NetworkGraph';
import './App.css';

export default function App() {
  return (
    <NetworkProvider>
      <div className="app-shell">

        <header className="app-header">
          <div className="hd-left">
            <span className="hd-glyph">◈</span>
            <span className="hd-title">Dynamic Network Routing Engine</span>
          </div>
          <span className="hd-tag">A* Algorithm · Real-time Rerouting</span>
        </header>

        {/*
          Two-column body:
            col 1 → .sidebar  (fixed 288px, flex column, no overflow)
            col 2 → .graph-canvas (flex:1, position:relative → SVG absolutely fills it)
        */}
        <div className="app-body">
          <ControlPanel />
          <main className="graph-canvas">
            <NetworkGraph />
          </main>
        </div>

      </div>
    </NetworkProvider>
  );
}
