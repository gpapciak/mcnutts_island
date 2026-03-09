const Database = require('better-sqlite3');
const fs = require('fs');
const path = require('path');
const bcrypt = require('bcryptjs');

const DB_PATH = process.env.DB_PATH || path.join(__dirname, 'mcnutts.db');

let db;

function getDb() {
  if (!db) {
    db = new Database(DB_PATH);
    db.pragma('journal_mode = WAL');
    db.pragma('foreign_keys = ON');
  }
  return db;
}

function initDatabase() {
  const database = getDb();
  const schema = fs.readFileSync(path.join(__dirname, 'schema.sql'), 'utf8');
  database.exec(schema);

  // ── Migrate poll_votes to multi-step schema if needed ──────────────────────
  const cols = database.prepare('PRAGMA table_info(poll_votes)').all().map(c => c.name);
  if (!cols.includes('wants_change')) {
    const voteCount = database.prepare('SELECT COUNT(*) as c FROM poll_votes').get().c;
    if (voteCount === 0) {
      database.exec('DROP TABLE IF EXISTS poll_votes');
      // Re-exec only the poll_votes CREATE TABLE from schema (already loaded above via exec)
      database.exec(`CREATE TABLE IF NOT EXISTS poll_votes (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        wants_change INTEGER DEFAULT 0,
        theme TEXT,
        candidate_id INTEGER,
        custom_suggestion TEXT,
        ip_address TEXT NOT NULL,
        email TEXT,
        email_verified INTEGER DEFAULT 0,
        verification_token TEXT,
        comment TEXT,
        comment_approved INTEGER DEFAULT 0,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP
      )`);
      console.log('  poll_votes table recreated with new schema.');
    } else {
      database.exec('ALTER TABLE poll_votes ADD COLUMN wants_change INTEGER DEFAULT 0');
      database.exec('ALTER TABLE poll_votes ADD COLUMN theme TEXT');
      database.exec('ALTER TABLE poll_votes ADD COLUMN custom_suggestion TEXT');
      console.log('  poll_votes migrated: added wants_change, theme, custom_suggestion columns.');
    }
  }

  // Seed admin user from env if not exists
  const adminUser = database.prepare('SELECT id FROM admin_users WHERE username = ?')
    .get(process.env.ADMIN_USERNAME || 'admin');

  if (!adminUser && process.env.ADMIN_PASSWORD) {
    const hash = bcrypt.hashSync(process.env.ADMIN_PASSWORD, 12);
    database.prepare('INSERT INTO admin_users (username, password_hash) VALUES (?, ?)')
      .run(process.env.ADMIN_USERNAME || 'admin', hash);
    console.log('  Admin user created from environment variables.');
  }

  console.log('  Database initialized at', DB_PATH);
}

// ── Members ────────────────────────────────────────────────────────────────────
const members = {
  create(data) {
    return getDb().prepare(`
      INSERT INTO members (name, email, connection_type, note, public_listing, confirmation_token)
      VALUES (@name, @email, @connection_type, @note, @public_listing, @confirmation_token)
    `).run(data);
  },
  findByToken(token) {
    return getDb().prepare('SELECT * FROM members WHERE confirmation_token = ?').get(token);
  },
  findByEmail(email) {
    return getDb().prepare('SELECT * FROM members WHERE email = ?').get(email);
  },
  confirm(id) {
    return getDb().prepare('UPDATE members SET confirmed = 1, confirmation_token = NULL WHERE id = ?').run(id);
  },
  approve(id) {
    return getDb().prepare('UPDATE members SET approved = 1 WHERE id = ?').run(id);
  },
  reject(id) {
    return getDb().prepare('DELETE FROM members WHERE id = ?').run(id);
  },
  getPublicApproved() {
    return getDb().prepare(`
      SELECT name, connection_type, note, created_at FROM members
      WHERE approved = 1 AND confirmed = 1 AND public_listing = 1
      ORDER BY created_at ASC
    `).all();
  },
  getPending() {
    return getDb().prepare('SELECT * FROM members WHERE approved = 0 ORDER BY created_at ASC').all();
  },
  getAll() {
    return getDb().prepare('SELECT id, name, email, connection_type, note, public_listing, approved, confirmed, created_at FROM members ORDER BY created_at DESC').all();
  },
  countApproved() {
    return getDb().prepare('SELECT COUNT(*) as count FROM members WHERE approved = 1 AND confirmed = 1').get().count;
  },
};

