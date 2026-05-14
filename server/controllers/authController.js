import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import { User } from "../models/User.js";

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

function assertEnv() {
  const secret = process.env.JWT_SECRET;
  if (!secret) {
    const err = new Error("JWT_SECRET is not configured");
    err.statusCode = 500;
    throw err;
  }
  return secret;
}

function signToken(user) {
  const secret = assertEnv();
  const expiresIn = process.env.JWT_EXPIRES_IN || "7d";
  return jwt.sign(
    {
      sub: user._id.toString(),
      username: user.username,
      email: user.email,
    },
    secret,
    { expiresIn }
  );
}

function publicUser(user) {
  return {
    id: user._id.toString(),
    username: user.username,
    email: user.email,
  };
}

export async function signup(req, res, next) {
  try {
    const { username, email, password } = req.body ?? {};

    if (
      typeof username !== "string" ||
      typeof email !== "string" ||
      typeof password !== "string"
    ) {
      return res.status(400).json({
        success: false,
        message: "username, email, and password are required",
      });
    }

    const trimmedUsername = username.trim();
    const trimmedEmail = email.trim().toLowerCase();

    if (trimmedUsername.length < 2 || trimmedUsername.length > 64) {
      return res.status(400).json({
        success: false,
        message: "Username must be between 2 and 64 characters",
      });
    }

    if (!EMAIL_REGEX.test(trimmedEmail)) {
      return res.status(400).json({
        success: false,
        message: "Invalid email address",
      });
    }

    if (password.length < 8) {
      return res.status(400).json({
        success: false,
        message: "Password must be at least 8 characters",
      });
    }

    const passwordHash = await bcrypt.hash(password, 12);

    const user = await User.create({
      username: trimmedUsername,
      email: trimmedEmail,
      password: passwordHash,
    });

    const token = signToken(user);

    return res.status(201).json({
      success: true,
      token,
      user: publicUser(user),
    });
  } catch (err) {
    if (err.code === 11000) {
      return res.status(409).json({
        success: false,
        message: "Email already exists",
      });
    }
    return next(err);
  }
}

export async function signin(req, res, next) {
  try {
    const { email, password } = req.body ?? {};

    if (typeof email !== "string" || typeof password !== "string") {
      return res.status(400).json({
        success: false,
        message: "email and password are required",
      });
    }

    const trimmedEmail = email.trim().toLowerCase();

    const user = await User.findOne({ email: trimmedEmail }).select(
      "+password"
    );

    if (!user) {
      return res.status(401).json({
        success: false,
        message: "Invalid credentials",
      });
    }

    const match = await bcrypt.compare(password, user.password);
    if (!match) {
      return res.status(401).json({
        success: false,
        message: "Invalid credentials",
      });
    }

    const token = signToken(user);

    return res.json({
      success: true,
      token,
      user: publicUser(user),
    });
  } catch (err) {
    return next(err);
  }
}
