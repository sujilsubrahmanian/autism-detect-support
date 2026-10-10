import { avatarHue, initials } from '../lib/format'

/** Round initials badge with a stable colour per name. */
export default function Avatar({ name, size = 44 }) {
  const hue = avatarHue(name)
  return (
    <span
      className="avatar"
      aria-hidden="true"
      style={{
        width: size,
        height: size,
        fontSize: size * 0.38,
        background: `hsl(${hue} 52% 88%)`,
        color: `hsl(${hue} 55% 26%)`,
      }}
    >
      {initials(name)}
    </span>
  )
}
