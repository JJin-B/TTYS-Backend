import express, { Request, Response } from "express";
import mongoose from "mongoose";

import { PostingModel, IPosting } from "../models/posting";
import { UserModel } from "../models/user";

const router = express.Router();

// Endpoint to make a new posting
router.post("/new", async (req: Request, res: Response) => {
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

// Endpoint to get posting details based on the posting Id
router.get("/:postId", async (req: Request, res: Response) => {
  const { postId } = req.params;
  console.log(postId);
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

// Endpoint to edit posting details based on the posting Id
router.put("/:postId", async (req: Request, res: Response) => {
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

// Endpoint to delete posting based on the posting Id
router.delete("/:postId", async (req: Request, res: Response) => {
  const { postId } = req.params;
  try {
    const deletedPost = await PostingModel.findByIdAndDelete(postId);
  } catch (error) {
    console.error("Error searching postings:", error);
    res.status(500).json({ error: "Internal server error" });
  }
});

export default router;
