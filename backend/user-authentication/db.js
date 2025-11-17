const fs = require('fs');
const path = require('path');
const sqlite3 = require('sqlite3').verbose();
const {open} = require('sqlite');

/**
 * Initializes and returns a database connection
 * Uses test database when NODE_ENV is 'test', otherwise uses production database
 * 
 * @async
 * @function initializeDatabase
 * @returns {Promise<Object>} Initialized database instance
 * @throws {Error} If database initialization fails
 * 
 */
async function initializeDatabase() {
    // Use test database in test environment
    const isTest = process.env.NODE_ENV === 'test';
    const dbPath = isTest 
        ? path.join(__dirname, 'tests', 'integration', 'test-auth.db')
        : path.join(__dirname, 'data.sqlite');
    
    const schemaPath = path.join(__dirname, 'init.sql');
    
    const db = await open({
        filename: dbPath,
        driver: sqlite3.Database
    });

    const schema = fs.readFileSync(schemaPath, 'utf-8');
    await db.exec(schema);

    return db;
}

module.exports = {
    initializeDatabase
};