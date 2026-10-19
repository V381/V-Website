const sgMail = require('@sendgrid/mail');

const MAX_ATTACHMENT_BYTES = 4 * 1024 * 1024; // 4MB decoded

// ---- Spam protection ----
const HELP_LIMITS = { name: 100, subject: 150, email: 254, message: 3000 };
const HELP_MIN_MESSAGE = 10;           // characters
const HELP_MIN_FILL_MS = 3000;         // a human can't fill the form faster than this
const HELP_RATE_WINDOW_MS = 10 * 60 * 1000;
const HELP_RATE_MAX = 3;               // max messages per IP per window
const helpRateLog = new Map();         // ip -> [timestamps] (per warm function instance)

function escapeHtml(value) {
    return String(value)
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;')
        .replace(/'/g, '&#39;');
}

// Catches bot filler like "hJkQwErTyUiOp": one long word with repeated random case switches
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

/**
 * { ok: true, clean }                  -> real request, send it
 * { ok: false, status, message }       -> show the visitor a validation error
 * { ok: false, silent: true, reason }  -> looks like a bot: pretend success, send nothing
 */
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

function respond(statusCode, payload) {
    return { statusCode, body: JSON.stringify(payload) };
}

exports.handler = async (event) => {
    if (event.httpMethod !== 'POST') {
        return respond(405, { success: false, message: 'Method Not Allowed' });
    }

    try {
        if (!event.body) {
            return respond(400, { success: false, message: 'No data received' });
        }

        let body;
        try {
            body = JSON.parse(event.body);
        } catch (e) {
            return respond(400, { success: false, message: 'Invalid request' });
        }

        const headers = event.headers || {};
        const ip = headers['x-nf-client-connection-ip']
            || String(headers['x-forwarded-for'] || '').split(',')[0].trim();

        const check = checkHelpRequest(body, ip);
        if (check.silent) {
            // Don't tell bots they were caught, so they don't retry with tweaks
            console.warn(`Help request blocked (${check.reason}) from ${ip || 'unknown IP'}`);
            return respond(200, { success: true, message: 'Message sent successfully' });
        }
        if (!check.ok) {
            return respond(check.status, { success: false, message: check.message });
        }

        const { name, subject, email, message } = check.clean;
        const attachment = body.attachment;

        const apiKey = process.env.SENDGRID_API_KEY;
        if (!apiKey) {
            throw new Error('SendGrid API key is not set');
        }
        sgMail.setApiKey(apiKey);

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
                <html>
                <body style="font-family: Arial, sans-serif; line-height: 1.6;">
                    <h2 style="color: #2e3d49;">New Expert Help Request</h2>
                    <p>You have a new request from <strong>${escapeHtml(name)}</strong>.</p>
                    <table style="width: 100%; border-collapse: collapse;">
                        <tr>
                            <td style="border: 1px solid #dddddd; padding: 8px;">Email</td>
                            <td style="border: 1px solid #dddddd; padding: 8px;">${escapeHtml(email)}</td>
                        </tr>
                        <tr>
                            <td style="border: 1px solid #dddddd; padding: 8px;">Subject</td>
                            <td style="border: 1px solid #dddddd; padding: 8px;">${escapeHtml(subject)}</td>
                        </tr>
                        <tr>
                            <td style="border: 1px solid #dddddd; padding: 8px;">Message</td>
                            <td style="border: 1px solid #dddddd; padding: 8px;">${escapeHtml(message).replace(/\n/g, '<br>')}</td>
                        </tr>
                    </table>
                    <p style="color: #2e3d49;">Please respond promptly.</p>
                </body>
                </html>
            `,
        };

        if (attachment && attachment.content && attachment.filename) {
            if (!String(attachment.type || '').startsWith('image/')) {
                return respond(400, { success: false, message: 'Only image attachments are allowed.' });
            }
            const decodedSize = Buffer.byteLength(attachment.content, 'base64');
            if (decodedSize > MAX_ATTACHMENT_BYTES) {
                return respond(400, { success: false, message: 'Attachment too large' });
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

        await sgMail.send(msg);

        return respond(200, { success: true, message: 'Message sent successfully' });
    } catch (error) {
        console.error('Error occurred:', error);
        return respond(500, { success: false, message: 'Error sending your message.' });
    }
};

// Exported for local testing / server.js reuse
exports.checkHelpRequest = checkHelpRequest;
exports.escapeHtml = escapeHtml;