# RedBat

**redbat** is an implementation of Node.JS [EventEmitter](https://nodejs.org/api/events.html#events_class_eventemitter) class with some extra-features.

> **Note:** This library is pretty raw, I'm planning to improve and add a lot of things

# Features

* Fluent API
* Namespaces
* TTL for listeners
* Middlewares
* One handler for multiple listeners

# Intallation

```sh
npm i redbat
```

# Skip this if you don't need this .-.

### Building

Really, skip this if you are just installing it from npm. But if you need to build it:

```sh
cd ./redbat
npm run build
# outputs build to ./build/index
```

# Getting started

First require redbat in your code:

```javascript
const redbat = require("redbat");
```

To create a new EventEmitter call **EventEmitter** constructor:

```javascript
const myEmitter = new redbat.EventEmitter();
```

To create listener use **on** method of **EventEmitter**:

```javascript
myEmitter.on("my event", function(data) {
    console.log(data);
});
```

> **Note:** if you have more than one listener for one event it will add callback to arguments. It should be called when current handler finished it's work. Don't care about it if you have only one listener.

To call event handler use **emit** method:

```javascript
/*
Should log "hello" in console
*/
myEmitter.emit("my event", "hello");
```

.-. Getting started is finished here. Here comes reference.

# Reference

### constructor: EventEmitter

Arguments:

**no arguments**

Properties:

* **on(type[, ttl], handler)** - Add listener in default namespace
* **once(type[, ttl], handler)** - Add listener in default namespace that calls only once
* **emit(type, handler)** - Emit event in default namespace
* **use(handler)** - Add middleware in default namespace
* **listener(query)** - Get array of listeners
* **namespace(query)** - Get namespace. If null returns default. If doesn't exists creates and returns it

### constructor: Namespace

> Unavaliable from outside .-. but some of **EventEmitter** methods returns **Namespace**

Arguments:

**no arguments**

Properties:

* **getListeners(query)** - Get array of listeners
* **listeners** - Array of all listeners
* **middlewares** - Array of all middlewares
* **on(type[, ttl], handler)** - Add listener
* **once(type[, ttl], handler)** - Add listener that calls only once
* **emit(type, handler)** - Emit event
* **use(handler)** - Add middleware

> All of methods returns namespace they was called in, so you can chain them:

```javascript
myEmitter.namespace("my namespace")
    .on("my event 1", function() { /* ... */ })
    .on("my event 2", function() { /* ... */ })
    .emit("my event 1");
```

### Middlewares and events chaining

Middlewares (added by **use** method) are called before processing every event of namespace. Middleware is called with two arguments: Array of arguments (provided in **emit**) and callback (must be called when middleware finished work). You can have as many middlewares as you want (until memory runs out). Example:

```javascript
myEmitter
    .use(function(args, next) {
        console.log("First middleware called");
        next();
    })
    .use(function(args, next) {
        console.log("Second middleware called");
        next();
    });
```

> **TODO:** Probably need to add type argument

> **TODO2:** Do not wait for callback to be called if middleware return non-undefined value

If you have more than one listener for one event you should call callback that will be last argument of event handler. You can chain events like this. Example:

```javascript
myEmitter
    .on("event", function(next) {
        console.log("First event handler called");
        next();
    })
    .on("event", function(next) {
        console.log("Second event handler called");
        next();
    })
    .emit("event");
```

# LICENSE

MIT License

Copyright (c) 2017 Gleb Makagonov

Permission is hereby granted, free of charge, to any person obtaining a copy
of this software and associated documentation files (the "Software"), to deal
in the Software without restriction, including without limitation the rights
to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
copies of the Software, and to permit persons to whom the Software is
furnished to do so, subject to the following conditions:

The above copyright notice and this permission notice shall be included in all
copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE
SOFTWARE.