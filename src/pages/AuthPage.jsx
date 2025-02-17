import React, { useState } from "react";
import FirebaseSignUp from "../components/FirebaseSignupAuth";
import FirebaseLogin from "../components/FirebaseLoginAuth";

const AuthPage = () => {
  const [isSignUp, setIsSignUp] = useState(false);

  return (
    <div className="auth-container">
      {isSignUp ? <FirebaseSignUp /> : <FirebaseLogin />}
      <p 
        onClick={() => setIsSignUp(!isSignUp)} 
        style={{ cursor: "pointer", color: "blue", textDecoration: "underline", marginTop: "20px" }}
      >
        {isSignUp ? "Already have an account? Sign In" : "New user? Sign Up"}
      </p>
    </div>
  );
};

export default AuthPage;
