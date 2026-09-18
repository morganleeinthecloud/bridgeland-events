import { useEffect } from 'react'
import { AREA_COLOR, AREA_LABEL, CATEGORY_LABEL, durationLabel, fmtRange, isNew } from './data'
import type { CalEvent } from './types'

const mapsUrl = (q: string) => `https://www.openstreetmap.org/search?query=${encodeURIComponent(q)}`

export default function EventDetail({ event, onClose }: { event: CalEvent; onClose: () => void }) {
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose()
    }
    document.addEventListener('keydown', onKey)
    // keep the page from scrolling behind the sheet (matters on touch devices)
    const previous = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    return () => {
      document.removeEventListener('keydown', onKey)
      document.body.style.overflow = previous
    }
  }, [onClose])

  const place = [event.venue?.name, event.venue?.address].filter(Boolean).join(', ')
  return (
    <div className="sheet-backdrop" onClick={onClose}>
      <div className="sheet" role="dialog" aria-modal="true" aria-label={event.title} onClick={(e) => e.stopPropagation()}>
        <div className="sheet-bar" style={{ background: AREA_COLOR[event.neighborhood] }} />
        <button className="sheet-close" onClick={onClose} aria-label="Close">
          ✕
        </button>
        <div className="sheet-body">
          <div className="row-gap">
            <span className="pill" style={{ borderColor: AREA_COLOR[event.neighborhood] }}>
              {AREA_LABEL[event.neighborhood]}
            </span>
            <span className="pill muted">{CATEGORY_LABEL[event.category]}</span>
            {isNew(event) && <span className="pill new">New</span>}
            {event.recurrence && <span className="pill muted">{event.recurrence.label}</span>}
          </div>
          <h2>{event.title}</h2>
          {event.description && <p className="sheet-desc">{event.description}</p>}
          <dl className="facts">
            <div>
              <dt>When</dt>
              <dd>
                {fmtRange(event)}
                {durationLabel(event) ? ` · ${durationLabel(event)}` : ''}
              </dd>
            </div>
            {place && (
              <div>
                <dt>Where</dt>
                <dd>
                  {place}{' '}
                  <a href={mapsUrl(place + ', Calgary')} target="_blank" rel="noreferrer">
                    map ↗
                  </a>
                </dd>
              </div>
            )}
            {event.cost && (
              <div>
                <dt>Cost</dt>
                <dd>{event.cost}</dd>
              </div>
            )}
            <div>
              <dt>Source</dt>
              <dd>
                {event.source.url ? (
                  <a href={event.source.url} target="_blank" rel="noreferrer">
                    {event.source.name} ↗
                  </a>
                ) : (
                  event.source.name
                )}
              </dd>
            </div>
            <div>
              <dt>Tracked</dt>
              <dd>first seen {new Date(event.firstSeen).toLocaleDateString()}</dd>
            </div>
          </dl>
        </div>
      </div>
    </div>
  )
}
