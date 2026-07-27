export function iconeRang(rank) {
  if (!rank) return null
  const r = rank.toLowerCase()
  if (r.includes('chef')) return '👑'
  if (r.includes('lieutenant')) return '⚔️'
  if (r.includes('guérisseur')) return '🌿'
  return null
}

export function prioriteRang(rank) {
  if (!rank) return 3
  const r = rank.toLowerCase()
  if (r.includes('chef')) return 0
  if (r.includes('lieutenant')) return 1
  if (r.includes('guérisseur')) return 2
  return 3
}

export function estRecent(dateCreation, joursMax = 7) {
  const diff = Date.now() - new Date(dateCreation).getTime()
  return diff < joursMax * 24 * 60 * 60 * 1000
}