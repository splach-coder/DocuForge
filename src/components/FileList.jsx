import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import styles from './FileList.module.css';

const FileList = ({ files, onRemove, processingStatus }) => {
  const [expandedIndex, setExpandedIndex] = useState(null);
  
  if (!files || files.length === 0) {
    return null;
  }
  
  const toggleExpand = (index) => {
    setExpandedIndex(expandedIndex === index ? null : index);
  };
  
  return (
    <motion.div 
      className={styles.container}
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4 }}
    >
      <h3 className={styles.title}>Files ({files.length})</h3>
      
      <ul className={styles.fileList}>
        <AnimatePresence>
          {files.map((file, index) => {
            const status = processingStatus[file.name] || 'pending';
            const isExpanded = expandedIndex === index;
            
            return (
              <motion.li 
                key={`${file.name}-${index}`}
                className={`${styles.fileItem} ${styles[status]}`}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, height: 0, marginBottom: 0 }}
                transition={{ duration: 0.3, delay: index * 0.05 }}
                layout
              >
                <div className={styles.fileHeader} onClick={() => toggleExpand(index)}>
                  <div className={styles.fileInfo}>
                    <svg 
                      className={styles.fileIcon} 
                      viewBox="0 0 24 24" 
                      fill="none" 
                      stroke="currentColor" 
                      strokeWidth="2" 
                      strokeLinecap="round" 
                      strokeLinejoin="round"
                    >
                      <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
                      <polyline points="14 2 14 8 20 8" />
                      <line x1="16" y1="13" x2="8" y2="13" />
                      <line x1="16" y1="17" x2="8" y2="17" />
                      <polyline points="10 9 9 9 8 9" />
                    </svg>
                    <div>
                      <div className={styles.fileName}>{file.name}</div>
                      <div className={styles.fileSize}>{formatFileSize(file.size)}</div>
                    </div>
                  </div>
                  
                  <div className={styles.actions}>
                    {status === 'pending' && (
                      <span className={styles.statusBadge}>Pending</span>
                    )}
                    {status === 'processing' && (
                      <div className={styles.spinner}></div>
                    )}
                    {status === 'completed' && (
                      <span className={`${styles.statusBadge} ${styles.completed}`}>Done</span>
                    )}
                    {status === 'error' && (
                      <span className={`${styles.statusBadge} ${styles.error}`}>Failed</span>
                    )}
                    
                    <button 
                      className={styles.removeButton}
                      onClick={(e) => {
                        e.stopPropagation();
                        onRemove(index);
                      }}
                      aria-label="Remove file"
                    >
                      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <line x1="18" y1="6" x2="6" y2="18"></line>
                        <line x1="6" y1="6" x2="18" y2="18"></line>
                      </svg>
                    </button>
                    
                    <div 
                      className={`${styles.expandIcon} ${isExpanded ? styles.expanded : ''}`}
                      aria-hidden="true"
                    >
                      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <polyline points="6 9 12 15 18 9"></polyline>
                      </svg>
                    </div>
                  </div>
                </div>
                
                <AnimatePresence>
                  {isExpanded && (
                    <motion.div 
                      className={styles.details}
                      initial={{ height: 0, opacity: 0 }}
                      animate={{ height: 'auto', opacity: 1 }}
                      exit={{ height: 0, opacity: 0 }}
                      transition={{ duration: 0.3 }}
                    >
                      <div className={styles.detailsContent}>
                        <p>
                          <strong>Type:</strong> {file.type || 'application/vnd.ms-excel'}
                        </p>
                        <p>
                          <strong>Last Modified:</strong> {new Date(file.lastModified).toLocaleString()}
                        </p>
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </motion.li>
            );
          })}
        </AnimatePresence>
      </ul>
    </motion.div>
  );
};

const formatFileSize = (bytes) => {
  if (bytes === 0) return '0 Bytes';
  const k = 1024;
  const sizes = ['Bytes', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
};

export default FileList;