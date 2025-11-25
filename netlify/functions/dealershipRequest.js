const sgMail = require('@sendgrid/mail');

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

        const data = JSON.parse(event.body);
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
        } = data;

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
            throw new Error('All fields are required.');
        }

        const apiKey = process.env.SENDGRID_API_KEY;
        if (!apiKey) {
            throw new Error('SendGrid API key is not set');
        }

        sgMail.setApiKey(apiKey);

        const msg = {
            to: "paavlee@yahoo.com",
            from: process.env.SENDGRID_FROM || email,
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
                <div style="font-family: Arial, sans-serif; color: #222; padding: 12px;">
                    <h2 style="margin: 0 0 12px;">New Dealership Transport Request</h2>
                    <table style="border-collapse: collapse; width: 100%; max-width: 640px; border: 1px solid #e0e0e0;">
                        <tbody>
                            <tr>
                                <th style="text-align: left; padding: 10px; background: #f8f8f8; border-bottom: 1px solid #e0e0e0; width: 35%;">Company</th>
                                <td style="padding: 10px; border-bottom: 1px solid #e0e0e0;">${companyName}</td>
                            </tr>
                            <tr>
                                <th style="text-align: left; padding: 10px; background: #f8f8f8; border-bottom: 1px solid #e0e0e0;">Customer</th>
                                <td style="padding: 10px; border-bottom: 1px solid #e0e0e0;">${customerName}</td>
                            </tr>
                            <tr>
                                <th style="text-align: left; padding: 10px; background: #f8f8f8; border-bottom: 1px solid #e0e0e0;">Phone</th>
                                <td style="padding: 10px; border-bottom: 1px solid #e0e0e0;">${customerPhone}</td>
                            </tr>
                            <tr>
                                <th style="text-align: left; padding: 10px; background: #f8f8f8; border-bottom: 1px solid #e0e0e0;">Email</th>
                                <td style="padding: 10px; border-bottom: 1px solid #e0e0e0;">${email}</td>
                            </tr>
                            <tr>
                                <th style="text-align: left; padding: 10px; background: #f8f8f8; border-bottom: 1px solid #e0e0e0;">Vehicle</th>
                                <td style="padding: 10px; border-bottom: 1px solid #e0e0e0;">${vehicleYear} ${vehicleMakeModel}</td>
                            </tr>
                            <tr>
                                <th style="text-align: left; padding: 10px; background: #f8f8f8; border-bottom: 1px solid #e0e0e0;">Pickup</th>
                                <td style="padding: 10px; border-bottom: 1px solid #e0e0e0;">${pickupAddress}, ${pickupCity}, ${pickupState} ${pickupZip}</td>
                            </tr>
                            <tr>
                                <th style="text-align: left; padding: 10px; background: #f8f8f8; border-bottom: 1px solid #e0e0e0;">Pickup Contact</th>
                                <td style="padding: 10px; border-bottom: 1px solid #e0e0e0;">${pickupContact}</td>
                            </tr>
                            <tr>
                                <th style="text-align: left; padding: 10px; background: #f8f8f8; border-bottom: 1px solid #e0e0e0;">Delivery</th>
                                <td style="padding: 10px; border-bottom: 1px solid #e0e0e0;">${deliveryAddress}, ${deliveryCity}, ${deliveryState} ${deliveryZip}</td>
                            </tr>
                            <tr>
                                <th style="text-align: left; padding: 10px; background: #f8f8f8; border-bottom: 1px solid #e0e0e0;">Delivery Contact</th>
                                <td style="padding: 10px; border-bottom: 1px solid #e0e0e0;">${deliveryContact}</td>
                            </tr>
                            <tr>
                                <th style="text-align: left; padding: 10px; background: #f8f8f8;">Pickup Date</th>
                                <td style="padding: 10px;">${pickupDate}</td>
                            </tr>
                        </tbody>
                    </table>
                </div>
            `
        };

        await sgMail.send(msg);

        return {
            statusCode: 200,
            body: JSON.stringify({ success: true, message: 'Request sent successfully' }),
        };
    } catch (error) {
        console.error('Error occurred:', error);
        return {
            statusCode: 500,
            body: JSON.stringify({ success: false, message: error.message }),
        };
    }
};
