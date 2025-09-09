import React, { useState } from "react";
import Test from "./program";
import "./assets/App.css";

function App() {
 
  const [active, setActive] = useState("student");

  return (
    <div>
      <div className="background">
        <div className="sidebar">
          <div className="underline"></div>
          <div className="recent">Recent Activity</div>
        </div>
      </div>

      <div className="navbar">
        
        <button
          className="studentbutton"
          onClick={() => setActive("student")}
          style={{
            borderBottom: active === "student" ? "5px solid #5C5EAD" : "none",
            color: active === "student" ? "#5C5EAD" : "#2E3070",
            
          }}
        >
          Student
        </button>

      
        <button
          className="programbutton"
          onClick={() => setActive("program")}
          style={{
            borderBottom: active === "program" ? "5px solid #5C5EAD" : "none",
            color: active === "program" ? "#5C5EAD" : "#2E3070"
          }}
        >
          Program
        </button>

       
        <button
          className="collegebutton"
          onClick={() => setActive("college")}
          style={{
            borderBottom: active === "college" ? "5px solid #5C5EAD" : "none",
            color: active === "college" ? "#5C5EAD" : "#2E3070"
          }}
        >
          College
        </button>
      </div>

      <Test />
    </div>
  );
}

export default App;
