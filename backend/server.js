import express from "express"
import cors from "cors"
import connectToDB from "./db/db.js"

import JobRouter from "./Routes/JobRoutes.js";
import ResumeRouter from "./Routes/ResumeRoutes.js";
import UserRouter from "./Routes/UserRoutes.js";
import ReviewsRouter from "./Routes/Reviews.js";
import multer from "multer";
import fs from "fs"
import PdfParse from "pdf-parse";



const app = express()
const port = 8080

app.use(express.json());

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

const uploadsDir = path.join(__dirname, 'uploads');
if (!fs.existsSync(uploadsDir)) {
  fs.mkdirSync(uploadsDir, { recursive: true });
}

// Configure Multer for file uploads
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, 'uploads/') // Make sure this directory exists
  },
  filename: function (req, file, cb) {
    // Generate unique filename
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, file.fieldname + '-' + uniqueSuffix + path.extname(file.originalname));
  }
});

const upload = multer({
  storage: storage,
  fileFilter: (req, file, cb) => {
    // Only allow PDF files
    if (file.mimetype === 'application/pdf') {
      cb(null, true);
    } else {
      cb(new Error('Only PDF files are allowed!'), false);
    }
  },
  limits: {
    fileSize: 10 * 1024 * 1024 // 10MB limit
  }
});

// FIXED PDF UPLOAD ROUTE
app.post("/upload-pdf", upload.single("pdf"), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ 
        success: false, 
        error: "No file uploaded" 
      });
    }

    console.log("Uploaded file path:", req.file.path);
    
    // FIX 1: Read the actual file path, not just "/uploads"
    const dataBuffer = fs.readFileSync(req.file.path);
    
    // FIX 2: Parse the PDF
    const pdfData = await PdfParse(dataBuffer);

    // FIX 3: Clean up - delete the uploaded file after processing
    try {
      fs.unlinkSync(req.file.path);
      console.log("Temporary file deleted successfully");
    } catch (deleteError) {
      console.warn("Could not delete temporary file:", deleteError.message);
    }

    // Return the extracted text
    res.json({
      success: true,
      extractedText: pdfData.text,
      totalPages: pdfData.numpages,
      info: pdfData.info
    });

  } catch (err) {
    console.error("PDF parsing error:", err);
    
    // Clean up file if error occurs
    if (req.file && req.file.path && fs.existsSync(req.file.path)) {
      try {
        fs.unlinkSync(req.file.path);
      } catch (deleteError) {
        console.warn("Could not delete file after error:", deleteError.message);
      }
    }
    
    res.status(500).json({ 
      success: false, 
      error: "PDF parsing failed: " + err.message 
    });
  }
});
app.listen(port, () => {
  console.log(`Server is  listening on port ${port}`)
})