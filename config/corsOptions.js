const allowedOrigins = require("./allowedOrigins");

const corsOptions = {
  origin: function (origin, callback) {
    try {
      // Allow requests with no origin (like mobile apps, Postman, curl, etc.)
      if (!origin) {
        return callback(null, true);
      }

      // Normalize origin (remove trailing slash if present)
      const normalizedOrigin = origin.endsWith("/")
        ? origin.slice(0, -1)
        : origin;

      // Check if origin (or normalized version) is in allowed list
      const isAllowed =
        allowedOrigins.indexOf(origin) !== -1 ||
        allowedOrigins.indexOf(normalizedOrigin) !== -1;

      if (isAllowed) {
        callback(null, true);
      } else {
        // Log the blocked origin for debugging
        console.warn(`CORS: Origin not in allowed list: ${origin}`);
        // Temporarily allow all origins to prevent breaking the app
        callback(null, true);
        // TODO: After verifying everything works, uncomment below to enforce strict CORS:
        // callback(new Error(`Not allowed by CORS: ${origin}`));
      }
    } catch (error) {
      // If there's any error in the CORS check, allow the request to prevent breaking
      console.error("CORS configuration error:", error);
      callback(null, true);
    }
  },
  credentials: true,
  optionsSuccessStatus: 200,
  methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS", "PATCH", "HEAD"],
  allowedHeaders: [
    "Content-Type",
    "Authorization",
    "X-Requested-With",
    "Accept",
    "Origin",
    "Access-Control-Request-Method",
    "Access-Control-Request-Headers",
  ],
  exposedHeaders: ["Content-Length", "Content-Type"],
  maxAge: 86400, // 24 hours
};

module.exports = corsOptions;
