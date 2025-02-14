import React, { useState, useEffect } from "react";
import { ref, uploadBytesResumable, getDownloadURL } from "firebase/storage";
import { storage, auth } from "../firebase"; // Import Firebase Auth & Storage

const API_BASE_URL = "https://api-uwrtbx5ffa-uc.a.run.app";

function UploadForm() {
  const [files, setFiles] = useState([]);
  const [previews, setPreviews] = useState([]);
  const [uploading, setUploading] = useState(false);

  // 🖼️ Generate Image Previews
  useEffect(() => {
    if (files.length > 0) {
      const newPreviews = files.map((file) => URL.createObjectURL(file));
      setPreviews(newPreviews);
      return () => newPreviews.forEach((url) => URL.revokeObjectURL(url));
    } else {
      setPreviews([]);
    }
  }, [files]);

  // 🚀 Upload Files to Firebase Storage
  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!auth.currentUser) {
      alert("You must be logged in to upload files.");
      return;
    }

    if (files.length === 0) {
      alert("Please select at least one file.");
      return;
    }

    // 🔹 Ensure Only Images Are Uploaded
    const allowedFileTypes = ["image/jpeg", "image/png", "image/webp"];
    if (!files.every((file) => allowedFileTypes.includes(file.type))) {
      alert("Only JPG, PNG, and WEBP images are allowed.");
      return;
    }

    setUploading(true);
    const userId = auth.currentUser.uid;
    const folderName = `users/${userId}/uploads/`;
    const fileUrls = [];

    try {
      for (const file of files) {
        const uniqueSuffix = `${Date.now()}-${Math.floor(Math.random() * 10000)}`;
        const filePath = `${folderName}${uniqueSuffix}-${file.name}`;
        const storageRef = ref(storage, filePath);
        const uploadTask = uploadBytesResumable(storageRef, file);

        // 🎯 Get Download URL after Upload
        const downloadURL = await new Promise((resolve, reject) => {
          uploadTask.on(
            "state_changed",
            null,
            (error) => {
              console.error(`❌ Upload failed for ${file.name}:`, error);
              reject(error);
            },
            async () => {
              const url = await getDownloadURL(uploadTask.snapshot.ref);
              console.log(`✅ Uploaded: ${url}`);
              fileUrls.push(url);
              resolve(url);
            }
          );
        });
      }

      // 🔐 Get Firebase Auth Token
      const token = await auth.currentUser.getIdToken();

      // 🔄 Send URLs to the Backend
      const response = await fetch(`${API_BASE_URL}/process-urls`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${token}`,
        },
        body: JSON.stringify({ userId, urls: fileUrls }),
      });

      if (!response.ok) {
        const errorText = await response.text();
        console.error("❌ Backend error:", errorText);
        throw new Error("Backend error: " + response.status);
      }

      alert("🎉 Upload successful!");
      setFiles([]);
      setPreviews([]);
      document.querySelector('input[type="file"]').value = ""; // ✅ Reset File Input

    } catch (error) {
      console.error("❌ Error during upload:", error);
      alert("Error during upload.");
    } finally {
      setUploading(false);
    }
  };

  return (
    <div>
      <form onSubmit={handleSubmit}>
        <input type="file" multiple onChange={(e) => setFiles([...e.target.files])} required disabled={uploading} />
        <button type="submit" disabled={uploading}>
          {uploading ? "Uploading..." : "Upload"}
        </button>
        <button type="button" onClick={() => setFiles([])} disabled={uploading}>
          Clear
        </button>
      </form>

      {previews.length > 0 && (
        <div style={{ marginTop: "20px" }}>
          <h3>Selected Images:</h3>
          <div style={{ display: "flex", flexWrap: "wrap" }}>
            {previews.map((src, index) => (
              <div key={index} style={{ margin: "10px" }}>
                <img src={src} alt={`Preview ${index + 1}`} style={{ width: "150px", height: "150px", objectFit: "cover", border: "1px solid #ccc" }} />
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

export default UploadForm;
