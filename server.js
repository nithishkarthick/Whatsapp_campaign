import express from 'express';
import axios from 'axios';
import dotenv from 'dotenv';
import cors from 'cors';
import mysql from 'mysql2';
import e from 'express';

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

                // Send the survey template message to the user
                await sendWhatsAppMessageWithButtons(phoneNumber, templateName, components);
            }
        }

        // Check if the message is of type 'button'
        if (message.type === 'button' && message.button && message.button.payload) {
            const payload = message.button.payload;  // The button payload
            console.log("Button clicked with payload:", payload);

            // Here, `id` is used for custom message actions, not the template payload
            // id = payload; // Store the button payload separately as `id`

            // Handle the predefined template buttons
            // if (payload === 'TAMIL_BUTTON_PAYLOAD' || payload === 'ENGLISH_BUTTON_PAYLOAD') {
            //     console.log(`Language button clicked: ${payload}`);
            //     // Send follow-up message based on the language selection
            //     const followUpTemplateName = 'survey_campaign';  // Approved follow-up template name
            //     const components = [
            //         {
            //             type: 'button',
            //             sub_type: 'quick_reply',
            //             index: 0,
            //             parameters: [
            //                 { type: 'payload', payload: 'AADHAAR_SEEDING_BUTTON_PAYLOAD' },
            //             ],
            //         },
            //         {
            //             type: 'button',
            //             sub_type: 'quick_reply',
            //             index: 1,
            //             parameters: [
            //                 { type: 'payload', payload: 'DBT_ISSUES_BUTTON_PAYLOAD' },
            //             ],
            //         },
            //     ];

            //     // Send the follow-up template to the user
            //     await sendWhatsAppMessageWithButtons(phoneNumber, followUpTemplateName, components);
            // }

            // Handle custom messages after language selection
            if (payload === 'TAMIL_BUTTON_AYLOAD') {
                    const languageMessage = `ஆதிதிராவிடர் நலத்துறை சார்பில் வணக்கம்! 👋
                    வணக்கம்! இன்று எதைப் பற்றி பேச விரும்புகிறீர்கள்? கீழ்காணும் பிரச்சனைகளில் ஒன்றைத் தேர்ந்தெடுங்கள்:`;
                    console.log(`Language message sent: ${languageMessage}`);

                // Send custom buttons for the user to select an issus
                    const buttons = [
                         { type: 'reply', reply: { id: 'aadhaar_related', title: "ஆதார் ரத்து ", } },
                         { type: 'reply', reply: { id: 'dbt_related', title: "DBT முடக்கம்" } },
                         { type: 'reply', reply: { id: 'ncpi_related', title: "NPCI செயலிழப்பு " } },
                         { type: 'reply', reply: { id: 'bank_related', title: "eKYC நிலைமையை பூர்த்தி செய்யவில்லை" } },
                         { type: 'reply', reply: { id: 'credit_related', title: "கிரெடிட் வரம்பு" } },
                         { type: 'reply', reply: { id: 'others', title: "📨 பிற சந்தேகங்கள்" } },
                    ];
                // Send the custom message with buttons

                    await sendWhatsAppCustomMessageWithButtons(phoneNumber, languageMessage, buttons);
            }else if (payload === 'ENGLISH_BUTTON_PAYLOAD') {
                const languageMessage = `👋 Hello! How may I assist you today? Please select the type of issue you want to talk about.`;
                console.log(`Language message sent: ${languageMessage}`);

                // Send custom buttons for the user to select an issue
                const buttons = [
                    { type: 'reply', reply: { id: 'aadhaar_issues', title: "Aadhaar Cancelled by UIDAI" } },
                    { type: 'reply', reply: { id: 'dbt_issues', title: "DBT Disabled" } },
                    { type: 'reply', reply: { id: 'ncpi_issues', title: "NPCI Inactive" } },
                    { type: 'reply', reply: { id: 'bank_issues', title: "Aadhaar Number Not Mapped to Bank Account" } },
                    { type: 'reply', reply: { id: 'account_issues', title: "Account Blocked " } },
                    { type: 'reply', reply: { id: 'account_freez_issues', title: "Account Frozen" } },
                    { type: 'reply', reply: { id: 'credit_issues', title: "Account Credit Limit Update" } },
                    { type: 'reply', reply: { id: 'other_issues', title: "Other Queries" } },
                ];
                // Send the custom message with buttons
                await sendWhatsAppCustomMessageWithButtons(phoneNumber, languageMessage, buttons);
            }
                
            
        }    
        if (message.type === 'interactive' && message.interactive.type === 'button_reply') {
            const buttonPayload = message.interactive.button_reply.id;  // This will give you the payload of the button clicked
           if (buttonPayload === 'aadhaar_related') {
                const aadhaarMessage = 'உங்கள் ஆதார் எண் ரத்து செய்யப்பட்டதால் , உங்களது  போஸ்ட் மெட்ரிக் கல்வி உதவித்தொகையை  அரசு வழங்க இயலவில்லை.இந்த பிரச்சனையை எப்படி தீர்க்கலாம் என்று தெரிந்துகொள்ள விருப்பமா? 🤔 ';
                 const buttons = [
                      { type: 'reply', reply: { id: 'yes', title: "ஆம்" } },
                     { type: 'reply', reply: { id: 'no', title: "இல்லை" } }
             ];
             await sendWhatsAppCustomMessageWithButtons(phoneNumber, aadhaarMessage, buttons);
             }
        }
        if (message.type === 'interactive' && message.interactive.type === 'button_reply') {
             const buttonPayload = message.interactive.button_reply.id;
              if(buttonPayload === 'yes') {
                  const dbtMessage = 'கீழ்காணும்  வழிமுறைகளின்படி நீங்கள் இந்த பிரச்சனையை தீர்க்கலாம்: \n\n1.அருகிலுள்ள ஆதார் சேவைக் மையத்திற்கு செல்லுங்கள் (Aadhaar Seva Kendra).\n2. கொண்டு செல்ல வேண்டிய ஆவணங்கள்: \n  ○	உங்கள் ஆதார் அட்டை. \n  ○	சான்று ஆவணங்கள் PAN கார்டு, வாக்காளர் அட்டை, பாஸ்போர்ட், குடும்ப அட்டை போன்றவை.'
                  ' \n3. அதிகாரிகளிடம் உங்கள் ஆதார் ரத்து செய்யப்பட்ட விவரத்தை சரிபார்த்து, சரி செய்யும்படி கோருங்கள்.'
                   '\n சரிசெய்யப்பட்டதும், ஆதார் நிலை புதுப்பிக்கப்பட்டு, உங்களுக்கு தகவல் அனுப்பப்படும். \n 📍 அருகிலுள்ள ஆதார் மையம்: `{https://appointments.uidai.gov.in/easearch.aspx}`.\n ✔️ பிறகு, UMIS-இல் சரியான ஆதார் எண்ணை உள்ளீடு செய்திருக்கின்றீர்கள் என்பதை உறுதி செய்யுங்கள்.'
                   '\n\n📢 முக்கியம்: ஆதார் செயல்படுத்தப்பட்டதும், இந்த எண்ணுக்கு "Hi" என ஒரு செய்தியை அனுப்புங்கள். பின்னர், உங்கள் உதவித்தொகையை வழங்க நடவடிக்கை எடுக்கபடும். 😊';
                 await sendWhatsAppOnlyMessageWithButtons(phoneNumber, dbtMessage);
            }else if (buttonPayload === 'no') {
                const noMessage = 'நீங்கள் ‘இல்லை’ என்று சொன்னதற்கான காரணத்தை தெரிவிக்க முடியுமா? கீழ்க்காணும் விருப்பங்களில் ஒன்றை தேர்வுசெய்யவும்:';
                const buttons = [
                    { type: 'reply', reply: { id: 'no_issue', title: "என் ஆதாரில் எந்த பிரச்சனையும் இல்லை" } },
                    { type: 'reply', reply: { id: 'no_scholarship', title: "எனக்கு உதவித்தொகை தேவையில்லை" } }
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
            if (buttonPayload === 'dbt_issues') {
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
                const dbtMessage = 'உங்கள் பிரச்சனையை தீர்க்க 3 வழிகள் உள்ளன:';
                const buttons = [
                    { type: 'reply', reply: { id: 'online', title: "🔹 ஆன்லைனில் சரிபார்க்க:" } },
                    { type: 'reply', reply: { id: 'mobile', title: "🔹 மொபைல் வழியாக" } },
                    { type: 'reply', reply: { id: 'bank', title: "🔹 வங்கி கிளை" } }
                ];
                await sendWhatsAppCustomMessageWithButtons(phoneNumber, dbtMessage, buttons);
            } else if (buttonPayload === 'dbt_no') {
                const noMessage = 'நீங்கள் ‘இல்லை’ என்று சொன்னதற்கான காரணத்தை தெரிவிக்க முடியுமா? கீழ்க்காணும் விருப்பங்களில் ஒன்றை தேர்வுசெய்யவும்:';
                const buttons = [
                    { type: 'reply', reply: { id: 'no_dbtissue', title: "●	என் DBT நிலை சரியாக உள்ளது" } },
                    { type: 'reply', reply: { id: 'no-need', title: "●	நான் தனியாக இது குறித்து வேலை பார்க்க விரும்புகிறேன்" } }
                ];
                await sendWhatsAppOnlyMessageWithButtons(phoneNumber, noMessage, buttons);
            }
        }
        if (message.type === 'interactive' && message.interactive.type === 'button_reply') {
            const buttonPayload = message.interactive.button_reply.id;  // This will give you the payload of the button clicked
            if (buttonPayload === 'online') {
                const onlineMessage = 'DBT நிலையை ஆன்லைனில் சரிபார்க்க, கீழ்காணும் படிகளைப் பின்பற்றவும்:\n\n ●	இணையதளம்: https://myaadhaar.uidai.gov.in'
                '\n ●	உங்கள் ஆதார் எண்ணை உள்ளிடவும்.\n ●	ஆதார் எண், OTP மூலம் உள்நுழையவும்.\n ●	“Bank Seeding Status” என்பதை தேர்வு செய்யவும்.\n ●	DBT நிலையை காணலாம்; செயலற்றிருந்தால் வங்கிக்கு சென்று செயல்படுத்தவும்\n\n\n📢 முக்கியம்: DBT செயல்படுத்திய பிறகு, இந்த எண்ணுக்கு "Hi" என ஒரு செய்தியை அனுப்புங்கள். பின்னர், உங்கள் கல்வி உதவித்தொகையை வழங்க நடவடிக்கை எடுக்கபடும். 😊😊';
                await sendWhatsAppOnlyMessageWithButtons(phoneNumber, onlineMessage);
            }else if (buttonPayload === 'mobile') {
                const mobileMessage = 'DBT நிலையை மொபைல் வழியாக சரிபார்க்க, கீழ்காணும் படிகளைப் பின்பற்றவும்:\n\n●	உங்கள் ஆதார் பதிவு செய்யப்பட்ட எண்ணிலிருந்து *99991# அழைக்கவும்.\n ●	12 இலக்க ஆதார் எண்ணை உள்ளீடு செய்யவும்.\n ●	வழிகாட்டல்களை பின்பற்றவும்.\n\n\n📢 முக்கியம்: DBT செயல்படுத்திய பிறகு, இந்த எண்ணுக்கு "Hi" என ஒரு செய்தியை அனுப்புங்கள். பின்னர், உங்கள் கல்வி உதவித்தொகையை வழங்க நடவடிக்கை எடுக்கபடும். 😊😊';
                await sendWhatsAppOnlyMessageWithButtons(phoneNumber, mobileMessage);
            }else if (buttonPayload === 'bank') {
                const bankMessage = 'DBT நிலையை வங்கி கிளையில் சரிபார்க்க, கீழ்காணும் படிகளைப் பின்பற்றவும்:\n\n ●	வங்கிக்கு செல்லுங்கள், ஆதார், அடையாள ஆவணங்களை எடுத்துச் செல்லுங்கள்.\n●	DBT செயல்படுத்த கோரிக்கை வைக்கவும்.\n ●	நடவடிக்கை நிலை சில நாட்களில் புதுப்பிக்கப்படும்.\n\n\n📢 முக்கியம்: DBT செயல்படுத்திய பிறகு, இந்த எண்ணுக்கு "Hi" என ஒரு செய்தியை அனுப்புங்கள். பின்னர், உங்கள் கல்வி உதவித்தொகையை வழங்க நடவடிக்கை எடுக்கபடும். 😊😊';
                await sendWhatsAppOnlyMessageWithButtons(phoneNumber, bankMessage);
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
                const ncpiMessage = 'பிரச்சனையை தீர்க்க இரண்டு வழிகள்:\n\n🔹 புதிய ஆதார் இணைக்கப்பட்ட கணக்கை திறக்கவும் (பரிந்துரைக்கப்படுகிறது).\n●	புதிய சேமிப்புக் கணக்கை திறக்கவும்.\n● ஆதாருடன் இணைக்கும்.\n ●	NPCI தானாக செயல்படுத்தப்படும்.'
                '\n\n 🔹 ஏற்கனவே உள்ள கணக்கை செயல்படுத்தவும்.\n●	வங்கியில் NPCI இணைப்பை கோருங்கள்.\n ●	சில நாட்களில் நிலை புதுப்பிக்கப்படும்.\n💡 NPCI நிலையை ஆன்லைனில் பார்க்க: \nhttps://pfms.nic.in/NewDefaultHome.aspx#KnowYourPayments'
                '\n\n\n📢 முக்கியம்: NPCI செயல்படுத்திய பிறகு, இந்த எண்ணுக்கு "Hi" என ஒரு செய்தியை அனுப்புங்கள். பின்னர், உங்கள் கல்வி உதவித்தொகையை வழங்க நடவடிக்கை எடுக்கபடும். 😊😊';
                await sendWhatsAppOnlyMessageWithButtons(phoneNumber, ncpiMessage);
            }else if (buttonPayload === 'ncpi_no') {
                const noMessage = 'நீங்கள் ‘இல்லை’ என்று சொன்னதற்கான காரணத்தை தெரிவிக்க முடியுமா? கீழ்க்காணும் விருப்பங்களில் ஒன்றை தேர்வுசெய்யவும்:';
                const buttons = [
                    { type: 'reply', reply: { id: 'no_ncpiissue', title: "என் NPCI நிலை சரியாக உள்ளது" } },
                    { type: 'reply', reply: { id: 'no-need', title: "●	நான் தனியாக தீர்க்க விரும்புகிறேன்" } }
                ];
                await sendWhatsAppCustomMessageWithButtons(phoneNumber, noMessage, buttons);
            }
        }
        if (message.type === 'interactive' && message.interactive.type === 'button_reply') {
            const buttonPayload = message.interactive.button_reply.id;  // This will give you the payload of the button clicked
            if (buttonPayload === 'no_ncpiissue'|| buttonPayload === 'no-need') {
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
                    { type: 'reply', reply: { id: 'no_ekycissue', title: "என் eKYC நிலை சரியாக உள்ளது" } },
                    { type: 'reply', reply: { id: 'no-ekycneed', title: "●	நான் தனியாக சமாளிக்க விரும்புகிறேன்" } }
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
                    { type: 'reply', reply: { id: 'no_creditissue', title: "●	என் கிரெடிட் வரம்பில் பிரச்சனை இல்லை" } },
                    { type: 'reply', reply: { id: 'no-creditneed', title: "●	நான் தனியாக சமாளிக்க விரும்புகிறேன்" } }
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
        if (message.type === 'interactive' && message.interactive.type === 'button_reply') {
            const buttonPayload = message.interactive.button_reply.id;  // This will give you the payload of the button clicked
            if (buttonPayload === 'others') {
                const otherMessage = 'தயவுசெய்து உங்கள் கேள்வியைத் தெரிவிக்கவும். நாங்கள் உதவ முயற்சிக்கிறோம்.';
            }
                await sendWhatsAppOnlyMessageWithButtons(phoneNumber, otherMessage);
        }
    



       
        



        const query = `
            INSERT INTO webhook_responses (
                phone_number, 
                campaign_name, 
                template_name, 
                button_payload, 
                button_text, 
                message_type, 
                response_time, 
                template_used
            ) 
            VALUES (?, ?, ?, ?, ?, ?, NOW(), ?)
        `;

        const params = [
            phoneNumber,                                // Phone number from the user
            'Survey Campaign',                          // Campaign name (you can make this dynamic if needed)
            'Survey Template',                         // Template name (dynamically replace as per the template)
            message.button ? message.button.payload : null, // Button payload (null if no button)
            message.button ? message.button.text : null,    // Button text (null if no button)
            message.type,                               // Message type (could be 'text', 'button', etc.)
            'Survey Template'                          // Template used (replace dynamically if needed)
        ];

        db.query(query, params, (err, result) => {
            if (err) {
                console.error('Error storing response:', err);
                return res.status(500).json({ error: 'Failed to store response in the database.' });
            } else {
                console.log('Response stored successfully:', result);
            }
        });

        res.sendStatus(200); // Acknowledge the webhook

    } catch (error) {
        console.error('Error processing webhook:', error);
        res.sendStatus(500); // Internal Server Error
    }

});


// Fetch all responses from the database
app.get('/api/responses', (req, res) => {
    const query = 'SELECT * FROM webhook_responses ORDER BY response_time DESC';  // Adjust as needed
    db.query(query, (err, results) => {
        if (err) {
            console.error('Error fetching data:', err);
            return res.status(500).json({ error: 'Failed to fetch data from database' });
        }
        res.json(results);
    });
});


// Start the server
const port = process.env.PORT || 5000;
app.listen(port, () => {
    console.log(`Server running on http://localhost:${port}`);
});





//----------------------