#!/usr/bin/env node
/**
 * McNutt's Island Alliance — Setup Script
 *
 * Initializes the database schema, seeds poll candidates,
 * and creates an admin user via interactive prompt.
 *
 * Usage: node scripts/setup.js
 */

require('dotenv').config({ path: require('path').join(__dirname, '..', '.env') });

const path      = require('path');
const fs        = require('fs');
const readline  = require('readline');
const Database  = require('better-sqlite3');
const bcrypt    = require('bcryptjs');

const DB_PATH = process.env.DB_PATH || path.join(__dirname, '..', 'database', 'mcnutts.db');
const SCHEMA_PATH = path.join(__dirname, '..', 'database', 'schema.sql');

// ── Helpers ─────────────────────────────────────────────────────────────────────
function prompt(rl, question) {
  return new Promise(resolve => rl.question(question, resolve));
}

function promptHidden(question) {
  return new Promise((resolve) => {
    const rl = require('readline').createInterface({
      input: process.stdin,
      output: process.stdout,
      terminal: true,
    });

    process.stdout.write(question);

    let answer = '';

    if (process.stdin.isTTY) {
      process.stdin.setRawMode(true);
    }

    process.stdin.resume();
    process.stdin.setEncoding('utf8');

    const onData = (char) => {
      if (char === '\n' || char === '\r' || char === '\u0004') {
        if (process.stdin.isTTY) process.stdin.setRawMode(false);
        process.stdin.pause();
        process.stdin.removeListener('data', onData);
        process.stdout.write('\n');
        rl.close();
        resolve(answer);
      } else if (char === '\u0003') {
        process.exit();
      } else if (char === '\u007F') {
        answer = answer.slice(0, -1);
      } else {
        answer += char;
      }
    };

    process.stdin.on('data', onData);
  });
}

// ── Main ─────────────────────────────────────────────────────────────────────────
async function main() {
  console.log('\n  McNutt\'s Island Alliance — Setup\n');
  console.log('  ─────────────────────────────────────');

  // 1. Initialize database
  console.log('\n  [1/3] Initializing database…');

  if (!fs.existsSync(path.dirname(DB_PATH))) {
    fs.mkdirSync(path.dirname(DB_PATH), { recursive: true });
  }

  const db = new Database(DB_PATH);
  db.pragma('journal_mode = WAL');
  db.pragma('foreign_keys = ON');

  const schema = fs.readFileSync(SCHEMA_PATH, 'utf8');
  db.exec(schema);

  console.log(`  ✓ Database initialized at: ${DB_PATH}`);

  // 2. Verify poll candidates
  const candidateCount = db.prepare('SELECT COUNT(*) as count FROM poll_candidates').get().count;
  console.log(`\n  [2/3] Poll candidates: ${candidateCount} found`);
  if (candidateCount > 0) {
    const candidates = db.prepare('SELECT id, name FROM poll_candidates ORDER BY sort_order').all();
    candidates.forEach(c => console.log(`        • [${c.id}] ${c.name}`));
  }

  // 3. Admin user
  console.log('\n  [3/3] Admin user setup');

  const existingAdmin = db.prepare('SELECT username FROM admin_users').get();
  if (existingAdmin) {
    console.log(`  ✓ Admin user already exists: "${existingAdmin.username}"`);
    console.log('    (To reset the password, delete the admin_users row and re-run setup)');
  } else {
    const rl = readline.createInterface({
      input: process.stdin,
      output: process.stdout,
    });

    let username = await prompt(rl, '  Admin username [admin]: ');
    username = username.trim() || 'admin';

    rl.close();

    let password = '';
    let confirm  = '';

    while (true) {
      password = await promptHidden('  Admin password: ');
      if (password.length < 8) {
        console.log('  ✗ Password must be at least 8 characters. Try again.');
        continue;
      }
      confirm = await promptHidden('  Confirm password: ');
      if (password !== confirm) {
        console.log('  ✗ Passwords do not match. Try again.');
        continue;
      }
      break;
    }

    const hash = bcrypt.hashSync(password, 12);
    db.prepare('INSERT INTO admin_users (username, password_hash) VALUES (?, ?)').run(username, hash);
    console.log(`  ✓ Admin user created: "${username}"`);
  }

  db.close();

  console.log('\n  ─────────────────────────────────────');
  console.log('  Setup complete!\n');
  console.log('  Next steps:');
  console.log('    1. Copy .env.example to .env and fill in your settings');
  console.log('    2. Run: npm start');
  console.log('    3. Visit: http://localhost:3000');
  console.log('    4. Admin: http://localhost:3000/admin\n');
}

main().catch(err => {
  console.error('\n  Setup failed:', err.message);
  process.exit(1);
});
