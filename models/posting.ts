import mongoose, {
  Schema,
  Document,
  Types,
  Model,
  PopulatedDoc,
} from "mongoose";
import { UserModel, IUser } from "./user";

interface IPosting extends Document {
  type: "buy" | "sell";
  title: string;
  desc: string;
  price: number;
  location: string;
  imageSrc: string[];
  author: PopulatedDoc<IUser & Document>;
  createdAt: Date;
  bggData?: [{ id: string; name: string; year?: string }];
}

const postingSchema = new Schema<IPosting>({
  type: { type: String, enum: ["buy", "sell"] },
  title: String,
  desc: String,
  price: Number,
  location: String,
  imageSrc: [String],
  author: {
    type: Schema.Types.ObjectId,
    ref: "User",
  },
  createdAt: { type: Date, default: Date.now },
  bggData: [{ id: String, name: String, year: String }],
});

postingSchema.pre<IPosting>('save', function (next) {
  if (!this.createdAt) {
    this.createdAt = new Date();
  }
  next();
});


const PostingModel: Model<IPosting> = mongoose.model("Posting", postingSchema);

export { PostingModel, IPosting };
