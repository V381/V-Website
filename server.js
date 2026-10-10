const express = require('express');
const bodyParser = require('body-parser');
const sgMail = require('@sendgrid/mail');
require('dotenv').config();

const app = express();
const port = process.env.PORT || 3000;

// Middleware
app.use(bodyParser.urlencoded({ extended: true }));
// Raised from the default 100kb so the help-widget's base64 image attachment fits
app.use(bodyParser.json({ limit: '6mb' }));

// Set SendGrid API Key
sgMail.setApiKey(process.env.SENDGRID_API_KEY);


app.post('/send-email', (req, res) => {
    const { name, email, phone, vehicle, origin, destination, pickupDate, honeypot, sms } = req.body;

    // Check if honeypot field is filled (spam prevention)
    if (honeypot) {
        return res.status(400).json({ error: 'Spam detected' });
    }

    const msg = {
        to: 'paavlee@yahoo.com', // Change to your recipient
        from: email, // Use the sender email from the form
        subject: 'New Vehicle Pickup Request',
        text: `You have a new vehicle pickup request from ${name}.
        Email: ${email}
        Phone: ${phone}
        Vehicle: ${vehicle}
        Origin: ${origin}
        SMS: ${sms},
        Destination: ${destination}
        Pickup Date: ${pickupDate}`,
    };

    sgMail
        .send(msg)
        .then(() => {
            console.log('Email sent');
            res.status(200).json({ success: true, message: 'Email sent successfully' });
        })
        .catch((error) => {
            console.error(error);
            res.status(500).json({ success: false, message: 'Error sending email' });
        });
});

app.post('/dealership-request', (req, res) => {
    console.log('Dealership request received:', req.body);

    const {
        companyName,
        customerName,
        customerPhone,
        email,
        vehicleYear,
        vehicleMakeModel,
        pickupAddress,
        pickupCity,
        pickupState,
        pickupZip,
        pickupContact,
        deliveryAddress,
        deliveryCity,
        deliveryState,
        deliveryZip,
        deliveryContact,
        pickupDate
    } = req.body;

    const requiredFields = [
        companyName,
        customerName,
        customerPhone,
        email,
        vehicleYear,
        vehicleMakeModel,
        pickupAddress,
        pickupCity,
        pickupState,
        pickupZip,
        pickupContact,
        deliveryAddress,
        deliveryCity,
        deliveryState,
        deliveryZip,
        deliveryContact,
        pickupDate
    ];

    if (requiredFields.some(field => (typeof field === 'string' ? field.trim() === '' : !field))) {
        console.log('Missing required fields');
        return res.status(400).json({ success: false, message: 'All fields are required.' });
    }


    const msg = {
        to: 'paavlee@yahoo.com',
        replyTo: email,
        subject: 'New Dealership Transport Request',
        text: `Company: ${companyName}
            Customer: ${customerName}
            Phone: ${customerPhone}
            Email: ${email}
            Vehicle: ${vehicleYear} ${vehicleMakeModel}
            Pickup: ${pickupAddress}, ${pickupCity}, ${pickupState} ${pickupZip}
            Pickup Contact: ${pickupContact}
            Delivery: ${deliveryAddress}, ${deliveryCity}, ${deliveryState} ${deliveryZip}
            Delivery Contact: ${deliveryContact}
            Pickup Date: ${pickupDate}`,
                    html: `
            <h2>New Dealership Transport Request</h2>
            <p><strong>Company:</strong> ${companyName}</p>
            <p><strong>Customer:</strong> ${customerName}</p>
            <p><strong>Phone:</strong> ${customerPhone}</p>
            <p><strong>Email:</strong> ${email}</p>
            <p><strong>Vehicle:</strong> ${vehicleYear} ${vehicleMakeModel}</p>
            <p><strong>Pickup:</strong> ${pickupAddress}, ${pickupCity}, ${pickupState} ${pickupZip}</p>
            <p><strong>Pickup Contact:</strong> ${pickupContact}</p>
            <p><strong>Delivery:</strong> ${deliveryAddress}, ${deliveryCity}, ${deliveryState} ${deliveryZip}</p>
            <p><strong>Delivery Contact:</strong> ${deliveryContact}</p>
            <p><strong>Pickup Date:</strong> ${pickupDate}</p>
        `
    };

    sgMail
        .send(msg)
        .then(() => {
            console.log('Dealership request email sent');
            res.status(200).json({ success: true, message: 'Request sent successfully' });
        })
        .catch((error) => {
            console.error('SendGrid error:', error);
            res.status(500).json({ success: false, message: 'Error sending dealership request' });
        });
});

app.post('/send-help-request', (req, res) => {
    const { name, subject, email, message, honeypot, attachment } = req.body;

    // Check if honeypot field is filled (spam prevention)
    if (honeypot) {
        return res.status(400).json({ success: false, message: 'Spam detected' });
    }

    if (!name || !subject || !email || !message) {
        return res.status(400).json({ success: false, message: 'All fields are required.' });
    }

    const msg = {
        to: 'mbsuperblogistics@gmail.com',
        from: 'mbsuperblogistics@gmail.com',
        replyTo: email,
        subject: `Expert Help Request: ${subject}`,
        text: `You have a new expert help request from ${name}.
        Email: ${email}
        Subject: ${subject}
        Message: ${message}`,
        html: `
            <h2>New Expert Help Request</h2>
            <p><strong>Name:</strong> ${name}</p>
            <p><strong>Email:</strong> ${email}</p>
            <p><strong>Subject:</strong> ${subject}</p>
            <p><strong>Message:</strong></p>
            <p>${String(message).replace(/\n/g, '<br>')}</p>
        `
    };

    if (attachment && attachment.content && attachment.filename) {
        const MAX_ATTACHMENT_BYTES = 4 * 1024 * 1024; // 4MB decoded
        const decodedSize = Buffer.byteLength(attachment.content, 'base64');
        if (decodedSize > MAX_ATTACHMENT_BYTES) {
            return res.status(400).json({ success: false, message: 'Attachment too large' });
        }
        msg.attachments = [
            {
                content: attachment.content,
                filename: attachment.filename,
                type: attachment.type || 'application/octet-stream',
                disposition: 'attachment',
            },
        ];
    }

    sgMail
        .send(msg)
        .then(() => {
            console.log('Help request email sent');
            res.status(200).json({ success: true, message: 'Message sent successfully' });
        })
        .catch((error) => {
            console.error('SendGrid error:', error);
            res.status(500).json({ success: false, message: 'Error sending message' });
        });
});

app.listen(port, () => {
    console.log(`Server is running on port ${port}`);
});