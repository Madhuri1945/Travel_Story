const bcrypt = require("bcrypt");
require("dotenv").config();
const config = require("./config.json");
const mongoose = require("mongoose");
const express = require("express");
const cors = require("cors");
const jwt = require("jsonwebtoken");
const User = require("./models/user.model");
const TravelStory = require("./models/travelStory.model");
const { authenticateToken } = require("./utilities");
const upload = require("./multer");
const fs = require("fs");
const path = require("path");

mongoose.connect(config.connectionString, {
  useNewUrlParser: true,
  useUnifiedTopology: true,
  tls: true,
  tlsAllowInvalidCertificates: false,
});

const app = express();
app.use(cors());
app.use(express.json());
app.post("/create-account", async (req, res) => {
  const { fullName, email, password } = req.body;
  if (!fullName || !email || !password) {
    return res
      .status(400)
      .json({ error: true, message: "All fields are required" });
  }
  const isUser = await User.findOne({ email });
  if (isUser) {
    return res
      .status(400)
      .json({ error: true, message: "user already exists" });
  }
  const hashedPassword = await bcrypt.hash(password, 10);
  const user = new User({
    fullName,
    email,
    password: hashedPassword,
  });
  await user.save();
  const accessToken = jwt.sign(
    {
      userId: user._id,
    },
    process.env.ACCESS_TOKEN_SECRET,
    {
      expiresIn: "72h",
    }
  );
  return res.status(201).json({
    error: false,
    user: { fullName: user.fullName, email: user.email },
    accessToken,
    message: "Registration Successful",
  });
});

