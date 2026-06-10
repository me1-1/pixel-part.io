import { Link } from 'react-router-dom'

const games = [
  {
    id: 'survivor',
    title: 'Survivor.io',
    desc: 'Fight waves of monsters in a top-down arena. Level up, choose upgrades, and survive as long as you can!',
    tag: 'Action',
    path: '/survivor',
    previewClass: 'survivor-preview',
    emoji: '⚔️',
  },
  {
    id: 'watersort',
    title: 'Cups - Water Sort',
    desc: 'Sort the colored water into cups so each one holds only a single color. A relaxing but tricky puzzle!',
    tag: 'Puzzle',
    path: '/water-sort',
    previewClass: 'watersort-preview',
    emoji: '🧪',
  },
  {
    id: 'arrow',
    title: 'Arrow Escape',
    desc: 'Dodge a storm of arrows flying from every direction. How long can you survive the arrow apocalypse?',
    tag: 'Arcade',
    path: '/arrow-escape',
    previewClass: 'arrow-preview',
    emoji: '🏹',
  },
]

export default function HomePage() {
  return (
    <div className="home">
      <div className="home-hero">
        <h1>PIXEL PARTY</h1>
        <p>Three awesome minigames in one place. Pick one and start playing!</p>
      </div>
      <div className="game-grid">
        {games.map((g) => (
          <Link key={g.id} to={g.path} className="game-card">
            <div className={`game-card-preview ${g.previewClass}`}>
              <span style={{ fontSize: '4rem' }}>{g.emoji}</span>
            </div>
            <div className="game-card-info">
              <h2>{g.title}</h2>
              <p>{g.desc}</p>
              <span className="game-card-tag">{g.tag}</span>
            </div>
          </Link>
        ))}
      </div>
    </div>
  )
}
