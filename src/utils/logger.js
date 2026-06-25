import chalk from 'chalk';

export const logger = {
    info: (msg) => console.log(chalk.cyan(`[INFO] ${msg}`)),
    success: (msg) => console.log(chalk.green.bold(`[SUCCESS] ${msg}`)),
    warn: (msg) => console.log(chalk.yellow(`[WARN] ${msg}`)),
    error: (msg) => console.log(chalk.red.bold(`[ERROR] ${msg}`)),
    db: (msg) => console.log(chalk.magenta(`[DATABASE] ${msg}`))
};