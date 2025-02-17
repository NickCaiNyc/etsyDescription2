import React from "react";
import { Link } from "react-router-dom";
import { auth } from "../firebase";
import { signOut } from "firebase/auth";
import { useNavigate } from "react-router-dom";
import "./Header.css"; // Ensure you have a CSS file for styling

function Header({ user }) {
  const navigate = useNavigate();

  const handleLogout = async () => {
    await signOut(auth);
    navigate("/login"); // Redirect to login page after logout
  };

  return (
    <header className="header">
      <Link to="/" className="logo">
        <h1>Snaptext.ai</h1>
      </Link>

      <div className="auth-section">
        {user ? (
          <>
            <span className="user-email">Welcome, {user.email}</span>
            <button className="auth-button logout-button" onClick={handleLogout}>
              Logout
            </button>
            <Link to="/upload">
              <button className="auth-button logout-button">Description</button>
            </Link>
          </>
        ) : <></>}
      </div>
    </header>
  );
}

export default Header;
