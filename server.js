// Import necessary libraries
import express from 'express';
import axios from 'axios';
import dotenv from 'dotenv';
import cors from 'cors';
import mysql from 'mysql2';

dotenv.config();  // Load environment variables

const app = express();
app.use(cors());
app.use(express.json());

// MySQL Database setup
const db = mysql.createConnection({
    host: process.env.DB_HOST,
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    database: process.env.DB_NAME
});

db.connect((err) => {
    if (err) throw err;
    console.log('Connected to MySQL database.');
});

// Fetch environment variables
const ACCESS_TOKEN = process.env.WHATSAPP_ACCESS_TOKEN;
const PHONE_NUMBER_ID = process.env.PHONE_NUMBER_ID;
const WEBHOOK_ACCESS_TOKEN = process.env.WEBHOOK_ACCESS_TOKEN;

// Function to validate phone number format (India-specific)
const isValidPhoneNumber = (phoneNumber) => /^91\d{10}$/.test(phoneNumber);

// Function to send WhatsApp message with buttons
async function sendWhatsAppMessageWithButtons(phoneNumber, message, buttons) {
    try {
        console.log("Sending message to:", phoneNumber);

        // Sanitize phone number (remove spaces, non-numeric characters)
        phoneNumber = phoneNumber.replace(/[^\d]/g, '');

        // Validate phone number format
        if (!isValidPhoneNumber(phoneNumber)) {
            throw new Error("Invalid phone number format. Expected format: 91xxxxxxxxxx.");
        }

        // Construct the message body with interactive buttons
        const messageData = {
            messaging_product: 'whatsapp',
            recipient_type: 'individual',
            type: 'interactive',
            to: phoneNumber, // The recipient's phone number
            interactive: {
                type: 'button',
                header: {
                    type: 'text',
                    text: 'Survey Notification'
                },
                body: {
                    text: message  // Ensure message text is properly added without 'type'
                },
                action: {
                    buttons: buttons // Buttons to show in the message
                }
            }
        };

        // Send the WhatsApp message using the API
        const response = await axios.post(`https://graph.facebook.com/v13.0/${PHONE_NUMBER_ID}/messages`, messageData, {
            headers: {
                Authorization: `Bearer ${ACCESS_TOKEN}`,
                'Content-Type': 'application/json',
            }
        });

        console.log('Message sent successfully:', response.data);
    } catch (error) {
        console.error('Error sending WhatsApp message:', error.response ? error.response.data : error.message);
    }
}

app.get('/webhook', (req, res) => {
    const mode = req.query['hub.mode'];
    const token = req.query['hub.verify_token'];
    const challenge = req.query['hub.challenge'];

    if (mode && token) {
        if (mode === 'subscribe' && token === WEBHOOK_ACCESS_TOKEN) {
            console.log('Webhook verified successfully.');
            res.status(200).send(challenge);
        } else {
            console.error('Webhook verification failed.');
            res.sendStatus(403);
        }
    } else {
        console.error('Invalid webhook request.');
        res.sendStatus(400);
    }
});
// Endpoint to handle the campaign message sending
app.post('/send-campaign', async (req, res) => {
    try {
        const { phoneNumbers, template } = req.body;

        if (!phoneNumbers || phoneNumbers.length === 0 || !template) {
            return res.status(400).json({ error: 'Phone numbers and template are required.' });
        }

        // Process based on the selected template
        let message = '';
        let buttons = [];

        switch (template) {
            case 'aadhaar_process':
                message = "Please confirm if you are linked with Aadhaar.";
                buttons = [
                    { type: 'reply', reply: { id: 'linked_yes', title: '✅ Yes' } },
                    { type: 'reply', reply: { id: 'linked_no', title: '❌ No' } },
                ];
                break;
            case 'dbt_issue':
                message = "Did you receive the DBT scholarship amount?";
                buttons = [
                    { type: 'reply', reply: { id: 'received_yes', title: '✅ Yes' } },
                    { type: 'reply', reply: { id: 'received_no', title: '❌ No' } },
                ];
                break;
            case 'survey':
                message = "Please select your preferred language:";
                buttons = [
                    { type: 'reply', reply: { id: 'english', title: 'English' } },
                    { type: 'reply', reply: { id: 'tamil', title: 'Tamil' } },
                ];
                break;
            default:
                return res.status(400).json({ error: 'Invalid template.' });
        }

        // Send message to all phone numbers
        for (const phoneNumber of phoneNumbers) {
            await sendWhatsAppMessageWithButtons(phoneNumber, message, buttons);
        }

        return res.json({ success: 'Campaign messages sent successfully!' });

    } catch (error) {
        console.error('Error sending campaign:', error);
        res.status(500).json({ error: 'Failed to send campaign messages.' });
    }
});

