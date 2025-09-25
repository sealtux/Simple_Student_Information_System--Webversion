// AppRoutes.js
import React from "react";
import { Routes, Route, Navigate } from "react-router-dom";
import Login from "./login/login";
import Program from "./program/program";
import Student from "./student/student";
import College from "./college/college";

function AppRoutes({ loggedIn, setLoggedIn }) {
  return (
    <Routes>
      {/* Login */}
      <Route
        path="/login"
        element={<Login onLogin={() => setLoggedIn(true)} />}
      />

      {/* Student page (main dashboard) */}
      <Route
        path="/student"
        element={loggedIn ? <Student /> : <Navigate to="/login" replace />}
      />

      {/* Program page */}
      <Route
        path="/program"
        element={loggedIn ? <Program /> : <Navigate to="/login" replace />}
      />

      {/* College page */}
      <Route
        path="/college"
        element={loggedIn ? <College /> : <Navigate to="/login" replace />}
      />

      {/* Dashboard → just redirect to Student */}
      <Route path="/dashboard" element={<Navigate to="/student" replace />} />

      {/* Catch-all */}
      <Route path="*" element={<Navigate to="/login" replace />} />
    </Routes>
  );
}

export default AppRoutes;
