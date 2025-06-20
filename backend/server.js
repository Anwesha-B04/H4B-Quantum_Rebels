import express from "express"
import connectToDB from "./db/db.js"
const app = express()
const port = 8080

app.get('/', (req, res) => {
  res.send('App is Working')
})

connectToDB()

app.listen(port, () => {
  console.log(`Server is  listening on port ${port}`)
})