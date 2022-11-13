const fs = require('node:fs');
const EventEmitter = require('events');
const config = require('../config.json');
module.exports = {
    name: 'ready',
    once: true,
    execute(client) {
        console.log(`Ready! Logged in as ${client.user.tag}`);
        tryReset(client);
    }
};

/**
 * Attempts to do daily reset functionality, sets a timeout for a new call if it doesn't
 * @param client
 */
function tryReset(client) {
    const { time } = require('../next-reset.json');
    const now = Date.now()
    if (now > time) {
        let next = new Date(now);
        const writeOut = () => {
            const data = JSON.stringify({ time: next.getTime() }, null, 2);
            // idk why the path is different, writefile writes from rootDir I guess
            fs.writeFileSync('./next-reset.json', data);
        }
        const resetListener = new EventEmitter();
        client.emit('dailyReset', client, resetListener);
        resetListener.once('success', () => {
            console.log('Success')
            // No matter when in the day the reset happens, the next call will happen the next day
            next.setUTCHours(next.getUTCHours() - config.UTCResetHour);
            next.setUTCDate(next.getUTCDate() + 1);
            next.setUTCHours(config.UTCResetHour, 0, 30, 0)
            // apparently this doesn't grow the stack, so we're good
            setTimeout(tryReset, next.getTime() - Date.now(), client);
            writeOut();
        })
        resetListener.once('failure', error => {
            console.error('[WARN] Daily reset failed');
            console.error(error);
            if (new Date(now).getUTCHours() === config.UTCResetHour) {
                next.setUTCMinutes(next.getUTCMinutes() + 1);
            } else {
                // check every 5 minutes if API is down past +1
                next.setUTCMinutes(next.getUTCMinutes() + 5);
            }
            const timeout = next.getTime() - Date.now()
            console.log({ timeout })
            setTimeout(tryReset, timeout, client);
            writeOut();
        })
    } else {
        const timeout = time - Date.now()
        const date = new Date(timeout)
        console.log(
            `Next daily reset in: ${date.getUTCHours()} hours, ${date.getUTCMinutes()} minutes, ${date.getUTCSeconds()} seconds, ${date.getUTCMilliseconds()} ms`)
        setTimeout(tryReset, timeout, client);
    }
}