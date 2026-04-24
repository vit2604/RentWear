const express = require("express");
const mongoose = require("mongoose");
const cors = require("cors");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const https = require("https");
const crypto = require("crypto");

const app = express();
const PORT = 5000;
const MONGO_URI = process.env.MONGO_URI || "mongodb://127.0.0.1:27017/rentclothes";
const JWT_SECRET = "RENTWEAR_SECRET_KEY";
const ADMIN_EMAILS = new Set(["admin@rentwear.com", "admin@rentwear.local"]);

const PAYOS_BASE_URL = process.env.PAYOS_BASE_URL || "https://api-merchant.payos.vn";
const PAYOS_CLIENT_ID =
  process.env.PAYOS_CLIENT_ID || "ad8d8be4-114e-4067-a097-ed620050ea2f";
const PAYOS_API_KEY =
  process.env.PAYOS_API_KEY || "ed4f9f69-b42b-4bce-bda9-686846a18d2e";
const PAYOS_CHECKSUM_KEY =
  process.env.PAYOS_CHECKSUM_KEY ||
  "3110d32468e757481dcb17b70f20d45bef34f418f063a36d049a7ee2e68b4313";

app.use(express.json());
app.use(cors());
app.use((req, res, next) => {
  const startedAt = Date.now();

  res.on("finish", () => {
    const duration = Date.now() - startedAt;
    console.log(`[HTTP] ${req.method} ${req.originalUrl} ${res.statusCode} ${duration}ms`);
  });

  next();
});

mongoose.set("bufferCommands", false);

mongoose
  .connect(MONGO_URI)
  .then(() => {
    console.log("MongoDB connected");
  })
  .catch((error) => {
    console.error("MongoDB connection error:", error.message);
  });

const isDatabaseConnected = () => mongoose.connection.readyState === 1;

const requireDatabase = (req, res, next) => {
  if (!isDatabaseConnected()) {
    return res.status(503).json({
      message:
        "Backend da chay nhung chua ket noi MongoDB. Vui long bat MongoDB hoac kiem tra MONGO_URI."
    });
  }

  return next();
};

const userSchema = new mongoose.Schema(
  {
    email: { type: String, required: true, unique: true, lowercase: true },
    password: { type: String, required: true },
    phone: { type: String, default: "" },
    address: { type: String, default: "" },
    role: {
      type: String,
      enum: ["customer", "admin"],
      default: "customer"
    }
  },
  { timestamps: true }
);

const User = mongoose.model("User", userSchema);

const getTokenFromHeader = (authorizationHeader = "") => {
  if (!authorizationHeader) {
    return "";
  }

  if (authorizationHeader.startsWith("Bearer ")) {
    return authorizationHeader.slice(7);
  }

  return authorizationHeader;
};

const resolveRoleByEmail = (email = "") =>
  ADMIN_EMAILS.has(email) ? "admin" : "customer";

const authMiddleware = async (req, res, next) => {
  try {
    const token = getTokenFromHeader(req.headers.authorization);

    if (!token) {
      return res.status(401).json({ message: "Thieu token xac thuc." });
    }

    const decoded = jwt.verify(token, JWT_SECRET);
    const user = await User.findById(decoded.id);

    if (!user) {
      return res.status(401).json({ message: "Token khong hop le." });
    }

    req.user = user;
    return next();
  } catch (error) {
    return res.status(401).json({ message: "Khong co quyen truy cap." });
  }
};

const generatePayOSSignature = ({ amount, cancelUrl, description, orderCode, returnUrl }) => {
  const data =
    `amount=${amount}` +
    `&cancelUrl=${cancelUrl}` +
    `&description=${description}` +
    `&orderCode=${orderCode}` +
    `&returnUrl=${returnUrl}`;

  return crypto.createHmac("sha256", PAYOS_CHECKSUM_KEY).update(data).digest("hex");
};

const callPayOS = ({ path, method = "POST", payload = null }) =>
  new Promise((resolve, reject) => {
    const body = payload ? JSON.stringify(payload) : "";
    const url = new URL(`${PAYOS_BASE_URL}${path}`);

    const req = https.request(
      {
        hostname: url.hostname,
        path: url.pathname + (url.search || ""),
        port: 443,
        method,
        headers: {
          "x-client-id": PAYOS_CLIENT_ID,
          "x-api-key": PAYOS_API_KEY,
          "Content-Type": "application/json",
          "Content-Length": Buffer.byteLength(body)
        }
      },
      (res) => {
        let raw = "";

        res.on("data", (chunk) => {
          raw += chunk;
        });

        res.on("end", () => {
          try {
            const parsed = raw ? JSON.parse(raw) : {};

            if (res.statusCode >= 400) {
              reject(parsed);
              return;
            }

            resolve(parsed);
          } catch (error) {
            reject({ message: "Khong parse duoc phan hoi tu PayOS.", raw });
          }
        });
      }
    );

    req.on("error", (error) => reject({ message: error.message }));

    if (body) {
      req.write(body);
    }

    req.end();
  });

