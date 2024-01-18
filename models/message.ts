import mongoose, {
  Schema,
  Document,
  Types,
  Model,
  PopulatedDoc,
} from "mongoose";

interface Message {
  message: string;
  sentBy: Types.ObjectId;
  createdAt?: Date;
  isViewed?: boolean;
}

interface IMessage extends Document {
  sender: Types.ObjectId;
  receiver: Types.ObjectId;
  posting?: Types.ObjectId;
  messages: Message[];
}

const messageSchema: Schema = new Schema<IMessage>({
  sender: {
    type: Schema.Types.ObjectId,
    ref: "UserModel",
    required: true,
  },
  receiver: {
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
        createdAt: { type: Date, default: Date.now },
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

export { Message, MessageModel };
