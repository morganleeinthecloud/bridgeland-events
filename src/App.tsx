import { useEffect, useMemo, useState } from 'react'
import CalendarView from './CalendarView'
import { useIsPhone } from './useMediaQuery'
import EventDetail from './EventDetail'
import {
  AREA_COLOR,
  AREA_LABEL,
  CATEGORY_LABEL,
  SOURCE_LABEL,
  applyFilters,
  durationLabel,
  fmtRange,
  fmtUpdated,
  isNew,
  isStale,
  loadDataset,
  relAge,
  thisWeekend,
  upcoming,
} from './data'
import type { CalEvent, Category, Dataset, Filters, Neighborhood, SourceRef } from './types'

const AREAS: Neighborhood[] = ['bridgeland', 'riverside', 'renfrew', 'both']
const CATEGORIES: Category[] = ['market', 'social', 'family', 'civic', 'class', 'outdoors', 'fundraiser', 'food-drink']
const SOURCES: SourceRef['kind'][] = ['facebook-group', 'facebook-page', 'community-site', 'calendar']
const DAY_PRESETS: { label: string; days: number | null }[] = [
  { label: 'All', days: null },
  { label: '7 days', days: 7 },
  { label: '30 days', days: 30 },
  { label: '60 days', days: 60 },
]

/** Panels show this many rows until the reader asks for the rest. */
const PANEL_CAP = 4
const ALL_EVENTS = Number.MAX_SAFE_INTEGER

function ShowAll({
  total,
  cap = PANEL_CAP,
  expanded,
  onToggle,
}: {
  total: number
  cap?: number
  expanded: boolean
  onToggle: () => void
}) {
  if (total <= cap) return null
  return (
    <button className="more" onClick={onToggle} aria-expanded={expanded}>
      {expanded ? 'Show less' : `Show all ${total}`}
    </button>
  )
}

function initialFilters(): Filters {
  return {
    areas: new Set(AREAS),
    categories: new Set(CATEGORIES),
    sources: new Set(SOURCES),
    newOnly: false,
    recurringOnly: false,
    freeOnly: false,
    query: '',
    days: null,
  }
}

function toggle<T>(set: Set<T>, value: T): Set<T> {
  const next = new Set(set)
  if (next.has(value)) next.delete(value)
  else next.add(value)
  return next.has(value) || next.size > 0 ? next : set
}

