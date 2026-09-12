// Decimal text-input helpers. iOS decimal-pad shows ',' as the separator on
// Romanian (and most EU) keyboards, so both ',' and '.' must be accepted.

/** Keeps digits and a single decimal separator, normalised to '.'. */
export function sanitizeDecimal(t: string): string {
  const s = t.replace(/,/g, '.').replace(/[^0-9.]/g, '')
  const i = s.indexOf('.')
  return i === -1 ? s : s.slice(0, i + 1) + s.slice(i + 1).replace(/\./g, '')
}

/** parseFloat that also understands a ',' separator. */
export function parseDecimal(s: string): number {
  return parseFloat(s.replace(/,/g, '.'))
}
