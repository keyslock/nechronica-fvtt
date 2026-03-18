export function normalizeRollModes(rollModes) {
  return Object.fromEntries(
    Object.entries(rollModes).map(([k, v]) => [
      k,
      typeof v === "string" ? { label: v, icon: null } : v,
    ]),
  );
}
