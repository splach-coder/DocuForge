/**
 * Windows-specific Excel to PDF conversion utilities using win32com.client
 * This provides better formatting preservation than browser-based methods
 */

// Function to check if running on Windows
export const isWindows = () => {
  return navigator.platform.indexOf('Win') > -1;
};

// Function to convert Excel to PDF using Windows COM automation
export const convertExcelToPdfWindows = async (file) => {
  try {
    // Create a FormData object to send the file to the server
    const formData = new FormData();
    formData.append('excelFile', file);
    
    // Send the file to a backend endpoint that will use win32com.client
    const response = await fetch('/api/convert-excel', {
      method: 'POST',
      body: formData,
    });
    
    if (!response.ok) {
      throw new Error(`Server responded with ${response.status}: ${response.statusText}`);
    }
    
    // Get the PDF data from the response
    const data = await response.json();
    
    if (!data.success) {
      throw new Error(data.error || 'Unknown error occurred during conversion');
    }
    
    return data.pdfs;
  } catch (error) {
    console.error('Error in Windows Excel to PDF conversion:', error);
    throw error;
  }
};