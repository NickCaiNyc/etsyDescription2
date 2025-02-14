// src/components/FirebaseLogout.jsx
import React from "react";
import { auth } from "../firebase";
import { signOut } from "firebase/auth";

const FirebaseLogout = () => {
  const handleLogout = async () => {
    try {
      await signOut(auth);
      alert("Logged out successfully!");
    } catch (error) {
      alert(error.message);
    }
  };

  return <button onClick={handleLogout}>Log Out</button>;
};

export default FirebaseLogout;
