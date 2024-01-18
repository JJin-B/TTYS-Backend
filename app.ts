import express, { Request, Response } from "express";
import mongoose from "mongoose";
// import LocalStrategy from 'passport-local';
// import session from 'express-session';

import { PostingModel, IPosting } from "./models/posting";
import { UserModel } from "./models/user";
import { MessageModel } from "./models/message";

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

    if (savedPosting.bggData && savedPosting.bggData?.length > 0) {
      const bggIds: string[] = savedPosting.bggData.map((data) => data.id);

      const notifiedUsers = await UserModel.find({
        interests: {
          $elemMatch: {
            id: {
              $in: bggIds,
            },
            type: { $ne: savedPosting.type },
          },
        },
        _id: { $ne: savedPosting.author._id },
      }).exec();

      notifiedUsers.forEach(async (user) => {
        user.notifications = [
          ...user.notifications,
          { postingId: savedPosting._id, isViewed: false },
        ];

        // Save the user with the updated notifications
        await user.save();
      });
    }

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
      .select("name email interests userSetting notifications")
      .populate({
        path: "notifications.postingId",
        model: PostingModel,
        select: "title type",
      })
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

app.patch("/user/:userId/interest", async (req, res) => {
  const { userId } = req.params;

  try {
    const user = await UserModel.findById(userId);
    if (!user) {
      return res.status(404).json({ error: "User not found" });
    }

    // if (!posting.author.equals(req.user._id)) {
    //   req.flash("error", "You do not have the permission to do that!.");
    //
    // }

    const updatedUser = await UserModel.findByIdAndUpdate(
      userId,
      { interests: req.body },
      { new: true }
    );

    if (updatedUser) {
      return res.json(updatedUser);
    } else {
      return res
        .status(500)
        .json({ error: "Failed to update user interest list" });
    }
  } catch (error) {
    console.error("Error finding user!:", error);
    res.status(500).json({ error: "Internal server error" });
  }
});

app.patch("/user/:userId/checkNotification", async (req, res) => {
  const { userId } = req.params;

  try {
    const user = await UserModel.findById(userId);
    if (!user) {
      return res.status(404).json({ error: "User not found" });
    }

    // if (!posting.author.equals(req.user._id)) {
    //   req.flash("error", "You do not have the permission to do that!.");
    //
    // }

    const updatedUser = await UserModel.findByIdAndUpdate(
      userId,
      { $set: { "notifications.$[].isViewed": true } },
      { new: true }
    )
      .select("name email interests userSetting notifications")
      .exec();

    if (updatedUser) {
      return res.json(updatedUser);
    } else {
      return res
        .status(500)
        .json({ error: "Failed to update user notification viewed" });
    }
  } catch (error) {
    console.error("Error finding user!:", error);
    res.status(500).json({ error: "Internal server error" });
  }
});

app.put("/message", async (req: Request, res: Response) => {
  try {
    const { senderId, receiverId, postId, message } = req.body;

    const users = await UserModel.find({
      $or: [{ _id: senderId }, { _id: receiverId }],
    });

    if (!users || users.length !== 2) {
      return res
        .status(400)
        .json({
          error: "Invalid Users: either wrong receving or sending user",
        });
    }
    const posting = await PostingModel.findById(postId);

    if (!posting) {
      return res.status(400).json({ error: "Invalid Posting" });
    }

    const messages = await MessageModel.findOne({
      sender: senderId,
      receiver: receiverId,
      posting: postId,
    });

    let savedMessage;

    if (messages) {
      messages.messages.push({
        message: message,
        sentBy: new mongoose.Types.ObjectId(String(senderId)),
        createdAt: new Date(),
        isViewed: false,
      });

      savedMessage = await messages.save();
    } else {
      const messages = new MessageModel({
        sender: new mongoose.Types.ObjectId(String(senderId)),
        receiver: new mongoose.Types.ObjectId(String(receiverId)),
        posting: new mongoose.Types.ObjectId(String(postId)),
        messages: {
          message: message,
          sentBy: new mongoose.Types.ObjectId(String(senderId)),
        },
      });
      savedMessage = await messages.save();
    }

    if (messages) {
      return res.json(
        await savedMessage.populate([
          {
            path: "sender",
            model: UserModel,
            select: "name",
          },
          {
            path: "receiver",
            model: UserModel,
            select: "name",
          },
        ])
      );
    } else {
      return res.status(500).json({ error: "Failed to update posting" });
    }
  } catch (error) {
    console.error("Error sending message:", error);
    res.status(500).json({ error: "Internal server error" });
  }
});

app.get("/message/:userId", async (req: Request, res: Response) => {
  const { userId } = req.params;
  const user = await UserModel.findById(userId);
  if (!user) {
    return res.status(500).json({ error: "Invalid User" });
  }
  try {
    const messages = await MessageModel.find({
      $or: [{ sender: userId }, { receiver: userId }],
    }).populate([
      {
        path: "sender",
        model: UserModel,
        select: "name",
      },
      {
        path: "receiver",
        model: UserModel,
        select: "name",
      },
      {
        path: "posting",
        model: PostingModel,
        select: "title author",
      },
    ]);

    return res.json(messages);
  } catch (error) {
    console.error("Error sending message:", error);
    res.status(500).json({ error: "Internal server error" });
  }
});

app.get("*", async (req: Request, res: Response) => {
  res.json("Wrong Page!");
});

app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});
