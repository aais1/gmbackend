const express = require('express');
const bodyParser = require('body-parser');
const mongoose = require('mongoose');
const User = require('./models/User'); // Adjust the path as needed
const DBConnect = require('./utils/db'); // Ensure this connects to your MongoDB
const cors = require('cors');
const Mailgun = require('mailgun.js');

// Initialize Mailgun
const mailgun = new Mailgun();
const mg = mailgun.client({
    username: 'api',
    key: 'c6758be8e5a52cbb44340223e43d9827-f6fe91d3-487b03d3', // Replace with your API key
    url: 'https://api.mailgun.net' // Use this if you are not using the EU infrastructure
});

const app = express();

// CORS configuration
const corsOptions = {
    origin: '*',
};

// Use CORS middleware
app.use(cors(corsOptions));

// Body parser middleware
app.use(bodyParser.json());

const PORT = process.env.PORT || 3000;

// Test route
app.get('/', (req, res) => {
    return res.status(200).send('Welcome to the backend');
});

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

// Login route
app.post('/login', async (req, res) => {
    console.log('hi')
    try {
        const { email, password } = req.body;
        const user = await User.findOne({ email, password });
        if (!user) {
            return res.status(401).send({error:'User does not exist'});
        }
        const passMatch = user.password === password;
        if (!passMatch) {
            return res.status(401).send({error:'Password does not match'});
        }
        return res.status(200).send({ user });
    } catch (e) {
        return res.status(500).send(e.message);
    }
});

// Route for handling order confirmation and user creation
app.post('/', async (req, res) => {
    const event = req.body;
    console.log('hook received:', event);

    const userEmail = event.contact_email;
    const paymentDetails = event.current_total_price;
    const orderNumber = event.order_number;
    const customerName = `${event.billing_address.first_name} ${event.billing_address.last_name}`;
    const items = event.line_items.map(item => `<li>${item.title} - €${item.price} x ${item.quantity}</li>`).join('');

    try {
        // Check if the user exists in the database
        const existingUser = await User.findOne({ email: userEmail });

        let passwordToSend;

        if (existingUser) {
            // User exists, retrieve the existing password
            passwordToSend = existingUser.password; // Ensure this is hashed in a real application
        } else {
            // User does not exist, generate a random password
            passwordToSend = generateRandomPassword();
            
            // Create a new user in the database
            const newUser = new User({
                email: userEmail,
                password: passwordToSend, // Make sure to hash this in a real application
            });

            await newUser.save();
            console.log('User created:', newUser);
        }

        // Send the email with Mailgun
        await mg.messages.create('sandbox-123.mailgun.org', { // Replace with your Mailgun domain
            from: "Abis <abismuhammad1@gmail.com>",
            to: [userEmail],
            subject: `Order Confirmation #${orderNumber}`,
            html: `
                <div style="font-family: Arial, sans-serif; color: #333; padding: 20px;">
                    <h2 style="color: #4CAF50;">Order Confirmation #${orderNumber}</h2>
                    <p>Hello ${customerName},</p>
                    <p>Thank you for your order! Here are the details of your recent purchase:</p>
                    <h3 style="color: #4CAF50;">Order Summary:</h3>
                    <ul>${items}</ul>
                    <p><strong>Total Amount:</strong> €${paymentDetails}</p>
                    
                    <h3 style="color: #4CAF50;">Account Details</h3>
                    <p>You can log in to your account using the credentials below:</p>
                    <p><strong>Email:</strong> ${userEmail}</p>
                    <p><strong>Password:</strong> ${passwordToSend}</p>

                    <p>To access the web application, please visit:</p>
                    <p><a href="https://gamesmaster-wu3b.vercel.app/" style="color: #4CAF50;">https://gamesmaster-wu3b.vercel.app/</a></p>

                    <hr style="border: none; border-top: 1px solid #ccc; margin: 20px 0;">
                    <p>If you have any questions, feel free to contact us at support@webapp.com!</p>

                    <footer style="font-size: 0.9em; color: #777;">
                        <p>Thank you for buying our pack :)</p>
                    </footer>
                </div>
            `
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
    DBConnect(); // Connect to the database
    console.log(`Server is running on port ${PORT}`);
});

module.exports = app;
