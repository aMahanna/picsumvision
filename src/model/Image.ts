/**
 * Image.ts stores the Schema structure of an image
 */

import { model, Schema, Document } from 'mongoose';
import '../database';

export interface IImage extends Document {
  id: string;
  price: string;
  labels: string[];
  stock: number;
  date: Date;
}

/**
 * The ImageSchema stores:
 * -- their ID
 * -- their date of entry
 * -- their labels
 * -- their stock
 * -- their price
 */
const ImageSchema: Schema<Document<IImage>> = new Schema({
  id: { type: String, required: true, unique: true },
  date: { type: Date, required: true, default: Date.now },
  labels: { type: [String], required: true },
  stock: { type: Number, required: true, default: 0 },
  price: { type: Number, required: true, default: 0 },
});

const ImageObject = model<IImage>('Image', ImageSchema, 'images');
export { ImageObject };
