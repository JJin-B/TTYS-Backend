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
const posting_1 = require("../models/posting");
const user_1 = require("../models/user");
const router = express_1.default.Router();
// Endpoint to register a new user
router.post("/register", (req, res) => __awaiter(void 0, void 0, void 0, function* () {
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
router.post("/signin", (req, res) => __awaiter(void 0, void 0, void 0, function* () {
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
router.get("/:userId", (req, res) => __awaiter(void 0, void 0, void 0, function* () {
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
router.patch("/:userId/interest", (req, res) => __awaiter(void 0, void 0, void 0, function* () {
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
router.patch("/:userId/checkNotification", (req, res) => __awaiter(void 0, void 0, void 0, function* () {
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
exports.default = router;