import React, { useState, useEffect } from "react";

function FolderItem({ folderName, files }) {
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
    <div>
      <h3>{folderName}</h3>
      <div>
        {files
          .filter((file) => !file.includes("description.txt"))
          .map((file, index) => (
            <img key={index} src={file} alt={folderName} style={{ width: "150px", margin: "5px" }} />
          ))}
      </div>
      {description && (
        <div style={{ marginTop: "10px", border: "1px solid #ccc", padding: "10px", borderRadius: "5px", backgroundColor: "#f9f9f9" }}>
          <div dangerouslySetInnerHTML={{ __html: description }} />
        </div>
      )}
    </div>
  );
}

export default FolderItem;