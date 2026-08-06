import React, { useEffect, useState, useRef } from "react";
import "../../assets/styles/college.css";
import editIcon from "../../assets/images/edit.png";
import addIcon from "../../assets/images/add.png";
import deleteIcon from "../../assets/images/delete.png";
import sortIcon from  "../../assets/images/sort.png";
import arrowIcon from "../../assets/images/arrowdown.png";
import searchIcon from "../../assets/images/search.png";
import addcollegeIcon from "../../assets/images/addcollege.png";

function College() {

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
  const [colleges, setColleges] = useState([]);
  const [allColleges, setAllColleges] = useState([]);   // ✅ full list for validation
  const [selectedRow, setSelectedRow] = useState(null);
  const [showSortMenu, setShowSortMenu] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [loading, setLoading] = useState(true);
  const tableRef = useRef(null);
  const [originalCollegeCode, setOriginalCollegeCode] = useState("");
const [activeSort, setActiveSort] = useState(null);
const [sortDirection, setSortDirection] = useState(null);

  // Pagination
  const [page, setPage] = useState(1);
  const limit = 9;
  const [hasNext, setHasNext] = useState(false);

  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [deleteMessage, setDeleteMessage] = useState("");

  const [showAddConfirm, setShowAddConfirm] = useState(false);
  const [showEditConfirm, setShowEditConfirm] = useState(false);

  // Edit states
  const [showEditForm, setShowEditForm] = useState(false);
  const [editCollege, setEditCollege] = useState({
    collegecode: "",
    collegename: "",
  });

  // Add states
  const [showAddForm, setShowAddForm] = useState(false);
  const [newCollege, setNewCollege] = useState({
    collegecode: "",
    collegename: "",
  });

  // Fetch paginated colleges
  const fetchColleges = async (pageNum = 1) => {
    setLoading(true);
    try {
      const res = await fetch(`http://127.0.0.1:5000/colleges/page/${pageNum}`);
      const data = await res.json();

      if (Array.isArray(data.colleges)) {
        setColleges(data.colleges);
        setHasNext(data.has_next || false);
      } else {
        setColleges([]);
        setHasNext(false);
      }

      setPage(pageNum);
    } catch (error) {
      console.error("Error fetching colleges:", error);
    } finally {
      setLoading(false);
    }
  };

  const fetchCollegeResults = async (
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
      `http://127.0.0.1:5000/colleges/filter?${params.toString()}`
    );

    const data = await response
      .json()
      .catch(() => ({}));

    if (!response.ok) {
      throw new Error(
        data.error ||
          "Failed to load colleges."
      );
    }

    setColleges(
      Array.isArray(data.colleges)
        ? data.colleges
        : []
    );

    setHasNext(data.has_next || false);
    setPage(pageNum);
  } catch (error) {
    console.error(
      "College filter error:",
      error
    );

    showNotice(
      "Loading Failed",
      error.message ||
        "The college records could not be loaded.",
      "error"
    );
  } finally {
    setLoading(false);
  }
};
  // ✅ Fetch ALL colleges for validation
  const fetchAllColleges = async () => {
    try {
      const res = await fetch("http://127.0.0.1:5000/colleges/all");
      const data = await res.json();
      setAllColleges(data.colleges || data || []);
    } catch (err) {
      console.error("Error fetching all colleges:", err);
    }
  };

  useEffect(() => {
    fetchColleges(1);
    fetchAllColleges();
  }, []);

  // Pagination handlers



// Pagination handlers
const handleNext = () => {
  if (!hasNext) return;

  fetchCollegeResults(
    page + 1,
    searchTerm.trim(),
    activeSort,
    sortDirection
  );
};

