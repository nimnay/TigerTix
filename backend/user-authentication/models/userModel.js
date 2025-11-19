const { initializeDatabase } = require('../db');

let dbInstance = null;

async function getDB() {
    if (!dbInstance) {
        dbInstance = await initializeDatabase();
    }
    return dbInstance;
}

async function createUser(username, passwordHash, email) {
    const db = await getDB();
    const result = await db.run(
        'INSERT INTO users (username, password_hash, email) VALUES (?, ?, ?)',
        [username, passwordHash, email]
    );
    // Return the newly created user
    return db.get('SELECT id, username, email FROM users WHERE id = ?', [result.lastID]);
}

async function getUserByUsername(username) {
    const db = await getDB();
    return db.get(
        'SELECT * FROM users WHERE username = ?',
        [username]
    );
}

async function getUserByEmail(email) {
    const db = await getDB();
    return db.get(
        'SELECT * FROM users WHERE email = ?',
        [email]
    );
}

async function getUserById(id) {
    const db = await getDB();
    return db.get(
        'SELECT * FROM users WHERE id = ?',
        [id]
    );
}

module.exports = {
    createUser,
    getUserByUsername,
    getUserByEmail,
    getUserById
}; 