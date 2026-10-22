export interface NfcRecordLike {
  recordType: string
  data?: DataView
  encoding?: string
}

export interface NfcReading {
  recordType: string
  text: string
}

/** Decodes the records of an NDEF message into readable text, skipping records without payload. */
export function decodeRecords(records: ReadonlyArray<NfcRecordLike>): NfcReading[] {
  return records.flatMap((record) => {
    if (!record.data) return []
    const text = new TextDecoder(record.encoding ?? 'utf-8').decode(record.data)
    return [{ recordType: record.recordType, text }]
  })
}
