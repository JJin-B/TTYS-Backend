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
const mongoose_1 = __importDefault(require("mongoose"));
const boardgames_1 = require("./boardgames");
const posting_1 = require("../models/posting");
const user_1 = require("../models/user");
mongoose_1.default.connect("mongodb://localhost:27017/tradeyourshelfofshame");
const db = mongoose_1.default.connection;
db.on("error", console.error.bind(console, "MongoDB connection error:"));
db.once("open", () => {
    console.log("MongoDB connected successfully");
});
const userId = new mongoose_1.default.Types.ObjectId("65834424b3614bdc5e084875");
const getRandomElementsFromArray = (arr, count) => {
    const shuffled = Array.from(arr).sort(() => 0.5 - Math.random());
    return shuffled.slice(0, count);
};
const generateRandomDate = (start, end) => {
    const randomTime = start.getTime() + Math.random() * (end.getTime() - start.getTime());
    return new Date(randomTime);
};
const seedDB = () => __awaiter(void 0, void 0, void 0, function* () {
    console.log("User Model Reset");
    yield user_1.UserModel.deleteMany({});
    const newUser = new user_1.UserModel({
        _id: userId,
        email: "intblejin@gmail.com",
        username: "intblejin@gmail.com",
        name: "Jin Bae",
        password: "abc",
    });
    yield newUser.save();
    console.log("User reset done");
    console.log("Posting Model deletion starts");
    yield posting_1.PostingModel.deleteMany({});
    console.log("deletion ends & dummydata generation starts");
    for (let i = 0; i < 200; i++) {
        const type = Math.random() < 0.5 ? "buy" : "sell";
        const bgIdx = Math.floor(Math.random() * boardgames_1.bgNames.length);
        const title = boardgames_1.bgNames[bgIdx];
        const desc = boardgames_1.bgDescs[bgIdx];
        const price = Math.floor(Math.random() * 100) + 10;
        const location = getRandomElementsFromArray(["Saskatoon", "Regina", "Warman", "Moosejaw", "Edmonton", "Calgary"], 1)[0];
        const imgCount = Math.floor(Math.random() * 6);
        const imgSrcs = imgCount > 0 ? getRandomElementsFromArray(boardgames_1.imgUrls, imgCount) : [];
        const createdAt = generateRandomDate(new Date("2023-09-20"), new Date("2023-12-20"));
        const posting = new posting_1.PostingModel({
            type: type,
            title: title,
            desc: desc,
            price: price,
            location: location,
            imageSrc: imgSrcs,
            author: userId,
            createdAt: createdAt,
        });
        yield posting.save();
    }
});
seedDB().then(() => {
    mongoose_1.default.connection.close();
});
