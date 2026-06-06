import rateLimit from "express-rate-limit";

export const verifyLimiter = rateLimit({
  windowMs: 60 * 1000, // 60 seconds
  max: 20, // limit each IP to 20 requests per windowMs
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    error: "Too many verification requests, please try again in a minute",
  },
});

export const batchUploadLimiter = rateLimit({
  windowMs: 60 * 1000, // 60 seconds
  max: 5, // limit each IP to 5 requests per windowMs
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    error: "Too many batch upload requests, please try again in a minute",
  },
});
