const mongoose = require('mongoose');
const config = require('../config/auth.config');
const { v4: uuidv4 } = require('uuid');
const bcrypt = require('bcryptjs');

const ResetTokenSchema = new mongoose.Schema({
    token: String,
    user: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
    },
    expiryDate: Date,
    emailStatus: Boolean,
}, {
    timestamps: true,
    collection: 'resetTokens',
});

ResetTokenSchema.statics.createToken = async function (user) {
    const expiredAt = new Date();

    expiredAt.setSeconds(
        expiredAt.getSeconds() + config.passwordResetExpiration
    );

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
        expiryDate: expiredAt.getTime(),
        emailStatus: false,
    });

    const resetToken = await tokenRawObj.save();

    return resetToken;
};

ResetTokenSchema.statics.verifyExpiration = (token) => {
    return token.expiryDate.getTime() < new Date().getTime();
};

const ResetToken = mongoose.model('ResetToken', ResetTokenSchema);

module.exports = ResetToken;
