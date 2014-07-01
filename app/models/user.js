var db = require('../config');
var bcrypt = require('bcrypt-nodejs');
var Promise = require('bluebird');

var User = db.Model.extend({
  tableName: 'users',
  hasTimeStamps: true,
  initialize: function(){
    this.on('creating', function(model){
      var pass = model.attributes.password;
      var salt = bcrypt.genSaltSync(10);
      var hash = bcrypt.hashSync(pass, salt);
      this.set('password', hash);
    });
  }
});

module.exports = User;