app.post("/login", async (req, res) => {
  const { email, password } = req.body;
  if (!email || !password) {
    return res.status(400).json({ message: "email and password are required" });
  }
  const user = await User.findOne({ email });
  if (!user) {
    return res.status(400).json({ message: "user not found" });
  }
  const isPasswordValid = await bcrypt.compare(password, user.password);
  if (!isPasswordValid) {
    return res.status(400).json({ message: "password incorrect" });
  }
  const accessToken = jwt.sign(
    {
      userId: user._id,
    },
    process.env.ACCESS_TOKEN_SECRET,
    {
      expiresIn: "72h",
    }
  );
  return res.status(200).json({
    message: "login successful",
    Token: accessToken,
  });
});
app.get("/get-user", authenticateToken, async (req, res) => {
  const { userId } = req.user;
  const isUser = await User.findById({ _id: userId });
  if (!isUser) {
    return res.status(400).json({ message: "user not found" });
  }
  return res.status(200).json({ user: isUser });
});
app.post("/add-travel-story", authenticateToken, async (req, res) => {
  const { title, story, visitedLocation, imageUrl, visitedDate } = req.body;
  const { userId } = req.user;
  if (!title || !story || !visitedLocation || !imageUrl || !visitedDate) {
    res.status(400).json({ message: "All fields are required" });
  }
  const parsedVisitedDate = new Date(parseInt(visitedDate));
  try {
    const newStory = new TravelStory({
      title,
      story,
      visitedLocation,
      userId,
      imageUrl,
      visitedDate: parsedVisitedDate,
    });
    await newStory.save();
    res.status(200).json({
      newStory: newStory,
      message: "added successfully",
    });
  } catch (err) {
    res.status(400).json({ error: true, message: err.message });
  }
});
app.get("/get-all-stories", authenticateToken, async (req, res) => {
  const { userId } = req.user;
  try {
    const travelStories = await TravelStory.find({ userId: userId }).sort({
      isFavourite: -1,
    });
    res.status(200).json({ error: false, stories: travelStories });
  } catch (err) {
    res.status(400).json({ error: true, message: err.message });
  }
});
app.post("/image-upload", upload.single("image"), async (req, res) => {
  try {
    if (!req.file) {
      return res
        .status(400)
        .json({ error: true, message: "No image uploaded" });
    }
    const imageUrl = `http://localhost:3000/uploads/${req.file.filename}`;
    res.status(201).json({ imageUrl });
  } catch (err) {
    res.status(400).json({ error: true, err });
  }
});
app.delete("/delete-img", async (req, res) => {
  const { imageUrl } = req.query;
  if (!imageUrl) {
    return res.status(400).json({ message: "url not found" });
  }
  try {
    const filename = path.basename(imageUrl);
    const filePath = path.join(__dirname, "uploads", filename);
    if (fs.existsSync(filePath)) {
      fs.unlinkSync(filePath);
      res.status(200).json({
        message: "delted successfully",
      });
    } else {
      res.status(400).json({ message: "image not found" });
    }
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});
app.put("/edit-story/:id", authenticateToken, async (req, res) => {
  const { id } = req.params;
  const { title, story, visitedLocation, imageUrl, visitedDate } = req.body;
  console.log(req.body);
  const { userId } = req.user;
  if (!title || !story || !visitedLocation || !imageUrl || !visitedDate) {
    return res.status(400).json({
      message: "all fields are required",
    });
  }
  const parsedVisitedDate = new Date(parseInt(visitedDate));
  try {
    const travelStories = await TravelStory.findById({
      _id: id,
      userId: userId,
    });
    if (!travelStories) {
      return res.status(400).json({ message: "travel story not found" });
    }
    placeholderImgUrl = `http://localhost:3000/assets/placeholder.jpg`;
    travelStories.title = title;
    travelStories.story = story;
    travelStories.visitedLocation = visitedLocation;
    travelStories.imageUrl = imageUrl;
    travelStories.visitedDate = parsedVisitedDate;
    await travelStories.save();
    res
      .status(200)
      .json({ travel: travelStories, message: "updated successfully" });
  } catch (err) {
    return res.status(400).json({ message: err.message });
  }
});
app.delete("/delete-story/:id", authenticateToken, async (req, res) => {
  const { id } = req.params;
  const { userId } = req.user;
  try {
    const travelStories = await TravelStory.findById({
      _id: id,
      userId: userId,
    });
    if (!travelStories) {
      res.status(400).json({
        message: "travel not found",
      });
    }
    await travelStories.deleteOne({ _id: id, userId: userId });
    console.log(travelStories);
    const imageUrl = travelStories.imageUrl;
    const filename = path.basename(imageUrl);
    const filePath = path.join(__dirname, "uploads", filename);
    fs.unlinkSync(filePath, (err) => {
      if (err) {
        console.log("failed to delete image files", err);
      }
    });
    res.status(200).json({ message: "Travel story deleted Successfully" });
  } catch (err) {
    res.status(400).json({
      message: "travel not deleted",
      err: err.message,
    });
  }
});
app.put("/update-is-favourite/:id", authenticateToken, async (req, res) => {
  const { id } = req.params;
  const { isFavourite } = req.body;
  const { userId } = req.user;
  try {
    const travelStories = await TravelStory.findOne({
      _id: id,
      userId: userId,
    });
    if (!travelStories) {
      res.status(500).json({ message: "travelstory not found" });
    }
    travelStories.isFavourite = isFavourite;
    await travelStories.save();
    res.status(200).json({
      travel: travelStories,
      message: "upadted",
    });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});
app.get("/search", authenticateToken, async (req, res) => {
  const { query } = req.query;
  const { userId } = req.user;
  if (!query) {
    return res.status(400).json({ message: "query is required" });
  }
  try {
    const searchResults = await TravelStory.find({
      userId: userId,
      $or: [
        { title: { $regex: query, $options: "i" } },
        { story: { $regex: query, $options: "i" } },
        { visitedLocation: { $regex: query, $options: "i" } },
      ],
    }).sort({ isFavourite: -1 });
    res.status(200).json({ stories: searchResults });
  } catch (err) {
    res.status(400).json({
      err: err.message,
    });
  }
});
app.get("/travel-stories/filter", authenticateToken, async (req, res) => {
  const { startDate, endDate } = req.query;
  const { userId } = req.user;
  try {
    const start = new Date(parseInt(startDate));
    const end = new Date(parseInt(endDate));
    const filteredStories = await TravelStory.find({
      userId: userId,
      visitedDate: { $gte: start, $lte: end },
    }).sort({ isFavourite: -1 });
    res.status(200).json({ stories: filteredStories });
  } catch (err) {
    res.status(400).json({ err: err.message });
  }
});
app.use("/uploads", express.static(path.join(__dirname, "uploads")));
app.use("/assets", express.static(path.join(__dirname, "assests")));
app.listen(3000, () => {
  console.log("port no 3000");
});
module.exports = app;
