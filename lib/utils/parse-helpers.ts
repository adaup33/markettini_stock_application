export function parseOperator(op: unknown): '>' | '<' | '>=' | '<=' | '==' | null {
  const allowed = new Set(['>', '<', '>=', '<=', '==']);
  if (typeof op === 'string' && allowed.has(op)) return op as any;
  return null;
}

export function parseNumber(v: unknown): number | null {
  if (v == null) return null;
  if (typeof v === 'number') return isFinite(v) ? v : null;
  if (typeof v === 'string') {
    const n = Number(v.trim());
    return isFinite(n) ? n : null;
  }
  return null;
}
