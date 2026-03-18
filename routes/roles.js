var express = require('express');
var router = express.Router();
let roleModel = require('../schemas/roles');
let userModel = require('../schemas/users');

router.get('/', async function (req, res, next) {
  let result = await roleModel.find(
    {
      isDeleted: false
    }
  );
  res.send(result);
});

router.get('/:id', async function (req, res, next) {
  try {
    let id = req.params.id;
    let result = await roleModel.findById(id);
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
    let newRole = new roleModel({
      name: req.body.name,
      description: req.body.description
    });
    await newRole.save();
    res.send(newRole);
  } catch (error) {
    res.status(400).send(error);
  }
});

router.put('/:id', async function (req, res, next) {
  try {
    let id = req.params.id;
    let role = await roleModel.findById(id);
    if (!role || role.isDeleted) {
      return res.status(404).send({
        message: 'ID NOT FOUND'
      });
    }
    let result = await roleModel.findByIdAndUpdate(
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
    let result = await roleModel.findById(id);
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

router.get('/:id/users', async function (req, res, next) {
  try {
    let id = req.params.id;
    let role = await roleModel.findById(id);

    if (!role || role.isDeleted) {
      return res.status(404).send({
        message: 'ROLE NOT FOUND'
      });
    }

    let users = await userModel.find({
      role: id,
      isDeleted: false
    }).populate({
      path: 'role',
      select: 'name description'
    });

    res.send(users);
  } catch (error) {
    res.status(400).send(error);
  }
});

module.exports = router;
