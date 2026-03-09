const express = require('express');
const router = express.Router();

router.get('/', (req, res) => {
  res.render('flora', {
    title: "Flora & Fauna — McNutt's Island Alliance",
    meta: {
      description: "The natural world of McNutt's Island: Acadian forest, wild berries, bog ecosystems, bald eagles, seals, intertidal life, and the threats climate change and invasive species pose to it all.",
      canonical: 'https://mcnuttsisland.org/flora-fauna',
      og: {
        url: 'https://mcnuttsisland.org/flora-fauna',
        title: "Flora & Fauna — McNutt's Island",
        description: "The natural world of McNutt's Island — Acadian forest, wild berries, bogs, bald eagles, seals, and the threats facing them.",
        type: 'article',
      },
    },
  });
});

module.exports = router;
