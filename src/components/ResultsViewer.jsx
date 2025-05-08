import React, { useState, useEffect } from 'react';
import styles from './ResultsViewer.module.css';

const ResultsViewer = ({ results, onDownload, onDownloadAll, onView }) => {
  const [imageError, setImageError] = useState({});
  const [selectedResultIndex, setSelectedResultIndex] = useState(null);
  const [fullscreenPreview, setFullscreenPreview] = useState(null);
  
  // Reset image errors when results change
  useEffect(() => {
    setImageError({});
    // If there's only one result, automatically select it
    if (results.length === 1) {
      setSelectedResultIndex(0);
    } else {
      setSelectedResultIndex(null);
    }
  }, [results]);
  
  if (results.length === 0) {
    return null;
  }
  
  const handleResultClick = (index) => {
    setSelectedResultIndex(index === selectedResultIndex ? null : index);
  };
  
  const handleViewClick = (e, resultIndex, pdfIndex) => {
    e.stopPropagation(); // Prevent triggering the list item click
    setFullscreenPreview({
      resultIndex,
      pdfIndex,
      pdf: results[resultIndex].pdfs[pdfIndex]
    });
  };
  
  const handleDownloadClick = (e, resultIndex, pdfIndex) => {
    e.stopPropagation(); // Prevent triggering the list item click
    onDownload(resultIndex, pdfIndex);
  };
  
  const handleImageError = (resultIndex, pdfIndex) => {
    setImageError(prev => ({
      ...prev,
      [`${resultIndex}-${pdfIndex}`]: true
    }));
  };
  
  // Function to get thumbnail URL
  const getThumbnailUrl = (pdfItem) => {
    // Try to use thumbnail if available, otherwise use first page of PDF
    return pdfItem.thumbnail || `${pdfItem.pdf}#page=1`;
  };
  
  const closeFullscreenPreview = () => {
    setFullscreenPreview(null);
  };
  
  return (
    <div className={styles.resultsContainer}>
      <div className={styles.resultsHeader}>
        <h2>Converted PDFs</h2>
      </div>
      
      {/* Download All button */}
      {results.length > 0 && (
        <div className={styles.downloadAllContainer}>
          <button 
            className={styles.downloadAllButton}
            onClick={onDownloadAll}
          >
            Download All PDFs
          </button>
        </div>
      )}
      
      {results.map((result, resultIndex) => (
        <div key={resultIndex} className={styles.resultItem}>
          <div 
            className={`${styles.resultHeader} ${selectedResultIndex === resultIndex ? styles.activeResult : ''}`}
            onClick={() => handleResultClick(resultIndex)}
          >
            <h3>{result.file.name}</h3>
            <div className={styles.expandIcon}>
              <i className={`fas fa-chevron-${selectedResultIndex === resultIndex ? 'up' : 'down'}`}></i>
            </div>
          </div>
          
          {selectedResultIndex === resultIndex && (
            <div className={styles.pdfCardGrid}>
              {result.pdfs.map((pdfItem, pdfIndex) => (
                <div 
                  key={pdfIndex} 
                  className={styles.pdfCard}
                >
                  <div className={styles.pdfCardThumbnail}>
                    {!imageError[`${resultIndex}-${pdfIndex}`] ? (
                      <img 
                        src={getThumbnailUrl(pdfItem)}
                        alt={`${pdfItem.name} thumbnail`}
                        className={styles.thumbnailImage}
                        onError={() => handleImageError(resultIndex, pdfIndex)}
                        loading="lazy"
                      />
                    ) : (
                      <div className={styles.thumbnailPlaceholder}>
                        <i className="fas fa-file-pdf"></i>
                        <span>{pdfItem.name}</span>
                      </div>
                    )}
                  </div>
                  <div className={styles.pdfCardInfo}>
                    <span className={styles.pdfCardName}>{pdfItem.name}</span>
                    <div className={styles.pdfCardActions}>
                      <button 
                        className={styles.viewButton}
                        onClick={(e) => handleViewClick(e, resultIndex, pdfIndex)}
                        title="Preview PDF"
                      >
                        <i className="fas fa-eye"></i>
                      </button>
                      <button 
                        className={styles.downloadButton}
                        onClick={(e) => handleDownloadClick(e, resultIndex, pdfIndex)}
                        title="Download PDF"
                      >
                        <i className="fas fa-download"></i>
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      ))}
      
      {/* Fullscreen Preview Modal */}
      {fullscreenPreview && (
        <div className={styles.fullscreenModal}>
          <div className={styles.fullscreenModalHeader}>
            <h3>{fullscreenPreview.pdf.name}</h3>
            <button 
              className={styles.closeFullscreenButton}
              onClick={closeFullscreenPreview}
            >
              <i className="fas fa-times"></i>
            </button>
          </div>
          <div className={styles.fullscreenModalBody}>
            <iframe 
              src={fullscreenPreview.pdf.pdf} 
              className={styles.fullscreenPdfPreview} 
              title={`${fullscreenPreview.pdf.name} preview`}
            />
          </div>
        </div>
      )}
    </div>
  );
};

export default ResultsViewer;