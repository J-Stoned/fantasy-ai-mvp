const fs = require('fs');
const path = require('path');

console.log('🚀 Preparing database for Vercel deployment...');

// Try to find the database with actual player data (the larger one)
const possibleSources = [
  path.join(__dirname, '..', 'prisma', 'prisma', 'dev.db'),
  path.join(__dirname, '..', 'prisma', 'dev.db')
];

let sourceDb = null;
let largestSize = 0;

// Find the largest database file (which should have the player data)
for (const dbPath of possibleSources) {
  if (fs.existsSync(dbPath)) {
    const stats = fs.statSync(dbPath);
    console.log(`Found database at ${dbPath}: ${(stats.size / 1024 / 1024).toFixed(2)} MB`);
    if (stats.size > largestSize) {
      largestSize = stats.size;
      sourceDb = dbPath;
    }
  }
}

if (!sourceDb) {
  console.error('❌ No database file found!');
  process.exit(1);
}

const sourceDbJournal = sourceDb + '-journal';
const targetDir = path.join(__dirname, '..', 'public', 'database');
const targetDb = path.join(targetDir, 'production.db');
const targetDbJournal = path.join(targetDir, 'production.db-journal');

// Ensure target directory exists
if (!fs.existsSync(targetDir)) {
  fs.mkdirSync(targetDir, { recursive: true });
  console.log('✅ Created database directory');
}

// Copy database file
console.log(`Using database from: ${sourceDb}`);
fs.copyFileSync(sourceDb, targetDb);
const stats = fs.statSync(targetDb);
console.log(`✅ Copied database to public directory (${(stats.size / 1024 / 1024).toFixed(2)} MB)`);

// Copy journal file if it exists
if (fs.existsSync(sourceDbJournal)) {
  fs.copyFileSync(sourceDbJournal, targetDbJournal);
  console.log('✅ Copied database journal file');
}

console.log('✅ Database preparation complete!');
console.log('📍 Database will be available at: /database/production.db');