import React, { useState } from "react";
import { auth } from "../firebase";
import { 
  signInWithEmailAndPassword, 
  GoogleAuthProvider, 
  signInWithPopup,
  sendPasswordResetEmail 
} from "firebase/auth";

const FirebaseLogin = () => {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showEmailForm, setShowEmailForm] = useState(false);

  const handleEmailLogin = async (e) => {
    e.preventDefault();
    try {
      await signInWithEmailAndPassword(auth, email, password);
      alert("Logged in successfully!");
    } catch (error) {
      alert(error.message);
    }
  };

  const handleGoogleLogin = async () => {
    const provider = new GoogleAuthProvider();
    try {
      await signInWithPopup(auth, provider);
      alert("Logged in with Google successfully!");
    } catch (error) {
      if (error.code === "auth/popup-closed-by-user") {
        alert("Sign-in popup was closed before completing sign in. Please try again.");
      } else {
        alert(error.message);
      }
    }
  };

  const handleResetPassword = async () => {
    if (!email) {
      alert("Please enter your email address in the field above to reset your password.");
      return;
    }
    try {
      await sendPasswordResetEmail(auth, email);
      alert("Password reset email sent! Please check your inbox.");
    } catch (error) {
      alert(error.message);
    }
  };

  return (
    <div className="firebase-login-container">
      <h2>Sign In</h2>
      <button className="google-btn" onClick={handleGoogleLogin}>
        Sign in with Google
      </button>
      <div className="divider">
        <span>or</span>
      </div>
      {!showEmailForm ? (
        <button className="email-toggle-btn" onClick={() => setShowEmailForm(true)}>
          Sign in by Email
        </button>
      ) : (
        <form onSubmit={handleEmailLogin} className="email-login-form">
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
          <button type="submit" className="login-btn">
            Log In
          </button>
          <div className="forgot-password">
            <button 
              type="button" 
              className="forgot-password-btn" 
              onClick={handleResetPassword}
            >
              Forgot Password?
            </button>
          </div>
        </form>
      )}
    </div>
  );
};

export default FirebaseLogin;
