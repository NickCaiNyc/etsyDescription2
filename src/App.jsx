import React, { useState, useEffect } from "react";
import { BrowserRouter as Router, Routes, Route, Navigate } from "react-router-dom";
import { onAuthStateChanged } from "firebase/auth";
import { auth } from "./firebase";
import UploadForm from "./components/UploadForm";
import FolderList from "./components/FolderList";
import Login from "./pages/AuthPage";
import Header from "./components/Header";
import "./App.css";

function App() {
  const [user, setUser] = useState(undefined); // 🔹 Start with undefined, not null
  const [loading, setLoading] = useState(true); // 🔹 Prevent UI flicker

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
      setUser(currentUser);
      setLoading(false); // 🔹 Finish loading when auth state is known
    });

    return () => unsubscribe();
  }, []);

  if (loading) {
    return <h1>Loading...</h1>; // 🔹 Prevent unnecessary redirects during auth check
  }

  return (
    <Router>
      <div>
        <Header user={user} />

        <Routes>
          <Route path="/login" element={user ? <Navigate to="/upload" /> : <Login />} />
          <Route path="/upload" element={user ? <><UploadForm /><FolderList /></> : <Navigate to="/login" />} />
          <Route path="/" element={user ? <Navigate to="/upload" /> : <Navigate to="/login" />} />
        </Routes>
      </div>
    </Router>
  );
}

export default App;
