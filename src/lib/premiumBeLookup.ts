/** Prototype-only: mock BE database email lookup and validation. */

import { findBePlayerByNumber } from '../data/bePlayerDirectory'

const BE_NUMBER_PATTERN = /^\d{5,8}$/

export function isValidBeNumber(value: string): boolean {
  return BE_NUMBER_PATTERN.test(value.trim())
}

/** Masked email from directory, or a safe generated fallback. */
export function getMaskedBeEmail(beNumber: string): string {
  const record = findBePlayerByNumber(beNumber)
  if (record) return record.maskedEmail

  const domains = ['gmail.com', 'outlook.com', 'yahoo.co.uk', 'icloud.com']
  const safePrefixes = ['sim', 'mar', 'joh', 'ale', 'kat', 'luk', 'emm', 'rya', 'jan', 'dav']
  const trimmed = beNumber.trim()
  const domain = domains[Number(trimmed.slice(-1)) % domains.length]!
  const prefix = safePrefixes[Number(trimmed.slice(-2)) % safePrefixes.length]!
  return `${prefix}***@${domain}`
}
