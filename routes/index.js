const express = require('express');
const router = express.Router();
const { events, board, members } = require('../database/db');

router.get('/', (req, res) => {
  const upcomingEvents = events.getUpcoming().slice(0, 3);
  const recentPosts = board.getApprovedPosts().slice(0, 3);
  const memberCount = members.countApproved();

  res.render('index', {
    title: "McNutt's Island — South Shore Nova Scotia",
    meta: {
      description: "The community hub for McNutt's Island, Nova Scotia — history, nature, activities, the McNutt's Island Alliance, and the conversation about this island's future.",
      canonical: 'https://mcnuttsisland.org/',
      og: {
        url: 'https://mcnuttsisland.org/',
        title: "McNutt's Island — South Shore Nova Scotia",
        description: "The community hub for McNutt's Island, Nova Scotia — history, nature, activities, the McNutt's Island Alliance, and the conversation about this island's future.",
        type: 'website',
      },
    },
    upcomingEvents,
    recentPosts,
    memberCount,
  });
});

module.exports = router;
