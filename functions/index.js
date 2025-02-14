import express from 'express';
import multer from 'multer';
import admin from 'firebase-admin';
import path from 'path';
import crypto from 'crypto'; // For generating unique tokens
import cors from 'cors'; // Handle cross-origin requests
import OpenAI from 'openai';
import { fileURLToPath } from 'url';
import * as functions from "firebase-functions";
import { Buffer } from "buffer";
import dotenv from "dotenv";
import { v4 as uuidv4 } from 'uuid';
import Busboy from 'busboy';
// Your existing logic...
dotenv.config();
// Convert __dirname for ES modules


const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);



//adjusted for function firebase_adminsdk_base64
const serviceAccount = JSON.parse(
    Buffer.from(process.env.FB_ADMINSDK, "base64").toString("utf-8")
  );
  

//adjusted for function - firebase.bucket
admin.initializeApp({
  credential: admin.credential.cert(serviceAccount),
  storageBucket: process.env.FB_BUCKET,
});


const app = express();
const bucket = admin.storage().bucket();
const allowedOrigins = ["https://etsydb-fdad2.web.app"];
//////////////////////////////////////////////////////////////////////////
app.use(
  cors({
    origin: function (origin, callback) {
      if (!origin || allowedOrigins.includes(origin)) {
        callback(null, true);
      } else {
        callback(new Error("CORS not allowed"));
      }
    },
    methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
    allowedHeaders: ["Content-Type", "Authorization"],
    credentials: true,
  })
);
const upload = multer({ storage: multer.memoryStorage() });



///////////////////////////////////////////////////////////////////////////////

// Configure Multer for file uploads
// const upload = multer({
//   storage: multer.memoryStorage(),
//   limits: { fileSize: 5 * 1024 * 1024 }, // 5MB limit
// });

// functions.config().openai.api_key
const openai = new OpenAI({
    apiKey: process.env.OPEN_AI_APIKEY,
  });

async function generateDescription(folderName, urls) {
  console.log(urls);
  try {
    const imageObjects = urls.map((url) => ({
      type: 'image_url',
      image_url: {
        url, // Use the URL as is
      },
    }));

    const response = await openai.chat.completions.create({
      model: 'gpt-4o-mini',
      messages: [
        {
          role: 'system',
          content: [
            {
              type: 'text',
              text: `Format:HTML\nTitle\n- 140 characters max. with punctuation and space counted.\n\nTips:\n1. The first 30 characters are the most important (they appear first). So the language has to be precise, simple, put the most important value of your item on the first 5-7 words.\n\nDescription \nWhat makes your item special? Buyers will only see the first few lines unless they expand the description.\n\nTips:\n-Describe specific details rather than make generalizations.\n\n1. Think about what your audience values and adjust the description accordingly. A small boutique (and etsy shoppers) tend to value the hand-made, labor-intensive process. The current trend in America prefers small, family-owned and women-run businesses. If the shop has those values, this also means that you might describe the clothing differently, or with a different emphasis for in-person boutique sales rather than online sales. \n\n2. For online descriptions, think about what a picture *cannot* convey easily, and use your descriptions to bridge the gap. Are there design details that are not obvious from the pictures (example: the buttons on the tank dress)? Use your writing as a spotlight to draw your attention to those details. Remember that what you describe is what your audience will notice. Also, think in terms of all five senses, not just the visual. For mud clothing, this often means describing the texture and feel of the fabric, which is sometimes quite different from the conventional silk sateen. \n\n3. Be concrete in your descriptions as much as possible. I think it's is helpful to to hint at usage (where the buyer can wear the item, etc), but mostly focus on very specific things that the buyer can actually see and feel once the clothing arrives at their door. This helps to give a sense of the value in the listing, and reinforce that sense of value once it arrives in your buyer's home. \n\nThis is the example of mine:\n\nDesign:\nElevate your wardrobe with our elegant sleeveless top, meticulously crafted from 100% mulberry silk and naturally dyed for a sustainable touch. This top boasts a sleek, minimalist design that effortlessly transitions from day to night. The rich black hue adds a touch of sophistication, while the unique texture of the Xiangyun (mud) silk ensures a standout look. Perfect for pairing with skirts, trousers, or layering under a blazer, this versatile piece is a must-have for any fashion-forward wardrobe.\n\n- Sleeveless Xiangyun silk (100% mulberry silk base) top\n- Naturally dyed for sustainability\n- Minimalist design\n- Luxurious and unique texture\n- Versatile for various occasions\n\n --------------\nI like to add a little summary if the audience doesn't want all the paragraphs. This helps them to glimpse the functionality, benefits, styles, material (necessary things that they need to know) in a quick way.\n\nTags (SEO)\n-Add up to 13 tags to help people search for your listings.\n-Tags must be between 1 and 20 characters.\n`,
            },
          ],
        },
        {
          role: 'user',
          content: imageObjects, // Pass the array of image_url objects
        },
      ],
      response_format: {
        type: 'text',
      },
      temperature: 1,
      max_completion_tokens: 2048,
      top_p: 1,
      frequency_penalty: 0,
      presence_penalty: 0,
    });

    // Check for valid response and log the output
    if (response.choices && response.choices.length > 0) {
      return response.choices[0].message.content;
    } else {
      console.error('Unexpected response format:', response);
    }
  } catch (error) {
    // Log error for debugging
    if (error.response) {
      console.error('API Error Response:', error.response.data);
    } else {
      console.error('Error communicating with OpenAI API:', error.message);
    }
  }
}

