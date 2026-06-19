// Golden-angle spiral: deterministic, non-overlapping initial placement.
// Each new node lands at a unique angle + increasing radius around (400, 280).
const GOLDEN_ANGLE = 2.39996323; // ≈ 137.5° in radians

export function autoPosition(existingNodes) {
  const n = existingNodes.length;
  if (n === 0) return { x: 400, y: 280 };

  const radius = 85 + 62 * Math.sqrt(n);
  let   angle  = n * GOLDEN_ANGLE;

  let x = Math.round(400 + radius * Math.cos(angle));
  let y = Math.round(280 + radius * Math.sin(angle));

  // Nudge if two nodes land too close (rare with golden angle, but safe)
  for (let attempt = 1; attempt <= 8; attempt++) {
    const tooClose = existingNodes.some(
      nd => Math.hypot(nd.x - x, nd.y - y) < 95
    );
    if (!tooClose) break;
    const r2 = radius + attempt * 40;
    const a2 = angle  + attempt * 0.9;
    x = Math.round(400 + r2 * Math.cos(a2));
    y = Math.round(280 + r2 * Math.sin(a2));
  }

  return { x, y };
}
