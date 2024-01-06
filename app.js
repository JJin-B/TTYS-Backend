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
const posting_1 = require("./models/posting");
const user_1 = require("./models/user");
const cors_1 = __importDefault(require("cors"));
const app = (0, express_1.default)();
const PORT = process.env.PORT || 3001;
mongoose_1.default.connect("mongodb://localhost:27017/tradeyourshelfofshame");
const db = mongoose_1.default.connection;
db.on("error", console.error.bind(console, "MongoDB connection error:"));
db.once("open", () => {
    console.log("MongoDB connected successfully");
});
// Middleware to parse JSON in the request body
app.use(express_1.default.json());
app.use((0, cors_1.default)());
// Route to get the latest 8 postings
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
// Route to get postings based on type and title search
app.get("/search", (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const { type, q, page } = req.query;
    const itemsPerPage = 10;
    try {
        const query = {};
        if (type) {
            query.type = type;
        }
        if (q) {
            query.title = { $regex: q, $options: "i" }; // Case-insensitive search
        }
        const pageNumber = parseInt(page) || 1;
        const searchResult = yield posting_1.PostingModel.find(query)
            .skip((pageNumber - 1) * itemsPerPage)
            .limit(itemsPerPage)
            .sort({ createdAt: -1 });
        res.json(searchResult);
    }
    catch (error) {
        console.error("Error searching postings:", error);
        res.status(500).json({ error: "Internal server error" });
    }
}));
app.post("/posting/new", (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const newPosting = new posting_1.PostingModel(req.body);
        const savedPosting = yield newPosting.save();
        res.status(201).json(savedPosting);
    }
    catch (error) {
        console.error(error);
        res.status(500).json({ message: "Internal Server Error" });
    }
}));
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
app.put("/posting/:postId", (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const { postId } = req.params;
    console.log(req.body);
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
app.post("/user/register", (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const userParams = req.body;
    try {
        const isExistingUser = yield user_1.UserModel.findOne({ email: userParams.email });
        if (isExistingUser) {
            return res.json("Existing User");
        }
        const user = new user_1.UserModel(userParams);
        const newUser = yield user.save();
        return res.json(newUser);
    }
    catch (error) {
        console.log(error);
        res.status(500).json({ message: error });
    }
}));
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
app.put("/user");
app.get("*", (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    res.send("Wrong Page!");
}));
app.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);
});
