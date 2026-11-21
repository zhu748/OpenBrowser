'use strict';

// Shared SOCKS5 test harness: a promise-based socket reader used by the
// socks5-reset / socks5-auth-complete / socks5-retry selftests. Previously the
// same ~25-line class was pasted byte-for-byte into all three scripts, so a
// harness fix had to be applied three times.
class Reader {
  constructor(socket) {
    this.buffer = Buffer.alloc(0);
    this.queue = [];
    socket.on('data', (chunk) => {
      this.buffer = Buffer.concat([this.buffer, chunk]);
      this.pump();
    });
    socket.on('error', () => {});
  }
  read(size) {
    return new Promise((resolve) => {
      this.queue.push({ size, resolve });
      this.pump();
    });
  }
  pump() {
    const item = this.queue[0];
    if (!item || this.buffer.length < item.size) return;
    this.queue.shift();
    const value = this.buffer.subarray(0, item.size);
    this.buffer = this.buffer.subarray(item.size);
    item.resolve(value);
  }
}

module.exports = { Reader };
