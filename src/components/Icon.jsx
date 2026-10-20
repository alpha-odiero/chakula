/* eslint-disable react/prop-types */

const paths = {
  home: 'M3 10.5 12 3l9 7.5M5 9.5V21h5v-6h4v6h5V9.5',
  explore: 'M21 3 3 10.5l6.75 2.25L12 19.5 21 3ZM9.75 12.75 21 3',
  search: 'M11 19a8 8 0 1 1 0-16 8 8 0 0 1 0 16Zm10 2-4.35-4.35',
  zoom: 'M11 19a8 8 0 1 1 0-16 8 8 0 0 1 0 16Zm10 2-4.35-4.35M11 8v6M8 11h6',
  random: 'M7 4c-3 3-3 8 0 11 0 0 2-3 5-3s5 3 5 3c3-3 3-8 0-11 0 0-2 3-5 3S7 4 7 4Zm10 13c-2 0-3 0-4 0',
  menu: 'M4 7h16M4 12h16M4 17h16',
  close: 'M6 6l12 12M18 6 6 18',
  share: 'M12 3v13M8 7l4-4 4 4M5 11v9a1 1 0 0 0 1 1h12a1 1 0 0 0 1-1v-9',
  check: 'M5 13l4 4L19 7',
  plus: 'M12 5v14M5 12h14',
  minus: 'M6 12h12',
  trash: 'M4 7h16M10 11v6M14 11v6M6 7l1 12a2 2 0 0 0 2 2h6a2 2 0 0 0 2-2l1-12M9 7V5a2 2 0 0 1 2-2h2a2 2 0 0 1 2 2v2',
  copy: 'M9 9h11a1 1 0 0 1 1 1v10a1 1 0 0 1-1 1H10a1 1 0 0 1-1-1V9ZM4 4h11a1 1 0 0 1 1 1v4',
  calendar: 'M4 6h16v15H4V6ZM8 6V3m8 3V3M4 11h16',
  list: 'M9 6h12M9 12h12M9 18h12M4 6h.01M4 12h.01M4 18h.01',
  shoppingBag: 'M6 7h12l1 14H5l1-14ZM9 7a3 3 0 0 1 6 0',
  sun: 'M12 8a4 4 0 1 0 0 8 4 4 0 0 0 0-8Zm0-6v2m0 16v2m8-10h2M2 12h2m13.07-7.07 1.41 1.41M4.93 17.66l1.41 1.41m0-14.14-1.41 1.41m14.14 12.32-1.41 1.41',
  moon: 'M21 12.8A9 9 0 1 1 11.2 3a7 7 0 0 0 9.8 9.8Z',
  sparkles: 'M12 3l1.9 4.6L18.5 9.5l-4.6 1.9L12 16l-1.9-4.6L5.5 9.5l4.6-1.9L12 3ZM5 17l.8 2L8 19.8 6 21l.8 2L5 22l-1.8.8L4 21l-2-.8L5 17ZM18 15l.6 1.4L20 17l-1.4.6L18 19l-.6-1.4L16 17l1.4-.6L18 15Z',
  user: 'M12 12a4 4 0 1 0 0-8 4 4 0 0 0 0 8Zm-8 8a8 8 0 0 1 16 0',
  leaf: 'M11 20a8 8 0 0 1-8-8c0-5 5-9 9-9s9 4 9 9a8 8 0 0 1-8 8Zm0 0c0-4 2-8 8-11',
  bolt: 'M13 2 4.5 13.5H11L10 22l8.5-11.5H12L13 2Z',
  database: 'M12 3c5 0 9 1.5 9 3.5S17 10 12 10 3 8.5 3 6.5 7 3 12 3ZM3 6.5V17c0 2 4 3.5 9 3.5s9-1.5 9-3.5V6.5M3 11.5c0 2 4 3.5 9 3.5s9-1.5 9-3.5',
  briefcase: 'M4 6h16v14H4V6ZM8 6V4h8v2m-9 5h.01M6 12h12M4 14h16',
  install: 'M12 3v12m0 0 4-4m-4 4-4-4M5 21h14',
  settings: 'M12 8.2a3.8 3.8 0 1 0 0 7.6 3.8 3.8 0 0 0 0-7.6Zm7.7 3.6c0-.4 0-.8-.1-1.2l2-1.5-2-3.4-2.3 1a7.5 7.5 0 0 0-2.1-1.2L15 3H9l-.2 2.5c-.8.3-1.5.7-2.1 1.2l-2.3-1-2 3.4 2 1.5c-.1.4-.1.8-.1 1.2s0 .8.1 1.2l-2 1.5 2 3.4 2.3-1c.6.5 1.3.9 2.1 1.2L9 21h6l.2-2.5c.8-.3 1.5-.7 2.1-1.2l2.3 1 2-3.4-2-1.5c.1-.4.1-.8.1-1.2Z',
  info: 'M12 21a9 9 0 1 0 0-18 9 9 0 0 0 0 18ZM12 10.5v5m0-8v.01',
  external: 'M14 4h6v6M20 4 10 14M18 13v6a1 1 0 0 1-1 1H5a1 1 0 0 1-1-1V7a1 1 0 0 1 1-1h6',
  video: 'M2 6.5A1.5 1.5 0 0 1 3.5 5h11A1.5 1.5 0 0 1 16 6.5v4.6l4.6-3.3A1 1 0 0 1 22 8.6v6.8a1 1 0 0 1-1.4.8L16 12v5.5a1.5 1.5 0 0 1-1.5 1.5h-11A1.5 1.5 0 0 1 2 17.5v-11Z',
  clock: 'M12 21a9 9 0 1 0 0-18 9 9 0 0 0 0 18Zm0-13v4l3 2',
  bell: 'M18 8a6 6 0 1 0-12 0c0 7-3 9-3 9h18s-3-2-3-9M13.7 21a2 2 0 0 1-3.4 0',
  pointer: 'M5.5 3.2 19.5 12.4 13.3 13.4 16.4 19.3 13.8 20.6 10.8 14.8 5.5 18.9Z',
  arrowRight: 'M5 12h14m-6-6 6 6-6 6',
  arrowUpRight: 'M7 17 17 7M9 7h8v8',
  chevronDown: 'm6 9 6 6 6-6',
  chevronUp: 'm6 15 6-6 6 6',
  chevronLeft: 'm14 6-6 6 6 6',
  refresh: 'M20 11A8 8 0 1 0 19 16m1-5-4-4m4 4h-4',
  cookingPot: 'M4 8h16m-2 0v9a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2V8m6-3v3M18 8a6 6 0 0 0-12 0M2 8h20',
  category: 'M3 5a2 2 0 0 1 2-2h4l2 2h8a2 2 0 0 1 2 2v10a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5Z',
  link: 'M10 14a5 5 0 0 0 7 0l2.5-2.5a5 5 0 0 0-7-7L11 6M14 10a5 5 0 0 0-7 0L4.5 12.5a5 5 0 0 0 7 7L13 18',
  heart: 'M12 21s-7-4.5-7-10.5C5 6.46 7.24 4 10 4c1.5 0 2.8.7 3.5 1.7C14.2 4.7 15.5 4 17 4c2.76 0 5 2.46 5 6.5S12 21 12 21z',
  heartFilled: 'M12 21s-7-4.5-7-10.5C5 6.46 7.24 4 10 4c1.5 0 2.8.7 3.5 1.7C14.2 4.7 15.5 4 17 4c2.76 0 5 2.46 5 6.5S12 21 12 21z',
  sliders: 'M4 6h10M18 6h2M4 12h4M12 12h8M4 18h12M20 18h0M14 4v4M8 10v4M16 16v4',
  globe: 'M12 21a9 9 0 1 0 0-18 9 9 0 0 0 0 18ZM3 12h18M12 3c2.5 2.4 3.8 5.4 3.8 9S14.5 18.6 12 21c-2.5-2.4-3.8-5.4-3.8-9S9.5 5.4 12 3Z',
  play: 'M7 4.5v15l13-7.5-13-7.5Z',
  pause: 'M8 5v14M16 5v14',
  timer: 'M12 21a8 8 0 1 0 0-16 8 8 0 0 0 0 16Zm0-12v4l2.5 2M9 2h6',
  utensils: 'M5 3v7a2 2 0 0 0 2 2h0a2 2 0 0 0 2-2V3M7 12v9M15 3c-1.5 1-2 2.5-2 4.5S14 11 15 11s2-.5 2-3.5S16.5 4 15 3Zm0 8v10',
  servings: 'M12 4a3 3 0 1 0 0 6 3 3 0 0 0 0-6ZM5 20a7 7 0 0 1 14 0M4 10h16'
}

function Icon({ name, size = 24, className = '', label = null, strokeWidth = 2 }) {
  return (
    <svg
      className={`icon ${className}`.trim()}
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={strokeWidth}
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden={label ? undefined : 'true'}
      role={label ? 'img' : undefined}
      focusable="false"
    >
      {label ? <title>{label}</title> : null}
      <path d={paths[name] || ''} />
    </svg>
  )
}

export default Icon