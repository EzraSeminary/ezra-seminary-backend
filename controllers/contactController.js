const Contact = require("../models/Contact");
const nodemailer = require("nodemailer");
const { OAuth2Client } = require("google-auth-library");

const hasCustomSmtpConfig = () =>
  !!process.env.SMTP_HOST &&
  !!process.env.SMTP_PORT &&
  !!process.env.SMTP_USER &&
  !!process.env.SMTP_PASS;

const hasGmailOAuthConfig = () =>
  !!process.env.EMAIL_USER &&
  !!process.env.EMAIL_OAUTH_CLIENT_ID &&
  !!process.env.EMAIL_OAUTH_CLIENT_SECRET &&
  !!process.env.EMAIL_OAUTH_REFRESH_TOKEN;

const hasGmailAppPasswordConfig = () =>
  !!process.env.EMAIL_USER && !!process.env.EMAIL_PASS;

const hasResendConfig = () =>
  !!process.env.RESEND_API_KEY && !!process.env.EMAIL_FROM_ADDRESS;

async function getTransporter() {
  const {
    SMTP_HOST,
    SMTP_PORT,
    SMTP_SECURE,
    SMTP_USER,
    SMTP_PASS,
    EMAIL_USER,
    EMAIL_PASS,
    EMAIL_OAUTH_CLIENT_ID,
    EMAIL_OAUTH_CLIENT_SECRET,
    EMAIL_OAUTH_REFRESH_TOKEN,
    EMAIL_OAUTH_REDIRECT_URI,
  } = process.env;

  if (hasCustomSmtpConfig()) {
    return nodemailer.createTransport({
      host: SMTP_HOST,
      port: Number(SMTP_PORT),
      secure: String(SMTP_SECURE || "").toLowerCase() === "true",
      auth: {
        user: SMTP_USER,
        pass: SMTP_PASS,
      },
    });
  }

  if (hasGmailOAuthConfig()) {
    const oauth2Client = new OAuth2Client(
      EMAIL_OAUTH_CLIENT_ID,
      EMAIL_OAUTH_CLIENT_SECRET,
      EMAIL_OAUTH_REDIRECT_URI || "https://developers.google.com/oauthplayground"
    );

    oauth2Client.setCredentials({
      refresh_token: EMAIL_OAUTH_REFRESH_TOKEN,
    });

    const accessTokenResponse = await oauth2Client.getAccessToken();
    const accessToken = accessTokenResponse?.token || accessTokenResponse;

    return nodemailer.createTransport({
      service: "gmail",
      auth: {
        type: "OAuth2",
        user: EMAIL_USER,
        clientId: EMAIL_OAUTH_CLIENT_ID,
        clientSecret: EMAIL_OAUTH_CLIENT_SECRET,
        refreshToken: EMAIL_OAUTH_REFRESH_TOKEN,
        accessToken,
      },
    });
  }

  // Fallback to Gmail App Password.
  return nodemailer.createTransport({
    host: "smtp.gmail.com",
    port: 465,
    secure: true,
    auth: {
      user: EMAIL_USER,
      pass: EMAIL_PASS,
    },
  });
}

const getMailFrom = () =>
  process.env.EMAIL_FROM_ADDRESS ||
  process.env.SMTP_USER ||
  process.env.EMAIL_USER;

const getInboundMailTo = () =>
  process.env.EMAIL_TO_ADDRESS || process.env.EMAIL_USER || "seminaryezra@gmail.com";

const hasMailConfig = () =>
  hasCustomSmtpConfig() ||
  hasGmailOAuthConfig() ||
  hasGmailAppPasswordConfig() ||
  hasResendConfig();

const sendViaResend = async ({ to, subject, text, html, replyTo }) => {
  if (!hasResendConfig()) {
    throw new Error("Resend fallback is not configured");
  }

  const response = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${process.env.RESEND_API_KEY}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      from: process.env.EMAIL_FROM_ADDRESS,
      to: [to],
      subject,
      text,
      html,
      reply_to: replyTo,
    }),
  });

  if (!response.ok) {
    const body = await response.text();
    throw new Error(`Resend API failed: ${response.status} ${body}`);
  }
};

