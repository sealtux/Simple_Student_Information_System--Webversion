import React, { useEffect, useState, useRef } from "react";
import "../assets/student.css";

function Student() {
  const [students, setStudents] = useState([]);
  const [selectedRow, setSelectedRow] = useState(null);
  const tableRef = useRef(null);

  useEffect(() => {
    fetch("http://127.0.0.1:5000/students")
      .then((response) => response.json())
      .then((data) => setStudents(data))
      .catch((error) => console.error("Error fetching students:", error));
  }, []);

  // deselect row if the user will click outside the table
  useEffect(() => {
    function handleClickOutside(event) {
      if (tableRef.current && !tableRef.current.contains(event.target)) {
        setSelectedRow(null); 
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, []);

  return (
    <div className="containers">
      {students.length === 0 ? (
        <p style={{ color: "blue" }}>Loading...</p>
      ) : (
        <>
          <div
            className="table-container"
            style={{
              height: "26.3vw",
              width: "79vw",
              border: "2px solid #E7E7E7",
              borderTopLeftRadius: "10px",
              borderTopRightRadius: "10px",
              overflow: "auto",
            }}
          >
            <table
              ref={tableRef}
              style={{
                color: "#2E3070",
                borderSpacing: "0",
                width: "100%",
              }}
            >
              <thead>
                <tr>
                  <th>ID Number</th>
                  <th>First Name</th>
                  <th>Last Name</th>
                  <th>Year Level</th>
                  <th>Gender</th>
                  <th>Program Code</th>
                </tr>
              </thead>
              <tbody>
                {students.map((student, rowIndex) => (
                  <tr
                    key={student.IdNumber}
                    className={selectedRow === rowIndex ? "selected" : ""}
                    onClick={() => setSelectedRow(rowIndex)}
                    style={{ cursor: "pointer" }}
                  >
                    <td>{student.IdNumber}</td>
                    <td>{student.FirstName}</td>
                    <td>{student.LastName}</td>
                    <td>{student.YearLevel}</td>
                    <td>{student.Gender}</td>
                    <td>{student.ProgramCode}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <div className="bottomcon">
            <button className="editbut">Edit</button>
          </div>
          <div className="bottombar">
            <span className="informationtext">InformationSystem</span>
            <span className="copyright">Copyright © Sealtux</span>
            <span className="terms">Terms of Service</span>
          </div>
        </>
      )}
    </div>
  );
}

export default Student;
