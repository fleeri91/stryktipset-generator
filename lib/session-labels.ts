export const ROW_PRICE_KR = 1

export function productName(eventType: string): string {
  return eventType === 'europatipset' ? 'Europatipset' : 'Stryktipset'
}

/** ISO 8601 week number for a date. */
export function isoWeek(date: Date): number {
  const d = new Date(
    Date.UTC(date.getFullYear(), date.getMonth(), date.getDate())
  )
  const day = d.getUTCDay() || 7
  d.setUTCDate(d.getUTCDate() + 4 - day)
  const yearStart = new Date(Date.UTC(d.getUTCFullYear(), 0, 1))
  return Math.ceil(((d.getTime() - yearStart.getTime()) / 86400000 + 1) / 7)
}

export function weekLabel(closesAt: string | Date): string {
  return `v. ${isoWeek(new Date(closesAt))}`
}

/** "Stryktipset v. 38" */
export function drawLabel(eventType: string, closesAt: string | Date): string {
  return `${productName(eventType)} ${weekLabel(closesAt)}`
}

/** "STRYKTIPSET · V. 38 · 2026" */
export function drawLabelUpper(
  eventType: string,
  closesAt: string | Date
): string {
  const year = new Date(closesAt).getFullYear()
  return `${productName(eventType)} · ${weekLabel(closesAt)} · ${year}`.toUpperCase()
}

export function rowsFor(halvgarderingar: number, helgarderingar: number) {
  return Math.pow(2, halvgarderingar) * Math.pow(3, helgarderingar)
}

export function formatNumber(n: number): string {
  return n.toLocaleString('sv-SE')
}

export function formatKr(n: number): string {
  return `${formatNumber(n)} kr`
}

/** "lör 20 sep 15:59" */
export function formatCloseTime(iso: string | Date): string {
  return new Date(iso)
    .toLocaleString('sv-SE', {
      weekday: 'short',
      day: 'numeric',
      month: 'short',
      hour: '2-digit',
      minute: '2-digit',
    })
    .replace(/\.\s*/g, ' ')
    .replace(/\s+/g, ' ')
    .trim()
}

/** "3 halv · 1 hel" */
export function systemLine(halvgarderingar: number, helgarderingar: number) {
  return `${halvgarderingar} halv · ${helgarderingar} hel`
}
