import { Routes, Route } from 'react-router-dom'
import NavBar from './components/NavBar'
import HomePage from './components/HomePage'
import SurvivorGame from './games/survivor/SurvivorGame'
import WaterSortGame from './games/water-sort/WaterSortGame'
import ArrowEscapeGame from './games/arrow-escape/ArrowEscapeGame'

export default function App() {
  return (
    <>
      <NavBar />
      <Routes>
        <Route path="/" element={<HomePage />} />
        <Route path="/survivor" element={<SurvivorGame />} />
        <Route path="/water-sort" element={<WaterSortGame />} />
        <Route path="/arrow-escape" element={<ArrowEscapeGame />} />
      </Routes>
    </>
  )
}
