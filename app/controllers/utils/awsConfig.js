const AWS = require('aws-sdk');
const { v4: uuidv4 } = require('uuid');

exports.uploadS3 = async (file) => {

    const key = `${uuidv4()}`;

    const s3 = new AWS.S3({
        accessKeyId: process.env.AWS_ACCESS_KEY_ID,
        secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY
    });
    const acceptedImageTypes = ['image/jpeg', 'image/jpg', 'image/png'];
    const params = {
        Bucket: process.env.AWS_PUBLIC_S3_BUCKET,
        Key: `uploads/${key}-${file.originalname}`,
        Body: file.buffer,
        ContentType: acceptedImageTypes.includes(file.mimetype) ? 'image/jpeg,image/jpg,image/png': 'application/pdf',
        ACL: 'public-read'
    };
    const result = s3.upload(params).promise();
    return result;
};