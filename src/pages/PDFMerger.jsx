import React, { useState, useRef, useEffect } from 'react';
import { PDFDocument } from 'pdf-lib';
import styles from './PDFMerger.module.css';

const PDFMerger = () => {
  const [pdfFiles, setPdfFiles] = useState([]);
  const [pdfPageCounts, setPdfPageCounts] = useState({});
  const [mergedPdfUrl, setMergedPdfUrl] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);
  const [showPreviewModal, setShowPreviewModal] = useState(false);
  const fileInputRef = useRef(null);
  const dropAreaRef = useRef(null);

  // Handle file selection
  const handleFileChange = async (e) => {
    const files = Array.from(e.target.files).filter(file => file.type === 'application/pdf');
    if (files.length > 0) {
      setPdfFiles(prevFiles => [...prevFiles, ...files]);
      setMergedPdfUrl(null);
      setError(null);
      
      // Get page counts for each new file
      for (const file of files) {
        try {
          const pageCount = await getPageCount(file);
          setPdfPageCounts(prev => ({
            ...prev,
            [file.name]: pageCount
          }));
        } catch (err) {
          console.error(`Error getting page count for ${file.name}:`, err);
        }
      }
    }
  };

  // Get PDF page count
  const getPageCount = async (file) => {
    try {
      const arrayBuffer = await file.arrayBuffer();
      const pdf = await PDFDocument.load(arrayBuffer, { ignoreEncryption: true });
      return pdf.getPageCount();
    } catch (err) {
      console.error(`Error counting pages in ${file.name}:`, err);
      return 0;
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

  const handleDrop = async (e) => {
    e.preventDefault();
    dropAreaRef.current.classList.remove(styles.dragOver);
    
    const files = Array.from(e.dataTransfer.files).filter(file => file.type === 'application/pdf');
    if (files.length > 0) {
      setPdfFiles(prevFiles => [...prevFiles, ...files]);
      setMergedPdfUrl(null);
      setError(null);
      
      // Get page counts for each new file
      for (const file of files) {
        try {
          const pageCount = await getPageCount(file);
          setPdfPageCounts(prev => ({
            ...prev,
            [file.name]: pageCount
          }));
        } catch (err) {
          console.error(`Error getting page count for ${file.name}:`, err);
        }
      }
    } else {
      setError('Please drop PDF files only.');
    }
  };

  // Remove a PDF from the list
  const removePdf = (index) => {
    const fileToRemove = pdfFiles[index];
    setPdfFiles(prevFiles => prevFiles.filter((_, i) => i !== index));
    setMergedPdfUrl(null);
    
    // Remove page count for the removed file
    setPdfPageCounts(prev => {
      const newCounts = {...prev};
      delete newCounts[fileToRemove.name];
      return newCounts;
    });
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
      const failedFiles = [];
      
      for (const file of pdfFiles) {
        let fileProcessed = false;
        
        try {
          const fileBytes = await file.arrayBuffer();
          // Attempt to load with ignoreEncryption
          const pdfDoc = await PDFDocument.load(fileBytes, { 
            ignoreEncryption: true 
          });
          
          // Check if the PDF is still encrypted and try to decrypt with an empty password
          if (pdfDoc.isEncrypted()) {
            try {
              await pdfDoc.decrypt(''); // Attempt to decrypt with an empty password
            } catch (decryptError) {
              console.warn(`Could not decrypt ${file.name} with empty password:`, decryptError);
              // If decryption fails, proceed with potentially encrypted (but printable) pages
            }
          }
          
          // Copy pages if the document is loaded (even if still encrypted but printable)
          const copiedPages = await mergedPdf.copyPages(pdfDoc, pdfDoc.getPageIndices());
          if (copiedPages.length > 0) {
            copiedPages.forEach(page => mergedPdf.addPage(page));
            fileProcessed = true;
          } else {
            // If no pages are copied, it's likely an issue with the PDF structure or strong encryption
            throw new Error('No pages could be copied from this PDF, it might be heavily encrypted or corrupted.');
          }
        } catch (err) {
          console.error(`Error processing ${file.name}:`, err);
          failedFiles.push(file.name);
          
          // Create a placeholder page with a detailed error message
          try {
            const placeholderPage = mergedPdf.addPage([600, 800]);
            const { width, height } = placeholderPage.getSize();
            
            placeholderPage.drawText(`Error: Could not process file "${file.name}"`, {
              x: 50,
              y: height - 100,
              size: 16,
              color: { r: 0.77, g: 0.1, b: 0.1 } // Red color for error
            });
            
            placeholderPage.drawText('This PDF may be encrypted or corrupted.', {
              x: 50,
              y: height - 130,
              size: 12,
              color: { r: 0, g: 0, b: 0 } // Black color for details
            });
            
            placeholderPage.drawText('Please try removing password protection or using a different file.', {
              x: 50,
              y: height - 160,
              size: 12,
              color: { r: 0, g: 0, b: 0 }
            });
            fileProcessed = true; // Mark as processed since a placeholder is added
          } catch (placeholderErr) {
            console.error(`Error creating placeholder for ${file.name}:`, placeholderErr);
          }
        }
        
        if (!fileProcessed) {
          // This case should ideally not be reached if placeholders are correctly added
          failedFiles.push(file.name);
        }
      }
      
      if (mergedPdf.getPageCount() === 0 && pdfFiles.length > 0) {
        // If all files failed and no placeholders were added, this is a more general error
        throw new Error('No pages could be processed from the provided PDFs. All files may be unreadable.');
      }
      
      const mergedPdfBytes = await mergedPdf.save();
      const blob = new Blob([mergedPdfBytes], { type: 'application/pdf' });
      const url = URL.createObjectURL(blob);
      
      setMergedPdfUrl(url);
      
      if (failedFiles.length > 0) {
        if (failedFiles.length === pdfFiles.length) {
          setError(`All files had issues. Placeholder pages were created for: ${failedFiles.join(', ')}`);
        } else {
          setError(`Some files had issues. Placeholder pages were created for: ${failedFiles.join(', ')}`);
        }
      }
      
      setIsLoading(false);
      setShowPreviewModal(true);
    } catch (err) {
      console.error('Error merging PDFs:', err);
      setError(`Error merging PDFs: ${err.message}. Please try again with different files.`);
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
          <div className={styles.fileListHeader}>
            <h3>Selected Files ({pdfFiles.length})</h3>
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
          </div>
          
          <ul className={styles.fileItemList}>
            {pdfFiles.map((file, index) => (
              <li 
                key={index} 
                className={`${styles.fileItem} ${
                  pdfPageCounts[file.name] > 10 ? styles.fileItemLarge : styles.fileItemSmall
                }`}
              >
                <div className={styles.fileInfo}>
                  <i className="fas fa-file-pdf"></i>
                  <span className={styles.fileName}>{file.name}</span>
                  <span className={styles.pageCount}>
                    {pdfPageCounts[file.name] !== undefined ? 
                      `${pdfPageCounts[file.name]} pages` : 
                      'Counting...'}
                  </span>
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