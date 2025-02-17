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

dotenv.config();
// Convert __dirname for ES modules
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Initialize Firebase Admin with your base64-encoded service account
const serviceAccount = JSON.parse(
  Buffer.from(process.env.FB_ADMINSDK, "base64").toString("utf-8")
);

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount),
  storageBucket: process.env.FB_BUCKET,
});

const app = express();
const bucket = admin.storage().bucket();
const allowedOrigins = [
  "https://etsydb-fdad2.web.app",
  "http://localhost:5173"
];

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

app.use(express.json());

// Initialize OpenAI
const openai = new OpenAI({
  apiKey: process.env.OPEN_AI_APIKEY,
});

// -----------------------
// Authentication Middleware
// -----------------------
async function authenticate(req, res, next) {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    return res.status(401).json({ message: "Unauthorized: No token provided" });
  }
  const token = authHeader.split("Bearer ")[1];
  try {
    const decodedToken = await admin.auth().verifyIdToken(token);
    req.user = decodedToken; // Contains uid, email, etc.
    next();
  } catch (error) {
    console.error("Authentication error:", error);
    return res.status(401).json({ message: "Unauthorized: Invalid token" });
  }
}

// -----------------------
// Description Generator
// -----------------------
async function generateDescription(folderName, urls) {
  console.log("Generating description for URLs:", urls);
  try {
    const imageObjects = urls.map((url) => ({
      type: 'image_url',
      image_url: { url },
    }));

    const response = await openai.chat.completions.create({
      model: 'gpt-4o-mini',
      messages: [
        {
          role: 'system',
          content: [
            {
              type: 'text',
              text: `Format:HTML
Title
- 140 characters max. with punctuation and space counted.

Tips:
1. The first 30 characters are the most important (they appear first). So the language has to be precise, simple, put the most important value of your item on the first 5-7 words.
2. The responses should be set in html formate. Each section seperated by section.
Description 
What makes your item special? Buyers will only see the first few lines unless they expand the description.

Tips:
-Describe specific details rather than make generalizations.

1. Think about what your audience values and adjust the description accordingly. A small boutique (and etsy shoppers) tend to value the hand-made, labor-intensive process. The current trend in America prefers small, family-owned and women-run businesses. If the shop has those values, this also means that you might describe the clothing differently, or with a different emphasis for in-person boutique sales rather than online sales.
 
2. For online descriptions, think about what a picture *cannot* convey easily, and use your descriptions to bridge the gap. Are there design details that are not obvious from the pictures (example: the buttons on the tank dress)? Use your writing as a spotlight to draw your attention to those details. Remember that what you describe is what your audience will notice. Also, think in terms of all five senses, not just the visual.
 
3. Be concrete in your descriptions as much as possible. I think it's helpful to hint at usage (where the buyer can wear the item, etc), but mostly focus on very specific things that the buyer can actually see and feel once the clothing arrives at their door. This helps to give a sense of the value in the listing, and reinforce that sense of value once it arrives in your buyer's home.

This is the example of mine:

Design:
Elevate your wardrobe with our elegant sleeveless top, meticulously crafted from 100% mulberry silk and naturally dyed for a sustainable touch. This top boasts a sleek, minimalist design that effortlessly transitions from day to night. The rich black hue adds a touch of sophistication, while the unique texture of the Xiangyun (mud) silk ensures a standout look. Perfect for pairing with skirts, trousers, or layering under a blazer, this versatile piece is a must-have for any fashion-forward wardrobe.

- Sleeveless Xiangyun silk (100% mulberry silk base) top
- Naturally dyed for sustainability
- Minimalist design
- Luxurious and unique texture
- Versatile for various occasions

--------------
I like to add a little summary if the audience doesn't want all the paragraphs. This helps them to glimpse the functionality, benefits, styles, material (necessary things that they need to know) in a quick way.

Tags (SEO)
-Add up to 13 tags to help people search for your listings.
-Tags must be between 1 and 20 characters.
`
            },
          ],
        },
        {
          role: 'user',
          content: imageObjects,
        },
      ],
      response_format: { type: 'text' },
      temperature: 1,
      max_completion_tokens: 2048,
      top_p: 1,
      frequency_penalty: 0,
      presence_penalty: 0,
    });

    if (response.choices && response.choices.length > 0) {
      return response.choices[0].message.content;
    } else {
      console.error('Unexpected response format:', response);
    }
  } catch (error) {
    if (error.response) {
      console.error('API Error Response:', error.response.data);
    } else {
      console.error('Error communicating with OpenAI API:', error.message);
    }
  }
}

