import React, { useState } from "react";
import { useNavigate } from "react-router-dom";

function Login({ onLogin }) {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const navigate = useNavigate();

  const handleSubmit = (e) => {
    e.preventDefault();

    // Simple fake login check (you can replace with API later)
    if (username === "admin" && password === "1234") {
      onLogin(); // update state in App
     navigate("/student"); 

    } else {
      setError("Invalid username or password");
    }
  };

  return (
    <div style={{ display: "flex", justifyContent: "center", }}>
      <form 
        onSubmit={handleSubmit} 
        style={{
          display: "flex",
          flexDirection: "column",
          width: "300px",
          padding: "20px",
          border: "1px solid #ccc",
          borderRadius: "8px",
          boxShadow: "0 2px 8px rgba(0,0,0,0.1)",
          position:"absolute",
          top:"2vh"
        }}
      >
        <h2>Login</h2>

        {error && <p style={{ color: "red" }}>{error}</p>}

        <label>Username</label>
        <input
          type="text"
          value={username}
          onChange={(e) => setUsername(e.target.value)}
          required
        />

        <label>Password</label>
        <input
          type="password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          required
        />

        <button type="submit" style={{ marginTop: "15px", padding: "10px" }}>
          Login
        </button>
      </form>
    </div>
  );
}

export default Login;
