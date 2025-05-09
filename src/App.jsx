import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import Header from './components/Header';
import HomePage from './pages/HomePage';
import PDFMerger from './pages/PDFMerger';
import ImagePrinter from './pages/ImagePrinter';
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
            <Route path="/image-printer" element={<ImagePrinter />} />
          </Routes>
        </main>
      </div>
    </Router>
  );
}

export default App;