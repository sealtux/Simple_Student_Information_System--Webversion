import React, { useState, useEffect } from "react";
import {
  BrowserRouter as Router,
  Routes,
  Route,
  Navigate,
  useNavigate,
  useLocation,
} from "react-router-dom";

import Login from "./login/login";
import Student from "./student/student";
import Program from "./program/program";
import College from "./college/college";
import Signup from "./signup/signup";
import "./assets/App.css";

function Navbar({ onLogout }) {
  const navigate = useNavigate();
  const location = useLocation();

  const activeStyle = {
    borderBottom: "5px solid #5C5EAD",
    color: "#5C5EAD",
  };

  const defaultStyle = {
    borderBottom: "none",
    color: "#2E3070",
  };

  return (
    <div className="navbar">
      <button
        onClick={() => navigate("/student")}
        className="studentbutton"
        style={location.pathname === "/student" ? activeStyle : defaultStyle}
      >
        Student
      </button>

      <button
        className="collegebutton"
        onClick={() => navigate("/program")}
        style={location.pathname === "/program" ? activeStyle : defaultStyle}
      >
        Program
      </button>

      <button
        className="programbutton"
        onClick={() => navigate("/college")}
        style={location.pathname === "/college" ? activeStyle : defaultStyle}
      >
        College
      </button>

      <button
        onClick={() => {
          onLogout();
          navigate("/login");
        }}
        style={{
          marginLeft: "186vh",
          padding: "8px 12px",
          borderRadius: "8px",
          border: "none",
          background: "#5C5EAD",
          color: "white",
          cursor: "pointer",
          marginTop: "-59px",
          position: "absolute",
        }}
      >
        Logout
      </button>

      <div
        className="profile-circle"
        style={{ backgroundColor: "#5C5EAD" }}
        onClick={() => navigate("/profile")}
      >
        <span className="profile-initial">A</span>
      </div>
    </div>
  );
}

function AppWrapper() {
  const [loggedIn, setLoggedIn] = useState(false);

  useEffect(() => {
    const savedLogin = localStorage.getItem("loggedIn");
    setLoggedIn(savedLogin === "true");
  }, []);

  useEffect(() => {
    localStorage.setItem("loggedIn", loggedIn);
  }, [loggedIn]);

  return (
    <Router>
      <div>
        {/* navbar only shows when logged in */}
        {loggedIn && (
          <>
            <div className="background">
              <div className="sidebar">
                <div className="underline"></div>
                <div className="recent">Recent Activity</div>
              </div>
            </div>

            <Navbar onLogout={() => setLoggedIn(false)} />
          </>
        )}

        <Routes>
          {/* PUBLIC ROUTES */}
          <Route
            path="/login"
            element={
              loggedIn ? (
                <Navigate to="/student" replace />
              ) : (
                <Login onLogin={() => setLoggedIn(true)} />
              )
            }
          />

          <Route path="/signup" element={<Signup />} />

          {/* PROTECTED ROUTES */}
          <Route
            path="/student"
            element={loggedIn ? <Student /> : <Navigate to="/login" replace />}
          />

          <Route
            path="/program"
            element={loggedIn ? <Program /> : <Navigate to="/login" replace />}
          />

          <Route
            path="/college"
            element={loggedIn ? <College /> : <Navigate to="/login" replace />}
          />

          {/* DEFAULT */}
          <Route path="*" element={<Navigate to="/login" replace />} />
        </Routes>
      </div>
    </Router>
  );
}

export default AppWrapper;
