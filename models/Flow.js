const mongoose = require('mongoose');

// models/Flow.js
const flowSchema = new mongoose.Schema({
    userId: {
        type: String, // use String instead of ObjectId
        required: true,
        ref: 'User'
      },
    name: {
      type: String,
      required: true,
      trim: true
    },
    nodes: {
      type: Array,
      required: true
    },
    edges: {
      type: Array,
      required: true
    }
  }, { 
    timestamps: true,
    // Add this to prevent the duplicate key error
    autoIndex: false // We'll create the index manually after checking
  });
  
  // Create index manually only if it doesn't exist
  flowSchema.index({ userId: 1, name: 1 }, { 
    unique: true,
    partialFilterExpression: { 
      name: { $exists: true, $gt: '' } 
    }
  });
  
  module.exports = mongoose.model('Flow', flowSchema);