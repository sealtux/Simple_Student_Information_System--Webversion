  import React, { useEffect, useState, useRef } from "react";
  import "../../assets/styles/program.css"; 
  import editIcon from "../../assets/images/edit.png";
  import addIcon from "../../assets/images/add.png";
  import deleteIcon from "../../assets/images/delete.png";
  import sortIcon from "../../assets/images/sort.png";
  import arrowIcon from "../../assets/images/arrowdown.png";
  import searchIcon from "../../assets/images/search.png";
  import addprogramIcon from "../../assets/images/addsubject.png"; 

  function Program() {

 const [notification, setNotification] = useState({
  show: false,
  type: "success",
  title: "",
  message: "",
});

const showNotice = (
  title,
  message,
  type = "success"
) => {
  setNotification({
    show: true,
    type,
    title,
    message,
  });
};

const closeNotification = () => {
  setNotification({
    show: false,
    type: "success",
    title: "",
    message: "",
  });
};
    const [programs, setPrograms] = useState([]);
    const [originalPrograms, setOriginalPrograms] = useState([]);
    const [selectedRow, setSelectedRow] = useState(null);

    const [searchTerm, setSearchTerm] = useState("");
    const [loading, setLoading] = useState(true);
    const tableRef = useRef(null);
const [colleges, setColleges] = useState([]);

    const [page, setPage] = useState(1);
    const limit = 9;
    const [hasNext, setHasNext] = useState(false);

    const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
    const [deleteMessage, setDeleteMessage] = useState("");
    const [showAddConfirm,setShowAddConfirm] = useState(false);
    const [showEditConfirm,setShowEditConfirm] = useState(false);
const [activeSort, setActiveSort] = useState(null);
const [sortDirection, setSortDirection] = useState(null);


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

fetchProgramResults(
  1,
  "",
  null,
  null
);


  fetch("http://127.0.0.1:5000/colleges/all")
    .then((res) => res.json())
    .then((data) => {
      const arr = Array.isArray(data.colleges) ? data.colleges : [];
      setColleges(arr);
    })
    .catch((err) => console.error("Error fetching colleges:", err));
}, []);




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

    const fetchProgramResults = async (
  pageNum = 1,
  queryOverride = searchTerm.trim(),
  sortKeyOverride = activeSort,
  directionOverride = sortDirection
) => {
  setLoading(true);

  try {
    const params = new URLSearchParams();

    params.append("page", pageNum);

    if (queryOverride) {
      params.append("q", queryOverride);
    }

    if (sortKeyOverride && directionOverride) {
      params.append("sortkey", sortKeyOverride);
      params.append("direction", directionOverride);
    }

    const response = await fetch(
      `http://127.0.0.1:5000/programs/filter?${params.toString()}`
    );

    const data = await response.json().catch(() => ({}));

    if (!response.ok) {
      throw new Error(
        data.error || "Failed to load programs."
      );
    }

    setPrograms(
      Array.isArray(data.programs)
        ? data.programs
        : []
    );

    setOriginalPrograms(
      Array.isArray(data.programs)
        ? data.programs
        : []
    );

    setHasNext(data.has_next || false);
    setPage(pageNum);
  } catch (error) {
    console.error(
      "Program filter error:",
      error
    );

    showNotice(
      "Loading Failed",
      error.message ||
        "The program records could not be loaded.",
      "error"
    );
  } finally {
    setLoading(false);
  }
};
  

const handleNext = () => {
  if (!hasNext) return;

  fetchProgramResults(
    page + 1,
    searchTerm.trim(),
    activeSort,
    sortDirection
  );
};



const handlePrev = () => {
  if (page <= 1) return;

  fetchProgramResults(
    page - 1,
    searchTerm.trim(),
    activeSort,
    sortDirection
  );
};


const handleSort = (key) => {
  const query = searchTerm.trim();

  let newSortKey;
  let newDirection;

  // First click: ascending
  if (activeSort !== key) {
    newSortKey = key;
    newDirection = "asc";
  }

  // Second click: descending
  else if (sortDirection === "asc") {
    newSortKey = key;
    newDirection = "desc";
  }

  // Third click: default
  else {
    newSortKey = null;
    newDirection = null;
  }

  setActiveSort(newSortKey);
  setSortDirection(newDirection);

  fetchProgramResults(
    1,
    query,
    newSortKey,
    newDirection
  );
};



