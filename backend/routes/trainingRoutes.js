const express = require("express");
const router = express.Router();

const Training = require("../models/Training");

//
// GET - récupérer toutes les séances
//
router.get("/", async (req, res) => {
  try {
    const trainings = await Training.find().sort({ createdAt: -1 });
    res.json(trainings);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

//
// POST - ajouter une séance
//
router.post("/", async (req, res) => {
  try {
    const training = new Training(req.body);
    const saved = await training.save();
    res.status(201).json(saved);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
});

module.exports = router;