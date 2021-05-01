/**
 * User.ts stores the Schema structure of a user
 */

import { model, Schema, Document, CallbackError } from 'mongoose';
import bcrypt from 'bcrypt';
import '../database';

const saltRounds = 14;

export interface IUser extends Document {
  email: string;
  hash: string;
  salt: string;
  images: string[];
  amoutOwing: number;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  isCorrectHash(firstHash: string, callback: any): any;
}

/**
 * The UserSchema stores:
 * -- their email
 * -- their level 2 hash (their password hashed twice)
 * -- their level 1 salt (The salt used for slow-client-side hashing)
 * -- their list of owned images
 * -- their amount owing
 */
const UserSchema: Schema<Document<IUser>> = new Schema({
  sha: { type: String, required: true, unique: true },
  hash: { type: String, required: true, unique: true },
  salt: { type: String, required: true },
  images: { type: [String], required: true },
  amountOwing: { type: Number, required: true, default: 0 },
});

/**
 * @function Creates the user's hash & salt fields before saving it in DB
 * @requires bcrypt
 */
UserSchema.pre<IUser>('save', function (next: (err?: CallbackError) => void) {
  // Check if document is new or a new password has been set
  if (this.isNew || this.isModified('hash')) {
    bcrypt.genSalt(saltRounds, (err, salt: string) => {
      bcrypt.hash(this.hash, salt, (err, firstHash: string) => {
        bcrypt.hash(firstHash, saltRounds, (err, secondHash: string) => {
          this.hash = secondHash;
          this.salt = salt;
          next();
        });
      });
    });
  } else {
    next();
  }
});

/**
 * @function Checks if the level 1 hash provided is correct
 *
 * @param this
 * @param firstHash
 * @param callback
 */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
UserSchema.methods.isCorrectHash = function (this: any, firstHash: string, callback: any) {
  bcrypt.compare(firstHash, this.hash, (err, same) => {
    if (err) {
      callback(err, false);
    } else {
      callback(err, same);
    }
  });
};

const UserObject = model<IUser>('User', UserSchema, 'users');
export { UserObject };
