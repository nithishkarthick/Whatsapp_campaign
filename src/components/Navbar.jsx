import React, { useState } from 'react';
import Papa from 'papaparse';
import axios from 'axios';

function App() {
  const [file, setFile] = useState(null);
  const [campaignMessage, setCampaignMessage] = useState('');
  const [phoneNumbers, setPhoneNumbers] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const [successMessage, setSuccessMessage] = useState('');

  // Handle file selection
  const handleFileChange = (event) => {
    setFile(event.target.files[0]);
  };

  // Handle campaign message input
  const handleMessageChange = (event) => {
    setCampaignMessage(event.target.value);
  };

  // Validate Indian phone numbers (starting with 91 and followed by 10 digits)
  const isValidIndianPhoneNumber = (phone) => {
    const cleanedPhone = phone.replace(/[^\d]/g, '').trim();
    const regex = /^91\d{10}$/; // Match Indian phone numbers starting with 91
    return regex.test(cleanedPhone);
  };

  // Handle file upload and phone number extraction
  const handleFileUpload = () => {
    if (file) {
      Papa.parse(file, {
        complete: (result) => {
          const validPhoneNumbers = result.data
            .map((row) => {
              // Assuming the first column contains phone numbers, adjust if necessary
              const phone = row[0]; 
              return phone;
            })
            .filter((phone) => phone && isValidIndianPhoneNumber(phone));

          if (validPhoneNumbers.length === 0) {
            setErrorMessage('No valid Indian phone numbers found in the file.');
            setSuccessMessage('');
          } else {
            setPhoneNumbers(validPhoneNumbers);
            setErrorMessage('');
            setSuccessMessage(`${validPhoneNumbers.length} valid phone numbers found.`);
          }
        },
        header: false,  // Handle CSV without headers (set to true if your CSV has headers)
        skipEmptyLines: true,  // Skip empty lines in the CSV
      });
    } else {
      setErrorMessage('Please upload a CSV file.');
    }
  };

  // Run campaign and send messages to valid phone numbers
  const handleRunCampaign = async () => {
    if (!campaignMessage || phoneNumbers.length === 0) {
      setErrorMessage('Please add a campaign message and upload a CSV file with phone numbers.');
      return;
    }

    setIsLoading(true);
    setErrorMessage('');
    setSuccessMessage('');

    // Log the data being sent to the backend
    console.log("Sending data to backend:", { phoneNumbers, campaignMessage });

    try {
      const response = await axios.post('http://localhost:5000/start-survey', {
        phoneNumbers,  // The array of valid phone numbers
        campaignMessage,  // The campaign message
      });

      if (response.data.message === 'Conversation started!') {
        setSuccessMessage('Campaign messages sent successfully!');
      } else {
        setErrorMessage('Failed to start the campaign.');
      }
    } catch (error) {
      console.error('Error starting survey campaign:', error);
      setErrorMessage('Failed to start survey campaign.');
    }

    setIsLoading(false);
  };

  return (
    <div className="flex flex-wrap min-h-screen bg-gray-100 flex flex-col items-center justify-start">
      <nav className="w-full bg-[rgb(8,69,116)] text-white p-4 text-center">
        <h1 className="text-2xl font-bold">Campaign Manager</h1>
      </nav>

      <div className="w-full max-w-4xl px-16 py-16">
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
          >
            Process File
          </button>
        </div>

        <div className="mb-6">
          <label htmlFor="campaign-message" className="block text-lg font-semibold text-gray-700 mb-2">
            Campaign Message:
          </label>
          <textarea
            id="campaign-message"
            value={campaignMessage}
            onChange={handleMessageChange}
            className="block w-full p-2 border-2 border-gray-300 rounded-lg"
            rows="4"
            placeholder="Enter your campaign message here"
          />
        </div>

        {errorMessage && <div className="text-red-500 mb-4">{errorMessage}</div>}
        {successMessage && <div className="text-green-500 mb-4">{successMessage}</div>}

        <div className="flex space-x-4">
          <button
            onClick={handleRunCampaign}
            className={`w-full sm:w-auto px-6 py-3 ${isLoading ? 'bg-gray-500' : 'bg-green-500'} text-white font-semibold rounded-lg hover:bg-green-600 focus:outline-none`}
            disabled={isLoading}
          >
            {isLoading ? 'Sending Campaign...' : 'Run Campaign'}
          </button>
        </div>
      </div>
    </div>
  );
}

export default App;