const getSortArrow = (key) => {
  let arrow = "▲▼";

  if (activeSort === key) {
    arrow =
      sortDirection === "asc"
        ? "▲"
        : "▼";
  }

  return (
    <span
      style={{
        fontSize: "8px",
        marginLeft: "4px",
        letterSpacing: "-2px",
        verticalAlign: "middle",
      }}
    >
      {arrow}
    </span>
  );
};

    // Search
const handleSearchSubmit = (
  e,
  pageNum = 1
) => {
  if (e) {
    e.preventDefault();
  }

  fetchProgramResults(
    pageNum,
    searchTerm.trim(),
    activeSort,
    sortDirection
  );
};

   

const confirmDelete = async () => {
  if (!selectedRow) return;

  try {
    const programCode = encodeURIComponent(selectedRow.programcode);

    const res = await fetch(
      `http://127.0.0.1:5000/students/by-program/${programCode}`
    );

    const data = await res.json().catch(() => ({}));

    if (!res.ok) {
      setShowDeleteConfirm(false);

      showNotice(
        "Delete Failed",
        data.error ||
          "Failed to verify if students are enrolled in this program.",
        "error"
      );

      return;
    }

    const studentsArray = Array.isArray(data.students)
      ? data.students
      : [];

    if (studentsArray.length > 0) {
      setShowDeleteConfirm(false);

      showNotice(
        "Cannot Delete Program",
        `Program '${selectedRow.programcode}' cannot be deleted because there are students enrolled in it.`,
        "warning"
      );

      return;
    }

    const deleteRes = await fetch(
      `http://127.0.0.1:5000/programs/${programCode}`,
      {
        method: "DELETE",
      }
    );

    const deleteData = await deleteRes.json().catch(() => ({}));

    if (!deleteRes.ok || deleteData.error) {
      setShowDeleteConfirm(false);

      showNotice(
        "Delete Failed",
        deleteData.error || "Failed to delete program.",
        "error"
      );

      return;
    }

  await fetchProgramResults(
  page,
  searchTerm.trim(),
  activeSort,
  sortDirection
);

    setSelectedRow(null);
    setShowDeleteConfirm(false);

    showNotice(
      "Program Deleted",
      deleteData.message || "Program deleted successfully!",
      "success"
    );
  } catch (err) {
    console.error("Error during deletion:", err);

    setShowDeleteConfirm(false);

    showNotice(
      "Delete Failed",
      "An error occurred while deleting the program.",
      "error"
    );
  }
};


    const [originalProgramCode, setOriginalProgramCode] = useState("");

    const handleEdit = (program = selectedRow) => {
  if (!program) return;

  setSelectedRow(program);
  setOriginalProgramCode(program.programcode);
  setEditProgram({ ...program });
  setShowEditForm(true);
};

const handleDelete = (program = selectedRow) => {
  if (!program) {
    setDeleteMessage("Please select a program to delete.");
    setShowDeleteConfirm(true);
    return;
  }

  setSelectedRow(program);

  setDeleteMessage(
    `Are you sure you want to delete program ${program.programcode}?`
  );

  setShowDeleteConfirm(true);
};

const handleEditSave = async (e) => {
  e.preventDefault();

  if (
    !validateProgramEdit(
      editProgram,
      programs,
      originalProgramCode
    )
  ) {
    return false;
  }

  try {
    const res = await fetch(
      `http://127.0.0.1:5000/programs/${encodeURIComponent(
        originalProgramCode
      )}`,
      {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(editProgram),
      }
    );

    const data = await res.json();

    if (!res.ok) {
      throw new Error(data.error || "Update failed.");
    }

  await fetchProgramResults(
  page,
  searchTerm.trim(),
  activeSort,
  sortDirection
);

    setShowEditForm(false);
    setSelectedRow(null);

showNotice(
  "Program Updated",
  data.message || "Program updated successfully!",
  "success"
);

    return true;
  } catch (err) {
   showNotice(
  "Update Failed",
  err.message || "Failed to update program.",
  "error"
);
    return false;
  }
};

