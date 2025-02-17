import React, { useState } from "react";
import { auth } from "../firebase";
import { createUserWithEmailAndPassword, GoogleAuthProvider, signInWithPopup } from "firebase/auth";

const FirebaseSignUp = () => {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showEmailForm, setShowEmailForm] = useState(false);

  const handleEmailSignUp = async (e) => {
    e.preventDefault();
    try {
      await createUserWithEmailAndPassword(auth, email, password);
      alert("Account created successfully!");
    } catch (error) {
      alert(error.message);
    }
  };

  const handleGoogleSignUp = async () => {
    const provider = new GoogleAuthProvider();
    try {
      await signInWithPopup(auth, provider);
      alert("Signed up with Google successfully!");
    } catch (error) {
      alert(error.message);
    }
  };

  return (
    <div className="firebase-login-container">
      <h2>Create Account</h2>
      <button className="google-btn" onClick={handleGoogleSignUp}>
        Sign Up with Google
      </button>
      <div className="divider">
        <span>or</span>
      </div>
      {!showEmailForm ? (
        <button className="email-toggle-btn" onClick={() => setShowEmailForm(true)}>
          Sign Up by Email
        </button>
      ) : (
        <form onSubmit={handleEmailSignUp} className="email-login-form">
          <input 
            type="email" 
            placeholder="Email" 
            value={email} 
            onChange={(e) => setEmail(e.target.value)} 
            required 
            className="input-field"
          />
          <input 
            type="password" 
            placeholder="Password" 
            value={password} 
            onChange={(e) => setPassword(e.target.value)} 
            required 
            className="input-field"
          />
          <button type="submit" className="signup-btn">
            Sign Up
          </button>
        </form>
      )}
    </div>
  );
};

export default FirebaseSignUp;
