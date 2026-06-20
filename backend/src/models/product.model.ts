import { prop, getModelForClass } from '@typegoose/typegoose';
import { TimeStamps } from '@typegoose/typegoose/lib/defaultClasses';

export class PricePlan extends TimeStamps {
  @prop({ required: true, trim: true })
  duration!: string;

  @prop({ required: true, min: 0 })
  price!: number;
}

export class Product extends TimeStamps {
  @prop({ required: true, trim: true })
  name!: string;

  @prop({ required: true, trim: true })
  description!: string;

  @prop({ required: true, trim: true })
  category!: string;

  @prop({ type: () => [PricePlan], default: [] })
  prices!: PricePlan[];

  @prop({ default: 999 })
  stock!: number;

  @prop({ default: true })
  isActive!: boolean;

  @prop({ trim: true, default: '' })
  badge!: string;

  @prop({ trim: true, default: 'info' })
  badgeType!: string;

  @prop({ trim: true, default: 'fas fa-box' })
  icon!: string;

  @prop({ default: '' })
  image!: string;

  @prop({ default: 0 })
  sales!: number;
}

export const ProductModel = getModelForClass(Product);
