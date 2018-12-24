const bcrypt = require('bcryptjs');
const salt = bcrypt.genSaltSync(10);
const Joi = require('joi');
const User = require('../models/User');

module.exports = [
  {
    method: 'POST',
    path: '/api/v1/user/',
    config: {
      description: 'Create user.',
      tags: ['api', 'user'],
      handler: async (req, reply) => {
        const { username, password } = req.payload;
        
        const users = await User.find('username', '==', username);

        if (users.length > 0){
          return { message: 'Failed to create user' };
        }

        const newUser = {
          username,
          password: bcrypt.hashSync(password, salt)
        };

        return User.save(newUser);
      },
      validate: {
        payload: {
          username: Joi.string()
              .required()
              .description('Username'),
          password: Joi.string()
              .required()
              .description('Password')
        }
      }
    }
  },
  {
    method: 'POST',
    path: '/api/v1/user/login/',
    config: {
      description: 'User login.',
      tags: ['api', 'user'],
      handler: async (req, reply) => {
        const { username, password } = req.payload;
        
        const users = await User.find('username', '==', username);

        if (users.length !== 1){
          return { message: 'Failed to login user' };
        }

        const user = users[0];
        
        if (bcrypt.compareSync(password, user.password)) {
          return user;
        } else {
          return { message: 'Failed to login user' };
        }
      },
      validate: {
        payload: {
          username: Joi.string()
              .required()
              .description('Username'),
          password: Joi.string()
              .required()
              .description('Password')
        }
      }
    }
  },
  {  
    method: 'POST',
    path: '/api/v1/user/{userId}',
    config: {
      description: 'Update user.',
      tags: ['api', 'user'],
      handler: async (req, reply) => {
        const {
          name,
          image
        } = req.payload;

        const {
          userId
        } = req.params;
        
        const user = {
          name,
          image
        };
        
        return User.updateById(userId, user);
      },
      validate: {
        payload: {
          name: Joi.string()
            .description('User name'),
          image: Joi.string()
            .description('User image url')
        },
        params: {
          userId: Joi.string()
            .required()
            .description('User Id')
        }
      }
    }
  },
]