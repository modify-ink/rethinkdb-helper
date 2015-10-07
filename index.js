var poolModule = require('generic-pool');
var Promise = require('bluebird');
var r;
var helper;

function init(driver, options) {
    var internals = {};
    var defaultDb = 'test'
    internals.options = options || {}
    if (!driver) rethinkError('Please include the rethinkdb driver when calling init')
    if (!options.db) options.db = defaultDb

    r = driver

    var pool = poolModule.Pool({
        name     : 'rethinkdb',
        create   : function(done) {
            r.connect(options, done)
        },
        destroy  : function(client) {
            client.close()
        },
        max      : internals.options.maxConn || 25,
        min      : internals.options.minConn || 3,
        idleTimeoutMillis : internals.options.idleConn || 30000,
        log : internals.options.logConn || false
    })

    var acq = Promise.promisify(pool.acquire)

    var acquire = function() {
        return acq().disposer(function(connection) {
            var e
            try {
                return pool.release(connection)
            } catch (_error) {
                e = _error
                return debug('failed to release connection %s', e.message)
            }
        })
    }

    var run = function(query, done, options) {
        var promise = Promise.using(acquire(), function(connection) {
            return query.run(connection, options).then(function(cursorOrResult) {
                return (cursorOrResult != null ? typeof cursorOrResult.toArray === "function" ? cursorOrResult.toArray() : void 0 : void 0) || cursorOrResult
            })
        })
        if (done != null) {
            return promise.nodeify(done)
        } else {
            return promise
        }
    }

    var setupDb = function() {
        return new Promise(function(resolve, reject) {
            run(r.dbCreate(internals.options.db)).then(function(err, result) {
                // Ignore error, it's probably an 'already created' error
                resolve()
            })
            .catch(function(err) {resolve()})
        })
    }

    pool.r = r
    pool.Promise = Promise

    internals.pool = pool
    internals.run = run
    internals.setupDb = setupDb

    return internals
}

exports.init = init;
