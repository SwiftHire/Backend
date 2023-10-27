const mongoose = require('mongoose');

const User = mongoose.model(
    'User',
    new mongoose.Schema({
        name: String,
        email: String,
        password: String,
        userType: { type: String, enum: ['employer', 'applicant'], required: true },
        isArchived: {
            type: Boolean,
            default: false,
        },
        roles: [
            {
                type: mongoose.Schema.Types.ObjectId,
                ref: 'Role'
            }
        ],
        emailVerification: {
            type: String,
            enum: ['pending', 'verified'],
            default: 'pending',
        },
    }, {
        timestamps: true,
        collection: 'users',
    })
);

module.exports = User;
