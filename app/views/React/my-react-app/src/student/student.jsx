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
const [programs, setPrograms] = useState([]);

  // Pagination (backend-driven)
  const [page, setPage] = useState(1);
  const limit = 9;
  const [hasNext, setHasNext] = useState(false);

  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [deleteMessage, setDeleteMessage] = useState("");

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
  


  // Fetch paginated students from backend
const fetchStudents = async (pageNum = 1) => {
  setLoading(true);
  try {
    const res = await fetch(`http://127.0.0.1:5000/students/page/${pageNum}`);
    const data = await res.json();

    setStudents(data.students || []);
    setHasNext(data.has_next || false);
    setPage(pageNum);
  } catch (error) {
    console.error("Error fetching students:", error);
  } finally {
    setLoading(false);
  }
};


  // initial load
  useEffect(() => {
    fetchStudents(1);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Pagination handlers
const handleNext = () => {
  if (hasNext) {
    if (searchTerm.trim()) {
      handleSearchSubmit(null, page + 1); // ✅ now works
    } else {
      fetchStudents(page + 1);
    }
  }
};

const handlePrev = () => {
  if (page > 1) {
    if (searchTerm.trim()) {
      handleSearchSubmit(null, page - 1); // ✅ now works
    } else {
      fetchStudents(page - 1);
    }
  }
};



  // --- Sorting ---
const handleSort = (key) => {
  if (key === "default") {
    fetchStudents(1);
    setShowSortMenu(false);
    return;
  }

  // 1. Immediately clear the table
  setStudents([]);
  setLoading(true); // optional but helps with UI feedback

  // 2. Fetch sorted data
  fetch(`http://127.0.0.1:5000/students/sort?key=${encodeURIComponent(key)}&page=1`)
    .then((res) => res.json())
    .then((data) => {
      const arr = Array.isArray(data) ? data : data.students || [];

      // 3. Force a repaint using a short async break
      requestAnimationFrame(() => {
        setStudents(arr);
        setHasNext(data.has_next || arr.length === limit);
        setPage(1);
        setLoading(false);
      });
    })
    .catch((err) => {
      console.error("Error fetching sorted students:", err);
      setLoading(false);
    })
    .finally(() => setShowSortMenu(false));
};




  // --- Search ---
const handleSearchSubmit = async (e, pageNum = 1) => {
  if (e) e.preventDefault(); // allow calling without an event

  if (searchTerm.trim() === "") {
    fetchStudents(pageNum); // regular fetch if search is empty
  } else {
    setLoading(true);
    try {
      const res = await fetch(
        `http://127.0.0.1:5000/students/search?q=${encodeURIComponent(searchTerm)}&page=${pageNum}`
      );
      const data = await res.json();
      setStudents(data.students || []);
      setPage(pageNum);
      setHasNext(data.has_next || false);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  }
};



  // --- Delete ---
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

const confirmDelete = async () => {
  try {
    // 1️⃣ Check if students exist under this program
    const studentRes = await fetch(
      `http://127.0.0.1:5000/students/by-program/${selectedRow.programcode}`
    );
    const studentData = await studentRes.json();
    const studentsArray = studentData.students || [];

    console.log("Students under program:", selectedRow.programcode, studentsArray);

    if (studentsArray.length > 0) {
      setDeleteMessage(
        ` Cannot delete program '${selectedRow.programcode}' because there are ${studentsArray.length} student(s) enrolled in it.`
      );
      return;
    }

    // 2️⃣ Proceed with delete
    const res = await fetch(
      `http://127.0.0.1:5000/programs/${selectedRow.programcode}`,
      { method: "DELETE" }
    );
    const data = await res.json();

    if (data.error) {
      setDeleteMessage( data.error);
      return;
    }

    await fetchPrograms(page);
    setSelectedRow(null);
    setShowDeleteConfirm(false);
    alert(data.message || "Program deleted successfully!");
  } catch (err) {
    console.error(err);
    setDeleteMessage(" Failed to delete program.");
  }
};



  // --- Edit ---
  const [originalIdNumber, setOriginalIdNumber] = useState("");

  const handleEdit = () => {
    if (!selectedRow) return;

    setOriginalIdNumber(selectedRow.IdNumber); // save original ID
    setEditStudent({ ...selectedRow });
    setShowEditForm(true);
  };

useEffect(() => {
  fetchStudents(1);

  // Fetch program codes
  fetch("http://127.0.0.1:5000/programs/")
  .then((res) => res.json())
  .then((data) => {
    console.log("Fetched programs:", data);
    if (Array.isArray(data.programs)) {
      setPrograms(data.programs);
    } else {
      console.error("Unexpected response format:", data);
    }
  })
  .catch((err) => console.error("Error fetching programs:", err));

}, []);


const handleEditSave = async (e) => {
  e.preventDefault();

  // 🧠 Run validation first
  if (!validateStudentEdit(editStudent, students, originalIdNumber)) return;

  try {
    const res = await fetch(`http://127.0.0.1:5000/students/${originalIdNumber}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(editStudent),
    });

    const data = await res.json();
    if (!res.ok) throw new Error(data?.error || "Update failed");

    alert(" Student updated successfully!");
    await fetchStudents(page);
    setShowEditForm(false);
    setSelectedRow(null);
  } catch (err) {
    alert( err.message);
  }
};

  // 🔹 Validate edit: check for duplicate ID or duplicate name
const validateStudentEdit = (student, existingStudents, originalId) => {
  const idPattern = /^(19|20)\d{2}-\d{4}$/; // allows 1900–2099 as valid year prefix

  // 1️Check for empty fields
  for (const [key, value] of Object.entries(student)) {
    if (!String(value).trim()) {
      alert(`${key} is required`);
      return false;
    }
  }

  // 2️ Validate ID format (must be like 2020-0001)
  if (!idPattern.test(student.IdNumber)) {
    alert("ID Number must be in format YYYY-NNNN (e.g., 2020-0001)");
    return false;
  }

  // 3️⃣ Disallow 0000-0000 or year-like 2020+0000
  if (/^0000-\d{4}$/.test(student.IdNumber) || /^\d{4}-0000$/.test(student.IdNumber)) {
    alert("ID Number cannot contain all zeros in either part (e.g., 0000-0000 or 2020-0000).");
    return false;
  }

  // 4️⃣ Duplicate ID (ignore current student's own ID)
  const duplicateId = existingStudents.find(
    (s) => s.IdNumber === student.IdNumber && s.IdNumber !== originalId
  );
  if (duplicateId) {
    alert(" This ID Number already exists. Please use a different one.");
    return false;
  }

  // 5️⃣ Duplicate name (ignore same record)
  const duplicateName = existingStudents.find(
    (s) =>
      s.FirstName.toLowerCase() === student.FirstName.toLowerCase() &&
      s.LastName.toLowerCase() === student.LastName.toLowerCase() &&
      s.IdNumber !== originalId
  );
  if (duplicateName) {
    alert(" A student with the same first and last name already exists.");
    return false;
  }

  return true;
};



  // --- Validation & Add ---
  const validateStudent = (student, existingStudents) => {
    const idPattern = /^\d{4}-\d{4}$/; // Format 2020-0001 etc.

    // 1. Blank fields
    for (const [key, value] of Object.entries(student)) {
      if (!String(value).trim()) {
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
    if (isNaN(year) || year < 2020) {
      alert("Year must be 2020 or later");
      return false;
    }

    // 4. Forbidden IDs
    if (student.IdNumber === "0000-0000" || student.IdNumber === "2023-0000") {
      alert("Invalid ID Number");
      return false;
    }
  const duplicateId = existingStudents.find(
    (s) => s.IdNumber === student.IdNumber
  );
  
  if (duplicateId) {
    alert("A student with this ID Number already exists.");
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
        alert(" Student added successfully!");
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

        // refresh current page (show last page where new record may be)
        // simplest: reload current page (you could instead fetch page=1 or compute last page)
        await fetchStudents(page);
      } else {
        alert(` Error: ${data.error || "Failed to add student"}`);
      }
    } catch (err) {
      console.error("Error adding student:", err);
      alert(" An error occurred while adding the student.");
    }
  };

  // Render
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
              style={{ color: "#2E3070", borderSpacing: "0", width: "100%",  tableLayout: "fixed",}}
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
  {students.length > 0 ? (
    students.map((student, rowIndex) => (
      <tr
        key={student.IdNumber || rowIndex}
        onClick={() => setSelectedRow(student)}
        className={
          selectedRow?.IdNumber === student.IdNumber
            ? "selected-row"
            : ""
        }
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
      <td colSpan="6" style={{ textAlign: "center", color: "#999" }}>
        No students found
      </td>
    </tr>
  )}

  {/* Add invisible filler rows (up to 4 total visible rows) */}
  {Array.from({ length: Math.max(0, 4 - students.length) }).map((_, i) => (
    <tr key={`filler-${i}`} className="filler-row">
      <td colSpan="6">&nbsp;</td>
    </tr>
  ))}
</tbody>

              
            </table>
          </div>

          {/* old inline pagination area removed (we use backend pagination controls below) */}

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

            {/* Pagination controls (backend-driven) */}
            <div
              className="pagination-controls"
              style={{ display: "flex", justifyContent: "center", marginTop: "1rem" }}
            >
              <button
                className="Prev"
                onClick={handlePrev}
                disabled={page === 1}
                style={{
                  padding: "0.5rem 1rem",
                  marginRight: "0.5rem",
                  borderRadius: "0.5rem",
                  border: "none",
                  backgroundColor: page === 1 ? "#ccc" : "#4956AD",
                  color: "white",
                  cursor: page === 1 ? "not-allowed" : "pointer",
                }}
              >
                Previous
              </button>

              <span style={{ alignSelf: "center", fontWeight: "bold",  color:"#4956AD"} }>
                Page {page}
              </span>

              <button
                className="Next"
                onClick={handleNext}
                disabled={!hasNext}
                style={{
                  padding: "0.5rem 1rem",
                  marginLeft: "0.5rem",
                  borderRadius: "0.5rem",
                  border: "none",
                  backgroundColor: !hasNext ? "#ccc" : "#4956AD",
                  color: "white",
                  cursor: !hasNext ? "not-allowed" : "pointer",
                }}
              >
                Next
              </button>
            </div>

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
                <button type="submit" style={{ display: "none" }}>
                  Search
                </button>
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
                    handleEditSave(e); // Call your update handler
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
                    className="addids"
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
                  <button type="submit" className="addsub" onClick={handleEditSave}>
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
                <div className="navbarhead">
                  <img
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
                    Add Student
                  </h2>
                </div>

                <form onSubmit={handleAddStudent}>
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
                    className="addids"
                    type="text"
                    value={newStudent.IdNumber}
                    onChange={(e) =>
                      setNewStudent({ ...newStudent, IdNumber: e.target.value })
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
                    value={newStudent.LastName}
                    onChange={(e) =>
                      setNewStudent({
                        ...newStudent,
                        LastName: e.target.value,
                      })
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
  value={newStudent.ProgramCode}
  onChange={(e) =>
    setNewStudent({ ...newStudent, ProgramCode: e.target.value })
  }
>
  <option value="">--Select Program</option>
  {programs.map((prog) => (
    <option key={prog.programcode} value={prog.programcode}>
      {prog.programcode}
    </option>
  ))}
</select>




                  <br />

                  <button type="submit" className="addsub" onClick={handleAddStudent}>
                    Save
                  </button>

                  <button
                    type="button"
                    onClick={() => {
                      setShowAddForm(false); // close modal
                      setNewStudent({
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
