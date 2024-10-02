import React, { useCallback, useState } from 'react';
import { useDropzone } from 'react-dropzone';
import axios from 'axios';
import { Spinner } from 'react-bootstrap';
import 'bootstrap/dist/css/bootstrap.min.css';

function FileUpload({ onExtractedData, setPreviewFile, setIsPDF }) {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);

  const onDrop = useCallback((acceptedFiles) => {
    const file = acceptedFiles[0];
    const formData = new FormData();
    formData.append('file', file);

    setIsLoading(true);
    setError(null);

    const fileUrl = URL.createObjectURL(file);
    setPreviewFile(fileUrl);
    setIsPDF(file.type === 'application/pdf' || file.name.toLowerCase().endsWith('.pdf'));

    axios.post(`${process.env.REACT_APP_API_URL}/api/extract`, formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    })
      .then((response) => {
        if (response.data.error) {
          console.error('Error from backend:', response.data.error);
          setError(`Failed to extract data: ${response.data.error}. Raw response: ${response.data.raw_response}`);
        } else {
          onExtractedData(response.data);
        }
        setIsLoading(false);
      })
      .catch((error) => {
        console.error('Error uploading file:', error);
        setError('Failed to extract data. Please try again.');
        setIsLoading(false);
      });
  }, [onExtractedData, setPreviewFile, setIsPDF]);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({ 
    onDrop, 
    accept: {
      'image/*': ['.png', '.jpg', '.jpeg', '.gif'],
      'application/pdf': ['.pdf'],
      '.png': [],
      '.jpg': [],
      '.jpeg': [],
      '.gif': [],
      '.pdf': []
    }
  });

  return (
    <div style={{ width: '90%', maxWidth: '800px', margin: '0 auto' }}>
      <div {...getRootProps()} className="dropzone" style={{
        border: '2px dashed #cccccc',
        borderRadius: '4px',
        padding: '20px',
        textAlign: 'center',
        cursor: 'pointer',
        marginBottom: '10px'
      }}>
        <input {...getInputProps()} />
        {
          isDragActive ?
            <p>Drop the image or PDF file here ...</p> :
            <p>Drag 'n' drop an image or PDF file here, or click to select a file</p>
        }
      </div>
      {isLoading && (
        <div style={{
          display: 'flex',
          justifyContent: 'center',
          alignItems: 'center',
          marginTop: '20px'
        }}>
          <Spinner animation="border" role="status" variant="dark" />
          <span style={{ marginLeft: '10px' }}>Loading...</span>
        </div>
      )}
      {error && (
        <p className="error" style={{ 
          color: 'red', 
          textAlign: 'center', 
          fontWeight: 'bold',
          marginTop: '10px',
          padding: '10px',
          backgroundColor: '#ffeeee',
          borderRadius: '5px'
        }}>
          {error}
        </p>
      )}
    </div>
  );
}

export default FileUpload;
