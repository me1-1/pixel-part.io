import { Link } from 'react-router-dom'

export default function NavBar() {
  return (
    <nav className="nav">
      <Link to="/" className="nav-logo">PIXEL PARTY</Link>
      <div className="nav-links">
        <Link to="/survivor">Survivor.io</Link>
        <Link to="/water-sort">Water Sort</Link>
        <Link to="/arrow-escape">Arrow Escape</Link>
      </div>
    </nav>
  )
}