// ── Board Posts ────────────────────────────────────────────────────────────────
const board = {
  createPost(data) {
    return getDb().prepare(`
      INSERT INTO board_posts (author_name, author_email, category, subject, body, is_member)
      VALUES (@author_name, @author_email, @category, @subject, @body, @is_member)
    `).run(data);
  },
  createReply(data) {
    return getDb().prepare(`
      INSERT INTO board_replies (post_id, author_name, author_email, body, is_member)
      VALUES (@post_id, @author_name, @author_email, @body, @is_member)
    `).run(data);
  },
  getApprovedPosts(category = null) {
    if (category) {
      return getDb().prepare(`
        SELECT p.*, (SELECT COUNT(*) FROM board_replies r WHERE r.post_id = p.id AND r.approved = 1) as reply_count
        FROM board_posts p WHERE p.approved = 1 AND p.category = ?
        ORDER BY p.created_at DESC
      `).all(category);
    }
    return getDb().prepare(`
      SELECT p.*, (SELECT COUNT(*) FROM board_replies r WHERE r.post_id = p.id AND r.approved = 1) as reply_count
      FROM board_posts p WHERE p.approved = 1
      ORDER BY p.created_at DESC
    `).all();
  },
  getPost(id) {
    return getDb().prepare('SELECT * FROM board_posts WHERE id = ? AND approved = 1').get(id);
  },
  getReplies(postId) {
    return getDb().prepare('SELECT * FROM board_replies WHERE post_id = ? AND approved = 1 ORDER BY created_at ASC').all(postId);
  },
  getPendingPosts() {
    return getDb().prepare('SELECT * FROM board_posts WHERE approved = 0 ORDER BY created_at ASC').all();
  },
  getPendingReplies() {
    return getDb().prepare(`
      SELECT r.*, p.subject as post_subject FROM board_replies r
      JOIN board_posts p ON p.id = r.post_id
      WHERE r.approved = 0 ORDER BY r.created_at ASC
    `).all();
  },
  approvePost(id) {
    return getDb().prepare('UPDATE board_posts SET approved = 1 WHERE id = ?').run(id);
  },
  rejectPost(id) {
    return getDb().prepare('DELETE FROM board_posts WHERE id = ?').run(id);
  },
  approveReply(id) {
    return getDb().prepare('UPDATE board_replies SET approved = 1 WHERE id = ?').run(id);
  },
  rejectReply(id) {
    return getDb().prepare('DELETE FROM board_replies WHERE id = ?').run(id);
  },
  countPending() {
    const posts = getDb().prepare('SELECT COUNT(*) as count FROM board_posts WHERE approved = 0').get().count;
    const replies = getDb().prepare('SELECT COUNT(*) as count FROM board_replies WHERE approved = 0').get().count;
    return posts + replies;
  },
};

// ── Events ─────────────────────────────────────────────────────────────────────
const events = {
  create(data) {
    return getDb().prepare(`
      INSERT INTO events (title, description, event_date, location, contact_info, link)
      VALUES (@title, @description, @event_date, @location, @contact_info, @link)
    `).run(data);
  },
  getUpcoming() {
    return getDb().prepare(`
      SELECT * FROM events WHERE event_date >= date('now') ORDER BY event_date ASC
    `).all();
  },
  getPast() {
    return getDb().prepare(`
      SELECT * FROM events WHERE event_date < date('now') ORDER BY event_date DESC LIMIT 5
    `).all();
  },
  getAll() {
    return getDb().prepare('SELECT * FROM events ORDER BY event_date DESC').all();
  },
  update(id, data) {
    return getDb().prepare(`
      UPDATE events SET title=@title, description=@description, event_date=@event_date,
      location=@location, contact_info=@contact_info, link=@link WHERE id=@id
    `).run({ ...data, id });
  },
  delete(id) {
    return getDb().prepare('DELETE FROM events WHERE id = ?').run(id);
  },
  proposeEvent(data) {
    return getDb().prepare(`
      INSERT INTO event_proposals (proposer_name, proposer_email, title, description, proposed_date)
      VALUES (@proposer_name, @proposer_email, @title, @description, @proposed_date)
    `).run(data);
  },
  getPendingProposals() {
    return getDb().prepare('SELECT * FROM event_proposals WHERE approved = 0 ORDER BY created_at ASC').all();
  },
  approveProposal(id) {
    const proposal = getDb().prepare('SELECT * FROM event_proposals WHERE id = ?').get(id);
    if (!proposal) return null;
    const result = getDb().prepare(`
      INSERT INTO events (title, description, event_date, contact_info)
      VALUES (?, ?, ?, ?)
    `).run(proposal.title, proposal.description, proposal.proposed_date || 'TBD', proposal.proposer_email);
    getDb().prepare('UPDATE event_proposals SET approved = 1 WHERE id = ?').run(id);
    return result;
  },
  rejectProposal(id) {
    return getDb().prepare('DELETE FROM event_proposals WHERE id = ?').run(id);
  },
  countPendingProposals() {
    return getDb().prepare('SELECT COUNT(*) as count FROM event_proposals WHERE approved = 0').get().count;
  },
};

