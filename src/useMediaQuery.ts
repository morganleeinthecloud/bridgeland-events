import { useEffect, useState } from 'react'

/** Reactive matchMedia — drives the layout choices that CSS alone cannot make. */
export function useMediaQuery(query: string): boolean {
  const [matches, setMatches] = useState(() =>
    typeof window === 'undefined' ? false : window.matchMedia(query).matches,
  )

  useEffect(() => {
    const mql = window.matchMedia(query)
    const update = () => setMatches(mql.matches)
    update()
    mql.addEventListener('change', update)
    return () => mql.removeEventListener('change', update)
  }, [query])

  return matches
}

/** Phone-sized viewports get an agenda-first calendar rather than a cramped month grid. */
export const useIsPhone = () => useMediaQuery('(max-width: 700px)')
