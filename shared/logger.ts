// @ts-ignore ts couldn't resolve this import -- check this later
import chalk from 'chalk';
import fs from 'fs';

function writeToLogFile(message: string) {
    const now = new Date();
    const year = now.getFullYear();
    const month = String(now.getMonth() + 1).padStart(2, '0');
    const day = String(now.getDate()).padStart(2, '0');
    const filePath = `./logs/log_${year}${month}${day}.txt`;

    if (!fs.existsSync('./logs'))
        fs.mkdirSync('./logs');

    fs.appendFile(filePath, message + '\n', (err) => {
        if (err) throw err;
    });
}

const log = {
    info: (message: string) => {
        const ts = new Date().toISOString().replace(/T/, ' ').replace(/\..+/, '');
        console.log(`${chalk.gray(ts)} :: ${chalk.blueBright(message)}`);
        writeToLogFile(`${ts} :: INFO :: ${message}`);
    },
    data: (message: string) => {
        const ts = new Date().toISOString().replace(/T/, ' ').replace(/\..+/, '');
        console.log(`${chalk.gray(ts)} :: ${chalk.italic(message)}`);
        writeToLogFile(`${ts} :: DATA :: ${message}`);
    },
    debug: (message: string) => {
        const ts = new Date().toISOString().replace(/T/, ' ').replace(/\..+/, '');
        console.log(`${chalk.gray(ts)} :: ${chalk.italic.yellowBright(message)}`);
        writeToLogFile(`${ts} :: DEBUG :: ${message}`);
    },
    error: (message: string | Error | unknown) => {
        const ts = new Date().toISOString().replace(/T/, ' ').replace(/\..+/, '');

        console.error(`${chalk.gray(ts)} :: ${chalk.redBright('ERROR:')} ${chalk.whiteBright((message instanceof Error) ? message.stack : message)}`);
        writeToLogFile(`${ts} :: ERROR :: ${(message instanceof Error) ? message.stack : message}`);
    }
}

export default log;