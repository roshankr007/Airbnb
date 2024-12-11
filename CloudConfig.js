 /*We have created this file so that our project can access our cloud account.*/

 const cloudinary = require('cloudinary').v2;
 const { CloudinaryStorage } = require('multer-storage-cloudinary');

 cloudinary.config({// These three names "cloud_name, api_key, api_secret" will always be same if written inside config.
    cloud_name: process.env.CLOUD_NAME,
    api_key: process.env.CLOUD_API_KEY,
    api_secret: process.env.CLOUD_API_SECRET,
 });

//Defining storage inside cloudinary
 const storage = new CloudinaryStorage({
    cloudinary: cloudinary,
    params: {
      folder: 'homely_DEV',
      allowedFormats: ["png", "jpg", "jpeg", "avif"],
    },
  });

  module.exports = {// These will be used inside routes -> listing.js
    cloudinary,
    storage,
  };