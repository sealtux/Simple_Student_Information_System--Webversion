import React, { useEffect, useState, useRef } from "react";
import "./student.css";
import editIcon from "./images/edit.png";
import addIcon from "./images/add.png";
import deleteIcon from "./images/delete.png";
import sortIcon from "./images/sort.png";
import arrowIcon from "./images/arrowdown.png";
import searchIcon from "./images/search.png";
import addstud from "./images/addstudent.png";

function Student() {
  const [students, setStudents] = useState([]);
  const [originalStudents, setOriginalStudents] = useState([]);
  const [selectedRow, setSelectedRow] = useState(null);
  const [showSortMenu, setShowSortMenu] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [loading, setLoading] = useState(true);
  const tableRef = useRef(null);
  const [currentPage, setCurrentPage] = useState(1);
const [rowsPerPage] = useState(9); // limit to 5 students per page

const indexOfLastStudent = currentPage * rowsPerPage;
const indexOfFirstStudent = indexOfLastStudent - rowsPerPage;
const currentStudents = students.slice(indexOfFirstStudent, indexOfLastStudent);

  // 🔹 NEW: add form states
  const [showAddForm, setShowAddForm] = useState(false);
  const [newStudent, setNewStudent] = useState({
    IdNumber: "",
    FirstName: "",
    LastName: "",
    YearLevel: "",
    Gender: "",
    ProgramCode: "",
  });

  useEffect(() => {
    fetch("http://127.0.0.1:5000/students")
      .then((response) => response.json())
      .then((data) => {
        setStudents(data);
        setOriginalStudents(data);
        setLoading(false);
      })
      .catch((error) => console.error("Error fetching students:", error));
  }, []);

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

  const handleSort = (key) => {
    if (key === "default") {
      setStudents(originalStudents);
      setShowSortMenu(false);
      return;
    }
    const sorted = [...students].sort((a, b) => (a[key] > b[key] ? 1 : -1));
    setStudents(sorted);
    setShowSortMenu(false);
  };

 const handleSearch = (e) => {
  const value = e.target.value.toLowerCase();
  setSearchTerm(value);

  if (value === "") {
    setStudents(originalStudents);
  } else {
    const filtered = originalStudents.filter((student) =>
      Object.values(student).some((field) =>
        String(field).toLowerCase().includes(value)
      )
    );
    setStudents(filtered);
  }
};




const handleAddStudent = (e) => {
  e.preventDefault();

  fetch("http://127.0.0.1:5000/students", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(newStudent),
  })
    .then((res) => res.json())
    .then((data) => {
      console.log("Server response:", data);

      if (data.error) {
        alert("Error: " + data.error);
        return;
      }

   
      fetch("http://127.0.0.1:5000/students")
        .then((response) => response.json())
        .then((updated) => {
          setStudents(updated);
          setOriginalStudents(updated);
        });

      // reset and close modal
      setNewStudent({
        IdNumber: "",
        FirstName: "",
        LastName: "",
        YearLevel: "",
        Gender: "",
        ProgramCode: "",
      });
      setShowAddForm(false);
    })
    .catch((err) => console.error("Error adding student:", err));
};


  return (
    <div className="containers">
      {loading ? (
        <p style={{ color: "blue" }}>Loading...</p>
      ) : (
        <>
          {/* table */}
          <div
            className="table-container"
            style={{
              
              width: "79vw",
              border: "2px solid #E7E7E7",
              borderTopLeftRadius: "10px",
              borderTopRightRadius: "10px",
              
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
  {currentStudents.length > 0 ? (
    currentStudents.map((student, rowIndex) => (
      <tr key={student.IdNumber || rowIndex}>
        <td>{student.IdNumber}</td>
        <td>{student.FirstName}</td>
        <td>{student.LastName}</td>
        <td>{student.YearLevel}</td>
        <td>{student.Gender}</td>
        <td>{student.ProgramCode}</td>
      </tr>
    ))
  ) : (
    <tr className="no-results">
      <td colSpan="6">No results found</td>
    </tr>
  )}

  {/* filler rows */}
  {Array.from({ length: Math.max(0, 3 - students.length) }).map((_, i) => (
    <tr key={`filler-${i}`} className="filler-row">
      <td colSpan="6">&nbsp;</td>
    </tr>
  ))}
</tbody>

            </table>
          </div>

          {/* bottom buttons */}
          <div className="bottomcon">
            <button className="editbut">
              <img
                src={editIcon}
                alt="Edit"
                className="icon"
                style={{
                  width: "30px",
                  height: "30px",
                  position: "absolute",
                  left: "32px",
                }}
              />
              Edit
            </button>

            {/*  UPDATED Add button */}
            <button className="addbut" onClick={() => setShowAddForm(true)}>
              <img
                src={addIcon}
                alt="Add"
                className="addicon"
                style={{
                  width: "30px",
                  height: "30px",
                  position: "absolute",
                  left: "30px",
                }}
              />
              Add
            </button>

            <button className="deletebut">
              <img
                src={deleteIcon}
                alt="Delete"
                className="icon"
                style={{
                  width: "30px",
                  height: "30px",
                  position: "absolute",
                  left: "30px",
                }}
              />
              Delete
            </button>
          </div>

          {/* sort button and popup */}
          <div className="sortcon">
            <button
              className="sortbut"
              onClick={() => setShowSortMenu(!showSortMenu)}
            >
              <img
                src={sortIcon}
                alt="Sort"
                style={{
                  width: "30px",
                  height: "30px",
                  position: "absolute",
                  left: "32px",
                }}
              />
              <img
                src={arrowIcon}
                alt="arrrowdown"
                style={{
                  width: "35px",
                  height: "35px",
                  position: "absolute",
                  left: "140px",
                }}
              />
              Sort by:
            </button>

            <div className="search-wrapper">
              <img
                src={searchIcon}
                alt="search"
                className="searchIcon"
                style={{
                  width: "35px",
                  height: "35px",
                  position: "absolute",
                  left: "77vw",
                  top: "-3.6vw",
                  zIndex: 3,
                }}
              />
              <input
                type="text"
                className="search"
                placeholder="Search"
                value={searchTerm}
                onChange={handleSearch}
              />
            </div>

            {showSortMenu && (
              <div className="sort-popup">
                <p onClick={() => handleSort("default")}>Sort by: Default</p>
                <p onClick={() => handleSort("IdNumber")}>Sort by ID Number</p>
                <p onClick={() => handleSort("FirstName")}>Sort by First Name</p>
                <p onClick={() => handleSort("LastName")}>Sort by Last Name</p>
                <p onClick={() => handleSort("YearLevel")}>Sort by Year Level</p>
                <p onClick={() => handleSort("Gender")}>Sort by Gender</p>
                <p onClick={() => handleSort("ProgramCode")}>
                  Sort by Program Code
                </p>
              </div>
            )}
          </div>

          {/* 🔹 NEW Add Student Modal */}
          {showAddForm && (
            <div className="modal-overlay">
              <div className="modal-content">
                <div className="navbarhead"> <img
                src={addstud}
                alt="addstudent"
                className="addicon"
                style={{
                  width: "90px",
                  height: "90px",
                  position: "absolute",
                  left: "2.8vw",
                  top: "0vw",
                  zIndex: 3,
                }}
              />  <h2  style={{ color: "#ffffffff", fontWeight: "bold", position: "absolute", left: "8vw",top:"1vh" }}>Add Student</h2></div>
              
                <form onSubmit={handleAddStudent}>
                  
                 <label 
  htmlFor="idNumber" 
 style={{ color: "#2E3070", fontWeight: "bold", position: "absolute", left: "37vw",top:"32.5vh" }}
>
  ID Number
</label>
                    
<input
  id="idNumber"
  placeholder="2023-3984"
  className="addid"
  type="text"
  value={newStudent.IdNumber}
  onChange={(e) =>
    setNewStudent({ ...newStudent, IdNumber: e.target.value })
  }
/>
                  
                  <br />
                  <label  style={{ color: "#2E3070", fontWeight: "bold", position: "absolute", left: "37vw",top:"40.5vh" }}>
                    First Name:
                     </label>
                    <input
                    placeholder="eg.juan"
                     className="addfirst"
                      type="text"
                      value={newStudent.FirstName}
                      onChange={(e) =>
                        setNewStudent({
                          ...newStudent,
                          FirstName: e.target.value,
                        })
                      }
                    />
                  
                  <br />
                  <label style={{ color: "#2E3070", fontWeight: "bold", position: "absolute", left: "37vw",top:"48.5vh" }}>
                    Last Name:
                    
                      </label>
                      <input
                    placeholder="Quinlob"
                     
                      type="text"
                      className="addlast"
                      value={newStudent.LastName}
                      onChange={(e) =>
                        setNewStudent({
                          ...newStudent,
                          LastName: e.target.value,
                        })
                      }
                    />
                 
                  <br />
                  
                    <label  style={{ color: "#2E3070", fontWeight: "bold", position: "absolute", left: "51vw",top:"32.5vh"}}>
  Year Level:
  </label>
  <select
  className="addyear"
    value={newStudent.YearLevel}
    onChange={(e) =>
      setNewStudent({
        ...newStudent,
        YearLevel: e.target.value,
      })
    }
 
  >
    <option value="">Year</option>
    <option value="1st Year">1st Year</option>
    <option value="2nd Year">2nd Year</option>
    <option value="3rd Year">3rd Year</option>
    <option value="4th Year">4th Year</option>
  </select>

<br />

<label  style={{ color: "#2E3070", fontWeight: "bold", position: "absolute", left: "51vw",top:"56.5vh"}}>
  Gender:
  </label>
  <select
    className="addgen"
    value={newStudent.Gender}
    onChange={(e) =>
      setNewStudent({
        ...newStudent,
        Gender: e.target.value,
      })
    }
  
  >
    <option value="">Gender</option>
    <option value="Male">Male</option>
    <option value="Female">Female</option>
  </select>

<br />


                  <label style={{ color: "#2E3070", fontWeight: "bold", position: "absolute", left: "37vw",top:"56.5vh"}}>
                    Program Code:
                    </label>
                    <select
                    className="addprog"
                      value={newStudent.ProgramCode}
                      onChange={(e) =>
                        setNewStudent({
                          ...newStudent,
                          ProgramCode: e.target.value,
                        })
                      }
                     
                    >
                      <option value="">ProgramCode</option>
                      <option value="Male">Male</option>
                      <option value="Female">Female</option>
                     
                    </select>
                 
                  <br />

                  
                  <button type="submit" class = "addsub">Save</button>
                  <button type="button" onClick={() => setShowAddForm(false)} class = "canceladd">
                    Cancel
                  </button>
                </form>
              </div>
            </div>
          )}

          {/* footer bar */}
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
