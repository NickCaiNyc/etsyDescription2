import React from "react";
import UploadForm from "./components/UploadForm";
import FolderList from "./components/FolderList";

function App() {
  return (
    <div>
      <h1>Upload Images with ChatGPT</h1>
      <UploadForm />
      <FolderList />
    </div>
  );
}

export default App;