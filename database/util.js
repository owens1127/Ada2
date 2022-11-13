const mysql = require('mysql2');

function newConnection() {
    const con = mysql.createConnection({
        host: process.env.DATABASE_HOST,
        user: process.env.DATABASE_USERNAME,
        password: process.env.DATABASE_PASSWORD,
        database: process.env.DATABASE
    });
    con.connect(err => {
        if (err) throw err
    });
    con.on('error', err => {
        console.error('[mysql error]',err);
    });
    return con;
}

exports.escape = (val) => {
    return mysql.escape(val);
}
/**
 *
 * @param {string} query
 * @param {function(result: {})?} callback
 * @return Promise<void>
 */
exports.dbQuery = (query, callback) => {
    return new Promise((resolve, reject) => {
        const con = newConnection();
        con.query(query, (err, result) => {
            console.log('Processed SQL query: ' + query.split('\n').map(l => l.trim()).join(' '));
            if (err) reject(err);
            else if (callback) callback(result);
            resolve();
        });
        con.end();
    });

}