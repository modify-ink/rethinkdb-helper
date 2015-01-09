var q = require('q');
var r;

var helper;

function init(options, driver) {
    r = driver
    var defaultDb = 'test'
    if (!options) options = {db: defaultDb}
    if (!options.db) options.db = defaultDb

    helper = {
        connection: null,
        options: options,
        connect: connect,
        run: run
    }
    return helper
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
    r.connect(helper.options, function(err, conn) {
        if (err) rethinkError(err, d)
        helper.connection = conn
        console.log('rethinkdb connection established for:', helper.options)

        // Create db. If it exists it will fail silently, if not will be created.
        r.dbCreate(helper.options.db).run(helper.connection, function(err, result) {
            // Ignore error, it's probably an 'already created' error
            helper.connection.use(helper.options.db)
            d.resolve(helper.connection)
        })
    })
    return d.promise
}

/*
 * Run -- takes rethinkdb query to run on the database.
 * Returns -- promise which resolves to json requested from db.
 *
 * It handles the cursors and array transformations nicely so
 * you don't have to deal with them.
*/

function run(query) {
    var d = q.defer()
    query.run(helper.connection, function(err, cursor) {
        if (err) d.reject(err)
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
