const express = require('express');
const router = express.Router();
const { v4: uuidv4 } = require('uuid');
const { members } = require('../database/db');
const { sendMemberConfirmation } = require('../services/email');

// ── GET /community ──────────────────────────────────────────────────────────────
router.get('/', (req, res) => {
  const publicMembers = members.getPublicApproved();
  const flash = req.session.flash;
  delete req.session.flash;

  res.render('community', {
    title: "Community — McNutt's Island Alliance",
    meta: {
      description: "Join the McNutt's Island Alliance. Add your name to the member directory and connect with the community.",
      canonical: 'https://mcnuttsisland.org/community',
      og: {
        url: 'https://mcnuttsisland.org/community',
        title: "Community — McNutt's Island Alliance",
        description: "Join the McNutt's Island Alliance community.",
        type: 'website',
      },
    },
    members: publicMembers,
    flash,
  });
});

// ── POST /community/join ────────────────────────────────────────────────────────
router.post('/join', async (req, res) => {
  const { name, email, connection_type, note, public_listing } = req.body;

  // Basic validation
  if (!name || !email || !connection_type) {
    req.session.flash = { type: 'error', message: 'Please fill in all required fields.' };
    return res.redirect('/community');
  }

  // Check for existing member
  const existing = members.findByEmail(email.trim().toLowerCase());
  if (existing) {
    req.session.flash = {
      type: 'info',
      message: 'That email address is already registered. Check your inbox for a confirmation email, or contact us if you need help.',
    };
    return res.redirect('/community');
  }

  const token = uuidv4();

  try {
    members.create({
      name: name.trim().substring(0, 120),
      email: email.trim().toLowerCase().substring(0, 254),
      connection_type: connection_type.substring(0, 80),
      note: note ? note.trim().substring(0, 500) : null,
      public_listing: public_listing === '1' ? 1 : 0,
      confirmation_token: token,
    });

    await sendMemberConfirmation({ name: name.trim(), email: email.trim() }, token);

    req.session.flash = {
      type: 'success',
      message: `Thank you, ${name.trim()}! A confirmation email has been sent to ${email.trim()}. Please check your inbox to complete your registration.`,
    };
  } catch (err) {
    console.error('Community join error:', err);
    req.session.flash = {
      type: 'error',
      message: 'There was a problem processing your registration. Please try again.',
    };
  }

  res.redirect('/community');
});

// ── GET /community/confirm/:token ───────────────────────────────────────────────
router.get('/confirm/:token', (req, res) => {
  const { token } = req.params;
  const member = members.findByToken(token);

  if (!member) {
    req.session.flash = {
      type: 'error',
      message: 'That confirmation link is invalid or has already been used.',
    };
    return res.redirect('/community');
  }

  members.confirm(member.id);

  req.session.flash = {
    type: 'success',
    message: `Your email has been confirmed, ${member.name}. Your listing will be reviewed and added to the directory shortly. Welcome to the Alliance!`,
  };

  res.redirect('/community');
});

module.exports = router;
