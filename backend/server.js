const express = require("express");
const mongoose = require("mongoose");
const cors = require("cors");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");

const app = express();
const PORT = 5000;
const MONGO_URI = "mongodb://127.0.0.1:27017/rentclothes";
const JWT_SECRET = "RENTWEAR_SECRET_KEY";

app.use(express.json());
app.use(cors());

mongoose
  .connect(MONGO_URI)
  .then(() => {
    console.log("MongoDB connected");
  })
  .catch((error) => {
    console.error("MongoDB connection error:", error.message);
  });

const userSchema = new mongoose.Schema(
  {
    email: { type: String, required: true, unique: true, lowercase: true },
    password: { type: String, required: true },
    phone: { type: String, default: "" },
    address: { type: String, default: "" }
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

const authMiddleware = async (req, res, next) => {
  try {
    const token = getTokenFromHeader(req.headers.authorization);

    if (!token) {
      return res.status(401).json({ message: "Missing authorization token" });
    }

    const decoded = jwt.verify(token, JWT_SECRET);
    const user = await User.findById(decoded.id);

    if (!user) {
      return res.status(401).json({ message: "Invalid token" });
    }

    req.user = user;
    return next();
  } catch (error) {
    return res.status(401).json({ message: "Unauthorized" });
  }
};

app.post("/register", async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res
        .status(400)
        .json({ message: "Email and password are required" });
    }

    const normalizedEmail = email.trim().toLowerCase();
    const existingUser = await User.findOne({ email: normalizedEmail });

    if (existingUser) {
      return res.status(409).json({ message: "Email already exists" });
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    await User.create({ email: normalizedEmail, password: hashedPassword });

    return res.json({ message: "Register success" });
  } catch (error) {
    return res.status(500).json({ message: "Register failed" });
  }
});

app.post("/login", async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res
        .status(400)
        .json({ message: "Email and password are required" });
    }

    const normalizedEmail = email.trim().toLowerCase();
    const user = await User.findOne({ email: normalizedEmail });

    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    const isPasswordValid = await bcrypt.compare(password, user.password);

    if (!isPasswordValid) {
      return res.status(401).json({ message: "Wrong password" });
    }

    const token = jwt.sign({ id: user._id }, JWT_SECRET, { expiresIn: "7d" });

    return res.json({
      token,
      user: {
        id: user._id,
        email: user.email,
        phone: user.phone,
        address: user.address
      }
    });
  } catch (error) {
    return res.status(500).json({ message: "Login failed" });
  }
});

app.get("/profile", authMiddleware, async (req, res) => {
  return res.json({
    id: req.user._id,
    email: req.user.email,
    phone: req.user.phone,
    address: req.user.address
  });
});

app.put("/profile", authMiddleware, async (req, res) => {
  try {
    const { phone = "", address = "" } = req.body;

    req.user.phone = String(phone).trim();
    req.user.address = String(address).trim();
    await req.user.save();

    return res.json({
      message: "Profile updated",
      user: {
        id: req.user._id,
        email: req.user.email,
        phone: req.user.phone,
        address: req.user.address
      }
    });
  } catch (error) {
    return res.status(500).json({ message: "Profile update failed" });
  }
});

app.listen(PORT, () => {
  console.log(`Server running on ${PORT}`);
});