app.post("/payments/payos/create", async (req, res) => {
  try {
    const amount = Number(req.body?.amount || 0);
    if (!amount || amount <= 0) {
      return res.status(400).json({ message: "So tien thanh toan khong hop le." });
    }

    const cancelUrl =
      req.body?.cancelUrl || process.env.PAYOS_CANCEL_URL || "http://localhost:3000/payment?status=cancel";
    const returnUrl =
      req.body?.returnUrl || process.env.PAYOS_RETURN_URL || "http://localhost:3000/payment?status=success";

    const orderCode = Number(`${Date.now()}${Math.floor(Math.random() * 90 + 10)}`.slice(-12));

    const rawDescription = String(req.body?.description || `RW${orderCode}`).toUpperCase();
    const description = rawDescription.replace(/[^A-Z0-9-_]/g, "").slice(0, 25) || `RW${orderCode}`;

    const requestData = {
      orderCode,
      amount,
      description,
      cancelUrl,
      returnUrl,
      items: Array.isArray(req.body?.items) && req.body.items.length
        ? req.body.items
        : [
            {
              name: "RentWear",
              quantity: 1,
              price: amount
            }
          ]
    };

    if (req.body?.buyerName) {
      requestData.buyerName = req.body.buyerName;
    }
    if (req.body?.buyerEmail) {
      requestData.buyerEmail = req.body.buyerEmail;
    }
    if (req.body?.buyerPhone) {
      requestData.buyerPhone = req.body.buyerPhone;
    }

    requestData.signature = generatePayOSSignature({
      amount: requestData.amount,
      cancelUrl: requestData.cancelUrl,
      description: requestData.description,
      orderCode: requestData.orderCode,
      returnUrl: requestData.returnUrl
    });

    const payOSResponse = await callPayOS({
      path: "/v2/payment-requests",
      method: "POST",
      payload: requestData
    });

    return res.status(200).json({
      message: "Tao thanh toan PayOS thanh cong.",
      data: payOSResponse?.data || null,
      raw: payOSResponse
    });
  } catch (error) {
    console.error("[PAYOS_CREATE_ERROR]", error);
    return res.status(502).json({
      message: "Khong tao duoc thanh toan PayOS.",
      error
    });
  }
});

app.post("/register", requireDatabase, async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ message: "Email va mat khau la bat buoc." });
    }

    const normalizedEmail = email.trim().toLowerCase();
    const existingUser = await User.findOne({ email: normalizedEmail });

    if (existingUser) {
      return res.status(409).json({ message: "Email da ton tai." });
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    await User.create({
      email: normalizedEmail,
      password: hashedPassword,
      role: resolveRoleByEmail(normalizedEmail)
    });

    return res.json({ message: "Dang ky thanh cong." });
  } catch (error) {
    console.error("[REGISTER_ERROR]", error);
    return res.status(500).json({ message: "Dang ky that bai." });
  }
});

app.post("/login", requireDatabase, async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ message: "Email va mat khau la bat buoc." });
    }

    const normalizedEmail = email.trim().toLowerCase();
    const user = await User.findOne({ email: normalizedEmail });

    if (!user) {
      return res.status(404).json({ message: "Khong tim thay tai khoan." });
    }

    if (!user.role) {
      user.role = resolveRoleByEmail(user.email);
      await user.save();
    }

    const isPasswordValid = await bcrypt.compare(password, user.password);

    if (!isPasswordValid) {
      return res.status(401).json({ message: "Sai mat khau." });
    }

    const token = jwt.sign({ id: user._id }, JWT_SECRET, { expiresIn: "7d" });

    return res.json({
      token,
      user: {
        id: user._id,
        email: user.email,
        phone: user.phone,
        address: user.address,
        role: user.role
      }
    });
  } catch (error) {
    console.error("[LOGIN_ERROR]", error);
    return res.status(500).json({ message: "Dang nhap that bai." });
  }
});

app.get("/profile", requireDatabase, authMiddleware, async (req, res) =>
  res.json({
    id: req.user._id,
    email: req.user.email,
    phone: req.user.phone,
    address: req.user.address,
    role: req.user.role || resolveRoleByEmail(req.user.email)
  })
);

app.put("/profile", requireDatabase, authMiddleware, async (req, res) => {
  try {
    const { phone = "", address = "" } = req.body;

    req.user.phone = String(phone).trim();
    req.user.address = String(address).trim();
    await req.user.save();

    return res.json({
      message: "Cap nhat ho so thanh cong.",
      user: {
        id: req.user._id,
        email: req.user.email,
        phone: req.user.phone,
        address: req.user.address,
        role: req.user.role || resolveRoleByEmail(req.user.email)
      }
    });
  } catch (error) {
    console.error("[PROFILE_UPDATE_ERROR]", error);
    return res.status(500).json({ message: "Cap nhat ho so that bai." });
  }
});

app.listen(PORT, () => {
  console.log(`Server running on ${PORT}`);
});
