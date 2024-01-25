import mongoose, { Schema, Document } from "mongoose";
import passportLocalMongoose from "passport-local-mongoose";
import { BggData } from "./posting";

interface UserInterest extends BggData {
  interestType: "sell" | "buy";
}

interface IUser extends Document {
  name: string;
  // password: string; - passport.js will handle the password 
  email: string;
  username: string;
  interests?: UserInterest[];
  userSetting: {};
  isEmailVerified: boolean;
  notifications: {
    postingId: Schema.Types.ObjectId; // ObjectId for the Posting
    isViewed: boolean;
  }[];
}

const userSchema: Schema = new Schema({
  name: {
    type: String,
    required: true,
  },
  // password: {
  //   type: String,
  //   required: true,
  // },
  email: {
    type: String,
    required: true,
    unique: true,
  },
  username: {
    type: String,
    required: true,
    unique: true,
  },
  interests: {
    type: [
      {
        interestType: { type: String, required: true, enum: ["sell", "buy"] },
        id: { type: String, required: true },
        name: { type: String, required: true },
        year: String,
      },
    ],
    default: [],
  },
  userSetting: {},

  isEmailVerified: {
    type: Boolean,
    default: true,
  },

  notifications: {
    type: [
      {
        postingId: { type: Schema.Types.ObjectId, ref: "PostingModel" },
        isViewed: { type: Boolean, default: false },
      },
    ],
    default: [],
  },
});

userSchema.plugin(passportLocalMongoose);

const UserModel = mongoose.model<IUser>("User", userSchema);

export { UserModel, IUser };
