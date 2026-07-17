import "dotenv/config";
import Joi from "joi";

const envSchema = Joi.object({
  NODE_ENV: Joi.string().valid("development", "test", "production").default("development"),
  PORT: Joi.number().port().default(4000),

  MONGODB_URI: Joi.string().uri({ scheme: [/mongodb(\+srv)?/] }).required(),

  // Comma-separated list of allowed origins. Example:
  // CORS_ORIGINS=http://localhost:3000,https://app.example.com
  CORS_ORIGINS: Joi.string().default("http://localhost:3000"),

  // JWT auth
  JWT_ACCESS_SECRET: Joi.string().min(32).required(),
  JWT_ISSUER: Joi.string().default("project_election"),
  JWT_AUDIENCE: Joi.string().default("project_election"),

  // Cookie / CSRF (only required if you enable CSRF below)
  COOKIE_SECRET: Joi.string().min(32).required(),
  CSRF_ENABLED: Joi.boolean().default(false),

  // When behind a proxy (nginx, cloudflare, render, etc) set to 1 (or "true")
  TRUST_PROXY: Joi.alternatives()
    .try(Joi.boolean(), Joi.number().integer().min(0).max(10), Joi.string())
    .default(false),

  // Socket security
  SOCKET_REQUIRE_AUTH: Joi.boolean().default(false),

  // Redis (recommended for scaling across multiple instances)
  REDIS_URL: Joi.string().uri().optional(),
  REDIS_ENABLED: Joi.boolean().default(false),

  // Groq AI (chat assistant). Vision-capable model so image uploads work.
  GROQ_API_KEY: Joi.string().optional(),
  GROQ_MODEL: Joi.string().default("meta-llama/llama-4-scout-17b-16e-instruct"),
}).unknown(true);

const { value, error } = envSchema.validate(process.env, {
  abortEarly: false,
  allowUnknown: true,
  convert: true,
});

if (error) {
  // Fail fast on boot rather than running insecurely/misconfigured.
  throw new Error(`Invalid environment configuration:\n${error.message}`);
}

function parseOrigins(input: string): string[] {
  return input
    .split(",")
    .map((s) => s.trim())
    .filter(Boolean);
}

export const env = {
  nodeEnv: value.NODE_ENV as "development" | "test" | "production",
  isProd: value.NODE_ENV === "production",
  port: value.PORT as number,
  mongoUri: value.MONGODB_URI as string,
  corsOrigins: parseOrigins(value.CORS_ORIGINS as string),
  trustProxy: value.TRUST_PROXY as boolean | number | string,

  jwt: {
    accessSecret: value.JWT_ACCESS_SECRET as string,
    issuer: value.JWT_ISSUER as string,
    audience: value.JWT_AUDIENCE as string,
  },

  cookieSecret: value.COOKIE_SECRET as string,
  csrfEnabled: value.CSRF_ENABLED as boolean,

  socketRequireAuth: value.SOCKET_REQUIRE_AUTH as boolean,

  redis: {
    enabled: value.REDIS_ENABLED as boolean,
    url: value.REDIS_URL as string | undefined,
  },

  groq: {
    apiKey: value.GROQ_API_KEY as string | undefined,
    model: value.GROQ_MODEL as string,
  },
};

