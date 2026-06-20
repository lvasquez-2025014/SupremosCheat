import { prop, getModelForClass, Ref } from '@typegoose/typegoose';
import { TimeStamps } from '@typegoose/typegoose/lib/defaultClasses';
import { User } from './user.model';

export class Notification extends TimeStamps {
  @prop({ required: true, ref: () => User })
  user!: Ref<User>;

  @prop({ required: true, trim: true })
  title!: string;

  @prop({ required: true, trim: true })
  message!: string;

  @prop({ default: 'info', enum: ['info', 'success', 'warning', 'error'] })
  type!: string;

  @prop({ default: false })
  isRead!: boolean;

  @prop({ default: '' })
  link!: string;

  @prop({ default: 'fas fa-bell' })
  icon!: string;

  @prop({ default: '' })
  targetRole!: string;
}

export const NotificationModel = getModelForClass(Notification);
