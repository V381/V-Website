// netlify/functions/sendEmail.js
const sgMail = require('@sendgrid/mail');

exports.handler = async (event, context) => {
    // Parse the incoming request data
    const { name, email, senderEmail, phone, vehicle, pickupDate } = JSON.parse(event.body);
    console.log(event.body);
    // Set your SendGrid API key
    sgMail.setApiKey(process.env.SENDGRID_API_KEY);

    const recipientEmail = 'paavlee@yahoo.com';
    if (!recipientEmail) {
        throw new Error('Recipient email is not set');
    }

    const msg = {
        to: recipientEmail, // Change to your recipient
        from: email, // Use the sender email from the form
        subject: 'New Vehicle Pickup Request',
        text: `You have a new vehicle pickup request from ${name}.
        Email: ${email}
        Phone: ${phone}
        Vehicle: ${vehicle}
        Pickup Date: ${pickupDate}`,
        html: '<h1>MAIL STIGO'
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
