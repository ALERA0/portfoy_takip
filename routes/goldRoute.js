const express = require('express');
const saveGoldDataToDb = require('../scrapeSave/saveGoldDataToDb');
const Gold = require('../models/Gold');
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

router.get("/getAllGold", async (req, res) => {
  try {
    const data = await Gold.find();
    res.status(200).json({
      status: "success",
      message: "Altın verileri başarıyla getirildi",
      data,
    });
  } catch (error) {
    res.status(500).json({ status: "error", message: error.message });
  }
});

router.get("/getGoldDetail/:_id", async (req, res) => {
  try {
    const { _id } = req.params;
    const data = await Gold.findById(_id);
    res.status(200).json({
      status: "success",
      message: "Altın detayı başarıyla getirildi",
      data,
    });
  } catch (error) {
    res.status(500).json({ status: "error", message: error.message });
  }
});


module.exports = router;
