import express from "express";
import fetch from "node-fetch";
import nodemailer from "nodemailer";

const app = express();
app.use(express.json());
const PORT = process.env.PORT || 9000;

// 🌐 Vision® dynamic environment variables
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

// ✅ Health check route
app.get("/", (_req, res) => {
  res.json({
    message: "🛰️ Vision® Notification Core active.",
    system: "Vision AI Backend",
    mode: process.env.NODE_ENV || "production",
    proxy: process.env.VISION_PROXY_URL || "Not Set",
    time: new Date().toISOString(),
  });
});

// 🔄 Sync handshake route
app.get("/sync", async (_req, res) => {
  try {
    const proxyUrl = process.env.VISION_PROXY_URL;
    const response = await fetch(proxyUrl);
    const proxyStatus = response.ok ? "Connected" : "Failed";

    res.json({
      message: "Vision® handshake completed 🤝",
      connectedTo: proxyUrl,
      status: proxyStatus,
      system: "Vision AI Core",
      mode: process.env.NODE_ENV || "production",
      version: "1.0.2",
    });
  } catch (err) {
    res.status(500).json({
      error: "Failed to reach VIN Proxy",
      details: err.message,
    });
  }
});

// 📩 Admin email & WhatsApp notifier
app.post("/notify", async (req, res) => {
  try {
    const { subject, text } = req.body;
    if (!subject || !text)
      return res.status(400).json({ error: "Subject and text required" });

    if (!adminEmails.length)
      return res.status(500).json({ error: "No admin emails configured" });

    const mailOptions = {
      from: process.env.SMTP_USER,
      to: adminEmails.join(", "),
      subject,
      text,
    };

    await transporter.sendMail(mailOptions);

    console.log("✅ Notification email sent to admins.");

    // WhatsApp alert trigger
    const whatsappMessage = `⚠️ Vision® Alert: ${subject}\n${text}`;
    await fetch(
      `https://api.callmebot.com/whatsapp.php?phone=+27672514218&text=${encodeURIComponent(
        whatsappMessage
      )}&apikey=813627`
    );

    console.log("📱 WhatsApp alert sent successfully.");
    res.json({ success: true, sent: adminEmails, mode: "production" });
  } catch (err) {
    console.error("Notify Error:", err.message);
    res.status(500).json({ error: err.message });
  }
});

// 🚨 Auto shutdown watcher
process.on("SIGTERM", async () => {
  const msg = "🚨 Vision® backend shutting down.";
  await fetch(
    `https://api.callmebot.com/whatsapp.php?phone=+27672514218&text=${encodeURIComponent(
      msg
    )}&apikey=813627`
  );
  console.log("⚠️ Vision® Shutdown Notice sent.");
  process.exit(0);
});

// 🚀 Start server
app.listen(PORT, () => {
  console.log(`🛰️ Vision® Notification System running on port ${PORT}`);
});