// -----------------------
// Update Tracking File
// -----------------------
async function updateTrackingFile(folderName) {
  // Extract userId from folderName.
  const parts = folderName.split('/');
  if (parts.length < 2) {
    console.error('Invalid folderName format');
    return;
  }
  const userId = parts[1];
  // The tracking record will be kept at: "users/<userId>/record/tracking_record.txt"
  const trackingFile = bucket.file(`users/${userId}/record/tracking_record.txt`);
  try {
    const [exists] = await trackingFile.exists();
    let folderNames = [];
    if (exists) {
      const [data] = await trackingFile.download();
      folderNames = data.toString().trim().split('\n');
    }
    // Prepend the new folder name if not already present.
    if (!folderNames.includes(folderName)) {
      folderNames.unshift(folderName);
      await trackingFile.save(folderNames.join('\n'), { contentType: 'text/plain' });
      console.log(`Folder name "${folderName}" added to the top of tracking_record.txt`);
    }
  } catch (error) {
    console.error('Error updating tracking_record.txt:', error.message);
  }
}

// -----------------------
// Process URLs Endpoint (Protected)
// -----------------------
app.post('/process-urls', authenticate, async (req, res) => {
  try {
    const { folderName, urls } = req.body;
    // Optionally, verify that folderName belongs to the authenticated user.
    const userId = req.user.uid;
    if (!folderName || !folderName.startsWith(`users/${userId}`)) {
      return res.status(400).json({ message: 'Invalid folderName for this user.' });
    }
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


// -----------------------
// Database Content Endpoint (Protected)
// -----------------------
app.get('/database-content', authenticate, async (req, res) => {
  try {
    const userId = req.user.uid;
    const trackingFilePath = `users/${userId}/record/tracking_record.txt`;
    const textLogFile = bucket.file(trackingFilePath);
    
    const [fileExists] = await textLogFile.exists();
    if (!fileExists) {
      console.warn(`tracking_record.txt does not exist for user ${userId}.`);
      return res.status(404).json({ message: 'tracking_record.txt does not exist.' });
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
    
    res.status(200).json(databaseContent);
  } catch (error) {
    console.error('Error fetching database content:', error.message);
    res.status(500).json({ message: 'Failed to fetch database content.' });
  }
});


// DELETE /delete-submission
// Protected endpoint: only the authenticated user can delete their own submission folder.
app.delete('/delete-submission', authenticate, async (req, res) => {
  try {
    const { folderName } = req.body;
    const userId = req.user.uid;
    // Ensure that the folderName starts with the authenticated user's path
    if (!folderName || !folderName.startsWith(`users/${userId}`)) {
      return res.status(400).json({ message: "Invalid folderName for this user." });
    }
    
    // List all files in the folder
    const [files] = await bucket.getFiles({ prefix: `${folderName}/` });
    // Delete all files concurrently
    await Promise.all(files.map((file) => file.delete()));
    
    // Optionally, remove the folder entry from the tracking file
    await removeFolderFromTrackingFile(folderName, userId);
    
    res.status(200).json({ message: "Folder deleted successfully." });
  } catch (error) {
    console.error("Error deleting submission:", error.message);
    res.status(500).json({ message: "Internal server error deleting submission.", error: error.message });
  }
});

// Helper function to remove a folder from the tracking file
async function removeFolderFromTrackingFile(folderName, userId) {
  const trackingFile = bucket.file(`users/${userId}/record/tracking_record.txt`);
  const [exists] = await trackingFile.exists();
  if (!exists) return;
  const [data] = await trackingFile.download();
  let folderNames = data.toString().trim().split('\n');
  // Remove the folderName from the tracking list
  folderNames = folderNames.filter(fn => fn !== folderName);
  await trackingFile.save(folderNames.join('\n'), { contentType: 'text/plain' });
}



// -----------------------
// Static Files and Root Endpoint
// -----------------------
app.use(express.static(path.join(__dirname, 'public')));
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'public/index.html'));
});

// -----------------------
// Export as Firebase Cloud Function
// -----------------------
export const api = functions.https.onRequest(app);
