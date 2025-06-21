import express from "express"
import cors from "cors"
import connectToDB from "./db/db.js"

import JobRouter from "./Routes/JobRoutes.js";
import ResumeRouter from "./Routes/ResumeRoutes.js";
import UserRouter from "./Routes/UserRoutes.js";
import ReviewsRouter from "./Routes/Reviews.js";
import multer from "multer";

import fs from 'fs';
import path from 'path';
import PDFParser from 'pdf2json';
import { fileURLToPath } from 'url';
import { dirname } from 'path';
import ScrapperRouter from "./Routes/SocialConnectRoutes.js";


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
app.use("/Scrapper",ScrapperRouter)


const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const upload = multer({
  storage: multer.memoryStorage(),
  fileFilter: (req, file, cb) => {
    if (file.mimetype === 'application/pdf') {
      cb(null, true);
    } else {
      cb(new Error('Only PDF files are allowed'));
    }
  },
  limits: {
    fileSize: 10 * 1024 * 1024 // 10MB limit
  }
});

// PDF upload and parse endpoint
app.post('/api/uploads', upload.single('pdf'), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: 'No PDF file uploaded' });
    }

    console.log('File received:', req.file.originalname, 'Size:', req.file.size);

    // Create a temporary file for pdf2json (it needs a file path)
    const tempDir = path.join(__dirname, 'temp');
    if (!fs.existsSync(tempDir)) {
      fs.mkdirSync(tempDir, { recursive: true });
    }

    const tempFilePath = path.join(tempDir, `temp_${Date.now()}.pdf`);
    fs.writeFileSync(tempFilePath, req.file.buffer);

    // Parse PDF using pdf2json
    const pdfParser = new PDFParser();

    pdfParser.on('pdfParser_dataError', (errData) => {
      console.error('PDF parsing error:', errData.parserError);
      // Clean up temp file
      if (fs.existsSync(tempFilePath)) {
        fs.unlinkSync(tempFilePath);
      }
      res.status(500).json({ 
        error: 'Failed to parse PDF', 
        details: errData.parserError 
      });
    });

    pdfParser.on('pdfParser_dataReady', (pdfData) => {
      try {
        // Extract text from parsed data
        let extractedText = '';
        
        if (pdfData.Pages) {
          pdfData.Pages.forEach(page => {
            if (page.Texts) {
              page.Texts.forEach(text => {
                if (text.R) {
                  text.R.forEach(r => {
                    if (r.T) {
                      extractedText += decodeURIComponent(r.T) + ' ';
                    }
                  });
                }
              });
            }
          });
        }

        const result = {
          success: true,
          message: 'PDF parsed successfully',
          filename: req.file.originalname,
          size: req.file.size,
          pages: pdfData.Pages ? pdfData.Pages.length : 0,
          text: extractedText.trim(),
          uploadTime: new Date().toISOString()
        };

        console.log('PDF parsed successfully, pages:', result.pages);
        
        // Clean up temp file
        if (fs.existsSync(tempFilePath)) {
          fs.unlinkSync(tempFilePath);
        }

        res.json(result);
        
      } catch (error) {
        console.error('Text extraction error:', error);
        // Clean up temp file
        if (fs.existsSync(tempFilePath)) {
          fs.unlinkSync(tempFilePath);
        }
        res.status(500).json({ 
          error: 'Failed to extract text from PDF', 
          details: error.message 
        });
      }
    });

    // Load PDF from file path
    pdfParser.loadPDF(tempFilePath);
    
  } catch (error) {
    console.error('PDF processing error:', error);
    res.status(500).json({ 
      error: 'Failed to process PDF', 
      details: error.message 
    });
  }
});

// Error handling middleware
app.use((error, req, res, next) => {
  if (error instanceof multer.MulterError) {
    if (error.code === 'LIMIT_FILE_SIZE') {
      return res.status(400).json({ error: 'File too large (max 10MB)' });
    }
  }
  res.status(500).json({ error: error.message });
});
app.listen(port, () => {
  console.log(`Server is  listening on port ${port}`)
})