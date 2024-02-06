import express, { Request, Response, Router } from "express";
import mongoose from "mongoose";

import postingRoutes from "./routes/posting";
import userRoutes from "./routes/user";
import messageRoutes from "./routes/message";



const app = express();

const PORT = process.env.PORT || 3001;

mongoose.connect("mongodb://localhost:27017/tradeyourshelfofshame");
const db = mongoose.connection;

db.on("error", console.error.bind(console, "MongoDB connection error:"));
db.once("open", () => {
  console.log("MongoDB connected successfully");
});

// CORS setting for local development
import cors from "cors";
app.use(cors({ origin: "http://localhost:5173" }));



// Middleware to parse JSON in the request body
app.use(express.json());

app.use("/posting", postingRoutes);
app.use("/user", userRoutes);
app.use("/message", messageRoutes);

app.get("/test", async (req: Request, res: Response) => {
  console.log("Get Request Received");
  res.status(200).json("Get request");
});
app.post("/test", async (req: Request, res: Response) => {
  console.log("POST Request Received");

  console.log("data:");
  console.log(req.body);

  res.status(200).json("Post request");
});

app.get("*", async (req: Request, res: Response) => {
  res.json("Wrong Page!");
});

app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});