// Handle incoming webhook to process button clicks
// Handle incoming webhook to process button clicks
// Handle incoming webhook to process button clicks
app.post('/webhook', async (req, res) => {
    try {
        console.log("Webhook received:", JSON.stringify(req.body, null, 2));

        const entry = req.body.entry && req.body.entry[0];
        const changes = entry && entry.changes && entry.changes[0];
        const messages = changes && changes.value && changes.value.messages;

        if (!messages || !messages.length) {
            console.log("No messages found in the webhook");
            return res.sendStatus(400);  // Invalid message format
        }

        const message = messages[0];  // Extract the first message from the array
        const phoneNumber = message.from;  // The phone number of the user who interacted

        let userMessage = '';
        let buttonId = '';
        let buttonTitle = '';
        let buttonValue = '';

        if (message.type === 'interactive') {
            const interactiveMessage = message.interactive;

            if (interactiveMessage.button_reply) {
                buttonId = interactiveMessage.button_reply.id;  // Button ID
                buttonTitle = interactiveMessage.button_reply.title;  // Button text
                buttonValue = interactiveMessage.button_reply.value; // Value of the button clicked
                userMessage = buttonTitle;  // Store button clicked text as the user message

                // Insert conversation details into the database if the conversation is not yet started
                const conversationStartTime = new Date();
                const status = 'Incomplete'; // Initial status set as 'Incomplete'

                // If conversation has started and no record is found, insert the initial data
                db.query(
                    'INSERT INTO conversation_logs (phone_number, user_message, conversation_start_time, button_id, button_title, button_value, status) VALUES (?, ?, ?, ?, ?, ?, ?)', 
                    [phoneNumber, userMessage, conversationStartTime, buttonId, buttonTitle, buttonValue, status], 
                    (err, result) => {
                        if (err) {
                            console.error('Error storing response:', err);
                        } else {
                            console.log('Response stored successfully:', result);
                        }
                    }
                );

                // Handle specific button clicks
                if (buttonId === 'survey_complete') {
                    // If the user clicked "Complete Survey", mark the conversation as completed
                    const conversationEndTime = new Date(); // Set the end time of the conversation
                    const status = 'Completed'; // Set the status to 'Completed'

                    // Update the status and end time of the conversation
                    db.query(
                        'UPDATE conversation_logs SET conversation_end_time = ?, status = ? WHERE phone_number = ? AND status = "Incomplete"',
                        [conversationEndTime, status, phoneNumber],
                        (err, result) => {
                            if (err) {
                                console.error('Error updating conversation status:', err);
                            } else {
                                console.log('Conversation status updated successfully:', result);
                            }
                        }
                    );
                }

                // Additional button click actions can go here

            }

            // Respond to Facebook to confirm receipt of the webhook
            res.sendStatus(200);
        } else {
            res.sendStatus(400);  // If the message is not interactive
        }
    } catch (error) {
        console.error("Error handling webhook:", error);
        res.status(500).send({ error: "Error handling the response" });
    }
});


// Start the server
const port = process.env.PORT || 5000;
app.listen(port, () => {
    console.log(`Server running on http://localhost:${port}`);
});