const handlePrev = () => {
  if (page <= 1) return;

  fetchCollegeResults(
    page - 1,
    searchTerm.trim(),
    activeSort,
    sortDirection
  );
};




  // Sorting
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

  fetchCollegeResults(
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
  // Search (now paginated, like students/programs)
const handleSearchSubmit = (
  e,
  pageNum = 1
) => {
  if (e) {
    e.preventDefault();
  }

  fetchCollegeResults(
    pageNum,
    searchTerm.trim(),
    activeSort,
    sortDirection
  );
};
  // Delete
const handleDelete = (college = selectedRow) => {
  if (!college) {
    setDeleteMessage("Please select a college to delete.");
    setShowDeleteConfirm(true);
    return;
  }

  setSelectedRow(college);

  setDeleteMessage(
    `Are you sure you want to delete college ${college.collegecode}?`
  );

  setShowDeleteConfirm(true);
};

const confirmDelete = async () => {
  if (!selectedRow) return;

  try {
    const progRes = await fetch(
      "http://127.0.0.1:5000/programs/all"
    );

    const progData = await progRes.json().catch(() => ({}));

    if (!progRes.ok) {
      setShowDeleteConfirm(false);

      showNotice(
        "Delete Failed",
        "Failed to verify whether this college has existing programs.",
        "error"
      );

      return;
    }

    const hasLinkedPrograms =
      Array.isArray(progData.programs) &&
      progData.programs.some(
        (program) =>
          program.collegecode === selectedRow.collegecode
      );

    if (hasLinkedPrograms) {
      setShowDeleteConfirm(false);

      showNotice(
        "Cannot Delete College",
        `College '${selectedRow.collegecode}' cannot be deleted because it has existing programs.`,
        "warning"
      );

      return;
    }

    const response = await fetch(
      `http://127.0.0.1:5000/colleges/${encodeURIComponent(
        selectedRow.collegecode
      )}`,
      {
        method: "DELETE",
      }
    );

    const data = await response.json().catch(() => ({}));

    if (!response.ok) {
      setShowDeleteConfirm(false);

      showNotice(
        "Delete Failed",
        data.error || "Failed to delete college.",
        "error"
      );

      return;
    }

await fetchCollegeResults(
  page,
  searchTerm.trim(),
  activeSort,
  sortDirection
);
    await fetchAllColleges();

    setSelectedRow(null);
    setShowDeleteConfirm(false);

    showNotice(
      "College Deleted",
      data.message || "College deleted successfully!",
      "success"
    );
  } catch (error) {
    console.error("College deletion error:", error);

    setShowDeleteConfirm(false);

    showNotice(
      "Delete Failed",
      error.message || "An error occurred while deleting the college.",
      "error"
    );
  }
};

  // Edit
const handleEdit = (college = selectedRow) => {
  if (!college) return;

  setSelectedRow(college);
  setOriginalCollegeCode(college.collegecode);
  setEditCollege({ ...college });
  setShowEditForm(true);
};

const handleEditSave = async (e) => {
  e.preventDefault();

  if (!originalCollegeCode) {
    showNotice(
      "No College Selected",
      "Please select a college before editing.",
      "warning"
    );

    return false;
  }

  const isValid = validateCollegeEdit(
    editCollege,
    allColleges,
    originalCollegeCode
  );

  if (!isValid) {
    return false;
  }

  try {
    const response = await fetch(
      `http://127.0.0.1:5000/colleges/${encodeURIComponent(
        originalCollegeCode
      )}`,
      {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          collegecode: editCollege.collegecode.trim(),
          collegename: editCollege.collegename.trim(),
        }),
      }
    );

    const data = await response.json().catch(() => ({}));

    if (!response.ok) {
      throw new Error(
        data.error ||
          "Update failed. The college may not exist."
      );
    }

    setShowEditForm(false);
    setSelectedRow(null);
    setOriginalCollegeCode("");

await fetchCollegeResults(
  page,
  searchTerm.trim(),
  activeSort,
  sortDirection
);
    await fetchAllColleges();

    showNotice(
      "College Updated",
      data.message || "College updated successfully!",
      "success"
    );

    return true;
  } catch (error) {
    console.error("College update error:", error);

    showNotice(
      "Update Failed",
      error.message || "Failed to update the college.",
      "error"
    );

    return false;
  }
};

  // Validate before saving edits (uses ALL colleges)
const validateCollegeEdit = (
  college,
  existingColleges,
  originalCode
) => {
  const fieldNames = {
    collegecode: "College code",
    collegename: "College name",
  };

  for (const [key, value] of Object.entries(college)) {
    if (!String(value).trim()) {
      showNotice(
        "Required Field",
        `${fieldNames[key] || key} is required.`,
        "warning"
      );

      return false;
    }
  }

  const newCollegeCode = college.collegecode
    .trim()
    .toLowerCase();

  const newCollegeName = college.collegename
    .trim()
    .toLowerCase();

  const currentCollegeCode = originalCode
    .trim()
    .toLowerCase();

  const duplicateCode = existingColleges.some(
    (existingCollege) => {
      const existingCode = existingCollege.collegecode
        .trim()
        .toLowerCase();

      return (
        existingCode === newCollegeCode &&
        existingCode !== currentCollegeCode
      );
    }
  );

  if (duplicateCode) {
    showNotice(
      "Duplicate College Code",
      "A college with this code already exists.",
      "warning"
    );

    return false;
  }

  const duplicateName = existingColleges.some(
    (existingCollege) => {
      const existingCode = existingCollege.collegecode
        .trim()
        .toLowerCase();

      const existingName = existingCollege.collegename
        .trim()
        .toLowerCase();

      return (
        existingName === newCollegeName &&
        existingCode !== currentCollegeCode
      );
    }
  );

  if (duplicateName) {
    showNotice(
      "Duplicate College Name",
      "A college with this name already exists.",
      "warning"
    );

    return false;
  }

  return true;
};

  // Validate before adding a new college (uses ALL colleges)
