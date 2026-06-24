import { prop, getModelForClass, pre } from '@typegoose/typegoose';
import { TimeStamps } from '@typegoose/typegoose/lib/defaultClasses';
import bcrypt from 'bcryptjs';

export enum UserRole {
  SUPERADMIN = 'superadmin',
  ADMIN = 'admin',
  VENDEDOR = 'vendedor',
  CLIENTE = 'cliente',
}

@pre<User>('save', async function () {
  if (this.isModified('password')) {
    this.password = await bcrypt.hash(this.password, 12);
  }
})
export class User extends TimeStamps {
  @prop({ required: true, trim: true })
  name!: string;

  @prop({ required: true, unique: true, lowercase: true, trim: true })
  email!: string;

  @prop({ required: true, minlength: 6 })
  password!: string;

  @prop({ enum: UserRole, default: UserRole.CLIENTE })
  role!: UserRole;

  @prop({ default: true })
  isActive!: boolean;

  @prop({ trim: true, default: '' })
  bio!: string;

  @prop({ trim: true, default: '' })
  avatar!: string;

  @prop({ trim: true, default: '' })
  discord!: string;

  @prop({ trim: true, default: '' })
  country!: string;

  @prop({ trim: true, default: '' })
  phone!: string;

  @prop({ default: null })
  resetToken!: string | null;

  @prop({ default: null })
  resetTokenExpiry!: Date | null;
}

export const UserModel = getModelForClass(User);