const validateProgram = (program, existingPrograms) => {
  const fieldNames = {
    programcode: "Program code",
    programname: "Program name",
    collegecode: "College code",
  };

  for (const [key, value] of Object.entries(program)) {
    if (!String(value).trim()) {
      showNotice(
        "Required Field",
        `${fieldNames[key] || key} is required.`,
        "warning"
      );

      return false;
    }
  }

  const programCodeLower = program.programcode
    .trim()
    .toLowerCase();

  const programNameLower = program.programname
    .trim()
    .toLowerCase();

  const duplicateCode = existingPrograms.some(
    (existingProgram) =>
      existingProgram.programcode.trim().toLowerCase() ===
      programCodeLower
  );

  if (duplicateCode) {
    showNotice(
      "Duplicate Program Code",
      "A program with this code already exists.",
      "warning"
    );

    return false;
  }

  const duplicateName = existingPrograms.some(
    (existingProgram) =>
      existingProgram.programname.trim().toLowerCase() ===
      programNameLower
  );

  if (duplicateName) {
    showNotice(
      "Duplicate Program Name",
      "A program with this name already exists.",
      "warning"
    );

    return false;
  }

  return true;
};

    // Validation for editing a program
const validateProgramEdit = (
  program,
  existingPrograms,
  originalCode
) => {
  const fieldNames = {
    programcode: "Program code",
    programname: "Program name",
    collegecode: "College code",
  };

  for (const [key, value] of Object.entries(program)) {
    if (!String(value).trim()) {
      showNotice(
        "Required Field",
        `${fieldNames[key] || key} is required.`,
        "warning"
      );

      return false;
    }
  }

  const newCode = program.programcode
    .trim()
    .toLowerCase();

  const newName = program.programname
    .trim()
    .toLowerCase();

  const currentCode = originalCode
    .trim()
    .toLowerCase();

  const duplicateCode = existingPrograms.some(
    (existingProgram) => {
      const existingCode = existingProgram.programcode
        .trim()
        .toLowerCase();

      return (
        existingCode === newCode &&
        existingCode !== currentCode
      );
    }
  );

  if (duplicateCode) {
    showNotice(
      "Duplicate Program Code",
      "A program with this code already exists.",
      "warning"
    );

    return false;
  }

  const duplicateName = existingPrograms.some(
    (existingProgram) => {
      const existingCode = existingProgram.programcode
        .trim()
        .toLowerCase();

      const existingName = existingProgram.programname
        .trim()
        .toLowerCase();

      return (
        existingName === newName &&
        existingCode !== currentCode
      );
    }
  );

  if (duplicateName) {
    showNotice(
      "Duplicate Program Name",
      "A program with this name already exists.",
      "warning"
    );

    return false;
  }

  return true;
};

const handleAddProgram = async (e) => {
  e.preventDefault();

  const isValid = validateProgram(
    newProgram,
    programs
  );

  if (!isValid) {
    return false;
  }

  try {
    const res = await fetch(
      "http://127.0.0.1:5000/programs/",
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          programcode: newProgram.programcode.trim(),
          programname: newProgram.programname.trim(),
          collegecode: newProgram.collegecode.trim(),
        }),
      }
    );

    const data = await res.json().catch(() => ({}));

    if (!res.ok) {
      throw new Error(
        data.error || "Failed to add program."
      );
    }

    setShowAddForm(false);

    setNewProgram({
      programcode: "",
      programname: "",
      collegecode: "",
    });

await fetchProgramResults(
  page,
  searchTerm.trim(),
  activeSort,
  sortDirection
);

    showNotice(
      "Program Added",
      data.message || "Program added successfully!",
      "success"
    );

    return true;
  } catch (err) {
    console.error("Error adding program:", err);

    showNotice(
      "Add Failed",
      err.message ||
        "An error occurred while adding the program.",
      "error"
    );

    return false;
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
    <th
      onClick={() => handleSort("programcode")}
      style={{
        cursor: "pointer",
        userSelect: "none",
      }}
    >
      Program Code{" "}
      {getSortArrow("programcode")}
    </th>

    <th
      onClick={() => handleSort("programname")}
      style={{
        cursor: "pointer",
        userSelect: "none",
      }}
    >
      Program Name{" "}
      {getSortArrow("programname")}
    </th>

    <th
      onClick={() => handleSort("collegecode")}
      style={{
        cursor: "pointer",
        userSelect: "none",
      }}
    >
      College Code{" "}
      {getSortArrow("collegecode")}
    </th>

    <th>Actions</th>
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

        <td>
          <div
            style={{
              display: "flex",
              justifyContent: "center",
              alignItems: "center",
              gap: "8px",
            }}
          >
            <button
              type="button"
              title="Edit program"
              onClick={(e) => {
                e.stopPropagation();
                handleEdit(program);
              }}
            style={{
  border: "2px solid #4956AD",
  borderRadius: "6px",
  padding: "6px",
  backgroundColor: "#f8f9fd",
  cursor: "pointer",
}}
            >
              <img
                src={editIcon}
                alt="Edit"
                style={{
                  width: "20px",
                  height: "20px",
                  display: "block",
                }}
              />
            </button>

            <button
              type="button"
              title="Delete program"
              onClick={(e) => {
                e.stopPropagation();
                handleDelete(program);
              }}
           style={{
  border: "2px solid #4956AD",
  borderRadius: "6px",
  padding: "6px",
  backgroundColor: "#f8f9fd",
  cursor: "pointer",
}}
            >
              <img
                src={deleteIcon}
                alt="Delete"
                style={{
                  width: "20px",
                  height: "20px",
                  display: "block",
                }}
              />
            </button>
          </div>
        </td>
      </tr>
    ))
  ) : (
    <tr className="no-results">
      <td
        colSpan="4"
        style={{
          textAlign: "center",
          color: "#999",
        }}
      >
        No programs found
      </td>
    </tr>
  )}

  {Array.from({
    length: Math.max(0, 4 - programs.length),
  }).map((_, i) => (
    <tr key={`filler-${i}`} className="filler-row">
      <td colSpan="4">&nbsp;</td>
    </tr>
  ))}
