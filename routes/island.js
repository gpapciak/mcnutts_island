const express = require('express');
const router = express.Router();

router.get('/', (req, res) => {
  res.render('island', {
    title: "The Island — McNutt's Island Alliance",
    meta: {
      description: "The full story of McNutt's Island: Mi'kmaq homeland, Black Loyalist history, lighthouse, WWII gun battery, lobster fishery, and the community that has called this place home.",
      canonical: 'https://mcnuttsisland.org/island',
      og: {
        url: 'https://mcnuttsisland.org/island',
        title: "The Island — McNutt's Island",
        description: "The full story of McNutt's Island: Mi'kmaq homeland, Black Loyalist history, lighthouse, WWII gun battery, and more.",
        type: 'article',
      },
    },
  });
});

module.exports = router;
