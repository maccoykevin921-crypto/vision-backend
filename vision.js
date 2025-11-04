import express from "express";
import nodemailer from "nodemailer";
import fetch from "node-fetch";

const app = express();
app.use(express.json());

const PORT = process.env.PORT || 9000;

// ✅ Environment variables
const adminEmails = process.env.ADMIN_EMAILS
  ? process.env.ADMIN_EMAILS.split(",").map(e => e.trim())
  : [];

const transporter = nodemailer.createTransport({
  host: process.env.SMTP_HOST,
  port: process.env.SMTP_PORT || 587,
  secure: false,
  auth: {
    user: process.env.SMTP_USER,
    pass: process.env.SMTP_PASS
  },
});

// ✅ Health Check
app.get("/", (_req, res) => {
  res.json({
    message: "🛰️ Vision® Notification Core active",
    system: "Vision AI Backend",
    mode: process.env.NODE_ENV || "development",
    version: "1.0.1",
    time: new Date().toISOString(),
  });
});

// ✅ Sync Check
app.get("/sync", async (_req, res) => {
  try {
    const proxyUrl = process.env.VISION_PROXY_URL;
    const response = await fetch(proxyUrl);
    const proxyStatus = response.ok ? "Connected" : "Offline";
    res.json({
      message: "Vision® handshake completed 🤝",
      connectedTo: proxyUrl,
      status: proxyStatus,
      system: "Vision AI Core",
      mode: process.env.NODE_ENV || "development",
      version: "1.0.1",
    });
  } catch (err) {
    console.error("Sync Error:", err.message);
    res.status(500).json({ error: "Failed to reach VIN Proxy", details: err.message });
  }
});

// ✅ Notify Admin (Email + WhatsApp)
app.post("/notify", async (req, res) => {
  const { subject, text } = req.body;
  if (!subject || !text) return res.status(400).json({ error: "Subject and text required" });

  try {
    // Email notification
    const mailOptions = {
      from: process.env.NOTIFY_FROM || "Vision System <vision@vinoautomechanic.com>",
      to: adminEmails.join(", "),
      subject,
      text,
    };
    await transporter.sendMail(mailOptions);

    // WhatsApp notification
    const whatsappMessage = {
      messaging_product: "whatsapp",
      to: "+27672514218",
      type: "text",
      text: { body: `⚠️ Vision® Alert:\n${subject}\n${text}` },
    };
    await fetch(process.env.WHATSAPP_API_URL, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${process.env.WHATSAPP_TOKEN}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify(whatsappMessage),
    });

    res.json({ status: "✅ Alert sent successfully" });
  } catch (error) {
    console.error("Notification error:", error.message);
    res.status(500).json({ error: "Failed to send alerts", details: error.message });
  }
});

// ✅ Auto notify if system shuts down
process.on("SIGTERM", async () => {
  console.log("Vision® shutting down... notifying admins...");
  try {
    await fetch(`${process.env.WHATSAPP_API_URL}`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${process.env.WHATSAPP_TOKEN}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        messaging_product: "whatsapp",
        to: "+27672514218",
        type: "text",
        text: { body: "🚨 Vision® system has been shut down unexpectedly." },
      }),
    });
  } catch (err) {
    console.error("Shutdown alert failed:", err.message);
  }
  process.exit(0);
});

app.listen(PORT, () => {
  console.log(`🛰️ Vision® Notification System running on port ${PORT} in ${process.env.NODE_ENV} mode.`);
});