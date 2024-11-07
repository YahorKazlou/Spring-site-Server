var hash = require('pbkdf2-password')()

const express = require('express')
const app = express()
const port = 3001

app.get('/projects', (req, res) => {
  res.send('')
})

var users = {
  tj: { name: 'admin' }
};

// when you create a user, generate a salt
// and hash the password ('foobar' is the pass here)

hash({ password: '1234' }, function (err, pass, salt, hash) {
  if (err) throw err;
  // store the salt & hash in the "db"
  users.tj.salt = salt;
  users.tj.hash = hash;
});

function authenticate(name, pass, fn) {
  if (!module.parent) console.log('authenticating %s:%s', name, pass);
  var user = users[name];
  // query the db for the given username
  if (!user) return fn(null, null)
  // apply the same algorithm to the POSTed password, applying
  // the hash against the pass / salt, if there is a match we
  // found the user
  hash({ password: pass, salt: user.salt }, function (err, pass, salt, hash) {
    if (err) return fn(err);
    if (hash === user.hash) return fn(null, user)
    fn(null, null)
  });
}

app.post('/login', function (req, res, next) {
  if (!req.body) return res.sendStatus(400)
  authenticate(req.body.username, req.body.password, function(err, user){
    if (err) return next(err)
    if (user) {
      res.sendStatus(200);
    } else {
      res.sendStatus(403);
    }
  });
});

app.listen(port, () => {
  console.log(`Example app listening on port ${port}`)
})