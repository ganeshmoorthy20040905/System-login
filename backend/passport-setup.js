const passport = require('passport');
const GoogleStrategy = require('passport-google-oauth20').Strategy;
const pool = require('./db');
require('dotenv').config();

passport.use(new GoogleStrategy({
    clientID: process.env.GOOGLE_CLIENT_ID,
    clientSecret: process.env.GOOGLE_CLIENT_SECRET,
    callbackURL: process.env.GOOGLE_CALLBACK_URL
},
    async (accessToken, refreshToken, profile, done) => {
        try {
            const email = profile.emails[0].value;
            const name = profile.displayName;

            let userResult = await pool.query('SELECT * FROM users WHERE email = $1', [email]);
            let user;
            if (userResult.rows.length === 0) {
                const newUserResult = await pool.query(
                    'INSERT INTO users (name, email, role, is_verified) VALUES ($1, $2, $3, $4) RETURNING *',
                    [name, email, 'user', true]
                );
                user = newUserResult.rows[0];
            } else {
                user = userResult.rows[0];
            }

            return done(null, user);
        } catch (err) {
            return done(err, null);
        }
    }
));

passport.serializeUser(function (user, done) {
    done(null, user);
});

passport.deserializeUser(function (user, done) {
    done(null, user);
});

module.exports = passport;
