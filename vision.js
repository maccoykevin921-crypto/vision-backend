import express from "express";
import nodemailer from "nodemailer";

const router = express.Router();

// Vision® dynamic environment variables
const adminEmails = process.env.ADMIN_EMAILS
  ? process.env.ADMIN_EMAILS.split(",").map((e) => e.trim())
  : [];

const transporter = nodemailer.createTransport({
  host: process.env.SMTP_HOST,
  port: process.env.SMTP_PORT || 587,
  secure: false,
  auth: {
    user: process.env.SMTP_USER,
    pass: process.env.SMTP_PASS,
  },
});

// ✅ POST /notify — send Vision® system alert
router.post("/", async (req, res) => {
  try {
    const { subject, text } = req.body;

    if (!subject || !text) {
      return res.status(400).json({ error: "Subject and text are required." });
    }

    if (adminEmails.length === 0) {
      return res
        .status(500)
        .json({ error: "No admin emails configured in environment." });
    }

    // Send Vision® alert email
    const info = await transporter.sendMail({
      from: process.env.NOTIFY_FROM || "Vision System <no-reply@vinoautomechanic.com>",
      to: adminEmails,
      subject: subject,
      text: text,
    });

    console.log(`✅ Vision® Notification sent: ${info.messageId}`);

    return res.json({
      message: "✅ Notification sent successfully.",
      messageId: info.messageId,
    });
  } catch (error) {
    console.error("❌ Vision Notify Error:", error);
    return res.status(500).json({ error: "Failed to send notification", details: error.message });
  }
});

export default router;