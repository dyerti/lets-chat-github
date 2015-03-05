var fs = require("fs"),
    _ = require("lodash"),
    mongoose = require("mongoose"),
    passport = require("passport"),
    GitHubStrategy = require("passport-github").Strategy;

function GitHub(options, core) {
    this.options = options;
    this.core = core;
    this.key = "ldap";

    this.setup = this.setup.bind(this);
    this.getStrategy = this.getStrategy.bind(this);
}

GitHub.defaults = {
    url: "https://github.com",
    apiUrl: "https://api.github.com"
};

GitHub.key = "github";

GitHub.prototype.setup = function() {
    passport.use(this.getStrategy());
};

GitHub.prototype.authenticate = function(req, cb) {
    passport.authenticate("ldapauth", cb)(req);
};

GitHub.prototype.getStrategy = function() {
    return new GitHubStrategy({
            clientID: this.options.clientID,
            clientSecret: this.options.clientSecret,
            callbackURL: "http://localhost:5000/auth/github/callback"
        },
        function (user, done) {
            return GitHub.findOrCreate(this.options, this.core, user, done);
        }.bind(this)
    );
};

GitHub.findOrCreate = function(options, core, githubUser, callback) {
    var User = mongoose.model("User");

    User.findOne({ uid: githubUser.id }, function (err, user) {
        if (err) {
            return callback(err);
        }
        if (!user) {
            GitHub.createUser(core, options, githubUser, callback);
        } else {
            return callback(null, user);
        }
    });
};

GitHub.createUser = function (core, options, githubUser, callback) {
    var User = mongoose.model("User");

    // TODO This is hacky since GitHub does not store first and last name
    // seperately

    var firstName = githubUser.name.split(" ")[0];
    var lastName = githubUser.name.replace(firstName, "");

    var data = {
        uid: githubUser.id,
        username: githubUser.login,
        email: githubUser.email,
        firstName: firstName,
        lastName: lastName,
        displayName: githubUser.name
    };

    if (!data.displayName) {
        data.displayName = data.firstName + " " + data.lastName;
    }

    core.account.create("github",
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
