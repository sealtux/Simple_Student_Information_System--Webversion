import React, { useEffect, useState } from "react";
import "../assets/student.css";

function Student() {
  const [students, setStudents] = useState([]);

  useEffect(() => {
    fetch("http://127.0.0.1:5000/students") // Flask API endpoint
      .then((response) => response.json())
      .then((data) => setStudents(data))
      .catch((error) => console.error("Error fetching students:", error));
  }, []);

  return (
    <div className="containers">
      {students.length === 0 ? (
        <p style={{ color: "blue" }}>Loading...</p>
      ) : (
        <div
          className="table-container"
          style={{
            height: "32vw",
            width: "79vw",
            border: "2px solid #E7E7E7",
            borderTopLeftRadius: "10px",
            borderTopRightRadius: "10px", // rounded border
            overflow: "auto",
          }}
        >
          <table
            style={{
              color: "#2E3070",
              borderSpacing: "0",
              width: "100%",
            }}
          >
            <thead>
              <tr>
                <th>
                  <div style={{ marginLeft: "6vw" ,position:"absolute",marginTop:"-1.5vh"}}>ID Number</div>
                </th>
                <th>
                  <div style={{ marginLeft: "5vw" ,position:"absolute",marginTop:"-1.5vh"}}>First Name</div>
                </th>
                <th>
                  <div style={{ marginLeft: "4vw" ,position:"absolute",marginTop:"-1.5vh"}}>Last Name</div>
                </th>
                 <th>
                  <div style={{ marginLeft: "3vw" ,position:"absolute",marginTop:"-1.5vh"}}>Year Level</div>
                </th>
                <th>
                  <div style={{ marginLeft: "2vw" ,position:"absolute",marginTop:"-1.5vh"}}>Gender</div>
                </th>
                
                <th>
                  <div style={{ marginLeft: "-1vw" ,position:"absolute",marginTop:"-1.5vh"}}>Program Code</div>
                </th>
              </tr>
            </thead>

            <tbody>
              {students.map((student) => (
                <tr key={student.IdNumber}>
                  <td>
                    <div style={{ marginLeft: "6.5vw",position:"absolute",marginTop:"-1.5vh"}}>
                      {student.IdNumber}
                    </div>
                  </td>
                  <td>
                    <div style={{ marginLeft: "5vw",position:"absolute",marginTop:"-1.5vh"}}>
                      {student.FirstName}
                    </div>
                  </td>
                  <td>
                    <div style={{ marginLeft: "5vw",position:"absolute",marginTop:"-1.5vh"}}>
                      {student.LastName}
                    </div>
                  </td>
                 
                  <td>
                    <div style={{ marginLeft: "3.6vw",position:"absolute",marginTop:"-1.5vh"}}>
                      {student.YearLevel}
                    </div>
                  </td>
                  <td>
                    <div style={{ marginLeft: "2.8vw",position:"absolute",marginTop:"-1.5vh"}}>
                      {student.Gender}
                    </div>
                  </td>
                  <td>
                    <div style={{ marginLeft: "1.6vw",position:"absolute",marginTop:"-1.5vh"}}>
                      {student.ProgramCode}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

export default Student;
