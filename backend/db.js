const { newDb } = require('pg-mem');
require('dotenv').config();

// Create an in-memory db
const db = newDb();

// Add table definitions logic using the standard SQL init file
// If you want robust mock behavior we intercept the initialization in index.js
// but here we just export the fake pool.

// To allow auto-increment SERIAL parsing correctly in pg-mem
// though pg-mem might throw on TIMESTAMP DEFAULT CURRENT_TIMESTAMP sometimes.
// But as pg-mem createPg() creates a Pool instance, we can just export it.
const pg = db.adapters.createPg();

const pool = new pg.Pool({
    user: process.env.DB_USER,
    host: process.env.DB_HOST,
    database: process.env.DB_NAME,
    password: process.env.DB_PASSWORD,
    port: process.env.DB_PORT,
});

pool.connect((err, client, release) => {
    if (err) {
        console.error('Error acquiring client', err.stack);
    } else {
        console.log('Connected to PostgreSQL successfully (using pg-mem fallback)!');
        release();
    }
});

// Since pg-mem doesn't run the init file naturally if we don't catch it, let's expose db as well.
// But we can patch index.js to just use pool.query 
module.exports = pool;
