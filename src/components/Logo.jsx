// src/components/Logo.jsx
// Logo reutilizable de XBank: ícono SVG + texto.
// Se usa en Dashboard y Login para mantener consistencia visual.

export default function Logo({ size = 'md' }) {
  const iconSize = size === 'sm' ? 28 : 44
  const fontSize = size === 'sm' ? '1.2rem' : '1.8rem'

  return (
    <div className="logo" style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
      <svg
        width={iconSize}
        height={iconSize}
        viewBox="0 0 40 40"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        aria-hidden="true"
      >
        <rect width="40" height="40" rx="10" fill="#58a6ff" />
        <text
          x="20"
          y="27"
          textAnchor="middle"
          fill="white"
          fontFamily="Segoe UI, system-ui, sans-serif"
          fontWeight="800"
          fontSize="18"
        >
          X
        </text>
      </svg>
      <span style={{ fontSize, fontWeight: '700', letterSpacing: '-0.5px', color: 'var(--text)' }}>
        <span style={{ color: '#58a6ff' }}>X</span>Bank
      </span>
    </div>
  )
}
