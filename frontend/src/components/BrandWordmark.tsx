import React from 'react'

/**
 * The wordmark, drawn rather than photographed.
 *
 * It used to be a 587x157 PNG. The login and password-reset pages render the
 * mark at h-24 - 96 CSS pixels, so 192 device pixels on any retina screen -
 * from artwork only 157 pixels tall, which is where the softness everyone
 * could see came from. A raster logo has one correct size and those pages were
 * not it.
 *
 * As SVG it is exact at every size, weighs a fraction of the PNG, needs no
 * separate dark-mode file, and - unlike "logo-transparent.png", which carries
 * a solid white box behind the type - is genuinely transparent.
 *
 * The lettering is live type in the brand serif. It is the same family the
 * headings already load, so it costs nothing extra and stays consistent with
 * the rest of the site.
 */

const GOLD = '#B99851'

// Geometry in the original artwork's coordinates, so the proportions are the
// ones that were approved rather than ones invented here.
const VIEW_W = 587
const VIEW_H = 157
const STAR = { cx: 360, cy: 82 }

/** An eight-point compass rose: long cardinals, short diagonals, thin waists. */
function compassRose(cx: number, cy: number): string {
  const LONG = 52
  const SHORT = 25
  const WAIST = 6.5
  const points: string[] = []

  for (let k = 0; k < 8; k += 1) {
    const tip = ((k * 45 - 90) * Math.PI) / 180
    const radius = k % 2 === 0 ? LONG : SHORT
    points.push(`${(cx + radius * Math.cos(tip)).toFixed(2)},${(cy + radius * Math.sin(tip)).toFixed(2)}`)

    const waist = ((k * 45 + 22.5 - 90) * Math.PI) / 180
    points.push(`${(cx + WAIST * Math.cos(waist)).toFixed(2)},${(cy + WAIST * Math.sin(waist)).toFixed(2)}`)
  }

  return points.join(' ')
}

type Props = {
  className?: string
  /** Rendered where the surrounding text colour is already correct. */
  title?: string
}

const BrandWordmark: React.FC<Props> = ({ className, title = 'Travel Art' }) => (
  <svg
    className={className}
    viewBox={`0 0 ${VIEW_W} ${VIEW_H}`}
    role="img"
    aria-label={title}
    preserveAspectRatio="xMidYMid meet"
  >
    <title>{title}</title>

    {/* The lettering takes its colour from the parent, so the same component
        serves the navy header and the inverted footer without a second file
        or a brightness/invert filter standing in for one. */}
    <g
      fill="currentColor"
      fontFamily="'Newsreader Variable', Newsreader, Georgia, serif"
      fontSize="74"
      fontWeight="500"
    >
      <text x="14" y="104" letterSpacing="1.5">TRAVEL</text>
      <text x="424" y="104" letterSpacing="1.5">ART</text>
    </g>

    <g fill={GOLD}>
      <polygon points={compassRose(STAR.cx, STAR.cy)} />
      <rect x="14" y="116" width="272" height="5" />
      <rect x="424" y="116" width="150" height="5" />
      <text
        x={STAR.cx}
        y="28"
        textAnchor="middle"
        fontFamily="'Newsreader Variable', Newsreader, Georgia, serif"
        fontSize="26"
      >
        N
      </text>
      <text
        x={STAR.cx}
        y="150"
        textAnchor="middle"
        fontFamily="'Newsreader Variable', Newsreader, Georgia, serif"
        fontSize="26"
      >
        S
      </text>
    </g>
  </svg>
)

export default BrandWordmark
