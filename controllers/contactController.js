const Contact = require("../models/Contact");
const nodemailer = require("nodemailer");

const isValidEmail = (email) => {
  const emailRegex =
    /^(([^<>()\[\]\\.,;:\s@"]+(\.[^<>()\[\]\\.,;:\s@"]+)*)|(".+"))@((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}])|(([a-zA-Z\-0-9]+\.)+[a-zA-Z]{2,}))$/;
  return emailRegex.test(email);
};

const sendContactMessage = async (req, res) => {
  try {
    const { firstName, lastName, email, message } = req.body;

    // Validate input
    if (!firstName || !lastName || !email || !message) {
      return res.status(400).json({ error: "All fields are required." });
    }

    if (!isValidEmail(email)) {
      return res.status(400).json({ error: "Invalid email address." });
    }

    // Save the contact message to the database
    const newContact = new Contact({
      firstName,
      lastName,
      email,
      message,
    });

    await newContact.save();

    const transporter = nodemailer.createTransport({
      service: "gmail",
      auth: {
        user: process.env.EMAIL_USER, // Replace with your Gmail email address
        pass: process.env.EMAIL_PASS, // Replace with your Gmail password or app-specific password
      },
    });

    // Configure the email options
    const mailOptions = {
      from: process.env.EMAIL_USER, // Replace with your Gmail email address
      to: "seminaryezra@gmail.com",
      subject: "New Contact Message",
      text: `
        First Name: ${firstName}
        Last Name: ${lastName}
        Email: ${email}
        Message: ${message}
      `,
    };

    // Send the email
    await transporter.sendMail(mailOptions);

    res
      .status(200)
      .json({ message: "Contact message saved and email sent successfully." });
  } catch (error) {
    console.error("Error saving contact message and sending email:", error);
    res
      .status(500)
      .json({ error: "Error saving contact message and sending email." });
  }
};

const getContactMessages = async (req, res) => {
  try {
    const contacts = await Contact.find({}).sort({ createdAt: -1 }).lean();
    res.status(200).json(contacts);
  } catch (error) {
    res.status(500).json({ error: "Failed to fetch contact messages" });
  }
};

module.exports = { sendContactMessage, getContactMessages };
