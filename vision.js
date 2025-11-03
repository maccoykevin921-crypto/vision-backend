import express from "express";
import fetch from "node-fetch";

const app = express();
app.use(express.json());

// Load environment variables
const {
  PORT = 9000,
  NODE_ENV,
  VISION_NAME,
  VISION_MODEL,
  VISION_PROXY_URL,
  SYSTEM_CORE,
  ADMIN_EMAIL,
  SECURITY_KEY,
  AI_MODE,
  LOG_LEVEL
} = process.env;

// Health check route
app.get("/", (_req, res) => {
  res.json({
    system: VISION_NAME,
    model: VISION_MODEL,
    core: SYSTEM_CORE,
    mode: AI_MODE,
    status: "Vision® System active ✅",
    environment: NODE_ENV,
  });
});

// Secure handshake with vino-vin-proxy
app.get("/sync", async (_req, res) => {
  try {
    const response = await fetch(`${VISION_PROXY_URL}/`, {
      headers: { "x-security-key": SECURITY_KEY },
    });

    const proxyStatus = await response.json();
    res.json({
      message: "Vision® handshake completed 🤝",
      connectedTo: VISION_PROXY_URL,
      proxyResponse: proxyStatus,
    });
  } catch (err) {
    console.error("Handshake error:", err.message);
    res.status(500).json({ error: "Failed to connect to vino-vin-proxy" });
  }
});

// Auto diagnostic self-check
app.get("/diagnostics", (_req, res) => {
  res.json({
    system: VISION_NAME,
    version: VISION_MODEL,
    security: SECURITY_KEY ? "Key Active 🔐" : "Missing ❌",
    ai_mode: AI_MODE,
    log_level: LOG_LEVEL,
    admin_contact: ADMIN_EMAIL,
  });
});

// Start Vision system
app.listen(PORT, () => {
  console.log(`🚀 Vision® system running on port ${PORT} in ${NODE_ENV} mode.`);
  console.log(`🔗 Connected to: ${VISION_PROXY_URL}`);
});