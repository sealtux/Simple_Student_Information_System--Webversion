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

const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
const [deleteMessage, setDeleteMessage] = useState(""); 

const indexOfLastStudent = currentPage * rowsPerPage;
const indexOfFirstStudent = indexOfLastStudent - rowsPerPage;

const currentStudents = students.slice(indexOfFirstStudent, indexOfLastStudent);

// 🔹 Edit feature states
const [showEditForm, setShowEditForm] = useState(false);
const [editStudent, setEditStudent] = useState({
  IdNumber: "",
  FirstName: "",
  LastName: "",
  YearLevel: "",
  Gender: "",
  ProgramCode: "",
});


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

    const setUniqueStudents = (data) => {
    const unique = data.filter(
      (student, index, self) =>
        index === self.findIndex((s) => s.IdNumber === student.IdNumber)
    );
    setStudents(unique);
    setOriginalStudents(unique);
  };

  
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

  

  const handleSort = (key) => {
     // If user wants default order, fetch all students
  if (key === "default") {
    fetch("http://127.0.0.1:5000/students")
      .then((res) => res.json())
      .then((data) => setUniqueStudents(data))
      .catch((err) => console.error("Error fetching students:", err));
    setShowSortMenu(false);
    return;
  }

  // Fetch sorted students from backend
  fetch(`http://127.0.0.1:5000/students/sort?key=${encodeURIComponent(key)}`)
    .then((res) => res.json())
    .then((data) => setUniqueStudents(data))
    .catch((err) => console.error("Error fetching sorted students:", err));

  setShowSortMenu(false);
};
  
const handleSearchSubmit = (e) => {
  e.preventDefault();
  if (searchTerm.trim() === "") {
    fetch("http://127.0.0.1:5000/students")
      .then((res) => res.json())
      .then((data) => setUniqueStudents(data))
      .catch((err) => console.error(err));
  } else {
    fetch(`http://127.0.0.1:5000/students/search?q=${encodeURIComponent(searchTerm)}`)
      .then((res) => res.json())
      .then((data) => setUniqueStudents(data))
      .catch((err) => console.error(err));
  }
};










// --- inside your component ---
const handleDelete = () => {
  if (!selectedRow) {
    setDeleteMessage("⚠️ Please select a student to delete.");
    setShowDeleteConfirm(true);
    return;
  }

  setDeleteMessage(
    `Are you sure you want to delete student ${selectedRow.IdNumber}?`
  );
  setShowDeleteConfirm(true);
};

const confirmDelete = () => {
  fetch(`http://127.0.0.1:5000/students/${selectedRow.IdNumber}`, {
    method: "DELETE",
  })
    .then((res) => res.json())
    .then((data) => {
      if (data.error) {
        setDeleteMessage("❌ " + data.error);
        return;
      }

      // ✅ Success: refetch students from backend to refresh table
      fetch("http://127.0.0.1:5000/students")
        .then((res) => res.json())
        .then((updated) => {
          setStudents(updated);
          setOriginalStudents(updated);
          setSelectedRow(null);
          setShowDeleteConfirm(false); // close modal
          alert(data.message || "Student deleted successfully!");
        })
        .catch((err) => {
          console.error("Error refreshing students:", err);
          setDeleteMessage("🔥 Failed to refresh table after delete.");
        });
    })
    .catch((err) => {
      setDeleteMessage("🔥 Failed to delete student.");
      console.error("Error deleting student:", err);
    });
};

const [originalIdNumber, setOriginalIdNumber] = useState("");

const handleEdit = () => {
  if (!selectedRow) return;

  setOriginalIdNumber(selectedRow.IdNumber); // save original ID
  setEditStudent({ ...selectedRow });
  setShowEditForm(true);
};

const handleEditSave = (e) => {
  e.preventDefault();

  fetch(`http://127.0.0.1:5000/students/${originalIdNumber}`, {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(editStudent), // includes new IdNumber
  })
  .then(async (res) => {
    const data = await res.json();
    if (!res.ok) throw new Error(data?.error || "Update failed");
    alert(data.message || "Student updated successfully!");
    const updated = await fetch("http://127.0.0.1:5000/students").then(r => r.json());
    setStudents(updated);
    setOriginalStudents(updated);
    setShowEditForm(false);
    setSelectedRow(null);
  })
  .catch((err) => alert(err.message));
};

