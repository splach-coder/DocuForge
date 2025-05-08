import { jsPDF } from 'jspdf';
import * as pdfjsLib from 'pdfjs-dist';

pdfjsLib.GlobalWorkerOptions.workerSrc = `//cdnjs.cloudflare.com/ajax/libs/pdf.js/${pdfjsLib.version}/pdf.worker.min.js`;

/**
 * Generates a PDF from sheet data
 * @param {Object} sheetData - Object containing name and PDF data of the sheet
 * @returns {Promise<jsPDF>} - PDF document
 */
export const generatePDF = async (sheetData) => {
  const doc = new jsPDF({
    orientation: 'portrait',
    unit: 'mm',
    format: 'a4'
  });
  
  // Convert base64 to binary array
  const pdfData = atob(sheetData.pdfData.split(',')[1]);
  const pdfBytes = new Uint8Array(pdfData.length);
  for (let i = 0; i < pdfData.length; i++) {
    pdfBytes[i] = pdfData.charCodeAt(i);
  }
  
  // Load the PDF using pdf.js
  const pdf = await pdfjsLib.getDocument({ data: pdfBytes }).promise;
  const page = await pdf.getPage(1);
  
  // Get page dimensions
  const viewport = page.getViewport({ scale: 1 });
  
  // Create a canvas to render the PDF
  const canvas = document.createElement('canvas');
  const context = canvas.getContext('2d');
  canvas.height = viewport.height;
  canvas.width = viewport.width;
  
  // Render the PDF page to the canvas
  await page.render({
    canvasContext: context,
    viewport: viewport
  }).promise;
  
  // Add the rendered page to the new PDF
  doc.addImage(
    canvas.toDataURL('image/jpeg', 1.0),
    'JPEG',
    0,
    0,
    210,
    297
  );
  
  return doc;
};

/**
 * Generates a single PDF containing all sheets from all Excel files
 * @param {Array} results - Array of results containing files and their PDFs
 * @returns {Promise<jsPDF>} - Combined PDF document
 */
export const generateCombinedPDF = async (results) => {
  const combinedDoc = new jsPDF({
    orientation: 'portrait',
    unit: 'mm',
    format: 'a4'
  });
  
  let isFirstPage = true;
  
  for (const result of results) {
    for (const pdfItem of result.pdfs) {
      if (!isFirstPage) {
        combinedDoc.addPage();
      }
      isFirstPage = false;
      
      // Get the PDF data
      const pdfData = pdfItem.pdf.output('datauristring');
      
      // Add the PDF content
      combinedDoc.addImage(pdfData, 'JPEG', 0, 0, 210, 297);
    }
  }
  
  return combinedDoc;
};

/**
 * Generates a thumbnail preview of the PDF
 * @param {jsPDF} pdfDoc - The PDF document
 * @returns {Promise<string>} - Data URL of the thumbnail
 */
export const generatePDFThumbnail = (pdfDoc) => {
  return new Promise((resolve) => {
    resolve(pdfDoc.output('datauristring'));
  });
};

/**
 * Saves a PDF document with the given filename
 * @param {jsPDF} pdfDoc - The PDF document to save
 * @param {string} filename - The filename for the PDF
 */
export const savePDF = (pdfDoc, filename) => {
  pdfDoc.save(filename);
};