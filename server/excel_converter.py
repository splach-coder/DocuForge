import os
import sys
import tempfile
import uuid
import base64
from flask import Flask, request, jsonify
from flask_cors import CORS

app = Flask(__name__)
CORS(app)

@app.route('/api/convert-excel', methods=['POST'])
def convert_excel_to_pdf():
    try:
        # Check if we're running on Windows
        if sys.platform != 'win32':
            return jsonify({
                'success': False,
                'error': 'This endpoint only works on Windows servers'
            }), 400
            
        # Get the uploaded file
        if 'excelFile' not in request.files:
            return jsonify({
                'success': False,
                'error': 'No file provided'
            }), 400
            
        excel_file = request.files['excelFile']
        
        # Create a temporary directory to store files
        temp_dir = tempfile.mkdtemp()
        
        # Save the uploaded Excel file
        excel_path = os.path.join(temp_dir, excel_file.filename)
        excel_file.save(excel_path)
        
        # Import win32com.client
        try:
            import win32com.client
        except ImportError:
            return jsonify({
                'success': False,
                'error': 'win32com.client is not installed on the server'
            }), 500
            
        # Initialize COM objects
        excel_app = win32com.client.Dispatch("Excel.Application")
        excel_app.Visible = False
        excel_app.DisplayAlerts = False
        
        try:
            # Open the workbook
            workbook = excel_app.Workbooks.Open(excel_path)
            
            pdfs = []
            
            # Process each worksheet
            for i in range(1, workbook.Worksheets.Count + 1):
                sheet = workbook.Worksheets(i)
                sheet_name = sheet.Name
                
                # Configure page setup for better printing
                sheet.PageSetup.Zoom = False
                sheet.PageSetup.FitToPagesWide = 1
                sheet.PageSetup.FitToPagesTall = False
                sheet.PageSetup.Orientation = 2  # xlLandscape
                
                # Create a unique filename for this sheet's PDF
                pdf_filename = f"{uuid.uuid4()}.pdf"
                pdf_path = os.path.join(temp_dir, pdf_filename)
                
                # Export as PDF
                sheet.ExportAsFixedFormat(
                    Type=0,  # xlTypePDF
                    Filename=pdf_path,
                    Quality=0,  # xlQualityStandard
                    IncludeDocProperties=True,
                    IgnorePrintAreas=False,
                    OpenAfterPublish=False
                )
                
                # Read the PDF file and convert to base64
                with open(pdf_path, 'rb') as pdf_file:
                    pdf_data = pdf_file.read()
                    pdf_base64 = base64.b64encode(pdf_data).decode('utf-8')
                    
                pdfs.append({
                    'name': sheet_name,
                    'pdf': f"data:application/pdf;base64,{pdf_base64}",
                    'thumbnail': f"data:application/pdf;base64,{pdf_base64}"
                })
                
                # Clean up the PDF file
                try:
                    os.remove(pdf_path)
                except:
                    pass
            
            # Close the workbook without saving changes
            workbook.Close(SaveChanges=False)
            
            return jsonify({
                'success': True,
                'pdfs': pdfs
            })
            
        finally:
            # Make sure Excel is properly closed
            excel_app.Quit()
            # Release COM objects
            del excel_app
            
            # Clean up the temp directory
            try:
                os.remove(excel_path)
                os.rmdir(temp_dir)
            except:
                pass
                
    except Exception as e:
        return jsonify({
            'success': False,
            'error': str(e)
        }), 500

if __name__ == '__main__':
    app.run(debug=True, port=5000)