let mongoose = require('mongoose');

let userSchema = mongoose.Schema(
  {
    username: {
      type: String,
      required: [true, 'username khong duoc null'],
      unique: true,
      trim: true,
    },
    password: {
      type: String,
      required: [true, 'password khong duoc null'],
    },
    email: {
      type: String,
      required: [true, 'email khong duoc null'],
      unique: true,
      trim: true,
      lowercase: true,
    },
    fullName: {
      type: String,
      default: '',
    },
    avatarUrl: {
      type: String,
      default: 'https://i.sstatic.net/l60Hf.png',
    },
    status: {
      type: Boolean,
      default: false,
    },
    role: {
      type: mongoose.Types.ObjectId,
      ref: 'role',
      required: true,
    },
    loginCount: {
      type: Number,
      default: 0,
      min: 0,
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

module.exports = new mongoose.model('user', userSchema);
