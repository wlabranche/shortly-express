var express = require('express');
var util = require('./lib/utility');
var partials = require('express-partials');
var bcrypt = require('bcrypt-nodejs');
var session = require('express-session');

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

//session attempt
app.use(session({
  genid: function() {
    return bcrypt.hashSync(Math.random());
  },
  secret: 'keyboard cat',
  rolling: true,
  cookie: { httpOnly: true, secure: false, maxAge: 60000 }
}));

app.get('/', function(req, res) {
  // res.render('index');
  checkUser(req, res);
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

  var username = req.body.username;
  var password = req.body.password;

  newUser(username, password, req, res);

});

app.post('/login', function(req, res) {

  var username = req.body.username;
  var password = req.body.password;

  db.knex('users').where('username', '=', username).then(function(result) {

    if (bcrypt.compareSync(password, result[0].password)) {
      console.log("You're logged in");
      req.session.regenerate(function(){
        // start a new session
        req.session.user = username;
        console.log("COOKIE ", req.session);
        res.redirect('/');
      });
    } else {
      // redirect to login page
      console.log("Wrong Password");
      res.redirect('/login');
    }
  });

});

var checkUser = function(req, res) {
  // check if req has a valid session for this user
  if (req.session.user) {
    // next();
    res.render('index');
  } else {
    req.session.error = 'Access denied!';
    console.log('access denied');
    res.redirect('/login');
  }
};

app.get('/logout', function(req, res){
  req.session.destroy();
  res.redirect('/login');
});

var newUser = function(username, password, req, res) {

  db.knex('users').where('username', '=', username).then(function(result) {
    console.log("results ", result);
    if (!result.length) {
      new User({
        'username': username,
        'password': password
      }).save().then(function() {
        res.redirect('/');
      });
    } else {
      res.redirect('/login');
    }
  });
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
