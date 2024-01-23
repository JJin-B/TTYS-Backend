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
const http_proxy_1 = require("http-proxy");
// import LocalStrategy from 'passport-local';
// import session from 'express-session';
const posting_1 = require("./models/posting");
const user_1 = require("./models/user");
const message_1 = require("./models/message");
const cors_1 = __importDefault(require("cors"));
const app = (0, express_1.default)();
const PORT = process.env.PORT || 3001;
mongoose_1.default.connect("mongodb://localhost:27017/tradeyourshelfofshame");
const db = mongoose_1.default.connection;
db.on("error", console.error.bind(console, "MongoDB connection error:"));
db.once("open", () => {
    console.log("MongoDB connected successfully");
});
// Setting for CORS
const apiProxy = (0, http_proxy_1.createProxyServer)();
const allowedOrigin = "https://9afnnp3x28.execute-api.us-east-2.amazonaws.com/TTYS"; // AWS API GATEWAY url
const corsOptions = {
    origin: allowedOrigin,
    methods: "GET,HEAD,PUT,PATCH,POST,DELETE",
    credentials: true,
};
app.use((0, cors_1.default)(corsOptions));
// Proxy requests to the actual backend API
app.all('/api/*', (req, res) => {
    apiProxy.web(req, res, {
        target: 'http://3.145.3.210:3001', // backend API server URL
        changeOrigin: true,
    });
});
// Middleware to parse JSON in the request body
app.use(express_1.default.json());
// Endpoint to get the latest 8 postings
app.get("/latest-postings", (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const latestPostings = yield posting_1.PostingModel.find()
            .sort({ createdAt: -1 })
            .limit(8);
        res.json(latestPostings);
    }
    catch (error) {
        console.error("Error fetching latest postings:", error);
        res.status(500).json({ error: "Internal server error" });
    }
}));
// Endpoint to get postings based on search queries
app.get("/search", (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const { type, q, author_id, page, viewAll } = req.query;
    // console.log(req.query);
    const itemsPerPage = 10;
    try {
        const query = {};
        if (type) {
            query.type = type;
        }
        if (q) {
            query.title = { $regex: q, $options: "i" }; // Case-insensitive search
        }
        if (author_id) {
            try {
                query.author = new mongoose_1.default.Types.ObjectId(String(author_id));
                query.author = author_id;
            }
            catch (error) {
                console.error("Invalid author_id:", error);
                res.status(400).json({ error: "Invalid author_id" });
                return;
            }
            if (viewAll == "true") {
                const searchResult = yield posting_1.PostingModel.find(query);
                return res.json(searchResult);
            }
        }
        const pageNumber = parseInt(page) || 1;
        const searchResult = yield posting_1.PostingModel.find(query)
            .skip((pageNumber - 1) * itemsPerPage)
            .limit(itemsPerPage)
            .sort({ createdAt: -1 })
            .populate({
            path: "author",
            model: user_1.UserModel,
            select: "name", // Include only the 'name' field from the UserModel
        })
            .exec();
        res.json(searchResult);
    }
    catch (error) {
        console.error("Error searching postings:", error);
        res.status(500).json({ error: "Internal server error" });
    }
}));
// Endpoint to make a new posting
app.post("/posting/new", (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    var _a;
    try {
        const newPosting = new posting_1.PostingModel(req.body);
        const savedPosting = yield newPosting.save();
        if (savedPosting.bggData && ((_a = savedPosting.bggData) === null || _a === void 0 ? void 0 : _a.length) > 0) {
            const bggIds = savedPosting.bggData.map((data) => data.id);
            const notifiedUsers = yield user_1.UserModel.find({
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
            notifiedUsers.forEach((user) => __awaiter(void 0, void 0, void 0, function* () {
                user.notifications = [
                    ...user.notifications,
                    { postingId: savedPosting._id, isViewed: false },
                ];
                // Save the user with the updated notifications
                yield user.save();
            }));
        }
        res.status(201).json(savedPosting);
    }
    catch (error) {
        console.error(error);
        res.status(500).json({ message: "Internal Server Error" });
    }
}));
// Endpoint to get posting details based on the posting Id
app.get("/posting/:postId", (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const { postId } = req.params;
    try {
        const searchResult = yield posting_1.PostingModel.findById(postId)
            .populate({
            path: "author",
            model: user_1.UserModel,
            select: "name", // Include only the 'name' field from the UserModel
        })
            .exec();
        res.json(searchResult);
    }
    catch (error) {
        console.error("Error searching postings:", error);
        res.status(500).json({ error: "Internal server error" });
    }
}));
// Endpoint to edit posting details based on the posting Id
app.put("/posting/:postId", (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const { postId } = req.params;
    try {
        const posting = yield posting_1.PostingModel.findById(postId);
        if (!posting) {
            return res.status(404).json({ error: "Posting not found" });
        }
        // if (!posting.author.equals(req.user._id)) {
        //   req.flash("error", "You do not have the permission to do that!.");
        //
        // }
        const updatedPost = yield posting_1.PostingModel.findByIdAndUpdate(postId, Object.assign(Object.assign({}, req.body), { createdAt: new Date() }), { new: true });
        if (updatedPost) {
            return res.json(updatedPost);
        }
        else {
            return res.status(500).json({ error: "Failed to update posting" });
        }
    }
    catch (error) {
        console.error("Error searching postings:", error);
        res.status(500).json({ error: "Internal server error" });
    }
}));
// Endpoint to delete posting based on the posting Id
app.delete("/posting/:postId", (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const { postId } = req.params;
    try {
        const deletedPost = yield posting_1.PostingModel.findByIdAndDelete(postId);
    }
    catch (error) {
        console.error("Error searching postings:", error);
        res.status(500).json({ error: "Internal server error" });
    }
}));
// Endpoint to register a new user
app.post("/user/register", (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const userParams = req.body;
    try {
        const isExistingUser = yield user_1.UserModel.findOne({ email: userParams.email });
        if (isExistingUser) {
            return res.json("Existing User");
        }
        userParams.username = userParams.email;
        const user = new user_1.UserModel(userParams);
        console.log(user);
        const newUser = yield user.save();
        console.log(newUser);
        return res.json(newUser);
    }
    catch (error) {
        console.log(error);
        res.status(500).json({ message: error });
    }
}));
// Endpoint to sign in an user
app.post("/user/signin", (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const userParams = req.body;
    try {
        const isValidUser = yield user_1.UserModel.findOne({
            email: userParams.email,
            password: userParams.password,
        });
        if (!isValidUser) {
            return res.json("Not valid User");
        }
        return res.json(isValidUser);
    }
    catch (error) {
        console.log(error);
        res.status(500).json({ message: error });
    }
}));
// Endpoint to get user information
app.get("/user/:userId", (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const { userId } = req.params;
    try {
        const user = yield user_1.UserModel.findById(userId)
            .select("name email interests userSetting notifications")
            .populate({
            path: "notifications.postingId",
            model: posting_1.PostingModel,
            select: "title type",
        })
            .exec();
        if (!user) {
            return res.status(404).json({ error: "User not found" });
        }
        res.json(user);
    }
    catch (error) {
        console.error("Error retrieving user:", error);
        res.status(500).json({ error: "Internal server error" });
    }
}));
// Endpoint to get an user's interest list based on the user Id
app.patch("/user/:userId/interest", (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const { userId } = req.params;
    try {
        const user = yield user_1.UserModel.findById(userId);
        if (!user) {
            return res.status(404).json({ error: "User not found" });
        }
        // if (!posting.author.equals(req.user._id)) {
        //   req.flash("error", "You do not have the permission to do that!.");
        //
        // }
        const updatedUser = yield user_1.UserModel.findByIdAndUpdate(userId, { interests: req.body }, { new: true });
        if (updatedUser) {
            return res.json(updatedUser);
        }
        else {
            return res
                .status(500)
                .json({ error: "Failed to update user interest list" });
        }
    }
    catch (error) {
        console.error("Error finding user!:", error);
        res.status(500).json({ error: "Internal server error" });
    }
}));
// Endpoint to change an user's notifications' isViewed variable to true
app.patch("/user/:userId/checkNotification", (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const { userId } = req.params;
    try {
        const user = yield user_1.UserModel.findById(userId);
        if (!user) {
            return res.status(404).json({ error: "User not found" });
        }
        // if (!posting.author.equals(req.user._id)) {
        //   req.flash("error", "You do not have the permission to do that!.");
        //
        // }
        const updatedUser = yield user_1.UserModel.findByIdAndUpdate(userId, { $set: { "notifications.$[].isViewed": true } }, { new: true })
            .select("name email interests userSetting notifications")
            .exec();
        if (updatedUser) {
            return res.json(updatedUser);
        }
        else {
            return res
                .status(500)
                .json({ error: "Failed to update user notification viewed" });
        }
    }
    catch (error) {
        console.error("Error finding user!:", error);
        res.status(500).json({ error: "Internal server error" });
    }
}));
// Endpoint to update messages
app.put("/message", (req, res) => __awaiter(void 0, void 0, void 0, function* () {
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
app.get("/message/:userId", (req, res) => __awaiter(void 0, void 0, void 0, function* () {
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
app.put("/message/readMessages", (req, res) => __awaiter(void 0, void 0, void 0, function* () {
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
app.put("/message/:chatId", (req, res) => __awaiter(void 0, void 0, void 0, function* () {
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
app.get("*", (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    res.json("Wrong Page!");
}));
app.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);
});
