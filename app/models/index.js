const mongoose = require('mongoose');
const Role = require('./role.model');
mongoose.Promise = global.Promise;

const db = {};

db.mongoose = mongoose;

db.user = require('./user.model');
db.role = require('./role.model');
db.refreshToken = require('./refreshToken.model');
db.resetToken = require('./resetToken.model');
db.emailValidationToken = require('./emailValidationToken.model');

db.ROLES = ['user', 'admin'];

db.initialize = () => {
    Role.estimatedDocumentCount((err, count) => {
        if (!err && count === 0) {
            new Role({
                name: 'user'
            }).save(err => {
                if (err) {
                    console.log('error', err);
                }

                console.log('added "user" to roles collection');
            });

            new Role({
                name: 'admin'
            }).save(err => {
                if (err) {
                    console.log('error', err);
                }

                console.log('added "admin" to roles collection');
            });
        }
    });
};

module.exports = db;