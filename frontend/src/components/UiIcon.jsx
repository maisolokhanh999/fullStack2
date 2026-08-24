function UiIcon({ name, className = '' }) {
  const classes = ['ui-icon', className].filter(Boolean).join(' ')

  const commonProps = {
    className: classes,
    viewBox: '0 0 24 24',
    fill: 'none',
    stroke: 'currentColor',
    strokeWidth: 1.8,
    strokeLinecap: 'round',
    strokeLinejoin: 'round',
    'aria-hidden': true,
  }

  switch (name) {
    case 'arrow-right':
      return (
        <svg {...commonProps}>
          <path d="M5 12h14" />
          <path d="m14 7 5 5-5 5" />
        </svg>
      )
    case 'arrow-left':
      return (
        <svg {...commonProps}>
          <path d="M19 12H5" />
          <path d="m10 7-5 5 5 5" />
        </svg>
      )
    case 'arrow-up-right':
      return (
        <svg {...commonProps}>
          <path d="M7 17 17 7" />
          <path d="M8 7h9v9" />
        </svg>
      )
    case 'check':
      return (
        <svg {...commonProps}>
          <path d="m5 12.5 4.2 4.2L19 7" />
        </svg>
      )
    case 'close':
      return (
        <svg {...commonProps}>
          <path d="m6 6 12 12" />
          <path d="m18 6-12 12" />
        </svg>
      )
    case 'search':
      return (
        <svg {...commonProps}>
          <circle cx="11" cy="11" r="6.5" />
          <path d="m16 16 4 4" />
        </svg>
      )
    case 'clock':
      return (
        <svg {...commonProps}>
          <circle cx="12" cy="12" r="8.5" />
          <path d="M12 7.5V12l3 2" />
        </svg>
      )
    case 'calendar':
      return (
        <svg {...commonProps}>
          <rect x="3.5" y="5" width="17" height="15.5" rx="2.5" />
          <path d="M3.5 9.5h17" />
          <path d="M8 3v4" />
          <path d="M16 3v4" />
        </svg>
      )
    case 'users':
      return (
        <svg {...commonProps}>
          <circle cx="9" cy="9" r="3.2" />
          <path d="M3.8 19c.6-3 2.7-4.7 5.2-4.7s4.6 1.7 5.2 4.7" />
          <path d="M15.5 5.7c1.4.3 2.4 1.6 2.4 3.1s-1 2.8-2.4 3.1" />
          <path d="M15 14.4c2.1.4 3.6 1.9 4.1 4.4" />
        </svg>
      )
    case 'table':
      return (
        <svg {...commonProps}>
          <path d="M3.5 8.5h17" />
          <path d="M6 8.5V19" />
          <path d="M18 8.5V19" />
          <rect x="3.5" y="4.5" width="17" height="4" rx="1.2" />
        </svg>
      )
    case 'location':
      return (
        <svg {...commonProps}>
          <path d="M20 10c0 5-8 11-8 11S4 15 4 10a8 8 0 1 1 16 0Z" />
          <circle cx="12" cy="10" r="2.4" />
        </svg>
      )
    case 'star':
      return (
        <svg {...commonProps} fill="currentColor" stroke="none">
          <path d="m12 2.9 2.8 5.7 6.3.9-4.6 4.5 1.1 6.3-5.6-3-5.6 3 1.1-6.3-4.6-4.5 6.3-.9L12 2.9Z" />
        </svg>
      )
    case 'circle':
      return (
        <svg {...commonProps}>
          <circle cx="12" cy="12" r="8" />
        </svg>
      )
    case 'info':
      return (
        <svg {...commonProps}>
          <circle cx="12" cy="12" r="9" />
          <path d="M12 10.5v6" />
          <path d="M12 7.4h.01" />
        </svg>
      )
    default:
      return null
  }
}

export default UiIcon
