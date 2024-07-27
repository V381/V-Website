const express = require('express');
const bodyParser = require('body-parser');
const sgMail = require('@sendgrid/mail');
require('dotenv').config();

const app = express();
const port = process.env.PORT || 3000;

// Middleware
app.use(bodyParser.urlencoded({ extended: true }));
app.use(bodyParser.json());

// Set SendGrid API Key
sgMail.setApiKey(process.env.SENDGRID_API_KEY);

console.log(process.env.SENDGRID_API_KEY)

app.post('/send-email', (req, res) => {
    const { name, email, phone, vehicle, origin, destination, pickupDate, honeypot } = req.body;

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

app.listen(port, () => {
    console.log(`Server is running on port ${port}`);
});
