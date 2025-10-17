const fs = require('fs');
const path = require('path');

// Path to data files
const dataDir = path.join(__dirname, 'data');
const usersPath = path.join(dataDir, 'users.json');
const reviewsPath = path.join(dataDir, 'reviews.json');
const dbPath = path.join(__dirname, 'db.json');

try {
    // Read all separate JSON files
    const users = JSON.parse(fs.readFileSync(usersPath, 'utf8'));
    const reviews = JSON.parse(fs.readFileSync(reviewsPath, 'utf8'));

    // Combine into db.json structure (without favorites)
    const db = {
        users,
        reviews
    };

    // Write the combined db.json file
    fs.writeFileSync(dbPath, JSON.stringify(db, null, 2));

    console.log('db.json has been generated from separate files!');
    console.log(`Data summary:`);
    console.log(`   - Users: ${users.length}`);
    console.log(`   - Reviews: ${reviews.length}`);
    console.log(`Server ready! Run: npm run json-server`);

} catch (error) {
    console.error('Error generating db.json:', error.message);
    process.exit(1);
}