var db = require('../config');
var bcrypt = require('bcrypt-nodejs');
var Promise = require('bluebird');

var User = db.Model.extend({
  tableName: 'users',
  hasTimeStamps: true,
  initialize: function(){
    console.log("Init Pass ", this.password);
    console.log(this);
    var salt = bcrypt.genSaltSync(10);
    console.log(" initSalt ", salt);
    var hash = bcrypt.hashSync(this.password, salt);
    console.log(" initHash ", hash);
    this.set('password', hash);
    this.set('salt', salt);
  }
});

module.exports = User;
