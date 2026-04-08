const express = require("express");
const mongoose = require("mongoose");
const cors = require("cors");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");

const app = express();
const PORT = 5000;
const MONGO_URI = process.env.MONGO_URI || "mongodb://127.0.0.1:27017/rentclothes";
const JWT_SECRET = "RENTWEAR_SECRET_KEY";
const ADMIN_EMAILS = new Set(["admin@rentwear.com", "admin@rentwear.local"]);

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
        "Backend đã chạy nhưng chưa kết nối MongoDB. Vui lòng bật MongoDB hoặc kiểm tra MONGO_URI."
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
      return res.status(401).json({ message: "Thiếu token xác thực." });
    }

    const decoded = jwt.verify(token, JWT_SECRET);
    const user = await User.findById(decoded.id);

    if (!user) {
      return res.status(401).json({ message: "Token không hợp lệ." });
    }

    req.user = user;
    return next();
  } catch (error) {
    return res.status(401).json({ message: "Không có quyền truy cập." });
  }
};

app.post("/register", requireDatabase, async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ message: "Email và mật khẩu là bắt buộc." });
    }

    const normalizedEmail = email.trim().toLowerCase();
    const existingUser = await User.findOne({ email: normalizedEmail });

    if (existingUser) {
      return res.status(409).json({ message: "Email đã tồn tại." });
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    await User.create({
      email: normalizedEmail,
      password: hashedPassword,
      role: resolveRoleByEmail(normalizedEmail)
    });

    return res.json({ message: "Đăng ký thành công." });
  } catch (error) {
    console.error("[REGISTER_ERROR]", error);
    return res.status(500).json({ message: "Đăng ký thất bại." });
  }
});

app.post("/login", requireDatabase, async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ message: "Email và mật khẩu là bắt buộc." });
    }

    const normalizedEmail = email.trim().toLowerCase();
    const user = await User.findOne({ email: normalizedEmail });

    if (!user) {
      return res.status(404).json({ message: "Không tìm thấy tài khoản." });
    }

    if (!user.role) {
      user.role = resolveRoleByEmail(user.email);
      await user.save();
    }

    const isPasswordValid = await bcrypt.compare(password, user.password);

    if (!isPasswordValid) {
      return res.status(401).json({ message: "Sai mật khẩu." });
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
    return res.status(500).json({ message: "Đăng nhập thất bại." });
  }
});

app.get("/profile", requireDatabase, authMiddleware, async (req, res) => {
  return res.json({
    id: req.user._id,
    email: req.user.email,
    phone: req.user.phone,
    address: req.user.address,
    role: req.user.role || resolveRoleByEmail(req.user.email)
  });
});

app.put("/profile", requireDatabase, authMiddleware, async (req, res) => {
  try {
    const { phone = "", address = "" } = req.body;

    req.user.phone = String(phone).trim();
    req.user.address = String(address).trim();
    await req.user.save();

    return res.json({
      message: "Cập nhật hồ sơ thành công.",
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
    return res.status(500).json({ message: "Cập nhật hồ sơ thất bại." });
  }
});

app.listen(PORT, () => {
  console.log(`Server running on ${PORT}`);
});
