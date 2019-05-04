const multer = require('multer');
const multerS3 = require('multer-s3');
const aws  = require('aws-sdk');

const upload = multer({
    storage: multerS3({
      s3: new aws.S3(),
      bucket: 'chat-application1',
      region : 'us-east-1', 
      acl: 'public-read',
      metadata: function (req, file, cb) {
        cb(null, {fieldName: file.fieldname});
      },
      key: function (req, file, cb) {
        cb(null, Date.now().toString())
      }
    })
  })
  
  module.exports = upload;