const express = require('express');
const router = express.Router();
const { v4: uuidv4 } = require('uuid');
const { poll } = require('../database/db');
const { sendVoterVerification } = require('../services/email');

// ── GET /naming ─────────────────────────────────────────────────────────────────
router.get('/', (req, res) => {
  const candidatesByTheme = poll.getAllCandidatesGrouped();
  const overallResults    = poll.getOverallResults();
  const themeResults      = poll.getThemeResults();
  const candidateResults  = poll.getResults();
  const customCounts      = poll.getCustomSuggestionCounts();
  const totalVotes        = poll.getTotalVotes();
  const hasVoted          = !!poll.hasVotedByIp(req.ip);
  const flash             = req.session.flash;
  const autoOpenResults   = !!(flash && flash.type === 'success');
  delete req.session.flash;

  res.render('naming', {
    title: "The Naming — McNutt's Island Alliance",
    meta: {
      description: "The community conversation about McNutt's Island's name. Cast your voice, read the history, and see current results.",
      canonical: 'https://mcnuttsisland.org/naming',
      og: {
        url: 'https://mcnuttsisland.org/naming',
        title: "The Naming — McNutt's Island Alliance",
        description: "The community conversation about what this island should be called.",
        type: 'website',
      },
    },
    candidatesByTheme,
    overallResults,
    themeResults,
    candidateResults,
    customCounts,
    totalVotes,
    hasVoted,
    autoOpenResults,
    flash,
  });
});

// ── POST /naming/vote ───────────────────────────────────────────────────────────
router.post('/vote', async (req, res) => {
  const { wants_change, theme, candidate_id, custom_suggestion, email, comment } = req.body;

  // wants_change is required
  if (wants_change !== '0' && wants_change !== '1') {
    req.session.flash = { type: 'error', message: 'Please answer the renaming question before submitting.' };
    return res.redirect('/naming');
  }

  // If yes, need theme and (candidate_id or custom_suggestion)
  if (wants_change === '1') {
    const validThemes = ['mikmaq', 'black-loyalist', 'geographic', 'ecological'];
    if (!theme || !validThemes.includes(theme)) {
      req.session.flash = { type: 'error', message: 'Please select a theme to guide the new name.' };
      return res.redirect('/naming');
    }
    const hasCandidateChoice = candidate_id && candidate_id.trim();
    const hasCustom = custom_suggestion && custom_suggestion.trim();
    if (!hasCandidateChoice && !hasCustom) {
      req.session.flash = { type: 'error', message: 'Please choose a name or enter your own suggestion.' };
      return res.redirect('/naming');
    }
  }

  // Check if already voted from this IP
  if (poll.hasVotedByIp(req.ip)) {
    req.session.flash = {
      type: 'info',
      message: 'A response has already been recorded from this device. Thank you for participating.',
    };
    return res.redirect('/naming');
  }

  const wantsChange = parseInt(wants_change, 10);
  const candidateIdVal = (wants_change === '1' && candidate_id && candidate_id.trim() && candidate_id !== 'custom')
    ? parseInt(candidate_id, 10)
    : null;
  const customVal = (wants_change === '1' && custom_suggestion && custom_suggestion.trim())
    ? custom_suggestion.trim().substring(0, 300)
    : null;
  const themeVal = wants_change === '1' ? theme : null;

  const cleanEmail = email && email.trim() ? email.trim().toLowerCase().substring(0, 254) : null;
  const verificationToken = cleanEmail ? uuidv4() : null;

  try {
    poll.submitVote({
      wants_change: wantsChange,
      theme: themeVal,
      candidate_id: candidateIdVal,
      custom_suggestion: customVal,
      ip_address: req.ip,
      email: cleanEmail,
      comment: comment ? comment.trim().substring(0, 400) : null,
      verification_token: verificationToken,
    });

    if (verificationToken && cleanEmail) {
      await sendVoterVerification(cleanEmail, verificationToken);
      req.session.flash = {
        type: 'success',
        message: 'Your response has been recorded. A verification email has been sent — click the link to receive Verified Voter status.',
      };
    } else {
      req.session.flash = {
        type: 'success',
        message: 'Your response has been recorded. Thank you for participating in this conversation.',
      };
    }
  } catch (err) {
    console.error('Vote submission error:', err);
    req.session.flash = {
      type: 'error',
      message: 'There was a problem recording your response. Please try again.',
    };
  }

  res.redirect('/naming');
});

// ── GET /naming/verify/:token ───────────────────────────────────────────────────
router.get('/verify/:token', (req, res) => {
  const { token } = req.params;
  const vote = poll.verifyEmail(token);

  if (!vote) {
    req.session.flash = {
      type: 'error',
      message: 'That verification link is invalid or has already been used.',
    };
    return res.redirect('/naming');
  }

  req.session.flash = {
    type: 'success',
    message: 'Your vote has been verified. Thank you — your response now carries Verified Voter status.',
  };

  res.redirect('/naming');
});

module.exports = router;
