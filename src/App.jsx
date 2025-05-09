import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import Header from './components/Header';
import FileUpload from './components/FileUpload'; // Make sure this matches the file we'll create
import ResultsViewer from './components/ResultsViewer';
import PDFMerger from './components/PDFMerger';
import './App.css';

function App() {
  const [results, setResults] = React.useState([]);
  
  const handleConversion = (newResults) => {
    setResults(prev => [...prev, ...newResults]);
  };
  
  const handleDownload = (resultIndex, pdfIndex) => {
    const pdfUrl = results[resultIndex].pdfs[pdfIndex].pdf;
    const pdfName = results[resultIndex].pdfs[pdfIndex].name;
    
    const link = document.createElement('a');
    link.href = pdfUrl;
    link.download = pdfName;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };
  
  const handleDownloadAll = () => {
    results.forEach(result => {
      result.pdfs.forEach(pdfItem => {
        const link = document.createElement('a');
        link.href = pdfItem.pdf;
        link.download = pdfItem.name;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
      });
    });
  };
  
  const handleView = (resultIndex, pdfIndex) => {
    const pdfUrl = results[resultIndex].pdfs[pdfIndex].pdf;
    window.open(pdfUrl, '_blank');
  };
  
  return (
    <Router>
      <div className="app">
        <Header />
        <main className="main">
          <Routes>
            <Route path="/" element={
              <>
                <FileUpload onConversion={handleConversion} />
                <ResultsViewer 
                  results={results} 
                  onDownload={handleDownload} 
                  onDownloadAll={handleDownloadAll}
                  onView={handleView}
                />
              </>
            } />
            <Route path="/pdf-merger" element={<PDFMerger />} />
          </Routes>
        </main>
      </div>
    </Router>
  );
}

export default App;