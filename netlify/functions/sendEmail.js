const sgMail = require('@sendgrid/mail');

exports.handler = async (event, context) => {
    try {
        console.log('Function invoked');
        console.log('Event Body:', event.body);

        if (!event.body) {
            throw new Error('No data received');
        }

        const { name, email, phone, vehicle, pickupDate } = JSON.parse(event.body);

        if (!name || !email || !phone || !vehicle || !pickupDate) {
            throw new Error('Missing fields in request data');
        }

        const apiKey = process.env.SENDGRID_API_KEY;
        if (!apiKey) {
            throw new Error('SendGrid API key is not set');
        }

        sgMail.setApiKey(apiKey);
        console.log(email)
        const msg = {
            to: "paavlee@yahoo.com", // Your email address
            from: "MBLogistics PICKUP REQUEST pavle1027@gmail.com", // User's email address from the form
            subject: 'New Vehicle Pickup Request',
            replyTo: email,
            text: `You have a new vehicle pickup request from ${name}.
            Email: ${email}
            Phone: ${phone}
            Vehicle: ${vehicle}
            Pickup Date: ${pickupDate}`,
            html: `
                <html>
                <body style="font-family: Arial, sans-serif; line-height: 1.6;">
                    <h2 style="color: #2e3d49;">New Vehicle Pickup Request</h2>
                    <p>You have a new vehicle pickup request from <strong>${name}</strong>.</p>
                    <table style="width: 100%; border-collapse: collapse;">
                        <tr>
                            <td style="border: 1px solid #dddddd; padding: 8px;">Email</td>
                            <td style="border: 1px solid #dddddd; padding: 8px;">${email}</td>
                        </tr>
                        <tr>
                            <td style="border: 1px solid #dddddd; padding: 8px;">Phone</td>
                            <td style="border: 1px solid #dddddd; padding: 8px;">${phone}</td>
                        </tr>
                        <tr>
                            <td style="border: 1px solid #dddddd; padding: 8px;">Vehicle</td>
                            <td style="border: 1px solid #dddddd; padding: 8px;">${vehicle}</td>
                        </tr>
                        <tr>
                            <td style="border: 1px solid #dddddd; padding: 8px;">Pickup Date</td>
                            <td style="border: 1px solid #dddddd; padding: 8px;">${pickupDate}</td>
                        </tr>
                    </table>
                    <p style="color: #2e3d49;">Please respond promptly to confirm the pickup details.</p>
                </body>
                </html>
            `,
        };

        await sgMail.send(msg);

        return {
            statusCode: 200,
            body: JSON.stringify({ success: true, message: 'Email sent successfully' }),
        };
    } catch (error) {
        console.error('Error occurred:', error);
        return {
            statusCode: 500,
            body: JSON.stringify({ success: false, message: error.message }),
        };
    }
};