const validateStudent = (student, existingStudents) => {
  const idPattern = /^\d{4}-\d{4}$/; // Format 2020-0001 etc.

  // 1. Blank fields
  for (const [key, value] of Object.entries(student)) {
    if (!value.trim()) {
      alert(`${key} is required`);
      return false;
    }
  }

  // 2. ID format check
  if (!idPattern.test(student.IdNumber)) {
    alert("ID Number must be in format YYYY-NNNN (e.g., 2020-0001)");
    return false;
  }

  // 3. Year check
  const year = parseInt(student.IdNumber.split("-")[0], 10);
  if (year < 2020) {
    alert("Year must be 2020 or later");
    return false;
  }

  // 4. Forbidden IDs
  if (student.IdNumber === "0000-0000" || student.IdNumber === "2023-0000") {
    alert("Invalid ID Number");
    return false;
  }

  // 5. Duplicate check for first and last name
  const duplicate = existingStudents.find(
    (s) =>
      s.FirstName.toLowerCase() === student.FirstName.toLowerCase() &&
      s.LastName.toLowerCase() === student.LastName.toLowerCase()
  );

  if (duplicate) {
    alert("A student with the same First and Last name already exists.");
    return false;
  }

  return true;
};
const handleAddStudent = async (e) => {
  e.preventDefault();

  // Run validation before sending request
  if (!validateStudent(newStudent, students)) return;

  try {
    const response = await fetch("http://127.0.0.1:5000/students/", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(newStudent),
    });

    const data = await response.json();
    if (response.ok) {
      alert("✅ Student added successfully!");
      setShowAddForm(false);

      // reset form
      setNewStudent({
        IdNumber: "",
        FirstName: "",
        LastName: "",
        YearLevel: "",
        Gender: "",
        ProgramCode: "",
      });

      // refresh table or update state directly
      setStudents((prev) => [...prev, newStudent]);
    } else {
      alert(`❌ Error: ${data.error || "Failed to add student"}`);
    }
  } catch (err) {
    console.error("Error adding student:", err);
    alert("❌ An error occurred while adding the student.");
  }
};



  return (
      <div className="containers">
      {loading ? (
        <p style={{ color: "blue" }}>Loading...</p>
      ) : (
        <>
          {/* table */}
          <div className="table-container" style={{ width: "79vw", border: "2px solid #E7E7E7", borderTopLeftRadius: "10px", borderTopRightRadius: "10px" }}>
            <table ref={tableRef} style={{ color: "#2E3070", borderSpacing: "0", width: "100%" }}>
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
                    <tr
  key={student.IdNumber || rowIndex}
  onClick={() => setSelectedRow(student)}
  className={selectedRow?.IdNumber === student.IdNumber ? "selected-row" : ""}
  style={{ cursor: "pointer" }}
>

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
                    
                  </tr>

                )}
                

              </tbody>
            </table>
          </div>
          <div style={{ margin: "10px" }}>
            <button onClick={() => handlePageChange(currentPage - 1)}>Prev</button>
            <span style={{ margin: "0 100px" }}>Page {currentPage}</span>
            <button onClick={() => handlePageChange(currentPage + 1)}>Next</button>
          </div>

          {/* bottom buttons */}

          <div className="bottomcon">
            <button className="editbut" onClick={handleEdit}>
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

<div className="action-buttons">
  <button
    className="deletebut"
    onClick={handleDelete} // just open the modal
    disabled={!selectedRow} // disabled until a row is selected
  >
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
  <form onSubmit={handleSearchSubmit}>
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
      onChange={(e) => setSearchTerm(e.target.value)}
    />
    <button type="submit" style={{ display: "none" }}>Search</button>
  </form>
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




{showEditForm && (
  <div className="modal-overlay">
    <div className="modal-content">
      <div className="navbarhead">
        <img
          src={addstud}
          alt="editstudent"
          className="addicon"
          style={{
            width: "90px",
            height: "90px",
            position: "absolute",
            left: "2.8vw",
            top: "0vw",
            zIndex: 3,
          }}
        />
        <h2
          style={{
            color: "#ffffffff",
            fontWeight: "bold",
            position: "absolute",
            left: "8vw",
            top: "1vh",
          }}
        >
          Edit Student
        </h2>
      </div>

      <form
        onSubmit={(e) => {
          e.preventDefault();
          handleEditSave(); // Call your update handler
        }}
      >
        <label
          htmlFor="idNumber"
          style={{
            color: "#2E3070",
            fontWeight: "bold",
            position: "absolute",
            left: "37vw",
            top: "32.5vh",
          }}
        >
          ID Number
        </label>
        <input
          id="idNumber"
          placeholder="2023-3984"
          className="addid"
          type="text"
          value={editStudent.IdNumber}
          onChange={(e) =>
            setEditStudent({ ...editStudent, IdNumber: e.target.value })
          }
          
        />

        <br />
        <label
          style={{
            color: "#2E3070",
            fontWeight: "bold",
            position: "absolute",
            left: "37vw",
            top: "40.5vh",
          }}
        >
          First Name:
        </label>
        <input
          placeholder="Juan"
          className="addfirst"
          type="text"
          value={editStudent.FirstName}
          onChange={(e) =>
            setEditStudent({ ...editStudent, FirstName: e.target.value })
          }
        />

        <br />
        <label
          style={{
            color: "#2E3070",
            fontWeight: "bold",
            position: "absolute",
            left: "37vw",
            top: "48.5vh",
          }}
        >
          Last Name:
        </label>
        <input
          placeholder="Quinlob"
          type="text"
          className="addlast"
          value={editStudent.LastName}
          onChange={(e) =>
            setEditStudent({ ...editStudent, LastName: e.target.value })
          }
        />

        <br />
        <label
          style={{
            color: "#2E3070",
            fontWeight: "bold",
            position: "absolute",
            left: "51vw",
            top: "32.5vh",
          }}
        >
          Year Level:
        </label>
        <select
          className="addyear"
          value={editStudent.YearLevel}
          onChange={(e) =>
            setEditStudent({ ...editStudent, YearLevel: e.target.value })
          }
        >
          <option value="">Year</option>
          <option value="1st Year">1st Year</option>
          <option value="2nd Year">2nd Year</option>
          <option value="3rd Year">3rd Year</option>
          <option value="4th Year">4th Year</option>
        </select>

        <br />
        <label
          style={{
            color: "#2E3070",
            fontWeight: "bold",
            position: "absolute",
            left: "51vw",
            top: "56.5vh",
          }}
        >
          Gender:
        </label>
        <select
          className="addgen"
          value={editStudent.Gender}
          onChange={(e) =>
            setEditStudent({ ...editStudent, Gender: e.target.value })
          }
        >
          <option value="">Gender</option>
          <option value="Male">Male</option>
          <option value="Female">Female</option>
        </select>

        <br />
        <label
          style={{
            color: "#2E3070",
            fontWeight: "bold",
            position: "absolute",
            left: "37vw",
            top: "56.5vh",
          }}
        >
          Program Code:
        </label>
        <select
          className="addprog"
          value={editStudent.ProgramCode}
          onChange={(e) =>
            setEditStudent({ ...editStudent, ProgramCode: e.target.value })
          }
        >
          <option value="">ProgramCode</option>
          <option value="BSCS">BSCS</option>
          <option value="BSIT">BSIT</option>
          <option value="BSECE">BSECE</option>
          <option value="BSBA">BSBA</option>
        </select>

        <br />
        <button type="submit" className="addsub" onClick={handleEditSave} >
          Save
        </button>

        <button
          type="button"
          onClick={() => {
            setShowEditForm(false);
            setEditStudent({
              IdNumber: "",
              FirstName: "",
              LastName: "",
              YearLevel: "",
              Gender: "",
              ProgramCode: "",
            });
          }}
          className="canceladd"
        >
          Cancel
        </button>
      </form>
    </div>
  </div>
)}






          
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
                      <option value="BSCS">BSCS</option>
<option value="BSIT">BSIT</option>
<option value="BSECE">BSECE</option>
<option value="BSBA">BSBA</option>

                     
                    </select>
                 
                  <br />

                  
                  <button type="submit" className = "addsub"  onClick={handleAddStudent}>Save</button>

                 <button
  type="button"
  onClick={() => {
    setShowAddForm(false); // close modal
    setNewStudent({        // reset form fields
      IdNumber: "",
      FirstName: "",
      LastName: "",
      YearLevel: "",
      Gender: "",
      ProgramCode: "",
    });
  }}
  className="canceladd"
>
  Cancel
</button>

                </form>
              </div>
            </div>
          )}

        {/* 🔹 Delete Confirmation Modal */}

   {/* 🔹 Delete Confirmation Modal */}
          {showDeleteConfirm && (
            <div className="confirm-modal-overlay">
              <div className="confirm-modal-content">
                <h3 style={{ color: "#2E3070" }}>Delete Student</h3>
                <p>{deleteMessage}</p>
                {deleteMessage.startsWith("Are you sure") ? (
                  <div className="confirm-modal-buttons">
                    <button onClick={confirmDelete} className="yes-btn">Yes</button>
                    <button onClick={() => setShowDeleteConfirm(false)} className="no-btn">No</button>
                  </div>
                ) : (
                  <div className="confirm-modal-buttons">
                    <button onClick={() => setShowDeleteConfirm(false)} className="yes-btn">OK</button>
                  </div>
                )}
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
