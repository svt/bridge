import { format } from './date.js'

test('formats dates with the default pattern', () => {
  const date = new Date(2026, 6, 16, 9, 5, 3)

  expect(format(date)).toBe('2026-07-16 09:05:03')
})

test('formats dates with custom patterns and preserves non-token characters', () => {
  const date = new Date(2026, 0, 2, 13, 4, 59)

  expect(format(date, 'D/M/Y @ h:m')).toBe('02/01/2026 @ 13:04')
})