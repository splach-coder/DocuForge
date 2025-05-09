import React, { useState, useRef } from 'react';
import { PDFDocument } from 'pdf-lib';
import styles from './PDFMerger.module.css';

const PDFMerger = () => {
  const [pdfFiles, setPdfFiles] = useState([]);
  const [mergedPdfUrl, setMergedPdfUrl] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);
  const [showPreviewModal, setShowPreviewModal] = useState(false);
  const fileInputRef = useRef(null);
  const dropAreaRef = useRef(null);

  // Handle file selection
  const handleFileChange = (e) => {
    const files = Array.from(e.target.files).filter(file => file.type === 'application/pdf');
    if (files.length > 0) {
      setPdfFiles(prevFiles => [...prevFiles, ...files]);
      setMergedPdfUrl(null);
      setError(null);
    }
  };

  // Handle drag and drop
  const handleDragOver = (e) => {
    e.preventDefault();
    dropAreaRef.current.classList.add(styles.dragOver);
  };

  const handleDragLeave = () => {
    dropAreaRef.current.classList.remove(styles.dragOver);
  };

  const handleDrop = (e) => {
    e.preventDefault();
    dropAreaRef.current.classList.remove(styles.dragOver);
    
    const files = Array.from(e.dataTransfer.files).filter(file => file.type === 'application/pdf');
    if (files.length > 0) {
      setPdfFiles(prevFiles => [...prevFiles, ...files]);
      setMergedPdfUrl(null);
      setError(null);
    } else {
      setError('Please drop PDF files only.');
    }
  };

  // Remove a PDF from the list
  const removePdf = (index) => {
    setPdfFiles(prevFiles => prevFiles.filter((_, i) => i !== index));
    setMergedPdfUrl(null);
  };

  // Reorder PDFs
  const movePdf = (index, direction) => {
    const newFiles = [...pdfFiles];
    const newIndex = index + direction;
    
    if (newIndex >= 0 && newIndex < newFiles.length) {
      [newFiles[index], newFiles[newIndex]] = [newFiles[newIndex], newFiles[index]];
      setPdfFiles(newFiles);
      setMergedPdfUrl(null);
    }
  };

  // Merge PDFs
  const mergePdfs = async () => {
    if (pdfFiles.length === 0) {
      setError('Please add at least one PDF file.');
      return;
    }

    setIsLoading(true);
    setError(null);
    
    try {
      const mergedPdf = await PDFDocument.create();
      
      for (const file of pdfFiles) {
        try {
          const fileBytes = await file.arrayBuffer();
          // Add ignoreEncryption option to handle encrypted PDFs
          const pdfDoc = await PDFDocument.load(fileBytes, { 
            ignoreEncryption: true 
          });
          const copiedPages = await mergedPdf.copyPages(pdfDoc, pdfDoc.getPageIndices());
          copiedPages.forEach(page => mergedPdf.addPage(page));
        } catch (err) {
          console.error(`Error processing file ${file.name}:`, err);
          setError(`Error processing file ${file.name}. It may be corrupted or heavily encrypted.`);
        }
      }
      
      if (mergedPdf.getPageCount() === 0) {
        throw new Error('No pages could be processed from the provided PDFs.');
      }
      
      const mergedPdfBytes = await mergedPdf.save();
      const blob = new Blob([mergedPdfBytes], { type: 'application/pdf' });
      const url = URL.createObjectURL(blob);
      
      setMergedPdfUrl(url);
      setIsLoading(false);
      // Automatically show the preview modal when merging is complete
      setShowPreviewModal(true);
    } catch (err) {
      console.error('Error merging PDFs:', err);
      setError('Error merging PDFs. Please try again with different files.');
      setIsLoading(false);
    }
  };

  // Download merged PDF
  const downloadMergedPdf = () => {
    if (!mergedPdfUrl) return;
    
    const link = document.createElement('a');
    link.href = mergedPdfUrl;
    link.download = 'merged-document.pdf';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // Close the preview modal
  const closePreviewModal = () => {
    setShowPreviewModal(false);
  };

  return (
    <div className={styles.pdfMergerContainer}>
      <h1 className={styles.title}>PDF Merger</h1>
      <p className={styles.description}>
        Combine multiple PDFs into a single document. Drag and drop your files or click to browse.
      </p>
      
      <div 
        className={styles.dropArea} 
        ref={dropAreaRef}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
        onClick={() => fileInputRef.current.click()}
      >
        <i className="fas fa-file-pdf"></i>
        <p>Drag & drop PDF files here or click to browse</p>
        <input 
          type="file" 
          ref={fileInputRef}
          onChange={handleFileChange}
          accept=".pdf"
          multiple
          style={{ display: 'none' }}
        />
      </div>
      
      {error && <div className={styles.error}>{error}</div>}
      
      {pdfFiles.length > 0 && (
        <div className={styles.fileList}>
          <h3>Selected Files ({pdfFiles.length})</h3>
          <ul>
            {pdfFiles.map((file, index) => (
              <li key={index} className={styles.fileItem}>
                <div className={styles.fileInfo}>
                  <i className="fas fa-file-pdf"></i>
                  <span className={styles.fileName}>{file.name}</span>
                </div>
                <div className={styles.fileActions}>
                  {index > 0 && (
                    <button 
                      className={styles.actionButton} 
                      onClick={() => movePdf(index, -1)}
                      title="Move up"
                    >
                      <i className="fas fa-arrow-up"></i>
                    </button>
                  )}
                  {index < pdfFiles.length - 1 && (
                    <button 
                      className={styles.actionButton} 
                      onClick={() => movePdf(index, 1)}
                      title="Move down"
                    >
                      <i className="fas fa-arrow-down"></i>
                    </button>
                  )}
                  <button 
                    className={styles.actionButton} 
                    onClick={() => removePdf(index)}
                    title="Remove"
                  >
                    <i className="fas fa-times"></i>
                  </button>
                </div>
              </li>
            ))}
          </ul>
          
          <div className={styles.mergeActions}>
            <button 
              className={styles.mergeButton} 
              onClick={mergePdfs}
              disabled={isLoading}
            >
              {isLoading ? (
                <>
                  <i className="fas fa-spinner fa-spin"></i>
                  Merging...
                </>
              ) : (
                <>
                  <i className="fas fa-object-group"></i>
                  Merge PDFs
                </>
              )}
            </button>
            
            {mergedPdfUrl && (
              <button 
                className={styles.downloadButton} 
                onClick={downloadMergedPdf}
              >
                <i className="fas fa-download"></i>
                Download Merged PDF
              </button>
            )}
          </div>
        </div>
      )}
      
      {/* Preview Modal */}
      {showPreviewModal && mergedPdfUrl && (
        <div className={styles.previewModal}>
          <div className={styles.previewModalContent}>
            <div className={styles.previewModalHeader}>
              <h2>Merged PDF Preview</h2>
              <button 
                className={styles.closeModalButton}
                onClick={closePreviewModal}
              >
                <i className="fas fa-times"></i>
              </button>
            </div>
            <div className={styles.previewModalBody}>
              <iframe 
                src={mergedPdfUrl} 
                className={styles.modalPdfPreview} 
                title="Merged PDF Preview"
              />
            </div>
            <div className={styles.previewModalFooter}>
              <button 
                className={styles.downloadButton} 
                onClick={downloadMergedPdf}
              >
                <i className="fas fa-download"></i>
                Download Merged PDF
              </button>
              <button 
                className={styles.closeButton} 
                onClick={closePreviewModal}
              >
                Close Preview
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default PDFMerger;