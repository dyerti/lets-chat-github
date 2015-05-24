var fs = require('fs'),
    _ = require('lodash'),
    mongoose = require('mongoose'),
    passport = require('passport'),
    GitHubStrategy = require('passport-github').Strategy;

function GitHub(options, core) {
    this.options = options;
    this.core = core;
    this.key = 'github';

    this.setup = this.setup.bind(this);
    this.getStrategy = this.getStrategy.bind(this);
}

GitHub.defaults = {
    url: 'https://github.com',
    apiUrl: 'https://api.github.com',
    isSSO: true
};

GitHub.key = 'github';

GitHub.prototype.setup = function() {
    passport.use(this.getStrategy());
};

GitHub.prototype.authenticate = function(req, res, cb) {
    if (!res) {
        return cb(null, null);
    }

    passport.authenticate('github', { failureRedirect: '/login' }, cb)(req, res);
};

GitHub.prototype.getStrategy = function() {
    return new GitHubStrategy({
            clientID: this.options.clientID,
            clientSecret: this.options.clientSecret,
            callbackURL: this.options.callbackURL
        },
        function (accessToken, refreshToken, user, done) {
            return GitHub.findOrCreate(this.core, user, done);
        }.bind(this)
    );
};

GitHub.findOrCreate = function(core, githubUser, callback) {
    var User = mongoose.model('User');

    // TODO uid should be unique no matter the provider
    User.findOne({ uid: githubUser.id }, function (err, user) {
        if (err) {
            return callback(err);
        }
        if (!user) {
            GitHub.createUser(core, githubUser, callback);
        } else {
            return callback(null, user);
        }
    });
};

GitHub.createUser = function (core, githubUser, callback) {
    var User = mongoose.model('User');

    // TODO This is hacky since GitHub does not store first and last name
    // seperately
    // displayName is not required on GitHub
    // email is not necessarily available if it is hidden

    var name = githubUser.displayName || 'A user';
    var email = githubUser.email || 'no@email.com';
    var firstName = name.split(' ')[0];
    var lastName = name.replace(firstName, '');

    var data = {
        uid: githubUser.id,
        username: githubUser.username,
        email: email,
        firstName: firstName,
        lastName: lastName,
        displayName: name
    };

    if (!data.displayName) {
        data.displayName = data.firstName + ' ' + data.lastName;
    }

    core.account.create('github',
                        data,
                        function (err, user) {
        if (err) {
            console.error(err);
            return callback(err);
        }
        return callback(null, user);
    });
};

module.exports = GitHub;