// ── Naming Poll ────────────────────────────────────────────────────────────────
const poll = {
  getCandidates() {
    return getDb().prepare('SELECT * FROM poll_candidates WHERE active = 1 ORDER BY sort_order ASC').all();
  },
  getAllCandidates() {
    return getDb().prepare('SELECT * FROM poll_candidates ORDER BY sort_order ASC').all();
  },
  getAllCandidatesGrouped() {
    const rows = getDb().prepare('SELECT * FROM poll_candidates WHERE active = 1 ORDER BY sort_order ASC').all();
    const grouped = { mikmaq: [], 'black-loyalist': [], geographic: [], ecological: [] };
    for (const row of rows) {
      if (grouped[row.category]) grouped[row.category].push(row);
    }
    return grouped;
  },
  hasVotedByIp(ip) {
    return getDb().prepare('SELECT id FROM poll_votes WHERE ip_address = ?').get(ip);
  },
  submitVote(data) {
    return getDb().prepare(`
      INSERT INTO poll_votes
        (wants_change, theme, candidate_id, custom_suggestion, ip_address, email, comment, verification_token)
      VALUES
        (@wants_change, @theme, @candidate_id, @custom_suggestion, @ip_address, @email, @comment, @verification_token)
    `).run(data);
  },
  verifyEmail(token) {
    const vote = getDb().prepare('SELECT * FROM poll_votes WHERE verification_token = ?').get(token);
    if (!vote) return null;
    getDb().prepare('UPDATE poll_votes SET email_verified = 1, verification_token = NULL WHERE id = ?').run(vote.id);
    return vote;
  },
  getOverallResults() {
    const total = getDb().prepare('SELECT COUNT(*) as c FROM poll_votes').get().c;
    const wantChange = getDb().prepare('SELECT COUNT(*) as c FROM poll_votes WHERE wants_change = 1').get().c;
    return { total, wantChange, keepName: total - wantChange };
  },
  getThemeResults() {
    return getDb().prepare(`
      SELECT theme, COUNT(*) as count
      FROM poll_votes
      WHERE wants_change = 1 AND theme IS NOT NULL
      GROUP BY theme
      ORDER BY count DESC
    `).all();
  },
  getResults() {
    return getDb().prepare(`
      SELECT c.id, c.name, c.category,
        COUNT(v.id) as total_votes,
        SUM(CASE WHEN v.email_verified = 1 THEN 1 ELSE 0 END) as verified_votes
      FROM poll_candidates c
      LEFT JOIN poll_votes v ON v.candidate_id = c.id AND v.wants_change = 1
      WHERE c.active = 1
      GROUP BY c.id
      ORDER BY c.sort_order ASC
    `).all();
  },
  getCustomSuggestionCounts() {
    return getDb().prepare(`
      SELECT theme, COUNT(*) as count
      FROM poll_votes
      WHERE custom_suggestion IS NOT NULL AND custom_suggestion != ''
      GROUP BY theme
      ORDER BY count DESC
    `).all();
  },
  getTotalVotes() {
    return getDb().prepare('SELECT COUNT(*) as count FROM poll_votes').get().count;
  },
  getPendingComments() {
    return getDb().prepare(`
      SELECT v.*,
        COALESCE(c.name, v.custom_suggestion, 'No-change vote') as candidate_name
      FROM poll_votes v
      LEFT JOIN poll_candidates c ON c.id = v.candidate_id
      WHERE v.comment IS NOT NULL AND v.comment != '' AND v.comment_approved = 0
      ORDER BY v.created_at ASC
    `).all();
  },
  getApprovedComments() {
    return getDb().prepare(`
      SELECT v.comment, v.created_at,
        COALESCE(c.name, v.custom_suggestion, 'No-change vote') as candidate_name
      FROM poll_votes v
      LEFT JOIN poll_candidates c ON c.id = v.candidate_id
      WHERE v.comment IS NOT NULL AND v.comment != '' AND v.comment_approved = 1
      ORDER BY v.created_at DESC LIMIT 50
    `).all();
  },
  approveComment(id) {
    return getDb().prepare('UPDATE poll_votes SET comment_approved = 1 WHERE id = ?').run(id);
  },
  rejectComment(id) {
    return getDb().prepare('UPDATE poll_votes SET comment = NULL, comment_approved = 0 WHERE id = ?').run(id);
  },
  updateCandidate(id, data) {
    return getDb().prepare('UPDATE poll_candidates SET name = @name, description = @description WHERE id = @id').run({ ...data, id });
  },
  resetPoll(note, resetBy) {
    getDb().prepare('DELETE FROM poll_votes').run();
    getDb().prepare('INSERT INTO poll_resets (reset_by, note) VALUES (?, ?)').run(resetBy, note);
  },
  exportResults() {
    return getDb().prepare(`
      SELECT v.id, v.wants_change, v.theme,
        COALESCE(c.name, v.custom_suggestion, 'keep') as candidate,
        v.ip_address, v.email, v.email_verified,
        v.comment, v.comment_approved, v.created_at
      FROM poll_votes v
      LEFT JOIN poll_candidates c ON c.id = v.candidate_id
      ORDER BY v.created_at ASC
    `).all();
  },
  countPendingComments() {
    return getDb().prepare('SELECT COUNT(*) as count FROM poll_votes WHERE comment IS NOT NULL AND comment != \'\' AND comment_approved = 0').get().count;
  },
};

// ── Admin ──────────────────────────────────────────────────────────────────────
const admin = {
  findByUsername(username) {
    return getDb().prepare('SELECT * FROM admin_users WHERE username = ?').get(username);
  },
  updatePassword(id, hash) {
    return getDb().prepare('UPDATE admin_users SET password_hash = ? WHERE id = ?').run(hash, id);
  },
};

module.exports = { initDatabase, getDb, members, board, events, poll, admin };
