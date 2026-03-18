let mongoose = require('mongoose');

let roleSchema = mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, 'name khong duoc null'],
      unique: true,
      trim: true,
    },
    description: {
      type: String,
      default: '',
    },
    isDeleted: {
      type: Boolean,
      default: false,
    },
  },
  {
    timestamps: true,
  }
);

module.exports = new mongoose.model('role', roleSchema);
