import mongoose, { Schema, Document } from "mongoose";
import passportLocalMongoose from "passport-local-mongoose";

interface IUser extends Document {
  name: string;
  email: string;
  interests: string[];
}

const userSchema: Schema = new Schema({
  name: String,
  email: {
    type: String,
    required: true,
    unique: true,
  },
  interests: [String],
});

userSchema.plugin(passportLocalMongoose);

const UserModel = mongoose.model<IUser>("User", userSchema);

export { UserModel, IUser };
