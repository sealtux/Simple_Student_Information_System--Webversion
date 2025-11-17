import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "../supabase";

function Signup() {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
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

    // 1️⃣ Create Supabase Auth user
    const { data, error: authError } = await supabase.auth.signUp({
      email,
      password,
    });

    if (authError) {
      setError(authError.message);
      return;
    }

    const user = data.user;

    // 2️⃣ Insert into profiles table
    await supabase.from("profiles").insert({
      id: user.id,
      full_name: name,
      role: "student",
    });

    alert("Signup successful! Please check your email to verify your account.");
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
          height: "520px",
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

        {/* FULL NAME */}
        <label
          style={{
            color: "#5C5EAD",
            marginTop: "90px",
            marginLeft: "6vh",
            position: "absolute",
            fontSize: "1.2rem",
            fontWeight: "bold",
          }}
        >
          Full Name
        </label>

        <input
          type="text"
          style={{
            backgroundColor: "#F2F2FF",
            marginTop: "120px",
            height: "5vh",
            width: "49vh",
            marginLeft: "6vh",
            position: "absolute",
            borderRadius: "5px",
            fontSize: "1.2rem",
            border: "2px solid #2E3070",
            color: "#2E3070",
          }}
          value={name}
          onChange={(e) => setName(e.target.value)}
          required
        />

        {/* EMAIL */}
        <label
          style={{
            color: "#5C5EAD",
            marginTop: "180px",
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
            marginTop: "210px",
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

        {/* PASSWORD */}
        <label
          style={{
            color: "#5C5EAD",
            marginTop: "270px",
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
            marginTop: "300px",
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
            marginTop: "360px",
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
            marginTop: "390px",
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

        {/* SHOW PASSWORD CHECKBOX */}
        <label
          style={{
            marginTop: "445px",
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
            marginTop: "477px",
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

        {/* BACK */}
        <button
          type="button"
          onClick={() => navigate("/login")}
          style={{
            marginTop: "470px",
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
