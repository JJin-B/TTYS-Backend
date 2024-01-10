import express, { Request, Response } from "express";
import mongoose from "mongoose";
// import LocalStrategy from 'passport-local';
// import session from 'express-session';

import { PostingModel, IPosting } from "./models/posting";
import { UserModel } from "./models/user";
import cors from "cors";

const app = express();
const PORT = process.env.PORT || 3001;

mongoose.connect("mongodb://localhost:27017/tradeyourshelfofshame");
const db = mongoose.connection;

db.on("error", console.error.bind(console, "MongoDB connection error:"));
db.once("open", () => {
  console.log("MongoDB connected successfully");
});

// Middleware to parse JSON in the request body
app.use(express.json());
app.use(cors());

// Route to get the latest 8 postings
app.get("/latest-postings", async (req: Request, res: Response) => {
  try {
    const latestPostings = await PostingModel.find()
      .sort({ createdAt: -1 })
      .limit(8);
    res.json(latestPostings);
  } catch (error) {
    console.error("Error fetching latest postings:", error);
    res.status(500).json({ error: "Internal server error" });
  }
});

// Route to get postings based on type and title search
app.get("/search", async (req: Request, res: Response) => {
  const { type, q, author_id, page, viewAll } = req.query;
  const itemsPerPage = 10;

  try {
    const query: any = {};

    if (type) {
      query.type = type;
    }
    if (q) {
      query.title = { $regex: q, $options: "i" }; // Case-insensitive search
    }
    if (author_id) {
      try {
        query.author = new mongoose.Types.ObjectId(String(author_id));
      } catch (error) {
        console.error("Invalid author_id:", error);
        res.status(400).json({ error: "Invalid author_id" });
        return;
      }

      if (viewAll == "true") {
        const searchResult = await PostingModel.find(query);
        res.json(searchResult);
        return;
      }
    }

    const pageNumber = parseInt(page as string) || 1;

    const searchResult = await PostingModel.find(query)
      .skip((pageNumber - 1) * itemsPerPage)
      .limit(itemsPerPage)
      .sort({ createdAt: -1 })
      .populate({
        path: "author",
        model: UserModel,
        select: "name", // Include only the 'name' field from the UserModel
      })
      .exec();

    res.json(searchResult);
  } catch (error) {
    console.error("Error searching postings:", error);
    res.status(500).json({ error: "Internal server error" });
  }
});

app.post("/posting/new", async (req: Request, res: Response) => {
  try {
    const newPosting = new PostingModel(req.body);

    const savedPosting = await newPosting.save();

    res.status(201).json(savedPosting);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Internal Server Error" });
  }
});

app.get("/posting/:postId", async (req: Request, res: Response) => {
  const { postId } = req.params;
  try {
    const searchResult = await PostingModel.findById(postId)
      .populate({
        path: "author",
        model: UserModel,
        select: "name", // Include only the 'name' field from the UserModel
      })
      .exec();
    res.json(searchResult);
  } catch (error) {
    console.error("Error searching postings:", error);
    res.status(500).json({ error: "Internal server error" });
  }
});

app.put("/posting/:postId", async (req: Request, res: Response) => {
  const { postId } = req.params;
  console.log(req.body);
  try {
    const posting = await PostingModel.findById(postId);
    if (!posting) {
      return res.status(404).json({ error: "Posting not found" });
    }

    // if (!posting.author.equals(req.user._id)) {
    //   req.flash("error", "You do not have the permission to do that!.");
    //
    // }

    const updatedPost = await PostingModel.findByIdAndUpdate(
      postId,
      { ...req.body, createdAt: new Date() },
      { new: true }
    );

    if (updatedPost) {
      return res.json(updatedPost);
    } else {
      return res.status(500).json({ error: "Failed to update posting" });
    }
  } catch (error) {
    console.error("Error searching postings:", error);
    res.status(500).json({ error: "Internal server error" });
  }
});

app.delete("/posting/:postId", async (req: Request, res: Response) => {
  const { postId } = req.params;
  try {
    const deletedPost = await PostingModel.findByIdAndDelete(postId);
  } catch (error) {
    console.error("Error searching postings:", error);
    res.status(500).json({ error: "Internal server error" });
  }
});

app.post("/user/register", async (req: Request, res: Response) => {
  const userParams = req.body;

  try {
    const isExistingUser = await UserModel.findOne({ email: userParams.email });
    if (isExistingUser) {
      return res.json("Existing User");
    }

    userParams.username = userParams.email;

    const user = new UserModel(userParams);
    console.log(user);
    const newUser = await user.save();
    console.log(newUser);

    return res.json(newUser);
  } catch (error) {
    console.log(error);
    res.status(500).json({ message: error });
  }
});

app.post("/user/signin", async (req: Request, res: Response) => {
  const userParams = req.body;

  try {
    const isValidUser = await UserModel.findOne({
      email: userParams.email,
      password: userParams.password,
    });
    if (!isValidUser) {
      return res.json("Not valid User");
    }

    return res.json(isValidUser);
  } catch (error) {
    console.log(error);
    res.status(500).json({ message: error });
  }
});

app.get("/user/:userId", async (req, res) => {
  const { userId } = req.params;

  try {
    const user = await UserModel.findById(userId)
      .select("name email interest")
      .exec();

    if (!user) {
      return res.status(404).json({ error: "User not found" });
    }

    res.json(user);
  } catch (error) {
    console.error("Error retrieving user:", error);
    res.status(500).json({ error: "Internal server error" });
  }
});

app.put("/user/:userId");

app.get("*", async (req: Request, res: Response) => {
  res.send("Wrong Page!");
});

app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});
