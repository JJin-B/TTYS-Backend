"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const mongoose_1 = __importDefault(require("mongoose"));
const posting_1 = require("../models/posting");
const user_1 = require("../models/user");
const message_1 = require("../models/message");
const router = express_1.default.Router();
// Endpoint to update messages
router.put("/", (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const { senderId, receiverId, postId, message } = req.body;
        const users = yield user_1.UserModel.find({
            $or: [{ _id: senderId }, { _id: receiverId }],
        });
        if (!users || users.length !== 2) {
            return res.status(400).json({
                error: "Invalid Users: either wrong receving or sending user",
            });
        }
        const posting = yield posting_1.PostingModel.findById(postId);
        if (!posting) {
            return res.status(400).json({ error: "Invalid Posting" });
        }
        const messages = yield message_1.MessageModel.findOne({
            sender: senderId,
            receiver: receiverId,
            posting: postId,
        });
        let savedMessage;
        if (messages) {
            messages.messages.push({
                message: message,
                sentBy: new mongoose_1.default.Types.ObjectId(String(senderId)),
                createdAt: new Date(),
                isViewed: false,
            });
            savedMessage = yield messages.save();
        }
        else {
            const messages = new message_1.MessageModel({
                sender: new mongoose_1.default.Types.ObjectId(String(senderId)),
                receiver: new mongoose_1.default.Types.ObjectId(String(receiverId)),
                posting: new mongoose_1.default.Types.ObjectId(String(postId)),
                messages: {
                    message: message,
                    sentBy: new mongoose_1.default.Types.ObjectId(String(senderId)),
                },
            });
            savedMessage = yield messages.save();
        }
        if (savedMessage) {
            return res.json(yield savedMessage.populate([
                {
                    path: "sender",
                    model: user_1.UserModel,
                    select: "name",
                },
                {
                    path: "receiver",
                    model: user_1.UserModel,
                    select: "name",
                },
            ]));
        }
        else {
            return res.status(500).json({ error: "Failed to update posting" });
        }
    }
    catch (error) {
        console.error("Error sending message:", error);
        res.status(500).json({ error: "Internal server error" });
    }
}));
// Endpoint to get all messages related to an user
router.get("/:userId", (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const { userId } = req.params;
    const user = yield user_1.UserModel.findById(userId);
    if (!user) {
        return res.status(500).json({ error: "Invalid User" });
    }
    try {
        const messages = yield message_1.MessageModel.find({
            $or: [{ sender: userId }, { receiver: userId }],
        }).populate([
            {
                path: "sender",
                model: user_1.UserModel,
                select: "name",
            },
            {
                path: "receiver",
                model: user_1.UserModel,
                select: "name",
            },
            {
                path: "posting",
                model: posting_1.PostingModel,
                select: "title author",
            },
        ]);
        return res.json(messages);
    }
    catch (error) {
        console.error("Error sending message:", error);
        res.status(500).json({ error: "Internal server error" });
    }
}));
// Endpoint to change messages' isRead variable
router.put("/readMessages", (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const { userId, chatId } = req.body;
    try {
        const message = yield message_1.MessageModel.findById(chatId);
        if (!message) {
            return res.status(404).json({ error: "Invalid Message" });
        }
        message.messages.forEach((msg) => {
            if (msg.sentBy != userId) {
                msg.isViewed = true;
            }
        });
        yield message.save();
        return res.json({ success: true });
    }
    catch (error) {
        console.error("Error updating message:", error);
        return res.status(500).json({ error: "Internal Server Error" });
    }
}));
// Endpoint to send a message
router.put("/:chatId", (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const { userId, chatId } = req.body;
    const { messageContent } = req.body;
    try {
        const chat = yield message_1.MessageModel.findById(chatId);
        if (!chat) {
            return res.status(404).json({ error: "Invalid Chat" });
        }
        const newMessage = {
            message: messageContent,
            sentBy: new mongoose_1.default.Types.ObjectId(String(userId)),
        };
        chat.messages.push(newMessage);
        chat.messages.forEach((msg) => {
            if (msg.sentBy != userId) {
                msg.isViewed = true;
            }
        });
        yield chat.save();
        const messages = yield message_1.MessageModel.find({
            $or: [{ sender: userId }, { receiver: userId }],
        }).populate([
            {
                path: "sender",
                model: user_1.UserModel,
                select: "name",
            },
            {
                path: "receiver",
                model: user_1.UserModel,
                select: "name",
            },
            {
                path: "posting",
                model: posting_1.PostingModel,
                select: "title author",
            },
        ]);
        if (!messages) {
            return res.status(500).json({ error: "Internal Server Error!" });
        }
        return res.json(messages);
    }
    catch (error) {
        console.error("Error updating message:", error);
        return res.status(500).json({ error: "Internal Server Error" });
    }
}));
exports.default = router;
