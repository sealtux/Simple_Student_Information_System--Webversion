import React, { useState } from "react";
import { useNavigate } from "react-router-dom";

function Signup() {
  const [username, setUsername] = useState(""); 
  const [password, setPassword] = useState("");
  const [confirmPass, setConfirmPass] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState("");

  const navigate = useNavigate();

  const handleSignup = async (e) => {
    e.preventDefault();
    setError("");

    if (password !== confirmPass) {
      setError("Passwords do not match!");
      return;
    }

    const response = await fetch("http://localhost:5000/signup/", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        username,
        password,
      }),
    });

    const data = await response.json();

    if (!response.ok) {
      setError(data.error || "Signup failed");
      return;
    }

    alert("Signup successful!");
    navigate("/login");
  };

  return (
    <div
      style={{
        display: "flex",
        justifyContent: "center",
        alignItems: "center",
        height: "100vh",
        width: "100vw",
        backgroundColor: "#f8f8f8",
      }}
    >
      <form
        onSubmit={handleSignup}
        style={{
          display: "flex",
          flexDirection: "column",
          width: "600px",
          height: "420px",
          padding: "40px",
          border: "1px solid #e6e6e6",
          borderRadius: "8px",
          boxShadow: "0 2px 8px rgba(0,0,0,0.1)",
          backgroundColor: "white",
          position: "relative",
        }}
      >
        <h2>Sign Up</h2>

        {error && (
          <p style={{ color: "red", marginTop: "60px", position: "absolute" }}>
            {error}
          </p>
        )}

        {/* USERNAME */}
        <label
          style={{
            color: "#5C5EAD",
            marginTop: "100px",
            marginLeft: "6vh",
            position: "absolute",
            fontSize: "1.2rem",
            fontWeight: "bold",
          }}
        >
          Username
        </label>

        <input
          type="text"
          style={{
            backgroundColor: "#F2F2FF",
            marginTop: "130px",
            height: "5vh",
            width: "49vh",
            marginLeft: "6vh",
            position: "absolute",
            borderRadius: "5px",
            fontSize: "1.2rem",
            border: "2px solid #2E3070",
            color: "#2E3070",
          }}
          value={username}
          onChange={(e) => setUsername(e.target.value)}
          required
        />

        {/* PASSWORD */}
        <label
          style={{
            color: "#5C5EAD",
            marginTop: "200px",
            marginLeft: "6vh",
            position: "absolute",
            fontSize: "1.2rem",
            fontWeight: "bold",
          }}
        >
          Password
        </label>

        <input
          type={showPassword ? "text" : "password"}
          style={{
            backgroundColor: "#F2F2FF",
            marginTop: "230px",
            height: "5vh",
            width: "49vh",
            marginLeft: "6vh",
            position: "absolute",
            borderRadius: "5px",
            fontSize: "1.2rem",
            border: "2px solid #2E3070",
            color: "#2E3070",
          }}
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          required
        />

        {/* CONFIRM PASSWORD */}
        <label
          style={{
            color: "#5C5EAD",
            marginTop: "300px",
            marginLeft: "6vh",
            position: "absolute",
            fontSize: "1.2rem",
            fontWeight: "bold",
          }}
        >
          Confirm Password
        </label>

        <input
          type={showPassword ? "text" : "password"}
          style={{
            backgroundColor: "#F2F2FF",
            marginTop: "330px",
            height: "5vh",
            width: "49vh",
            marginLeft: "6vh",
            position: "absolute",
            borderRadius: "5px",
            fontSize: "1.2rem",
            border: "2px solid #2E3070",
            color: "#2E3070",
          }}
          value={confirmPass}
          onChange={(e) => setConfirmPass(e.target.value)}
          required
        />

        {/* SHOW PASSWORD */}
        <label
          style={{
            marginTop: "380px",
            marginLeft: "6vh",
            position: "absolute",
            fontSize: "0.9rem",
            color: "#2E3070",
            display: "flex",
            alignItems: "center",
            gap: "8px",
            cursor: "pointer",
          }}
        >
          <input
            type="checkbox"
            checked={showPassword}
            onChange={() => setShowPassword(!showPassword)}
          />
          Show Passwords
        </label>

        {/* SIGNUP BUTTON */}
        <button
          type="submit"
          style={{
            marginTop: "390px",
            width: "15vh",
            marginLeft: "47vh",
            position: "absolute",
            backgroundColor: "#2E3070",
            border: "2px solid #2E3070",
            color: "white",
            fontWeight: "bold",
            borderRadius: "5px",
            cursor: "pointer",
          }}
        >
          Sign Up
        </button>

        {/* BACK BUTTON */}
        <button
          type="button"
          onClick={() => navigate("/login")}
          style={{
            marginTop: "380px",
            width: "15vh",
            marginLeft: "29vh",
            position: "absolute",
            backgroundColor: "white",
            color: "#2E3070",
            fontWeight: "bold",
            borderRadius: "5px",
            cursor: "pointer",
          }}
        >
          Back to Login
        </button>
      </form>
    </div>
  );
}

export default Signup;
