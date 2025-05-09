import React, { useState, useRef } from 'react';
import styles from './FileUpload.module.css';

const FileUpload = ({ onConversion }) => {
  const [isDragging, setIsDragging] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [error, setError] = useState(null);
  const fileInputRef = useRef(null);
  const dropAreaRef = useRef(null);

  const handleDragOver = (e) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = () => {
    setIsDragging(false);
  };

  const handleDrop = (e) => {
    e.preventDefault();
    setIsDragging(false);
    
    const files = Array.from(e.dataTransfer.files).filter(
      file => file.type === 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' || 
             file.type === 'application/vnd.ms-excel'
    );
    
    if (files.length > 0) {
      processFiles(files);
    } else {
      setError('Please drop Excel files only (.xlsx or .xls)');
    }
  };

  const handleFileSelect = (e) => {
    const files = Array.from(e.target.files);
    if (files.length > 0) {
      processFiles(files);
    }
  };

  const processFiles = async (files) => {
    setIsProcessing(true);
    setError(null);
    
    try {
      // Simulate processing time
      await new Promise(resolve => setTimeout(resolve, 1500));
      
      // Mock conversion result
      const results = files.map(file => ({
        file,
        pdfs: Array(Math.floor(Math.random() * 3) + 1).fill(0).map((_, index) => ({
          name: `${file.name.replace(/\.[^/.]+$/, '')}_sheet${index + 1}.pdf`,
          pdf: 'https://www.w3.org/WAI/ER/tests/xhtml/testfiles/resources/pdf/dummy.pdf', // Placeholder PDF URL
          thumbnail: 'https://www.w3.org/WAI/ER/tests/xhtml/testfiles/resources/pdf/dummy.pdf#page=1'
        }))
      }));
      
      onConversion(results);
      setIsProcessing(false);
    } catch (err) {
      console.error('Error processing files:', err);
      setError('Error processing files. Please try again.');
      setIsProcessing(false);
    }
  };

  const handleClick = () => {
    fileInputRef.current.click();
  };

  return (
    <div className={styles.container}>
      <h1 className={styles.title}>Excel to PDF Converter</h1>
      <p className={styles.description}>
        Convert your Excel spreadsheets to PDF documents in seconds.
      </p>
      
      <div 
        ref={dropAreaRef}
        className={`${styles.dropArea} ${isDragging ? styles.dragging : ''} ${isProcessing ? styles.processing : ''}`}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
        onClick={handleClick}
      >
        {isProcessing ? (
          <div className={styles.processingContent}>
            <div className={styles.spinner}></div>
            <p>Converting your files...</p>
          </div>
        ) : (
          <div className={styles.dropContent}>
            <i className="fas fa-file-excel"></i>
            <h3>Drag & Drop Excel Files Here</h3>
            <p>or click to browse</p>
          </div>
        )}
        
        <input 
          type="file" 
          ref={fileInputRef}
          onChange={handleFileSelect}
          accept=".xlsx,.xls"
          multiple
          style={{ display: 'none' }}
        />
      </div>
      
      {error && <div className={styles.error}>{error}</div>}
      
      <div className={styles.features}>
        <div className={styles.feature}>
          <i className="fas fa-bolt"></i>
          <h3>Fast Conversion</h3>
          <p>Convert Excel files to PDF in seconds</p>
        </div>
        <div className={styles.feature}>
          <i className="fas fa-layer-group"></i>
          <h3>Batch Processing</h3>
          <p>Convert multiple files at once</p>
        </div>
        <div className={styles.feature}>
          <i className="fas fa-lock"></i>
          <h3>Secure</h3>
          <p>Your files are processed locally</p>
        </div>
      </div>
    </div>
  );
};

export default FileUpload;