import express from "express";
import fetch from "node-fetch";

const app = express();
const PORT = process.env.PORT || 9000;

app.use(express.json());

// Health Check
app.get("/", (_req, res) => {
  res.json({ message: "Vision® backend online 🚀" });
});

// Sync Check Route
app.get("/sync", async (_req, res) => {
  try {
    const proxyUrl = process.env.VISION_PROXY_URL || "https://vino-vin-proxy.onrender.com";

    const response = await fetch(proxyUrl);
    const proxyStatus = response.ok ? "Connected" : "Error";

    res.json({
      message: "Vision® handshake completed 🤝",
      connectedTo: proxyUrl,
      status: proxyStatus,
      system: "Vision AI Core",
      mode: process.env.NODE_ENV || "development",
      version: "1.0.0"
    });
  } catch (err) {
    console.error("Sync Error:", err.message);
    res.status(500).json({
      error: "Failed to reach VIN Proxy",
      details: err.message
    });
  }
});

// Start Server
app.listen(PORT, () => {
  console.log(`🛰️ Vision® system running on port ${PORT}`);
});