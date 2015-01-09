# Rethinkdb Connection Helper

This is a simple rethinkdb node tool to easily manage a connection, run queries, handle cursors, etc.

# Installation

    npm install rethinkdb-helper

# Usage

It's very simple to use.

## Require necessary items

```javascript
var r = require('rethinkdb')
var rdbHelper = require('rethinkdb-helper')
```

## Init connection object

The `init` method takes two arguments: your rethinkdb driver, and connection options object:

```javascript
var options = {
    db: 'test',
    // etc... all connection options are supported here
}

// When you establish the connection, pass in your rethinkdb driver
// so that it can use whatever driver version you want
var connection = rdbHelper.init(r, options)
```

# Connection Object

The `init` method returns a `connection` object, which comes with several useful methods/values:

## connection.connect()

Takes no arguments. Establishes the connection to the db.

Returns: Promise, which resolves to actual connection.

## connection.run(query)

Arguments: Any rethinkdb query.

Returns: Promise, which resolves to JSON. It will handle the cursor for you, it will either return a single object (if asking for one object) or an array, whichever is applicable.

## connection.connection

This data is the connection itself, in case you need access to it.

## connection.options

This is simply the options object you passed in, in case you need access to any of these values.

# Examples

```javascript
var r = require('rethinkdb')
var rdbHelper = require('rethinkdb-helper')

var dbOptions = {
    db: 'test',
    host: 'localhost',
    port: 28015
}

var connection = rdbHelper.init(r, dbOptions)

// establish connection
connection.connect().then(function(connection) {
    // Do something with the connection if you want ... or just something
    // after the connection is complete
})

// simple query run
var query = r.table('users').get('15d-2d4-12a')
connection.run(query).then(function(user) {
    // direct access to user object
})

// get an array without dealing with cursors
var query = r.table('users').filter({firstName: 'John'}) // all users called John
connection.run(query).then(function(users) {
    // You now have an array of users
    // The 'run' method is smart and turns cursors into arrays for you
})
```
