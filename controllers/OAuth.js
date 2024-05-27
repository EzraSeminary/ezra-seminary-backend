const passport = require("passport");
const GoogleStrategy = require("passport-google-oauth20").Strategy;
const dotenv = require("dotenv");

dotenv.config();

// Configure Passport.js with Google Strategy
passport.use(
  new GoogleStrategy(
    {
      clientID: process.env.GOOGLE_CLIENT_ID,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET,
      callbackURL: "/auth/google/callback",
      passReqToCallback: true, // Pass the entire request object to callback
    },
    async (req, accessToken, refreshToken, profile, done) => {
      // Check if user exists in your database (replace with your logic)
      let user = await User.findOne({ googleId: profile.id });

      if (!user) {
        // Create a new user if they don't exist
        user = new User({
          googleId: profile.id,
          displayName: profile.displayName,
          email: profile.emails[0].value, // Access email if available
        });
        await user.save();
      }

      return done(null, user); // Pass the user object to the next middleware
    }
  )
);

// Serialize and deserialize user for session management
passport.serializeUser((user, done) => {
  done(null, user.id); // Store user ID in session
});

passport.deserializeUser((id, done) => {
  User.findById(id, (err, user) => {
    done(err, user);
  });
});

// Middleware to initiate Google OAuth login
const handleGoogleLogin = passport.authenticate("google", {
  scope: ["profile", "email"], // Request profile and email information
});

// Middleware to handle Google OAuth callback (after user grants access)
const handleGoogleCallback = passport.authenticate(
  "google",
  {
    failureRedirect: "/login-failed", // Redirect on failure
  },
  (req, user, info) => {
    // Successful authentication
    req.login(user, (err) => {
      if (err) {
        // Handle login errors
      } else {
        // Redirect or send user data to frontend
        res.redirect("/dashboard");
      }
    });
  }
);

module.exports = { handleGoogleLogin, handleGoogleCallback };
