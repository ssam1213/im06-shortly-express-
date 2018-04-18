var db = require('../config');
var User = require('../models/user');
//할거없음
var Users = new db.Collection();
//db안에 Collection객체 있음
Users.model = User;

module.exports = Users;
