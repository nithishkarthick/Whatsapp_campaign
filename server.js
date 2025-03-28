import express from 'express';
import axios from 'axios';
import dotenv from 'dotenv';
import cors from 'cors';

dotenv.config();  // Load environment variables

const app = express();
app.use(cors());
app.use(express.json());

// Fetch environment variables
const ACCESS_TOKEN = process.env.WHATSAPP_ACCESS_TOKEN;
const PHONE_NUMBER_ID = process.env.PHONE_NUMBER_ID;
const WEBHOOK_ACCESS_TOKEN = process.env.WEBHOOK_ACCESS_TOKEN;

app.get('/webhook', (req, res) => {
    const mode = req.query['hub.mode'];
    const challenge = req.query['hub.challenge'];
    const token = req.query['hub.verify_token'];

    // Verify the webhook with the token provided in the request query
    if (mode && token) {
        if (mode === 'subscribe' && token === WEBHOOK_ACCESS_TOKEN) {
            console.log('WEBHOOK_VERIFIED');
            res.status(200).send(challenge);  // Send the challenge back to verify the webhook
        } else {
            res.sendStatus(403);  // Unauthorized if the tokens don't match
        }
    } else {
        res.send('Hello World!');  // Default response for other cases
    }
});

// Function to send WhatsApp message with buttons
async function sendWhatsAppMessageWithButtons(phoneNumbers, message, buttons) {
    try {
        console.log("Sending message to:", phoneNumbers);

        // Ensure phone number is properly sanitized (remove any spaces or special characters)
        phoneNumbers = phoneNumbers.replace(/[^\d]/g, '');

        // Validate phone number format (example for India: starts with 91 and followed by 10 digits)
        if (!/^91\d{10}$/.test(phoneNumbers)) {
            throw new Error("Invalid phone number format. Expected format: 91xxxxxxxxxx.");
        }

        // Construct the message body for an interactive message with buttons
        const messageBody = {
            messaging_product: 'whatsapp',
            to: phoneNumbers,
            interactive: {
                type: 'button',  // Interactive button message type
                body: {
                    text: message || 'Please select an option below'  // Ensure 'text' field is provided
                },
                action: {
                    buttons: buttons
                }
            }
        };

        // Send message request to WhatsApp API
        const response = await axios.post(
            `https://graph.facebook.com/v14.0/${PHONE_NUMBER_ID}/messages`,
            messageBody,
            {
                headers: {
                    'Authorization': `Bearer ${ACCESS_TOKEN}`,
                    'Content-Type': 'application/json',
                },
            }
        );

        console.log("Message sent successfully:", response.data);
    } catch (error) {
        console.error("Error sending WhatsApp message:", error.response ? error.response.data : error.message);
    }
}

// Route to start the conversation and show the main menu
app.post('/start-survey', async (req, res) => {
    const { phoneNumbers } = req.body;  // This should be an array of phone numbers

    if (!Array.isArray(phoneNumbers) || phoneNumbers.length === 0) {
        return res.status(400).send({ error: 'Phone numbers are required.' });
    }

    const message = "👋 Welcome! Please select your issue:";

    // Button options
    const buttons = [
        { type: 'reply', reply: { id: 'aadhaar_seeding', title: 'Aadhaar Seeding Process' } },
        { type: 'reply', reply: { id: 'dbt_issue', title: 'DBT-Related Issue' } },
    ];

    // Send message to each phone number in the phoneNumbers array
    for (const phoneNumber of phoneNumbers) {
        await sendWhatsAppMessageWithButtons(phoneNumber, message, buttons);
    }

    res.send({ message: 'Conversation started!' });
});

// Webhook endpoint to handle the incoming messages and interactions
app.post('/webhook', async (req, res) => {
    try {
        const message = req.body.entry[0].changes[0].value.messages[0];  // Extract the message from the payload

        if (message && message.type === 'interactive') {
            const interactiveMessage = message.interactive;
            const phoneNumber = message.from;  // The phone number of the user who interacted

            // Handle button reply
            if (interactiveMessage.button_reply) {
                const buttonId = interactiveMessage.button_reply.id;  // Button ID
                const buttonTitle = interactiveMessage.button_reply.title;  // Button text
                
                console.log("Button clicked:", buttonTitle, "ID:", buttonId);

                // Handle specific button actions
                if (buttonTitle === 'Aadhaar Seeding Process') {
                    const aadhaarMessage = 'Have you linked your Aadhaar to your bank account?';
                    const buttons = [
                        { type: 'reply', reply: { id: 'linked_yes', title: '✅ Yes' } },
                        { type: 'reply', reply: { id: 'linked_no', title: '❌ No' } },
                    ];
                    await sendWhatsAppMessageWithButtons(phoneNumber, aadhaarMessage, buttons);
                } else if (buttonTitle === 'DBT-Related Issue') {
                    const dbtMessage = 'Have you received the DBT scholarship amount?';
                    const buttons = [
                        { type: 'reply', reply: { id: 'received_yes', title: '✅ Yes' } },
                        { type: 'reply', reply: { id: 'received_no', title: '❌ No' } },
                    ];
                    await sendWhatsAppMessageWithButtons(phoneNumber, dbtMessage, buttons);
                }
            }

            // Handle list reply
            if (interactiveMessage.list_reply) {
                const listId = interactiveMessage.list_reply.id;  // List item ID
                const listTitle = interactiveMessage.list_reply.title;  // Title of selected list item
                const listDescription = interactiveMessage.list_reply.description;  // Description of selected item (if available)

                console.log("List item selected:", listTitle, "ID:", listId, "Description:", listDescription);

                // Add custom actions based on list item selection
                if (listTitle === 'Aadhaar Status') {
                    const statusMessage = 'You can check your Aadhaar status on the UIDAI website.';
                    await sendWhatsAppMessageWithButtons(phoneNumber, statusMessage, []);
                } else if (listTitle === 'DBT Payment') {
                    const dbtMessage = 'Check your payment status on the PFMS website.';
                    await sendWhatsAppMessageWithButtons(phoneNumber, dbtMessage, []);
                }
            }

            res.sendStatus(200);  // Respond to Facebook to confirm receipt of the webhook
        } else {
            res.sendStatus(400);  // If the message is not interactive
        }
    } catch (error) {
        console.error("Error handling webhook:", error);
        res.status(500).send({ error: "Error handling the response" });
    }
});

// Start the server
app.listen(5000, () => {
    console.log('Server running on http://localhost:5000');
});
