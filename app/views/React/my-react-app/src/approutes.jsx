// AppRoutes.js
import React from "react";
import { Routes, Route, Navigate } from "react-router-dom";
import Login from "./login/login";
import Signup from "./signup/signup";
import Program from "./program/program";
import Student from "../../../student/student";
import College from "../../../college/college";

function AppRoutes({ loggedIn, setLoggedIn }) {
  return (
    <Routes>
  <Route
    path="/login"
    element={
      loggedIn ? <Navigate to="/student" replace /> : <Login onLogin={() => setLoggedIn(true)} />
    }
  />

  <Route path="/signup" element={<Signup />} />

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

  {/* Catch-all */}
  <Route path="*" element={<Navigate to="/login" replace />} />
</Routes>

  );
}

export default AppRoutes;
