import express, { Request, Response } from "express";
import mongoose from "mongoose";

import { PostingModel, IPosting } from "../models/posting";
import { UserModel } from "../models/user";
import { Message, MessageModel } from "../models/message";

const router = express.Router();

router.get("/test", (req: Request, res: Response) => {
  const { userId } = req.body;
  console.log("/message/test route hit");
  if (userId) {
    res.json(`/message/test route hit with get req with userId: ${userId}`);
  } else {
    res.json("/message/test route hit with get req");
  }
});

// Endpoint to update messages
router.put("/", async (req: Request, res: Response) => {
  try {
    const { senderId, receiverId, postId, message } = req.body;

    const users = await UserModel.find({
      $or: [{ _id: senderId }, { _id: receiverId }],
    });

    if (!users || users.length !== 2) {
      return res.status(400).json({
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

    if (savedMessage) {
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

// Endpoint to get all messages related to an user
router.get("/:userId", async (req: Request, res: Response) => {
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

// Endpoint to change messages' isRead variable
router.put("/readMessages", async (req: Request, res: Response) => {
  const { userId, chatId } = req.body;

  try {
    const message = await MessageModel.findById(chatId);
    if (!message) {
      return res.status(404).json({ error: "Invalid Message" });
    }

    message.messages.forEach((msg) => {
      if (msg.sentBy != userId) {
        msg.isViewed = true;
      }
    });

    await message.save();

    return res.json({ success: true });
  } catch (error) {
    console.error("Error updating message:", error);
    return res.status(500).json({ error: "Internal Server Error" });
  }
});

// Endpoint to send a message
router.put("/:chatId", async (req: Request, res: Response) => {
  const { userId, chatId } = req.body;
  const { messageContent } = req.body;

  try {
    const chat = await MessageModel.findById(chatId);
    if (!chat) {
      return res.status(404).json({ error: "Invalid Chat" });
    }

    const newMessage: Message = {
      message: messageContent,
      sentBy: new mongoose.Types.ObjectId(String(userId)),
    };

    chat.messages.push(newMessage);
    chat.messages.forEach((msg) => {
      if (msg.sentBy != userId) {
        msg.isViewed = true;
      }
    });
    await chat.save();

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

    if (!messages) {
      return res.status(500).json({ error: "Internal Server Error!" });
    }

    return res.json(messages);
  } catch (error) {
    console.error("Error updating message:", error);
    return res.status(500).json({ error: "Internal Server Error" });
  }
});

export default router;
