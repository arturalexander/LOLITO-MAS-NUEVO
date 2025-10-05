// backend/src/models/UserProfile.js
const mongoose = require('mongoose');

const userProfileSchema = new mongoose.Schema({
  email: {
    type: String,
    required: true,
    unique: true,
    lowercase: true,
    trim: true,
  },
  password: {
    type: String,
    required: true,
  },
  name: {
    type: String,
    required: true,
  },
  // Configuración de marca
  brandColors: {
    color1: {
      type: String,
      default: '#0077b6',
    },
    color2: {
      type: String,
      default: '#00b4d8',
    },
  },
  brandFont: {
    type: String,
    default: 'Inter',
  },
  brandLogoUrl: {
    type: String,
    default: null,
  },
  // Imagen de marca/contacto que se añade al carrusel
  brandImageUrl: {
    type: String,
    default: null,
  },
  // Relación con Facebook/Instagram (opcional)
  facebookUserId: {
    type: String,
    default: null,
  },
  pageId: {
    type: String,
    default: null,
  },
  pageName: {
    type: String,
    default: null,
  },
  pageAccessToken: {
    type: String,
    default: null,
  },
  instagramAccountId: {
    type: String,
    default: null,
  },
  instagramUsername: {
    type: String,
    default: null,
  },
  userAccessToken: {
    type: String,
    default: null,
  },
  tokenExpiry: {
    type: Date,
    default: null,
  },
}, {
  timestamps: true,
});

module.exports = mongoose.model('UserProfile', userProfileSchema);