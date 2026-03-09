const express = require('express');
const router = express.Router();

router.get('/', (req, res) => {
  res.render('about', {
    title: "About — McNutt's Island Alliance",
    meta: {
      description: "The McNutt's Island Alliance: who we are, our mission, and how to connect with the community.",
      canonical: 'https://mcnuttsisland.org/about',
      og: {
        url: 'https://mcnuttsisland.org/about',
        title: "About — McNutt's Island Alliance",
        description: "The McNutt's Island Alliance: mission, membership, and contact.",
        type: 'website',
      },
    },
  });
});

module.exports = router;