export default function App() {
  const [data, setData] = useState<Dataset | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [filters, setFilters] = useState<Filters>(initialFilters)
  const [selected, setSelected] = useState<CalEvent | null>(null)
  const isPhone = useIsPhone()
  const [theme, setTheme] = useState<'dark' | 'light'>(
    () => (localStorage.getItem('theme') as 'dark' | 'light') ?? 'dark',
  )
  // keeps the "x ago" line honest without a reload
  const [now, setNow] = useState(() => Date.now())
  const [nextExpanded, setNextExpanded] = useState(false)
  const [weekendExpanded, setWeekendExpanded] = useState(false)

  useEffect(() => {
    loadDataset()
      .then(setData)
      .catch((e: Error) => setError(e.message))
  }, [])

  useEffect(() => {
    document.documentElement.dataset.theme = theme
    localStorage.setItem('theme', theme)
  }, [theme])

  useEffect(() => {
    const id = window.setInterval(() => setNow(Date.now()), 60_000)
    return () => window.clearInterval(id)
  }, [])

  const stale = data ? isStale(data.generatedAt, now) : false

  const visible = useMemo(() => (data ? applyFilters(data.events, filters) : []), [data, filters])
  const next = useMemo(() => upcoming(visible, ALL_EVENTS), [visible])
  const weekend = useMemo(() => thisWeekend(visible), [visible])

  const set = <K extends keyof Filters>(key: K, value: Filters[K]) => setFilters((f) => ({ ...f, [key]: value }))
  const toggleIn = <K extends 'areas' | 'categories' | 'sources'>(key: K, value: Filters[K] extends Set<infer T> ? T : never) =>
    setFilters((f) => ({ ...f, [key]: toggle(f[key] as Set<typeof value>, value) as Filters[K] }))

  if (error) {
    return (
      <div className="wrap">
        <div className="card error">
          <h2>Could not load events</h2>
          <p>{error}</p>
          <p className="muted">
            The site reads <code>public/data/events.json</code> from this repo. If it is missing, the daily publish step has
            not run yet.
          </p>
        </div>
      </div>
    )
  }

  return (
    <div className="wrap">
      <header>
        <div className="brand">
          <div className="logo">BR</div>
          <div>
            <h1>Bridgeland &amp; Renfrew Events</h1>
            <div className="sub">
              Inner-Calgary community calendar · updated daily
              {data ? ` · ${data.events.length} events tracked · window ${data.window.from} → ${data.window.to}` : ' · loading…'}
            </div>
            {data && (
              <div
                className={'fresh' + (stale ? ' stale' : '')}
                title={`Source data refreshed ${fmtUpdated(data.generatedAt)} (${new Date(data.generatedAt).toISOString()}). The scanner runs daily around 08:00 Mountain Time.`}
              >
                <span className="pulse" aria-hidden="true" />
                <span>
                  Source data updated {fmtUpdated(data.generatedAt)} · {relAge(data.generatedAt, now)}
                </span>
                {stale && <span className="tag stale-tag">stale</span>}
              </div>
            )}
          </div>
        </div>
        <div className="tools">
          <input
            type="search"
            value={filters.query}
            onChange={(e) => set('query', e.target.value)}
            placeholder={isPhone ? 'Search events…' : 'Search events, venues, hosts…'}
            aria-label="Search events"
          />
          <a className="btn" href="./bridgeland.ics">
            Subscribe .ics
          </a>
          <button className="btn icon" onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')} title="Toggle theme">
            {theme === 'dark' ? '☾' : '☀'}
          </button>
        </div>
      </header>

      <div className="filters">
        <div className="group">
          <span className="lab">Area</span>
          {AREAS.map((a) => (
            <button
              key={a}
              className={'chip' + (filters.areas.has(a) ? ' on' : '')}
              onClick={() => toggleIn('areas', a)}
            >
              <span className="dot" style={{ background: AREA_COLOR[a] }} />
              {AREA_LABEL[a].replace('Bridgeland/', '')}
            </button>
          ))}
        </div>
        <div className="group">
          <span className="lab">Type</span>
          {CATEGORIES.map((c) => (
            <button
              key={c}
              className={'chip' + (filters.categories.has(c) ? ' on' : '')}
              onClick={() => toggleIn('categories', c)}
            >
              {CATEGORY_LABEL[c]}
            </button>
          ))}
        </div>
        <div className="group">
          <span className="lab">Source</span>
          {SOURCES.map((s) => (
            <button
              key={s}
              className={'chip' + (filters.sources.has(s) ? ' on' : '')}
              onClick={() => toggleIn('sources', s)}
            >
              {SOURCE_LABEL[s]}
            </button>
          ))}
        </div>
        <div className="group">
          <button
            className={'chip' + (filters.newOnly ? ' on' : '')}
            onClick={() => setFilters((f) => ({ ...f, newOnly: !f.newOnly }))}
          >
            <span className="dot" style={{ background: '#7ef0a6' }} />
            New only
          </button>
          <button
            className={'chip' + (filters.recurringOnly ? ' on' : '')}
            onClick={() => setFilters((f) => ({ ...f, recurringOnly: !f.recurringOnly }))}
          >
            Recurring
          </button>
          <button className={'chip' + (filters.freeOnly ? ' on' : '')} onClick={() => setFilters((f) => ({ ...f, freeOnly: !f.freeOnly }))}>
            Free
          </button>
        </div>
        <div className="group right">
          {DAY_PRESETS.map((p) => (
            <button
              key={p.label}
              className={'chip' + (filters.days === p.days ? ' on' : '')}
              onClick={() => set('days', p.days)}
            >
              {p.label}
            </button>
          ))}
        </div>
      </div>

      <div className="main">
        <div className="card cal-card">
          <CalendarView events={visible} onSelect={setSelected} />
          <div className="legend">
            {AREAS.map((a) => (
              <span key={a}>
                <span className="sq" style={{ background: AREA_COLOR[a] }} />
                {AREA_LABEL[a]}
              </span>
            ))}
            <span className="right">
              {visible.length} of {data?.events.length ?? 0} events shown
            </span>
          </div>
        </div>

        <aside>
          <div className="card panel">
            <div className="ptitle">
              Next up <span className="count">{next[0] ? fmtRange(next[0]).split(' · ')[0] : '—'}</span>
            </div>
            {next.length === 0 && <p className="muted">Nothing matches these filters.</p>}
            {next.slice(0, nextExpanded ? next.length : PANEL_CAP).map((e) => (
              <button className="item" key={e.id} onClick={() => setSelected(e)}>
                <div className="ititle">
                  {e.title}
                  {isNew(e) && <span className="tag new">new</span>}
                  {e.recurrence && <span className="tag rec">recurring</span>}
                </div>
                <div className="meta">
                  <span className="k">{fmtRange(e)}</span>
                  {durationLabel(e) ? ` · ${durationLabel(e)}` : ''}
                  <br />
                  {[e.venue?.name, e.venue?.address].filter(Boolean).join(' · ') || 'location TBD'}
                </div>
                <div className="src">
                  <span className="sq" style={{ background: AREA_COLOR[e.neighborhood] }} />
                  {e.source.name}
                </div>
              </button>
            ))}
            <ShowAll total={next.length} expanded={nextExpanded} onToggle={() => setNextExpanded((v) => !v)} />
          </div>

          <div className="card panel">
            <div className="ptitle">
              This weekend <span className="count">{weekend.length}</span>
            </div>
            {weekend.length === 0 && <p className="muted">Nothing scheduled this weekend.</p>}
            {weekend.slice(0, weekendExpanded ? weekend.length : PANEL_CAP).map((e) => (
              <button className="item" key={e.id} onClick={() => setSelected(e)}>
                <div className="ititle">{e.title}</div>
                <div className="meta">
                  <span className="k">{fmtRange(e)}</span>
                  <br />
                  {[e.venue?.name, e.venue?.address].filter(Boolean).join(' · ') || 'location TBD'}
                </div>
              </button>
            ))}
            <ShowAll total={weekend.length} expanded={weekendExpanded} onToggle={() => setWeekendExpanded((v) => !v)} />
          </div>
        </aside>
      </div>

      <footer>
        <span>
          <b>Sources</b> Bridgeland Love · Bridgeland/Riverside · BRCA page · Renfrew CA page · brcacalgary.org ·
          renfrewyyc.ca · getcommunal · RCA Google Calendar
        </span>
        <span>
          <b>Data</b> public/data/events.json
          {data ? ` · generated ${fmtUpdated(data.generatedAt)} (Mountain Time)` : ''}
        </span>
      </footer>

      {selected && <EventDetail event={selected} onClose={() => setSelected(null)} />}
    </div>
  )
}
