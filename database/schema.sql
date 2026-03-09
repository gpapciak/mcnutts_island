-- McNutt's Island Alliance — Database Schema

-- ── Alliance Member Directory ──────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS members (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  name TEXT NOT NULL,
  email TEXT NOT NULL UNIQUE,
  connection_type TEXT NOT NULL,
  note TEXT,
  public_listing INTEGER DEFAULT 0,
  approved INTEGER DEFAULT 0,
  confirmed INTEGER DEFAULT 0,
  confirmation_token TEXT,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- ── Message Board Posts ────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS board_posts (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  author_name TEXT NOT NULL,
  author_email TEXT NOT NULL,
  category TEXT NOT NULL,
  subject TEXT NOT NULL,
  body TEXT NOT NULL,
  is_member INTEGER DEFAULT 0,
  approved INTEGER DEFAULT 0,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- ── Message Board Replies ──────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS board_replies (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  post_id INTEGER NOT NULL,
  author_name TEXT NOT NULL,
  author_email TEXT NOT NULL,
  body TEXT NOT NULL,
  is_member INTEGER DEFAULT 0,
  approved INTEGER DEFAULT 0,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (post_id) REFERENCES board_posts(id) ON DELETE CASCADE
);

-- ── Events ─────────────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS events (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  title TEXT NOT NULL,
  description TEXT NOT NULL,
  event_date TEXT NOT NULL,
  location TEXT,
  contact_info TEXT,
  link TEXT,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- ── Event Proposals ────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS event_proposals (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  proposer_name TEXT NOT NULL,
  proposer_email TEXT NOT NULL,
  title TEXT NOT NULL,
  description TEXT NOT NULL,
  proposed_date TEXT,
  approved INTEGER DEFAULT 0,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- ── Naming Poll Candidates ─────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS poll_candidates (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  name TEXT NOT NULL,
  description TEXT NOT NULL,
  category TEXT,
  sort_order INTEGER DEFAULT 0,
  active INTEGER DEFAULT 1
);

-- ── Naming Poll Votes ──────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS poll_votes (
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
);

-- ── Poll Resets Log ────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS poll_resets (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  reset_by TEXT,
  note TEXT,
  reset_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- ── Admin Users ────────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS admin_users (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  username TEXT NOT NULL UNIQUE,
  password_hash TEXT NOT NULL,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- ── Default Poll Candidates ────────────────────────────────────────────────────
INSERT OR REPLACE INTO poll_candidates (id, name, description, category, sort_order, active) VALUES
(1,
 '[Mi''kmaq Name — Research Ongoing]',
 'A name drawn from the Mi''kmaq language, reflecting ten thousand years of presence on this land before European contact. The specific historical Mi''kmaq name for this island is the subject of ongoing research. Any adoption should be pursued in genuine partnership with the Sipekne''katik First Nation and Mi''kmaq community.',
 'mikmaq', 1, 1),
(2,
 '[Alternative Mi''kmaq Name Option]',
 'A second Mi''kmaq language option under research. Mi''kmaq place names were not recorded uniformly by European settlers, and multiple historically-grounded forms may exist. Community and linguistic consultation would determine the most appropriate choice.',
 'mikmaq', 2, 1),
(3,
 '[Black Loyalist Acknowledgment Name]',
 'A name honoring the Black Loyalist settlers who arrived in 1783 with promises of land and freedom — one of the most significant and underrecognized chapters in this island''s history. The connection to nearby Birchtown, once the largest free Black settlement in North American history, runs deep.',
 'black-loyalist', 3, 1),
(4,
 'Birchtown Heritage Island',
 'A name that directly honours the Birchtown settlement and its Black Loyalist founders, linking the island explicitly to the largest free Black community in 18th-century North America.',
 'black-loyalist', 4, 1),
(5,
 'Harbour Mouth Island',
 'A plain descriptive name rooted in the island''s geography — it sits at the mouth of Shelburne Harbour, a defining physical fact that has shaped its history as a navigation landmark and fishing ground.',
 'geographic', 5, 1),
(6,
 'Shelburne Head',
 'A name tying the island to the broader Shelburne County context, emphasizing its role as the outermost point of the harbour approach and its long association with the town across the water.',
 'geographic', 6, 1),
(7,
 'Eagle Point Island',
 'Named for the bald eagles that nest on the island, a name rooted in lived ecological presence rather than colonial history.',
 'ecological', 7, 1),
(8,
 'Bog Coast Island',
 'A name drawn from the island''s distinctive landscape — the sphagnum bogs, coastal barrens, and Atlantic shoreline that define its natural character and set it apart from the mainland.',
 'ecological', 8, 1);
