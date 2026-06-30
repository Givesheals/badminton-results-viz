import { describe, expect, it } from 'vitest'
import { getPlayerInitials } from './getPlayerInitials'

describe('getPlayerInitials', () => {
  it('returns first and last initials for two-part names', () => {
    expect(getPlayerInitials('Simon Parker')).toBe('SP')
    expect(getPlayerInitials('simon parker')).toBe('SP')
  })

  it('returns first initial only for single names', () => {
    expect(getPlayerInitials('Alex')).toBe('A')
  })

  it('uses first and last token for multi-part names', () => {
    expect(getPlayerInitials('Mary Jane Watson')).toBe('MW')
  })

  it('handles empty and nullish input', () => {
    expect(getPlayerInitials('')).toBe('?')
    expect(getPlayerInitials(null)).toBe('?')
    expect(getPlayerInitials(undefined)).toBe('?')
    expect(getPlayerInitials('   ')).toBe('?')
  })
})
