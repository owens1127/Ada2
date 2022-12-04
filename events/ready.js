const fs = require('node:fs');
const EventEmitter = require('events');
const config = require('../config.json');
const { getMembersPerDelta } = require('../database/users.js');

module.exports = {
    name: 'ready',
    once: true,
    execute(client) {
        console.log(`Ready! Logged in as ${client.user.tag}`);
        resets(client);
        // always happen halfway thru the minute to help w/ edge cases;
        setTimeout(setInterval, (90 - new Date().getUTCSeconds()) % 60 * 1000,
            // check every minute. Note the SQL query MUST use 1/60 intervals
            reminders, 60000, client);
    }
};

/**
 * Attempts to do daily reset functionality, sets a timeout for a new call if it doesn't
 * @param client
 */
function resets(client) {
    const { time } = JSON.parse(fs.readFileSync('./local/next-reset.json'));
    const now = Date.now()
    if (now > time) {
        let next = new Date(now);
        const writeOut = () => {
            const data = JSON.stringify({ time: next.getTime() }, null, 2);
            // idk why the path is different, writefile writes from rootDir I guess
            fs.writeFileSync('./local/next-reset.json', data);
        }
        const resetListener = new EventEmitter();
        client.emit('dailyReset', client, resetListener);
        resetListener.once('success', () => {
            console.log('Reset Tasks Complete ඞ')
            // No matter when in the day the reset happens, the next call will happen the next day
            next.setUTCHours(next.getUTCHours() - config.UTCResetHour);
            next.setUTCDate(next.getUTCDate() + 1);
            next.setUTCHours(config.UTCResetHour, 0, 30, 0)
            // apparently this doesn't grow the stack, so we're good
            setTimeout(resets, next.getTime() - Date.now(), client);
            writeOut();
        })
        resetListener.once('failure', error => {
            console.warn('Daily reset failed');
            console.error(error);
            if (new Date(now).getUTCHours() === config.UTCResetHour) {
                next.setUTCMinutes(next.getUTCMinutes() + 1);
            } else {
                // check every 5 minutes if API is down past +1
                next.setUTCMinutes(next.getUTCMinutes() + 5);
            }
            const timeout = next.getTime() - Date.now()
            console.log({ timeout })
            setTimeout(resets, timeout, client);
            writeOut();
        })
    } else {
        const timeout = time - Date.now()
        const date = new Date(timeout)
        console.log(
            `Next daily reset in: ${date.getUTCHours()} hours, ${date.getUTCMinutes()} minutes, ${date.getUTCSeconds()} seconds, ${date.getUTCMilliseconds()} ms`)
        setTimeout(resets, timeout, client);
    }
}

function reminders(client) {
    const { validTil, missing } = JSON.parse(fs.readFileSync('./local/reminders.json', 'utf8'));
    const today = new Date();
    const delta = ((today.getUTCHours() - config.UTCResetHour) + 24) % 24
        + today.getUTCMinutes() / 60
    console.log(delta);
    if (validTil > Date.now()) {
        getMembersPerDelta(delta).then(ids => {
            ids.forEach(id => {
                if (missing[id]) {
                    client.users.fetch(id).then(u => {
                        u.send(
                            `Hey <@${id}>, this is your reminder to go pick up ${missing[id].join(
                                ' and ')} from Ada!`)
                            .then(m => console.log(`Sent mods pick-up reminder to ${u.username} at ${new Date().toLocaleTimeString()}`))
                            .catch(e => console.error('Failed to message ' + u.username))
                    })
                        .catch(e => {
                            console.error('Failed find user ' + id)
                        })
                }
            })
        })
    }
}