</tbody>

              </table>
            </div>

            {/* Bottom buttons */}
            <div className="bottomcon">
             

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
             
              </div>
            </div>

            {/* Sort & Search */}
            <div className="sortcon">
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
        onChange={(e) =>
          setSearchTerm(e.target.value)
        }
      />

      <button
        type="submit"
        style={{ display: "none" }}
      >
        Search
      </button>
    </form>
  </div>
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
      <h3 style={{ color: "#2E3070" }}>Add Program</h3>
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
      <h3 style={{ color: "#2E3070" }}>Edit Program</h3>
      <h5 style={{ color: "#2E3070" }}>Are you sure you want to save changes?</h5>

      <div className="confirm-modal-buttons">
        <button
        
          className="yes-btn"
           style={{ backgroundColor: "#2E3070" }}
       onClick={async () => {
  setShowEditConfirm(false);

  await handleEditSave({
    preventDefault: () => {},
  });
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
       {notification.show && (
  <div
    className="modal-overlay"
    onClick={closeNotification}
    style={{ zIndex: 2000 }}
  >
    <div
      onClick={(e) => e.stopPropagation()}
      style={{
        width: "380px",
        maxWidth: "90vw",
        backgroundColor: "#fff",
        borderRadius: "12px",
        overflow: "hidden",
        boxShadow: "0 10px 35px rgba(0, 0, 0, 0.25)",
        position: "relative",
      }}
    >
      <div
        style={{
          minHeight: "85px",
          backgroundColor: "#2E3070",
          display: "flex",
          alignItems: "center",
          padding: "0 24px",
          gap: "15px",
        }}
      >
        <div
          style={{
            width: "48px",
            height: "48px",
            borderRadius: "50%",
            backgroundColor:
              notification.type === "success"
                ? "#4CAF50"
                : notification.type === "error"
                ? "#d9534f"
                : "#f0ad4e",
            color: "#fff",
            display: "flex",
            justifyContent: "center",
            alignItems: "center",
            fontSize: "26px",
            fontWeight: "bold",
            flexShrink: 0,
          }}
        >
          {notification.type === "success"
            ? "✓"
            : notification.type === "error"
            ? "×"
            : "!"}
        </div>

        <h2
          style={{
            margin: 0,
            color: "#fff",
            fontSize: "22px",
          }}
        >
          {notification.title}
        </h2>
      </div>

      <div
        style={{
          padding: "28px 25px 24px",
          textAlign: "center",
          color: "#2E3070",
        }}
      >
        <p
          style={{
            margin: "0 0 25px",
            fontSize: "15px",
            lineHeight: "1.6",
          }}
        >
          {notification.message}
        </p>

        <button
          type="button"
          onClick={closeNotification}
          style={{
            minWidth: "120px",
            padding: "10px 22px",
            border: "none",
            borderRadius: "7px",
            backgroundColor: "#2E3070",
            color: "#fff",
            fontWeight: "bold",
            cursor: "pointer",
          }}
        >
          OK
        </button>
      </div>
    </div>
  </div>
)}
      </div>
    );
  }

  export default Program;
