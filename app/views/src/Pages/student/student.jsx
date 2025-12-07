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

// =========================
// Image upload restrictions
// =========================
const MAX_IMAGE_SIZE_MB = 2;
const MAX_IMAGE_SIZE_BYTES = MAX_IMAGE_SIZE_MB * 1024 * 1024;

const validateImageFile = (file) => {
  if (!file) return false;

  // type check
  if (!file.type || !file.type.startsWith("image/")) {
    alert("Image upload only accepts image files.");
    return false;
  }

  // size check
  if (file.size > MAX_IMAGE_SIZE_BYTES) {
    alert(
      `Image upload has a file size limit of ${MAX_IMAGE_SIZE_MB} MB. Please choose a smaller image.`
    );
    return false;
  }

  return true;
};

function Student() {
  const [students, setStudents] = useState([]);
  const [originalStudents, setOriginalStudents] = useState([]);
  const [allStudents, setAllStudents] = useState([]); // full list for validation
  const [selectedRow, setSelectedRow] = useState(null);
  const [showSortMenu, setShowSortMenu] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [loading, setLoading] = useState(true);
  const tableRef = useRef(null);
  const fileInputRef = useRef(null); // for Edit Profile in modal
  const [programs, setPrograms] = useState([]);
  const [showAddConfirm, setShowAddConfirm] = useState(false);
  const [showEditConfirm, setShowEditConfirm] = useState(false);
  const [activeSort, setActiveSort] = useState(null);

  // profile modal state
  const [showProfileModal, setShowProfileModal] = useState(false);
  const [showProfilePicDeleteConfirm, setShowProfilePicDeleteConfirm] =
    useState(false);
  const [showProfileCloseConfirm, setShowProfileCloseConfirm] = useState(false);

  // draft profile picture state (unsaved changes)
  const [profileDraftFile, setProfileDraftFile] = useState(null);
  const [profileDraftPreviewUrl, setProfileDraftPreviewUrl] = useState(null);
  const [profileDraftDeleted, setProfileDraftDeleted] = useState(false);

  // Pagination (backend-driven)
  const [page, setPage] = useState(1);
  const [hasNext, setHasNext] = useState(false);

  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [deleteMessage, setDeleteMessage] = useState("");

  // Edit feature states
  const [showEditForm, setShowEditForm] = useState(false);
  const [editStudent, setEditStudent] = useState({
    IdNumber: "",
    FirstName: "",
    LastName: "",
    YearLevel: "",
    Gender: "",
    ProgramCode: "",
    profile_url: "",
    profilePictureFile: null,
  });

  // add form states
  const [showAddForm, setShowAddForm] = useState(false);
  const [newStudent, setNewStudent] = useState({
    IdNumber: "",
    FirstName: "",
    LastName: "",
    YearLevel: "",
    Gender: "",
    ProgramCode: "",
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

  // Fetch paginated students from backend (current page)
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

  // Fetch ALL students (for validation, independent of search/pagination)
  const fetchAllStudents = async () => {
    try {
      const res = await fetch("http://127.0.0.1:5000/students/all");
      const data = await res.json();
      setAllStudents(data.students || data || []);
    } catch (err) {
      console.error("Error fetching all students:", err);
    }
  };

  // initial load: current page + all students + programs
  useEffect(() => {
    fetchStudents(1);
    fetchAllStudents();

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
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Pagination handlers
  const handleNext = () => {
    if (!hasNext) return;

    if (searchTerm.trim() !== "") {
      handleSearchSubmit(null, page + 1);
      return;
    }

    if (activeSort) {
      fetch(
        `http://127.0.0.1:5000/students/sort?key=${activeSort}&page=${
          page + 1
        }`
      )
        .then((res) => res.json())
        .then((data) => {
          setStudents(data.students || []);
          setHasNext(data.has_next || false);
          setPage(page + 1);
        });
      return;
    }

    fetchStudents(page + 1);
  };

  const handlePrev = () => {
    if (page <= 1) return;

    if (searchTerm.trim() !== "") {
      handleSearchSubmit(null, page - 1);
      return;
    }

    if (activeSort) {
      fetch(
        `http://127.0.0.1:5000/students/sort?key=${activeSort}&page=${
          page - 1
        }`
      )
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

  // Sorting
  const handleSort = (key) => {
    setActiveSort(key === "default" ? null : key);

    if (key === "default") {
      fetchStudents(1);
      setShowSortMenu(false);
      return;
    }

    setStudents([]);
    setLoading(true);

    fetch(
      `http://127.0.0.1:5000/students/sort?key=${encodeURIComponent(
        key
      )}&page=1`
    )
      .then((res) => res.json())
      .then((data) => {
        const arr = Array.isArray(data) ? data : data.students || [];
        requestAnimationFrame(() => {
          setStudents(arr);
          setHasNext(data.has_next || false);
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
      fetchStudents(pageNum);
      return;
    }

    setLoading(true);

    try {
      const res = await fetch(
        `http://127.0.0.1:5000/students/search?q=${encodeURIComponent(
          query
        )}&page=${pageNum}`
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

  // Delete student
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

      await fetchStudents(page);
      await fetchAllStudents(); // keep validation list in sync

      setSelectedRow(null);
      setShowDeleteConfirm(false);
      setShowProfileModal(false);

      alert("Student deleted successfully!");
    } catch (err) {
      console.error(err);
      setDeleteMessage("Failed to delete student.");
    }
  };

  // Edit student info
  const [originalIdNumber, setOriginalIdNumber] = useState("");

  const handleEdit = () => {
    if (!selectedRow) return;

    setOriginalIdNumber(selectedRow.IdNumber);
    setEditStudent({ ...selectedRow, profilePictureFile: null });
    setShowEditForm(true);
  };

  const handleEditSave = async (e) => {
    e.preventDefault();

    let imageUrl = editStudent.profile_url;

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

    // validate against ALL students (not only current page / search)
    if (!validateStudentEdit(editStudent, allStudents, originalIdNumber))
      return;

    try {
      const res = await fetch(
        `http://127.0.0.1:5000/students/${originalIdNumber}`,
        {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            ...editStudent,
            profile_url: imageUrl,
          }),
        }
      );

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Update failed");

      alert("Student updated successfully!");
      await fetchStudents(page);
      await fetchAllStudents(); // refresh global list
      setShowEditForm(false);
      setSelectedRow(null);
    } catch (err) {
      alert(err.message);
    }
  };

  // =======================
  // Image input handlers
  // =======================

  // Edit form file input
  const handleEditProfileFileChange = (e) => {
    const file = e.target.files[0];
    if (!file) return;

    if (!validateImageFile(file)) {
      e.target.value = "";
      return;
    }

    setEditStudent((prev) => ({
      ...prev,
      profilePictureFile: file,
    }));
  };

  // Add form file input
  const handleNewProfileFileChange = (e) => {
    const file = e.target.files[0];
    if (!file) return;

    if (!validateImageFile(file)) {
      e.target.value = "";
      return;
    }

    setNewStudent((prev) => ({
      ...prev,
      profilePictureFile: file,
    }));
  };

  // Change profile picture from profile modal (DRAFT ONLY, no save yet)
  const handleProfileImageUpload = (e) => {
    const file = e.target.files[0];
    if (!file || !selectedRow) return;

    if (!validateImageFile(file)) {
      e.target.value = "";
      if (fileInputRef.current) fileInputRef.current.value = "";
      return;
    }

    setProfileDraftFile(file);
    setProfileDraftPreviewUrl(URL.createObjectURL(file));
    setProfileDraftDeleted(false);
  };

  // Validation & Add (used for both Add and Edit)
  const validateStudent = (student, existingStudents) => {
    const idPattern = /^\d{4}-\d{4}$/;

    for (const [key, value] of Object.entries(student)) {
      if (
        key !== "profile_url" &&
        key !== "profilePictureFile" &&
        !String(value).trim()
      ) {
        alert(`${key} is required`);
        return false;
      }
    }

    if (!idPattern.test(student.IdNumber)) {
      alert("ID Number must be in format YYYY-NNNN (e.g., 2020-0001)");
      return false;
    }

    const year = parseInt(student.IdNumber.split("-")[0], 10);
    if (isNaN(year) || year < 2020) {
      alert("Year must be 2020 or later");
      return false;
    }

    if (
      /^0000-\d{4}$/.test(student.IdNumber) ||
      /^\d{4}-0000$/.test(student.IdNumber)
    ) {
      alert(
        "ID Number cannot contain all zeros in either part (e.g., 0000-0000 or 2022-0000)."
      );
      return false;
    }

    const duplicateId = existingStudents.find(
      (s) => s.IdNumber === student.IdNumber
    );

    if (duplicateId) {
      alert("A student with this ID Number already exists.");
      return false;
    }

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

  // Validate edit: reuse validateStudent but ignore the original record
  const validateStudentEdit = (student, existingStudents, originalId) => {
    const others = existingStudents.filter((s) => s.IdNumber !== originalId);
    return validateStudent(student, others);
  };

  const handleAddStudent = async (e) => {
    e.preventDefault();

    // use allStudents so search/pagination doesn't affect validation
    if (!validateStudent(newStudent, allStudents)) return;

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

      const { data: urlData } = supabase.storage
        .from("student-images")
        .getPublicUrl(`profiles/${fileName}`);

      imageUrl = urlData.publicUrl;
    }

    const payload = {
      ...newStudent,
      profile_url: imageUrl,
    };

    delete payload.profilePictureFile;

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
          profile_url: null,
          profilePictureFile: null,
        });

        await fetchStudents(page);
        await fetchAllStudents(); // update full list for future validations
      } else {
        alert(`Error: ${data.error}`);
      }
    } catch (err) {
      console.error(err);
      alert("Error adding student.");
    }
  };

  // Actually save profile picture to Supabase + backend
  const saveProfileChanges = async () => {
    if (!selectedRow || !profileDraftFile) return;

    try {
      const fileName = `${selectedRow.IdNumber}_${Date.now()}.jpg`;

      const { data, error } = await supabase.storage
        .from("student-images")
        .upload(`profiles/${fileName}`, profileDraftFile, { upsert: true });

      if (error) {
        console.error(error);
        alert("Image upload failed!");
        return;
      }

      const { data: urlData } = supabase.storage
        .from("student-images")
        .getPublicUrl(`profiles/${fileName}`);

      const imageUrl = urlData.publicUrl;

      const res = await fetch(
        `http://127.0.0.1:5000/students/${selectedRow.IdNumber}`,
        {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            ...selectedRow,
            profile_url: imageUrl,
          }),
        }
      );

      const resp = await res.json();
      if (!res.ok) throw new Error(resp.error || "Failed to update profile");

      // update UI
      setStudents((prev) =>
        prev.map((s) =>
          s.IdNumber === selectedRow.IdNumber
            ? { ...s, profile_url: imageUrl }
            : s
        )
      );
      setSelectedRow((prev) =>
        prev ? { ...prev, profile_url: imageUrl } : prev
      );

      alert("Profile picture updated!");

      // clear draft
      setProfileDraftFile(null);
      setProfileDraftPreviewUrl(null);
      setProfileDraftDeleted(false);
      if (fileInputRef.current) fileInputRef.current.value = "";
    } catch (err) {
      console.error(err);
      alert(err.message);
    }
  };

  // Remove profile picture → use default (used when committing delete)
  const handleRemoveProfilePicture = async () => {
    if (!selectedRow) return;

    try {
      const res = await fetch(
        `http://127.0.0.1:5000/students/${selectedRow.IdNumber}`,
        {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            ...selectedRow,
            profile_url: null,
          }),
        }
      );

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to remove picture");

      setStudents((prev) =>
        prev.map((s) =>
          s.IdNumber === selectedRow.IdNumber ? { ...s, profile_url: null } : s
        )
      );
      setSelectedRow((prev) =>
        prev ? { ...prev, profile_url: null } : prev
      );

      // also clear any draft
      setProfileDraftFile(null);
      setProfileDraftPreviewUrl(null);
      setProfileDraftDeleted(false);
      if (fileInputRef.current) fileInputRef.current.value = "";

      alert("Profile picture reset to default.");
    } catch (err) {
      console.error(err);
      alert(err.message);
    }
  };

  // Commit draft changes (upload OR delete) when user confirms on close
  const commitProfileChanges = async () => {
    if (!selectedRow) return;

    if (profileDraftDeleted && !profileDraftFile) {
      // delete only
      await handleRemoveProfilePicture();
    } else if (profileDraftFile) {
      // uploaded new image
      await saveProfileChanges();
    }

    // ensure draft cleared
    setProfileDraftFile(null);
    setProfileDraftPreviewUrl(null);
    setProfileDraftDeleted(false);
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  // Handle closing profile modal (X or Close)
  const handleProfileModalClose = () => {
    // if there are unsaved changes, show confirm
    if (profileDraftFile || profileDraftDeleted) {
      setShowProfileCloseConfirm(true);
    } else {
      setShowProfileModal(false);
      setProfileDraftFile(null);
      setProfileDraftPreviewUrl(null);
      setProfileDraftDeleted(false);
      if (fileInputRef.current) fileInputRef.current.value = "";
    }
  };

  // current image shown in profile modal (preview if draft, else saved)
  const currentProfileImage = profileDraftDeleted
    ? defprofile
    : profileDraftPreviewUrl || selectedRow?.profile_url || defprofile;

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
              style={{
                color: "#2E3070",
                borderSpacing: "0",
                width: "100%",
                tableLayout: "fixed",
              }}
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
                      {/* Profile cell: click to open profile modal */}
                      <td
                        onClick={(e) => {
                          e.stopPropagation();
                          setSelectedRow(student);
                          // reset draft state when opening
                          setProfileDraftFile(null);
                          setProfileDraftPreviewUrl(null);
                          setProfileDraftDeleted(false);
                          if (fileInputRef.current)
                            fileInputRef.current.value = "";
                          setShowProfileModal(true);
                        }}
                        style={{ cursor: "pointer" }}
                      >
                        {student.profile_url ? (
                          <img
                            src={student.profile_url}
                            alt="Profile"
                            style={{
                              width: "49px",
                              height: "43px",
                              borderRadius: "50%",
                              objectFit: "cover",
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
                              objectFit: "cover",
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

                {Array.from({ length: Math.max(0, 4 - students.length) }).map(
                  (_, i) => (
                    <tr key={`filler-${i}`} className="filler-row">
                      <td colSpan="7">&nbsp;</td>
                    </tr>
                  )
                )}
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

            {/* Pagination controls */}
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
              <button
                className="deletebut"
                onClick={handleDelete}
                disabled={!selectedRow}
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
                  onClick={(e) => e.stopPropagation()}
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

          {/* EDIT MODAL */}
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
                      setEditStudent({
                        ...editStudent,
                        IdNumber: e.target.value,
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
                    First Name:
                  </label>

                  <input
                    placeholder="Juan"
                    className="addfirst"
                    type="text"
                    value={editStudent.FirstName}
                    onChange={(e) =>
                      setEditStudent({
                        ...editStudent,
                        FirstName: e.target.value,
                      })
                    }
                  />

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
                      setEditStudent({
                        ...editStudent,
                        LastName: e.target.value,
                      })
                    }
                  />

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
                      setEditStudent({
                        ...editStudent,
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
                      setEditStudent({
                        ...editStudent,
                        Gender: e.target.value,
                      })
                    }
                  >
                    <option value="">Gender</option>
                    <option value="Male">Male</option>
                    <option value="Female">Female</option>
                  </select>

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
                      setEditStudent({
                        ...editStudent,
                        ProgramCode: e.target.value,
                      })
                    }
                  >
                    <option value="">--Select Program--</option>
                    {programs.map((prog) => (
                      <option key={prog.programcode} value={prog.programcode}>
                        {prog.programcode}
                      </option>
                    ))}
                  </select>

                  <img
                    src={
                      editStudent.profile_url ? editStudent.profile_url : defprofile
                    }
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

                  <input
                    type="file"
                    accept="image/*"
                    onChange={handleEditProfileFileChange}
                    style={{
                      position: "absolute",
                      left: "48vw",
                      top: "66vh",
                    }}
                  />
                  <small
                    style={{
                      position: "absolute",
                      left: "44vw",
                      top: "69vh",
                      fontSize: "11px",
                      color: "#2E3070",
                    }}
                  >
                    Image upload has a {MAX_IMAGE_SIZE_MB}MB limit and only accepts
                    images.
                  </small>

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
                    }}
                  >
                    Cancel
                  </button>
                </form>
              </div>
            </div>
          )}

          {/* ADD MODAL */}
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
                      zIndex: "3",
                    }}
                  >
                    Profile Picture:
                  </label>

                  <input
                    type="file"
                    accept="image/*"
                    onChange={handleNewProfileFileChange}
                    style={{
                      position: "absolute",
                      left: "48vw",
                      top: "66vh",
                      width: "45vh",
                      height: "45vh",
                    }}
                  />
                  <small
                    style={{
                      position: "absolute",
                      left: "44vw",
                      top: "69vh",
                      fontSize: "11px",
                      color: "#2E3070",
                    }}
                  >
                    Image upload has a {MAX_IMAGE_SIZE_MB}MB limit and only accepts
                    images.
                  </small>

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
                      setNewStudent({
                        ...newStudent,
                        IdNumber: e.target.value,
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
                      setNewStudent({
                        ...newStudent,
                        ProgramCode: e.target.value,
                      })
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
                      setShowAddForm(false);
                      setNewStudent({
                        IdNumber: "",
                        FirstName: "",
                        LastName: "",
                        YearLevel: "",
                        Gender: "",
                        ProgramCode: "",
                        profile_url: null,
                        profilePictureFile: null,
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

          {/* Delete Confirmation Modal */}
          {showDeleteConfirm && (
            <div className="confirm-modal-overlay">
              <div className="confirm-modal-content">
                <h3 style={{ color: "#2E3070" }}>Delete Student</h3>
                <p style={{ color: "#2E3070" }}>{deleteMessage}</p>
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

          {/* Add Confirmation Modal */}
          {showAddConfirm && (
            <div className="confirm-modal-overlay">
              <div className="confirm-modal-content">
                <h3 style={{ color: "#2E3070" }}>Add Student</h3>
                <h5 style={{ color: "#2E3070" }}>
                  Are you sure you want to add this student?
                </h5>

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

          {/* Edit Confirmation Modal */}
          {showEditConfirm && (
            <div className="confirm-modal-overlay">
              <div className="confirm-modal-content">
                <h3 style={{ color: "#2E3070" }}>Edit Student</h3>
                <h5 style={{ color: "#2E3070" }}>
                  Are you sure you want to save changes?
                </h5>

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

          {/* Profile Picture Delete Confirmation Modal */}
          {showProfilePicDeleteConfirm && (
            <div className="confirm-modal-overlay">
              <div className="confirm-modal-content">
                <h3 style={{ color: "#2E3070" }}>Remove Profile Picture</h3>
                <h5 style={{ color: "#2E3070" }}>
                  Are you sure you want to reset this profile picture to the
                  default image?
                </h5>

                <div className="confirm-modal-buttons">
                  <button
                    type="button"
                    className="yes-btn"
                    style={{ backgroundColor: "#2E3070" }}
                    onClick={() => {
                      // just mark as draft delete, keep modal open
                      setShowProfilePicDeleteConfirm(false);
                      setProfileDraftFile(null);
                      setProfileDraftPreviewUrl(null);
                      setProfileDraftDeleted(true);
                      if (fileInputRef.current)
                        fileInputRef.current.value = "";
                    }}
                  >
                    Yes
                  </button>
                  <button
                    type="button"
                    className="no-btn"
                    onClick={() => setShowProfilePicDeleteConfirm(false)}
                  >
                    No
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* Profile Close Confirmation (X or Close with unsaved changes) */}
          {showProfileCloseConfirm && (
            <div className="confirm-modal-overlay">
              <div className="confirm-modal-content">
                <h3 style={{ color: "#2E3070" }}>Unsaved Changes</h3>
                <h5 style={{ color: "#2E3070" }}>
                  Are you sure you want to save these changes before closing?
                </h5>

                <div className="confirm-modal-buttons">
                  {/* YES = keep changes → save (upload/delete) */}
                  <button
                    type="button"
                    className="yes-btn"
                    style={{ backgroundColor: "#2E3070" }}
                    onClick={async () => {
                      setShowProfileCloseConfirm(false);
                      await commitProfileChanges();
                      setShowProfileModal(false);
                    }}
                  >
                    Yes
                  </button>
                  {/* NO = discard changes */}
                  <button
                    type="button"
                    className="no-btn"
                    onClick={() => {
                      setShowProfileCloseConfirm(false);
                      setProfileDraftFile(null);
                      setProfileDraftPreviewUrl(null);
                      setProfileDraftDeleted(false);
                      if (fileInputRef.current)
                        fileInputRef.current.value = "";
                      setShowProfileModal(false);
                    }}
                  >
                    No
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* Profile Modal with inline styles & image edit/delete */}
          {showProfileModal && selectedRow && (
            <div className="modal-overlay">
              <div
                className="modal-content"
                style={{
                  width: "420px",
                  maxWidth: "90vw",
                  maxHeight: "30vh",
                  overflowY: "auto",
                  position: "relative",
                  padding: "24px",
                  color: "#2E3070",
                }}
              >
                <button
                  type="button"
                  onClick={handleProfileModalClose}
                  style={{
                    position: "absolute",
                    top: "-15px",
                    right: "-20px",
                    border: "none",
                    background: "transparent",
                    fontSize: "30px",
                    cursor: "pointer",
                    color: "#2E3070",
                  }}
                >
                  ×
                </button>

                {/* Header: photo + name + ID */}
                <div
                  style={{
                    display: "flex",
                    alignItems: "center",
                    marginTop: "16px",
                    gap: "16px",
                  }}
                >
                  <img
                    src={currentProfileImage}
                    alt="Profile"
                    style={{
                      width: "80px",
                      height: "80px",
                      borderRadius: "50%",
                      objectFit: "cover",
                    }}
                  />
                  <div>
                    <h2 style={{ margin: 0 }}>
                      {selectedRow.FirstName} {selectedRow.LastName}
                    </h2>
                    <p style={{ margin: "4px 0" }}>
                      ID: {selectedRow.IdNumber}
                    </p>
                  </div>
                </div>

                {/* Details */}
                <div style={{ marginTop: "16px" }}>
                  <div
                    style={{
                      display: "flex",
                      justifyContent: "space-between",
                      padding: "4px 0",
                    }}
                  >
                    <span style={{ fontWeight: "bold" }}>Year Level</span>
                    <span>{selectedRow.YearLevel}</span>
                  </div>
                  <div
                    style={{
                      display: "flex",
                      justifyContent: "space-between",
                      padding: "4px 0",
                    }}
                  >
                    <span style={{ fontWeight: "bold" }}>Gender</span>
                    <span>{selectedRow.Gender}</span>
                  </div>
                  <div
                    style={{
                      display: "flex",
                      justifyContent: "space-between",
                      padding: "4px 0",
                    }}
                  >
                    <span style={{ fontWeight: "bold" }}>Program Code</span>
                    <span>{selectedRow.ProgramCode}</span>
                  </div>
                </div>

                {/* hidden file input for Edit Profile */}
                <input
                  type="file"
                  accept="image/*"
                  ref={fileInputRef}
                  style={{ display: "none" }}
                  onChange={handleProfileImageUpload}
                />

                {/* Action buttons */}
                <div
                  style={{
                    marginTop: "20px",
                    display: "flex",
                    justifyContent: "flex-end",
                    gap: "8px",
                  }}
                >
                  <button
                    type="button"
                    onClick={() => {
                      setShowProfilePicDeleteConfirm(true);
                    }}
                    style={{
                      border: "none",
                      borderRadius: "6px",
                      padding: "6px 12px",
                      fontSize: "14px",
                      cursor: "pointer",
                      backgroundColor: "#d9534f",
                      color: "#fff",
                    }}
                  >
                    Delete Profile
                  </button>

                  <button
                    type="button"
                    onClick={() => {
                      if (fileInputRef.current) fileInputRef.current.click();
                    }}
                    style={{
                      border: "none",
                      borderRadius: "6px",
                      padding: "6px 12px",
                      fontSize: "14px",
                      cursor: "pointer",
                      backgroundColor: "#4956ad",
                      color: "#fff",
                    }}
                  >
                    Edit Profile
                  </button>
                </div>

                <small
                  style={{
                    display: "block",
                    marginTop: "21px",
                    fontSize: "11px",
                    position:"absolute"
                  }}
                >
                  Image upload has a {MAX_IMAGE_SIZE_MB}MB limit and only accepts
                  images.
                </small>
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
