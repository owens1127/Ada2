const mysql = require('mysql2');

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
    query(str, callback) {
        this.con.query(str, callback)
        this.con.end();
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
    return new Promise((resolve, reject) => {
        const con = new Connection();
        con.query(query, (err, result) => {
            console.log('Processed SQL query: ' + query.split('\n').map(l => l.trim()).join(' '));
            if (err) reject(err);
            else resolve(result);
        });
    });

}