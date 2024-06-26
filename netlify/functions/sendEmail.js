// netlify/functions/sendEmail.js
const sgMail = require('@sendgrid/mail');

exports.handler = async (event, context) => {
    // Parse the incoming request data
    const { name, email, phone, vehicle, pickupDate } = JSON.parse(event.body);

    console.log('Function invoked');
        console.log('Event Body:', event.body); // Log the event body

        if (!event.body) {
            throw new Error('No data received');
        }
        // Ensure all required fields are present
        if (!name || !email || !senderEmail || !phone || !vehicle || !pickupDate) {
            throw new Error('Missing fields in request data');
        }

    // Set your SendGrid API key
    sgMail.setApiKey(process.env.SENDGRID_API_KEY);

    const msg = {
        to: 'paavlee@yahoo.com', // Change to your recipient
        from: email, // Use the sender email from the form
        subject: 'New Vehicle Pickup Request',
        text: `You have a new vehicle pickup request from ${name}.
        Email: ${email}
        Phone: ${phone}
        Vehicle: ${vehicle}
        Pickup Date: ${pickupDate}`,
    };

    try {
        await sgMail.send(msg);
        return {
            statusCode: 200,
            body: JSON.stringify({ success: true, message: 'Email sent successfully' }),
        };
    } catch (error) {
        console.error(error);
        return {
            statusCode: 500,
            body: JSON.stringify({ success: false, message: 'Error sending email' }),
        };
    }
};
