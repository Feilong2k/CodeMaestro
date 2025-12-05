// Manual mock for pg module (since pg is not installed yet)

// Mock Pool class
class MockPool {
  constructor(config) {
    this.config = config;
    this.connect = jest.fn();
    this.query = jest.fn();
    this.end = jest.fn();
    this.on = jest.fn();
    this.totalCount = 0;
    this.idleCount = 0;
    this.waitingCount = 0;
  }
}

// Mock Client class
class MockClient {
  constructor(config) {
    this.config = config;
    this.connect = jest.fn();
    this.query = jest.fn();
    this.end = jest.fn();
    this.release = jest.fn();
  }
}

// Create mock module
const pg = {
  Pool: MockPool,
  Client: MockClient,
};

module.exports = pg;
