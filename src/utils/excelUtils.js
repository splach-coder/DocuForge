import * as XLSX from 'xlsx';

/**
 * Reads an Excel file and converts it to HTML format for PDF conversion
 * @param {File} file - The Excel file to read
 * @returns {Promise<Array>} - Array of sheet objects with name and HTML data
 */
export const readExcelFile = (file) => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    
    reader.onload = (e) => {
      try {
        const data = new Uint8Array(e.target.result);
        const workbook = XLSX.read(data, { type: 'array' });
        
        const sheets = [];
        
        workbook.SheetNames.forEach(sheetName => {
          const worksheet = workbook.Sheets[sheetName];
          
          // Skip empty sheets
          if (!worksheet['!ref']) {
            return;
          }
          
          // Convert to HTML instead of PDF (XLSX doesn't support direct PDF conversion)
          const htmlData = XLSX.write(workbook, {
            bookType: 'html',
            bookSST: false,
            type: 'string',
            sheet: sheetName,
          });
          
          sheets.push({
            name: sheetName,
            htmlData: htmlData,
            workbook: workbook,
            sheetName: sheetName
          });
        });
        
        resolve(sheets);
      } catch (error) {
        reject(new Error(`Failed to parse Excel file: ${error.message}`));
      }
    };
    
    reader.onerror = () => {
      reject(new Error('Failed to read the file'));
    };
    
    reader.readAsArrayBuffer(file);
  });
};

/**
 * Converts Excel data to PDF format using HTML as intermediate
 * @param {Object} sheetData - Object containing workbook and sheet name
 * @returns {Promise<string>} - Promise resolving to PDF data URL
 */
export const convertToPdf = async (sheetData, options = {}) => {
  try {
    // Get the worksheet
    const worksheet = sheetData.workbook.Sheets[sheetData.sheetName];
    
    // Set print options to fit all columns on one page
    if (options && options.fitToPage) {
      worksheet['!printHeader'] = null;
      worksheet['!printFooter'] = null;
      worksheet['!fullpaginate'] = true;
      worksheet['!pageMargins'] = { left: 0.5, right: 0.5, top: 0.5, bottom: 0.5, header: 0, footer: 0 };
      worksheet['!fitToPage'] = true;
      worksheet['!fitToWidth'] = true;
      worksheet['!fitToHeight'] = false;
    }
    
    // Convert worksheet to HTML with the print options
    const html = XLSX.utils.sheet_to_html(worksheet);
    
    // Create a temporary div to render the HTML
    const tempDiv = document.createElement('div');
    tempDiv.innerHTML = html;
    tempDiv.style.position = 'absolute';
    tempDiv.style.left = '-9999px';
    tempDiv.style.width = '800px'; // Limit width to prevent oversized canvas
    
    // Add custom CSS to ensure table fits on one page and limit size
    const styleElement = document.createElement('style');
    styleElement.textContent = `
      table { 
        width: 100%; 
        table-layout: fixed; 
        max-width: 800px;
        font-size: 10px; /* Smaller font to fit more content */
      }
      th, td { 
        overflow: hidden; 
        text-overflow: ellipsis; 
        white-space: nowrap;
        max-width: 150px; /* Limit cell width */
        padding: 2px; /* Reduce padding */
      }
    `;
    tempDiv.appendChild(styleElement);
    document.body.appendChild(tempDiv);
    
    // Use html2canvas with optimized settings
    const html2canvas = await import('html2canvas').then(module => module.default);
    const canvas = await html2canvas(tempDiv, {
      scale: 1, // Lower scale for better performance
      logging: false, // Disable logging
      useCORS: true, // Enable CORS for images
      allowTaint: true, // Allow tainted canvas
      backgroundColor: '#ffffff', // White background
      imageTimeout: 0, // No timeout for images
      onclone: (document) => {
        // Further optimize the cloned document if needed
        const tables = document.querySelectorAll('table');
        tables.forEach(table => {
          if (table.offsetWidth > 800) {
            table.style.transform = `scale(${800 / table.offsetWidth})`;
            table.style.transformOrigin = 'top left';
          }
        });
      }
    });
    
    // Use jsPDF with optimized settings
    const { jsPDF } = await import('jspdf');
    const pdf = new jsPDF({
      orientation: 'l', // Landscape
      unit: 'mm',
      format: 'a4',
      compress: true // Enable compression
    });
    
    // Optimize image quality and size
    const imgData = canvas.toDataURL('image/jpeg', 0.7); // Lower quality for better performance
    const pdfWidth = pdf.internal.pageSize.getWidth();
    const pdfHeight = pdf.internal.pageSize.getHeight();
    
    pdf.addImage(imgData, 'JPEG', 0, 0, pdfWidth, pdfHeight);
    const pdfData = pdf.output('datauristring');
    
    // Clean up
    document.body.removeChild(tempDiv);
    
    return pdfData;
  } catch (error) {
    console.error('PDF conversion error:', error);
    // Return a simple error PDF instead of crashing
    const { jsPDF } = await import('jspdf');
    const pdf = new jsPDF();
    pdf.text(`Error converting sheet "${sheetData.sheetName}": ${error.message}`, 10, 10);
    return pdf.output('datauristring');
  }
};

// Add a new function for lightweight PDF viewing
export const generatePDFThumbnail = async (pdfDataUrl) => {
  try {
    // Create a smaller thumbnail version for preview
    const { jsPDF } = await import('jspdf');
    const pdf = new jsPDF({
      orientation: 'l',
      unit: 'mm',
      format: 'a4',
      compress: true
    });
    
    // Create a simple thumbnail
    pdf.setFontSize(12);
    pdf.text('PDF Preview (Click to download)', 10, 10);
    
    return pdf.output('datauristring');
  } catch (error) {
    console.error('Thumbnail generation error:', error);
    return null;
  }
};

/**
 * Validates if the file is an Excel file
 * @param {File} file - The file to validate
 * @returns {Boolean} - True if valid Excel file
 */
export const isValidExcelFile = (file) => {
  const allowedTypes = [
    'application/vnd.ms-excel',
    'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    'application/vnd.ms-excel.sheet.macroEnabled.12'
  ];
  
  // Check MIME type
  if (!allowedTypes.includes(file.type)) {
    // As fallback, check file extension
    const extension = file.name.split('.').pop().toLowerCase();
    if (!['xls', 'xlsx', 'xlsm'].includes(extension)) {
      return false;
    }
  }
  
  return true;
};