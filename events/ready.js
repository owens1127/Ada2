const fs = require('node:fs');
const EventEmitter = require('events');
const config = require('../config.json');

module.exports = {
    name: 'ready',
    once: true,
    execute(client) {
        console.log(`Ready! Logged in as ${client.user.tag}`);
        resets(client);
        reminders(client);
    }
};

/**
 * Attempts to do daily reset functionality, sets a timeout for a new call if it doesn't
 * @param client
 */
function resets(client) {
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
            setTimeout(resets, next.getTime() - Date.now(), client);
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
    const reminders = require('../reminders.json');
    const delta = "x"
    if (reminders.validTil > Date.now()) {
        Object.keys(reminders.users[delta]).forEach(id => {
            client.users.fetch(id).send(`Hey <@${id}>, this is your reminder to go pick up ${reminders.users[delta][id].join(' and ')}!`)
        });
    }
    setTimeout(reminders, 60000, client);
}