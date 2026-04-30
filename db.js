const Datastore = require('nedb-promises');
const path = require('path');

const users = Datastore.create({ filename: path.join(__dirname, 'data_users.db'), autoload: true });
const files = Datastore.create({ filename: path.join(__dirname, 'data_files.db'), autoload: true });

// Unique indexes
users.ensureIndex({ fieldName: 'email', unique: true });
users.ensureIndex({ fieldName: 'username', unique: true });

module.exports = { users, files };
