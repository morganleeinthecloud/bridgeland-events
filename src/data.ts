import type { CalEvent, Category, Dataset, Filters, Neighborhood, SourceRef } from './types'

export const AREA_LABEL: Record<Neighborhood, string> = {
  bridgeland: 'Bridgeland',
  riverside: 'Bridgeland/Riverside',
  renfrew: 'Renfrew',
  both: 'Both neighbourhoods',
}

export const AREA_COLOR: Record<Neighborhood, string> = {
  bridgeland: '#4ade80',
  riverside: '#60a5fa',
  renfrew: '#f59e0b',
  both: '#c084fc',
}

export const CATEGORY_LABEL: Record<Category, string> = {
  market: 'Markets',
  social: 'Pub & social',
  family: 'Family',
  civic: 'Civic',
  class: 'Classes',
  outdoors: 'Outdoors',
  fundraiser: 'Fundraisers',
  'food-drink': 'Food & drink',
}

export const SOURCE_LABEL: Record<SourceRef['kind'], string> = {
  'facebook-group': 'Facebook group',
  'facebook-page': 'Facebook page',
  'community-site': 'Community site',
  calendar: 'Google Calendar',
  other: 'Other',
}

export async function loadDataset(): Promise<Dataset> {
  const res = await fetch('./data/events.json', { cache: 'no-store' })
  if (!res.ok) throw new Error(`could not load event data (${res.status})`)
  return (await res.json()) as Dataset
}

const DAY = 86_400_000

export function startOfToday(): Date {
  const d = new Date()
  d.setHours(0, 0, 0, 0)
  return d
}

export function isNew(e: CalEvent): boolean {
  return Date.parse(e.firstSeen) >= startOfToday().getTime() - 1 * DAY
}

export function isOngoing(e: CalEvent): boolean {
  const end = e.end ? Date.parse(e.end) : Date.parse(e.start) + 3 * 3600_000
  return end >= Date.now()
}

export function applyFilters(events: CalEvent[], f: Filters): CalEvent[] {
  const q = f.query.trim().toLowerCase()
  const from = startOfToday().getTime() - 1 * DAY
  const horizon = f.days ? Date.now() + f.days * DAY : null

  return events
    .filter(isOngoing)
    .filter((e) => e.status !== 'cancelled')
    .filter((e) => f.areas.has(e.neighborhood))
    .filter((e) => f.categories.has(e.category))
    .filter((e) => f.sources.has(e.source.kind))
    .filter((e) => (f.newOnly ? isNew(e) : true))
    .filter((e) => (f.recurringOnly ? Boolean(e.recurrence) : true))
    .filter((e) => (f.freeOnly ? (e.cost ?? '').toLowerCase().startsWith('free') : true))
    .filter((e) => Date.parse(e.start) >= from)
    .filter((e) => (horizon ? Date.parse(e.start) <= horizon : true))
    .filter((e) => (q ? matches(e, q) : true))
    .sort((a, b) => Date.parse(a.start) - Date.parse(b.start))
}

function matches(e: CalEvent, q: string): boolean {
  return [e.title, e.description, e.venue?.name, e.venue?.address, e.source.name].some((v) =>
    (v ?? '').toLowerCase().includes(q),
  )
}

export const MT_ZONE = 'America/Edmonton'

const mtTimeFmt = new Intl.DateTimeFormat('en-US', { hour: 'numeric', minute: '2-digit', timeZone: MT_ZONE })
const mtDayFmt = new Intl.DateTimeFormat('en-US', { month: 'short', day: 'numeric', timeZone: MT_ZONE })
const mtZoneFmt = new Intl.DateTimeFormat('en-US', { timeZone: MT_ZONE, timeZoneName: 'short' })

/** Mountain Time abbreviation for that instant: MST in winter, MDT while daylight time is in effect. */
export function mtZoneAbbr(at: Date): string {
  return mtZoneFmt.formatToParts(at).find((p) => p.type === 'timeZoneName')?.value ?? 'MT'
}

/** "12:16 PM MDT" today, "Sep 17, 8:04 AM MST" if it was another Mountain-Time day. */
export function fmtUpdated(iso: string, now: Date = new Date()): string {
  const d = new Date(iso)
  const stamp = `${mtTimeFmt.format(d)} ${mtZoneAbbr(d)}`
  return mtDayFmt.format(d) === mtDayFmt.format(now) ? stamp : `${mtDayFmt.format(d)}, ${stamp}`
}

/** Coarse age of the last scan, e.g. "8 min ago". */
export function relAge(iso: string, now = Date.now()): string {
  const mins = Math.max(0, Math.round((now - Date.parse(iso)) / 60_000))
  if (mins < 2) return 'just now'
  if (mins < 60) return `${mins} min ago`
  const hours = Math.round(mins / 60)
  if (hours < 36) return `${hours} h ago`
  return `${Math.round(hours / 24)} days ago`
}

/** The scanner runs daily at 08:00 MT — anything past ~30 h means a run was missed. */
export function isStale(iso: string, now = Date.now()): boolean {
  return now - Date.parse(iso) > 30 * 3_600_000
}

const timeFmt = new Intl.DateTimeFormat('en-US', { hour: 'numeric', minute: '2-digit' })

/** 15:30 -> "3:30pm", 15:00 -> "3pm" */
export function fmtTime(iso: string): string {
  return timeFmt
    .format(new Date(iso))
    .replace(/\s?([AP])\.?M\.?/i, (_m, p: string) => p.toLowerCase() + 'm')
    .replace(':00', '')
    .replace(' ', '')
}

export function fmtDay(iso: string): string {
  return new Intl.DateTimeFormat('en-CA', { weekday: 'short', month: 'short', day: 'numeric' }).format(new Date(iso))
}

export function fmtRange(e: CalEvent): string {
  if (e.allDay) return `${fmtDay(e.start)} · all day`
  const sameDay = e.end ? new Date(e.start).toDateString() === new Date(e.end).toDateString() : true
  if (!e.end || sameDay) return `${fmtDay(e.start)} · ${fmtTime(e.start)}${e.end ? '–' + fmtTime(e.end) : ''}`
  return `${fmtDay(e.start)} ${fmtTime(e.start)} → ${fmtDay(e.end)} ${fmtTime(e.end)}`
}

export function durationLabel(e: CalEvent): string | null {
  if (!e.end || e.allDay) return null
  const hours = (Date.parse(e.end) - Date.parse(e.start)) / 3_600_000
  if (hours <= 0) return null
  const whole = Math.floor(hours)
  const mins = Math.round((hours - whole) * 60)
  return [whole ? `${whole} h` : null, mins ? `${mins} min` : null].filter(Boolean).join(' ')
}

export function upcoming(events: CalEvent[], count: number): CalEvent[] {
  return events.filter(isOngoing).sort((a, b) => Date.parse(a.start) - Date.parse(b.start)).slice(0, count)
}

export function thisWeekend(events: CalEvent[]): CalEvent[] {
  const now = new Date()
  const day = now.getDay() // 0 Sun … 6 Sat
  const toFri = (5 - day + 7) % 7
  const fri = startOfToday().getTime() + toFri * DAY
  return events
    .filter(isOngoing)
    .filter((e) => {
      const t = Date.parse(e.start)
      return t >= fri && t < fri + 3 * DAY
    })
    .sort((a, b) => Date.parse(a.start) - Date.parse(b.start))
}
