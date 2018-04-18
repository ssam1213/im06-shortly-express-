var express = require('express');
var util = require('./lib/utility');
var partials = require('express-partials');
var bodyParser = require('body-parser');
var cookieParser = require('cookie-parser');
var session = require('express-session');
var bcrypt = require('bcrypt-nodejs');


var db = require('./app/config');
var Users = require('./app/collections/users');
var User = require('./app/models/user');
var Links = require('./app/collections/links');
var Link = require('./app/models/link');
var Click = require('./app/models/click');


var app = express();

app.set('views', __dirname + '/views');
app.set('view engine', 'ejs');
app.use(partials());
// Parse JSON (uniform resource locators)
app.use(bodyParser.json());
// Parse forms (signup/login)
app.use(bodyParser.urlencoded({
  extended: true
}));
app.use(express.static(__dirname + '/public'));

app.use(session({
  secret: 'tehSecret',
  resave: false,
  saveUninitialized: true,
  cookie: {
    maxAge: 1000 * 60 * 1 // 쿠키 유효기간 1시간
  }
}));

// app.get('/', function (req, res) {
//   res.render('index');
// });

// app.get('/create', function (req, res) {
//   res.render('index');
// });

app.get('/links', function (req, res) {
  Links.reset().fetch().then(function (links) {
    res.status(200).send(links.models);
  });
});

app.post('/links', function (req, res) {
  var uri = req.body.url;
  console.log('uri', uri);

  if (!util.isValidUrl(uri)) {
    console.log('Not a valid url: ', uri);
    return res.sendStatus(404);
  }

  new Link({
    url: uri
  }).fetch().then(function (found) {
    console.log('found', found);

    if (found) {
      res.status(200).send(found.attributes);
    } else {
      util.getUrlTitle(uri, function (err, title) {
        if (err) {
          console.log('Error reading URL heading: ', err);
          return res.sendStatus(404);
        }
        Links.create({
            url: uri,
            title: title,
            baseUrl: req.headers.origin
          })
          .then(function (newLink) {
            res.status(200).send(newLink);
          });
      });
    }
  });
});

/************************************************************/
// Write your authentication routes here
/************************************************************/


app.get('/', function (req, res) {
  // console.log(req.session.cookie);

  // if (req.session.key === 'wonbok') {
  //   res.render('index');
  // } else {
  //   res.redirect('login');
  // } 
  if (req.session.username) {
    console.log('session', req.session.username);

    res.render('index');
  } else {
    res.render('login');
  }

});

app.get('/signup', function (req, res) {
  res.render('signup');
});

app.post('/signup', function (req, res) {
  var newName = req.body.username;
  var newPassword = req.body.password;

  new User({
    username: newName
  }).fetch().then(function (found) {
    if (found) {
      console.log('you have signed up');
      return res.redirect('login');
    } else {
      Users.create({
        username: newName,
        password: newPassword
      }).then(function (user) {
        res.redirect('login');
      });
    }
  });
});

app.post('/login', function (req, res) {
  var newName = req.body.username;
  var password = req.body.password;
  console.log('password', password);
  new User({
    username: newName
  }).fetch().then(function (found) {
    // console.log(util.isValidPassword(password, found.attributes.password));

    if (found) {
      util.isValidPassword(password, found.attributes.password).then(function (result) {
        if (result) {
          req.session.username = newName;
          console.log('sessionName', req.session.username);
          res.redirect('index');
        } else {
          console.log('sign up please');
          res.render('login');
        }
      });
    }

    // bcrypt.compare(password, found.attributes.password, function (err, data) {
    //   if (data) {
    //     req.session.username = newName;
    //     console.log('sessionName', req.session.username);
    //     res.redirect('index');
    //   } else {
    //     console.log('sign up please');
    //     res.render('login');
    //   }
    // });
  });
});

app.get('/logout', function (req, res) {
  delete req.session.username;
  res.redirect('login');
});

app.get('/create', function (req, res) {
  if (req.session.username) {
    res.render('index');
  } else {
    res.render('login');
  }
});

/************************************************************/
// Handle the wildcard route last - if all other routes fail
// assume the route is a short code and try and handle it here.
// If the short-code doesn't exist, send the user to '/'
/************************************************************/

app.get('/*', function (req, res) {
  new Link({
    code: req.params[0]
  }).fetch().then(function (link) {
    if (!link) {
      res.redirect('/');
    } else {
      var click = new Click({
        linkId: link.get('id')
      });

      click.save().then(function () {
        link.set('visits', link.get('visits') + 1);
        link.save().then(function () {
          return res.redirect(link.get('url'));
        });
      });
    }
  });
});

console.log('Shortly is listening on 4568');
app.listen(4568);