const isAuthOrConnectionError = (error) =>
  !!(
    error &&
    (error.code === "EAUTH" ||
      error.responseCode === 535 ||
      error.code === "ECONNECTION" ||
      error.code === "ETIMEDOUT" ||
      (error.message && error.message.includes("Invalid login")))
  );

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

    if (!hasMailConfig()) {
      return res.status(503).json({
        error:
          "Email service not configured. Provide SMTP credentials or Gmail OAuth/App Password credentials.",
      });
    }

    // Save the contact message to the database
    const newContact = new Contact({
      firstName,
      lastName,
      email,
      message,
    });

    await newContact.save();

    // Configure the email options
    const mailOptions = {
      from: getMailFrom(),
      to: getInboundMailTo(),
      subject: "New Contact Message",
      text: `
        First Name: ${firstName}
        Last Name: ${lastName}
        Email: ${email}
        Message: ${message}
      `,
    };

    if (hasResendConfig()) {
      await sendViaResend({
        to: getInboundMailTo(),
        subject: "New Contact Message",
        text: mailOptions.text,
        html: `<pre style="font-family:inherit;white-space:pre-wrap;">${mailOptions.text}</pre>`,
        replyTo: email,
      });
    } else {
      const transporter = await getTransporter();
      await transporter.sendMail(mailOptions);
    }

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

    // Check if email credentials are configured
    if (!hasMailConfig()) {
      return res.status(503).json({
        error:
          "Email service not configured. Provide SMTP credentials or Gmail OAuth/App Password credentials.",
        details: {
          hasCustomSmtp: hasCustomSmtpConfig(),
          hasGmailOAuth: hasGmailOAuthConfig(),
          hasGmailAppPassword: hasGmailAppPasswordConfig(),
        },
      });
    }

    const contact = await Contact.findById(id);
    if (!contact) {
      return res.status(404).json({ error: "Contact message not found." });
    }

    const replyTo = process.env.EMAIL_REPLY_TO || getMailFrom();
    const html = `<p>${message.replace(/\n/g, "<br/>")}</p>`;

    // Prefer Resend when configured (primary); fall back to SMTP on failure
    if (hasResendConfig()) {
      try {
        await sendViaResend({
          to: contact.email,
          subject,
          text: message,
          html,
          replyTo,
        });
      } catch (resendError) {
        if (hasCustomSmtpConfig() || hasGmailOAuthConfig() || hasGmailAppPasswordConfig()) {
          try {
            const transporter = await getTransporter();
            await transporter.sendMail({
              from: `Ezra Seminary <${getMailFrom()}>`,
              to: contact.email,
              replyTo,
              subject,
              text: message,
              html,
            });
          } catch (smtpError) {
            throw resendError; // surface Resend error if both fail
          }
        } else {
          throw resendError;
        }
      }
    } else {
      const transporter = await getTransporter();
      await transporter.sendMail({
        from: `Ezra Seminary <${getMailFrom()}>`,
        to: contact.email,
        replyTo,
        subject,
        text: message,
        html,
      });
    }

    contact.repliedAt = new Date();
    await contact.save();

    res.status(200).json({ message: "Reply sent successfully." });
  } catch (error) {
    console.error("Error sending contact reply:", error);
    console.error("Error details:", {
      code: error.code,
      responseCode: error.responseCode,
      command: error.command,
      message: error.message,
    });
    
    // Check for email authentication/configuration errors
    if (isAuthOrConnectionError(error)) {
      // Email service configuration error
      return res.status(503).json({
        error:
          "Email provider authentication failed. Configure SMTP/Gmail OAuth correctly or add RESEND_API_KEY + EMAIL_FROM_ADDRESS fallback.",
        details: error.message,
      });
    }
    
    // Check if email credentials are missing
    if (!hasMailConfig()) {
      return res.status(503).json({
        error:
          "Email service not configured. Provide SMTP credentials or Gmail OAuth/App Password credentials.",
        details: {
          hasCustomSmtp: hasCustomSmtpConfig(),
          hasGmailOAuth: hasGmailOAuthConfig(),
          hasGmailAppPassword: hasGmailAppPasswordConfig(),
        },
      });
    }
    
    res.status(500).json({ 
      error: "Failed to send reply.",
      details: error.message || "Unknown error occurred",
    });
  }
};

module.exports.sendContactReply = sendContactReply;
