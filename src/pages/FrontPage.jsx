// src/pages/FrontPage.jsx
import React from "react";
import { Link } from "react-router-dom";

const FrontPage = () => (
  <div className="frontpage-container">
    <header className="frontpage-header">
      <h1>Snaptext.ai</h1>
      <p>Transforming your images into insightful descriptions with the power of AI.</p>
    </header>
    
    <section className="frontpage-overview">
      <h2>What is Snaptext.ai?</h2>
      <p>
        Snaptext.ai is an innovative platform that combines state-of-the-art image processing with advanced natural language generation. Whether you're looking to automatically generate captions for your photos, enhance accessibility, or create rich content descriptions, Snaptext.ai makes it effortless.
      </p>
    </section>
    
    <section className="frontpage-features">
      <h2>Key Features</h2>
      <ul>
        <li>
          <strong>Seamless Image Uploads:</strong> Easily upload your images with our user-friendly interface.
        </li>
        <li>
          <strong>AI-Driven Descriptions:</strong> Leverage advanced AI to generate accurate and creative descriptions.
        </li>
        <li>
          <strong>Secure & Fast:</strong> Built with the latest technology to ensure your data is safe and processed quickly.
        </li>
        <li>
          <strong>Easy Integration:</strong> Designed to integrate with your existing workflow or content management systems.
        </li>
      </ul>
    </section>
    
    <section className="frontpage-how-it-works">
      <h2>How It Works</h2>
      <p>
        Getting started is as simple as:
      </p>
      <ol>
        <li>
          <strong>Upload your images:</strong> Use our intuitive upload form to add your images.
        </li>
        <li>
          <strong>Let AI do its magic:</strong> Our backend processes your images and generates descriptive text.
        </li>
        <li>
          <strong>Review and use:</strong> Preview your generated descriptions, and use them to enhance your content, boost accessibility, or share with your audience.
        </li>
      </ol>
    </section>
    
    <section className="frontpage-cta">
      <h2>Ready to get started?</h2>
      <p>
        Join thousands of users who are already transforming their images into engaging content. Log in or sign up today and experience the future of image description generation.
      </p>
      <Link to="/upload">
        <button className="button cta-button">Get Started</button>
      </Link>
    </section>
    
    <footer className="frontpage-footer">
      <p>&copy; {new Date().getFullYear()} Snaptext.ai. All rights reserved.</p>
    </footer>
  </div>
);

export default FrontPage;
