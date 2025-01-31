import React, { useEffect, useState } from "react";
import FolderItem from "./FolderItem";

function FolderList() {
  const [folders, setFolders] = useState({});

  useEffect(() => {
    fetchDatabaseContent();
  }, []);

  const fetchDatabaseContent = async () => {
    try {
      const response = await fetch("http://localhost:3000/database-content");
      const data = await response.json();
      if (response.ok) {
        setFolders(data);
      } else {
        console.error("Error fetching database content:", data.message);
      }
    } catch (error) {
      console.error("Error fetching database content:", error);
    }
  };

  return (
    <div>
      <h2>Folders</h2>
      {Object.keys(folders).map((folderName) => (
        <FolderItem key={folderName} folderName={folderName} files={folders[folderName]} />
      ))}
    </div>
  );
}

export default FolderList;