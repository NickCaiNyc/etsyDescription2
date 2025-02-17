import React, { useState, useEffect, useCallback } from "react";
import { storage, auth } from "../firebase"; // Adjust the path if needed
import { ref, uploadBytesResumable, getDownloadURL } from "firebase/storage";
import { onAuthStateChanged } from "firebase/auth";

const backendurl = 'https://api-uwrtbx5ffa-uc.a.run.app';

const UploadForm = () => {
  const [files, setFiles] = useState([]);
  const [previews, setPreviews] = useState([]);
  const [uploadProgresses, setUploadProgresses] = useState({}); // Map file index to progress %
  const [downloadURLs, setDownloadURLs] = useState([]);
  const [error, setError] = useState("");
  const [successMessage, setSuccessMessage] = useState("");
  const [loading, setLoading] = useState(false);
  const [loadingMessage, setLoadingMessage] = useState(""); // Loading message state
  const [user, setUser] = useState(null);
  const [isDragging, setIsDragging] = useState(false);

  // Allowed image MIME types
  const allowedTypes = ["image/png", "image/jpeg", "image/jpg"];

  // Listen for auth state changes
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
      setUser(currentUser);
    });
    return unsubscribe;
  }, []);

  // Function to handle file selection (from input or drop)
  const handleFiles = useCallback((selectedFiles) => {
    // Filter valid image files
    const validFiles = Array.from(selectedFiles).filter((file) =>
      allowedTypes.includes(file.type)
    );

    if (validFiles.length !== selectedFiles.length) {
      setError("One or more files are invalid. Please select only png, jpg, or jpeg files.");
    } else {
      setError("");
    }

    // Append new files to the current selection
    setFiles(prevFiles => [...prevFiles, ...validFiles]);

    // Create preview URLs for the new valid files
    const filePreviews = validFiles.map((file) => URL.createObjectURL(file));
    setPreviews(prevPreviews => [...prevPreviews, ...filePreviews]);
  }, [allowedTypes]);

  // Handle change from file input
  const handleChange = (e) => {
    handleFiles(e.target.files);
  };

  // Drag & Drop handlers
  const handleDragOver = (e) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = (e) => {
    e.preventDefault();
    setIsDragging(false);
  };

  const handleDrop = (e) => {
    e.preventDefault();
    setIsDragging(false);
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      handleFiles(e.dataTransfer.files);
      e.dataTransfer.clearData();
    }
  };

  // Remove a file at a given index (from files and previews arrays)
  const removeFile = (index) => {
    setFiles(prev => prev.filter((_, i) => i !== index));
    setPreviews(prev => prev.filter((_, i) => i !== index));
  };

  // Compute overall progress as an average of all file progress percentages.
  const computeOverallProgress = () => {
    if (files.length === 0) return 0;
    const totalProgress = Object.values(uploadProgresses).reduce(
      (acc, curr) => acc + curr,
      0
    );
    return totalProgress / files.length;
  };

  // Upload files to Firebase Storage using the logged-in user's UID
  const handleUpload = async () => {
    if (!files.length) {
      setError("No files selected.");
      return;
    }
    if (!user) {
      setError("You must be logged in to upload.");
      return;
    }

    setError("");
    setSuccessMessage("");
    setLoading(true);
    setLoadingMessage("Uploading images...");
    setUploadProgresses({});

    // Generate ONE folder for this entire submission
    // e.g., "users/<uid>/submissions/<timestamp>-<randomNumber>"
    const submissionFolder = `users/${user.uid}/${Date.now()}-${Math.floor(
      Math.random() * 1000000
    )}`;

    // Helper: Upload a single file and return a Promise that resolves with its download URL.
    const uploadFile = (file, idx) => {
      return new Promise((resolve, reject) => {
        const storagePath = `${submissionFolder}/${file.name}`;
        const storageRef = ref(storage, storagePath);
        const uploadTask = uploadBytesResumable(storageRef, file);

        uploadTask.on(
          "state_changed",
          (snapshot) => {
            const progress = (snapshot.bytesTransferred / snapshot.totalBytes) * 100;
            setUploadProgresses((prev) => ({ ...prev, [idx]: progress }));
          },
          (uploadError) => {
            reject(uploadError);
          },
          () => {
            getDownloadURL(uploadTask.snapshot.ref)
              .then((url) => resolve(url))
              .catch((err) => reject(err));
          }
        );
      });
    };

    try {
      // Upload all files concurrently, all into the same folder
      const urls = await Promise.all(
        files.map((file, idx) => uploadFile(file, idx))
      );
      setDownloadURLs(urls);

      // Optionally clear selected files and previews after upload
      setFiles([]);
      setPreviews([]);
      setUploadProgresses({});

      // Update loading message for description generation.
      setLoadingMessage("Generating description...");

      // Retrieve token from localStorage (set in your App.jsx on auth change)
      const token = localStorage.getItem("idToken");
      if (!token) {
        throw new Error("No token available. Please log in again.");
      }

      // Pass the submission folder name and image URLs to the backend.
      const response = await fetch(`${backendurl}/process-urls`, {
        method: "POST",
        headers: { 
          "Content-Type": "application/json",
          "Authorization": `Bearer ${token}`
        },
        body: JSON.stringify({
          folderName: submissionFolder,
          urls, // Sending the array of URLs along with the folder name.
        }),
      });
      const result = await response.json();
      if (!response.ok) {
        setError(result.message || "Error processing submission");
      } else {
        console.log("Backend processed submission:", result);
        setSuccessMessage("Images uploaded and description generated successfully!");
      }
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
      setLoadingMessage("");
    }
  };

  return (
    <div className="upload-form">
      <h2>Upload Images</h2>
      {!user && <p>Please log in to upload images.</p>}
      {/* Preview selected images with an "X" button to remove each */}
      {previews.length > 0 && (
        <div style={{ display: "flex", flexWrap: "wrap", marginTop: "10px" }}>
          {previews.map((preview, idx) => (
            <div key={idx} style={{ margin: "10px", position: "relative" }}>
              <img
                src={preview}
                alt={`Preview ${idx}`}
                style={{ width: "200px", height: "auto", border: "1px solid #ccc" }}
              />
              <button
                onClick={() => removeFile(idx)}
                style={{
                  position: "absolute",
                  top: "5px",
                  right: "5px",
                  background: "rgba(0,0,0,0.6)",
                  color: "white",
                  border: "none",
                  borderRadius: "50%",
                  width: "24px",
                  height: "24px",
                  cursor: "pointer"
                }}
              >
                X
              </button>
            </div>
          ))}
        </div>
      )}
      {user && (
        <div
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          onDrop={handleDrop}
          style={{
            border: "2px dashed #ccc",
            padding: "20px",
            position: "relative",
            backgroundColor: isDragging ? "rgba(0, 0, 0, 0.05)" : "transparent",
          }}
        >
          {/* If dragging, show overlay text */}
          {isDragging && (
            <div style={{
              position: "absolute",
              top: 0,
              left: 0,
              right: 0,
              bottom: 0,
              backgroundColor: "rgba(0, 0, 0, 0.1)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              pointerEvents: "none",
              fontSize: "1.5rem",
              color: "#555"
            }}>
              Drag and drop your images here
            </div>
          )}
          <input
            type="file"
            multiple
            onChange={handleChange}
            accept="image/*"
            disabled={loading}
            style={{ opacity: isDragging ? 0.5 : 1 }}
          />
          <button onClick={handleUpload} disabled={loading}>
            {loading ? "Processing..." : "Upload"}
          </button>
        </div>
      )}

      {loading && (
        <div style={{ display: "flex", alignItems: "center", marginTop: "10px" }}>
          <div
            className="spinner"
            style={{
              width: "24px",
              height: "24px",
              border: "4px solid #f3f3f3",
              borderTop: "4px solid #3498db",
              borderRadius: "50%",
              animation: "spin 2s linear infinite",
              marginRight: "10px"
            }}
          ></div>
          <p>{loadingMessage}</p>
        </div>
      )}
      {error && <p style={{ color: "red" }}>{error}</p>}
      {successMessage && <p style={{ color: "green" }}>{successMessage}</p>}

      

      {/* Display overall upload progress as a single progress bar */}
      {Object.keys(uploadProgresses).length > 0 && (
        <div style={{ marginTop: "20px" }}>
          <h3>Overall Upload Progress:</h3>
          <progress value={computeOverallProgress()} max="100" style={{ width: "100%" }} />
          <p>{Math.round(computeOverallProgress())}%</p>
        </div>
      )}
    </div>
  );
};

export default UploadForm;
