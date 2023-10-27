const axios = require('axios');
const config = require('../config/auth.config');

const addCredits = async (userId, credits) => {
    try {
        const serverToken = Buffer.from(config.paymentServerToken).toString('base64');
        const { status, data } = await axios.post(`${config.paymentUrl}/user-credits`, {
            userId,
            totalCredits: credits,
            planId: 'free',
        }, {
            headers: {
                'mg-server-token': serverToken,
            },
            validateStatus: () => true,
        });

        if (status !== 200 || !data?.remainingCredits) {
            console.log(`[addCredits] Error adding free credits to user ${userId}. Req status: ${status}, data: ${JSON.stringify(data)}`);
            return false;
        }

        console.log(`[addCredits] Added ${credits} free credits to user ${userId}. Remaining credits: ${data.remainingCredits}`);
        return true;
    } catch (e) {
        console.log(`[addCredits] error ${e.message}`);
        return false;
    }
};

module.exports = addCredits;