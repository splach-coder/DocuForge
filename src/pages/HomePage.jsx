import { useState, useCallback, useRef } from 'react';
import { motion } from 'framer-motion';
import DragDropZone from '../components/DragDropZone';
import FileList from '../components/FileList';
import ResultsViewer from '../components/ResultsViewer';
import { readExcelFile, convertToPdf } from '../utils/excelUtils';
import { generatePDFThumbnail, savePDF, generateCombinedPDF } from '../utils/pdfUtils';
import styles from './HomePage.module.css';

const HomePage = () => {
  const [files, setFiles] = useState([]);
  const [processingStatus, setProcessingStatus] = useState({});
  const [results, setResults] = useState([]);
  const [isProcessing, setIsProcessing] = useState(false);
  const [previewModal, setPreviewModal] = useState({
    isOpen: false,
    pdfUrl: '',
    title: ''
  });
  
  const handleFilesAccepted = (acceptedFiles) => {
    setFiles(prevFiles => [...prevFiles, ...acceptedFiles]);
    
    const initialStatus = {};
    acceptedFiles.forEach(file => {
      initialStatus[file.name] = 'pending';
    });
    
    setProcessingStatus(prevStatus => ({
      ...prevStatus,
      ...initialStatus
    }));
  };
  
  const handleRemoveFile = (index) => {
    setFiles(prevFiles => {
      const newFiles = [...prevFiles];
      const fileToRemove = newFiles[index];
      
      newFiles.splice(index, 1);
      
      setProcessingStatus(prevStatus => {
        const newStatus = { ...prevStatus };
        delete newStatus[fileToRemove.name];
        return newStatus;
      });
      
      setResults(prevResults => {
        return prevResults.filter(result => result.file !== fileToRemove);
      });
      
      return newFiles;
    });
  };
  
  const processFiles = useCallback(async () => {
    if (files.length === 0 || isProcessing) return;
    
    setIsProcessing(true);
    
    for (const file of files) {
      if (processingStatus[file.name] === 'completed') continue;
      
      try {
        setProcessingStatus(prevStatus => ({
          ...prevStatus,
          [file.name]: 'processing'
        }));
        
        // Get sheets with HTML data
        const sheets = await readExcelFile(file);
        
        if (sheets.length === 0) {
          throw new Error('No valid sheets found in the Excel file');
        }
        
        const pdfs = [];
        
        // Convert each sheet to PDF
        for (const sheet of sheets) {
          try {
            // Pass fitToPage option to ensure all columns fit on one page
            const pdf = await convertToPdf(sheet, { fitToPage: true });
            
            // Create a simple thumbnail
            const thumbnail = pdf;
            
            pdfs.push({
              name: sheet.name,
              pdf,
              thumbnail
            });
          } catch (sheetError) {
            console.error(`Error processing sheet ${sheet.name}:`, sheetError);
          }
        }
        
        if (pdfs.length > 0) {
          setResults(prevResults => [
            ...prevResults,
            {
              file,
              pdfs
            }
          ]);
          
          setProcessingStatus(prevStatus => ({
            ...prevStatus,
            [file.name]: 'completed'
          }));
        } else {
          throw new Error('Failed to convert any sheets to PDF');
        }
      } catch (error) {
        console.error(`Error processing file ${file.name}:`, error);
        
        setProcessingStatus(prevStatus => ({
          ...prevStatus,
          [file.name]: 'error'
        }));
      }
    }
    
    setIsProcessing(false);
  }, [files, processingStatus, isProcessing]);
  
  const handleDownload = (resultIndex, pdfIndex) => {
    const result = results[resultIndex];
    const pdfItem = result.pdfs[pdfIndex];
    const filename = `${result.file.name.replace(/\.[^/.]+$/, '')}_${pdfItem.name}.pdf`;
    
    // Direct download using data URL
    const link = document.createElement('a');
    link.href = pdfItem.pdf;
    link.download = filename;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };
  
  const handleView = (resultIndex, pdfIndex) => {
    const result = results[resultIndex];
    const pdfItem = result.pdfs[pdfIndex];
    
    // Open PDF in modal
    setPreviewModal({
      isOpen: true,
      pdfUrl: pdfItem.pdf,
      title: `${result.file.name} - ${pdfItem.name}`
    });
  };
  
  const closePreviewModal = () => {
    setPreviewModal({
      isOpen: false,
      pdfUrl: '',
      title: ''
    });
  };
  
  const handleDownloadAll = () => {
    results.forEach(result => {
      result.pdfs.forEach((pdfItem, index) => {
        setTimeout(() => {
          const filename = `${result.file.name.replace(/\.[^/.]+$/, '')}_${pdfItem.name}.pdf`;
          
          // Direct download using data URL
          const link = document.createElement('a');
          link.href = pdfItem.pdf;
          link.download = filename;
          document.body.appendChild(link);
          link.click();
          document.body.removeChild(link);
        }, index * 300);
      });
    });
  };
  
  const handleDownloadCombined = async () => {
    if (results.length === 0) return;
    
    try {
      // Show loading indicator
      setIsProcessing(true);
      
      // Import PDF.js library for better PDF handling
      const { PDFDocument } = await import('pdf-lib');
      
      // Create a new PDF document
      const mergedPdf = await PDFDocument.create();
      
      // For each PDF in results
      for (let i = 0; i < results.length; i++) {
        const result = results[i];
        
        for (let j = 0; j < result.pdfs.length; j++) {
          const pdfItem = result.pdfs[j];
          
          try {
            // Convert data URL to ArrayBuffer
            const dataUrlParts = pdfItem.pdf.split(',');
            const base64Data = dataUrlParts[1];
            const pdfBytes = Uint8Array.from(atob(base64Data), c => c.charCodeAt(0));
            
            // Load the PDF document
            const pdfDoc = await PDFDocument.load(pdfBytes.buffer);
            
            // Get all pages
            const pages = await mergedPdf.copyPages(pdfDoc, pdfDoc.getPageIndices());
            
            // Add each page to the merged PDF
            pages.forEach(page => {
              mergedPdf.addPage(page);
            });
          } catch (pdfError) {
            console.error(`Error adding PDF to combined document: ${pdfError.message}`);
          }
        }
      }
      
      // Save the merged PDF
      const mergedPdfBytes = await mergedPdf.save();
      
      // Convert to data URL for download
      const blob = new Blob([mergedPdfBytes], { type: 'application/pdf' });
      const url = URL.createObjectURL(blob);
      
      // Create download link
      const link = document.createElement('a');
      link.href = url;
      link.download = 'combined_excel_sheets.pdf';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      
      // Clean up
      URL.revokeObjectURL(url);
      setIsProcessing(false);
    } catch (error) {
      console.error('Error generating combined PDF:', error);
      alert('There was an error creating the combined PDF. Please try again.');
      setIsProcessing(false);
    }
  };
  
  return (
    <div className={styles.container}>
      <motion.div 
        className={styles.hero}
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
      >
        <h1>Excel to PDF Converter</h1>
        <p className={styles.subtitle}>
          Convert Excel sheets to print-ready PDF documents. Each sheet becomes a page in the PDF, with all columns fitted to a single A4 page.
        </p>
      </motion.div>
      
      <DragDropZone onFilesAccepted={handleFilesAccepted} />
      
      <FileList 
        files={files} 
        onRemove={handleRemoveFile} 
        processingStatus={processingStatus} 
      />
      
      {files.length > 0 && (
        <div className={styles.actionsContainer}>
          <button 
            className={`${styles.processButton} ${isProcessing ? styles.processing : ''}`}
            onClick={processFiles}
            disabled={isProcessing || files.length === 0}
          >
            {isProcessing ? (
              <>
                <div className={styles.spinner}></div>
                Processing...
              </>
            ) : (
              'Convert to PDF'
            )}
          </button>
          
          {results.length > 0 && (
            <button 
              className={`${styles.downloadAllButton} button-secondary`}
              onClick={handleDownloadCombined}
            >
              Download Combined PDF
            </button>
          )}
        </div>
      )}
      
      <ResultsViewer 
        results={results} 
        onDownload={handleDownload} 
        onDownloadAll={handleDownloadAll}
        onView={handleView}
      />
      
      {/* PDF Preview Modal */}
      {previewModal.isOpen && (
        <div className={styles.modalOverlay} onClick={closePreviewModal}>
          <div className={styles.modalContent} onClick={e => e.stopPropagation()}>
            <div className={styles.modalHeader}>
              <h3>{previewModal.title}</h3>
              <button className={styles.closeButton} onClick={closePreviewModal}>×</button>
            </div>
            <div className={styles.modalBody}>
              <iframe 
                src={previewModal.pdfUrl} 
                title="PDF Preview" 
                className={styles.pdfPreview}
              />
            </div>
            <div className={styles.modalFooter}>
              <button 
                className={styles.downloadButton}
                onClick={() => {
                  const link = document.createElement('a');
                  link.href = previewModal.pdfUrl;
                  link.download = `${previewModal.title}.pdf`;
                  document.body.appendChild(link);
                  link.click();
                  document.body.removeChild(link);
                }}
              >
                Download
              </button>
              <button 
                className={styles.closeModalButton}
                onClick={closePreviewModal}
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default HomePage;

// Enhanced Excel to PDF conversion with style preservation
const convertExcelToPdf = async (file) => {
  setIsProcessing(true);
  setError(null);
  
  try {
    // Create a FormData object to send the file to the server
    const formData = new FormData();
    formData.append('excelFile', file);
    formData.append('preserveStyles', true); // Add option to preserve styles
    formData.append('maintainImages', true); // Add option to maintain images
    formData.append('keepLayout', true);     // Add option to keep layout
    
    // Simulate processing with a server-side conversion
    // In a real implementation, you would send this to your backend
    await new Promise(resolve => setTimeout(resolve, 2000));
    
    // For demonstration, we'll use a mock result
    // In a real implementation, you would get the PDF from your server response
    const results = {
      file,
      pdfs: Array(Math.floor(Math.random() * 3) + 1).fill(0).map((_, index) => ({
        name: `${file.name.replace(/\.[^/.]+$/, '')}_sheet${index + 1}.pdf`,
        pdf: 'https://www.w3.org/WAI/ER/tests/xhtml/testfiles/resources/pdf/dummy.pdf', // Placeholder PDF URL
        thumbnail: 'https://www.w3.org/WAI/ER/tests/xhtml/testfiles/resources/pdf/dummy.pdf#page=1'
      }))
    };
    
    onConversion([results]);
    setIsProcessing(false);
  } catch (err) {
    console.error('Error processing file:', err);
    setError('Error processing file. Please try again.');
    setIsProcessing(false);
  }
};