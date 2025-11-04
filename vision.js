import express from "express";
import nodemailer from "nodemailer";
import fetch from "node-fetch";

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

// ✅ POST /notify — send Vision® system alerts
router.post("/", async (req, res) => {
  try {
    const { subject, text } = req.body;

    if (!subject || !text) {
      return res.status(400).json({ error: "Subject and text are required" });
    }

    if (adminEmails.length === 0) {
      return res.status(500).json({ error: "No admin emails configured" });
    }

    const mailOptions = {
      from: process.env.NOTIFY_FROM || "Vision System <no-reply@vinoautomechanic.com>",
      to: adminEmails,
      subject,
      text,
    };

    await transporter.sendMail(mailOptions);
    console.log(`✅ Vision® Notification Sent → ${adminEmails.join(", ")}`);

    // Also send WhatsApp alert if it's an emergency
    if (subject.toLowerCase().includes("shutdown") || subject.toLowerCase().includes("error")) {
      await sendWhatsAppAlert(`⚠️ ${subject}\n\n${text}`);
      console.log("📲 WhatsApp alert sent successfully.");
    }

    res.json({ success: true, message: "Vision® notification sent successfully" });
  } catch (err) {
    console.error("❌ Vision® Notification Error:", err.message);
    res.status(500).json({
      success: false,
      error: "Failed to send Vision® notification",
      details: err.message,
    });
  }
});

// 🔁 Vision® Heartbeat (system status)
router.get("/heartbeat", (req, res) => {
  const status = {
    system: "Vision® Notification Core",
    uptime: process.uptime(),
    mode: process.env.NODE_ENV || "development",
    time: new Date().toISOString(),
    connectedAdmins: adminEmails,
  };
  res.json(status);
});

// 📲 WhatsApp API Integration (Twilio / Meta API)
async function sendWhatsAppAlert(message) {
  try {
    const whatsappNumber = "+27672514218";
    const apiUrl = process.env.WHATSAPP_API_URL || "https://graph.facebook.com/v19.0/me/messages";
    const token = process.env.WHATSAPP_TOKEN;

    await fetch(apiUrl, {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${token}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        messaging_product: "whatsapp",
        to: whatsappNumber,
        type: "text",
        text: { body: message },
      }),
    });
  } catch (err) {
    console.error("❌ WhatsApp alert failed:", err.message);
  }
}

export default router;