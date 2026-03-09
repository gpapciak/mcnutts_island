const express = require('express');
const router = express.Router();

router.get('/', (req, res) => {
  res.render('activities', {
    title: "Activities & Visiting — McNutt's Island Alliance",
    meta: {
      description: "Everything you need to plan a visit to McNutt's Island: hiking, kayaking, foraging, birding, how to get here, where to stay, and what to bring.",
      canonical: 'https://mcnuttsisland.org/activities',
      og: {
        url: 'https://mcnuttsisland.org/activities',
        title: "Activities & Visiting — McNutt's Island",
        description: "Hiking, kayaking, foraging, birding, and how to get to McNutt's Island. A complete visitor's guide.",
        type: 'article',
      },
    },
  });
});

module.exports = router;
