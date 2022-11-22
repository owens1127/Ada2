const mysql = require('mysql2');

class Connection {
    constructor(config) {
        this.con = mysql.createConnection(config)
    }

    /**
     * Connect to the connection
     * @return {Connection} returns this connection
     */
    open() {
        this.con.connect(err => {
            if (err) this.reconnect(err);
        });
        return this;
    }

    /**
     * Reconnect after failing
     * @param {Error} err
     */
    reconnect(err) {
        this.con.connect(err2 => {
            if (err2) console.error(err, err2);
        });
        return this;
    }
    /**
     * Wraps a MySQL query in an async promise
     * @param {string} str the query string
     * @param {boolean?} log - log if true
     * @returns {Promise<RowDataPacket[][] | RowDataPacket[] | OkPacket | OkPacket[] |
     *     ResultSetHeader>}
     */
    async query(str, log) {
        return new Promise((resolve, reject) => {
            this.con.query(str, (err, result) => {
                if (log) console.log('Processed SQL query: ' + str.split('\n').map(l => l.trim()).join(' '));
                if (err) reject(err);
                else resolve(result);
                this.close();
            });
        });
    }

    close() {
        this.con.end();
        return this;
    }
}

const config = {
    host: process.env.DATABASE_HOST,
    user: process.env.DATABASE_USERNAME,
    password: process.env.DATABASE_PASSWORD,
    database: process.env.DATABASE
};

exports.escape = (val) => {
    return mysql.escape(val);
}
/**
 *
 * @param {string} query
 * @return {Promise<RowDataPacket[][] | RowDataPacket[] | OkPacket | OkPacket[] | ResultSetHeader>}
 */
exports.dbQuery = (query) => {
   return new Connection(config).open().query(query);
}