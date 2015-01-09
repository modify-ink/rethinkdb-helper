var r = require('rethinkdb')
var q = require('q')

var connection;
var options;

function init(optns) {
    var defaultDb = 'test'
    if (!optns) optns = {db: defaultDb}
    if (!optns.db) optns.db = defaultDb
    options = optns

    return {
        connection: connection,
        options: options,
        connect: connect,
        run: run
    }
}

/*
 * Connect -- takes options object. It supports all options specified by
 * rethinkdb, but requires you specify the database to connect to. If
 * you want to connect to the default 'test' database, you still must
 * specify it.
 *
 * Returns -- promise which resolves to the connection object
*/

function connect() {
    // Make connection
    var d = q.defer()
    r.connect(options, function(err, conn) {
        if (err) rethinkError(err, d)
        connection = conn
        console.log('rethinkdb connection established for:', options)

        // Create db. If it exists it will fail silently, if not will be created.
        r.dbCreate(options.db).run(connection, function(err, result) {
            // Ignore error, it's probably an 'already created' error
            connection.use(options.db)
            d.resolve(connection)
        })
    })
    return d.promise
}

/*
 * Run -- takes rethinkdb sequence to run on the database.
 * Returns -- promise which resolves to json requested from db.
 *
 * It handles the cursors nicely so you don't have to deal with them.
*/

function run(sequence) {
    var d = q.defer()
    sequence.run(connection, function(err, cursor) {
        if (err) rethinkError(err, d)
        else {
            // If cursor can be converted to array, do that
            if (cursor && cursor.toArray) {
                cursor.toArray(function(err, results) {
                    if (err) rethinkError(err, d)
                    else d.resolve(results)
                })
            }
            // Else just resolve to the json we have
            else d.resolve(cursor)
        }
    })
    return d.promise
}

function rethinkError(error, defer) {
    if (defer) defer.reject(error)
    console.log('rethinkdb-helper error', error)
}

exports.init = init;
