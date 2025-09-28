/* Compute a simple normalized severity score [0..100] */
export function computeSeverity({
  categoryId,
  ageHours,
  pathLenKm,
  population,
  infraCount,
}) {
  // 1) normalize features
  const norm = {
    cat: categoryWeight(categoryId),
    recency: clamp01(1 - ageHours / 72),
    track: clamp01(pathLenKm / 1000),
    pop: clamp01(Math.log10(Math.max(population, 1)) / 7),
    infra: clamp01(infraCount / 50),
  };

  // 2) weighted sum
  const w = { cat: 0.25, recency: 0.2, track: 0.15, pop: 0.25, infra: 0.15 };
  const score01 = w.cat*norm.cat + w.recency*norm.recency + w.track*norm.track + w.pop*norm.pop + w.infra*norm.infra;

  return Math.round(score01 * 100);
}

function clamp01(x){ return Math.max(0, Math.min(1, x)); }

function categoryWeight(catId){
  // Prioritize life-safety hazards by default
  const hi = new Set([10, 9, 16, 8, 14]);
  const mid = new Set([12, 18, 17]);
  if (hi.has(catId)) return 1.0;
  if (mid.has(catId)) return 0.6;
  return 0.4;
}