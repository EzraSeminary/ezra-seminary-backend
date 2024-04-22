const nodemailer = require("nodemailer");

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

    // Send email using Nodemailer
    const transporter = nodemailer.createTransport({
      service: "gmail",
      auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASS,
      },
    });

    const mailOptions = {
      from: email,
      to: process.env.ADMIN_EMAIL,
      subject: "New Contact Message",
      text: `
      First Name: ${firstName}
      Last Name: ${lastName}
      Email: ${email}
      Message: ${message}
      `,
    };

    await transporter.sendMail(mailOptions);

    res.status(200).json({ message: "Contact message sent successfully." });
  } catch (error) {
    console.error("Error sending contact message:", error);
    res.status(500).json({ error: "Error sending contact message." });
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
