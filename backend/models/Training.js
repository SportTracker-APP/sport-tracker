const mongoose = require("mongoose");

const trainingSchema = new mongoose.Schema(
  {
    sport: { type: String, required: true },
    duration: { type: Number, required: true }, // minutes
    distance: Number,
    elevation: Number,
    feeling: { type: Number, min: 1, max: 10 },
    notes: String
  },
  { timestamps: true }
);

module.exports = mongoose.model("Training", trainingSchema);