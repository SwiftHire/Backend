const mongoose = require('mongoose');
const config = require('../config/auth.config');
const { v4: uuidv4 } = require('uuid');
const bcrypt = require('bcryptjs');

const EmailValidationTokenSchema = new mongoose.Schema({
    token: String,
    user: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
    },
}, {
    timestamps: true,
    collection: 'emailValidationTokenSchema',
});

EmailValidationTokenSchema.statics.createValidationToken = async function (user) {
    // URL friendly base64 encoded date string
    const base64Date = Buffer.from(Date())
        .toString('base64')
        .replace(/\+/g, '-')
        .replace(/\//g, '_')
        .replace(/=+$/, '');

    const dateIdHash = bcrypt.hashSync(base64Date + user._id, config.bcryptSalt);
    const uuidDateIdHashToken = uuidv4() + '-' + dateIdHash;

    const tokenRawObj = new this({
        token: uuidDateIdHashToken,
        user: user._id,
    });

    const validationToken = await tokenRawObj.save();

    return validationToken;
};

const EmailValidationToken = mongoose.model('EmailValidationToken', EmailValidationTokenSchema);

module.exports = EmailValidationToken;
