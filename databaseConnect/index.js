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
    return query(
        "SELECT * FROM users WHERE username = $1",
        [username],
        callback
    );
};

const setUser = (
    { username, password, firstName, lastName, age, salt },
    callback
) => {
    return query(
        "INSERT INTO users(username, password, firstname, lastname, age , salt) VALUES ($1, $2, $3, $4, $5, $6)",
        [username, password, firstName, lastName, age, salt],
        callback
    );
};

const getProjects = (searchTerm, callback) => {
    let queryRequest = "SELECT * FROM project";
    if (searchTerm) {
        queryRequest +=
            " WHERE LOWER(name) LIKE LOWER($1) OR LOWER(text) LIKE LOWER ($1)";
    }
    return query(queryRequest, searchTerm ? [`%${searchTerm}%`] : [], callback);
};

module.exports = {
    init,
    query,
    getUserByUsername,
    getProjects,
    setUser,
};
