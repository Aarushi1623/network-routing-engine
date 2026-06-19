# Dynamic Network Routing Engine

A real-time network packet routing visualizer built with React, implementing the **A\* pathfinding algorithm** with an admissible heuristic to guarantee optimal latency-based routing across dynamic network topologies.

![Demo](src/assets/hero.png)

---

## Overview

This project simulates how packets are routed across a network in real time. You can define custom network topologies, fire packets between nodes, and watch the engine dynamically recalculate the optimal path mid-transit when a node goes down — mimicking how real-world routing protocols handle failures.

---

## Features

- **A\* Pathfinding** — Finds the lowest-latency path between any two nodes. The heuristic is derived from the minimum latency-per-pixel ratio across all live edges, ensuring it is always admissible (never overestimates), so the algorithm is both fast and provably optimal.
- **Real-time Rerouting** — Click any node during packet transit to terminate it. The engine instantly recalculates a new path from the packet's current position and reroutes without interruption.
- **Demo Mode** — A preloaded 8-node topology to explore the algorithm out of the box.
- **Custom Mode** — Build any graph from scratch. Type free-form node names and latency values; nodes appear on the canvas automatically.
- **Graph Editing** — Right-click any node or edge in Custom Mode to delete it. Deleting a node also removes all its connected edges.
- **Animated Packet Traversal** — A packet travels along the computed path in real time, segment by segment.
- **Event Log** — Every routing decision, reroute, node termination, and delivery is recorded in a live event log.

---

## How the A\* Heuristic Works

Standard A\* requires a heuristic `h(n)` that estimates the cost from node `n` to the goal. For this to be admissible, `h(n)` must **never overestimate** the true cost.

This engine computes an admissible heuristic dynamically from the graph itself:

```
minRatio = min(edge.latency / pixel_length) across all live edges

h(n) = euclidean_pixel_distance(n, goal) × minRatio
```

Since `minRatio` represents the cheapest possible latency per pixel in the network, multiplying by the remaining pixel distance always gives a lower bound on the true remaining latency. This keeps A\* optimal regardless of how nodes are visually positioned.

---

## Tech Stack

| Layer | Technology |
|---|---|
| UI Framework | React 19 |
| Build Tool | Vite 8 |
| Rendering | SVG (no canvas library) |
| State Management | useReducer + Context API |
| Algorithm | A\* (Dijkstra variant with admissible heuristic) |
| Styling | Pure CSS (no UI library) |

---

## Getting Started

```bash
# Install dependencies
npm install

# Start development server
npm run dev

# Production build
npm run build
```

Open `http://localhost:5173` in your browser.

---

## Project Structure

```
src/
├── components/
│   ├── NetworkGraph.jsx     # SVG canvas, node/edge rendering, click & right-click handlers
│   ├── ControlPanel.jsx     # Sidebar: mode tabs, route display, action buttons
│   ├── CustomEdgeForm.jsx   # Form to add custom edges and nodes
│   └── EventLog.jsx         # Live event log docked at the bottom
├── context/
│   └── NetworkContext.jsx   # Global state via useReducer, animation loop, public API
├── utils/
│   ├── astar.js             # A* implementation + pathCost helper
│   └── layout.js            # Auto-positioning logic for custom nodes
└── data/
    └── network.js           # Demo mode topology (nodes + edges)
```

---

## Usage

### Demo Mode
The app loads a preloaded network. Click any node to set it as the **source** (cyan), click another to set the **destination** (purple), then hit **Send Packet**. During transit, click any intermediate node to terminate it and watch the packet reroute instantly.

### Custom Mode
1. Enter a source node name, target node name, and latency in the form.
2. Click **+ Add Edge** — new nodes are created automatically if they don't exist.
3. Build out your topology, then select source/destination and send a packet.
4. **Right-click** any node or edge to delete it.

---

## License

MIT
