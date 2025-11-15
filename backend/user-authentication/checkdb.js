/**
 * Database inspection utility for user-authentication service
 * Run this to view all users and database stats
 */

const { initializeDatabase } = require('./db');

async function checkDatabase() {
    console.log('=== User Authentication Database Check ===\n');
    
    try {
        const db = await initializeDatabase();
        
        // Get all users
        const users = await db.all('SELECT * FROM users');
        
        console.log(`Total Users: ${users.length}\n`);
        
        if (users.length === 0) {
            console.log('No users found in database.');
        } else {
            console.log('Users:');
            console.log('─'.repeat(80));
            users.forEach(user => {
                console.log(`ID: ${user.id}`);
                console.log(`Username: ${user.username}`);
                console.log(`Email: ${user.email}`);
                console.log(`Password Hash: ${user.password_hash.substring(0, 20)}...`);
                console.log(`Created At: ${user.created_at}`);
                console.log('─'.repeat(80));
            });
        }
        
        // Get table info
        console.log('\nDatabase Schema:');
        const tableInfo = await db.all('PRAGMA table_info(users)');
        console.table(tableInfo);
        
        await db.close();
        console.log('\n✓ Database check complete!');
        
    } catch (error) {
        console.error('Error checking database:', error.message);
        process.exit(1);
    }
}

checkDatabase();
