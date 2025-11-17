import React, { useEffect, useState, useRef } from "react";
import "./college.css";
import editIcon from "./images/edit.png";
import addIcon from "./images/add.png";
import deleteIcon from "./images/delete.png";
import sortIcon from "./images/sort.png";
import arrowIcon from "./images/arrowdown.png";
import searchIcon from "./images/search.png";
import addcollegeIcon from "./images/addstudent.png"; // reuse same icon or replace

function College() {
  const [colleges, setColleges] = useState([]);
  const [originalColleges, setOriginalColleges] = useState([]);
  const [selectedRow, setSelectedRow] = useState(null);
  const [showSortMenu, setShowSortMenu] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [loading, setLoading] = useState(true);
  const tableRef = useRef(null);
  const [originalCollegeCode, setOriginalCollegeCode] = useState("");
  // Pagination
  const [page, setPage] = useState(1);
  const limit = 9;
  const [hasNext, setHasNext] = useState(false);

  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [deleteMessage, setDeleteMessage] = useState("");

  const [showAddConfirm, setShowAddConfirm] = useState(false);
  const [showEditConfirm,setShowEditConfirm] = useState(false);
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

  const setUniqueColleges = (data) => {
    const unique = data.filter(
      (c, index, self) =>
        index === self.findIndex((s) => s.collegecode === c.collegecode)
    );
    setColleges(unique);
    setOriginalColleges(unique);
  };

  // Fetch paginated colleges
const fetchColleges = async (pageNum = 1) => {
  setLoading(true);
  try {
    const res = await fetch(`http://127.0.0.1:5000/colleges/page/${pageNum}`);
    const data = await res.json();
    console.log("Fetched data:", data);

    // Use 'colleges' key instead of 'college'
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



  useEffect(() => {
    fetchColleges(1);
  }, []);

  // Pagination handlers
  const handleNext = () => {
    if (hasNext) fetchColleges(page + 1);
  };

  const handlePrev = () => {
    if (page > 1) fetchColleges(page - 1);
  };

  // Sorting
const handleSort = async (key) => {
  if (key === "default") {
    fetchColleges(1);
    setShowSortMenu(false);
    return;
  }

  setColleges([]);
  setLoading(true);

  await new Promise((resolve) => requestAnimationFrame(resolve));

  try {
    const res = await fetch(
      `http://127.0.0.1:5000/colleges/sort?key=${encodeURIComponent(key)}&page=1`
    );
    const data = await res.json();
    const arr = Array.isArray(data) ? data : data.colleges || [];

    setColleges(arr);
    setHasNext(data.has_next || arr.length === limit);
    setPage(1);
  } catch (err) {
    console.error("Error fetching sorted colleges:", err);
  } finally {
    setLoading(false);
    setShowSortMenu(false);
  }
};



  // Search
  const handleSearchSubmit = (e) => {
    e.preventDefault();
    if (searchTerm.trim() === "") {
      fetchColleges(1);
    } else {
      fetch(`http://127.0.0.1:5000/colleges/search?q=${encodeURIComponent(searchTerm)}&page=1`)
        .then((res) => res.json())
        .then((data) => {
          const arr = Array.isArray(data) ? data : [];
          setUniqueColleges(arr);
          setPage(1);
          setHasNext(arr.length === limit);
        })
        .catch((err) => console.error(err));
    }
  };

  // Delete
  const handleDelete = () => {
    if (!selectedRow) {
      setDeleteMessage("⚠️ Please select a college to delete.");
      setShowDeleteConfirm(true);
      return;
    }

    setDeleteMessage(
      `Are you sure you want to delete college ${selectedRow.collegecode}?`
    );
    setShowDeleteConfirm(true);
  };
  
const confirmDelete = async () => {
  try {
    // 1️⃣ Check if any program is linked to this college
    const progRes = await fetch(`http://127.0.0.1:5000/programs`);
    const progData = await progRes.json();

    // Assuming your API returns { programs: [...] }
    const hasLinkedPrograms = progData.programs?.some(
      (p) => p.collegecode === selectedRow.collegecode
    );

    if (hasLinkedPrograms) {
      setDeleteMessage(` Cannot delete college '${selectedRow.collegecode}' because it has existing programs.`);
      return;
    }

    // 2️⃣ Proceed with delete
    const res = await fetch(`http://127.0.0.1:5000/colleges/${selectedRow.collegecode}`, {
      method: "DELETE",
    });
    const data = await res.json();

    if (data.error) {
      setDeleteMessage(" " + data.error);
      return;
    }

    await fetchColleges(page);
    setSelectedRow(null);
    setShowDeleteConfirm(false);
    alert(data.message || " College deleted successfully!");
  } catch (err) {
    console.error(err);
    setDeleteMessage(" Failed to delete college.");
  }
};

  // Edit


  const handleEdit = () => {
    if (!selectedRow) return;
    setOriginalCollegeCode(selectedRow.collegecode);
    setEditCollege({ ...selectedRow });
    setShowEditForm(true);
  };

const handleEditSave = async (e) => {
  e.preventDefault();

  if (!originalCollegeCode) {
    alert("⚠️ No college selected for editing.");
    return;
  }

  if (!validateCollegeEdit(editCollege, colleges, originalCollegeCode)) return;

  try {
    const res = await fetch(`http://127.0.0.1:5000/colleges/${originalCollegeCode}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(editCollege),
    });

    const data = await res.json();

    if (!res.ok) {
      throw new Error(data?.error || "Update failed. College may not exist.");
    }

    alert(data.message || "College updated successfully!");
    setShowEditForm(false);
    setSelectedRow(null);
    await fetchColleges(page);

  } catch (err) {
    console.error(err);
    alert("Failed to update college: " + err.message);
  }
};


// Validate before saving edits
const validateCollegeEdit = (college, existingColleges, originalCode) => {
  // Check for empty fields
  for (const [key, value] of Object.entries(college)) {
    if (!String(value).trim()) {
      alert(`${key} is required`);
      return false;
    }
  }

  // Check duplicate code (case-insensitive, excluding the original)
  const duplicateCode = existingColleges.find(
    (c) =>
      c.collegecode.trim().toLowerCase() === college.collegecode.trim().toLowerCase() &&
      c.collegecode.trim().toLowerCase() !== originalCode.trim().toLowerCase()
  );
  if (duplicateCode) {
    alert("A college with this code already exists.");
    return false;
  }

  // Check duplicate name (case-insensitive, excluding the original)
  const duplicateName = existingColleges.find(
    (c) =>
      c.collegename.trim().toLowerCase() === college.collegename.trim().toLowerCase() &&
      c.collegecode.trim().toLowerCase() !== originalCode.trim().toLowerCase()
  );
  if (duplicateName) {
    alert("A college with this name already exists.");
    return false;
  }

  return true; // ✅ passes validation
};

  // Add
// Validate before adding a new college
const validateCollege = (college, existingColleges) => {
  // Check for empty fields
  for (const [key, value] of Object.entries(college)) {
    if (!String(value).trim()) {
      alert(`${key} is required`);
      return false;
    }
  }

  // Check duplicate code (exact match)
  const duplicateCode = existingColleges.find(
    (c) => c.collegecode.trim().toLowerCase() === college.collegecode.trim().toLowerCase()
  );
  if (duplicateCode) {
    alert(" A college with this code already exists.");
    return false;
  }

  // Check duplicate name (case-insensitive)
  const duplicateName = existingColleges.find(
    (c) => c.collegename.trim().toLowerCase() === college.collegename.trim().toLowerCase()
  );
  if (duplicateName) {
    alert(" A college with this name already exists.");
    return false;
  }

  return true; // ✅ passes validation
};


  const handleAddCollege = async (e) => {
    e.preventDefault();
    if (!validateCollege(newCollege, colleges)) return;

    try {
      const res = await fetch("http://127.0.0.1:5000/colleges/", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(newCollege),
      });
      const data = await res.json();
      if (res.ok) {
        alert(" College added successfully!");
        setShowAddForm(false);
        setNewCollege({ collegecode: "", collegename: "" });
        await fetchColleges(page);
      } else {
        alert(` ${data.error || "Failed to add college"}`);
      }
    } catch (err) {
      console.error(err);
      alert(" An error occurred while adding the college.");
    }
  };

  return (
    <div className="containers">
      {loading ? (
        <p style={{ color: "blue" }}>Loading...</p>
      ) : (
        <>
          {/* Table */}
          <div className="table-container" style={{ width: "79vw", border: "2px solid #E7E7E7", borderTopLeftRadius: "10px", borderTopRightRadius: "10px" }}>
            <table ref={tableRef} style={{ color: "#2E3070", borderSpacing: "0", width: "100%" }}>
              <thead>
                <tr>
                  <th>College Code</th>
                  <th>College Name</th>
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
      </tr>
    ))
  ) : (
    <tr className="no-results">
      <td colSpan="2" style={{ textAlign: "center", color: "#999" }}>
        No colleges found
      </td>
    </tr>
  )}

  {/* 👇 Filler rows for consistent height */}
  {Array.from({ length: Math.max(0, 4 - colleges.length) }).map((_, i) => (
    <tr key={`filler-${i}`} className="filler-row">
      <td colSpan="2">&nbsp;</td>
    </tr>
  ))}
</tbody>

            </table>
          </div>

          {/* Bottom buttons */}
          <div className="bottomcon">
            <button className="editbut" onClick={handleEdit}>
              <img src={editIcon} alt="Edit" className="icon" style={{ width: "30px", height: "30px", position: "absolute", left: "32px" }} />
              Edit
            </button>

            <button className="addbut" onClick={() => setShowAddForm(true)}>
              <img src={addIcon} alt="Add" className="addicon" style={{ width: "30px", height: "30px", position: "absolute", left: "30px" }} />
              Add
            </button>

            {/* Pagination */}
            <div className="pagination-controls" style={{ display: "flex", justifyContent: "center", marginTop: "1rem" }}>
              <button className="Prev" onClick={handlePrev} disabled={page === 1} style={{ padding: "0.5rem 1rem", marginRight: "0.5rem", borderRadius: "0.5rem", border: "none", backgroundColor: page === 1 ? "#ccc" : "#4956AD", color: "white", cursor: page === 1 ? "not-allowed" : "pointer" }}>
                Previous</button>
              <span style={{ alignSelf: "center", fontWeight: "bold",  color:"#4956AD"}}>Page {page}</span>
              <button className="Next" onClick={handleNext} disabled={!hasNext} style={{ padding: "0.5rem 1rem", marginLeft: "0.5rem", borderRadius: "0.5rem", border: "none", backgroundColor: !hasNext ? "#ccc" : "#4956AD", color: "white", cursor: !hasNext ? "not-allowed" : "pointer" }}>Next</button>
            </div>

            <div className="action-buttons">
              <button className="deletebut" onClick={handleDelete} disabled={!selectedRow}>
                <img src={deleteIcon} alt="Delete" className="icon" style={{ width: "30px", height: "30px", position: "absolute", left: "30px" }} />
                Delete
              </button>
            </div>
          </div>

          {/* Sort & search */}
          <div className="sortcon">
            <button className="sortbut" onClick={() => setShowSortMenu(!showSortMenu)}>
              <img src={sortIcon} alt="Sort" style={{ width: "30px", height: "30px", position: "absolute", left: "32px" }} />
              <img src={arrowIcon} alt="arrrowdown" style={{ width: "35px", height: "35px", position: "absolute", left: "140px" }} />
              Sort by:
            </button>

            <div className="search-wrapper">
              <form onSubmit={handleSearchSubmit}>
                <img src={searchIcon} alt="search" className="searchIcon" style={{ width: "35px", height: "35px", position: "absolute", left: "77vw", top: "-3.6vw", zIndex: 3 }} />
                <input type="text" className="search" placeholder="Search" value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} />
                <button type="submit" style={{ display: "none" }}>Search</button>
              </form>
            </div>

            {showSortMenu && (
              <div className="sort-popup">
                <p onClick={() => handleSort("default")}>Sort by: Default</p>
                <p onClick={() => handleSort("collegecode")}>Sort by College Code</p>
                <p onClick={() => handleSort("collegename")}>Sort by College Name</p>
              </div>
            )}
          </div>

          {/* Edit Form */}
          {showEditForm && (
            <div className="modal-overlay">
              <div className="modal-content">
                <div className="navbarhead">
                  <img src={addcollegeIcon} alt="editcollege" className="addicon" style={{ width: "90px", height: "90px", position: "absolute", left: "2.8vw", top: "0vw", zIndex: 3 }} />
                  <h2 style={{ color: "#ffffffff", fontWeight: "bold", position: "absolute", left: "8vw", top: "1vh" }}>Edit College</h2>
                </div>

                <form onSubmit={handleEditSave}>
                  <label style={{ color: "#2E3070", fontWeight: "bold", position: "absolute", left: "37vw", top: "32.5vh" }}>College Code:</label>
                  <input className="addid" type="text" value={editCollege.collegecode} onChange={(e) => setEditCollege({ ...editCollege, collegecode: e.target.value })} />

                  <br />
                  <label style={{ color: "#2E3070", fontWeight: "bold", position: "absolute", left: "37vw", top: "40.5vh" }}>College Name:</label>
                  <input className="addfirst" type="text" value={editCollege.collegename} onChange={(e) => setEditCollege({ ...editCollege, collegename: e.target.value })} />

                  <br />
                  <button type="button" className="addsub" onClick={()=>{setShowEditConfirm(true)}}>Save</button>
                  <button type="button" className="canceladd" onClick={() => { setShowEditForm(false); setEditCollege({ collegecode: "", collegename: "" }); }}>Cancel</button>
                </form>
              </div>
            </div>
          )}

          {/* Add Form */}
          {showAddForm && (
            <div className="modal-overlay">
              <div className="modal-content">
                <div className="navbarhead">
                  <img src={addcollegeIcon} alt="addcollege" className="addicon" style={{ width: "90px", height: "90px", position: "absolute", left: "2.8vw", top: "0vw", zIndex: 3 }} />
                  <h2 style={{ color: "#ffffffff", fontWeight: "bold", position: "absolute", left: "8vw", top: "1vh" }}>Add College</h2>
                </div>

                <form onSubmit={handleAddCollege}>
                  <label style={{ color: "#2E3070", fontWeight: "bold", position: "absolute", left: "37vw", top: "32.5vh" }}>College Code:</label>
                  <input className="addid" type="text" value={newCollege.collegecode} onChange={(e) => setNewCollege({ ...newCollege, collegecode: e.target.value })} />

                  <br />
                  <label style={{ color: "#2E3070", fontWeight: "bold", position: "absolute", left: "37vw", top: "40.5vh" }}>College Name:</label>
                  <input className="addfirst" type="text" value={newCollege.collegename} onChange={(e) => setNewCollege({ ...newCollege, collegename: e.target.value })} />

                  <br />
                  <button type="button" className="addsub" onClick={()=>{setShowAddConfirm(true)}}>Save</button>
                  <button type="button" className="canceladd" onClick={() => { setShowAddForm(false); setNewCollege({ collegecode: "", collegename: "" }); }}>Cancel</button>
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

          {/* Footer */}
          <div className="bottombar">
            <span className="informationtext">InformationSystem</span>
            <span className="copyright">Copyright © Sealtux</span>
            <span className="terms">Terms of Service</span>
          </div>
        </>
      )}
       {showAddConfirm && (
  <div className="confirm-modal-overlay">
    <div className="confirm-modal-content">
      <h3 style={{ color: "#2E3070" }}>Add College</h3>
      <h5 style={{ color: "#2E3070" }}>Are you sure you want to add this College?</h5>

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
{showEditConfirm && (
  <div className="confirm-modal-overlay">
    <div className="confirm-modal-content">
      <h3 style={{ color: "#2E3070" }}>Edit College</h3>
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

    </div>
  );
}

export default College;
