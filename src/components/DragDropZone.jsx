import { useCallback, useState } from 'react';
import { useDropzone } from 'react-dropzone';
import { motion } from 'framer-motion';
import { isValidExcelFile } from '../utils/excelUtils';
import styles from './DragDropZone.module.css';

const DragDropZone = ({ onFilesAccepted }) => {
  const [error, setError] = useState(null);
  
  const onDrop = useCallback((acceptedFiles) => {
    // Reset any previous errors
    setError(null);
    
    // Filter only Excel files
    const excelFiles = acceptedFiles.filter(file => isValidExcelFile(file));
    
    if (excelFiles.length === 0) {
      setError('Please upload valid Excel files (.xls, .xlsx, .xlsm)');
      return;
    }
    
    // Pass the valid files to the parent component
    onFilesAccepted(excelFiles);
  }, [onFilesAccepted]);
  
  const { 
    getRootProps, 
    getInputProps, 
    isDragActive,
    isDragAccept,
    isDragReject
  } = useDropzone({
    onDrop,
    accept: {
      'application/vnd.ms-excel': ['.xls'],
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet': ['.xlsx'],
      'application/vnd.ms-excel.sheet.macroEnabled.12': ['.xlsm']
    },
    multiple: true
  });
  
  // Determine the dropzone state for styling
  let dropzoneState = 'default';
  if (isDragActive) dropzoneState = 'active';
  if (isDragAccept) dropzoneState = 'accept';
  if (isDragReject) dropzoneState = 'reject';
  
  return (
    <div className={styles.container}>
      <motion.div 
        {...getRootProps()} 
        className={`${styles.dropzone} ${styles[dropzoneState]}`}
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3 }}
        whileHover={{ scale: 1.01 }}
        whileTap={{ scale: 0.99 }}
      >
        <input {...getInputProps()} />
        
        <svg 
          className={styles.icon} 
          viewBox="0 0 24 24" 
          fill="none" 
          stroke="currentColor" 
          strokeWidth="2" 
          strokeLinecap="round" 
          strokeLinejoin="round"
        >
          <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
          <polyline points="17 8 12 3 7 8" />
          <line x1="12" y1="3" x2="12" y2="15" />
        </svg>
        
        <div className={styles.textContainer}>
          {isDragActive ? (
            <p>Drop the Excel files here...</p>
          ) : (
            <>
              <p className={styles.title}>Drag & drop your Excel files here</p>
              <p className={styles.subtitle}>or click to browse your files</p>
            </>
          )}
        </div>
      </motion.div>
      
      {error && (
        <motion.div 
          className={styles.error}
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3 }}
        >
          {error}
        </motion.div>
      )}
      
      <motion.div 
        className={styles.hint}
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.3, duration: 0.5 }}
      >
        <p>
          Each sheet will be converted to an A4 PDF page with all columns fitted on one page.
        </p>
      </motion.div>
    </div>
  );
};

export default DragDropZone;