const express = require("express");
const db = require("./databaseConnect");
const app = express();
const port = 3001;
const jwt = require("jsonwebtoken");
const authMiddleware = require("./authMiddleware");

db.init();

var hash = require("pbkdf2-password")();

var cors = require("cors");
const { json } = require("express");

app.use(cors());

app.use(express.urlencoded({ extended: true }));
// This is required to handle urlencoded data
app.use(express.json());

app.use(express.static("public"));

// This to handle json data coming from requests mainly post

// when you create a user, generate a salt
// and hash the password ('foobar' is the pass here)

app.listen(port, () => {
    console.log(`Example app listening on port ${port}`);
});

function authenticate(name, pass, fn) {
    // query the db for the given username
    db.getUserByUsername(name)
        .then((res) => {
            const user = res.rows[0];
            if (!user) return fn(null, null);
            // apply the same algorithm to the POSTed password, applying
            // the hash against the pass / salt, if there is a match we
            // found the user
            hash(
                { password: pass, salt: user.salt },
                function (err, pass, salt, hash) {
                    if (err) return fn(err);
                    if (hash === user.password) {
                        const { password, salt, ...userData } = user;
                        return fn(null, userData);
                    }
                    fn(null, null);
                }
            );
        })
        .catch((error) => console.log(error));
}

const generateTokens = (tokenData) => {
    const refreshToken = jwt.sign(tokenData, "Secretkey123", {
        expiresIn: '5m',
    });
    const authToken = jwt.sign(tokenData, "Secretkey123", {
        expiresIn: '2m',
    });

    return { refreshToken, authToken };
};

app.post("/login", function (req, res, next) {
    if (!req.body) return res.sendStatus(400);
    authenticate(req.body.login, req.body.password, function (err, user) {
        if (err) return next(err);
        if (user) {
            const tokenData = {
                id: user.id,
                username: user.username,
            };
            res.status(200).send({ user, ...generateTokens(tokenData) });
        } else {
            res.sendStatus(403);
        }
    });
});

function register(userData, fn) {
    const { username, password, repeatPassword, firstName, lastName, age } =
        userData;
    // TODO validation
    if (!username || username.length < 3)
        return fn({
            field: "username",
            error: "Username must contain 3 symbols or more",
            status: 400,
        });
    if (!password || password.length < 4 || /[^a-zA-Z0-9]/g.test(password))
        return fn({
            field: "password",
            error: "Password must contain at least 1 number and 1 letter and be at least 4 symbols or more.",
            status: 400,
        });
    if (!repeatPassword || password !== repeatPassword)
        return fn({
            field: "repeatPassword",
            error: "Repeat password section validation (passwords should be the same)",
            status: 400,
        });
    if (!firstName || firstName.length < 3)
        return fn({
            field: "firstName",
            error: "First name must contain 3 symbols or more.",
            status: 400,
        });
    if (!lastName || lastName.length < 3)
        return fn({
            field: "lastName",
            error: "Last name must contain 3 symbols or more.",
            status: 400,
        });
    if (!age || typeof age !== "number" || age <= 0)
        return fn({
            field: "age",
            error: "Age must be a number and can't be zero",
            status: 400,
        });

    hash({ password }, function (err, pass, salt, hash) {
        if (err) return fn(err);

        db.setUser({ ...userData, password: hash, salt })
            .then(() => {
                const { password, ...visibleUserData } = userData;
                return fn(null, visibleUserData);
            })
            .catch((error) => {
                return fn(error);
            });
    });
}

app.post("/signup", function (req, res, next) {
    if (!req.body) return res.sendStatus(400);
    register(req.body, function (err, user) {
        if (err) {
            console.log(err);
            res.status(400).send(err);
        }
        if (user) {
            res.json({ data: user });
        } else {
            res.sendStatus(403);
        }
    });
});

app.post("/refresh-token", function (req, res, next) {
    try {
        if (!req.body) return res.sendStatus(400);
        const token = req.body.refreshToken;
        const { id, username } = jwt.verify(token, "Secretkey123");
        res.status(200).send({
            id,
            username,
            ...generateTokens({ id, username }),
        });
    } catch (error) {
        console.log(error);
        res.status(401).send(error);
    }
});

app.get("/projects", authMiddleware, (req, res) => {
    const searchTerm = req.query.search;
    if (searchTerm) {
        db.getProjectBySearchTerm(searchTerm)
            .then((dbres) => {
                const projectsArray = dbres.rows;
                res.json({ data: projectsArray });
            })
            .catch((error) => console.error(error));
    } else {
        db.getProjects()
            .then((dbres) => {
                const projectsArray = dbres.rows;
                res.json({ data: projectsArray });
            })
            .catch((error) => console.error(error));
    }
});