async function updateTrackingFile(folderName) {
  const trackingFile = bucket.file('record/tracking_record.txt');
  try {
    const [exists] = await trackingFile.exists();
    let folderNames = [];

    if (exists) {
      const [data] = await trackingFile.download();
      folderNames = data.toString().trim().split('\n');
    }

    // Prepend the new folder name to the array
    if (!folderNames.includes(folderName)) {
      folderNames.unshift(folderName); // Add the folder name at the beginning
      await trackingFile.save(folderNames.join('\n'), { contentType: 'text/plain' });
      console.log(`Folder name "${folderName}" added to the top of tracking_record.txt`);
    }
  } catch (error) {
    console.error('Error updating tracking_record.txt:', error.message);
  }
}


app.post('/process-urls', async (req, res) => {
  try {
    const { folderName, urls } = req.body;
    if (!urls || !Array.isArray(urls) || urls.length === 0) {
      return res.status(400).json({ message: 'No URLs provided.' });
    }
    console.log("Received folderName:", folderName);
    console.log("Received URLs:", urls);

    // Generate a description based on the file URLs
    const description = await generateDescription(folderName, urls);
    console.log("Generated description:", description);

    // Save the description to Firebase Storage in the given folder
    const descriptionToken = crypto.randomBytes(16).toString('hex');
    const descriptionFile = bucket.file(`${folderName}/description.txt`);
    await descriptionFile.save(description, {
      contentType: 'text/plain',
      metadata: { metadata: { firebaseStorageDownloadTokens: descriptionToken } },
    });
    const descriptionUrl = `https://firebasestorage.googleapis.com/v0/b/${bucket.name}/o/${encodeURIComponent(
      `${folderName}/description.txt`
    )}?alt=media&token=${descriptionToken}`;

    // Update the tracking file
    await updateTrackingFile(folderName);

    res.status(200).json({
      message: 'Processing complete.',
      folderName,
      urls,
      descriptionUrl,
      description,
    });
  } catch (error) {
    console.error("Error processing URLs:", error.message);
    res.status(500).json({ message: 'Internal server error processing URLs.', error: error.message });
  }
});
// Upload endpoint
// app.post("/upload", upload.array("images", 10), async (req, res) => {
//     try {
//       console.log("🔵 Upload request received!");
  
//       if (!req.files || req.files.length === 0) {
//         console.warn("⚠️ No files uploaded.");
//         return res.status(400).json({ message: "No files uploaded." });
//       }
  
//       console.log(`🟢 ${req.files.length} file(s) received.`);
//       console.log("Request Body:", req.body); // ✅ Log incoming request body
  
//       const folderName = req.body.folderName || `group-${Date.now()}`;
//       const urls = [];
  
//       for (const file of req.files) {
//         console.log(`🟡 Processing file: ${file.originalname}`);
  
