const express = require('express');
const app = express();

const { APP } = require('./config')
const { errorMessageHandler } = require('./utils/helper')
const chorraxa = require('./routes')

app.use(express.json())
app.use(chorraxa)
app.use((err, req, res, next) => {
    const error = errorMessageHandler(err.status, err.message);
    res.status(err.status || 500).send(error);
});

app.listen(APP.PORT, () => console.log(`server started on port: ${APP.PORT}`))