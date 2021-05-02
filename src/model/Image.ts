/**
 * Image.ts stores the Schema structure of an image
 */

import { model, Schema, Document } from 'mongoose';
import '../database';

export interface IImage extends Document {
  id: string;
  author: string;
  url: string;
  labels: string[];
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
  author: { type: String, required: true },
  url: { type: String, required: true, unique: true },
  date: { type: Date, required: true, default: Date.now },
  labels: { type: [String], required: true },
});

const ImageObject = model<IImage>('Image', ImageSchema, 'images');
export { ImageObject };
