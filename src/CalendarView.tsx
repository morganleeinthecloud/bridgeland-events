import FullCalendar from '@fullcalendar/react'
import dayGridPlugin from '@fullcalendar/daygrid'
import timeGridPlugin from '@fullcalendar/timegrid'
import listPlugin from '@fullcalendar/list'
import interactionPlugin from '@fullcalendar/interaction'
import type { EventClickArg, EventContentArg } from '@fullcalendar/core'
import { AREA_COLOR, fmtTime } from './data'
import { useIsPhone } from './useMediaQuery'
import type { CalEvent } from './types'

interface Props {
  events: CalEvent[]
  onSelect: (e: CalEvent) => void
}

export default function CalendarView({ events, onSelect }: Props) {
  const isPhone = useIsPhone()

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
        // Remount when the breakpoint flips so initialView/dayMaxEvents take effect.
        key={isPhone ? 'phone' : 'desktop'}
        plugins={[dayGridPlugin, timeGridPlugin, listPlugin, interactionPlugin]}
        initialView={isPhone ? 'listWeek' : 'dayGridMonth'}
        headerToolbar={
          isPhone
            ? { left: 'title', center: 'dayGridMonth,listWeek', right: 'today prev,next' }
            : { left: 'title', center: 'dayGridMonth,timeGridWeek,listWeek', right: 'today prev,next' }
        }
        buttonText={{ today: 'Today', month: 'Month', week: 'Week', list: 'Agenda' }}
        locale="en"
        firstDay={0}
        weekNumbers={false}
        dayMaxEvents={isPhone ? 2 : 3}
        moreLinkText={(n) => `+${n} more`}
        nowIndicator
        height="auto"
        expandRows
        fixedWeekCount={false}
        events={fcEvents}
        eventDisplay="block"
        eventTimeFormat={{ hour: 'numeric', minute: '2-digit', omitZeroMinute: true, meridiem: 'short' }}
        eventClick={(arg: EventClickArg) => onSelect(arg.event.extendedProps.event as CalEvent)}
        eventContent={(arg: EventContentArg) => {
          const e = arg.event.extendedProps.event as CalEvent
          // Agenda rows already have a "3pm - 7pm" time column; don't repeat it inside the pill.
          const showTime = !arg.event.allDay && !arg.view.type.startsWith('list')
          return (
            <div className="ev-pill">
              {showTime && <span className="t">{fmtTime(e.start)}</span>}
              <span className="n">{e.title}</span>
            </div>
          )
        }}
      />
    </div>
  )
}
