import { createContext, useContext, useEffect, useState } from 'react'

const ThemeContext = createContext(null)

export function ThemeProvider({ children }) {
  const [theme, setTheme] = useState(() => {
    // Se souvient du choix précédent, sinon respecte la préférence système
    const sauvegarde = localStorage.getItem('theme')
    if (sauvegarde) return sauvegarde
    return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'sombre' : 'clair'
  })

  useEffect(() => {
    document.documentElement.setAttribute('data-theme', theme === 'sombre' ? 'sombre' : '')
    localStorage.setItem('theme', theme)
  }, [theme])

  function basculerTheme() {
    setTheme((prev) => (prev === 'sombre' ? 'clair' : 'sombre'))
  }

  return (
    <ThemeContext.Provider value={{ theme, basculerTheme }}>
      {children}
    </ThemeContext.Provider>
  )
}

export function useTheme() {
  return useContext(ThemeContext)
}