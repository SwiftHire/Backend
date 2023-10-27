const {google} = require('googleapis');
const axios = require('axios');
const { socialLoginUser } = require('../utils/socialLogin');

const { INTERNAL_SERVER_ERROR, BAD_REQUEST } = require('../utils/errorMessages');
const GOOGLE_CLIENT_ID = process.env.GOOGLE_CLIENT_ID;
const GOOGLE_CLIENT_SECRET = process.env.GOOGLE_CLIENT_SECRET;
const LINKEDIN_KEY = process.env.LINKEDIN_KEY;
const LINKEDIN_SECRET = process.env.LINKEDIN_SECRET;
const LINKEDIN_STATE = process.env.LINKEDIN_STATE;
const GOOGLE_CALLBACK_URL=process.env.GOOGLE_CALLBACK_URL;
const LINKEDIN_CALLBACK_URL=process.env.LINKEDIN_CALLBACK_URL;
const LINKEDIN_AUTHORIZATION_URL = "https://www.linkedin.com/oauth/v2/authorization";
const LINKEDIN_ACCESS_TOKEN_URL = "https://www.linkedin.com/oauth/v2/accessToken";
const LINKEDIN_BASE_URL = "https://api.linkedin.com";

const GOOGLE_USER_INFO_URL = "https://www.googleapis.com/oauth2/v3/userinfo?access_token";

exports.googleAuth = async (req, res) => {

    try {  
        const oauth2Client = new google.auth.OAuth2(
            GOOGLE_CLIENT_ID,
            GOOGLE_CLIENT_SECRET,
            GOOGLE_CALLBACK_URL
        );

        // generate a url that asks permissions for Blogger and Google Calendar scopes
        const scopes = [
            'https://www.googleapis.com/auth/contacts.readonly',
            'https://www.googleapis.com/auth/userinfo.email',
            'https://www.googleapis.com/auth/userinfo.profile',
        ];
        const url = oauth2Client.generateAuthUrl({
        // 'online' (default) or 'offline' (gets refresh_token)
        access_type: 'offline',
        
        // If you only need one scope you can pass it as a string
        scope: scopes
        });
        
        return res.json({
            status: true,
            redirect_url: url,
        });
    } catch (err) {
        console.log('[Google Login Url] Error: ', err);
        return res.status(INTERNAL_SERVER_ERROR.status).send({
            message: INTERNAL_SERVER_ERROR.message
        });
    }
};


exports.googleVerifyCode = async (req, res) => {

    const code = req.body.code;

    if (!code) {
        return res.status(BAD_REQUEST.status).send({
            message: `${BAD_REQUEST.message} Code is required!`
        });
    }

    try {
        const oauth2Client = new google.auth.OAuth2(
            GOOGLE_CLIENT_ID,
            GOOGLE_CLIENT_SECRET,
            GOOGLE_CALLBACK_URL
        );

        // This will provide an object with the access_token and refresh_token.
        const {tokens} = await oauth2Client.getToken(code)
        oauth2Client.setCredentials(tokens);
        
        const userProfile = await axios.get(`${GOOGLE_USER_INFO_URL}=${tokens.access_token}`)

        if (userProfile.status === 200) {

            const name = userProfile.data.given_name + " " + userProfile.data.family_name;
            const email = userProfile.data.email;
            const token = tokens.access_token;
        
            const socialLoginUserObj = await socialLoginUser(name, email, token)
            return res.send(socialLoginUserObj);
        }
        
    } catch (err) {
        console.log('[Google Call Back] Error: ', err);
        return res.status(INTERNAL_SERVER_ERROR.status).send({
            message: INTERNAL_SERVER_ERROR.message
        });
    }
};

exports.linkedinAuth = async (req, res) => {
   
    try {  
        
        const linkedinUrl = `${LINKEDIN_AUTHORIZATION_URL}?response_type=code&state=${LINKEDIN_STATE}&scope=r_liteprofile%20r_emailaddress&client_id=${LINKEDIN_KEY}&redirect_uri=${LINKEDIN_CALLBACK_URL}`
        return res.json({
            status: true,
            redirect_url: linkedinUrl,
        });
    } catch (err) {
        console.log('[Linkedin Login Url] Error: ', err);
        return res.status(INTERNAL_SERVER_ERROR.status).send({
            message: INTERNAL_SERVER_ERROR.message
        });
    }
};


exports.linkedinVerifyCode = async (req, res) => {

    const code = req.body.code;

    if (!code) {
        return res.status(BAD_REQUEST.status).send({
            message: `${BAD_REQUEST.message} Code is required!`
        });
    }

    try {
        const linkedinAccessTokenUrl = `${LINKEDIN_ACCESS_TOKEN_URL}?grant_type=authorization_code&code=${code}&redirect_uri=${LINKEDIN_CALLBACK_URL}&client_id=${LINKEDIN_KEY}&client_secret=${LINKEDIN_SECRET}`

        const accessTokenResponse = await axios.post(linkedinAccessTokenUrl);
        
        if (accessTokenResponse.status === 200) {
            const linkedinProfile = await axios.get(`${LINKEDIN_BASE_URL}/v2/me`, {
               headers: {"Authorization": `Bearer ${accessTokenResponse.data.access_token}`}
            })

            const linkedinEmail = await axios.get(`${LINKEDIN_BASE_URL}/v2/emailAddress?q=members&projection=(elements*(handle~))`, {
               headers: {"Authorization": `Bearer ${accessTokenResponse.data.access_token}`}
            })
            if (linkedinProfile.status === 200 && linkedinEmail.status === 200) {
                const name = linkedinProfile.data.localizedFirstName + " " + linkedinProfile.data.localizedLastName;
                const email = linkedinEmail.data.elements[0]['handle~'].emailAddress;
                const token = accessTokenResponse.data.access_token
                const socialLoginUserObj = await socialLoginUser(name, email, token)
                return res.send(socialLoginUserObj);
            }
        }        
    } catch (err) {
        console.log('[Linkedin Call Back] Error: ', err);
        return res.status(INTERNAL_SERVER_ERROR.status).send({
            message: INTERNAL_SERVER_ERROR.message
        });
    }
};
