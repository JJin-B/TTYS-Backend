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
// import LocalStrategy from 'passport-local';
// import session from 'express-session';
const posting_1 = require("./models/posting");
const user_1 = require("./models/user");
const posting_2 = __importDefault(require("./routes/posting"));
const user_2 = __importDefault(require("./routes/user"));
const message_1 = __importDefault(require("./routes/message"));
const app = (0, express_1.default)();
const PORT = process.env.PORT || 3001;
mongoose_1.default.connect("mongodb://localhost:27017/tradeyourshelfofshame");
const db = mongoose_1.default.connection;
db.on("error", console.error.bind(console, "MongoDB connection error:"));
db.once("open", () => {
    console.log("MongoDB connected successfully");
});
// // Setting for CORS
// const apiProxy = createProxyServer();
// const allowedOrigin =
//   "https://9afnnp3x28.execute-api.us-east-2.amazonaws.com/TTYS"; // AWS API GATEWAY url
// const corsOptions: cors.CorsOptions = {
//   origin: allowedOrigin,
//   methods: "GET,HEAD,PUT,PATCH,POST,DELETE",
//   credentials: true,
// };
// app.use(cors(corsOptions));
// // Proxy requests to the actual backend API
// app.all('/*', (req, res) => {
//   apiProxy.web(req, res, {
//     target: 'http://3.145.3.210:3001', // backend API server URL
//     changeOrigin: true,
//   });
// });
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
app.use("/posting", posting_2.default);
app.use("/user", user_2.default);
app.use("/message", message_1.default);
app.get("*", (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    res.json("Wrong Page!");
}));
app.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);
});
