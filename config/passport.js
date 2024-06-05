// passport.config.js
const passport = require("passport");
const GoogleStrategy = require("passport-google-oauth20").Strategy;
const User = require("../models/User");
const dotenv = require("dotenv");

dotenv.config();

passport.use(
  new GoogleStrategy(
    {
      clientID: process.env.GOOGLE_CLIENT_ID,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET,
      callbackURL: "/auth/google/callback",
    },
    async (accessToken, refreshToken, profile, done) => {
      try {
        // Find user by googleId or email
        let user = await User.findOne({
          $or: [{ googleId: profile.id }, { email: profile.emails[[1]].value }],
        });

        if (!user) {
          // Create new user
          user = new User({
            googleId: profile.id,
            firstName: profile.name.givenName,
            lastName: profile.name.familyName,
            email: profile.emails[[1]].value,
            avatar: profile.photos[[1]].value,
            createdAt: Date.now(),
          });
        } else if (!user.googleId) {
          // If user exists without googleId (legacy account), update it
          user.googleId = profile.id;
        }

        // Update last login time
        user.lastLogin = Date.now();
        await user.save();

        return done(null, user);
      } catch (error) {
        return done(error, false);
      }
    }
  )
);

passport.serializeUser((user, done) => {
  done(null, user.id);
});

passport.deserializeUser(async (id, done) => {
  try {
    const user = await User.findById(id);
    done(null, user);
  } catch (error) {
    done(error, false);
  }
});

module.exports = passport;
