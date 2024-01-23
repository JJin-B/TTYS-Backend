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
// Endpoint to make a new posting
router.post("/new", (req, res) => __awaiter(void 0, void 0, void 0, function* () {
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
router.get("/:postId", (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const { postId } = req.params;
    console.log(postId);
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
router.put("/:postId", (req, res) => __awaiter(void 0, void 0, void 0, function* () {
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
router.delete("/:postId", (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const { postId } = req.params;
    try {
        const deletedPost = yield posting_1.PostingModel.findByIdAndDelete(postId);
    }
    catch (error) {
        console.error("Error searching postings:", error);
        res.status(500).json({ error: "Internal server error" });
    }
}));
exports.default = router;
