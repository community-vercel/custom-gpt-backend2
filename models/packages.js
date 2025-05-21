const mongoose = require('mongoose');

const packageSchema = new mongoose.Schema({
    packageId: { type: String, required: true, unique: true },
    name: { type: String, required: true },
    price: { type: Number, required: true },
    currency: { type: String, required: true, default: 'usd' },
    description: { type: String },
    billingPeriod: { type: String, enum: ['month', 'year'], default: 'month' },
    features: { type: [String], default: [] },
    isActive: { type: Boolean, default: true },
    stripePriceId: { type: String, required: true }, // Store Stripe Price ID

    createdAt: { type: Date, default: Date.now },
  });
  module.exports = mongoose.model('Package', packageSchema);
