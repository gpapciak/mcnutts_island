const express = require('express');
const router = express.Router();
const bcrypt = require('bcryptjs');
const { requireAdmin } = require('../middleware/auth');
const { members, board, events, poll, admin } = require('../database/db');

// ── Auth ────────────────────────────────────────────────────────────────────────

router.get('/login', (req, res) => {
  if (req.session.adminLoggedIn) return res.redirect('/admin');
  const flash = req.session.flash;
  delete req.session.flash;
  res.render('admin/login', { flash });
});

router.post('/login', async (req, res) => {
  const { username, password } = req.body;

  if (!username || !password) {
    req.session.flash = { type: 'error', message: 'Please enter your username and password.' };
    return res.redirect('/admin/login');
  }

  const user = admin.findByUsername(username.trim());
  if (!user) {
    req.session.flash = { type: 'error', message: 'Invalid username or password.' };
    return res.redirect('/admin/login');
  }

  const valid = await bcrypt.compare(password, user.password_hash);
  if (!valid) {
    req.session.flash = { type: 'error', message: 'Invalid username or password.' };
    return res.redirect('/admin/login');
  }

  req.session.adminLoggedIn = true;
  req.session.adminUsername = user.username;

  const returnTo = req.session.returnTo || '/admin';
  delete req.session.returnTo;
  res.redirect(returnTo);
});

router.get('/logout', (req, res) => {
  req.session.destroy(() => res.redirect('/admin/login'));
});

// ── All admin routes below require auth ────────────────────────────────────────
router.use(requireAdmin);

// ── Dashboard ──────────────────────────────────────────────────────────────────
router.get('/', (req, res) => {
  const pending = {
    members:   members.getPending().length,
    board:     board.countPending(),
    proposals: events.countPendingProposals(),
    comments:  poll.countPendingComments(),
  };
  const counts = {
    totalMembers: members.countApproved(),
    totalVotes:   poll.getTotalVotes(),
  };
  res.render('admin/dashboard', { pending, counts });
});

// ── Members ────────────────────────────────────────────────────────────────────
router.get('/members', (req, res) => {
  const flash = req.session.flash;
  delete req.session.flash;
  res.render('admin/members', {
    pending:    members.getPending(),
    allMembers: members.getAll(),
    flash,
  });
});

router.post('/members/:id/approve', (req, res) => {
  members.approve(parseInt(req.params.id, 10));
  req.session.flash = { type: 'success', message: 'Member approved.' };
  res.redirect('/admin/members');
});

router.post('/members/:id/reject', (req, res) => {
  members.reject(parseInt(req.params.id, 10));
  req.session.flash = { type: 'success', message: 'Member application removed.' };
  res.redirect('/admin/members');
});

// ── Board ──────────────────────────────────────────────────────────────────────
router.get('/board', (req, res) => {
  const flash = req.session.flash;
  delete req.session.flash;
  res.render('admin/board', {
    pendingPosts:   board.getPendingPosts(),
    pendingReplies: board.getPendingReplies(),
    approvedPosts:  board.getApprovedPosts(),
    flash,
  });
});

router.post('/board/posts/:id/approve', (req, res) => {
  board.approvePost(parseInt(req.params.id, 10));
  req.session.flash = { type: 'success', message: 'Post approved.' };
  res.redirect('/admin/board');
});

router.post('/board/posts/:id/reject', (req, res) => {
  board.rejectPost(parseInt(req.params.id, 10));
  req.session.flash = { type: 'success', message: 'Post removed.' };
  res.redirect('/admin/board');
});

router.post('/board/replies/:id/approve', (req, res) => {
  board.approveReply(parseInt(req.params.id, 10));
  req.session.flash = { type: 'success', message: 'Reply approved.' };
  res.redirect('/admin/board');
});

router.post('/board/replies/:id/reject', (req, res) => {
  board.rejectReply(parseInt(req.params.id, 10));
  req.session.flash = { type: 'success', message: 'Reply removed.' };
  res.redirect('/admin/board');
});

// ── Events ─────────────────────────────────────────────────────────────────────
router.get('/events', (req, res) => {
  const flash = req.session.flash;
  delete req.session.flash;
  res.render('admin/events', {
    upcoming:  events.getUpcoming(),
    past:      events.getPast(),
    proposals: events.getPendingProposals(),
    flash,
  });
});

router.post('/events', (req, res) => {
  const { title, description, event_date, location, contact_info, link } = req.body;
  if (!title || !description || !event_date) {
    req.session.flash = { type: 'error', message: 'Title, description, and date are required.' };
    return res.redirect('/admin/events');
  }
  events.create({ title, description, event_date, location: location || null, contact_info: contact_info || null, link: link || null });
  req.session.flash = { type: 'success', message: 'Event added.' };
  res.redirect('/admin/events');
});

router.post('/events/:id/delete', (req, res) => {
  events.delete(parseInt(req.params.id, 10));
  req.session.flash = { type: 'success', message: 'Event deleted.' };
  res.redirect('/admin/events');
});

router.post('/proposals/:id/approve', (req, res) => {
  events.approveProposal(parseInt(req.params.id, 10));
  req.session.flash = { type: 'success', message: 'Proposal approved and added to events.' };
  res.redirect('/admin/events');
});

router.post('/proposals/:id/reject', (req, res) => {
  events.rejectProposal(parseInt(req.params.id, 10));
  req.session.flash = { type: 'success', message: 'Proposal removed.' };
  res.redirect('/admin/events');
});

// ── Naming poll ────────────────────────────────────────────────────────────────
router.get('/naming', (req, res) => {
  const flash = req.session.flash;
  delete req.session.flash;
  res.render('admin/naming', {
    overallResults:  poll.getOverallResults(),
    themeResults:    poll.getThemeResults(),
    candidateResults: poll.getResults(),
    customCounts:    poll.getCustomSuggestionCounts(),
    candidates:      poll.getAllCandidates(),
    pendingComments: poll.getPendingComments(),
    totalVotes:      poll.getTotalVotes(),
    flash,
  });
});

router.post('/naming/candidates/:id/update', (req, res) => {
  const { name, description } = req.body;
  poll.updateCandidate(parseInt(req.params.id, 10), { name, description });
  req.session.flash = { type: 'success', message: 'Candidate updated.' };
  res.redirect('/admin/naming');
});

router.post('/naming/comments/:id/approve', (req, res) => {
  poll.approveComment(parseInt(req.params.id, 10));
  req.session.flash = { type: 'success', message: 'Comment approved.' };
  res.redirect('/admin/naming');
});

router.post('/naming/comments/:id/reject', (req, res) => {
  poll.rejectComment(parseInt(req.params.id, 10));
  req.session.flash = { type: 'success', message: 'Comment removed.' };
  res.redirect('/admin/naming');
});

router.post('/naming/reset', (req, res) => {
  poll.resetPoll(req.body.note || '', req.session.adminUsername || 'admin');
  req.session.flash = { type: 'success', message: 'All poll votes have been reset.' };
  res.redirect('/admin/naming');
});

module.exports = router;
