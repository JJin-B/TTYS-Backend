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
const posting_1 = __importDefault(require("./routes/posting"));
const user_1 = __importDefault(require("./routes/user"));
const message_1 = __importDefault(require("./routes/message"));
const app = (0, express_1.default)();
const PORT = process.env.PORT || 3001;
mongoose_1.default.connect("mongodb://localhost:27017/tradeyourshelfofshame");
const db = mongoose_1.default.connection;
db.on("error", console.error.bind(console, "MongoDB connection error:"));
db.once("open", () => {
    console.log("MongoDB connected successfully");
});
// // // CORS setting for local development
// import cors from "cors";
// app.use(cors({ origin: "http://localhost:5173" }));
// Middleware to parse JSON in the request body
app.use(express_1.default.json());
app.use("/posting", posting_1.default);
app.use("/user", user_1.default);
app.use("/message", message_1.default);
app.get("/test", (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    console.log("Get Request Received");
    res.status(200).json("Get request");
}));
app.post("/test", (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    console.log("POST Request Received");
    console.log("data:");
    console.log(req.body);
    res.status(200).json("Post request");
}));
app.get("*", (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    res.json("Wrong Page!");
}));
app.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);
});
