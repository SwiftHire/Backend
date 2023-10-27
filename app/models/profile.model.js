const mongoose = require('mongoose');

const profileSchema = new mongoose.Schema({
    user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    resume: { type: String }, // URL to resume file
    skills: [String],
    experience: [{
        title: String,
        company: String,
        years: Number,
    }],
    education: [{
        degree: String,
        institution: String,
        year: Number,
    }],
});

module.exports = mongoose.model('Profile', profileSchema);
