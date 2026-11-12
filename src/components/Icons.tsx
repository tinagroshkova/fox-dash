import type { SVGProps } from 'react'

type IconProps = SVGProps<SVGSVGElement>

export const SunIcon = (props: IconProps) => (
  <svg viewBox="0 0 24 24" aria-hidden="true" {...props}>
    <circle cx="12" cy="12" r="4.2" fill="currentColor" />
    <g stroke="currentColor" strokeWidth="1.8" strokeLinecap="round">
      <path d="M12 2.5v2.2M12 19.3v2.2M2.5 12h2.2M19.3 12h2.2" />
      <path d="M5.2 5.2l1.6 1.6M17.2 17.2l1.6 1.6M18.8 5.2l-1.6 1.6M6.8 17.2l-1.6 1.6" />
    </g>
  </svg>
)

export const MoonIcon = (props: IconProps) => (
  <svg viewBox="0 0 24 24" aria-hidden="true" {...props}>
    <path
      d="M20 14.5A8.5 8.5 0 0 1 9.5 4a8.5 8.5 0 1 0 10.5 10.5Z"
      fill="currentColor"
    />
  </svg>
)

export const SoundOnIcon = (props: IconProps) => (
  <svg viewBox="0 0 24 24" aria-hidden="true" {...props}>
    <path d="M4 9.5h3.2L12 5.5v13L7.2 14.5H4z" fill="currentColor" />
    <path
      d="M15.5 8.5a5 5 0 0 1 0 7M18 6a8.5 8.5 0 0 1 0 12"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.8"
      strokeLinecap="round"
    />
  </svg>
)

export const SoundOffIcon = (props: IconProps) => (
  <svg viewBox="0 0 24 24" aria-hidden="true" {...props}>
    <path d="M4 9.5h3.2L12 5.5v13L7.2 14.5H4z" fill="currentColor" />
    <path
      d="M16 9.5l5 5M21 9.5l-5 5"
      stroke="currentColor"
      strokeWidth="1.8"
      strokeLinecap="round"
    />
  </svg>
)

export const HeartIcon = (props: IconProps) => (
  <svg viewBox="0 0 24 24" aria-hidden="true" {...props}>
    <path
      d="M12 21s-7.5-4.6-9.6-9A5.6 5.6 0 0 1 12 5.6 5.6 5.6 0 0 1 21.6 12C19.5 16.4 12 21 12 21Z"
      fill="currentColor"
    />
  </svg>
)

export const BerryIcon = (props: IconProps) => (
  <svg viewBox="0 0 24 24" aria-hidden="true" {...props}>
    <circle cx="12" cy="14.5" r="6.8" fill="currentColor" />
    <path d="M12 8c1-3.4 3.2-4.6 6.4-4.6C17.4 6.8 15.2 8 12 8Z" fill="#4fa75f" />
  </svg>
)

export const ShieldIcon = (props: IconProps) => (
  <svg viewBox="0 0 24 24" aria-hidden="true" {...props}>
    <path
      d="M12 2.8 20 6v6.2c0 4.6-3.2 7.6-8 9-4.8-1.4-8-4.4-8-9V6z"
      fill="currentColor"
    />
  </svg>
)

export const MagnetIcon = (props: IconProps) => (
  <svg viewBox="0 0 24 24" aria-hidden="true" {...props}>
    <path
      d="M5 4h4v8a3 3 0 0 0 6 0V4h4v8a7 7 0 0 1-14 0z"
      fill="currentColor"
    />
    <rect x="5" y="2" width="4" height="3.4" rx="1" fill="currentColor" />
    <rect x="15" y="2" width="4" height="3.4" rx="1" fill="currentColor" />
  </svg>
)

export const ClockIcon = (props: IconProps) => (
  <svg viewBox="0 0 24 24" aria-hidden="true" {...props}>
    <circle cx="12" cy="12" r="9" fill="none" stroke="currentColor" strokeWidth="2" />
    <path
      d="M12 7v5l3.4 2"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
    />
  </svg>
)

export const PauseIcon = (props: IconProps) => (
  <svg viewBox="0 0 24 24" aria-hidden="true" {...props}>
    <rect x="6" y="4.5" width="4" height="15" rx="1.4" fill="currentColor" />
    <rect x="14" y="4.5" width="4" height="15" rx="1.4" fill="currentColor" />
  </svg>
)

export const PlayIcon = (props: IconProps) => (
  <svg viewBox="0 0 24 24" aria-hidden="true" {...props}>
    <path d="M8 4.8v14.4L19.2 12z" fill="currentColor" />
  </svg>
)

export const FoxLogo = (props: IconProps) => (
  <svg viewBox="0 0 32 32" aria-hidden="true" {...props}>
    <path
      d="M5 4l5 4h12l5-4 1 10a12 12 0 0 1-24 0z"
      fill="currentColor"
    />
    <path d="M10.5 15a5.5 5.5 0 0 0 11 0 7 7 0 0 0-11 0z" fill="#fff3e2" />
    <circle cx="12.4" cy="13.6" r="1.4" fill="#2b1d12" />
    <circle cx="19.6" cy="13.6" r="1.4" fill="#2b1d12" />
    <path d="M16 16.5l-2 2h4z" fill="#2b1d12" />
  </svg>
)
