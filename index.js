const express = require('express');
const bodyParser = require('body-parser');
const cors = require('cors');
const User = require('./models/User');
const DBConnect = require('./utils/db');
const { Resend } = require('resend'); // Import Resend

// Initialize Resend with your API key
const resend = new Resend('re_c7hUhQHy_DkTznyLJ2R2tGjXoVmMTmgJ8'); // Replace with your Resend API key

const app = express();

// CORS configuration
const corsOptions = {
    origin: '*',
};
app.use(cors(corsOptions));
app.use(bodyParser.json());

const PORT = process.env.PORT || 3000;

// Function to generate a random 8-character password
function generateRandomPassword(length = 8) {
    const charset = 'abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
    let password = '';
    for (let i = 0; i < length; i++) {
        const randomIndex = Math.floor(Math.random() * charset.length);
        password += charset[randomIndex];
    }
    return password;
}

// Route for handling order confirmation and user creation
app.post('/', async (req, res) => {
    const event = req.body;
    const userEmail = event.contact_email;
    const orderNumber = event.order_number;
    const customerName = `${event.billing_address.first_name} ${event.billing_address.last_name}`;
    const items = event.line_items.map(item => `<li>${item.title} - €${item.price} x ${item.quantity}</li>`).join('');

    try {
        const existingUser = await User.findOne({ email: userEmail });
        let passwordToSend = existingUser ? existingUser.password : generateRandomPassword();
        if (!existingUser) {
            await new User({ email: userEmail, password: passwordToSend }).save();
        }

        // Send email using Resend
        await resend.emails.send({
            from: 'admin@thegamesmaster.com', // Replace with a verified sender
            to: 'aaisali228@gmail.com',
            subject: `Order Confirmation #${orderNumber}`,
            html: `
                <div style="font-family: Arial, sans-serif; color: #333; padding: 20px;">
                    <h2 style="color: #4CAF50;">Order Confirmation #${orderNumber}</h2>
                    <p>Hello <strong>${customerName}</strong> 😊</p>
                    <p><strong>Thank you for choosing us!</strong></p>
                    <p>Below are all the details about your order.</p>
                    
                    <h3 style="color: #4CAF50;">Order Details:</h3>
                    <ul>
                        <li><strong>Product:</strong> ${productName}</li>
                        <li><strong>Quantity:</strong> ${quantity}</li>
                        <li><strong>Price:</strong> $${price}</li>
                    </ul>
                    <p><strong>Total:</strong> €${totalPrice}</p>
                    
                    <h3 style="color: #4CAF50;">Account Details:</h3>
                    <p><strong>Email:</strong> ${userEmail}</p>
                    <p><strong>Password:</strong> ${passwordToSend}</p>
                    
                    <p><a href="https://gamesmaster-wu3b.vercel.app/" style="color: #4CAF50;">Login now to our web app</a></p>
                    
                    <p>If you have any questions or need assistance, please feel free to contact me. I am here to help you!</p>
                    
                    <footer style="font-size: 0.9em; color: #777;">
                        <p>Sincerely,</p>
                        <p>Adam Carpio<br>Games Master | Team</p>
                    </footer>
                </div>
            `,
        });
        

        console.log('Email sent:', userEmail);
        res.status(200).send('Email sent successfully');
    } catch (err) {
        console.error('Error:', err);
        res.status(500).send('Error processing request');
    }
});

// Start the server
app.listen(PORT, () => {
    DBConnect();
    console.log(`Server is running on port ${PORT}`);
});

module.exports = app;
