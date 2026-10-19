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

// ---- Help widget spam protection (mirrors the Netlify function sendHelpRequest.js) ----
const HELP_LIMITS = { name: 100, subject: 150, email: 254, message: 3000 };
const HELP_MIN_MESSAGE = 10;
const HELP_MIN_FILL_MS = 3000;
const HELP_RATE_WINDOW_MS = 10 * 60 * 1000;
const HELP_RATE_MAX = 3;
const helpRateLog = new Map();

function escapeHtml(value) {
    return String(value)
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;')
        .replace(/'/g, '&#39;');
}

function isGibberish(value) {
    return String(value).trim().split(/\s+/).some((word) => {
        if (!/^[A-Za-z]{10,}$/.test(word)) return false;
        return (word.match(/[a-z][A-Z]/g) || []).length >= 3;
    });
}

function countLinks(value) {
    return (String(value).match(/https?:\/\/|www\.|\[url|<a\s/gi) || []).length;
}

function isRateLimited(ip) {
    if (!ip) return false;
    const now = Date.now();
    const recent = (helpRateLog.get(ip) || []).filter((t) => now - t < HELP_RATE_WINDOW_MS);
    const limited = recent.length >= HELP_RATE_MAX;
    if (!limited) recent.push(now);
    helpRateLog.set(ip, recent);
    return limited;
}

function checkHelpRequest(body, ip) {
    const { name, subject, email, message, honeypot, website, elapsed } = body || {};
    const clean = {
        name: String(name || '').trim(),
        subject: String(subject || '').trim().replace(/[\r\n]+/g, ' '),
        email: String(email || '').trim(),
        message: String(message || '').trim(),
    };

    if (honeypot || website) return { ok: false, silent: true, reason: 'honeypot filled' };
    if (typeof elapsed !== 'number' || elapsed < HELP_MIN_FILL_MS) {
        return { ok: false, silent: true, reason: 'submitted too fast' };
    }
    if (!clean.name || !clean.subject || !clean.email || !clean.message) {
        return { ok: false, status: 400, message: 'Please fill in all fields.' };
    }
    for (const field of Object.keys(HELP_LIMITS)) {
        if (clean[field].length > HELP_LIMITS[field]) {
            return { ok: false, status: 400, message: `The ${field} is too long.` };
        }
    }
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(clean.email)) {
        return { ok: false, status: 400, message: 'Please enter a valid email address.' };
    }
    if (clean.message.length < HELP_MIN_MESSAGE) {
        return { ok: false, status: 400, message: 'Please tell us a bit more about how we can help.' };
    }
    if (countLinks(clean.name) || countLinks(clean.subject) || countLinks(clean.message) > 2) {
        return { ok: false, silent: true, reason: 'too many links' };
    }
    if (isGibberish(clean.name) || isGibberish(clean.subject)) {
        return { ok: false, silent: true, reason: 'gibberish text' };
    }
    if (isRateLimited(ip)) {
        return { ok: false, status: 429, message: 'Too many messages. Please try again in a few minutes.' };
    }
    return { ok: true, clean };
}

app.post('/send-help-request', (req, res) => {
    const check = checkHelpRequest(req.body, req.ip);
    if (check.silent) {
        // Pretend success so bots don't retry with tweaks
        console.warn(`Help request blocked (${check.reason}) from ${req.ip}`);
        return res.status(200).json({ success: true, message: 'Message sent successfully' });
    }
    if (!check.ok) {
        return res.status(check.status).json({ success: false, message: check.message });
    }

    const { name, subject, email, message } = check.clean;
    const { attachment } = req.body;

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
            <p><strong>Name:</strong> ${escapeHtml(name)}</p>
            <p><strong>Email:</strong> ${escapeHtml(email)}</p>
            <p><strong>Subject:</strong> ${escapeHtml(subject)}</p>
            <p><strong>Message:</strong></p>
            <p>${escapeHtml(message).replace(/\n/g, '<br>')}</p>
        `
    };

    if (attachment && attachment.content && attachment.filename) {
        if (!String(attachment.type || '').startsWith('image/')) {
            return res.status(400).json({ success: false, message: 'Only image attachments are allowed.' });
        }
        const MAX_ATTACHMENT_BYTES = 4 * 1024 * 1024; // 4MB decoded
        const decodedSize = Buffer.byteLength(attachment.content, 'base64');
        if (decodedSize > MAX_ATTACHMENT_BYTES) {
            return res.status(400).json({ success: false, message: 'Attachment too large' });
        }
        msg.attachments = [
            {
                content: attachment.content,
                filename: String(attachment.filename).slice(0, 120),
                type: attachment.type,
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