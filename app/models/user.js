var db = require('../config');
var bcrypt = require('bcrypt-nodejs');
var Promise = require('bluebird');

var User = db.Model.extend({
  tableName: 'users',
  initialize: function () {
    this.on('creating', function (model, attrs, options) {
      return new Promise(function(resolve, reject) {
        bcrypt.hash(model.get('password'), null, null, function(err, hash) {
          if ( err ) { reject(err); }
          model.set('password', hash);
          resolve(hash); // data is created only after this occurs
        });
      });
    });
  },




});

// let user = User.forge({
//   username: 'wonbok',
//   password: ewfwe
//   }).save()
// });

// console.log('db.knex', db.knex);

module.exports = User;