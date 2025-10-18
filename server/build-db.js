const fs = require('fs');
const path = require('path');

const dataDir = path.join(__dirname, 'data');
const usersPath = path.join(dataDir, 'users.json');
const reviewsPath = path.join(dataDir, 'reviews.json');
const dbPath = path.join(__dirname, 'db.json');

try {
    // Read current db.json (with user-added reviews)
    let db = { users: [], reviews: [] };
    try {
        const existingDb = JSON.parse(fs.readFileSync(dbPath, 'utf8'));
        db = existingDb;
    } catch (e) {
        console.log('No existing db.json found, creating new one...');
    }

    // Read source files
    const sourceUsers = JSON.parse(fs.readFileSync(usersPath, 'utf8'));
    

    const finalDb = {
        users: sourceUsers, // Keep source users
        reviews: db.reviews, // ONLY keep user-added reviews from existing db.json
    };

    // Write the cleaned db.json
    fs.writeFileSync(dbPath, JSON.stringify(finalDb, null, 2));

    console.log('✅ db.json has been cleaned - only user-added reviews kept!');
    console.log(`📊 Data summary:`);
    console.log(`   - Users: ${finalDb.users.length}`);
    console.log(`   - Reviews: ${finalDb.reviews.length} (user-added only)`);

} catch (error) {
    console.error('❌ Error generating db.json:', error.message);
    process.exit(1);
}