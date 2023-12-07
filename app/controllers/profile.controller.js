const { BAD_REQUEST, NOT_FOUND, INTERNAL_SERVER_ERROR } = require('../utils/errorMessages');

const Profile = require('../models/profile.model');
const Job = require('../models/job.model');



const { uploadS3 } = require('./utils/awsConfig');


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
        if (!req.query.userId) {
            return res.status(BAD_REQUEST.status).send({
                message: `${BAD_REQUEST.message} Invalid user!`
            });
        }

        const profile = await Profile.find({ user: req.query.userId });

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

exports.processDocument = async (req, res) => {

    const userId = req.query.userId
    const file = req.file;

    if (!userId) {
        return res.status(BAD_REQUEST.status).send({
            message: `${BAD_REQUEST.message} Invalid user!`
        });
    }

    if (!file) {
        return res.status(400).json({
            error: 'No file provided. Please upload a PDF file.'
        });
    }

    const acceptedImageTypes = ['application/pdf'];
    if (!acceptedImageTypes.includes(file.mimetype)) {
        return res.status(400).json({
            error: 'Invalid file type. Only PDF files are accepted.'
        });
    }

    try {
        const uploadResult = await uploadS3(file);
        const profile = await Profile.findOne({ user: userId });
        if (profile) {
            profile.resume = uploadResult.Location;
            await profile.save();
            console.log('info', `File successfully uploaded to S3: ${uploadResult.Location}`);
            res.json({
                success: true,
                message: 'File uploaded successfully',
                uploadLocation: uploadResult.Location
            });
        } else {
            return res.status(404).json({
                error: 'User not found'
            });
        }
    } catch (error) {
        console.log(`Error uploading file: ${error.message}`);
        res.status(500).json({
            error: 'An error occurred while uploading the file'
        });
    }
};  
