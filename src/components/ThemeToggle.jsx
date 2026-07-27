import { useTheme } from '../lib/useTheme'

function ThemeToggle() {
  const { theme, basculerTheme } = useTheme()

  return (
    <button
      type="button"
      onClick={basculerTheme}
      className="bouton-theme"
      aria-label={theme === 'sombre' ? 'Passer en mode clair' : 'Passer en mode sombre'}
      title={theme === 'sombre' ? 'Mode clair' : 'Mode sombre'}
    >
      {theme === 'sombre' ? '☀️' : '🌙'}
    </button>
  )
}

export default ThemeToggle