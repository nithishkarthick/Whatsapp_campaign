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
async function sendWhatsAppMessageWithButtons(phoneNumber, templateName, components) {
    try {
        console.log("Sending template message to:", phoneNumber);

        // Sanitize phone number (remove spaces, non-numeric characters)
        phoneNumber = phoneNumber.replace(/[^\d]/g, '');

        // Validate phone number format
        if (!isValidPhoneNumber(phoneNumber)) {
            throw new Error("Invalid phone number format. Expected format: 91xxxxxxxxxx.");
        }

        // Construct the message body using WhatsApp Cloud API format
        const messageData = {
            messaging_product: "whatsapp",
            to: phoneNumber,
            type: "template",
            template: {
                name: templateName,  // Use the correct template name here
                language: {
                    code: "en",
                },
                components: components,
            },
        };

        // Send the WhatsApp message using the API
        const response = await axios.post(
            `https://graph.facebook.com/v13.0/${PHONE_NUMBER_ID}/messages`,
            messageData,
            {
                headers: {
                    Authorization: `Bearer ${ACCESS_TOKEN}`,
                    'Content-Type': 'application/json',
                },
            }
        );

        console.log('Message sent successfully:', response.data);
    } catch (error) {
        console.error('Error sending WhatsApp message:', error.response ? error.response.data : error.message);
    }
}
async function sendWhatsAppCustomMessageWithButtons(phoneNumber,Message, buttons) {
    try {
        console.log("Sending interactive message to:", phoneNumber);

        // Sanitize phone number (remove spaces, non-numeric characters)
        phoneNumber = phoneNumber.replace(/[^\d]/g, '');

        // Validate phone number format
        if (!isValidPhoneNumber(phoneNumber)) {
            throw new Error("Invalid phone number format. Expected format: 91xxxxxxxxxx.");
        }

        // Construct the message body for the interactive buttons
        const messageData = {
            messaging_product: "whatsapp",
            to: phoneNumber,
            type: "interactive",
            interactive: {
                type: "button",
                body: {
                    text: Message // You can customize the message here
                },
                action: {
                    buttons: buttons,  // Use the provided buttons array
                },
            },
        };

        // Send the WhatsApp interactive message using the API
        const response = await axios.post(
            `https://graph.facebook.com/v13.0/${PHONE_NUMBER_ID}/messages`,
            messageData,
            {
                headers: {
                    Authorization: `Bearer ${ACCESS_TOKEN}`,
                    'Content-Type': 'application/json',
                },
            }
        );

        console.log('Message sent successfully:', response.data);
    } catch (error) {
        console.error('Error sending WhatsApp message:', error.response ? error.response.data : error.message);
    }
}
async function sendWhatsAppOnlyMessageWithButtons(phoneNumber,Message,) {
    try {
        console.log("Sending interactive message to:", phoneNumber);

        // Sanitize phone number (remove spaces, non-numeric characters)
        phoneNumber = phoneNumber.replace(/[^\d]/g, '');

        // Validate phone number format
        if (!isValidPhoneNumber(phoneNumber)) {
            throw new Error("Invalid phone number format. Expected format: 91xxxxxxxxxx.");
        }

        // Construct the message body for the interactive buttons
        const messageData = {
            messaging_product: "whatsapp",
            to: phoneNumber,
            type: "text",
            text: {
                body: Message // You can customize the message here
            },
        };

        // Send the WhatsApp interactive message using the API
        const response = await axios.post(
            `https://graph.facebook.com/v13.0/${PHONE_NUMBER_ID}/messages`,
            messageData,
            {
                headers: {
                    Authorization: `Bearer ${ACCESS_TOKEN}`,
                    'Content-Type': 'application/json',
                },
            }
        );

        console.log('Message sent successfully:', response.data);
    } catch (error) {
        console.error('Error sending WhatsApp message:', error.response ? error.response.data : error.message);
    }
}
async function sendWhatsAppLinkMessage(phoneNumber,Message,) {
    try {
        console.log("Sending interactive message to:", phoneNumber);

        // Sanitize phone number (remove spaces, non-numeric characters)
        phoneNumber = phoneNumber.replace(/[^\d]/g, '');

        // Validate phone number format
        if (!isValidPhoneNumber(phoneNumber)) {
            throw new Error("Invalid phone number format. Expected format: 91xxxxxxxxxx.");
        }

        // Construct the message body for the interactive buttons
        const messageData = {
            messaging_product: "whatsapp",
            to: phoneNumber,
            type: "text",
            text: {
                preview_url: true,
                body: Message // You can customize the message here
            },
        };

        // Send the WhatsApp interactive message using the API
        const response = await axios.post(
            `https://graph.facebook.com/v13.0/${PHONE_NUMBER_ID}/messages`,
            messageData,
            {
                headers: {
                    Authorization: `Bearer ${ACCESS_TOKEN}`,
                    'Content-Type': 'application/json',
                },
            }
        );

        console.log('Message sent successfully:', response.data);
    } catch (error) {
        console.error('Error sending WhatsApp message:', error.response ? error.response.data : error.message);
    }
}

// Webhook for WhatsApp validation
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

// Send initial survey message (template-approved)
app.post('/send-survey', async (req, res) => {
    try {
        const { phoneNumbers } = req.body;

        if (!phoneNumbers || phoneNumbers.length === 0) {
            return res.status(400).json({ error: 'Phone numbers are required.' });
        }

        // Define the first approved survey message template components (buttons for English and Tamil options)
        const templateName = 'adi_dravidar_welcome_temp';  // Replace with your approved template name
        const components = [
            {
                type: 'button',
                sub_type: 'quick_reply',
                index: 0,
                parameters: [
                    {
                        type: 'payload',
                        payload: 'TAMIL_BUTTON_PAYLOAD',
                    }
                ]
            },
            {
                type: 'button',
                sub_type: 'quick_reply',
                index: 1,
                parameters: [
                    {
                        type: 'payload',
                        payload: 'ENGLISH_BUTTON_PAYLOAD',
                    }
                ]
            }
        ];

        // Send survey template to all phone numbers
        for (const phoneNumber of phoneNumbers) {
            await sendWhatsAppMessageWithButtons(phoneNumber, templateName, components);
        }

        return res.json({ success: 'Survey campaign messages sent successfully!' });

    } catch (error) {
        console.error('Error sending survey campaign:', error);
        res.status(500).json({ error: 'Failed to send survey campaign messages.' });
    }
});

