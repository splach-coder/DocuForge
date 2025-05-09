import { jsPDF } from 'jspdf';

/**
 * Converts an image to a data URL
 * @param {File} imageFile - The image file to convert
 * @returns {Promise<string>} - Data URL of the image
 */
export const imageToDataURL = (imageFile) => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result);
    reader.onerror = reject;
    reader.readAsDataURL(imageFile);
  });
};

/**
 * Gets the dimensions of an image
 * @param {string} dataURL - Data URL of the image
 * @returns {Promise<{width: number, height: number}>} - Image dimensions
 */
export const getImageDimensions = (dataURL) => {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => {
      resolve({
        width: img.width,
        height: img.height
      });
    };
    img.onerror = reject;
    img.src = dataURL;
  });
};

/**
 * Merges multiple images into a single PDF
 * @param {Array<File>} imageFiles - Array of image files
 * @returns {Promise<jsPDF>} - PDF document containing all images
 */
export const mergeImagesToPDF = async (imageFiles) => {
  // Create a new PDF document
  const doc = new jsPDF({
    orientation: 'portrait',
    unit: 'mm',
    format: 'a4'
  });
  
  const pageWidth = doc.internal.pageSize.getWidth();
  const pageHeight = doc.internal.pageSize.getHeight();
  
  // Process each image
  for (let i = 0; i < imageFiles.length; i++) {
    // Add a new page for each image except the first one
    if (i > 0) {
      doc.addPage();
    }
    
    try {
      // Convert image to data URL
      const dataURL = await imageToDataURL(imageFiles[i]);
      
      // Get image dimensions
      const dimensions = await getImageDimensions(dataURL);
      
      // Calculate scaling to fit the image on the page
      // while maintaining aspect ratio
      let imgWidth = pageWidth - 20; // 10mm margin on each side
      let imgHeight = (dimensions.height * imgWidth) / dimensions.width;
      
      // If the height exceeds the page height, scale down
      if (imgHeight > pageHeight - 20) {
        imgHeight = pageHeight - 20; // 10mm margin on top and bottom
        imgWidth = (dimensions.width * imgHeight) / dimensions.height;
      }
      
      // Calculate position to center the image
      const x = (pageWidth - imgWidth) / 2;
      const y = (pageHeight - imgHeight) / 2;
      
      // Add the image to the PDF
      doc.addImage(dataURL, 'JPEG', x, y, imgWidth, imgHeight);
    } catch (error) {
      console.error(`Error processing image ${imageFiles[i].name}:`, error);
    }
  }
  
  return doc;
};

/**
 * Generates a thumbnail preview for an image
 * @param {File} imageFile - The image file
 * @returns {Promise<string>} - Data URL of the thumbnail
 */
export const generateImageThumbnail = async (imageFile) => {
  try {
    return await imageToDataURL(imageFile);
  } catch (error) {
    console.error(`Error generating thumbnail for ${imageFile.name}:`, error);
    return null;
  }
};