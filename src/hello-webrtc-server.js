import WebSocket from 'ws'
import LevelDB from 'level'
import URL from 'url'
import QueryString from 'query-string'
import HelloEvents from 'hello-events'

export default class HelloWebRTCServer extends HelloEvents {
  constructor(options, callback) {
    super()

    this.server = new WebSocket.Server(Object.assign({ port: 8686 }, options), callback)
    this.db = LevelDB(options.db ? options.db : __dirname + '/hello-webrtc.db')

    this.connections = []

    this.server.on('connection', async (socket, request) => {
      let urlobjs = URL.parse(request.url)
      let query = urlobjs.query
      let params = QueryString.parse(query)
      let token = params.token

      if (!token) {
        throw new Error(`[HelloWebRTC Signaling Server:] token not exists.`)
      }

      let currentUser = await this.get(`token:${token}.user`)

      if (!currentUser) {
        currentUser = await this.getUser(token)
        await this.set(`token:${token}.user`, currentUser)
      }
      
      const disconnect = () => {
        this.connections = this.connections.filter((item) => {
          if (item.user === currentUser && item.socket.readyState === 1) {
            item.socket.dispatch(item.signature, 'offline', null)
            item.socket.close()
            return false
          }
          else if (item.from === currentUser && item.socket.readyState === 1) {
            item.socket.dispatch(item.signature, 'break', null)
            item.socket.close()
            return false
          }
          else if (item.to === currentUser && item.socket.readyState === 1) {
            item.socket.dispatch(item.signature, 'break', null)
            item.socket.close()
            return false
          }
          return true
        })
      }

      socket.dispatch = (signature, type, data) => {
        if (socket.readyState > 1) {
          disconnect()
          return
        }
        let message = JSON.stringify({ signature, type, data })
        socket.send(message)
      }
      socket.subscribe = (event, callback) => {
        socket.on('message', (message) => {
          let { type, data, signature } = JSON.parse(message)
          this.debug(JSON.stringify({ user: currentUser, signature, type, data }, null, 4))
          if (event === type) {
            callback(signature, data)
          }
        })
      }
      
      socket.subscribe('online', async (signature) => {
        disconnect()
        let info = {
          user: currentUser,
          socket,
          signature,
        }
        this.connections.push(info)
        this.trigger('online', info)
      })
      socket.subscribe('request', (signature, { user, room }) => {
        let node2 = this.connections.find(item => item.user === user)
        if (!node2) {
          let message = `Not allowed when send request to ${user}.`
          socket.dispatch(signature, 'error', { message })
          this.debug(message)
          return
        }
        node2.socket.dispatch(node2.signature, 'request', { user: currentUser, room })
      })
      socket.subscribe('response', (signature, { user, room }) => {
        let node2 = this.connections.find(item => item.user === user)
        if (!node2) {
          let message = `Not allowed when send response to ${user}.`
          socket.dispatch(signature, 'error', { message })
          this.debug(message)
          return
        }
        node2.socket.dispatch(node2.signature, 'response', { user: currentUser, room })
      })

      socket.subscribe('create', async (signature, { user, room }) => {
        let peer = this.connections.find(item => item.from === currentUser && item.to === user && item.room === room)
        if (peer) {
          peer.socket.dispatch(peer.signature, 'break', null)
          this.connections = this.connections.filter(item => item !== node)
        }
        let info = {
          from: currentUser,
          to: user,
          room,
          signature,
          socket,
        }
        this.connections.push(info)
        this.trigger('break', info)
      })
      socket.subscribe('icecandidate', async (signature, candidate) => {
        let peer = this.connections.find(item => item.signature === signature)
        if (!peer) {
          let message = `Not allowed when send icecandidate to ${user}.`
          socket.dispatch(signature, 'error', { message })
          this.debug(message)
          return
        }
        peer.socket.dispatch(peer.signature, 'icecandidate', candidate)
      })
      socket.subscribe('offer', async (signature, description) => {
        let peer = this.connections.find(item => item.signature === signature)
        if (!peer) {
          let message = `Not allowed when send offer to ${user}.`
          socket.dispatch(signature, 'error', { message })
          this.debug(message)
          return
        }
        peer.socket.dispatch(peer.signature, 'offer', description)
      })
      socket.subscribe('answer', async (signature, description) => {
        let peer = this.connections.find(item => item.signature === signature)
        if (!peer) {
          let message = `Not allowed when send answer to ${user}.`
          socket.dispatch(signature, 'error', { message })
          this.debug(message)
          return
        }
        peer.socket.dispatch(peer.signature, 'answer', description)
      })
    })
    this.server.on('error', (e) => {
      this.debug(e)
    })
  }
  debug(...args) {
    let time = new Date()
    console.log(`[${time.getHours() + ':' + time.getMinutes() + ':' + time.getSeconds()} HelloWebRTC:]`, ...args)
  }
  async set(key, value, expires = 0) {
    let data = {
      time : Date.now(),
      expires: expires,
      data: value,
    }
    let input = JSON.stringify(data)
    await this.db.put(key, input)
  }
  async get(key) {
    try {
      let data = await this.db.get(key)
      if (!data) {
        return
      }
      let output = JSON.parse(data)
      if (output.expires && Date.now() > output.time + output.expires) {
        await this.remove(key)
        return null
      }
      return output.data
    }
    catch(e) {
      return
    }
  }
  async remove(key) {
    await this.db.del(key)
  }
  async getUser(token) {
    return await Promise.resolve(token)
  }
}