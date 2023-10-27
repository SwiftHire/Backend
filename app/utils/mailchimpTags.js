const axios = require('axios');

const MAILCHIMP_AUDIENCE_LIST_ID = process.env.MAILCHIMP_AUDIENCE_LIST_ID;  //audience list id
const MAILCHIMP_AUDIENCE_API_KEY = process.env.MAILCHIMP_AUDIENCE_API_KEY; //audience api key

async function mailchimpTags(mailchimpData) {

    const {email, tag_name} = mailchimpData;

    try {
         // get a specific mailchimp list member
         const mailchimpConfig = {
            method: 'get',
            url: `https://us13.api.mailchimp.com/3.0/lists/${MAILCHIMP_AUDIENCE_LIST_ID}/members/${email}`,
            headers: {
                'Content-Type': 'application/json',
                Authorization: `Bearer ${MAILCHIMP_AUDIENCE_API_KEY}`
            },
        };
        
        try {
            const mailchimpResponse = await axios(mailchimpConfig);
            // Handle successful response here
            if (mailchimpResponse.status === 200) {
            
                const tagsConfig = {
                    method: 'post',
                    url: `https://us13.api.mailchimp.com/3.0/lists/${MAILCHIMP_AUDIENCE_LIST_ID}/members/${mailchimpResponse.data.id}/tags`,
                    headers: {
                        'Content-Type': 'application/json',
                        Authorization: `Bearer ${MAILCHIMP_AUDIENCE_API_KEY}`
                    },
                    data: {
                            tags: [{ name: tag_name, status: 'active' }] // Replace 'your_tag_name' with your actual tag
                        }
                    };
    
                    await axios(tagsConfig);
                    
            }
          } catch (error) {
            if (error.response && error.response.status === 404) {
              // Handle 404 error (Resource Not Found) here
              console.error('Resource Not Found:', error.response.data);
            } else {
              // Handle other errors
              console.error('Error:', error.message);
            }
          }
       
    } catch (error) {
        console.error(`Error occurred while creating mailchimp tag for tag_name: ${tag_name}`, error);
        return null;
    }
}

async function unsubscribeUser(email) {

    try {
        
        const url = `https://us13.api.mailchimp.com/3.0/lists/${MAILCHIMP_AUDIENCE_LIST_ID}/members/${email}`;
        const response = await axios.patch(
                url,
                {
                    status: 'unsubscribed',
                },
                {
                    headers: {
                        'Authorization': `apikey ${MAILCHIMP_AUDIENCE_API_KEY}`,
                        'Content-Type': 'application/json',
                    },
                }
            );
    
        if (response.status === "unsubscribed"){
            console.log("Unsubscribed user mailing list successfully")
        }     
       
    } catch (error) {
        console.error(`Error occurred while unsubscribing user with email: ${email}`, error.message);
        console.error(`Error `, error.stack);
        return null;
    }
}

module.exports = {
    mailchimpTags,
    unsubscribeUser,
};
