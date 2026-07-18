import { Router } from "express";
import Joi from "joi";
import jwt from "jsonwebtoken";
import multer from "multer";

import { env } from "../config/env";
import { requireAuth } from "../middleware/auth";
import { validate } from "../middleware/validate";
import { authLimiter } from "../middleware/rateLimiters";
import { User, type UserDocument } from "../models/User";
import { askVetAssistant, isGroqConfigured } from "../services/groq";

export const apiRouter = Router();

apiRouter.get("/health", (req, res) => {
  res.status(200).json({ ok: true });
});

const registerSchema = Joi.object({
  body: Joi.object({
    fullName: Joi.string().trim().min(2).max(100).required(),
    email: Joi.string().trim().lowercase().email().max(254).required(),
    password: Joi.string().min(8).max(72).required(),
    number: Joi.string()
      .trim()
      .pattern(/^[+0-9().\s-]{7,20}$/)
      .required()
      .messages({ "string.pattern.base": "Phone number is not valid" }),
  }).required(),
});

const loginSchema = Joi.object({
  body: Joi.object({
    email: Joi.string().trim().lowercase().email().max(254).required(),
    password: Joi.string().min(1).max(72).required(),
  }).required(),
});

function createAccessToken(userId: string): string {
  return jwt.sign({}, env.jwt.accessSecret, {
    subject: userId,
    issuer: env.jwt.issuer,
    audience: env.jwt.audience,
    expiresIn: "1h",
  });
}

function publicUser(user: UserDocument) {
  return {
    id: user.id as string,
    fullName: user.fullName,
    email: user.email,
    number: user.number,
  };
}

apiRouter.post(
  "/auth/register",
  authLimiter,
  validate(registerSchema),
  async (req, res, next) => {
    const { fullName, email, password, number } = req.body as {
      fullName: string;
      email: string;
      password: string;
      number: string;
    };

    try {
      const existingUser = await User.exists({ email });
      if (existingUser) {
        return res.status(409).json({
          ok: false,
          message: "An account with this email already exists",
        });
      }

      const user = await User.create({ fullName, email, password, number });
      return res.status(201).json({
        ok: true,
        accessToken: createAccessToken(user.id as string),
        user: publicUser(user),
      });
    } catch (error) {
      if (
        typeof error === "object" &&
        error !== null &&
        "code" in error &&
        error.code === 11000
      ) {
        return res.status(409).json({
          ok: false,
          message: "An account with this email already exists",
        });
      }
      return next(error);
    }
  }
);

apiRouter.post(
  "/auth/login",
  authLimiter,
  validate(loginSchema),
  async (req, res, next) => {
    const { email, password } = req.body as { email: string; password: string };

    try {
      const user = await User.findOne({ email }).select("+password");
      if (!user || !(await user.comparePassword(password))) {
        return res.status(401).json({
          ok: false,
          message: "Email or password is incorrect",
        });
      }

      return res.status(200).json({
        ok: true,
        accessToken: createAccessToken(user.id as string),
        user: publicUser(user),
      });
    } catch (error) {
      return next(error);
    }
  }
);

// --- AI chat (Groq) ---

const chatUpload = multer({
  storage: multer.memoryStorage(),
  limits: { files: 5, fileSize: 10 * 1024 * 1024 },
  fileFilter(req, file, cb) {
    const ok = file.mimetype.startsWith("image/") || file.mimetype === "application/pdf";
    cb(null, ok);
  },
});

apiRouter.post("/chat", chatUpload.array("files", 5), async (req, res, next) => {
  try {
    if (!isGroqConfigured()) {
      return res
        .status(503)
        .json({ ok: false, message: "AI assistant is not configured (missing GROQ_API_KEY)" });
    }

    const body = req.body as { message?: string; petType?: string; history?: string };
    const message = (body.message ?? "").trim();
    const files = (req.files as Express.Multer.File[] | undefined) ?? [];

    if (!message && files.length === 0) {
      return res.status(400).json({ ok: false, message: "Message or attachment required" });
    }

    let history: { role: "user" | "assistant"; content: string }[] = [];
    if (body.history) {
      try {
        const parsed = JSON.parse(body.history) as unknown;
        if (Array.isArray(parsed)) {
          history = parsed
            .filter(
              (m): m is { role: "user" | "assistant"; content: string } =>
                typeof m === "object" &&
                m !== null &&
                ((m as { role?: unknown }).role === "user" ||
                  (m as { role?: unknown }).role === "assistant") &&
                typeof (m as { content?: unknown }).content === "string"
            )
            .slice(-12);
        }
      } catch {
        // Malformed history is ignored; the current message still gets answered.
      }
    }

    const reply = await askVetAssistant({
      message,
      petType: typeof body.petType === "string" ? body.petType : undefined,
      history,
      images: files
        .filter((f) => f.mimetype.startsWith("image/"))
        .map((f) => ({ buffer: f.buffer, mimeType: f.mimetype })),
      pdfNames: files
        .filter((f) => f.mimetype === "application/pdf")
        .map((f) => f.originalname),
    });

    return res.status(200).json({ ok: true, reply });
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    // Surface Groq failures clearly instead of a generic Express 500.
    if (message.startsWith("Groq API error") || message.includes("GROQ_API_KEY")) {
      return res.status(502).json({ ok: false, message });
    }
    return next(error);
  }
});

apiRouter.get("/me", requireAuth, async (req, res, next) => {
  try {
    const user = await User.findById(req.user?.sub);
    if (!user) {
      return res.status(404).json({ ok: false, message: "User not found" });
    }
    return res.status(200).json({ ok: true, user: publicUser(user) });
  } catch (error) {
    return next(error);
  }
});

