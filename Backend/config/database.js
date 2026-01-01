const mongoose = require("mongoose");

const connectDatabase = () => {
  mongoose
    .connect(process.env.DB_URI, {
     
    })
    .then((data) => {
      console.log(`Mongodb connected with server: ${data.connection.host}`);
    })
    // Catch block hum server.js ke "Unhandled Promise Rejection" me handle karenge
};

module.exports = connectDatabase;