//         const uniqueSuffix = `${Date.now()}-${crypto.randomBytes(4).toString("hex")}`;
//         const fileName = `${folderName}/${uniqueSuffix}-${file.originalname}`;
//         const blob = bucket.file(fileName);
//         const token = crypto.randomBytes(16).toString("hex");
  
//         const blobStream = blob.createWriteStream({
//           metadata: {
//             contentType: file.mimetype,
//             metadata: { firebaseStorageDownloadTokens: token },
//           },
//         });
  
//         await new Promise((resolve, reject) => {
//           blobStream.on("error", (error) => {
//             console.error("🔴 BlobStream Error:", error.message);
//             reject(error);
//           });
  
//           blobStream.on("finish", () => {
//             const encodedPath = encodeURIComponent(fileName);
//             const publicUrl = `https://firebasestorage.googleapis.com/v0/b/${bucket.name}/o/${encodedPath}?alt=media&token=${token}`;
//             urls.push(publicUrl);
//             console.log(`✅ File uploaded: ${publicUrl}`);
//             resolve();
//           });
  
//           blobStream.end(file.buffer);
//         });
//       }
  
//       console.log("✅ All files uploaded successfully!");
  
//       // ✅ Debug ChatGPT API call
//       console.log("🔵 Sending request to ChatGPT...");
//       const description = await generateDescription(folderName, urls);
      
//       if (!description) {
//         console.error("🔴 ChatGPT returned an empty description.");
//         return res.status(500).json({ message: "ChatGPT failed to generate description." });
//       }
  
//       console.log("🟢 ChatGPT description generated:", description);
  
//       // ✅ Save description in Firebase Storage
//       const descriptionToken = crypto.randomBytes(16).toString("hex");
//       const descriptionFile = bucket.file(`${folderName}/description.txt`);
  
//       await descriptionFile.save(description, {
//         contentType: "text/plain",
//         metadata: { metadata: { firebaseStorageDownloadTokens: descriptionToken } },
//       });
  
//       const descriptionUrl = `https://firebasestorage.googleapis.com/v0/b/${bucket.name}/o/${encodeURIComponent(
//         `${folderName}/description.txt`
//       )}?alt=media&token=${descriptionToken}`;
  
//       console.log(`✅ Description saved to: ${descriptionUrl}`);
  
//       res.status(200).json({
//         message: "Files uploaded successfully!",
//         urls,
//         descriptionUrl,
// //         description,
//       });
//     } catch (error) {
//       console.error("🔴 Upload Error:", error.message);
//       res.status(500).json({ message: "Internal server error.", error: error.message });
//     }
//   });
  
// Database content endpoint
app.get('/database-content', async (req, res) => {
  try {
    const textLogFile = bucket.file('record/tracking_record.txt');
    const [fileExists] = await textLogFile.exists();

    if (!fileExists) {
      console.warn('tracking_record.txt does not exist.');
      return res.status(404).send({ message: 'tracking_record.txt does not exist.' });
    }

    const [data] = await textLogFile.download();
    const folderNames = data.toString().trim().split('\n');
    const databaseContent = {};

    for (const folderName of folderNames) {
      if (!folderName.trim()) continue;

      const [files] = await bucket.getFiles({ prefix: `${folderName}/` });

      const fileUrls = await Promise.all(
        files.map(async (file) => {
          const [metadata] = await file.getMetadata();
          const encodedPath = encodeURIComponent(metadata.name);
          const token = metadata.metadata?.firebaseStorageDownloadTokens;

          if (!token) {
            console.warn(`File ${file.name} does not have a token. Skipping.`);
            return null;
          }

          return `https://firebasestorage.googleapis.com/v0/b/${bucket.name}/o/${encodedPath}?alt=media&token=${token}`;
        })
      );

      databaseContent[folderName] = fileUrls.filter(Boolean);
    }

    res.status(200).send(databaseContent);
  } catch (error) {
    console.error('Error fetching database content:', error.message);
    res.status(500).send({ message: 'Failed to fetch database content.' });
  }
});


  

// Serve static files
app.use(express.static(path.join(__dirname, 'public')));

// Serve the HTML file
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'public/index.html'));
});


export const api = functions.https.onRequest(app);


