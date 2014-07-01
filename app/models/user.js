var db = require('../config');
var bcrypt = require('bcrypt-nodejs');
var Promise = require('bluebird');

var User = db.Model.extend({
  tableName: 'users',
  hasTimeStamps: true,
  initialize: function(){
    console.log("Initing User ", this);
    var hash = bcrypt.hashSync(this.password);
    // model.set('username', model.username);
    this.set('password', hash);
  }
});

module.exports = User;
