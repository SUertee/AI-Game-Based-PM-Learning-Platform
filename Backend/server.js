
const makeApp = require("./app");
const db = require('./db');

// build the app
const app = makeApp(db);

// start listening
const PORT = process.env.PORT || 4000;
app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});
