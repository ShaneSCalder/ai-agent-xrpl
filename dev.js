// dev.js
require('dotenv').config(); // Load variables from .env
const app = require('./server'); // Import the Express app

const PORT = process.env.PORT || 3000;

app.listen(PORT, () => {
  console.log(`🚀 Local dev server running at http://localhost:${PORT}`);
});

