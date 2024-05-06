
const AppRouter = require('./routers/Routers')
const express = require('express')
const mongoose = require('mongoose')
const dotenv = require('dotenv')
const bodyParser = require('body-parser')
const cors = require('cors')

dotenv.config()
const app = express()
app.use(bodyParser.json())
const corsoptions = {
    origin: '*',
    optionSuccessStatus: 200
}
app.use(cors(corsoptions))


app.use('/api/', AppRouter)

mongoose.connect(process.env.MONGO_URL,{useNewUrlParser:true, useUnifiedTopology:true})
.then(()=>{
    app.listen(process.env.PORT || 7777, ()=>{
        console.log('server is connected to: ',process.env.PORT || 7777)
    })
})





