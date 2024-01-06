import mongoose from "mongoose";
import { bgNames, bgDescs, imgUrls } from "./boardgames";
import { PostingModel, IPosting } from "../models/posting";
import { UserModel } from "../models/user";

mongoose.connect("mongodb://localhost:27017/tradeyourshelfofshame");
const db = mongoose.connection;

db.on("error", console.error.bind(console, "MongoDB connection error:"));
db.once("open", () => {
  console.log("MongoDB connected successfully");
});

const userId: mongoose.Types.ObjectId = new mongoose.Types.ObjectId(
  "65834424b3614bdc5e084875"
);

const getRandomElementsFromArray = (arr: string[], count: number) => {
  const shuffled = Array.from(arr).sort(() => 0.5 - Math.random());
  return shuffled.slice(0, count);
};

const generateRandomDate = (start: Date, end: Date): Date => {
  const randomTime =
    start.getTime() + Math.random() * (end.getTime() - start.getTime());
  return new Date(randomTime);
};

const seedDB = async (): Promise<void> => {
  console.log("User Model Reset");
  await UserModel.deleteMany({});
  const newUser = new UserModel({
    _id: userId,
    email: "intblejin@gmail.com",
    name: "Jin Bae",
    password: "abc",
  });
  await newUser.save();
  console.log("User reset done");

  console.log("Posting Model deletion starts");
  await PostingModel.deleteMany({});
  console.log("deletion ends & dummydata generation starts");

  for (let i = 0; i < 200; i++) {
    const type: "buy" | "sell" = Math.random() < 0.5 ? "buy" : "sell";
    const bgIdx = Math.floor(Math.random() * bgNames.length);
    const title: string = bgNames[bgIdx];
    const desc: string = bgDescs[bgIdx];
    const price: number = Math.floor(Math.random() * 100) + 10;
    const location: string = getRandomElementsFromArray(
      ["Saskatoon", "Regina", "Warman", "Moosejaw", "Edmonton", "Calgary"],
      1
    )[0];

    const imgCount = Math.floor(Math.random() * 6);
    const imgSrcs: string[] =
      imgCount > 0 ? getRandomElementsFromArray(imgUrls, imgCount) : [];

    const createdAt = generateRandomDate(
      new Date("2023-09-20"),
      new Date("2023-12-20")
    );

    const posting = new PostingModel({
      type: type,
      title: title,
      desc: desc,
      price: price,
      location: location,
      imageSrc: imgSrcs,
      author: userId,
      createdAt: createdAt,
    });

    await posting.save();
  }
};

seedDB().then(() => {
  mongoose.connection.close();
});
