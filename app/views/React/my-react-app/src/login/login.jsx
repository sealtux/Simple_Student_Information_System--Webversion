import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "../supabase";

function Login({ onLogin }) {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");

  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");

    const { data, error: loginError } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (loginError) {
      setError("Invalid email or password.");
      return;
    }

    onLogin();
    navigate("/student");
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
        onSubmit={handleSubmit}
        style={{
          display: "flex",
          flexDirection: "column",
          width: "600px",
          height: "400px",
          padding: "40px",
          border: "1px solid #e6e6e6ff",
          borderRadius: "8px",
          boxShadow: "0 2px 8px rgba(0,0,0,0.1)",
          backgroundColor: "white",
          position: "relative",
        }}
      >
        <h2>Login</h2>

        {error && (
          <p style={{ color: "red", marginTop: "60px", position: "absolute" }}>
            {error}
          </p>
        )}

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
          Email
        </label>
        <input
          type="email"
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
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          required
        />

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
          type="password"
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

        <button
          type="submit"
          style={{
            marginTop: "350px",
            width: "15vh",
            marginLeft: "23vh",
            position: "absolute",
            backgroundColor: "#2E3070",
            border: "2px solid #2E3070",
            color: "white",
            fontWeight: "bold",
          }}
        >
          Login
        </button>

        <button
          type="button"
          onClick={() => navigate("/signup")}
          style={{
            marginTop: "350px",
            width: "15vh",
            marginLeft: "42vh",
            position: "absolute",
            backgroundColor: "white",
            color: "#2E3070",
            fontWeight: "bold",
            cursor: "pointer",
          }}
        >
          Sign Up
        </button>
      </form>
    </div>
  );
}

export default Login;
