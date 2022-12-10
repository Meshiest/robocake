import dgram from 'dgram';
import EventEmitter from 'events';

export const test = async () => {
  const tester = new SatisfactoryStatus();
  const res = await tester.test('127.0.0.1', 15801);
  tester.close();
  return res;
}

export default class SatisfactoryStatus extends EventEmitter {
  activeConns = new Set();
  server = null

  constructor() {
    super();
    const server = this.server = dgram.createSocket('udp4');

    server.on('listening', () => {
      // console.info('[info] UDP Server listening on ' + address.address + ':' + address.port);
    });

    server.on('message', (message, remote) => {
      const key = `${remote.address}:${remote.port}`;
      if (this.activeConns.has(key)) this.emit(key, message);
    });

    server.bind(); // random port
  }

  close() {
    try {
      this.server.close();
      return true;
    } catch (err) {
      console.error('error closing server');
      return false;
    }
  }

  // send a message
  send(host, port, buf) {
    return new Promise((resolve, reject) =>
      this.server.send(buf, 0, buf.length, port, host, (err, bytes) =>
        err ? reject(err) : resolve(bytes)))
  }

  // receive a message or timeout
  async recv(key) {
    let callback;

    // race between...
    return await Promise.race([
      // resolve received message
      new Promise(resolve => this.once(key, callback = resolve)),

      // remove listener and timeout
      new Promise((_, reject) => setTimeout(() => {
        this.off(key, callback);
        reject('timed out');
      }, 1000))]);
  }

  async test(host, port) {
    const key = `${host}:${port}`;
    this.activeConns.add(key);

    const clientData = 'cakebot!';
    const buffer = Buffer.from(`\0\0${clientData}`);

    try {
      const startTime = Date.now();

      // send initial message
      await this.send(host, port, buffer);

      const resp = await this.recv(key)
      if (resp.length !== 17) throw 'invalid message length';

      const respData = Buffer.from(resp).toString('ascii', 2, 10);
      const state = resp[10];

      const respView = new DataView(new Uint8Array(resp).buffer);
      const serverPort = respView.getUint16(15, true);
      const serverVersion = respView.getUint32(11, true);

      if (resp[0] !== 1)
        throw 'invalid message id';
      if (resp[1] !== 0)
        throw 'invalid protocol';
      if (respData !== clientData)
        throw 'invalid client data';
      if (state === 0 || state > 3)
        throw 'invalid server state';

      return {
        ping: Date.now() - startTime,
        version: serverVersion,
        port: serverPort,
        state: [null, 'idle', 'loading', 'running'][state]
      };

    } catch (err) {
      if (typeof err === 'string') throw err;
      console.error('error in test:', err);
      throw 'internal error';
    } finally {
      this.activeConns.delete(key);
    }
  }
}