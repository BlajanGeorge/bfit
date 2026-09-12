import { parseDecimal, sanitizeDecimal } from '../src/domain/number'

describe('sanitizeDecimal', () => {
  it('accepts a comma as the decimal separator', () => {
    expect(sanitizeDecimal('82,5')).toBe('82.5')
  })
  it('keeps only one separator', () => {
    expect(sanitizeDecimal('1.2.3')).toBe('1.23')
    expect(sanitizeDecimal('1,2,3')).toBe('1.23')
  })
  it('strips everything else', () => {
    expect(sanitizeDecimal('12a-b5')).toBe('125')
  })
})

describe('parseDecimal', () => {
  it('parses both separators', () => {
    expect(parseDecimal('82,5')).toBe(82.5)
    expect(parseDecimal('82.5')).toBe(82.5)
  })
})
