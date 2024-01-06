import mongoose, { Schema, Document } from "mongoose";
import passportLocalMongoose from "passport-local-mongoose";

interface IUser extends Document {
  name: string;
  password: string;
  email: string;
  interests: string[];
  userSetting: {};
  isEmailVerified: boolean;
}

const userSchema: Schema = new Schema({
  name: {
    type: String,
    required: true,
  },
  password: {
    type: String,
    required: true,
  },
  email: {
    type: String,
    required: true,
    unique: true,
  },
  interests: {
    type: [String],
    default: [],
  },
  userSetting: {},

  isEmailVerified: {
    type: Boolean,
    default: true,
  },
});

userSchema.plugin(passportLocalMongoose, { usernameField: "email" });

const UserModel = mongoose.model<IUser>("User", userSchema);

export { UserModel, IUser };
