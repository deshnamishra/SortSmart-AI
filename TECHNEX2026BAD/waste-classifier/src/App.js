import React from 'react';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import NavBar from './components/NavBar';
import RadarBackground from './components/RadarBackground';
import Home from './pages/Home';
import Dashboard from './pages/Dashboard';
import Leaderboard from './pages/Leaderboard';
import './App.css';

export default function App() {
  return (
    <BrowserRouter>
      <RadarBackground />
      <div className="app-shell">
        <NavBar />
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/dashboard" element={<Dashboard />} />
          <Route path="/leaderboard" element={<Leaderboard />} />
        </Routes>
      </div>
    </BrowserRouter>
  );
}
