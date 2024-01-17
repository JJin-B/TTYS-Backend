import mongoose, {
  Schema,
  Document,
  Types,
  Model,
  PopulatedDoc,
} from "mongoose";

interface IMessage extends Document {
  senderId: Types.ObjectId;
  receiverId: Types.ObjectId;
  posting?: Types.ObjectId;
  messages: {
    message: string;
    sentBy: Types.ObjectId;
    createdAt: Date;
    isViewed: boolean;
  }[];
}

const messageSchema: Schema = new Schema<IMessage>({
  senderId: {
    type: Schema.Types.ObjectId,
    ref: "UserModel",
    required: true,
  },
  receiverId: {
    type: Schema.Types.ObjectId,
    ref: "UserModel",
    required: true,
  },
  posting: {
    type: Schema.Types.ObjectId,
    ref: "PostingModel",
  },

  messages: {
    type: [
      {
        message: { type: String },
        sentBy: { type: Schema.Types.ObjectId, ref: "UserModel" },
        createdAt: { type: Date, default: Date.now }, // Fix here
        isViewed: { type: Boolean, default: false },
      },
    ],
  },
});

const MessageModel: Model<IMessage> = mongoose.model<IMessage>(
  "Message",
  messageSchema
);
export default MessageModel;

export { MessageModel };
