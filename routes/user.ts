import express, { Request, Response } from "express";

import passport from "passport";
import passportLocal from "passport-local";
const LocalStrategy = passportLocal.Strategy;

import { PostingModel, IPosting } from "../models/posting";
import { UserModel, IUser } from "../models/user";

const router = express.Router();

// passport for password hashing
passport.use(
  new LocalStrategy(
    {
      usernameField: "email", // Specify the field used for the username (email in this case)
      passwordField: "password", // Specify the field used for the password
    },
    UserModel.authenticate()
  )
);

// Endpoint to register a new user
router.post("/register", async (req: Request, res: Response) => {
  const userParams = req.body;

  try {
    const isExistingUser = await UserModel.findOne({ email: userParams.email });
    if (isExistingUser) {
      return res.json("Existing User");
    }

    userParams.username = userParams.email;

    const [password, ...newUserParams] = userParams;

    const user = new UserModel(newUserParams);

    const newUser = await UserModel.register(user, password);

    return res.status(200).json(newUser);
  } catch (error) {
    console.log(error);
    res.status(500).json({ message: error });
  }
});

// Endpoint to sign in an user
router.post("/signin", async (req, res, next) => {
  passport.authenticate("local", (err: Error, user: IUser, info: any) => {
    if (err) {
      return res.status(500).json({ message: "Internal Server Error" });
    }

    if (!user) {
      return res.status(401).json({ message: "Invalid email or password" });
    }
    const { username, isEmailVerified, ...userInfo } = user;
    return res.status(200).json({ userInfo });
  })(req, res, next);
});

// Endpoint to get user information
router.get("/:userId", async (req, res) => {
  const { userId } = req.params;

  try {
    const user = await UserModel.findById(userId)
      .select("name email interests userSetting notifications")
      .populate({
        path: "notifications.postingId",
        model: PostingModel,
        select: "title type",
      })
      .exec();

    if (!user) {
      return res.status(404).json({ error: "User not found" });
    }

    res.json(user);
  } catch (error) {
    console.error("Error retrieving user:", error);
    res.status(500).json({ error: "Internal server error" });
  }
});

// Endpoint to get an user's interest list based on the user Id
router.patch("/:userId/interest", async (req, res) => {
  const { userId } = req.params;

  try {
    const user = await UserModel.findById(userId);
    if (!user) {
      return res.status(404).json({ error: "User not found" });
    }

    // if (!posting.author.equals(req.user._id)) {
    //   req.flash("error", "You do not have the permission to do that!.");
    //
    // }

    const updatedUser = await UserModel.findByIdAndUpdate(
      userId,
      { interests: req.body },
      { new: true }
    );

    if (updatedUser) {
      return res.json(updatedUser);
    } else {
      return res
        .status(500)
        .json({ error: "Failed to update user interest list" });
    }
  } catch (error) {
    console.error("Error finding user!:", error);
    res.status(500).json({ error: "Internal server error" });
  }
});

// Endpoint to change an user's notifications' isViewed variable to true
router.patch("/:userId/checkNotification", async (req, res) => {
  const { userId } = req.params;

  try {
    const user = await UserModel.findById(userId);
    if (!user) {
      return res.status(404).json({ error: "User not found" });
    }

    // if (!posting.author.equals(req.user._id)) {
    //   req.flash("error", "You do not have the permission to do that!.");
    //
    // }

    const updatedUser = await UserModel.findByIdAndUpdate(
      userId,
      { $set: { "notifications.$[].isViewed": true } },
      { new: true }
    )
      .select("name email interests userSetting notifications")
      .exec();

    if (updatedUser) {
      return res.json(updatedUser);
    } else {
      return res
        .status(500)
        .json({ error: "Failed to update user notification viewed" });
    }
  } catch (error) {
    console.error("Error finding user!:", error);
    res.status(500).json({ error: "Internal server error" });
  }
});

export default router;
