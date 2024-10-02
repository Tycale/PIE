import React, { useState, useEffect } from 'react';
import './App.css';
import FileUpload from './components/FileUpload';
import { QRCodeSVG } from 'qrcode.react';
import { Button } from 'react-bootstrap';
import 'bootstrap/dist/css/bootstrap.min.css';
import { FaTimes, FaArrowsAlt } from 'react-icons/fa';
import EditableField from './components/EditableField';

function App() {
  const [extractedData, setExtractedData] = useState(null);
  const [editedData, setEditedData] = useState(null);
  const [previewFile, setPreviewFile] = useState(null);
  const [isPDF, setIsPDF] = useState(false);
  const [isPreviewCollapsed, setIsPreviewCollapsed] = useState(false);
  const [editingField, setEditingField] = useState(null);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [popupPosition, setPopupPosition] = useState({ x: 20, y: 20 });

  useEffect(() => {
    if (extractedData) {
      setEditedData(extractedData);
    }
  }, [extractedData]);

  const handleExtractedData = (data) => {
    setExtractedData(data);
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setEditedData(prevData => ({
      ...prevData,
      [name]: value
    }));
    setExtractedData(prevData => ({
      ...prevData,
      [name]: value
    }));
  };

  const generateEPCQRContent = (data) => {
    if (!data) return '';
    const bic = 'NOTPROVIDED'; // BIC n'est pas fourni dans les données extraites
    return `BCD
002
1
SCT
${bic}
${data.name || 'Not Provided'}
${data.account}
EUR${data.amount}

${data.communication}`;
  };

  const FullscreenPreview = () => {
    const handleDragStart = (e) => {
      const startX = e.clientX - popupPosition.x;
      const startY = e.clientY - popupPosition.y;

      const handleDrag = (e) => {
        setPopupPosition({
          x: e.clientX - startX,
          y: e.clientY - startY
        });
      };

      const handleDragEnd = () => {
        document.removeEventListener('mousemove', handleDrag);
        document.removeEventListener('mouseup', handleDragEnd);
      };

      document.addEventListener('mousemove', handleDrag);
      document.addEventListener('mouseup', handleDragEnd);
    };

    return (
      <div className="fullscreen-overlay">
        {isPDF ? (
          <iframe src={previewFile} className="fullscreen-pdf" title="PDF Preview" style={{ width: '100%', height: '100%', border: 'none' }}></iframe>
        ) : (
          <img src={previewFile} alt="Full size preview" className="fullscreen-image" style={{ maxWidth: '100%', maxHeight: '100%', objectFit: 'contain' }} />
        )}
        <div className="fullscreen-popup" style={{ top: popupPosition.y, left: popupPosition.x, zIndex: 1000 }}>
          <div className="fullscreen-popup-header">
            <div className="fullscreen-popup-title" onMouseDown={handleDragStart}>
              <FaArrowsAlt style={{ marginRight: '10px', color: '#007bff' }} />
              <h3>Extracted Information</h3>
            </div>
            <Button 
              variant="outline-secondary" 
              size="sm" 
              onClick={() => setIsFullscreen(false)}
              className="fullscreen-popup-close"
            >
              <FaTimes style={{ marginRight: '5px' }} /> Close
            </Button>
          </div>
          {['name', 'account', 'amount', 'communication'].map((field) => (
            <div key={field} className="fullscreen-popup-field">
              <strong>{field.charAt(0).toUpperCase() + field.slice(1)}:</strong>
              <EditableField
                value={editedData[field] || ''}
                onChange={(value) => handleInputChange({ target: { name: field, value } })}
                fieldName={field}
              />
            </div>
          ))}
        </div>
      </div>
    );
  };

  return (
    <div className="App">
      <header className="App-header">
        {!extractedData ? (
          <>
            <h1 className="app-title">PIE - Payment Information Extractor</h1>
            <p className="app-description">
              PIE extracts payment information from your documents and generates a QR code for easy mobile payments.
              <br />
              Upload, extract, pay - it's that simple!
            </p>
          </>
        ) : null}
        {editedData ? (
          <>
            <div className="extracted-data">
              <h2>Extracted Information:</h2>
              <div>
                {['name', 'account', 'amount', 'communication'].map((field) => (
                  <div key={field} className="extracted-data-field">
                    <strong className="extracted-data-label">
                      {field.charAt(0).toUpperCase() + field.slice(1)}:
                    </strong>
                    {editingField === field ? (
                      <input 
                        type="text" 
                        name={field} 
                        value={editedData[field] || ''} 
                        onChange={handleInputChange}
                        onBlur={() => {
                          setEditingField(null);
                        }}
                        autoFocus
                        className="extracted-data-value"
                      />
                    ) : (
                      <EditableField
                        value={editedData[field] || ''}
                        onChange={(value) => handleInputChange({ target: { name: field, value } })}
                      />
                    )}
                  </div>
                ))}
              </div>
            </div>
            {previewFile && (
              <div className="preview-container">
                <div className="preview-buttons">
                  <Button 
                    onClick={() => setIsPreviewCollapsed(!isPreviewCollapsed)}
                    variant="outline-primary"
                  >
                    {isPreviewCollapsed ? 'Show Preview' : 'Hide Preview'}
                  </Button>
                  <Button 
                    onClick={() => setIsFullscreen(true)}
                    variant="primary"
                  >
                    Verify Details
                  </Button>
                </div>
                {!isPreviewCollapsed && (
                  isPDF ? (
                    <div className="pdf-container" style={{ width: '100%', height: '80vh', margin: '0 auto' }}>
                      <object 
                        data={previewFile}
                        type="application/pdf"
                        className="preview-pdf" 
                        style={{ width: '100%', height: '100%' }}
                      >
                        <p>It appears you don't have a PDF plugin for this browser. 
                        You can <a href={previewFile}>click here to download the PDF file.</a></p>
                      </object>
                    </div>
                  ) : (
                    <img 
                      src={previewFile} 
                      alt="Preview" 
                      className="preview-image"
                      onClick={() => setIsFullscreen(true)}
                      style={{ maxWidth: '50%', height: 'auto' }}
                    />
                  )
                )}
              </div>
            )}
            {isFullscreen && <FullscreenPreview />}
            <div className="warning-message" style={{
              color: 'red',
              fontWeight: 'bold',
              padding: '10px',
              margin: '20px 0',
              border: '2px solid red',
              borderRadius: '5px',
              backgroundColor: '#ffeeee'
            }}>
              ⚠️ WARNING: Always verify information before making a payment!
            </div>
            <div className="qr-code-container">
              <h3>EPC QR Code</h3>
              <div className="qr-code">
                <QRCodeSVG value={generateEPCQRContent(editedData)} size={256} />
              </div>
            </div>
          </>
        ) : (
          <p>Upload an image or PDF file to extract payment information</p>
        )}
        <FileUpload onExtractedData={handleExtractedData} setPreviewFile={setPreviewFile} setIsPDF={setIsPDF} />
      </header>
    </div>
  );
}

export default App;
