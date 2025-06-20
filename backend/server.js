import express from "express"
import connectToDB from "./db/db.js"
import JobRouter from "./Routes/JobRoutes.js";
import ResumeRouter from "./Routes/ResumeRoutes.js";
import UserRouter from "./Routes/UserRoutes.js";
import ReviewsRouter from "./Routes/Reviews.js";
const app = express()
const port = 8080

app.use(express.json());
app.use(cookieParser());
app.use(cors({
  origin: "*",
  credentials: true,
  methods: ["GET", "POST", "PUT", "DELETE", "PATCH"],
  allowedHeaders: ["Content-Type", "Authorization", "X-Requested-With"],
}));

app.get('/', (req, res) => {
  res.send('App is Working')
})

connectToDB()

app.use("/auth",UserRouter)
app.use("/jobs",JobRouter)
app.use("/resume", ResumeRouter);
app.use("/reviews",ReviewsRouter)

app.listen(port, () => {
  console.log(`Server is  listening on port ${port}`)
})