const express = require('express');
const router = express.Router();
const { board } = require('../database/db');

// ── GET /bearing-witness ────────────────────────────────────────────────────────
router.get('/', (req, res) => {
  const stories = board.getApprovedPosts('bearing-witness');
  const flash   = req.session.flash;
  delete req.session.flash;

  res.render('bearing-witness', {
    title: "Bearing Witness — McNutt's Island Alliance",
    meta: {
      description: "Stories, memories, and personal connections to McNutt's Island. Share yours and read the community's record.",
      canonical: 'https://mcnuttsisland.org/bearing-witness',
      og: {
        url: 'https://mcnuttsisland.org/bearing-witness',
        title: "Bearing Witness — McNutt's Island Alliance",
        description: "Stories and personal connections to McNutt's Island.",
        type: 'website',
      },
    },
    stories,
    flash,
  });
});

// ── POST /bearing-witness/submit ────────────────────────────────────────────────
router.post('/submit', (req, res) => {
  const { author_name, author_email, subject, body } = req.body;

  if (!author_name || !author_email || !subject || !body) {
    req.session.flash = { type: 'error', message: 'Please fill in all required fields.' };
    return res.redirect('/bearing-witness');
  }

  try {
    board.createPost({
      author_name:  author_name.trim().substring(0, 120),
      author_email: author_email.trim().toLowerCase().substring(0, 254),
      category:     'bearing-witness',
      subject:      subject.trim().substring(0, 200),
      body:         body.trim().substring(0, 3000),
      is_member:    0,
    });

    req.session.flash = {
      type: 'success',
      message: 'Your story has been submitted. It will be reviewed and added to the record shortly. Thank you.',
    };
  } catch (err) {
    console.error('Bearing witness submit error:', err);
    req.session.flash = {
      type: 'error',
      message: 'There was a problem submitting your story. Please try again.',
    };
  }

  res.redirect('/bearing-witness');
});

module.exports = router;
