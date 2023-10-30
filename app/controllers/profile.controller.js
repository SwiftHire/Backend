const { BAD_REQUEST, NOT_FOUND, INTERNAL_SERVER_ERROR } = require('../utils/errorMessages');

const Profile = require('../models/profile.model');
const Job = require('../models/job.model');

// Create or Update Profile
exports.upsertProfile = async (req, res) => {
    try {
        if (!req.body.userId) {
            return res.status(BAD_REQUEST.status).send({
                message: `${BAD_REQUEST.message} Invalid user!`
            });
        }

        console.log('[upsertProfile] req.body: ', req.body);

        let profile = await Profile.findOne({ user: req.body.userId });

        if (!profile) {
            profile = new Profile({ user: req.body.userId, ...req.body });
            await profile.save();
            return res.status(201).send({
                message: 'Profile created successfully!',
                profile
            });
        }

        // Update profile if it already exists
        profile = await Profile.findByIdAndUpdate(profile._id, req.body, { new: true });
        return res.status(200).send({
            message: 'Profile updated successfully!',
            profile
        });

    } catch (error) {
        console.log('[upsertProfile] Error: ', error);
        return res.status(INTERNAL_SERVER_ERROR.status).send({
            message: INTERNAL_SERVER_ERROR.message
        });
    }
};

// Get own profile
exports.getOwnProfile = async (req, res) => {
    try {
        if (!req.body.userId) {
            return res.status(BAD_REQUEST.status).send({
                message: `${BAD_REQUEST.message} Invalid user!`
            });
        }

        const profile = await Profile.findOne({ user: req.body.userId });

        if (!profile) {
            return res.status(NOT_FOUND.status).send({
                message: 'Profile not found!'
            });
        }

        res.status(200).send(profile);

    } catch (error) {
        console.log('[getOwnProfile] Error: ', error);
        return res.status(INTERNAL_SERVER_ERROR.status).send({
            message: INTERNAL_SERVER_ERROR.message
        });
    }
};
