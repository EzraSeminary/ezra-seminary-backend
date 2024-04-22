const nodemailer = require("nodemailer");

const Contact = require("../models/Contact");

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

    res.status(200).json({ message: "Contact message saved successfully." });
  } catch (error) {
    console.error("Error saving contact message:", error);
    res.status(500).json({ error: "Error saving contact message." });
  }
};
const isValidEmail = (email) => {
  // Add your email validation logic here
  // For example, you can use a regular expression to validate the email format
  const emailRegex = /^[\w-\.]+@([\w-]+\.)+[\w-]{2,4}$/;
  return emailRegex.test(email);
};

module.exports = {
  sendContactMessage,
};
