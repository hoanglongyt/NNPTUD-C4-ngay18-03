var express = require('express');
var router = express.Router();
let mongoose = require('mongoose');
let userModel = require('../schemas/users');
let roleModel = require('../schemas/roles');
const jwt = require('jsonwebtoken');
const fs = require('fs');
const path = require('path');
const authMiddleware = require('../utils/authHandler');

const privateKey = fs.readFileSync(path.join(__dirname, '../private.pem'), 'utf8');

router.get('/me', authMiddleware, async function (req, res, next) {
  try {
    let userId = req.user.id;
    let user = await userModel.findById(userId).populate({
      path: 'role',
      select: 'name description'
    });

    if (!user || user.isDeleted) {
      return res.status(404).send({ message: 'User not found' });
    }

    // Không trả về password trong response để bảo mật
    let userResponse = user.toObject();
    delete userResponse.password;

    res.send(userResponse);
  } catch (error) {
    res.status(500).send(error);
  }
});

router.get('/', async function (req, res, next) {
  let result = await userModel.find(
    {
      isDeleted: false
    }
  ).populate({
    path: 'role',
    select: 'name description'
  });
  res.send(result);
});

router.get('/:id', async function (req, res, next) {
  try {
    let id = req.params.id;
    let result = await userModel.findById(id).populate({
      path: 'role',
      select: 'name description'
    });
    if (!result || result.isDeleted) {
      res.status(404).send({
        message: 'ID NOT FOUND'
      });
    } else {
      res.send(result);
    }
  } catch (error) {
    res.status(404).send({
      message: 'ID NOT FOUND'
    });
  }
});

router.post('/', async function (req, res, next) {
  try {
    if (!mongoose.Types.ObjectId.isValid(req.body.role)) {
      return res.status(400).send({
        message: 'ROLE_ID_INVALID'
      });
    }

    let role = await roleModel.findById(req.body.role);
    if (!role || role.isDeleted) {
      return res.status(400).send({
        message: 'ROLE_NOT_FOUND'
      });
    }

    let newUser = new userModel({
      username: req.body.username,
      password: req.body.password,
      email: req.body.email,
      fullName: req.body.fullName,
      avatarUrl: req.body.avatarUrl,
      status: req.body.status,
      role: req.body.role,
      loginCount: req.body.loginCount
    });
    await newUser.save();
    res.send(newUser);
  } catch (error) {
    res.status(400).send(error);
  }
});

router.put('/:id', async function (req, res, next) {
  try {
    let id = req.params.id;
    let user = await userModel.findById(id);
    if (!user || user.isDeleted) {
      return res.status(404).send({
        message: 'ID NOT FOUND'
      });
    }

    if (req.body.role) {
      if (!mongoose.Types.ObjectId.isValid(req.body.role)) {
        return res.status(400).send({
          message: 'ROLE_ID_INVALID'
        });
      }

      let role = await roleModel.findById(req.body.role);
      if (!role || role.isDeleted) {
        return res.status(400).send({
          message: 'ROLE_NOT_FOUND'
        });
      }
    }

    let result = await userModel.findByIdAndUpdate(
      id,
      req.body,
      {
        new: true
      }
    );
    res.send(result);
  } catch (error) {
    res.status(400).send(error);
  }
});

router.delete('/:id', async function (req, res, next) {
  try {
    let id = req.params.id;
    let result = await userModel.findById(id);
    if (!result || result.isDeleted) {
      res.status(404).send({
        message: 'ID NOT FOUND'
      });
    } else {
      result.isDeleted = true;
      await result.save();
      res.send(result);
    }
  } catch (error) {
    res.status(404).send({
      message: 'ID NOT FOUND'
    });
  }
});

router.post('/enable', async function (req, res, next) {
  try {
    let email = req.body.email;
    let username = req.body.username;

    let user = await userModel.findOne({
      email: email,
      username: username,
      isDeleted: false
    });

    if (!user) {
      return res.status(404).send({
        message: 'USER NOT FOUND'
      });
    }

    user.status = true;
    await user.save();
    res.send(user);
  } catch (error) {
    res.status(400).send(error);
  }
});

router.post('/disable', async function (req, res, next) {
  try {
    let email = req.body.email;
    let username = req.body.username;

    let user = await userModel.findOne({
      email: email,
      username: username,
      isDeleted: false
    });

    if (!user) {
      return res.status(404).send({
        message: 'USER NOT FOUND'
      });
    }

    user.status = false;
    await user.save();
    res.send(user);
  } catch (error) {
    res.status(400).send(error);
  }
});

router.post('/login', async function (req, res, next) {
  try {
    let { username, password } = req.body;
    let user = await userModel.findOne({ username: username, isDeleted: false });
    if (!user || user.password !== password) {
      return res.status(401).send({ message: 'Invalid username or password' });
    }
    
    let payload = { id: user._id, username: user.username, role: user.role };
    let token = jwt.sign(payload, privateKey, { algorithm: 'RS256', expiresIn: '1h' });
    
    res.send({ user, token });
  } catch (error) {
    res.status(500).send(error);
  }
});

router.post('/changepassword', authMiddleware, async function (req, res, next) {
  try {
    let { oldpassword, newpassword } = req.body;
    let userId = req.user.id;
    
    // validate newpassword (e.g., minimum 6 chars, alphanumeric)
    if (!newpassword || newpassword.length < 6) {
      return res.status(400).send({ message: 'New password must be at least 6 characters long' });
    }
    
    let user = await userModel.findById(userId);
    if (!user || user.isDeleted) {
      return res.status(404).send({ message: 'User not found' });
    }
    
    if (user.password !== oldpassword) {
      return res.status(400).send({ message: 'Incorrect old password' });
    }
    
    user.password = newpassword;
    await user.save();
    
    res.send({ message: 'Password changed successfully' });
  } catch (error) {
    res.status(500).send(error);
  }
});

module.exports = router;
