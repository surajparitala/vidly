const winston = require("winston");
// require('winston-mongodb'); commented for tests
require('express-async-errors')

module.exports = function () {
    // process.on('uncaughtException', (ex) => {
//     console.log('Uncaught Exception');
//     winston.error(ex.message, ex);
//     process.exit(1);
// }) //Instead of this winston can take care of uncaught exception with below handleExceptions

    process.on("unhandledRejection", (ex) => {
        // console.log('Unhandled Rejection Exception');
        // winston.error(ex.message, ex);
        // process.exit(1);
        //Instead of above code if we rethrow then it will be handled again by winston
        throw ex;
    })

    winston.handleExceptions(
        new winston.transports.Console({colorize: true, prettyPrint: true})
        ,new winston.transports.File({ filename: 'uncaughtExceptions.log'}))

    // winston.add(winston.transports.File, {filename: 'logfile.log'}); commented for tests
// winston.add(winston.transports.MongoDB, {db: 'mongodb://localhost/vidly'}) (Not working for some reason)
}