const sgMail = require('@sendgrid/mail');

const MAX_ATTACHMENT_BYTES = 4 * 1024 * 1024; // 4MB decoded

exports.handler = async (event) => {
    if (event.httpMethod !== 'POST') {
        return {
            statusCode: 405,
            body: JSON.stringify({ success: false, message: 'Method Not Allowed' }),
        };
    }

    try {
        if (!event.body) {
            throw new Error('No data received');
        }

        const { name, subject, email, message, honeypot, attachment } = JSON.parse(event.body);

        if (honeypot) {
            // Bot detected
            throw new Error('Bot detected');
        }

        if (!name || !subject || !email || !message) {
            throw new Error('Missing fields in request data');
        }

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
                    <p>You have a new request from <strong>${name}</strong>.</p>
                    <table style="width: 100%; border-collapse: collapse;">
                        <tr>
                            <td style="border: 1px solid #dddddd; padding: 8px;">Email</td>
                            <td style="border: 1px solid #dddddd; padding: 8px;">${email}</td>
                        </tr>
                        <tr>
                            <td style="border: 1px solid #dddddd; padding: 8px;">Subject</td>
                            <td style="border: 1px solid #dddddd; padding: 8px;">${subject}</td>
                        </tr>
                        <tr>
                            <td style="border: 1px solid #dddddd; padding: 8px;">Message</td>
                            <td style="border: 1px solid #dddddd; padding: 8px;">${String(message).replace(/\n/g, '<br>')}</td>
                        </tr>
                    </table>
                    <p style="color: #2e3d49;">Please respond promptly.</p>
                </body>
                </html>
            `,
        };

        if (attachment && attachment.content && attachment.filename) {
            const decodedSize = Buffer.byteLength(attachment.content, 'base64');
            if (decodedSize > MAX_ATTACHMENT_BYTES) {
                throw new Error('Attachment too large');
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

        await sgMail.send(msg);

        return {
            statusCode: 200,
            body: JSON.stringify({ success: true, message: 'Message sent successfully' }),
        };
    } catch (error) {
        console.error('Error occurred:', error);
        return {
            statusCode: 500,
            body: JSON.stringify({ success: false, message: error.message }),
        };
    }
};