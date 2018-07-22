require("babel-polyfill");
require('babel-register')

var HelloWebRTCServer = require('../src/hello-webrtc-server')
var server = new HelloWebRTCServer()

// var users = []

// server.on('online', (e, { user, socket, signature }) => {
//   console.log('>>>', user, signature)
//   if (!users.includes(user)) {
//     users.push({ user, socket, signature })
//   }
//   users.filter((item) => item.user !== user).forEach((item) => {
//     item.socket.dispatch(item.signature, 'online', user)
//   })
// })
