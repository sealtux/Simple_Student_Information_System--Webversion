import React, { useEffect, useState, useRef } from "react";
import { supabase } from "../../services/supabase";

import "../../assets/styles/student.css";
import editIcon from "../../assets/images/edit.png";
import addIcon from "../../assets/images/add.png";
import deleteIcon from "../../assets/images/delete.png";
import sortIcon from "../../assets/images/sort.png";
import arrowIcon from "../../assets/images/arrowdown.png";
import searchIcon from "../../assets/images/search.png";
import addstud from "../../assets/images/addstudent.png";
import defprofile from "../../assets/images/defprofile.png";


function Student() {
  const [students, setStudents] = useState([]);
  const [originalStudents, setOriginalStudents] = useState([]);
  const [selectedRow, setSelectedRow] = useState(null);
  const [showSortMenu, setShowSortMenu] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [loading, setLoading] = useState(true);
  const tableRef = useRef(null);
const [programs, setPrograms] = useState([]);
const [showAddConfirm, setShowAddConfirm] = useState(false);
const [showEditConfirm,setShowEditConfirm] = useState(false)
const [activeSort, setActiveSort] = useState(null);

  // Pagination (backend-driven)
  const [page, setPage] = useState(1);
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
      profile_url:"",
      profilePictureFile:null,
    });

  // 🔹 NEW: add form states
  const [showAddForm, setShowAddForm] = useState(false);
