import React, { useState } from "react";

function UploadForm() {
  const [files, setFiles] = useState([]);
  const [userInput, setUserInput] = useState("");

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (files.length === 0) {
      alert("Please select at least one file.");
      return;
    }

    const formData = new FormData();
    formData.append("folderName", `group-${Date.now()}`);
    files.forEach((file) => formData.append("images", file));

    try {
      const response = await fetch("http://localhost:3000/upload", {
        method: "POST",
        body: formData,
      });
      const result = await response.json();
      if (response.ok) {
        alert(`Upload successful! URLs: ${result.urls.join(", ")}`);
        window.location.reload(); // Refresh the page to update the folder list
      } else {
        alert(`Upload failed: ${result.message}`);
      }
    } catch (error) {
      console.error("Error uploading files:", error);
      alert("Error uploading files.");
    }
  };

  return (
    <form onSubmit={handleSubmit}>
      <input type="file" multiple onChange={(e) => setFiles([...e.target.files])} required />
      <input
        type="text"
        value={userInput}
        onChange={(e) => setUserInput(e.target.value)}
        placeholder="Enter additional description"
      />
      <button type="submit">Upload</button>
      <button type="button" onClick={() => setFiles([])}>Clear</button>
    </form>
  );
}

export default UploadForm;