import express, { Request, Response, Router } from "express";
import mongoose from "mongoose";
import { createProxyServer } from "http-proxy";

// import LocalStrategy from 'passport-local';
// import session from 'express-session';

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

app.use(cors());

// Middleware to parse JSON in the request body
app.use(express.json());



app.use("/posting", postingRoutes);
app.use("/user", userRoutes);
app.use("/message", messageRoutes);

app.get("*", async (req: Request, res: Response) => {
  res.json("Wrong Page!");
});

app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});
