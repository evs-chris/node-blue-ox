var logger = require('./');

logger.useColor = true;

var http = logger('http', 'all');
var db = logger('db', 'all');
var auth = logger('http:auth', 'all');

http.info('Listening on port ' + http.color('green', true, '3000'));
http.error(new Error('File not found'));
db.warn('It looks like you are using non-parameterized queries. If you aren\'t escaping your inputs correctly, you could suffer the wrath of Bobby Tables.\nPlease try not to incur the wrath of Bobby Tables.');
db.error(new Error('Field foo does not exist.'), 'Uh oh, your query failed.\n\t\tYou should try not writing broken queries.');
auth.info('user bar password reset');
auth.fatal('failed login attempt for user admin');
