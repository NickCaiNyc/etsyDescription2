import React, { useState, useEffect } from "react";
import FolderItem from "./FolderItem";

const API_BASE_URL = "https://api-uwrtbx5ffa-uc.a.run.app";

function FolderList() {
  const [folders, setFolders] = useState({});

  const fetchDatabaseContent = async () => {
    try {
      // Retrieve the Firebase ID token from localStorage
      const token = localStorage.getItem("idToken");
      if (!token) {
        throw new Error("No token available. Please log in again.");
      }
      const response = await fetch(`${API_BASE_URL}/database-content`, {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${token}`
        }
      });
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
  const handleDelete = async (folderName) => {
    try {
      const token = localStorage.getItem("idToken");
      if (!token) {
        throw new Error("No token available. Please log in again.");
      }
      // Send a DELETE request to the backend with the folderName
      const response = await fetch(`${API_BASE_URL}/delete-submission`, {
        method: "DELETE",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${token}`
        },
        body: JSON.stringify({ folderName })
      });
      const data = await response.json();
      if (response.ok) {
        console.log("Folder deleted successfully:", data);
        // Refresh the folder list
        fetchDatabaseContent();
      } else {
        console.error("Error deleting folder:", data.message);
      }
    } catch (error) {
      console.error("Error deleting folder:", error);
    }
  };

  // Fetch data on mount, then poll every 10 seconds
  useEffect(() => {
    fetchDatabaseContent();
    const intervalId = setInterval(fetchDatabaseContent, 10000);
    return () => clearInterval(intervalId);
  }, []);

  return (
    <div>
      <h2>Folders</h2>
      {Object.keys(folders).map((folderName) => (
        <FolderItem 
          key={folderName} 
          folderName={folderName} 
          files={folders[folderName]} 
          onDelete={handleDelete} // Pass delete handler as prop
        />
      ))}
    </div>
  );
}

export default FolderList;
