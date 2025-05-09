import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import Header from './components/Header';
import HomePage from './pages/HomePage';
import PDFMerger from './components/PDFMerger';
import './App.css';

function App() {
  return (
    <Router>
      <div className="app">
        <Header />
        <main className="main">
          <Routes>
            <Route path="/" element={<HomePage />} />
            <Route path="/pdf-merger" element={<PDFMerger />} />
          </Routes>
        </main>
      </div>
    </Router>
  );
}

export default App;