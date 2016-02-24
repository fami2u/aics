config = {};

if (process.env.DEBUG == 0) {
  config = {
    "host": "http://101.200.142.143"
  }
} else {
  config = {
    "host": "http://localhost:8081"
  }
}

module.exports = config
