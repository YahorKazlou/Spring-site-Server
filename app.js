const express = require("express");
const app = express();
const port = 3001;

var hash = require("pbkdf2-password")();

var cors = require("cors");

app.use(cors());

app.use(express.urlencoded({ extended: true }));
// This is required to handle urlencoded data
app.use(express.json());
// This to handle json data coming from requests mainly post

var users = {
    admin: { name: "admin" },
};

// when you create a user, generate a salt
// and hash the password ('foobar' is the pass here)

hash({ password: "1234" }, function (err, pass, salt, hash) {
    if (err) throw err;
    // store the salt & hash in the "db"
    users.admin.salt = salt;
    users.admin.hash = hash;
});

function authenticate(name, pass, fn) {
    if (!module.parent) console.log("authenticating %s:%s", name, pass);
    var user = users[name];
    // query the db for the given username
    if (!user) return fn(null, null);
    // apply the same algorithm to the POSTed password, applying
    // the hash against the pass / salt, if there is a match we
    // found the user
    hash({ password: pass, salt: user.salt }, function (err, pass, salt, hash) {
        if (err) return fn(err);
        if (hash === user.hash) return fn(null, user);
        fn(null, null);
    });
}

app.post("/login", function (req, res, next) {
    if (!req.body) return res.sendStatus(400);
    authenticate(req.body.login, req.body.password, function (err, user) {
        if (err) return next(err);
        if (user) {
            res.sendStatus(200);
        } else {
            res.sendStatus(403);
        }
    });
});

app.listen(port, () => {
    console.log(`Example app listening on port ${port}`);
});

const defaultProjects = [
    {
        name: "Spring Boot",
        text: "Takes an opinionated view of building Spring applications and gets you up and running as quickly as possible.",
        imgUrl: "http://localhost:3001/spring-boot.svg",
        link: "",
    },
    {
        name: "Spring Framework",
        text: "Provides core support for dependency injection, transaction management, web apps, data access, messaging, and more.",
        imgUrl: "http://localhost:3001/spring-framework.svg",
        link: "",
    },
    {
        name: "Spring Data",
        text: "Provides a consistent approach to data access – relational, non-relational, map-reduce, and beyond.",
        imgUrl: "http://localhost:3001/spring-data.svg",
        link: "",
    },
    {
        name: "Spring Cloud",
        text: "Provides a set of tools for common patterns in distributed systems. Useful for building and deploying microservices.",
        imgUrl: "http://localhost:3001/spring-cloud.svg",
        link: "",
    },
    {
        name: "Spring Cloud Data Flow",
        text: "Provides an orchestration service for composable data microservice applications on modern runtimes.",
        imgUrl: "http://localhost:3001/spring-data-flow.svg",
        link: "",
    },
    {
        name: "Spring Scurity",
        text: "Protects your application with comprehensive and extensible authentication and authorization support.",
        imgUrl: "http://localhost:3001/spring-security.svg",
        link: "",
    },
];

app.use(express.static("public"));

const filterProjects = (searchTerm = "") => {
    const lowerCaseSearchTerm = searchTerm.toLowerCase();
    const filteredProjects = defaultProjects.filter(
        (project) =>
            project.name.toLowerCase().includes(lowerCaseSearchTerm) ||
            project.text.toLowerCase().includes(lowerCaseSearchTerm)
    );

    return filteredProjects;
};

app.get("/projects", (req, res) => {
    const searchTerm = req.query.search;

    res.json({ data: filterProjects(searchTerm) });
});
