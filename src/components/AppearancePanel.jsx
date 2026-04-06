import './AppearancePanel.css'

const DARK_SWATCHES = [
  { color: '#0b0b0c', name: 'obsidian' },
  { color: '#050507', name: 'void' },
  { color: '#08091a', name: 'midnight' },
  { color: '#070d0b', name: 'forest' },
  { color: '#130d08', name: 'ember' },
  { color: '#100810', name: 'wine' },
]

const LIGHT_SWATCHES = [
  { color: '#f5f4f0', name: 'paper' },
  { color: '#f7f7f7', name: 'snow' },
  { color: '#faf6ee', name: 'cream' },
  { color: '#f0f5f2', name: 'sage' },
  { color: '#f0f4f9', name: 'sky' },
  { color: '#fdf5f0', name: 'peach' },
]

export function AppearancePanel({ theme, onThemeToggle, darkBg, lightBg, onDarkBgChange, onLightBgChange, grainOpacity, onGrainChange, onClose }) {
  const swatches = theme === 'dark' ? DARK_SWATCHES : LIGHT_SWATCHES
  const currentBg = theme === 'dark' ? darkBg : lightBg
  const onBgChange = theme === 'dark' ? onDarkBgChange : onLightBgChange

  return (
    <div className="ap-panel">
      <div className="ap-section">
        <div className="ap-mode-row">
          <span className="ap-label">mode</span>
          <button className="ap-mode-toggle" onClick={onThemeToggle}>
            <span className={`ap-mode-opt ${theme === 'dark' ? 'ap-mode-opt--active' : ''}`}>dark</span>
            <span className="ap-mode-sep" />
            <span className={`ap-mode-opt ${theme === 'light' ? 'ap-mode-opt--active' : ''}`}>light</span>
          </button>
        </div>
      </div>

      <div className="ap-divider" />

      <div className="ap-section">
        <span className="ap-label">canvas</span>
        <div className="ap-swatches">
          {swatches.map(s => (
            <button
              key={s.color}
              className={`ap-swatch ${currentBg === s.color ? 'ap-swatch--active' : ''}`}
              style={{ background: s.color }}
              title={s.name}
              onClick={() => onBgChange(s.color)}
            >
              {currentBg === s.color && <span className="ap-swatch__check">✓</span>}
            </button>
          ))}
        </div>
      </div>

      <div className="ap-divider" />

      <div className="ap-section">
        <div className="ap-label-row">
          <span className="ap-label">texture</span>
          <span className="ap-value">{Math.round(grainOpacity * 1000) / 10}%</span>
        </div>
        <input
          className="ap-slider"
          type="range"
          min="0"
          max="0.09"
          step="0.005"
          value={grainOpacity}
          onChange={(e) => onGrainChange(parseFloat(e.target.value))}
        />
        <div className="ap-slider-labels">
          <span>none</span>
          <span>heavy</span>
        </div>
      </div>
    </div>
  )
}
