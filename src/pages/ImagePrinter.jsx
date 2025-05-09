import React, { useState, useRef, useEffect } from 'react';
import { motion } from 'framer-motion';
import { mergeImagesToPDF, generateImageThumbnail } from '../utils/imageUtils';
import styles from './ImagePrinter.module.css';

const ImagePrinter = () => {
  const [imageFiles, setImageFiles] = useState([]);
  const [mergedPdfUrl, setMergedPdfUrl] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);
  const [showPreviewModal, setShowPreviewModal] = useState(false);
  const [imagePreviews, setImagePreviews] = useState([]);
  const fileInputRef = useRef(null);
  const dropAreaRef = useRef(null);

  // Generate image previews when files change
  useEffect(() => {
    const generatePreviews = async () => {
      const previews = [];
      for (const file of imageFiles) {
        try {
          const thumbnail = await generateImageThumbnail(file);
          previews.push({
            name: file.name,
            thumbnail,
            file
          });
        } catch (err) {
          console.error(`Error generating preview for ${file.name}:`, err);
        }
      }
      setImagePreviews(previews);
    };

    if (imageFiles.length > 0) {
      generatePreviews();
    } else {
      setImagePreviews([]);
    }
  }, [imageFiles]);

  // Handle file selection
  const handleFileChange = (e) => {
    const files = Array.from(e.target.files).filter(file => 
      file.type.startsWith('image/')
    );
    
    if (files.length > 0) {
      setImageFiles(prevFiles => [...prevFiles, ...files]);
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
    
    const files = Array.from(e.dataTransfer.files).filter(file => 
      file.type.startsWith('image/')
    );
    
    if (files.length > 0) {
      setImageFiles(prevFiles => [...prevFiles, ...files]);
      setMergedPdfUrl(null);
      setError(null);
    } else {
      setError('Please drop image files only.');
    }
  };

  // Remove an image from the list
  const removeImage = (index) => {
    setImageFiles(prevFiles => prevFiles.filter((_, i) => i !== index));
    setMergedPdfUrl(null);
  };

  // Reorder images
  const moveImage = (index, direction) => {
    const newFiles = [...imageFiles];
    const newIndex = index + direction;
    
    if (newIndex >= 0 && newIndex < newFiles.length) {
      [newFiles[index], newFiles[newIndex]] = [newFiles[newIndex], newFiles[index]];
      setImageFiles(newFiles);
      setMergedPdfUrl(null);
    }
  };

  // Merge images into PDF
  const mergeImages = async () => {
    if (imageFiles.length === 0) {
      setError('Please add at least one image file.');
      return;
    }

    setIsLoading(true);
    setError(null);
    
    try {
      const mergedPdf = await mergeImagesToPDF(imageFiles);
      
      const pdfBlob = mergedPdf.output('blob');
      const url = URL.createObjectURL(pdfBlob);
      
      setMergedPdfUrl(url);
      setShowPreviewModal(true);
    } catch (err) {
      console.error('Error merging images:', err);
      setError('Error merging images. Please try again with different files.');
    } finally {
      setIsLoading(false);
    }
  };

  // Download merged PDF
  const downloadMergedPdf = () => {
    if (!mergedPdfUrl) return;
    
    const link = document.createElement('a');
    link.href = mergedPdfUrl;
    link.download = 'merged-images.pdf';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // Close the preview modal
  const closePreviewModal = () => {
    setShowPreviewModal(false);
  };

  return (
    <div className={styles.imagePrinterContainer}>
      <h1 className={styles.title}>Image Printer</h1>
      <p className={styles.description}>
        Convert and combine multiple images into a single printable PDF document.
      </p>
      
      <div 
        className={styles.dropArea} 
        ref={dropAreaRef}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
        onClick={() => fileInputRef.current.click()}
      >
        <i className="fas fa-images"></i>
        <p>Drag & drop image files here or click to browse</p>
        <input 
          type="file" 
          ref={fileInputRef}
          onChange={handleFileChange}
          accept="image/*"
          multiple
          style={{ display: 'none' }}
        />
      </div>
      
      {error && (
        <div className={styles.error}>
          <i className="fas fa-exclamation-circle"></i> {error}
        </div>
      )}
      
      {imageFiles.length > 0 && (
        <div className={styles.fileListContainer}>
          <div className={styles.fileListHeader}>
            <h2>Images ({imageFiles.length})</h2>
            <button 
              className={`${styles.mergeButton} ${isLoading ? styles.loading : ''}`}
              onClick={mergeImages}
              disabled={isLoading || imageFiles.length === 0}
            >
              {isLoading ? (
                <>
                  <div className={styles.spinner}></div>
                  Processing...
                </>
              ) : (
                <>
                  <i className="fas fa-file-pdf"></i>
                  Create PDF
                </>
              )}
            </button>
          </div>
          
          <p className={styles.hint}>Drag images to reorder them in the final PDF</p>
          
          <div className={styles.fileList}>
            {imagePreviews.map((preview, index) => (
              <motion.div 
                key={`${preview.name}-${index}`}
                className={styles.fileItem}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.3, delay: index * 0.05 }}
                drag="y"
                dragConstraints={{ top: 0, bottom: 0 }}
                onDragEnd={(_, info) => {
                  if (info.offset.y < -50 && index > 0) {
                    moveImage(index, -1);
                  } else if (info.offset.y > 50 && index < imageFiles.length - 1) {
                    moveImage(index, 1);
                  }
                }}
              >
                <div className={styles.imagePreview}>
                  {preview.thumbnail ? (
                    <img 
                      src={preview.thumbnail} 
                      alt={preview.name} 
                      className={styles.thumbnailImage}
                    />
                  ) : (
                    <div className={styles.thumbnailPlaceholder}>
                      <i className="fas fa-image"></i>
                    </div>
                  )}
                </div>
                
                <div className={styles.fileInfo}>
                  <span className={styles.fileName}>{preview.name}</span>
                  <span className={styles.fileSize}>{formatFileSize(imageFiles[index].size)}</span>
                </div>
                
                <div className={styles.fileActions}>
                  <button 
                    className={styles.moveUpButton}
                    onClick={() => moveImage(index, -1)}
                    disabled={index === 0}
                    title="Move up"
                  >
                    <i className="fas fa-arrow-up"></i>
                  </button>
                  <button 
                    className={styles.moveDownButton}
                    onClick={() => moveImage(index, 1)}
                    disabled={index === imageFiles.length - 1}
                    title="Move down"
                  >
                    <i className="fas fa-arrow-down"></i>
                  </button>
                  <button 
                    className={styles.removeButton}
                    onClick={() => removeImage(index)}
                    title="Remove"
                  >
                    <i className="fas fa-times"></i>
                  </button>
                </div>
              </motion.div>
            ))}
          </div>
          
          {/* Remove the actionsContainer div since we moved the button to the top */}
        </div>
      )}
      
      {/* Preview Modal */}
      {showPreviewModal && mergedPdfUrl && (
        <div className={styles.modalOverlay}>
          <div className={styles.modalContent}>
            <div className={styles.modalHeader}>
              <h3>PDF Preview</h3>
              <button 
                className={styles.closeButton}
                onClick={closePreviewModal}
              >
                ×
              </button>
            </div>
            <div className={styles.modalBody}>
              <iframe 
                src={mergedPdfUrl} 
                className={styles.pdfPreview} 
                title="PDF Preview"
              />
            </div>
            <div className={styles.modalFooter}>
              <button 
                className={styles.downloadButton}
                onClick={downloadMergedPdf}
              >
                <i className="fas fa-download"></i> Download PDF
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

// Helper function to format file size
const formatFileSize = (bytes) => {
  if (bytes === 0) return '0 Bytes';
  const k = 1024;
  const sizes = ['Bytes', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
};

export default ImagePrinter;