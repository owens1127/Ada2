const mysql = require('mysql2');

/**
 * Represents a connection to the MySQL database
 */
class Connection {
    constructor() {
        this.con = mysql.createConnection({
            host: process.env.DATABASE_HOST,
            user: process.env.DATABASE_USERNAME,
            password: process.env.DATABASE_PASSWORD,
            database: process.env.DATABASE
        })
        this.con.connect(err => {
            if (err) throw err
        });
    }
    /**
     * Wraps a MySQL query in an async promise
     * @param {string} str the query string
     * @returns {Promise<RowDataPacket[][] | RowDataPacket[] | OkPacket | OkPacket[] | ResultSetHeader>}
     */
    async query(str) {
        return new Promise((resolve, reject) => {
            this.con.query(str, (err, result) => {
                console.log('Processed SQL query: ' + str.split('\n').map(l => l.trim()).join(' '));
                if (err) reject(err);
                else resolve(result);
            });
            this.con.end();
        });
    }
}

exports.escape = (val) => {
    return mysql.escape(val);
}
/**
 *
 * @param {string} query
 * @return {Promise<RowDataPacket[][] | RowDataPacket[] | OkPacket | OkPacket[] | ResultSetHeader>}
 */
exports.dbQuery = (query) => {
   return new Connection().query(query);
}