import React, { useEffect, useState } from "react";
import FolderItem from "./FolderItem";

const API_BASE_URL = "https://api-uwrtbx5ffa-uc.a.run.app" 

function FolderList() {
  const [folders, setFolders] = useState({});

  useEffect(() => {
    fetchDatabaseContent();
  }, []);

  const fetchDatabaseContent = async () => {
    try {
      const response = await fetch(`${API_BASE_URL}/database-content`);
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