// Handle incoming webhook to process button clicks
// Handle incoming webhook to process button clicks
// Handle incoming webhook to process button clicks
app.post('/webhook', async (req, res) => {
    try {
        console.log("Webhook received:", JSON.stringify(req.body, null, 2));

        const entry = req.body.entry && req.body.entry[0]; // Extract the first entry
        const changes = entry && entry.changes && entry.changes[0]; // Extract the first change
        const value = changes && changes.value; // Get value
        const messages = value && value.messages; // Get messages

        // Check if there are no messages in the webhook
        if (!messages || !messages.length) {
            console.log("No messages found in the webhook");
            return res.sendStatus(400);  // If no messages, respond with 400
        }

        // Process the first message
        const message = messages[0];
        const phoneNumber = message.from;  // The phone number of the user who interacted
        let id = null; // Declare `id` separately here

        // Check if the message is of type 'text'
        if (message.type === 'text' && message.text && typeof message.text.body === 'string') {
            const messageBody = message.text.body.toLowerCase();

            if (messageBody === 'hi') {
                console.log("Customer sent 'Hi', sending initial template message.");
                const langmessage = `Hi! Please select your preferred language:`;
                const buttons = [
                    { type: 'reply', reply: { id: 'TAMIL', title: "தமிழ்" } },
                    { type: 'reply', reply: { id: 'ENGLISH', title: "English" } }
                ];
                await sendWhatsAppCustomMessageWithButtons(phoneNumber, langmessage, buttons);
            }
        }
        if (message.type === 'interactive' && message.interactive.type === 'button_reply') {
            const buttonPayload= message.interactive.button_reply.id;  // This will give you the payload of the button clicked
            console.log("Button clicked with ID:", buttonPayload);
            if (buttonPayload === 'TAMIL') {
                const tamilMessage = `வணக்கம்! நீங்கள் தமிழில் பேச விரும்புகிறீர்கள். \n\nதயவுசெய்து கீழ்காணும் விருப்பங்களில் ஒன்றைத் தேர்ந்தெடுக்கவும்:`;
                const buttons = [
                    { type: 'reply', reply: { id: 'hiaadhar', title: "ஆதார் ரத்து" } },
                    { type: 'reply', reply: { id: 'hidbt', title: "DBT முடக்கம்" } },
                    { type: 'reply', reply: { id: 'hiother', title: "இதர பிரச்சனைகள்" } },
                ];
                await sendWhatsAppCustomMessageWithButtons(phoneNumber, tamilMessage, buttons);
            }

        }
        if (message.type === 'interactive' && message.interactive.type === 'button_reply') {
            const buttonPayload = message.interactive.button_reply.id;  // This will give you the payload of the button clicked
            console.log("Button clicked with ID:", buttonPayload);
            if (buttonPayload === 'hiother') {
                const hiotherMessage = ` கீழ்காணும் விருப்பங்களில் ஒன்றைத் தேர்ந்தெடுக்கவும்:`;
                const buttons = [
                    { type: 'reply', reply: { id: 'hiother1', title: "eKYC பிரச்சனை" } },
                    { type: 'reply', reply: { id: 'hiother2', title: "கிரெடிட் வரம்பு" } },
                    { type: 'reply', reply: { id: 'hiother3', title: "பிற சந்தேகங்கள்" } },
                ];
                await sendWhatsAppCustomMessageWithButtons(phoneNumber, hiotherMessage, buttons);
            }
        }
        if (message.type === 'interactive' && message.interactive.type === 'button_reply') {
            const buttonPayload = message.interactive.button_reply.id;  // This will give you the payload of the button clicked
            console.log("Button clicked with ID:", buttonPayload);
            if (buttonPayload === 'hiaadhar'|| buttonPayload === 'hidbt'|| buttonPayload === 'hiother1'|| buttonPayload === 'hiother2') {
                const hiOtherMessage = `நீங்கள் பிரச்சனையை தீர்த்து விட்டீர்களா?`;
                const buttons = [
                    { type: 'reply', reply: { id: 'hi_in', title: "✅ ஆம் " } },
                    { type: 'reply', reply: { id: 'hi_out', title: "❌ இல்லை " } }
                ];
                await sendWhatsAppCustomMessageWithButtons(phoneNumber, hiOtherMessage, buttons);
            }
        }
        if (message.type === 'interactive' && message.interactive.type === 'button_reply') {
            const buttonPayload = message.interactive.button_reply.id;  // This will give you the payload of the button clicked
            if (buttonPayload === 'hi_in') {
                const hi_inMessage = ` நன்றி! உங்கள் கல்வி உதவித் தொகையை வழங்க நடவடிக்கை மேற்கொள்ளப்படும்.😊`;
                await sendWhatsAppOnlyMessageWithButtons(phoneNumber, hi_inMessage);
            }
        }
        if (message.type === 'interactive' && message.interactive.type === 'button_reply') {
            const buttonPayload = message.interactive.button_reply.id;  // This will give you the payload of the button clicked
            if (buttonPayload === 'hi_out') {
                const hi_outMessage = `உங்கள் கேள்விகளைத் தெரிவிக்கவும்.`;
                await sendWhatsAppOnlyMessageWithButtons(phoneNumber, hi_outMessage);
            }
        }
        if (message.type === 'interactive' && message.interactive.type === 'button_reply') {
            const buttonPayload = message.interactive.button_reply.id;  // This will give you the payload of the button clicked
            console.log("Button clicked with ID:", buttonPayload);
            if (buttonPayload === 'hiother3') {
                const hiother3Message = `💡 தயவுசெய்து உங்கள் கேள்வியைத் தெரிவிக்கவும். நாங்கள் உதவ முயற்சிக்கிறோம்.`;
                await sendWhatsAppOnlyMessageWithButtons(phoneNumber, hiother3Message);
            }
        }
        if (message.type === 'text' && message.text && typeof message.text.body === 'string') {
            const messageBody = message.text.body.trim();
        
            // Regex to check if message is in Tamil Unicode range
            const isTamil = /^[\u0B80-\u0BFF\s]+$/.test(messageBody);
        
            // List of common words to ignore
            const commonTamilReplies = ['வணக்கம்', 'நன்றி', 'மன்னிக்கவும்', 'பை', 'ஸ்வாகதம்'];
            const specialCharacters = ['@', '!', '#', '$', '%', '^', '&', '*', '(', ')', '_', '+', '?', '>', '<', '.', ',', '/', '\\'];
        
            const isOnlySpecialChars = messageBody.split('').every(char => specialCharacters.includes(char));
            const isCommonReply = commonTamilReplies.includes(messageBody);
        
            // Check for Tamil replies with max 5 chars, not common, and not special chars
            if (isTamil && messageBody.length >= 1 && !isCommonReply && !isOnlySpecialChars) {
                const greetingMessage = 'வணக்கம்! எங்கள் சேவைகளைப் பயன்படுத்துவதற்காக நன்றி! 😊 \n\nஉங்கள் பிரச்சனையை பதிவு செய்து பிரிவிற்கு அனுப்பியுள்ளோம்';
                await sendWhatsAppOnlyMessageWithButtons(phoneNumber, greetingMessage);
            }
        }
        
        if (message.type === 'interactive' && message.interactive.type === 'button_reply') {
            const buttonPayload= message.interactive.button_reply.id;  // This will give you the payload of the button clicked
            console.log("Button clicked with ID:", buttonPayload);
            if (buttonPayload === 'ENGLISH') {
                const englishMessage = `Hello! You prefer to speak in English. \n\nPlease select one of the following options:`;
                const buttons = [
                    { type: 'reply', reply: { id: 'aadhar-hi', title: "Aadhaar Cancelled" } },
                    { type: 'reply', reply: { id: 'dbt-hi', title: "DBT Disabled" } },
                    { type: 'reply', reply: { id: 'other-hi', title: "Other Issues" } },
                ];
                await sendWhatsAppCustomMessageWithButtons(phoneNumber, englishMessage, buttons);
            }
        }
        if (message.type === 'interactive' && message.interactive.type === 'button_reply') {
            const buttonPayload = message.interactive.button_reply.id;  // This will give you the payload of the button clicked
            console.log("Button clicked with ID:", buttonPayload);
            if (buttonPayload === 'other-hi') {
                const MessageOther = `Please select one of the following options:`;
                const buttons = [
                    { type: 'reply', reply: { id: 'otherhi-1', title: "eKYC Not Completed" } },
                    { type: 'reply', reply: { id: 'otherhi-2', title: "Credit Limit Update" } },
                    { type: 'reply', reply: { id: 'otherhi-3', title: "Other Queries" } },
                ];
                await sendWhatsAppCustomMessageWithButtons(phoneNumber,MessageOther, buttons);
            }
        }
        if (message.type === 'interactive' && message.interactive.type === 'button_reply') {
            const buttonPayload = message.interactive.button_reply.id;  // This will give you the payload of the button clicked
            console.log("Button clicked with ID:", buttonPayload);
            if (buttonPayload === 'otherhi-1'|| buttonPayload === 'otherhi-2'|| buttonPayload === 'aadhar-hi'|| buttonPayload === 'dbt-hi') {
                const MessageOther = `Have you been able to address the issue?`;
                const buttons = [
                    { type: 'reply', reply: { id: 'yes-en', title: "✅ Yes " } },
                    { type: 'reply', reply: { id: 'no-en', title: "❌ No " } }
                ];
                await sendWhatsAppCustomMessageWithButtons(phoneNumber, MessageOther, buttons);
            }
        }

        if (message.type === 'interactive' && message.interactive.type === 'button_reply') {
            const buttonPayload = message.interactive.button_reply.id;  // This will give you the payload of the button clicked
            if (buttonPayload === 'yes-en') {
                const yesMessage = `Thank you! We will intimate the department so that your scholarship payment can be processed. 😊`;
                await sendWhatsAppOnlyMessageWithButtons(phoneNumber, yesMessage);
            }else if (buttonPayload === 'no-en') {
                const noMessage = `Please mention your queries.`;
                await sendWhatsAppOnlyMessageWithButtons(phoneNumber, noMessage);
            }
        }
        if (message.type === 'interactive' && message.interactive.type === 'button_reply') {
            const buttonPayload = message.interactive.button_reply.id;  // This will give you the payload of the button clicked
            console.log("Button clicked with ID:", buttonPayload);
            if (buttonPayload === 'otherhi-3') {
                const followMessage = `💡 Please mention your queries, and we will assist you in resolving it.`;
                await sendWhatsAppOnlyMessageWithButtons(phoneNumber, followMessage);
            }
        }
        if (message.type === 'text' && message.text && typeof message.text.body === 'string') {
            const messageBody = message.text.body.trim();
        
            // Check if the message is mostly English using a basic regex
            const isEnglish = /^[a-zA-Z0-9\s.,?!'"@#&$%()*+-/\\]*$/.test(messageBody);
        
            if (isEnglish && messageBody != 'hi' && messageBody !='Hi' && messageBody != 'Hello' && messageBody != 'hello' && messageBody.length > 1) {
                if (messageBody.length > 1){
                    const farewellMessage = 'Goodbye! Thank you for using our services! 😊 \n\nWe have taken your issue and shared it with the division. We will be reaching out to you.';
                    await sendWhatsAppOnlyMessageWithButtons(phoneNumber, farewellMessage);
                } else {
                    const errorMessage = 'Please check the message you sent and try again.';
                    await sendWhatsAppOnlyMessageWithButtons(phoneNumber, errorMessage);
                }
            }
        }
        

        // Check if the message is of type 'button'
        if (message.type === 'button' && message.button && message.button.payload) {
            const payload = message.button.payload;  // The button payload
            console.log("Button clicked with payload:", payload);

            if (payload === 'TAMIL_BUTTON_PAYLOAD') {
                    const LanguageMessage = `ஆதிதிராவிடர் நலத்துறை சார்பில் வணக்கம்! 👋
                    இன்று எதைப் பற்றி பேச விரும்புகிறீர்கள்? கீழ்காணும் பிரச்சனைகளில் ஒன்றைத் தேர்ந்தெடுங்கள்:`;
                    console.log(`Language message sent: ${LanguageMessage}`);

                // Send custom buttons for the user to select an issus
                    const buttons = [
                         { type: 'reply', reply: { id: 'aadhaar_related', title: "ஆதார் ரத்து ", } },
                         { type: 'reply', reply: { id: 'dbt_related', title: "DBT முடக்கம்" } },
                         { type: 'reply', reply: { id: 'more_related', title: "மேலும் பிரச்சனைகள்" } },
                        //  { type: 'reply', reply: { id: 'bank_related', title: "eKYC நிலைமையை பூர்த்தி செய்யவில்லை" } },
                        //  { type: 'reply', reply: { id: 'credit_related', title: "கிரெடிட் வரம்பு" } },
                        //  { type: 'reply', reply: { id: 'others', title: "📨 பிற சந்தேகங்கள்" } },
                    ];
                // Send the custom message with buttons

                await sendWhatsAppCustomMessageWithButtons(phoneNumber, LanguageMessage, buttons);
            } 
            if (payload === 'ENGLISH_BUTTON_PAYLOAD') {
                const lAnguageMessage = `👋 Hello! How may I assist you today? Please select the type of issue you want to talk about.`;
                console.log(`Language message sent: ${lAnguageMessage}`);

                // Send custom buttons for the user to select an issue
                const buttons = [
                    { type: 'reply', reply: { id: 'aadhaar_issues', title: "Aadhaar Cancelled" } },
                    { type: 'reply', reply: { id: 'dbt_issues', title: "DBT Disabled" } },
                    { type: 'reply', reply: { id: 'more_issues', title: "More issues" } },
                    // { type: 'reply', reply: { id: 'bank_issues', title: "Aadhaar Number Not Mapped to Bank Account" } },
                    // { type: 'reply', reply: { id: 'account_issues', title: "Account Blocked " } },
                    // { type: 'reply', reply: { id: 'account_freez_issues', title: "Account Frozen" } },
                    // { type: 'reply', reply: { id: 'credit_issues', title: "Account Credit Limit Update" } },
                    // { type: 'reply', reply: { id: 'other_issues', title: "Other Queries" } },
                ];
                // Send the custom message with buttons
                await sendWhatsAppCustomMessageWithButtons(phoneNumber, lAnguageMessage, buttons);
            }
                
         } 
        // Check if the message is of type 'interactive' and contains button reply
        if (message.type === 'interactive' && message.interactive.type === 'button_reply') {
            const buttonPayload = message.interactive.button_reply.id;  // This will give you the payload of the button clicked
            if (buttonPayload === 'more_issues') {
                const moreMessage = 'Please select the type of issue you want to talk about.';
                const buttons = [
                    { type: 'reply', reply: { id: 'bank_issues', title: "eKYC Not Completed" } },
                    { type: 'reply', reply: { id: 'credit_issues', title: "Credit Limit Update" } },
                    { type: 'reply', reply: { id: 'ncpi_issues', title: "Ncpi Deactivate" } },
                ];
                await sendWhatsAppCustomMessageWithButtons(phoneNumber, moreMessage, buttons);
            }
        }
        if (message.type === 'interactive' && message.interactive.type === 'button_reply') {
            const buttonPayload = message.interactive.button_reply.id;  // This will give you the payload of the button clicked
           if (buttonPayload === 'more_related') {
                const moreRelatedMsg = 'மற்ற பிரச்சனைகளைத் தேர்ந்தெடுக்கவும்:';
                 const buttons = [
                    {"type": "reply", "reply": {"id": "ncpi_related", "title": "NPCI செயலிழப்பு"}},
                    {"type": "reply", "reply": {"id": "bank_related", "title": "eKYC பிரச்சனை"}},
                    {"type": "reply", "reply": {"id": "credit_related", "title": "கிரெடிட் வரம்பு"}}
                ]
             await sendWhatsAppCustomMessageWithButtons(phoneNumber, moreRelatedMsg, buttons);
             }
        }
        if (message.type === 'interactive' && message.interactive.type === 'button_reply') {
            const buttonPayload = message.interactive.button_reply.id;  // This will give you the payload of the button clicked
            if (buttonPayload === 'aadhaar_related') {
                const aadhaarMessage = '🚨 உங்கள் ஆதார் ரத்து செய்யப்பட்டதால், உதவித் தொகை வழங்க இயலவில்லை.\n\nஇந்த பிரச்சனையை தீர்க்க விருப்பமா? 🤔';
                const buttons = [
                    { type: 'reply', reply: { id: 'yes_in', title: "✅ ஆம் " } },
                    { type: 'reply', reply: { id: 'no_out', title: "❌ இல்லை " } }
                ];
                await sendWhatsAppCustomMessageWithButtons(phoneNumber, aadhaarMessage, buttons);
            }
        }
            
        if (message.type === 'interactive' && message.interactive.type === 'button_reply') {
             const buttonPayload = message.interactive.button_reply.id;
              if(buttonPayload === 'yes_in') {
                  const aadharyesMessage = 'கீழ்காணும்  வழிமுறைகளின்படி நீங்கள் இந்த பிரச்சனையை தீர்க்கலாம்: \n\n1.அருகிலுள்ள ஆதார் சேவைக் மையத்திற்கு செல்லுங்கள் (Aadhaar Seva Kendra).\n2. கொண்டு செல்ல வேண்டிய ஆவணங்கள்: \n  ○	உங்கள் ஆதார் அட்டை. \n  ○	சான்று ஆவணங்கள் PAN கார்டு, வாக்காளர் அட்டை, பாஸ்போர்ட், குடும்ப அட்டை போன்றவை. \n3. அதிகாரிகளிடம் உங்கள் ஆதார் ரத்து செய்யப்பட்ட விவரத்தை சரிபார்த்து, சரி செய்யும்படி கோருங்கள்.\n சரிசெய்யப்பட்டதும், ஆதார் நிலை புதுப்பிக்கப்பட்டு, உங்களுக்கு தகவல் அனுப்பப்படும். \n 📍 அருகிலுள்ள ஆதார் மையம்: `{https://appointments.uidai.gov.in/easearch.aspx}`.\n ✔️ பிறகு, UMIS-இல் சரியான ஆதார் எண்ணை உள்ளீடு செய்திருக்கின்றீர்கள் என்பதை உறுதி செய்யுங்கள்.\n\n📢 முக்கியம்: ஆதார் செயல்படுத்தப்பட்டதும், இந்த எண்ணுக்கு "Hi" என ஒரு செய்தியை அனுப்புங்கள். பின்னர், உங்கள் உதவித்தொகையை வழங்க நடவடிக்கை எடுக்கபடும். 😊';
                 await sendWhatsAppOnlyMessageWithButtons(phoneNumber, aadharyesMessage);
            }else if (buttonPayload === 'no_out') {
                const noMessage = 'நீங்கள் ‘இல்லை’ என்று சொன்னதற்கான காரணத்தை தெரிவிக்க முடியுமா? கீழ்க்காணும் விருப்பங்களில் ஒன்றை தேர்வுசெய்யவும்:';
                const buttons = [
                    { type: 'reply', reply: { id: 'no_issue', title: "ஆதார் பிரச்சனை இல்லை" } },
                    { type: 'reply', reply: { id: 'no_scholarship', title: "உதவித்தொகை வேண்டாம்" } }
                ];
                await sendWhatsAppCustomMessageWithButtons(phoneNumber, noMessage, buttons);
            }
        }
        if (message.type === 'interactive' && message.interactive.type === 'button_reply') {
            const buttonPayload = message.interactive.button_reply.id;  // This will give you the payload of the button clicked
            if (buttonPayload === 'no_issue' || buttonPayload === 'no_scholarship') {
                const noIssueMessage = 'நன்றி! உங்கள் பதிலைப் பெற்றுள்ளோம். எங்கள் சேவைகளைப் பயன்படுத்துவதற்காக நன்றி! 😊';
                await sendWhatsAppOnlyMessageWithButtons(phoneNumber, noIssueMessage, buttons);
            }
        }

        if (message.type === 'interactive' && message.interactive.type === 'button_reply') {
            const buttonPayload = message.interactive.button_reply.id;  // This will give you the payload of the button clicked
            if (buttonPayload === 'dbt_related') {
                const dbtMessage = ' 🚨 உங்கள் ஆதாருடன் இணைக்கப்பட்ட வங்கிக் கணக்கில் DBT (நேரடி நலவழங்கல் பரிமாற்றம்) செயல்பாட்டை முடக்கியதால், உதவித் தொகை வழங்க இயலவில்லை.\n\nஇந்த பிரச்சனையை தீர்க்க விருப்பமா? 🤔';
                const buttons = [
                    { type: 'reply', reply: { id: 'dbt_yes', title: "✅ ஆம் " } },
                    { type: 'reply', reply: { id: 'dbt_no', title: "❌ இல்லை " } }
                ];
                await sendWhatsAppCustomMessageWithButtons(phoneNumber, dbtMessage, buttons);
            }
        }
        if (message.type === 'interactive' && message.interactive.type === 'button_reply') {
            const buttonPayload = message.interactive.button_reply.id;  // This will give you the payload of the button clicked
            if (buttonPayload === 'dbt_yes') {
                const dbtyesMessage = 'உங்கள் பிரச்சனையை தீர்க்க 3 வழிகள் உள்ளன:';
                const buttons = [
                    { type: 'reply', reply: { id: 'online', title: "ஆன்லைனில் சரிபார்க்க:" } },
                    { type: 'reply', reply: { id: 'mobile', title: "மொபைல் வழியாக" } },
                    { type: 'reply', reply: { id: 'bank', title: "வங்கி கிளை" } }
                ];
                await sendWhatsAppCustomMessageWithButtons(phoneNumber, dbtyesMessage, buttons);
            } else if (buttonPayload === 'dbt_no') {
                const nodbtMessage = 'நீங்கள் ‘இல்லை’ என்று சொன்னதற்கான காரணத்தை தெரிவிக்க முடியுமா? கீழ்க்காணும் விருப்பங்களில் ஒன்றை தேர்வுசெய்யவும்:';
                const buttons = [
                    { type: 'reply', reply: { id: 'no_dbtissue', title: "DBT சரியாக உள்ளது" } },
                    { type: 'reply', reply: { id: 'no-need', title: "தனியாக தீர்க்க விரும்புகிறேன்" } }
                ];
                await sendWhatsAppCustomMessageWithButtons(phoneNumber, nodbtMessage, buttons);
            }
        }
        if (message.type === 'interactive' && message.interactive.type === 'button_reply') {
            const buttonPayload = message.interactive.button_reply.id;  // This will give you the payload of the button clicked
            if (buttonPayload === 'online') {
                const onlineMessage = 'DBT நிலையை ஆன்லைனில் சரிபார்க்க, கீழ்காணும் படிகளைப் பின்பற்றவும்:\n\n ●	இணையதளம்: https://myaadhaar.uidai.gov.in.\n ●	உங்கள் ஆதார் எண்ணை உள்ளிடவும்.\n ●	ஆதார் எண், OTP மூலம் உள்நுழையவும்.\n ●	“Bank Seeding Status” என்பதை தேர்வு செய்யவும்.\n ●	DBT நிலையை காணலாம்; செயலற்றிருந்தால் வங்கிக்கு சென்று செயல்படுத்தவும்\n\n\n📢 முக்கியம்: DBT செயல்படுத்திய பிறகு, இந்த எண்ணுக்கு "Hi" என ஒரு செய்தியை அனுப்புங்கள். பின்னர், உங்கள் கல்வி உதவித்தொகையை வழங்க நடவடிக்கை எடுக்கபடும். 😊😊';
                await sendWhatsAppLinkMessage(phoneNumber, onlineMessage);
            }else if (buttonPayload === 'mobile') {
                const mobileMessage = 'DBT நிலையை மொபைல் வழியாக சரிபார்க்க, கீழ்காணும் படிகளைப் பின்பற்றவும்:\n\n●	உங்கள் ஆதார் பதிவு செய்யப்பட்ட எண்ணிலிருந்து *99991# அழைக்கவும்.\n ●	12 இலக்க ஆதார் எண்ணை உள்ளீடு செய்யவும்.\n ●	வழிகாட்டல்களை பின்பற்றவும்.\n\n\n📢 முக்கியம்: DBT செயல்படுத்திய பிறகு, இந்த எண்ணுக்கு "Hi" என ஒரு செய்தியை அனுப்புங்கள். பின்னர், உங்கள் கல்வி உதவித்தொகையை வழங்க நடவடிக்கை எடுக்கபடும். 😊😊';
                await sendWhatsAppLinkMessage(phoneNumber, mobileMessage);
            }else if (buttonPayload === 'bank') {
                const bankMessage = 'DBT நிலையை வங்கி கிளையில் சரிபார்க்க, கீழ்காணும் படிகளைப் பின்பற்றவும்:\n\n ●	வங்கிக்கு செல்லுங்கள், ஆதார், அடையாள ஆவணங்களை எடுத்துச் செல்லுங்கள்.\n●	DBT செயல்படுத்த கோரிக்கை வைக்கவும்.\n ●	நடவடிக்கை நிலை சில நாட்களில் புதுப்பிக்கப்படும்.\n\n\n📢 முக்கியம்: DBT செயல்படுத்திய பிறகு, இந்த எண்ணுக்கு "Hi" என ஒரு செய்தியை அனுப்புங்கள். பின்னர், உங்கள் கல்வி உதவித்தொகையை வழங்க நடவடிக்கை எடுக்கபடும். 😊😊';
                await sendWhatsAppLinkMessage(phoneNumber, bankMessage);
            }    

        }
        if (message.type === 'interactive' && message.interactive.type === 'button_reply') {
            const buttonPayload = message.interactive.button_reply.id;  // This will give you the payload of the button clicked
            if (buttonPayload === 'no_dbtissue'|| buttonPayload === 'no-need') {
                const noDbtMessage = 'நன்றி! உங்கள் பதிலைப் பெற்றுள்ளோம். எங்கள் சேவைகளைப் பயன்படுத்துவதற்காக நன்றி! 😊';
                await sendWhatsAppCustomMessageWithButtons(phoneNumber, noDbtMessage,);
            }
        }
        if (message.type === 'interactive' && message.interactive.type === 'button_reply') {
            const buttonPayload = message.interactive.button_reply.id;  // This will give you the payload of the button clicked
            if (buttonPayload === 'ncpi_related') {
                const ncpiMessage = '🚨 முக்கிய அறிவிப்பு: உங்கள் வங்கிக் கணக்கு NPCI மூலம் ஆதாருடன் இணைக்கப்படவில்லை (இல்லை எனினும் முடக்கம்/மூடப்பட்டது/இறுக்கப்பட்ட கணக்கு), எனவே  கல்வி உதவித் தொகையை அனுப்ப முடியவில்லை.\n\nஇந்த பிரச்சனையை தீர்க்க விருப்பமா? 🤔';
                const buttons = [
                    { type: 'reply', reply: { id: 'ncpi_yes', title: "✅ ஆம் " } },
                    { type: 'reply', reply: { id: 'ncpi_no', title: "❌ இல்லை " } }
                ];
                await sendWhatsAppCustomMessageWithButtons(phoneNumber, ncpiMessage, buttons);
            }
        }
        if (message.type === 'interactive' && message.interactive.type === 'button_reply') {
            const buttonPayload = message.interactive.button_reply.id;  // This will give you the payload of the button clicked
            if (buttonPayload === 'ncpi_yes') {
                const ncpiMessage = 'பிரச்சனையை தீர்க்க இரண்டு வழிகள்:\n\n🔹 புதிய ஆதார் இணைக்கப்பட்ட கணக்கை திறக்கவும் (பரிந்துரைக்கப்படுகிறது).\n●	புதிய சேமிப்புக் கணக்கை திறக்கவும்.\n● ஆதாருடன் இணைக்கும்.\n ●	NPCI தானாக செயல்படுத்தப்படும்.\n\n 🔹 ஏற்கனவே உள்ள கணக்கை செயல்படுத்தவும்.\n●	வங்கியில் NPCI இணைப்பை கோருங்கள்.\n ●	சில நாட்களில் நிலை புதுப்பிக்கப்படும்.\n💡 NPCI நிலையை ஆன்லைனில் பார்க்க: \nhttps://pfms.nic.in/NewDefaultHome.aspx#KnowYourPayments\n\n\n📢 முக்கியம்: NPCI செயல்படுத்திய பிறகு, இந்த எண்ணுக்கு "Hi" என ஒரு செய்தியை அனுப்புங்கள். பின்னர், உங்கள் கல்வி உதவித்தொகையை வழங்க நடவடிக்கை எடுக்கபடும். 😊😊';
                await sendWhatsAppOnlyMessageWithButtons(phoneNumber, ncpiMessage);
            }else if (buttonPayload === 'ncpi_no') {
                const noMessage = 'நீங்கள் ‘இல்லை’ என்று சொன்னதற்கான காரணத்தை தெரிவிக்க முடியுமா? கீழ்க்காணும் விருப்பங்களில் ஒன்றை தேர்வுசெய்யவும்:';
                const buttons = [
                    { type: 'reply', reply: { id: 'no_ncpiissue', title: "NPCI சரியாக உள்ளது" } },
                    { type: 'reply', reply: { id: 'no-ncpineed', title: "தனியாக தீர்க்க விரும்புகிறேன்" } }
                ];
                await sendWhatsAppCustomMessageWithButtons(phoneNumber, noMessage, buttons);
            }
        }
        if (message.type === 'interactive' && message.interactive.type === 'button_reply') {
            const buttonPayload = message.interactive.button_reply.id;  // This will give you the payload of the button clicked
            if (buttonPayload === 'no_ncpiissue'|| buttonPayload === 'no-ncpineed') {
                const noNcpiMessage = 'நன்றி! உங்கள் பதிலைப் பெற்றுள்ளோம். எங்கள் சேவைகளைப் பயன்படுத்துவதற்காக நன்றி! 😊';
                await sendWhatsAppOnlyMessageWithButtons(phoneNumber, noNcpiMessage,);
            }
        }
        if (message.type === 'interactive' && message.interactive.type === 'button_reply') {
            const buttonPayload = message.interactive.button_reply.id;  // This will give you the payload of the button clicked
            if (buttonPayload === 'bank_related') {
                const bankMessage = '🚨 முக்கிய அறிவிப்பு: eKYC பூர்த்தி செய்யாததால் உதவித் தொகை வழங்க இயலவில்லை.\n\nஇந்த பிரச்சனையை தீர்க்க விருப்பமா? 🤔';
                const buttons = [
                    { type: 'reply', reply: { id: 'bank_yes', title: "✅ ஆம் " } },
                    { type: 'reply', reply: { id: 'bank_no', title: "❌ இல்லை " } }
                ];
                await sendWhatsAppCustomMessageWithButtons(phoneNumber, bankMessage, buttons);
            }
        }
        if (message.type === 'interactive' && message.interactive.type === 'button_reply') {
            const buttonPayload = message.interactive.button_reply.id;  // This will give you the payload of the button clicked
            if (buttonPayload === 'bank_yes') {
                const ekycMessage = '✅ தீர்வு வழிமுறை:\n\n1.	வங்கிக்கு செல்லுங்கள்.\n2.	ஆதார் கொண்டு eKYC பூர்த்தி செய்யுங்கள்.\n3.	தேவைப்பட்டால் பயோமெட்ரிக் சரிபார்ப்பு செய்யுங்கள்.\n 4.	பூர்த்தி செய்த பிறகு நிலை புதுப்பிக்கப்படும்.\n\n\n📢 முக்கியம்: eKYC பூர்த்தியிடப்பட்ட பிறகு, இந்த எண்ணுக்கு "Hi" என ஒரு செய்தியை அனுப்புங்கள். பின்னர், உங்கள் கல்வி உதவித்தொகையை வழங்க நடவடிக்கை எடுக்கபடும். 😊😊;'
                await sendWhatsAppOnlyMessageWithButtons(phoneNumber, ekycMessage);
            }else if (buttonPayload === 'bank_no') {
                const ekycnoMessage = 'நீங்கள் ‘இல்லை’ என்று சொன்னதற்கான காரணத்தை தெரிவிக்க முடியுமா? கீழ்க்காணும் விருப்பங்களில் ஒன்றை தேர்வுசெய்யவும்:;'
                const buttons = [
                    { type: 'reply', reply: { id: 'no_ekycissue', title: "eKYC சரியாக உள்ளது" } },
                    { type: 'reply', reply: { id: 'no-ekycneed', title: "தனியாக தீர்க்க விரும்புகிறேன்" } }
                ];
                await sendWhatsAppCustomMessageWithButtons(phoneNumber, ekycnoMessage, buttons);
            }
        }
        if (message.type === 'interactive' && message.interactive.type === 'button_reply') {
            const buttonPayload = message.interactive.button_reply.id;  // This will give you the payload of the button clicked
            if (buttonPayload === 'no_ekycissue'|| buttonPayload === 'no-ekycneed') {
                const noEkycMessage = 'நன்றி! உங்கள் பதிலைப் பெற்றுள்ளோம். எங்கள் சேவைகளைப் பயன்படுத்துவதற்காக நன்றி! 😊';
                await sendWhatsAppOnlyMessageWithButtons(phoneNumber, noEkycMessage,);
            }
        }
        if (message.type === 'interactive' && message.interactive.type === 'button_reply') {
            const buttonPayload = message.interactive.button_reply.id;  // This will give you the payload of the button clicked
            if (buttonPayload === 'credit_related') {
                const creditMessage = '🚨 முக்கிய அறிவிப்பு: உங்கள் வங்கிக் கணக்கின் கிரெடிட் வரம்பு குறைவாக உள்ள காரணத்தால்  கல்வி உதவித்தொகையை அனுப்ப முடியவில்லை.\n\nஇந்த பிரச்சனையை தீர்க்க விருப்பமா? 🤔';
                const buttons = [
                    { type: 'reply', reply: { id: 'credit_yes', title: "✅ ஆம் " } },
                    { type: 'reply', reply: { id: 'credit_no', title: "❌ இல்லை " } }
                ];
                await sendWhatsAppCustomMessageWithButtons(phoneNumber, creditMessage, buttons);
            }
        }
        if (message.type === 'interactive' && message.interactive.type === 'button_reply') {
            const buttonPayload = message.interactive.button_reply.id;  // This will give you the payload of the button clicked
            if (buttonPayload === 'credit_yes') {
                const creditMessage = '✅ தீர்வு வழிமுறை:\n\n1.	வங்கிக்கு செல்லுங்கள்.\n2.	கணக்கில் உள்ள கிரெடிட் வரம்பை சரிபார்க்கவும்.\n3.	கணக்கில் தேவையான தொகையைச் சேர்க்கவும்.\n4.	பூர்த்தி செய்த பிறகு நிலை புதுப்பிக்கப்படும்.\n\n\n📢 முக்கியம்: கிரெடிட் வரம்பு சரியாக உள்ள பிறகு, இந்த எண்ணுக்கு "Hi" என ஒரு செய்தியை அனுப்புங்கள். பின்னர், உங்கள் கல்வி உதவித்தொகையை வழங்க நடவடிக்கை எடுக்கபடும். 😊😊;'
                await sendWhatsAppOnlyMessageWithButtons(phoneNumber, creditMessage);
            }else if (buttonPayload === 'credit_no') {
                const creditnoMessage = 'நீங்கள் ‘இல்லை’ என்று சொன்னதற்கான காரணத்தை தெரிவிக்க முடியுமா? கீழ்க்காணும் விருப்பங்களில் ஒன்றை தேர்வுசெய்யவும்:;'
                const buttons = [
                    { type: 'reply', reply: { id: 'no_creditissue', title: "கிரெடிட் பிரச்சனை இல்லை" } },
                    { type: 'reply', reply: { id: 'no-creditneed', title: "தனியாக தீர்க்க விரும்புகிறேன்" } }
                ];
                await sendWhatsAppCustomMessageWithButtons(phoneNumber, creditnoMessage, buttons);
            
            }
        }
        if (message.type === 'interactive' && message.interactive.type === 'button_reply') {
            const buttonPayload = message.interactive.button_reply.id;  // This will give you the payload of the button clicked
            if (buttonPayload === 'no_creditissue'|| buttonPayload === 'no-creditneed') {
                const noCreditMessage = 'நன்றி! உங்கள் பதிலைப் பெற்றுள்ளோம். எங்கள் சேவைகளைப் பயன்படுத்துவதற்காக நன்றி! 😊';
                await sendWhatsAppOnlyMessageWithButtons(phoneNumber, noCreditMessage,);
            }
        }
        // if (message.type === 'interactive' && message.interactive.type === 'button_reply') {
        //     const buttonPayload = message.interactive.button_reply.id;  // This will give you the payload of the button clicked
        //     if (buttonPayload === 'others') {
        //         const otherMessage = 'தயவுசெய்து உங்கள் கேள்வியைத் தெரிவிக்கவும். நாங்கள் உதவ முயற்சிக்கிறோம்.';
        //     }
        //         await sendWhatsAppOnlyMessageWithButtons(phoneNumber, otherMessage);
        // }
        // if (message.type === 'text' && message.text && typeof message.text.body === 'string') {
        //     const messageBody = message.text.body.toLowerCase();
        //     if (messageBody !== 'hi' && messageBody != 'hello') {
        //         const greetingMessage = 'வணக்கம்! எங்கள் சேவைகளைப் பயன்படுத்துவதற்காக நன்றி! 😊 \n\nஉங்கள் பிரச்சனையை பதிவு செய்து பிரிவிற்கு அனுப்பியுள்ளோம்';
        //         await sendWhatsAppOnlyMessageWithButtons(phoneNumber, greetingMessage);
        
        //     }
        // }
        if (message.type === 'interactive' && message.interactive.type === 'button_reply') {
            const buttonPayload = message.interactive.button_reply.id;
            // This will give you the payload of the button clicked
            if (buttonPayload === 'aadhaar_issues') {
                const aadhaarMessage = '🚨 Important Notice:The government is unable to disburse your Post Matric scholarship for College because system shows your Aadhaar Number has been cancelled.\n\nWould you like to know how to solve this issue so your scholarship payment can be successfully processed? 🤔';
                const buttons = [
                    { type: 'reply', reply: { id: 'yes_aadhar', title: "✅ Yes " } },
                    { type: 'reply', reply: { id: 'no_aadhar', title: "❌ No" } }
                ];
                await sendWhatsAppCustomMessageWithButtons(phoneNumber, aadhaarMessage, buttons);
            }else if (buttonPayload === 'yes_aadhar') {
                const aadhaarSolutionMessage = '✅ That’s great! Here are the steps you can resolve the issue::\n\n1 Visit the nearest Aadhaar Seva Kendra (ASK).\n2.	Carry the following documents with you:\n\t\t●	Your Aadhaar Card (if available).\n\t\t●	Any valid Proof of Identity (PoI) and Proof of Address (PoA) documents (e.g., PAN Card, Voter ID, Passport, Ration Card, etc.).\n3.	Request the officials to verify and resolve the issue related to the cancellation of your Aadhaar.\n4.	Once corrected, the status will be updated, and you will receive a message.\n\n\n📢 Important: After updating your Aadhaar Number, please send a message saying "Hi" to this number. Then, action will be taken to process your scholarship payment. 😊😊';
                await sendWhatsAppOnlyMessageWithButtons(phoneNumber, aadhaarSolutionMessage);
            }else if (buttonPayload === 'no_aadhar') {
                const noAadharMessage = 'Thank you for your response! Please let us know the reason for saying "No" by selecting one of the options below:';
                const buttons = [
                    { type: 'reply', reply: { id: 'no_aadharissue', title: "Aadhaar is correct" } },
                    { type: 'reply', reply: { id: 'no-aadharneed', title: "sortit out by myself" } }
                ];
                await sendWhatsAppCustomMessageWithButtons(phoneNumber, noAadharMessage, buttons);
            }else if (buttonPayload === 'no_aadharissue'|| buttonPayload === 'no-aadharneed') {
                const noAadharMessage = 'Thank you! We have received your response. Thank you for using our services! 😊';
                await sendWhatsAppOnlyMessageWithButtons(phoneNumber, noAadharMessage,);
            }
        }
        if (message.type === 'interactive' && message.interactive.type === 'button_reply') {
            const buttonPayload = message.interactive.button_reply.id;  // This will give you the payload of the button clicked
            if (buttonPayload === 'ncpi_issues') {
                const ncpiMessage = '🚨 Important Notice: Your bank account is not linked with NPCI (either not linked or blocked/closed), so the scholarship amount cannot be sent.\n\nWould you like to know how to solve this issue so your scholarship payment can be successfully processed? 🤔';
                const buttons = [
                    { type: 'reply', reply: { id: 'yes_ncpi', title: "✅ Yes " } },
                    { type: 'reply', reply: { id: 'no_ncpi', title: "❌ No" } }
                ];
                await sendWhatsAppCustomMessageWithButtons(phoneNumber, ncpiMessage, buttons);
            }
        }
        if (message.type === 'interactive' && message.interactive.type === 'button_reply') {
            const buttonPayload = message.interactive.button_reply.id;  // This will give you the payload of the button clicked
            if (buttonPayload === 'yes_ncpi') {
                const ncpiSolutionMessage = '✅ Solution Steps:\n\n1. Visit your bank and request to link your Aadhaar with your bank account.\n2. Provide the necessary documents for verification.\n3. Once linked, the NPCI will automatically activate your account.\n4. After activation, the status will be updated, and you will receive a message.\n\n\n📢 Important: After linking your Aadhaar with NPCI, please send a message saying "Hi" to this number. Then, action will be taken to process your scholarship payment. 😊😊';
                await sendWhatsAppOnlyMessageWithButtons(phoneNumber, ncpiSolutionMessage);
            }else if (buttonPayload === 'no_ncpi') {
                const noNcpiMessage = 'Thank you for your response! Please let us know the reason for saying "No" by selecting one of the options below:';
                const buttons = [
                    { type: 'reply', reply: { id: 'ncpiissue_no', title: " NPCI is correct" } },
                    { type: 'reply', reply: { id: 'ncpineed_no', title: "work alone" } }
                ];
                await sendWhatsAppCustomMessageWithButtons(phoneNumber, noNcpiMessage, buttons);
            }else if (buttonPayload === 'ncpiissue_no'|| buttonPayload === 'ncpineed_no') {
                const NcpiMessageno = 'Thank you! We have received your response. Thank you for using our services! 😊';
                await sendWhatsAppOnlyMessageWithButtons(phoneNumber, NcpiMessageno,);
            }
        }
        if (message.type === 'interactive' && message.interactive.type === 'button_reply') {
            const buttonPayload = message.interactive.button_reply.id;  // This will give you the payload of the button clicked
            if (buttonPayload === 'bank_issues') {
                const ekycMessage = '🚨 Important Notice: The scholarship amount cannot be sent due to incomplete eKYC.\n\nWould you like to know how to solve this issue so your scholarship payment can be successfully processed? 🤔';
                const buttons = [
                    { type: 'reply', reply: { id: 'yesekyc', title: "✅ Yes " } },
                    { type: 'reply', reply: { id: 'noekyc', title: "❌ No" } }
                ];
                await sendWhatsAppCustomMessageWithButtons(phoneNumber, ekycMessage, buttons);
            }
        }
        if (message.type === 'interactive' && message.interactive.type === 'button_reply') {
            const buttonPayload = message.interactive.button_reply.id;  // This will give you the payload of the button clicked
            if (buttonPayload === 'yesekyc') {
                const ekycSolutionMessage = '✅ Solution Steps:\n\n1. Visit your bank and request to complete eKYC.\n2. Provide your Aadhaar and any other required documents.\n3. Complete the biometric verification if necessary.\n4. After completion, the status will be updated, and you will receive a message.\n\n\n📢 Important: After completing eKYC, please send a message saying "Hi" to this number. Then, action will be taken to process your scholarship payment. 😊😊';
                await sendWhatsAppOnlyMessageWithButtons(phoneNumber, ekycSolutionMessage);
            }else if (buttonPayload === 'noekyc') {
                const noEkycMessage = 'Thank you for your response! Please let us know the reason for saying "No" by selecting one of the options below:';
                const buttons = [
                    { type: 'reply', reply: { id: 'ekycissue_no', title: " eKYC is correct" } },
                    { type: 'reply', reply: { id: 'ekycneed_no', title: "work alone" } }
                ];
                await sendWhatsAppCustomMessageWithButtons(phoneNumber, noEkycMessage, buttons);
            }else if (buttonPayload === 'ekycissue_no'|| buttonPayload === 'ekycneed_no') {
                const EkycMessageno = 'Thank you! We have received your response. Thank you for using our services! 😊';
                await sendWhatsAppOnlyMessageWithButtons(phoneNumber, EkycMessageno,);
            }
        }
        if (message.type === 'interactive' && message.interactive.type === 'button_reply') {
            const buttonPayload = message.interactive.button_reply.id;  // This will give you the payload of the button clicked
            if (buttonPayload === 'credit_issues') {
                const creditMessage = '🚨 Important Notice: The scholarship amount cannot be sent due to insufficient credit limit in your bank account.\n\nWould you like to know how to solve this issue so your scholarship payment can be successfully processed? 🤔';
                const buttons = [
                    { type: 'reply', reply: { id: 'yescredit', title: "✅ Yes " } },
                    { type: 'reply', reply: { id: 'nocredit', title: "❌ No" } }
                ];
                await sendWhatsAppCustomMessageWithButtons(phoneNumber, creditMessage, buttons);
            }
        }
        if (message.type === 'interactive' && message.interactive.type === 'button_reply') {
            const buttonPayload = message.interactive.button_reply.id;  // This will give you the payload of the button clicked
            if (buttonPayload === 'yescredit') {
                const creditSolutionMessage = '✅ Solution Steps:\n\n1. Visit your bank and check your credit limit.\n2. Deposit the required amount into your account.\n3. After completion, the status will be updated, and you will receive a message.\n\n\n📢 Important: After updating your credit limit, please send a message saying "Hi" to this number. Then, action will be taken to process your scholarship payment. 😊😊';
                await sendWhatsAppOnlyMessageWithButtons(phoneNumber, creditSolutionMessage);
            }else if (buttonPayload === 'nocredit') {
                const noCreditMessage = 'Thank you for your response! Please let us know the reason for saying "No" by selecting one of the options below:';
                const buttons = [
                    { type: 'reply', reply: { id: 'creditissue_no', title: "My Credit Limit is correct" } },
                    { type: 'reply', reply: { id: 'creditneed_no', title: "work alone" } }
                ];
                await sendWhatsAppCustomMessageWithButtons(phoneNumber, noCreditMessage, buttons);
            }else if (buttonPayload === 'creditissue_no'|| buttonPayload === 'creditneed_no') {
                const CreditMessageno = 'Thank you! We have received your response. Thank you for using our services! 😊';
                await sendWhatsAppOnlyMessageWithButtons(phoneNumber, CreditMessageno,);
            }
        }
        if (message.type === 'interactive' && message.interactive.type === 'button_reply') {
            const buttonPayload = message.interactive.button_reply.id;  // This will give you the payload of the button clicked
            if (buttonPayload === 'dbt_issues') {
                const dbtMessage = '🚨 Important Notice: The scholarship amount cannot be sent due to issues with the Direct Benefit Transfer (DBT) system.\n\nWould you like to know how to solve this issue so your scholarship payment can be successfully processed? 🤔';
                const buttons = [
                    { type: 'reply', reply: { id: 'yesdbt', title: "✅ Yes " } },
                    { type: 'reply', reply: { id: 'nodbt', title: "❌ No" } }
                ];
                await sendWhatsAppCustomMessageWithButtons(phoneNumber, dbtMessage, buttons);
            }
        }
        if (message.type === 'interactive' && message.interactive.type === 'button_reply') {
            const buttonPayload = message.interactive.button_reply.id;  // This will give you the payload of the button clicked
            if (buttonPayload === 'yesdbt') {
                const SolutionMessagedbt = '✅That’s great! Here are three ways you can resolve the issue. Please choose an option below:';
                const buttons = [
                    { type: 'reply', reply: { id: 'dbt_online', title: "Check Online" } },
                    { type: 'reply', reply: { id: 'dbt_mobile', title: "Via Mobile" } },
                    { type: 'reply', reply: { id: 'dbt_bank', title: "Visit the Bank" } }
                ];
                await sendWhatsAppCustomMessageWithButtons(phoneNumber, SolutionMessagedbt, buttons);
            }else if (buttonPayload === 'nodbt') {
                const noDbtMessage = 'Thank you for your response! Please let us know the reason for saying "No" by selecting one of the options below:';
                const buttons = [
                    { type: 'reply', reply: { id: 'dbtissueno', title: "DBT is correct" } },
                    { type: 'reply', reply: { id: 'dbtneedno', title: "work alone" } }
                ];
                await sendWhatsAppCustomMessageWithButtons(phoneNumber, noDbtMessage, buttons);
            }

        }
        if (message.type === 'interactive' && message.interactive.type === 'button_reply') {
            const buttonPayload = message.interactive.button_reply.id;  // This will give you the payload of the button clicked
            if (buttonPayload === 'dbtissueno'|| buttonPayload === 'dbtneedno') {
                const noDbtMessage = 'Thank you! We have received your response. Thank you for using our services! 😊';
                await sendWhatsAppOnlyMessageWithButtons(phoneNumber, noDbtMessage,);
            }
        }
        if (message.type === 'interactive' && message.interactive.type === 'button_reply') {
            const buttonPayload = message.interactive.button_reply.id;  // This will give you the payload of the button clicked
            if (buttonPayload === 'dbt_online') {
                const dbtonlineMessage = 'To check your DBT status online, please visit the following link:\n\nhttps://pfms.nic.in/NewDefaultHome.aspx#KnowYourPayments\n\nYou can enter your Aadhaar number or bank account details to check the status.';
                await sendWhatsAppOnlyMessageWithButtons(phoneNumber, dbtonlineMessage);
            }else if (buttonPayload === 'dbt_mobile') {
                const dbtmobileMessage = 'To check your DBT status via mobile, please follow these steps:\n\n1. Open the PFMS Mobile App.\n2. Select "Know Your Payments".\n3. Enter your Aadhaar number or bank account details.\n4. Click on "Submit" to view your DBT status.';
                await sendWhatsAppOnlyMessageWithButtons(phoneNumber, dbtmobileMessage);
            }else if (buttonPayload === 'dbt_bank') {
                const dbtoption3Message = 'To resolve the issue, please visit your bank and ask them to check the DBT status for your account.\n\nProvide them with your Aadhaar number and any other required documents.';
                await sendWhatsAppOnlyMessageWithButtons(phoneNumber, dbtoption3Message);
            }
        }

    } catch (error) {
        console.error('Error handling message:', error);
        res.sendStatus(500); // Respond with a 500 status code in case of an error
    }     
// Function to send a custom message with buttons   
// Start the serve
});
const port = process.env.PORT || 5001;
app.listen(port, () => {
    console.log(`Server running on http://localhost:${port}`);
});
