const { BAD_REQUEST, NOT_FOUND, INTERNAL_SERVER_ERROR } = require('../utils/errorMessages');
const { user: User } = require('../models');
const { mailchimpTags, unsubscribeUser } = require('../utils/mailchimpTags');

exports.getMe = async (req, res) => {
    try {
        if (!req.userId) {
            return res.status(BAD_REQUEST.status).send({
                message: `${BAD_REQUEST.message} Invalid user!`
            });
        }

        const user = await User.findById(req.userId)
            .populate('roles', '-__v')
            .exec();
            // const credits = await Credits.find({ userId: req.userId });

        if (!user) {
            return res.status(NOT_FOUND.status).send({
                message: NOT_FOUND.message
            });
        }

        const authorizedRoles = user.roles.map((role) => 'ROLE_' + role.name.toUpperCase());

        res.status(200).send({
            user: {
                id: user._id,
                name: user.name,
                email: user.email,
                roles: authorizedRoles,
            },
            message: 'User retrieved successfully!',
        });
    } catch (error) {
        console.log('[getMe] Error: ', error);
        return res.status(INTERNAL_SERVER_ERROR.status).send({
            message: INTERNAL_SERVER_ERROR.message
        });
    }
};

exports.deleteUser = async (req, res) => {
    
    try {
        if (!req.userId) {
            return res.status(BAD_REQUEST.status).send({
                message: `${BAD_REQUEST.message} Invalid user!`
            });
        }

        const user = await User.findById(req.userId);
        if (!user || user.isArchived) {
            return res.status(NOT_FOUND.status).send({
                message: `User ${NOT_FOUND.message}`
            });
        }
        user.isArchived = true;
        await user.save();

        //unsubscribe the user from mailing list
        await unsubscribeUser(user.email);

        // create deleted users tag
        const mailchimpData = {
            email: user.email,
            tag_name: 'deleted_users'
        };

        await mailchimpTags(mailchimpData);

        res.status(200).send({
            status: true, 
            message: 'User deleted successfully!',
        });
    } catch (error) {
        console.log('[Delete User] Error: ', error.message);
        console.log('[Delete User] Error: ', error.stack);
        return res.status(INTERNAL_SERVER_ERROR.status).send({
            message: INTERNAL_SERVER_ERROR.message
        });
    }
};

exports.getUsers = async (req, res) => {
    try {
        
        const users = await User.find();
        if (!users) {
            return res.status(NOT_FOUND.status).send({
                message: NOT_FOUND.message
            });
        }

        res.status(200).send({
            users: users,
            message: 'Users retrieved successfully!',
        });
    } catch (error) {
        console.log('[getUsers] Error: ', error);
        return res.status(INTERNAL_SERVER_ERROR.status).send({
            message: INTERNAL_SERVER_ERROR.message
        });
    }
};
