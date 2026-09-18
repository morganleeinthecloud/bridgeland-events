import FullCalendar from '@fullcalendar/react'
import dayGridPlugin from '@fullcalendar/daygrid'
import timeGridPlugin from '@fullcalendar/timegrid'
import listPlugin from '@fullcalendar/list'
import interactionPlugin from '@fullcalendar/interaction'
import type { EventClickArg, EventContentArg } from '@fullcalendar/core'
import { AREA_COLOR, fmtTime } from './data'
import type { CalEvent } from './types'

interface Props {
  events: CalEvent[]
  onSelect: (e: CalEvent) => void
}

export default function CalendarView({ events, onSelect }: Props) {
  const fcEvents = events.map((e) => ({
    id: e.id,
    title: e.title,
    start: e.start,
    end: e.end ?? e.start,
    allDay: Boolean(e.allDay),
    backgroundColor: AREA_COLOR[e.neighborhood],
    borderColor: AREA_COLOR[e.neighborhood],
    textColor: '#06121c',
    extendedProps: { event: e },
  }))

  return (
    <div className="cal">
      <FullCalendar
        plugins={[dayGridPlugin, timeGridPlugin, listPlugin, interactionPlugin]}
        initialView="dayGridMonth"
        headerToolbar={{ left: 'title', center: 'dayGridMonth,timeGridWeek,listWeek', right: 'today prev,next' }}
        buttonText={{ today: 'Today', month: 'Month', week: 'Week', list: 'Agenda' }}
        locale="en"
        firstDay={0}
        weekNumbers={false}
        dayMaxEvents={3}
        moreLinkText={(n) => `+${n} more`}
        nowIndicator
        height="auto"
        expandRows
        fixedWeekCount={false}
        events={fcEvents}
        eventDisplay="block"
        eventTimeFormat={{ hour: 'numeric', minute: '2-digit', omitZeroMinute: true, meridiem: 'short' }}
        eventTimeClassNames="ev-time"
        eventClick={(arg: EventClickArg) => onSelect(arg.event.extendedProps.event as CalEvent)}
        eventContent={(arg: EventContentArg) => {
          const e = arg.event.extendedProps.event as CalEvent
          return (
            <div className="chip">
              {!arg.event.allDay && <span className="t">{fmtTime(e.start)}</span>}
              <span className="n">{e.title}</span>
            </div>
          )
        }}
      />
    </div>
  )
}
