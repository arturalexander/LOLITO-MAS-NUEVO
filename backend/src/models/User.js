const mongoose = require('mongoose');

const userSchema = new mongoose.Schema({
  facebookUserId: {
    type: String,
    required: true,
    unique: true
  },
  email: {
    type: String,
    required: false,
    sparse: true  // Permite múltiples null
  },
  pageId: {
    type: String,
    required: true
  },
  pageName: {
    type: String,
    required: true
  },
  pageAccessToken: {
    type: String,
    required: true
  },
  instagramAccountId: {
    type: String,
    required: false
  },
  instagramUsername: {
    type: String,
    required: false
  },
  userAccessToken: {
    type: String,
    required: true
  },
  tokenExpiry: {
    type: Date,
    required: true
  }
}, {
  timestamps: true
});

module.exports = mongoose.model('User', userSchema);