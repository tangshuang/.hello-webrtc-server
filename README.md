# Hello WebRTC Server

A simple library to setup a webrtc signaling server for [hello-werbrtc](https://github.com/tangshuang/hello-webrtc).

## Install

```
npm install --save hello-webrtc-server
```

## Usage

ES6:

```
import HelloWebRTCServer from 'hello-webrtc-server/src/hello-webrtc-server'
```

CommonJS:

```
const HelloWebRTCServer = require('hello-webrtc-server')
```

To use:

```
const server = new HelloWebRTCServer(options)
```

## Options

- db: a path to put database, we use a database to store user info as cache
- port: default is 8686
- server: a http(s) server

If you set a server, port is not needed.

If you want to know more about this, read more [here](https://github.com/websockets/ws).

## Notes

**1. override `getUser` method**

You should override `getUser` method, such as:

```
server.getUser = async function(token) {
  // ...
  return userId
}
```

or 

```
class MyServer extends HelloWebRTCServer {
  getUser(token) {
    // ...
    return userId
  }
}
let server = new MyServer(options)
```

**2. `token` should be passed as query string in your client side**

```
let socket = new WebSocket('ws://localhost:8686?token=xxx')
```

`token` is required.
