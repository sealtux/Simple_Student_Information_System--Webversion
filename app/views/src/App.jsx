import React, { useState, useEffect } from "react";
import {
  BrowserRouter as Router,
  Routes,
  Route,
  Navigate,
  useNavigate,
  useLocation,
} from "react-router-dom";

import Login from "./Pages/login/login";
import Student from "./Pages/student/student";
import Program from "./Pages/program/program";
import College from "./Pages/college/college";
import Signup from "./Pages/signup/signup";
import "./assets/styles/App.css";
import Profile from"./assets/images/profile.png";

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
        style={{ backgroundColor: "#2E3070" }}
        onClick={() => navigate("/profile")}
      >
          <span className="profile-initial"> 
    <img
      src={Profile}
      alt="Profile"
      style={{
        width: "60px",   
        height: "50px",
        borderRadius: "50%",
        objectFit: "cover",
          marginTop: "7px",
      }}
    />
  </span>
      </div>
    </div>
  );
}

function AppWrapper() {
  const [loggedIn, setLoggedIn] = useState(false);
 const [notes, setNotes] = useState(
  () => localStorage.getItem("notes") || ""
);
  useEffect(() => {
    const savedLogin = localStorage.getItem("loggedIn");
    setLoggedIn(savedLogin === "true");
  }, []);

    // ✅ persist notes whenever it changes
  useEffect(() => {
    localStorage.setItem("notes", notes);
  }, [notes]);

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
                <div className="recent">Notes</div>

                  {/* ✅ Notes textarea styled like your example */}
                <textarea
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  rows={5}
                  style={{
                    border: "3px solid #2E3070",
                    color: "#2E3070",
                    width: "1002%",
                    height:"600px",
                    marginTop: "102px",
                    marginLeft:"-220px",
                    padding: "1px",
                    borderRadius: "5px",
                    resize: "none",        // no manual resize
                    overflow: "auto",      // scroll if content is long
                    whiteSpace: "normal",  // normal wrapping
                    wordWrap: "break-word", // break very long words
                    backgroundColor:"#ffffffff"
                  }}
                  placeholder="Write your notes here..."
                />

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
