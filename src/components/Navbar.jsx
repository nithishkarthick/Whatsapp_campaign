import React, { useState } from 'react';
import { BrowserRouter as Router, Route, Routes, Link } from 'react-router-dom';
import Papa from 'papaparse';
import axios from 'axios';

function App() {
  const [file, setFile] = useState(null);
  const [phoneNumbers, setPhoneNumbers] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const [successMessage, setSuccessMessage] = useState('');
  const [isFileProcessing, setIsFileProcessing] = useState(false);
  const [selectedTemplate, setSelectedTemplate] = useState('');

  const [templates] = useState([
    { name: 'Hello World' },
    { name: 'DBT Issues' },
    { name: 'survey' },
  ]);

  const isValidIndianPhoneNumber = (phone) => {
    const cleanedPhone = phone.replace(/[^\d]/g, '').trim();
    return /^91\d{10}$/.test(cleanedPhone);
  };

  const handleFileChange = (event) => {
    const selectedFile = event.target.files[0];
    if (selectedFile && selectedFile.type !== 'text/csv') {
      setErrorMessage('Please upload a valid CSV file.');
      setFile(null);
    } else {
      setFile(selectedFile);
      setErrorMessage('');
    }
  };

  const handleTemplateChange = (event) => {
    setSelectedTemplate(event.target.value);
  };

  const handleFileUpload = () => {
    if (!file) {
      setErrorMessage('Please upload a CSV file.');
      return;
    }

    setIsFileProcessing(true);
    Papa.parse(file, {
      complete: (result) => {
        const validPhoneNumbers = result.data
          .map((row) => row[0]?.trim() || '')
          .filter((phone) => phone && isValidIndianPhoneNumber(phone));

        if (validPhoneNumbers.length === 0) {
          setErrorMessage('No valid Indian phone numbers found in the file.');
          setPhoneNumbers([]);
        } else {
          setPhoneNumbers(validPhoneNumbers);
          setSuccessMessage(`${validPhoneNumbers.length} valid phone numbers found.`);
        }

        setIsFileProcessing(false);
      },
      error: (error) => {
        setIsFileProcessing(false);
        setErrorMessage('Error parsing CSV file.');
        console.error('Error parsing CSV:', error);
      },
      header: false,
      skipEmptyLines: true,
    });
  };

  const handleRunCampaign = async () => {
    if (!selectedTemplate || phoneNumbers.length === 0) {
      setErrorMessage('Please select a template and upload a CSV file with phone numbers.');
      return;
    }

    setIsLoading(true);
    setErrorMessage('');
    setSuccessMessage('');

    try {
      const response = await axios.post('http://localhost:5000/send-survey', {
        phoneNumbers, 
        template: selectedTemplate, 
      });

      setSuccessMessage(response.data.success);
    } catch (error) {
      setErrorMessage(error.response ? error.response.data.error : 'Failed to start campaign.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="flex flex-col items-center min-h-screen bg-gray-100">
      <nav className="w-full bg-blue-800 text-white p-4 text-center">
        <h1 className="text-2xl font-bold">Campaign Manager</h1>
      </nav>

      <div className="w-full max-w-4xl px-8 py-16">
        {/* File Upload Section */}
        <div className="mb-6">
          <label htmlFor="file-upload" className="block text-lg font-semibold text-gray-700 mb-2">
            Upload File (CSV with Phone Numbers):
          </label>
          <input
            type="file"
            id="file-upload"
            accept=".csv"
            onChange={handleFileChange}
            className="block w-full p-2 border-2 border-gray-300 rounded-lg"
          />
          {file && <p className="mt-2 text-gray-600">File selected: {file.name}</p>}
          <button
            onClick={handleFileUpload}
            className="mt-4 p-2 bg-blue-500 text-white rounded-lg"
            disabled={isFileProcessing}
          >
            {isFileProcessing ? 'Processing File...' : 'Process File'}
          </button>
        </div>

        {/* Template Dropdown */}
        <div className="mb-6">
          <label htmlFor="campaign-message" className="block text-lg font-semibold text-gray-700 mb-2">
            Select Template:
          </label>
          <select
            id="campaign-message"
            value={selectedTemplate}
            onChange={handleTemplateChange}
            className="block w-full p-2 border-2 border-gray-300 rounded-lg"
          >
            <option value="">Select a template</option>
            {templates.map((template, index) => (
              <option key={index} value={template.name}>
                {template.name}
              </option>
            ))}
          </select>
        </div>

        {/* Error/Success Message */}
        <div className="mb-6">
          {errorMessage && <p className="text-red-500 text-lg mb-4">{errorMessage}</p>}
          {successMessage && <p className="text-green-500 text-lg mb-4">{successMessage}</p>}
        </div>

        {/* Run Campaign Button */}
        <button
          onClick={handleRunCampaign}
          disabled={isLoading || isFileProcessing || !phoneNumbers.length}
          className={`p-2 bg-green-500 text-white rounded-lg ${isLoading || isFileProcessing || !phoneNumbers.length ? 'opacity-50 cursor-not-allowed' : ''}`}
        >
          {isLoading ? 'Sending Messages...' : 'Run Campaign'}
        </button>
      </div>
    </div>
  );
}

export default App;
