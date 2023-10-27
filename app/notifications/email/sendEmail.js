const { mailchimpKey } = require('../../config/email.config');
const mailchimpTx = require('@mailchimp/mailchimp_transactional')(mailchimpKey);
const handlebars = require('handlebars');
const fs = require('fs');
const path = require('path');

// ref: https://mailchimp.com/developer/transactional/guides/send-first-email/
const sendEmail = async (data) => {
    const { from, to, subject, body, attachments, template, templateData } = data;
    try {
        const messageBody = {
            from_email: from,
            to: [
                {
                    email: to,
                    type: 'to'
                },
            ],
            subject,
            auto_html: true,
            attachments,
        };

        if (body) {
            messageBody.text = body;
        } else if (template) {
            const source = fs.readFileSync(path.join(__dirname, template), 'utf8');
            const compiledTemplate = handlebars.compile(source);

            messageBody.html = compiledTemplate(templateData);
        }

        const response = await mailchimpTx.messages.send({
            message: messageBody,
        });

        return response;
    } catch (error) {
        console.log('[mailchimp][sendMail] error:', error.message);
        return false;
    }
};

module.exports = sendEmail;