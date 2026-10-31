import { describe, expect, it } from 'vitest'
import { decodeRecords } from './nfc'

const view = (text: string) => new DataView(new TextEncoder().encode(text).buffer)

describe('decodeRecords', () => {
  it('decodes text and url records', () => {
    const readings = decodeRecords([
      { recordType: 'text', data: view('Hyrule ruft') },
      { recordType: 'url', data: view('https://example.org/x') }
    ])
    expect(readings).toEqual([
      { recordType: 'text', text: 'Hyrule ruft' },
      { recordType: 'url', text: 'https://example.org/x' }
    ])
  })
  it('keeps umlauts intact', () => {
    expect(
      decodeRecords([{ recordType: 'text', data: view('Schloß Favorite, Quelle der Träume') }])[0]
        .text
    ).toBe('Schloß Favorite, Quelle der Träume')
  })
  it('honours a declared encoding', () => {
    const utf16 = new DataView(new Uint16Array([...'Hallo'].map((c) => c.charCodeAt(0))).buffer)
    expect(decodeRecords([{ recordType: 'text', data: utf16, encoding: 'utf-16le' }])[0].text).toBe(
      'Hallo'
    )
  })
  it('skips records without payload', () => {
    expect(decodeRecords([{ recordType: 'empty' }])).toEqual([])
  })
})
