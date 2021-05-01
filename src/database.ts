/**
 * database.ts is in charge of connecting to MongoDB through Mongoose
 * @requires A valid MONGO_URI Environment Variable
 */

import mongoose from 'mongoose';

if (process.env.NODE_ENV !== 'production') {
  // eslint-disable-next-line global-require, @typescript-eslint/no-var-requires
  require('dotenv').config();
}

const mongo_uri: string = process.env.MONGO_URI!;

// Set mongoose configurations.
mongoose.set('useNewUrlParser', true);
mongoose.set('useFindAndModify', false);
mongoose.set('useCreateIndex', true);

// Connect to MongoDB instance.
mongoose
  .connect(mongo_uri, {
    useNewUrlParser: true,
    useUnifiedTopology: true,
    useFindAndModify: false,
  })
  .then(() => console.log('Database Connected Successfully')) // eslint-disable-line no-console
  .catch(err => {
    console.error(err); // eslint-disable-line no-console
  });
