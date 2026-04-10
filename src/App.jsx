import { useState, useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, Link } from 'react-router-dom';
import { Calculator } from 'lucide-react';
import Home from './pages/Home';
import CalculatorPage from './pages/Calculator';
import { loginAnonymously } from './firebase';
import './index.css';

function App() {
  useEffect(() => {
    // Start login process immediately on app load
    loginAnonymously().catch(err => console.error("Initial auth failed:", err));
  }, []);

  return (
    <Router>
      <header className="header-bar">
        <Link to="/" className="brand">
          <Calculator size={24} />
          <span>GIKI GPA Tracker</span>
        </Link>
      </header>
      
      <main className="container">
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/calculator/:facultyIdx/:programIdx/:semesterIdx" element={<CalculatorPage />} />
        </Routes>
      </main>
    </Router>
  );
}

export default App;
