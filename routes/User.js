const bcrypt = require('bcryptjs');
const salt = bcrypt.genSaltSync(10);
const Joi = require('joi');
const User = require('../models/User');
const JWT = require('jsonwebtoken');

module.exports = [
  {
    method: 'GET',
    path: '/api/v1/user',
    config: {
      auth: 'jwt',
      description: 'Get all users.',
      tags: ['api', 'user'],
      handler: (req, reply) => {
        const {
          field,
          operator,
          value
        } = req.query;

        if (field && operator && value) {
          return User.find(field, operator, value);
        } else {
          return User.find();
        }
      },
      validate: {
        query: {
          field: Joi.string()
            .description('Where clause field'),
          operator: Joi.string()
            .description('Where clause operator'),
          value: Joi.string()
            .description('Where clause value')
        }
      }
    }
  },
  {
    method: 'POST',
    path: '/api/v1/user',
    config: {
      auth: false,
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

        const createdUser = await User.save(newUser);
        return { user: createdUser, token: JWT.sign({ id: user._id }, process.env.JWT_SECRET) };
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
    path: '/api/v1/user/login',
    config: {
      auth: false,
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
          return { user, token: JWT.sign({ id: user._id }, process.env.JWT_SECRET) };
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
    method: 'PUT',
    path: '/api/v1/user',
    config: {
      auth: 'jwt',
      description: 'Update user.',
      tags: ['api', 'user'],
      handler: (req, reply) => {
        const {
          name,
          image,
          contacts
        } = req.payload;
        
        const user = req._currentUser;
        
        const userUpdate = {
          name,
          image,
          contacts
        };
        
        return User.updateById(user._id, userUpdate);
      },
      validate: {
        payload: {
          name: Joi.string()
            .description('User name'),
          image: Joi.string()
            .description('User image url'),
          contacts: Joi.array().items(Joi.string())
            .description('User contacts')
        }
      }
    }
  },
  {  
    method: 'POST',
    path: '/api/v1/user/contact',
    config: {
      auth: 'jwt',
      description: 'Add User Contact.',
      tags: ['api', 'user'],
      handler: async (req, reply) => {
        const {
          contactId
        } = req.payload;
        
        const user = req._currentUser;

        const existingContact = user.contacts.find(c => c._id === contactId);

        if (existingContact) {
          return { message: 'Already a contact' };
        } else {
          const contacts = [];
          for(const contact of user.contacts) {
            contacts.push(contact._id);
          }
          contacts.push(contactId);
          const userUpdate = {
            contacts
          };
          return User.updateById(userId, userUpdate);
        }
      },
      validate: {
        payload: {
          contactId: Joi.string()
            .required()
            .description('Contact Id'),
        }
      }
    }
  },
  {  
    method: 'POST',
    path: '/api/v1/user/request',
    config: {
      auth: 'jwt',
      description: 'Add Contact Request.',
      tags: ['api', 'user'],
      handler: async (req, reply) => {
        const {
          contactId
        } = req.payload;
        
        const user = req._currentUser;

        const existingContactRequest = user.outgoingContactRequests.find(c => c._id === contactId);

        if (existingContactRequest) {
          return { message: 'Already sent a contact request' };
        } else {
          const outgoingContactRequests = [];
          for(const contactRequest of user.outgoingContactRequests) {
            outgoingContactRequests.push(contactRequest._id);
          }
          outgoingContactRequests.push(contactId);

          const userUpdate = {
            outgoingContactRequests
          };

          const updatedUser = await User.updateById(user._id, userUpdate);

          const contact = await User.findById(contactId);

          const incomingContactRequests = [];
          for(const contactRequest of contact.incomingContactRequests) {
            incomingContactRequests.push(contactRequest._id);
          }
          incomingContactRequests.push(user._id);

          const contactUpdate = {
            incomingContactRequests
          };

          await User.updateById(contactId, contactUpdate);
          return updatedUser;
        }
      },
      validate: {
        payload: {
          contactId: Joi.string()
            .required()
            .description('Contact Id'),
        }
      }
    }
  },
  {  
    method: 'POST',
    path: '/api/v1/user/request/accept',
    config: {
      auth: 'jwt',
      description: 'Accept Contact Request.',
      tags: ['api', 'user'],
      handler: async (req, reply) => {
        const {
          requestContactId
        } = req.payload;
        
        const user = req._currentUser;

        const incomingContactRequests = [];
        for(const contactRequest of user.incomingContactRequests) {
          incomingContactRequests.push(contactRequest._id);
        }
        const incomingInd = incomingContactRequests.indexOf(requestContactId);
        incomingContactRequests.splice(incomingInd, 1);

        const userContacts = [];
        for(const userContact of user.contacts) {
          userContacts.push(userContact._id);
        }
        userContacts.push(requestContactId);

        const userUpdate = {
          contacts: userContacts,
          incomingContactRequests
        };

        const updatedUser = await User.updateById(user._id, userUpdate);

        const contact = await User.findById(requestContactId);

        const outgoingContactRequests = [];
        for(const contactRequest of contact.outgoingContactRequests) {
          outgoingContactRequests.push(contactRequest._id);
        }
        const outgoingInd = outgoingContactRequests.indexOf(requestContactId);
        outgoingContactRequests.splice(outgoingInd, 1);

        const requestUserContacts = [];
        for(const userContact of contact.contacts) {
          requestUserContacts.push(userContact._id);
        }
        requestUserContacts.push(user._id);

        const contactUpdate = {
          contacts: requestUserContacts,
          outgoingContactRequests
        };

        await User.updateById(requestContactId, contactUpdate);
        return updatedUser;
      },
      validate: {
        payload: {
          requestContactId: Joi.string()
            .required()
            .description('Contact Id'),
        }
      }
    }
  }
]