import express, { Request, Response, Router } from "express";
import mongoose from "mongoose";
import { createProxyServer } from "http-proxy";

// import LocalStrategy from 'passport-local';
// import session from 'express-session';

import { PostingModel, IPosting } from "./models/posting";
import { UserModel } from "./models/user";
import { Message, MessageModel } from "./models/message";

import postingRoutes from "./routes/posting";
import userRoutes from "./routes/user";
import messageRoutes from "./routes/message";

import cors from "cors";

const app = express();

const PORT = process.env.PORT || 3001;

mongoose.connect("mongodb://localhost:27017/tradeyourshelfofshame");
const db = mongoose.connection;

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
app.use(express.json());

// Endpoint to get the latest 8 postings
app.get("/latest-postings", async (req: Request, res: Response) => {
  try {
    const latestPostings = await PostingModel.find()
      .sort({ createdAt: -1 })
      .limit(8);
    res.json(latestPostings);
  } catch (error) {
    console.error("Error fetching latest postings:", error);
    res.status(500).json({ error: "Internal server error" });
  }
});

// Endpoint to get postings based on search queries
app.get("/search", async (req: Request, res: Response) => {
  const { type, q, author_id, page, viewAll } = req.query;
  // console.log(req.query);
  const itemsPerPage = 10;

  try {
    const query: any = {};

    if (type) {
      query.type = type;
    }
    if (q) {
      query.title = { $regex: q, $options: "i" }; // Case-insensitive search
    }
    if (author_id) {
      try {
        query.author = new mongoose.Types.ObjectId(String(author_id));
        query.author = author_id;
      } catch (error) {
        console.error("Invalid author_id:", error);
        res.status(400).json({ error: "Invalid author_id" });
        return;
      }

      if (viewAll == "true") {
        const searchResult = await PostingModel.find(query);
        return res.json(searchResult);
      }
    }

    const pageNumber = parseInt(page as string) || 1;

    const searchResult = await PostingModel.find(query)
      .skip((pageNumber - 1) * itemsPerPage)
      .limit(itemsPerPage)
      .sort({ createdAt: -1 })
      .populate({
        path: "author",
        model: UserModel,
        select: "name", // Include only the 'name' field from the UserModel
      })
      .exec();

    res.json(searchResult);
  } catch (error) {
    console.error("Error searching postings:", error);
    res.status(500).json({ error: "Internal server error" });
  }
});

app.use("/posting", postingRoutes);
app.use("/user", userRoutes);
app.use("/message", messageRoutes);

app.get("*", async (req: Request, res: Response) => {
  res.json("Wrong Page!");
});

app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});
