/**
 * This @file clears all currently used ArangoDB collections because I'm lazy
 */

import db from '../database';

db.collection('Labels').truncate();
db.collection('LabelOf').truncate();
db.collection('Images').truncate();
