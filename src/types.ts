export type Neighborhood = 'bridgeland' | 'riverside' | 'renfrew' | 'both'

export type Category =
  | 'market'
  | 'social'
  | 'family'
  | 'civic'
  | 'class'
  | 'outdoors'
  | 'fundraiser'
  | 'food-drink'

export interface Venue {
  name?: string
  address?: string
}

export interface SourceRef {
  kind: 'facebook-group' | 'facebook-page' | 'community-site' | 'calendar' | 'other'
  name: string
  url?: string
}

export interface Recurrence {
  label: string
  seriesId?: string
}

export interface CalEvent {
  id: string
  title: string
  description?: string
  start: string
  end?: string
  allDay?: boolean
  timezone?: string
  venue?: Venue
  neighborhood: Neighborhood
  category: Category
  cost?: string
  source: SourceRef
  recurrence?: Recurrence
  flyer?: string
  firstSeen: string
  lastSeen: string
  status: 'upcoming' | 'past' | 'cancelled' | 'unconfirmed'
}

export interface Dataset {
  version: number
  /** When the source scan last ran successfully (what the header badge reports). */
  scannedAt?: string
  /** When the payload contents last actually changed. */
  generatedAt: string
  window: { from: string; to: string }
  counts?: Record<string, number>
  events: CalEvent[]
}

export interface Filters {
  areas: Set<Neighborhood>
  categories: Set<Category>
  sources: Set<SourceRef['kind']>
  newOnly: boolean
  recurringOnly: boolean
  freeOnly: boolean
  query: string
  days: number | null
}
