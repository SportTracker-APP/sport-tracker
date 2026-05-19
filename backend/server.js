require("dotenv").config();

const express = require("express");
const mongoose = require("mongoose");
const cors = require("cors");
const trainingRoutes = require("./routes/trainingRoutes");
const app = express();

// Middleware (outils qui traitent les requêtes)
app.use(cors());
app.use(express.json());
app.use("/api/trainings", trainingRoutes);

// Connexion MongoDB
mongoose
  .connect(process.env.MONGO_URI)
  .then(() => {
    console.log("MongoDB connecté");

    // Lancement du serveur
    app.listen(process.env.PORT, () => {
      console.log(`Serveur lancé sur le port ${process.env.PORT}`);
    });
  })
  .catch((err) => {
    console.log("Erreur MongoDB :", err);
  });