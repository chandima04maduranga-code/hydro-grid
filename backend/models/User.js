const mongoose = require('mongoose');

// Roles inside a company. Platform admins sit above all companies.
const COMPANY_ROLES = ['admin', 'farm_manager', 'field_officer'];
const ROLES = ['platform_admin', ...COMPANY_ROLES];
const STATUSES = ['pending', 'active', 'rejected', 'disabled'];
const LANGUAGES = ['en', 'si'];

const UserSchema = new mongoose.Schema({
  company: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Company',
    // Every user except a platform admin belongs to exactly one company
    required: function requiredUnlessPlatformAdmin() {
      return this.role !== 'platform_admin';
    },
    index: true
  },
  name: { type: String, required: true, trim: true, maxlength: 100 },
  email: { type: String, required: true, unique: true, lowercase: true, trim: true },
  phone: { type: String, trim: true, default: '' },
  password: { type: String, required: true, select: false },
  role: { type: String, enum: ROLES, default: 'field_officer' },
  status: { type: String, enum: STATUSES, default: 'pending' },
  preferredLanguage: { type: String, enum: LANGUAGES, default: 'en' },
  reviewedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  reviewedAt: { type: Date },
  lastLoginAt: { type: Date }
}, { timestamps: true });

// Never expose the password hash, even if it was explicitly selected
UserSchema.set('toJSON', {
  transform: (doc, ret) => {
    delete ret.password;
    delete ret.__v;
    return ret;
  }
});

UserSchema.statics.ROLES = ROLES;
UserSchema.statics.COMPANY_ROLES = COMPANY_ROLES;
UserSchema.statics.STATUSES = STATUSES;
UserSchema.statics.LANGUAGES = LANGUAGES;

module.exports = mongoose.model('User', UserSchema);
