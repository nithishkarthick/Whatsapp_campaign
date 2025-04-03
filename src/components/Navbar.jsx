import React, { useState, useEffect } from 'react';
import Papa from 'papaparse';
import axios from 'axios';

function App() {
  const [file, setFile] = useState(null);
  const [campaignMessage, setCampaignMessage] = useState('');
  const [phoneNumbers, setPhoneNumbers] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const [successMessage, setSuccessMessage] = useState('');
  const [isFileProcessing, setIsFileProcessing] = useState(false);

  const [templates, setTemplates] = useState([]);  
  const [selectedTemplate, setSelectedTemplate] = useState('');

  // Fetch available templates on component mount
  useEffect(() => {
    const fetchTemplates = () => {
      setTemplates([
        { id: 'aadhaar_process', name: 'Aadhaar Process' },
        { id: 'dbt_issue', name: 'DBT Issues' },
        { id: 'survey', name: 'Survey' },
      ]);
    };

    fetchTemplates();
  }, []);

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

  const isValidIndianPhoneNumber = (phone) => {
    const cleanedPhone = phone.replace(/[^\d]/g, '').trim();
    const regex = /^91\d{10}$/;
    return regex.test(cleanedPhone);
  };

  const handleFileUpload = () => {
    if (file) {
      setIsFileProcessing(true);
      Papa.parse(file, {
        complete: (result) => {
          const validPhoneNumbers = result.data
            .map((row) => row[0] ? row[0].trim() : '')
            .filter((phone) => phone && isValidIndianPhoneNumber(phone));

          if (validPhoneNumbers.length === 0) {
            setErrorMessage('No valid Indian phone numbers found in the file.');
            setSuccessMessage('');
          } else {
            setPhoneNumbers(validPhoneNumbers);
            setErrorMessage('');
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
    } else {
      setErrorMessage('Please upload a CSV file.');
    }
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
      const response = await axios.post('http://localhost:5000/send-campaign', {
        phoneNumbers: phoneNumbers,
        template: selectedTemplate,
      });

      setSuccessMessage(response.data.success);
    } catch (error) {
      console.error('Error starting survey campaign:', error);
      setErrorMessage(error.response ? error.response.data.error : 'Failed to start survey campaign.');
    }

    setIsLoading(false);
  };

  return (
    <div className="flex flex-wrap min-h-screen bg-gray-100 flex flex-col items-center justify-start">
      <nav className="w-full bg-[rgb(8,69,116)] text-white p-4 text-center">
        <h1 className="text-2xl font-bold">Campaign Manager</h1>
      </nav>

      <div className="w-full max-w-4xl px-16 py-16">
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
            {templates.map((template) => (
              <option key={template.id} value={template.id}>
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
          className={`p-2 bg-green-500 text-white rounded-lg ${
            isLoading ? 'opacity-50 cursor-not-allowed' : ''
          }`}
        >
          {isLoading ? 'Sending Messages...' : 'Run Campaign'}
        </button>
      </div>
    </div>
  );
}

export default App;
