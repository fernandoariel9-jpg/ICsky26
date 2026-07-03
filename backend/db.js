const { Pool } = require("pg");

const pool = new Pool({
  // tu configuración actual
});

module.exports = pool;
