const jwt = require("jsonwebtoken");

module.exports = async (req, res, next) => {
    let token;
    if (
        req.headers.authorization &&
        req.headers.authorization?.includes("Bearer")
    ) {
        try {
            token = req.headers.authorization.split(" ")[1];
            const user = jwt.verify(token, "Secretkey123");
            req.body.user = user;
            next();
        } catch (error) {
            // TODO check if TokenExpiredError
            console.log(error);
            res.status(401).send(error);
        }
    }
    if (!token) {
        res.status(401).json({ msg: "Not autorised" });
    }
};