const [newStudent, setNewStudent] = useState({
  IdNumber: "",
  FirstName: "",
  LastName: "",
  YearLevel: "",
  Gender: "",
  ProgramCode: "",   // keep empty, but will validate below
  profile_url: null,
  profilePictureFile: null,
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
  if (!hasNext) return;

  // If searching → keep searching on next page
  if (searchTerm.trim() !== "") {
    handleSearchSubmit(null, page + 1);
    return;
  }

  // If sorting → keep sorting on next page
  if (activeSort) {
    fetch(`http://127.0.0.1:5000/students/sort?key=${activeSort}&page=${page + 1}`)
      .then((res) => res.json())
      .then((data) => {
        setStudents(data.students || []);
        setHasNext(data.has_next || false);
        setPage(page + 1);
      });
    return;
  }

  // Normal fetch
  fetchStudents(page + 1);
};

const handlePrev = () => {
  if (page <= 1) return;

  // If searching → keep filtered search
  if (searchTerm.trim() !== "") {
    handleSearchSubmit(null, page - 1);
    return;
  }

  // If sorting → keep same sort
  if (activeSort) {
    fetch(`http://127.0.0.1:5000/students/sort?key=${activeSort}&page=${page - 1}`)
      .then((res) => res.json())
      .then((data) => {
        setStudents(data.students || []);
        setHasNext(data.has_next || false);
        setPage(page - 1);
      });
    return;
  }

  fetchStudents(page - 1);
};




  // --- Sorting ---
const handleSort = (key) => {
  setActiveSort(key === "default" ? null : key);

  if (key === "default") {
    fetchStudents(1);
    setShowSortMenu(false);
    return;
  }

  setStudents([]);
  setLoading(true);

  fetch(`http://127.0.0.1:5000/students/sort?key=${encodeURIComponent(key)}&page=1`)
    .then((res) => res.json())
    .then((data) => {
      const arr = Array.isArray(data) ? data : data.students || [];
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




const handleSearchSubmit = async (e, pageNum = 1) => {
  if (e) e.preventDefault();

  const query = searchTerm.trim();

  if (query === "") {
    // No search → use normal table fetch
    fetchStudents(pageNum);
    return;
  }

  setLoading(true);

  try {
    const res = await fetch(
      `http://127.0.0.1:5000/students/search?q=${encodeURIComponent(query)}&page=${pageNum}`
    );

    const data = await res.json();

    setStudents(data.students || []);
    setPage(pageNum);
    setHasNext(data.has_next || false);
  } catch (err) {
    console.error("Search error:", err);
  } finally {
    setLoading(false);
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
    const res = await fetch(
      `http://127.0.0.1:5000/students/${selectedRow.IdNumber}`,
      { method: "DELETE" }
    );

    const data = await res.json();

    if (!res.ok) {
      setDeleteMessage(data.error || "Failed to delete student.");
      return;
    }

    // Refresh table
    await fetchStudents(page);

    setSelectedRow(null);
    setShowDeleteConfirm(false);

    alert("Student deleted successfully!");
  } catch (err) {
    console.error(err);
    setDeleteMessage("Failed to delete student.");
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

  // ✅ Fetch ALL program codes for dropdown
  fetch("http://127.0.0.1:5000/programs/all")
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

  let imageUrl = editStudent.profile_url;

  // Upload new profile picture IF user selected one
  if (editStudent.profilePictureFile) {
    const file = editStudent.profilePictureFile;
    const fileName = `${editStudent.IdNumber}_${Date.now()}.jpg`;

    const { data, error } = await supabase.storage
      .from("student-images")
      .upload(`profiles/${fileName}`, file, { upsert: true });

    if (!error) {
      const { data: urlData } = supabase.storage
        .from("student-images")
        .getPublicUrl(`profiles/${fileName}`);

      imageUrl = urlData.publicUrl;
    }
  }

  if (!validateStudentEdit(editStudent, students, originalIdNumber)) return;

  try {
    const res = await fetch(
      `http://127.0.0.1:5000/students/${originalIdNumber}`,
      {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...editStudent,
          profile_url: imageUrl,  // ⭐ FIXED
        }),
      }
    );

    const data = await res.json();
    if (!res.ok) throw new Error(data.error || "Update failed");

    alert("Student updated successfully!");
    await fetchStudents(page);
    setShowEditForm(false);
    setSelectedRow(null);
  } catch (err) {
    alert(err.message);
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

    
  if (/^0000-\d{4}$/.test(student.IdNumber) || /^\d{4}-0000$/.test(student.IdNumber)) {
    alert("ID Number cannot contain all zeros in either part (e.g., 0000-0000 or 2022-0000).");
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

  if (!validateStudent(newStudent, students)) return;

  let imageUrl = null;

  if (newStudent.profilePictureFile) {
    const file = newStudent.profilePictureFile;
    const fileName = `${newStudent.IdNumber}_${Date.now()}.jpg`;

    const { data, error } = await supabase.storage
      .from("student-images")
      .upload(`profiles/${fileName}`, file, { upsert: true });

    if (error) {
      alert("Image upload failed!");
      console.error(error);
      return;
    }

    // Get public URL
    const { data: urlData } = supabase.storage
      .from("student-images")
      .getPublicUrl(`profiles/${fileName}`);

    imageUrl = urlData.publicUrl;
  }

  // ⬇️ Now send to backend WITH profile_url
  const payload = {
    ...newStudent,
    profile_url: imageUrl,
  };

  delete payload.profilePictureFile; // remove file object before sending

  try {
    const response = await fetch("http://127.0.0.1:5000/students/", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });

    const data = await response.json();
    if (response.ok) {
      alert("Student added successfully!");
      setShowAddForm(false);

      setNewStudent({
        IdNumber: "",
        FirstName: "",
        LastName: "",
        YearLevel: "",
        Gender: "",
        ProgramCode: "",
        profilePictureFile: null,
      });

      await fetchStudents(page);
    } else {
      alert(`Error: ${data.error}`);
    }
  } catch (err) {
    console.error(err);
    alert("Error adding student.");
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
                   <th>Profile</th>
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
        <td>

    {student.profile_url ? (
      <img
        src={student.profile_url}
        alt="Profile"
        style={{
          width: "49px",
          height: "43px",
          borderRadius: "50%",
          objectFit: "cover"
        }}
      />
    ) : (
         <img
        src={defprofile}
        alt="Profile"
        style={{
          width: "50px",
          height: "40px",
          borderRadius: "50%",
          objectFit: "cover"
        }}
      />
    )}
  </td>
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
      <td colSpan="7" style={{ textAlign: "center", color: "#999" }}>
        No students found
      </td>
    </tr>
  )}

 
  {Array.from({ length: Math.max(0, 4 - students.length) }).map((_, i) => (
    <tr key={`filler-${i}`} className="filler-row">
      <td colSpan="7">&nbsp;</td>
    </tr>
  ))}
</tbody>

              
            </table>
          </div>

          
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
  onClick={(e) => e.stopPropagation()}  // ⭐ prevents table row deselection
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
          handleEditSave(e); 
        }}
      >
        {/* ID Number */}
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

        {/* First Name */}
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

        {/* Last Name */}
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

        {/* Year Level */}
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

        {/* Gender */}
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

        {/* Program Code */}
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
  <option value="">--Select Program--</option>
  {programs.map((prog) => (
    <option key={prog.programcode} value={prog.programcode}>
      {prog.programcode}
      {/* or `${prog.programcode} - ${prog.programname}` if you want text like "BSCS001 - BSCS 1" */}
    </option>
  ))}
</select>
     <img
  src={editStudent.profile_url ? editStudent.profile_url : defprofile}
  alt="Current"
  style={{
    width: "80px",
    height: "80px",
    borderRadius: "50%",
    objectFit: "cover",
    position: "absolute",
    left: "63vw",
    top: "18vh",
  }}
/>

      
        {/* Label */}
        <label
          style={{
            color: "#2E3070",
            fontWeight: "bold",
            position: "absolute",
            left: "42vw",
            top: "65.5vh",
          }}
        >
          Profile Picture:
        </label>

        {/* File Input */}
        <input
          type="file"
          accept="image/*"
          onChange={(e) =>
            setEditStudent({
              ...editStudent,
              profilePictureFile: e.target.files[0],
            })
          }
          style={{
            position: "absolute",
            left: "48vw",
            top: "66vh",
          }}
        />

        {/* Save Button */}
        <button
          type="button"
          className="addsub"
          onClick={() => setShowEditConfirm(true)}
        >
          Save
        </button>

        {/* Cancel */}
        <button
          type="button"
          className="canceladd"
          onClick={() => {
            setShowEditForm(false);
          }}
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

                <form id="add-student-form" onSubmit={handleAddStudent}>
                    
        <label
          style={{
            color: "#2E3070",
            fontWeight: "bold",
            position: "absolute",
            left: "42vw",
            top: "65.5vh",
            zIndex:"3"
          }}
        >
          Profile Picture:
        </label>

        <input
          type="file"
          accept="image/*"
          onChange={(e) =>
            setNewStudent({
              ...newStudent,
              profilePictureFile: e.target.files[0], // store file object
            })
          }
          style={{
            position: "absolute",
            left: "48vw",
            top: "66vh",
            width:"45vh",
            height:"45vh"
          }}
        />

                  
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
                    placeholder="eg.2023-3984"
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
                    placeholder="eg.Quinlob"
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
  <option value="">--Select Program--</option>
  {programs.map((prog) => (
    <option key={prog.programcode} value={prog.programcode}>
      {prog.programcode}
    </option>
  ))}
</select>








                  <br />

                  <button
  type="button"
  className="addsub"
  onClick={() => setShowAddConfirm(true)}
>
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
                <p style={{ color: "#2E3070" }}>{deleteMessage}</p>
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

          {showAddConfirm && (
  <div className="confirm-modal-overlay">
    <div className="confirm-modal-content">
      <h3 style={{ color: "#2E3070" }}>Add Student</h3>
      <h5 style={{ color: "#2E3070" }}>Are you sure you want to add this student?</h5>

      <div className="confirm-modal-buttons">
      <button
  type="button"                   
  style={{ backgroundColor: "#2E3070" }}
  className="yes-btn "
  onClick={() => {
    setShowAddConfirm(false);
    handleAddStudent({ preventDefault: () => {} });
  }}
>
  Yes
</button>
<button
  type="button"                   
  className="no-btn"
  onClick={() => setShowAddConfirm(false)}
>
  No
</button>

      </div>
    </div>
  </div>
)}
{showEditConfirm && (
  <div className="confirm-modal-overlay">
    <div className="confirm-modal-content">
      <h3 style={{ color: "#2E3070" }}>Edit Student</h3>
      <h5 style={{ color: "#2E3070" }}>Are you sure you want to save changes?</h5>

      <div className="confirm-modal-buttons">
       <button
  type="button"                  
  className="yes-btn"
  style={{ backgroundColor: "#2E3070" }}
  onClick={async () => {
    setShowEditConfirm(false);
    await handleEditSave({ preventDefault: () => {} });
  
  }}
>
  Yes
</button>


        <button
  type="button"               
  className="no-btn"
  onClick={() => setShowEditConfirm(false)}
>
  No
</button>

      </div>
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