const validateCollege = (
  college,
  existingColleges
) => {
  const fieldNames = {
    collegecode: "College code",
    collegename: "College name",
  };

  for (const [key, value] of Object.entries(college)) {
    if (!String(value).trim()) {
      showNotice(
        "Required Field",
        `${fieldNames[key] || key} is required.`,
        "warning"
      );

      return false;
    }
  }

  const newCollegeCode = college.collegecode
    .trim()
    .toLowerCase();

  const newCollegeName = college.collegename
    .trim()
    .toLowerCase();

  const duplicateCode = existingColleges.some(
    (existingCollege) =>
      existingCollege.collegecode
        .trim()
        .toLowerCase() === newCollegeCode
  );

  if (duplicateCode) {
    showNotice(
      "Duplicate College Code",
      "A college with this code already exists.",
      "warning"
    );

    return false;
  }

  const duplicateName = existingColleges.some(
    (existingCollege) =>
      existingCollege.collegename
        .trim()
        .toLowerCase() === newCollegeName
  );

  if (duplicateName) {
    showNotice(
      "Duplicate College Name",
      "A college with this name already exists.",
      "warning"
    );

    return false;
  }

  return true;
};

const handleAddCollege = async (e) => {
  e.preventDefault();

  const isValid = validateCollege(
    newCollege,
    allColleges
  );

  if (!isValid) {
    return false;
  }

  try {
    const response = await fetch(
      "http://127.0.0.1:5000/colleges/",
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          collegecode: newCollege.collegecode.trim(),
          collegename: newCollege.collegename.trim(),
        }),
      }
    );

    const data = await response.json().catch(() => ({}));

    if (!response.ok) {
      throw new Error(
        data.error || "Failed to add college."
      );
    }

    setShowAddForm(false);

    setNewCollege({
      collegecode: "",
      collegename: "",
    });

   await fetchCollegeResults(
  page,
  searchTerm.trim(),
  activeSort,
  sortDirection
);
    await fetchAllColleges();

    showNotice(
      "College Added",
      data.message || "College added successfully!",
      "success"
    );

    return true;
  } catch (error) {
    console.error("College add error:", error);

    showNotice(
      "Add Failed",
      error.message ||
        "An error occurred while adding the college.",
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
              style={{
  color: "#2E3070",
  borderSpacing: "0",
  width: "100%",
  tableLayout: "fixed",
}}
            >
            <thead>
  <tr>
    <th
      onClick={() => handleSort("collegecode")}
      style={{
        width: "33.33%",
        cursor: "pointer",
        userSelect: "none",
      }}
    >
      College Code{" "}
      {getSortArrow("collegecode")}
    </th>

    <th
      onClick={() => handleSort("collegename")}
      style={{
        width: "33.33%",
        cursor: "pointer",
        userSelect: "none",
      }}
    >
      College Name{" "}
      {getSortArrow("collegename")}
    </th>

    <th
      style={{
        width: "33.33%",
      }}
    >
      Actions
    </th>
  </tr>
</thead>

             <tbody>
  {colleges.length > 0 ? (
    colleges.map((college, rowIndex) => (
      <tr
        key={college.collegecode || rowIndex}
        onClick={() => setSelectedRow(college)}
        className={
          selectedRow?.collegecode === college.collegecode
            ? "selected-row"
            : ""
        }
        style={{ cursor: "pointer" }}
      >
        <td>{college.collegecode}</td>
        <td>{college.collegename}</td>

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
              title="Edit college"
              onClick={(e) => {
                e.stopPropagation();
                handleEdit(college);
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
              title="Delete college"
              onClick={(e) => {
                e.stopPropagation();
                handleDelete(college);
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
        colSpan="3"
        style={{
          textAlign: "center",
          color: "#999",
        }}
      >
        No colleges found
      </td>
    </tr>
  )}

  {Array.from({
    length: Math.max(0, 4 - colleges.length),
  }).map((_, i) => (
    <tr
      key={`filler-${i}`}
      className="filler-row"
    >
      <td colSpan="3">&nbsp;</td>
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
                style={{
                  width: "30px",
                  height: "30px",
                  position: "absolute",
                  left: "30px",
                }}
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
                style={{
                  alignSelf: "center",
                  fontWeight: "bold",
                  color: "#4956AD",
                }}
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

          {/* Sort & search */}
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
                  onChange={(e) => setSearchTerm(e.target.value)}
                />
                <button type="submit" style={{ display: "none" }}>
                  Search
                </button>
              </form>
            </div>

           
          </div>

         {/* Edit Form */}
{showEditForm && (
  <div className="modal-overlay">
    <div className="modal-content">
      <div className="navbarhead">
        <img
          src={addcollegeIcon}
          alt="editcollege"
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
            color: "#ffffff",
            fontWeight: "bold",
            position: "absolute",
            left: "8vw",
            top: "1vh",
          }}
        >
          Edit College
        </h2>
      </div>

      <form onSubmit={handleEditSave}>
        <label
          style={{
            color: "#2E3070",
            fontWeight: "bold",
            position: "absolute",
            left: "37vw",
            top: "32.5vh",
          }}
        >
          College Code:
        </label>

        <input
          className="addid"
          type="text"
          value={editCollege.collegecode}
          onChange={(e) =>
            setEditCollege({
              ...editCollege,
              collegecode: e.target.value,
            })
          }
        />

        <label
          style={{
            color: "#2E3070",
            fontWeight: "bold",
            position: "absolute",
            left: "37vw",
            top: "40.5vh",
          }}
        >
          College Name:
        </label>

        <input
          className="addfirst"
          type="text"
          value={editCollege.collegename}
          onChange={(e) =>
            setEditCollege({
              ...editCollege,
              collegename: e.target.value,
            })
          }
        />

        <button
          type="button"
          className="addsub"
          onClick={() => setShowEditConfirm(true)}
        >
          Save
        </button>

        <button
          type="button"
          className="canceladd"
          onClick={() => {
            setShowEditForm(false);
            setSelectedRow(null);
            setOriginalCollegeCode("");

            setEditCollege({
              collegecode: "",
              collegename: "",
            });
          }}
        >
          Cancel
        </button>
      </form>
    </div>
  </div>
)}
          {/* Add Form */}
          {showAddForm && (
            <div className="modal-overlay">
              <div className="modal-content">
                <div className="navbarhead">
                  <img
                    src={addcollegeIcon}
                    alt="addcollege"
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
                    Add College
                  </h2>
                </div>

                <form onSubmit={handleAddCollege}>
                  <label
                    style={{
                      color: "#2E3070",
                      fontWeight: "bold",
                      position: "absolute",
                      left: "37vw",
                      top: "32.5vh",
                    }}
                  >
                    College Code:
                  </label>
                  <input
                    placeholder="eg.CCS"
                    className="addid"
                    type="text"
                    value={newCollege.collegecode}
                    onChange={(e) =>
                      setNewCollege({
                        ...newCollege,
                        collegecode: e.target.value,
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
                      top: "40.5vh",
                    }}
                  >
                    College Name:
                  </label>
                  <input
                    placeholder="eg.College of Computer Studies"
                    className="addfirst"
                    type="text"
                    value={newCollege.collegename}
                    onChange={(e) =>
                      setNewCollege({
                        ...newCollege,
                        collegename: e.target.value,
                      })
                    }
                  />

                  <br />
                  <button
                    type="button"
                    className="addsub"
                    onClick={() => {
                      setShowAddConfirm(true);
                    }}
                  >
                    Save
                  </button>
                  <button
                    type="button"
                    className="canceladd"
                    onClick={() => {
                      setShowAddForm(false);
                      setNewCollege({
                        collegecode: "",
                        collegename: "",
                      });
                    }}
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
                <h3 style={{ color: "#2E3070" }}>Warning!</h3>
                <p
                  style={{
                    color: "#2E3070",
                    fontWeight: "bold",
                  }}
                >
                  {deleteMessage}
                </p>
                {deleteMessage.startsWith("Are you sure") ? (
                  <div className="confirm-modal-buttons">
                    <button onClick={confirmDelete} className="yes-btn">
                      Yes
                    </button>
                    <button
                      onClick={() => setShowDeleteConfirm(false)}
                      className="no-btn"
                    >
                      No
                    </button>
                  </div>
                ) : (
                  <div className="confirm-modal-buttons">
                    <button
                      onClick={() => setShowDeleteConfirm(false)}
                      className="yes-btn"
                    >
                      OK
                    </button>
                  </div>
                )}
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

      {/* Add Confirm */}
      {showAddConfirm && (
        <div className="confirm-modal-overlay">
          <div className="confirm-modal-content">
            <h3 style={{ color: "#2E3070" }}>Add College</h3>
            <h5 style={{ color: "#2E3070" }}>
              Are you sure you want to add this College?
            </h5>

            <div className="confirm-modal-buttons">
              <button
                style={{ backgroundColor: "#2E3070" }}
                className="yes-btn "
                onClick={() => {
                  setShowAddConfirm(false);
                  handleAddCollege({ preventDefault: () => {} });
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

      {/* Edit Confirm */}
      {showEditConfirm && (
        <div className="confirm-modal-overlay">
          <div className="confirm-modal-content">
            <h3 style={{ color: "#2E3070" }}>Edit College</h3>
            <h5 style={{ color: "#2E3070" }}>
              Are you sure you want to save changes?
            </h5>

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

export default College;
