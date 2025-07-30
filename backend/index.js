const express = require("express");
const mongoose = require("mongoose");
const cors = require("cors");
const multer = require("multer");
const path = require("path");
const fs = require("fs");
require("dotenv").config();
const cloudinary = require("./cloudinary");
const { SpeechToText } = require("./models/speechToText.models");

const app = express();

app.use(cors());
app.use(express.json());

mongoose
  .connect(process.env.MONGO_URL)
  .then(() => console.log("Connected to MongoDB"))
  .catch((e) => console.log(e));

// Multer setup
const upload = multer({ dest: "temp/" });

// Upload route
app.post("/uploadFile", upload.single("file"), async (req, res) => {
  try {
    const filePath = path.resolve(req.file.path);

    const result = await cloudinary.uploader.upload(filePath, {
      resource_type: "auto",
      folder: "uploads",
    });

    fs.unlinkSync(filePath); // remove temp file

    res.status(201).json({ message: "Uploaded", url: result.secure_url });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Upload failed" });
  }
});

// Save transcript + audio
app.post("/", async (req, res) => {
  try {
    const { text, audioUrl } = req.body;
    const result = await SpeechToText.create({ text, audioUrl });
    res.status(201).json(result);
  } catch (e) {
    console.log(e);
    res.status(500).json({ message: "Error saving data", error: e.message });
  }
});

// Get all data
app.get("/data", async (req, res) => {
  try {
    const data = await SpeechToText.find();
    res.status(200).json(data);
  } catch (e) {
    res.status(500).json({ message: "Error fetching data", error: e.message });
  }
});

// Delete
app.delete("/delete/:id", async (req, res) => {
  try {
    const result = await SpeechToText.deleteOne({ _id: req.params.id });
    if (result.deletedCount > 0) {
      res.status(200).json({ message: "Deleted successfully" });
    } else {
      res.status(404).json({ message: "Not found" });
    }
  } catch (e) {
    res.status(500).json({ message: "Delete failed", error: e.message });
  }
});

app.listen(3000, () => console.log("Server running on port 3000"));
