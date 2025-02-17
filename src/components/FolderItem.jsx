import React, { useState, useEffect } from "react";

function FolderItem({ folderName, files, onDelete }) {
  const [description, setDescription] = useState("");

  useEffect(() => {
    const descriptionFile = files.find((file) => file.includes("description.txt"));
    if (descriptionFile) {
      fetch(descriptionFile)
        .then((response) => response.text())
        .then((text) => setDescription(text))
        .catch((error) => console.error("Error fetching description:", error));
    }
  }, [files]);

  return (
    <div style={{ border: "1px solid #ccc", marginBottom: "20px", padding: "10px" }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
        <h3>{folderName}</h3>
        <button onClick={() => onDelete(folderName)} style={{ color: "red", fontWeight: "bold" }}>X</button>
      </div>
      <div>
        {files.filter((file) => !file.includes("description.txt")).map((file, index) => (
          <img key={index} src={file} alt={folderName} style={{ width: "150px", margin: "5px" }} />
        ))}
      </div>
      {/* Optionally display description if available */}
      {files.some((file) => file.includes("description.txt")) && (
        <div style={{ marginTop: "10px", padding: "10px", backgroundColor: "#f9f9f9", borderRadius: "5px" }}>
          <h4>Description:</h4>
          {description && (
            <div style={{ marginTop: "10px", border: "1px solid #ccc", padding: "10px", borderRadius: "5px", backgroundColor: "#f9f9f9" }}>
              <div dangerouslySetInnerHTML={{ __html: description }} />
            </div>
          )}
        </div>
      )}
    </div>
  );
}

export default FolderItem;