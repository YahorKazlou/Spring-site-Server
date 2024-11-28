
const pg = require("pg");

const { Client } = pg;
const client = new Client({
    user: "postgres",
    password: "2020327",
    host: "localhost",
    port: "5432",
    database: "test",
});

const init = () => {
    return client.connect();
};

const query = (text, params, callback) => {
    return client.query(text, params, callback);
};

const getUserByUsername = (username, callback) => {
    return query('SELECT * FROM users WHERE username = $1', [username], callback)
}

module.exports = {
    init,
    query,
    getUserByUsername,
};
