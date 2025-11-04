const Contact = require("../models/Contact");
const nodemailer = require("nodemailer");

// Centralized transporter using Gmail SMTP. Requires EMAIL_USER and EMAIL_PASS (App Password).
function getTransporter() {
  return nodemailer.createTransport({
    host: "smtp.gmail.com",
    port: 465,
    secure: true,
    auth: {
      user: process.env.EMAIL_USER,
      pass: process.env.EMAIL_PASS,
    },
  });
}

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

    const transporter = getTransporter();

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

// Send reply to a contact message (admin only)
const sendContactReply = async (req, res) => {
  try {
    const { id } = req.params;
    const { subject, message } = req.body;

    if (!subject || !message) {
      return res.status(400).json({ error: "Subject and message are required." });
    }

    const contact = await Contact.findById(id);
    if (!contact) {
      return res.status(404).json({ error: "Contact message not found." });
    }

    const transporter = getTransporter();

    const mailOptions = {
      from: `Ezra Seminary <${process.env.EMAIL_USER}>`,
      to: contact.email,
      replyTo: process.env.EMAIL_USER,
      subject,
      text: message,
      html: `<p>${message.replace(/\n/g, "<br/>")}</p>`,
    };

    await transporter.sendMail(mailOptions);

    contact.repliedAt = new Date();
    await contact.save();

    res.status(200).json({ message: "Reply sent successfully." });
  } catch (error) {
    console.error("Error sending contact reply:", error);
    if (error && (error.code === "EAUTH" || error.responseCode === 535)) {
      return res.status(401).json({
        error: "Email auth failed. Check EMAIL_USER/EMAIL_PASS (use a Gmail App Password).",
      });
    }
    res.status(500).json({ error: "Failed to send reply." });
  }
};

module.exports.sendContactReply = sendContactReply;
