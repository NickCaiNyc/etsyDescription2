import React, { useState, useEffect, lazy, Suspense } from "react";
import { BrowserRouter as Router, Routes, Route, Navigate, Link } from "react-router-dom";
import { onAuthStateChanged } from "firebase/auth";
import { auth } from "./firebase";
import Header from "./components/Header";
import "./App.css";

// Lazy load pages/components for performance
const Login = lazy(() => import("./pages/AuthPage"));
const UploadForm = lazy(() => import("./components/UploadForm"));
const FolderList = lazy(() => import("./components/FolderList"));
const FrontPage = lazy(() => import("./pages/FrontPage"));
// Simple Loader component
const Loader = () => (
  <div className="loader">
    <div className="spinner"></div>
  </div>
);



function App() {
  const [user, setUser] = useState(undefined); // Start with undefined
  const [loading, setLoading] = useState(true); // Prevent UI flicker

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (currentUser) => {
      if (currentUser) {
        try {
          const token = await currentUser.getIdToken();
          localStorage.setItem("idToken", token);
          console.log("Token stored:", token);
        } catch (error) {
          console.error("Error retrieving token:", error);
        }
      } else {
        localStorage.removeItem("idToken");
        console.log("User logged out. Token removed.");
      }
      setUser(currentUser);
      setLoading(false); // Finish loading when auth state is known
    });

    return () => unsubscribe();
  }, []);

  if (loading) {
    return <Loader />; // Show the styled loader
  }

  return (
    <Router>
      <div>
        <Header user={user} />
        <div className="outer-wrapper">
          <div className="centered-box">
            <div className="container main-content">
              <Suspense fallback={<Loader />}>
                <Routes>
                  <Route 
                    path="/login" 
                    element={user ? <Navigate to="/" /> : <Login />} 
                  />
                  <Route 
                    path="/upload" 
                    element={user ? (
                      <>
                        <UploadForm />
                        <FolderList />
                      </>
                    ) : (
                      <Navigate to="/login" />
                    )} 
                  />
                  <Route 
                    path="/" 
                    element={user ? <FrontPage /> : <Navigate to="/login" />} 
                  />
                  {/* Catch-all route */}
                  <Route path="*" element={<Navigate to="/" />} />
                </Routes>
              </Suspense>
            </div>
          </div>
        </div>
      </div>
    </Router>
  );
}

export default App;
