  import React, { useEffect, useState, useRef } from "react";
  import "../../assets/styles/program.css"; // reuse same CSS as College
  import editIcon from "../../assets/images/edit.png";
  import addIcon from "../../assets/images/add.png";
  import deleteIcon from "../../assets/images/delete.png";
  import sortIcon from "../../assets/images/sort.png";
  import arrowIcon from "../../assets/images/arrowdown.png";
  import searchIcon from "../../assets/images/addstudent.png";
  import addprogramIcon from "../../assets/images/addsubject.png"; // reuse icon

  function Program() {
    const [programs, setPrograms] = useState([]);
    const [originalPrograms, setOriginalPrograms] = useState([]);
    const [selectedRow, setSelectedRow] = useState(null);
    const [showSortMenu, setShowSortMenu] = useState(false);
    const [searchTerm, setSearchTerm] = useState("");
    const [loading, setLoading] = useState(true);
    const tableRef = useRef(null);
const [colleges, setColleges] = useState([]);
    // Pagination
    const [page, setPage] = useState(1);
    const limit = 9;
    const [hasNext, setHasNext] = useState(false);

    const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
    const [deleteMessage, setDeleteMessage] = useState("");
    const [showAddConfirm,setShowAddConfirm] = useState(false);
    const [showEditConfirm,setShowEditConfirm] = useState(false);
const [activeSort, setActiveSort] = useState(null);

    // Edit/Add states
    const [showEditForm, setShowEditForm] = useState(false);
    const [editProgram, setEditProgram] = useState({
      programcode: "",
      programname: "",
      collegecode: "",
    });

    const [showAddForm, setShowAddForm] = useState(false);
    const [newProgram, setNewProgram] = useState({
      programcode: "",
      programname: "",
      collegecode: "",
    });

    const setUniquePrograms = (data) => {
      const unique = data.filter(
        (p, index, self) =>
          index === self.findIndex((s) => s.programcode === p.programcode)
      );
      setPrograms(unique);
      setOriginalPrograms(unique);
    };

    useEffect(() => {
  // 1. Load programs (paginated)
  fetchPrograms(1);

  // 2. Load ALL colleges for dropdown (no pagination)
  fetch("http://127.0.0.1:5000/colleges/all")
    .then((res) => res.json())
    .then((data) => {
      const arr = Array.isArray(data.colleges) ? data.colleges : [];
      setColleges(arr);
    })
    .catch((err) => console.error("Error fetching colleges:", err));
}, []);



    // Fetch programs
    const fetchPrograms = async (pageNum = 1) => {
      setLoading(true);
      try {
        const res = await fetch(`http://127.0.0.1:5000/programs/page/${pageNum}`);
        const data = await res.json();
        if (Array.isArray(data.programs)) {
          setPrograms(data.programs);
          setHasNext(data.has_next || false);
        } else {
          setPrograms([]);
          setHasNext(false);
        }
        setPage(pageNum);
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };

    useEffect(() => {
      fetchPrograms(1);
    }, []);

    // Pagination
   const handleNext = () => {
  if (!hasNext) return;

  // If searching → keep search filter
  if (searchTerm.trim()) {
    handleSearchSubmit({ preventDefault: () => {} }, page + 1);
    return;
  }

  // If sorting → keep sorted list
  if (activeSort) {
    fetch(`http://127.0.0.1:5000/programs/sort?key=${activeSort}&page=${page + 1}`)
      .then((res) => res.json())
      .then((data) => {
        setPrograms(data.programs || []);
        setHasNext(data.has_next || false);
        setPage(page + 1);
      });
    return;
  }

  fetchPrograms(page + 1);
};

const handlePrev = () => {
  if (page <= 1) return;

  // Searching
  if (searchTerm.trim()) {
    handleSearchSubmit({ preventDefault: () => {} }, page - 1);
    return;
  }

  // Sorting
  if (activeSort) {
    fetch(`http://127.0.0.1:5000/programs/sort?key=${activeSort}&page=${page - 1}`)
      .then((res) => res.json())
      .then((data) => {
        setPrograms(data.programs || []);
        setHasNext(data.has_next || false);
        setPage(page - 1);
      });
    return;
  }

  fetchPrograms(page - 1);
};


    // Sort
const handleSort = (key) => {
  setActiveSort(key === "default" ? null : key);

  if (key === "default") {
    fetchPrograms(1);
    setShowSortMenu(false);
    return;
  }

  fetch(`http://127.0.0.1:5000/programs/sort?key=${encodeURIComponent(key)}&page=1`)
    .then((res) => res.json())
    .then((data) => {
      const arr = Array.isArray(data) ? data : data.programs || [];
      setPrograms(arr);
      setHasNext(data.has_next || arr.length === limit);
      setPage(1);
    })
    .catch((err) => console.error("Error fetching sorted programs:", err))
    .finally(() => setShowSortMenu(false));
};









    // Search
   const handleSearchSubmit = (e, pageNum = 1) => {
  e.preventDefault();
  const q = searchTerm.trim();

  if (!q) {
    fetchPrograms(1); // fallback to normal programs if search is empty
    return;
  }

  setLoading(true);
  fetch(`http://127.0.0.1:5000/programs/search?q=${encodeURIComponent(q)}&page=${pageNum}`)
    .then(res => res.json())
    .then(data => {
      const arr = Array.isArray(data.programs) ? data.programs : [];
      setPrograms(arr);
      setHasNext(data.has_next || arr.length === limit);
      setPage(pageNum);
    })
    .catch(console.error)
    .finally(() => setLoading(false));
};


    // Delete
    const handleDelete = () => {
      if (!selectedRow) {
        setDeleteMessage("⚠️ Please select a program to delete.");
        setShowDeleteConfirm(true);
        return;
      }
      setDeleteMessage(
        `Are you sure you want to delete program ${selectedRow.programcode}?`
      );
      setShowDeleteConfirm(true);
    };

  const confirmDelete = async () => {
  try {
    console.log(" Checking students enrolled in:", selectedRow.programcode);

    // ✅ Fetch only students enrolled in this program
    const res = await fetch(
      `http://127.0.0.1:5000/students/by-program/${selectedRow.programcode}`
    );

    if (!res.ok) {
      console.error(" Failed to check enrolled students:", res.status);
      setDeleteMessage(" Failed to verify enrolled students.");
      return;
    }

    const data = await res.json();
    console.log(" Response from /by-program:", data);

    const studentsArray = data.students || [];

    // ✅ If there are students, block delete
    if (studentsArray.length > 0) {
      setDeleteMessage(
        ` Cannot delete program '${selectedRow.programcode}' because there are students enrolled in it.`
      );
      return;
    }

    // ✅ Proceed with delete if no students are enrolled
    const deleteRes = await fetch(
      `http://127.0.0.1:5000/programs/${selectedRow.programcode}`,
      { method: "DELETE" }
    );

    const deleteData = await deleteRes.json();

    if (deleteData.error) {
      setDeleteMessage( deleteData.error);
      return;
    }

    await fetchPrograms(page);
    setSelectedRow(null);
    setShowDeleteConfirm(false);
    alert(deleteData.message || " Program deleted successfully!");
  } catch (err) {
    console.error("🔥 Error during deletion:", err);
    setDeleteMessage("🔥 Failed to delete program.");
  }
};



    // Edit
    const [originalProgramCode, setOriginalProgramCode] = useState("");

    const handleEdit = () => {
      if (!selectedRow) return;
      setOriginalProgramCode(selectedRow.programcode);
      setEditProgram({ ...selectedRow });
      setShowEditForm(true);
    };

 const handleEditSave = async (e) => {
  e.preventDefault();

  if (!validateProgramEdit(editProgram, programs, originalProgramCode)) return;

  try {
    const res = await fetch(`http://127.0.0.1:5000/programs/${originalProgramCode}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(editProgram),
    });

    const data = await res.json();
    if (!res.ok) throw new Error(data?.error || "Update failed");

    alert(data.message || " Program updated successfully!");
    await fetchPrograms(page);
    setShowEditForm(false);
    setSelectedRow(null);
  } catch (err) {
    alert(err.message);
  }
};


    // Add
 // Validation for adding a program
const validateProgram = (program, existingPrograms) => {
  // Check for empty fields
  for (const [key, value] of Object.entries(program)) {
    if (!String(value).trim()) {
      alert(`${key} is required`);
      return false;
    }
  }

  const programCodeLower = program.programcode.toLowerCase();
  const programNameLower = program.programname.toLowerCase();

  // Check for duplicate program code (case-insensitive)
  if (existingPrograms.some((p) => p.programcode.toLowerCase() === programCodeLower)) {
    alert("A program with this code already exists.");
    return false;
  }

  // Check for duplicate program name (case-insensitive)
  if (existingPrograms.some((p) => p.programname.toLowerCase() === programNameLower)) {
    alert("A program with this name already exists.");
    return false;
  }

  return true;
};


    // Validation for editing a program
const validateProgramEdit = (program, existingPrograms, originalCode) => {
  for (const [key, value] of Object.entries(program)) {
    if (!String(value).trim()) {
      alert(`${key} is required`);
      return false;
    }
  }

  // Check duplicate program code, ignoring the original
  if (
    existingPrograms.some(
      (p) =>
        p.programcode.toLowerCase() === program.programcode.toLowerCase() &&
        p.programcode.toLowerCase() !== originalCode.toLowerCase()
    )
  ) {
    alert(" A program with this code already exists.");
    return false;
  }

  // Check duplicate program name, ignoring the original
  if (
    existingPrograms.some(
      (p) =>
        p.programname.toLowerCase() === program.programname.toLowerCase() &&
        p.programcode.toLowerCase() !== originalCode.toLowerCase()
    )
  ) {
    alert(" A program with this name already exists.");
    return false;
  }

  return true;
};

const handleAddProgram = async (e) => {
  e.preventDefault();

  if (!validateProgram(newProgram, programs)) return;

  try {
    const res = await fetch("http://127.0.0.1:5000/programs/", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(newProgram),
    });
    const data = await res.json();

    if (res.ok) {
      alert(" Program added successfully!");
      setShowAddForm(false);
      setNewProgram({ programcode: "", programname: "", collegecode: "" });
      await fetchPrograms(page);
    } else {
      alert(` ${data.error || "Failed to add program"}`);
    }
  } catch (err) {
    console.error(err);
    alert(" An error occurred while adding the program.");
  }
};


    return (
      <div className="containers">
        {loading ? (
          <p style={{ color: "blue" }}>Loading...</p>
        ) : (
          <>
            {/* Table */}
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
                style={{ color: "#2E3070", borderSpacing: "0", width: "100%" }}
              >
                <thead>
                  <tr>
                    <th>Program Code</th>
                    <th>Program Name</th>
                    <th>College Code</th>
                  </tr>
                </thead>
               <tbody>
  {programs.length > 0 ? (
    programs.map((program, rowIndex) => (
      <tr
        key={program.programcode || rowIndex}
        onClick={() => setSelectedRow(program)}
        className={
          selectedRow?.programcode === program.programcode
            ? "selected-row"
            : ""
        }
        style={{ cursor: "pointer" }}
      >
        <td>{program.programcode}</td>
        <td>{program.programname}</td>
        <td>{program.collegecode}</td>
      </tr>
    ))
  ) : (
    <tr className="no-results">
      <td colSpan="3" style={{ textAlign: "center", color: "#999" }}>
        No programs found
      </td>
    </tr>
  )}

  {/* Fillers — make sure 4 total rows are always rendered */}
  {Array.from({ length: Math.max(0, 4 - programs.length) }).map((_, i) => (
    <tr key={`filler-${i}`} className="filler-row">
      <td colSpan="3">&nbsp;</td>
    </tr>
  ))}
</tbody>

              </table>
            </div>

            {/* Bottom buttons */}
            <div className="bottomcon">
              <button className="editbut" onClick={handleEdit}>
                <img
                  src={editIcon}
                  alt="Edit"
                  className="icon"
                  style={{ width: "30px", height: "30px", position: "absolute", left: "32px" }}
                />
                Edit
              </button>

              <button className="addbut" onClick={() => setShowAddForm(true)}>
                <img
                  src={addIcon}
                  alt="Add"
                  className="addicon"
                  style={{ width: "30px", height: "30px", position: "absolute", left: "30px" }}
                />
                Add
              </button>

              {/* Pagination */}
              <div
                className="pagination-controls"
                style={{
                  display: "flex",
                  justifyContent: "center",
                  marginTop: "1rem",
                }}
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
                <span
                  style={{ alignSelf: "center", fontWeight: "bold", color: "#4956AD" }}
                >
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
                  onClick={handleDelete}
                  disabled={!selectedRow}
                >
                  <img
                    src={deleteIcon}
                    alt="Delete"
                    className="icon"
                    style={{ width: "30px", height: "30px", position: "absolute", left: "30px" }}
                  />
                  Delete
                </button>
              </div>
            </div>

            {/* Sort & Search */}
            <div className="sortcon">
              <button className="sortbut" onClick={() => setShowSortMenu(!showSortMenu)}>
                <img
                  src={sortIcon}
                  alt="Sort"
                  style={{ width: "30px", height: "30px", position: "absolute", left: "32px" }}
                />
                <img
                  src={arrowIcon}
                  alt="arrrowdown"
                  style={{ width: "35px", height: "35px", position: "absolute", left: "140px" }}
                />
                Sort by:
              </button>

              <div className="search-wrapper">
                <form onSubmit={handleSearchSubmit}>
                  <img
                    src={searchIcon}
                    alt="search"
                    className="searchIcon"
                    style={{ width: "35px", height: "35px", position: "absolute", left: "77vw", top: "-3.6vw", zIndex: 3 }}
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
                  <p onClick={() => handleSort("programcode")}>Sort by Program Code</p>
                  <p onClick={() => handleSort("programname")}>Sort by Program Name</p>
                  <p onClick={() => handleSort("collegecode")}>Sort by College Code</p>
                </div>
              )}
            </div>

            {/* Edit Modal */}
            {showEditForm && (
              <div className="modal-overlay">
                <div className="modal-content">
                  <div className="navbarhead">
                    <img
                      src={addprogramIcon}
                      alt="editprogram"
                      className="addicon"
                      style={{ width: "90px", height: "90px", position: "absolute", left: "2.8vw", top: "0vw", zIndex: 3 }}
                    />
                    <h2
                      style={{ color: "#ffffffff", fontWeight: "bold", position: "absolute", left: "8vw", top: "1vh" }}
                    >
                      Edit Program
                    </h2>
                  </div>

                  <form onSubmit={handleEditSave}>
                    <label style={{ color: "#2E3070", fontWeight: "bold", position: "absolute", left: "37vw", top: "32.5vh" }}>Program Code:</label>
                    <input
                      className="addcode"
                      type="text"
                      value={editProgram.programcode}
                      onChange={(e) => setEditProgram({ ...editProgram, programcode: e.target.value })}
                    />

                    <br />
                    <label style={{ color: "#2E3070", fontWeight: "bold", position: "absolute", left: "37vw", top: "40.5vh" }}>Program Name:</label>
                    <input
                      className="addfirst"
                      type="text"
                      value={editProgram.programname}
                      onChange={(e) => setEditProgram({ ...editProgram, programname: e.target.value })}
                    />

                    <br />
                    <label style={{ color: "#2E3070", fontWeight: "bold", position: "absolute", left: "37vw", top: "48.5vh" }}>College Code:</label>
                    <select
  className="addcollege"
  value={editProgram.collegecode}
  onChange={(e) =>
    setEditProgram({ ...editProgram, collegecode: e.target.value })
  }
>
  <option value="">-- Select College --</option>
  {colleges.map((c) => (
    <option key={c.collegecode} value={c.collegecode}>
      {c.collegecode}
    </option>
  ))}
</select>

                    <br />
                    <button type="button" className="addsub" onClick={() => setShowEditConfirm(true)}>Save</button>
                    <button
                      type="button"
                      className="canceladd"
                      onClick={() => { setShowEditForm(false); setEditProgram({ programcode: "", programname: "", collegecode: "" }); }}
                    >
                      Cancel
                    </button>
                  </form>
                </div>
              </div>
            )}

            {/* Add Modal */}
            {showAddForm && (
              <div className="modal-overlay">
                <div className="modal-content">
                  <div className="navbarhead">
                    <img
                      src={addprogramIcon}
                      alt="addprogram"
                      className="addicon"
                      style={{ width: "90px", height: "90px", position: "absolute", left: "2.8vw", top: "0vw", zIndex: 3 }}
                    />
                    <h2
                      style={{ color: "#ffffffff", fontWeight: "bold", position: "absolute", left: "8vw", top: "1vh" }}
                    >
                      Add Program
                    </h2>
                  </div>

                  <form onSubmit={handleAddProgram}>
                    <label style={{ color: "#2E3070", fontWeight: "bold", position: "absolute", left: "37vw", top: "32.5vh" }}>Program Code:</label>
                    <input
                      placeholder="eg.BSCS"
                      className="addcode"
                      type="text"
                      value={newProgram.programcode}
                      onChange={(e) => setNewProgram({ ...newProgram, programcode: e.target.value })}
                    />

                    <br />
                    <label style={{ color: "#2E3070", fontWeight: "bold", position: "absolute", left: "37vw", top: "40.5vh" }}>Program Name:</label>
                    <input
                    placeholder="eg.Bachelor of Science in Computer Science"
                      className="addfirst"
                      type="text"
                      value={newProgram.programname}
                      onChange={(e) => setNewProgram({ ...newProgram, programname: e.target.value })}
                    />

                    <br />
                   <label style={{ color: "#2E3070", fontWeight: "bold", position: "absolute", left: "37vw", top: "48.5vh" }}>
  College Code:
</label>
<select
  className="addcollege"
  value={newProgram.collegecode}
  onChange={(e) =>
    setNewProgram({ ...newProgram, collegecode: e.target.value })
  }
>
  <option value="">-- Select College --</option>
  {colleges.map((c) => (
    <option key={c.collegecode} value={c.collegecode}>
      {c.collegecode}
    </option>
  ))}
</select>



                    <br />
                    <button type="button" className="addsub" onClick={() => setShowAddConfirm(true)}>Save</button>

                    <button
                      type="button"
                      className="canceladd"
                      onClick={() => { setShowAddForm(false); setNewProgram({ programcode: "", programname: "", collegecode: "" }); }}
                    >
                      Cancel
                    </button>
                  </form>
                </div>
              </div>
            )}


            {/* Delete Confirmation */}
            {showDeleteConfirm && (
              <div className="confirm-modal-overlay">
                <div className="confirm-modal-content">
                  <h3 style={{ color: "#2E3070" }}>Warning</h3>
                   <p
        style={{
          color: deleteMessage.startsWith("Are you sure")
            ? "#2E3070"
            : deleteMessage.startsWith("")
            ? "#2E3070"
            : "#2E3070",
          fontWeight: "bold",
        }}
      >
        {deleteMessage}
      </p>
            
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
      <h5 style={{ color: "#2E3070" }}>Are you sure you want to add this program?</h5>

      <div className="confirm-modal-buttons">
        <button
        style={{ backgroundColor: "#2E3070" }}
          className="yes-btn "
          onClick={() => {
            setShowAddConfirm(false);
          handleAddProgram({ preventDefault: () => {} });


          }}
        >
          Yes
        </button>

        <button
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
        
          className="yes-btn"
           style={{ backgroundColor: "#2E3070" }}
          onClick={async () => {
            setShowEditConfirm(false);
            await handleEditSave({ preventDefault: () => {} });
            setShowEditForm(false); // close edit form
          }}
        >
          Yes
        </button>

        <button
          className="no-btn"
          onClick={() => setShowEditConfirm(false)}
        >
          No
        </button>
      </div>
    </div>
  </div>
)}

            {/* Footer */}
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

  export default Program;
