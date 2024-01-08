const express = require('express');
const saveGoldDataToDb = require('../scrapeSave/saveGoldDataToDb');
const router = express.Router();


router.get('/add-gold', async (req, res) => {
  try {
    await saveGoldDataToDb();
    res.send('Gold data updated successfully');
  } catch (error) {
    console.error(error);
    res.status(500).send('Error updating gold data');
  }
});




module.exports = router;
