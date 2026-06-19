export const INITIAL_NODES = [
  { id: 'Edge-A', label: 'Edge-A', x: 120, y: 80,  type: 'edge'   },
  { id: 'Core-B', label: 'Core-B', x: 340, y: 60,  type: 'core'   },
  { id: 'Core-C', label: 'Core-C', x: 560, y: 80,  type: 'core'   },
  { id: 'Hub-D',  label: 'Hub-D',  x: 230, y: 220, type: 'hub'    },
  { id: 'Hub-E',  label: 'Hub-E',  x: 460, y: 240, type: 'hub'    },
  { id: 'Edge-F', label: 'Edge-F', x: 100, y: 360, type: 'edge'   },
  { id: 'Core-G', label: 'Core-G', x: 350, y: 380, type: 'core'   },
  { id: 'Edge-H', label: 'Edge-H', x: 600, y: 360, type: 'edge'   },
];

export const INITIAL_EDGES = [
  { from: 'Edge-A', to: 'Core-B', latency: 12 },
  { from: 'Edge-A', to: 'Hub-D',  latency: 18 },
  { from: 'Core-B', to: 'Core-C', latency: 8  },
  { from: 'Core-B', to: 'Hub-D',  latency: 15 },
  { from: 'Core-B', to: 'Hub-E',  latency: 22 },
  { from: 'Core-C', to: 'Hub-E',  latency: 10 },
  { from: 'Core-C', to: 'Edge-H', latency: 20 },
  { from: 'Hub-D',  to: 'Hub-E',  latency: 14 },
  { from: 'Hub-D',  to: 'Edge-F', latency: 16 },
  { from: 'Hub-D',  to: 'Core-G', latency: 25 },
  { from: 'Hub-E',  to: 'Core-G', latency: 18 },
  { from: 'Hub-E',  to: 'Edge-H', latency: 12 },
  { from: 'Edge-F', to: 'Core-G', latency: 11 },
  { from: 'Core-G', to: 'Edge-H', latency: 19 },
];
