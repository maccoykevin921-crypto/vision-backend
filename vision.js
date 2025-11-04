import express from "express";
import nodemailer from "nodemailer";
import fetch from "node-fetch";

const app = express();
app.use(express.json());

const PORT = process.env.PORT || 9000;

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

// ✅ Health check
app.get("/", (_req, res) => {
  res.json({
    message: "Vision® Notification Core active 🛰️",
    system: "Vision AI Backend",
    mode: process.env.NODE_ENV || "development",
    time: new Date().toISOString(),
  });
});

// ✅ POST /notify — Send Vision® system alerts
app.post("/notify", async (req, res) => {
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

    // Also send WhatsApp alert if critical
    if (
      subject.toLowerCase().includes("shutdown") ||
      subject.toLowerCase().includes("error") ||
      subject.toLowerCase().includes("crash")
    ) {
      await sendWhatsAppAlert(`⚠️ ${subject}\n\n${text}`);
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

// ✅ Vision® Heartbeat (system status)
app.get("/heartbeat", (req, res) => {
  const status = {
    system: "Vision® Notification Core",
    uptime: `${Math.floor(process.uptime())}s`,
    mode: process.env.NODE_ENV || "development",
    time: new Date().toISOString(),
    connectedAdmins: adminEmails,
    version: "1.0.1",
  };
  res.json(status);
});

// 📲 WhatsApp API Integration (Meta Cloud or Twilio)
async function sendWhatsAppAlert(message) {
  try {
    const whatsappNumber = "+27672514218";
    const apiUrl = process.env.WHATSAPP_API_URL || "https://graph.facebook.com/v19.0/me/messages";
    const token = process.env.WHATSAPP_TOKEN;

    if (!token) {
      console.error("❌ WhatsApp alert failed: Missing API token");
      return;
    }

    await fetch(apiUrl, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        messaging_product: "whatsapp",
        to: whatsappNumber,
        type: "text",
        text: { body: message },
      }),
    });

    console.log("📲 WhatsApp alert sent successfully.");
  } catch (err) {
    console.error("❌ WhatsApp alert failed:", err.message);
  }
}

// 🚨 Vision® Shutdown & Crash Handler
process.on("SIGTERM", async () => {
  console.log("⚠️ Vision® System shutting down...");
  await sendWhatsAppAlert("⚠️ Vision® System shutting down or restarting now.");
  process.exit(0);
});

process.on("uncaughtException", async (err) => {
  console.error("❌ Uncaught Exception:", err.message);
  await sendWhatsAppAlert(`🚨 Vision® System Crash Detected: ${err.message}`);
  process.exit(1);
});

// ✅ Start server
app.listen(PORT, () => {
  console.log(`🛰️ Vision® Notification System running on port ${PORT} in ${process.env.NODE_ENV || "development"} mode.`);
});