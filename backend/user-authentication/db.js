const fs = require('fs');
const path = require('path');
const sqlite3 = require('sqlite3').verbose();
const {open} = require('sqlite');

async function initializeDatabase() {
    const dbPath = path.join(__dirname, 'data.sqlite');
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