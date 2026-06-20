import { prop, getModelForClass, Ref } from '@typegoose/typegoose';
import { TimeStamps } from '@typegoose/typegoose/lib/defaultClasses';
import { User } from './user.model';

export class Message extends TimeStamps {
  @prop({ required: true, ref: () => User })
  sender!: Ref<User>;

  @prop({ required: true, trim: true })
  content!: string;

  @prop({ default: 'text', enum: ['text', 'image', 'file', 'system'] })
  type!: string;

  @prop({ ref: () => 'Conversation' })
  conversation?: Ref<any>;

  @prop({ default: false })
  isRead!: boolean;

  @prop({ type: () => [String], default: [] })
  readBy!: string[];

  @prop({ type: () => [ReactionSchema], default: [] })
  reactions!: ReactionSchema[];
}

export class ReactionSchema {
  @prop({ required: true })
  emoji!: string;

  @prop({ required: true, ref: () => User })
  user!: Ref<User>;
}

export class Conversation extends TimeStamps {
  @prop({ required: true, trim: true })
  name!: string;

  @prop({ default: 'direct', enum: ['direct', 'group', 'channel'] })
  type!: string;

  @prop({ type: () => [String], default: [] })
  members!: string[];

  @prop({ default: true })
  isActive!: boolean;

  @prop({ default: '' })
  description!: string;

  @prop({ default: 0 })
  unreadCount!: number;
}

export const MessageModel = getModelForClass(Message);
export const ConversationModel = getModelForClass(Conversation);
