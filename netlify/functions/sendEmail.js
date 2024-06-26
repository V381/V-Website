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
            to: "pavle1027@gmail.com", // Your email address
            from: "pavle1027@gmail.com", // User's email address from the form
            subject: 'New Vehicle Pickup Request',
            replyTo: email,
            text: `You have a new vehicle pickup request from ${name}.
            Email: ${email}
            Phone: ${phone}
            Vehicle: ${vehicle}
            Pickup Date: ${pickupDate}`,
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
