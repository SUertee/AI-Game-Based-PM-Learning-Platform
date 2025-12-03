// --- utils inside the component file ---

const rand = (n) => Math.floor(Math.random() * n);

function sampleUniqueByRole(all, excludeIdsSet, count = 5) {
  // Remove selected/excluded
  const pool = all.filter(p => !excludeIdsSet.has(p.id));

  // Group by role
  const byRole = new Map();
  for (const p of pool) {
    if (!byRole.has(p.role)) byRole.set(p.role, []);
    byRole.get(p.role).push(p);
  }

  // Randomize role order
  const roles = [...byRole.keys()].sort(() => Math.random() - 0.5);

  const picked = [];
  const used = new Set();

  // 1) pick one per role (unique roles)
  for (const role of roles) {
    if (picked.length >= count) break;
    const arr = byRole.get(role);
    const choice = arr[rand(arr.length)];
    if (!used.has(choice.id)) {
      picked.push(choice);
      used.add(choice.id);
    }
  }

  // 2) if still short, fill with any remaining randoms
  if (picked.length < count) {
    const remainder = pool.filter(p => !used.has(p.id))
                          .sort(() => Math.random() - 0.5);
    picked.push(...remainder.slice(0, count - picked.length));
  }

  return picked.slice(0, count);
}
