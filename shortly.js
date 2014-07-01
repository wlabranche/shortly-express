var express = require('express');
var util = require('./lib/utility');
var partials = require('express-partials');
var bcrypt = require('bcrypt-nodejs');

var db = require('./app/config');
var Users = require('./app/collections/users');
var User = require('./app/models/user');
var Links = require('./app/collections/links');
var Link = require('./app/models/link');
var Click = require('./app/models/click');

var app = express();

app.configure(function() {
  app.set('views', __dirname + '/views');
  app.set('view engine', 'ejs');
  app.use(partials());
  app.use(express.bodyParser())
  app.use(express.static(__dirname + '/public'));
  // app.use(express.cookieSession());
});

app.get('/', function(req, res) {
  res.render('index');
});

app.get('/create', function(req, res) {
  res.render('index');
});

app.get('/links', function(req, res) {
  Links.reset().fetch().then(function(links) {
    res.send(200, links.models);
  });
});

app.post('/links', function(req, res) {
  var uri = req.body.url;

  if (!util.isValidUrl(uri)) {
    console.log('Not a valid url: ', uri);
    return res.send(404);
  }

  new Link({ url: uri }).fetch().then(function(found) {
    if (found) {
      res.send(200, found.attributes);
    } else {
      util.getUrlTitle(uri, function(err, title) {
        if (err) {
          console.log('Error reading URL heading: ', err);
          return res.send(404);
        }

        var link = new Link({
          url: uri,
          title: title,
          base_url: req.headers.origin
        });

        link.save().then(function(newLink) {
          Links.add(newLink);
          res.send(200, newLink);
        });
      });
    }
  });
});

/************************************************************/
// Write your authentication routes here
/************************************************************/

app.get('/login', function(req, res) {
  res.render('login');
});

app.get('/signup', function(req, res) {
  res.render('signup');
});

app.post('/signup', function(req, res) {

  // maybe use express-session module

  var username = req.body.username;
  var password = req.body.password;

  newUser(username, password);
  // if the user name already exists
    // redirect to signup *not a complete solution
  // if password is valid
    // build salt
    // create hash
    // store salt, hash, and username in db
    // start a new session
    // redirect to user page

});

app.post('/login', function(req, res) {

  // console.log("Logging in: ", req, res);

  var username = req.body.username;
  var password = req.body.password;

  db.knex('users').where('username', '=', username).then(function(result) {
    var saltyHash = result[0].password;
    var ogHash = bcrypt.hashSync(password, result[0].salt);

    console.log("  salt", result[0].salt);
    console.log("saltyHash", saltyHash);
    console.log("  ogHash", ogHash);
    console.log("  Pass", password);

    console.log(saltyHash === ogHash);
    console.log(bcrypt.compareSync(password, saltyHash));


    if (bcrypt.compareSync(password, saltyHash)) {
      console.log("You're logged in");
      // start a new session
      // redirect to user page
    } else {
      // redirect to login page
      console.log("Wrong Password");
    }
  });

});

// start a new session
var newSession = function() {
  //

  // create a session
  // set token
  // return session
};

var newUser = function(username, password) {

  console.log("Creating new user ", username, password);

  // var requestWithSession = request.defaults({jar: true});

  // create a user that we can then log-in with
  new User({
    'username': username,
    'password': password
  }).save().then(function(model){
    // console.log(model);
    // var options = {
    //   'method': 'POST',
    //   'followAllRedirects': true,
    //   'uri': 'http://127.0.0.1:4568/login',
    //   'json': {
    //     'username': username,
    //     'password': password
    //   }
    // };
  });

  // login via form and save session info
  // requestWithSession(options, function(error, res, body) {
  //   done();
  // });
};

/************************************************************/
// Handle the wildcard route last - if all other routes fail
// assume the route is a short code and try and handle it here.
// If the short-code doesn't exist, send the user to '/'
/************************************************************/

app.get('/*', function(req, res) {
  new Link({ code: req.params[0] }).fetch().then(function(link) {
    if (!link) {
      res.redirect('/');
    } else {
      var click = new Click({
        link_id: link.get('id')
      });

      click.save().then(function() {
        db.knex('urls')
          .where('code', '=', link.get('code'))
          .update({
            visits: link.get('visits') + 1,
          }).then(function() {
            return res.redirect(link.get('url'));
          });
      });
    }
  });
});

console.log('Shortly is listening on 4568');
app.listen(4568);
