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


const MAX_IMAGE_SIZE_MB = 2;
const MAX_IMAGE_SIZE_BYTES = MAX_IMAGE_SIZE_MB * 1024 * 1024;






function Student() {

const validateImageFile = (file) => {
  if (!file) return false;

  if (!file.type || !file.type.startsWith("image/")) {
    showNotification(
      "Invalid File",
      "Image upload only accepts image files.",
      "warning"
    );

    return false;
  }

  if (file.size > MAX_IMAGE_SIZE_BYTES) {
    showNotification(
      "File Too Large",
      `The image must not exceed ${MAX_IMAGE_SIZE_MB} MB.`,
      "warning"
    );

    return false;
  }

  return true;
};

  const [notification, setNotification] = useState({
  show: false,
  title: "",
  message: "",
  type: "success",
});
  const [students, setStudents] = useState([]);
  const [originalStudents, setOriginalStudents] = useState([]);
  const [allStudents, setAllStudents] = useState([]); // full list for validation
  const [selectedRow, setSelectedRow] = useState(null);

  const [searchTerm, setSearchTerm] = useState("");
  const [loading, setLoading] = useState(true);
  const tableRef = useRef(null);
  const fileInputRef = useRef(null); // for Edit Profile in modal
  const [programs, setPrograms] = useState([]);
  const [showAddConfirm, setShowAddConfirm] = useState(false);
  const [showEditConfirm, setShowEditConfirm] = useState(false);
 
const [filterYearLevel, setFilterYearLevel] = useState("");
const [filterGender, setFilterGender] = useState("");
const [filterProgram, setFilterProgram] = useState("");
const hasActiveFilters =
  filterYearLevel !== "" || filterGender !== "" || filterProgram !== "";
  const [showFilterModal, setShowFilterModal] = useState(false);


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

  


const [activeSort, setActiveSort] = useState(null);
const [sortDirection, setSortDirection] = useState(null);

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

  const showNotification = (
  title,
  message,
  type = "success"
) => {
  setNotification({
    show: true,
    title,
    message,
    type,
  });
};

const closeNotification = () => {
  setNotification({
    show: false,
    title: "",
    message: "",
    type: "success",
  });
};

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
    const response = await fetch(
      `http://127.0.0.1:5000/students/page/${pageNum}`
    );

    if (!response.ok) {
      throw new Error("Failed to fetch students.");
    }

    const data = await response.json();
    const fetchedStudents = data.students || [];

    setStudents(fetchedStudents);
    setOriginalStudents(fetchedStudents);
    setHasNext(data.has_next || false);
    setPage(pageNum);
  } catch (error) {
    console.error("Error fetching students:", error);
  } finally {
    setLoading(false);
  }
};

const fetchFilteredStudents = async (
  pageNum = 1,
  queryOverride = null,
  sortKeyOverride = activeSort,
  directionOverride = sortDirection
) => {
  const query =
    queryOverride !== null
      ? queryOverride
      : searchTerm.trim();

  setLoading(true);

  try {
    const params = new URLSearchParams();

    params.append("page", pageNum);

    if (query) {
      params.append("q", query);
    }

    if (filterYearLevel) {
      params.append("yearlevel", filterYearLevel);
    }

    if (filterGender) {
      params.append("gender", filterGender);
    }

    if (filterProgram) {
      params.append("programcode", filterProgram);
    }

    if (sortKeyOverride && directionOverride) {
      params.append("sortkey", sortKeyOverride);
      params.append("direction", directionOverride);
    }

    const response = await fetch(
      `http://127.0.0.1:5000/students/filter?${params.toString()}`
    );

    if (!response.ok) {
      throw new Error("Failed to search students.");
    }

    const data = await response.json();
    const fetchedStudents = data.students || [];

    setStudents(fetchedStudents);
    setOriginalStudents(fetchedStudents);
    setPage(pageNum);
    setHasNext(data.has_next || false);
  } catch (error) {
    console.error("Filter/search error:", error);

    showNotification(
      "Search Failed",
      error.message || "The students could not be searched.",
      "error"
    );
  } finally {
    setLoading(false);
  }
};

const applyFilters = (pageNum = 1) => {
  // Use the unified search/filter/sort handler
  handleSearchSubmit(null, pageNum);
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

  const fetchSortedStudents = async (
  pageNum = 1,
  key = activeSort,
  direction = sortDirection
) => {
  if (!key || !direction) {
    fetchStudents(pageNum);
    return;
  }

  setLoading(true);

  try {
    const params = new URLSearchParams();

    params.append("page", pageNum);
    params.append("key", key);
    params.append("direction", direction);

    const response = await fetch(
      `http://127.0.0.1:5000/students/sort?${params.toString()}`
    );

    if (!response.ok) {
      throw new Error("Failed to sort students.");
    }

    const data = await response.json();
    const fetchedStudents = data.students || [];

    setStudents(fetchedStudents);
    setOriginalStudents(fetchedStudents);
    setHasNext(data.has_next || false);
    setPage(pageNum);
  } catch (error) {
    console.error("Sorting error:", error);

    showNotification(
      "Sorting Failed",
      error.message || "The students could not be sorted.",
      "error"
    );
  } finally {
    setLoading(false);
  }
};

  
  // Pagination handlers
const handleNext = () => {
  if (!hasNext) return;

  const nextPage = page + 1;
  const query = searchTerm.trim();

  if (hasActiveFilters || query !== "") {
    fetchFilteredStudents(
      nextPage,
      query,
      activeSort,
      sortDirection
    );

    return;
  }

  if (activeSort && sortDirection) {
    fetchSortedStudents(
      nextPage,
      activeSort,
      sortDirection
    );

    return;
  }

  fetchStudents(nextPage);
};

const handlePrev = () => {
  if (page <= 1) return;

  const previousPage = page - 1;
  const query = searchTerm.trim();

  if (hasActiveFilters || query !== "") {
    fetchFilteredStudents(
      previousPage,
      query,
      activeSort,
      sortDirection
    );

    return;
  }

  if (activeSort && sortDirection) {
    fetchSortedStudents(
      previousPage,
      activeSort,
      sortDirection
    );

    return;
  }

  fetchStudents(previousPage);
};

const handleSort = (key) => {
  const query = searchTerm.trim();

  let newDirection;

  // First click: ascending
  if (activeSort !== key) {
    newDirection = "asc";
  }

  // Second click: descending
  else if (sortDirection === "asc") {
    newDirection = "desc";
  }

  // Third click: default
  else {
    setActiveSort(null);
    setSortDirection(null);

    if (hasActiveFilters || query !== "") {
      fetchFilteredStudents(
        1,
        query,
        null,
        null
      );
    } else {
      fetchStudents(1);
    }

    return;
  }

  setActiveSort(key);
  setSortDirection(newDirection);

  if (hasActiveFilters || query !== "") {
    fetchFilteredStudents(
      1,
      query,
      key,
      newDirection
    );

    return;
  }

  fetchSortedStudents(
    1,
    key,
    newDirection
  );
};

const getSortArrow = (key) => {
  let arrow = "▲▼";

  if (activeSort === key) {
    arrow = sortDirection === "asc" ? "▲" : "▼";
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

const handleSearchSubmit = (e, pageNum = 1) => {
  if (e) {
    e.preventDefault();
  }

  const query = searchTerm.trim();

  if (query !== "" || hasActiveFilters) {
    fetchFilteredStudents(
      pageNum,
      query,
      activeSort,
      sortDirection
    );

    return;
  }

  if (activeSort && sortDirection) {
    fetchSortedStudents(
      pageNum,
      activeSort,
      sortDirection
    );

    return;
  }

  fetchStudents(pageNum);
};

  // Delete student
 const handleDelete = (student = selectedRow) => {
  if (!student) {
    setDeleteMessage("⚠️ Please select a student to delete.");
    setShowDeleteConfirm(true);
    return;
  }

  setSelectedRow(student);

  setDeleteMessage(
    `Are you sure you want to delete student ${student.IdNumber}?`
  );

  setShowDeleteConfirm(true);
};

const confirmDelete = async (e) => {
  if (e) e.preventDefault();

  try {
    const student = selectedRow;
    const id = student?.IdNumber;

    if (!student || !id) return;

    // Extract the actual Supabase file path from profile_url
    let filePath = null;

    if (
      student.profile_url &&
      student.profile_url.includes(
        "cgsuyduqaiwngxhjpklt.supabase.co/storage/v1/object/public/student-images/"
      )
    ) {
      const cleanUrl = student.profile_url.split("?")[0];
      filePath = cleanUrl.split("/student-images/")[1];
    }

    // Delete the actual image from Supabase
    if (filePath) {
      const { data: deletedFiles, error: storageError } =
        await supabase.storage
          .from("student-images")
          .remove([filePath]);

     if (storageError) {
  console.error("SUPABASE DELETE ERROR:", storageError);

  setShowDeleteConfirm(false);

  showNotification(
    "Image Delete Failed",
    storageError.message ||
      "The profile image could not be deleted.",
    "error"
  );

  return;
}

      console.log("Deleted Supabase files:", deletedFiles);
    }

    // Delete student from PostgreSQL
    const response = await fetch(
      `http://127.0.0.1:5000/students/${id}`,
      {
        method: "DELETE",
        headers: {
          "Content-Type": "application/json",
        },
      }
    );

    const responseText = await response.text();

    let data = {};

    try {
      data = responseText ? JSON.parse(responseText) : {};
    } catch {
      throw new Error("The backend returned an invalid response.");
    }

    if (!response.ok) {
      throw new Error(data.error || "Failed to delete student.");
    }

    setStudents((prev) =>
      prev.filter((student) => student.IdNumber !== id)
    );

    setAllStudents((prev) =>
      prev.filter((student) => student.IdNumber !== id)
    );

    setSelectedRow(null);
    setShowDeleteConfirm(false);
    setShowProfileModal(false);

showNotification(
  "Student Deleted",
  "The student and profile image were deleted successfully.",
  "success"
);
} catch (error) {
  console.error("DELETE ERROR:", error);

  setShowDeleteConfirm(false);

  showNotification(
    "Delete Failed",
    error.message || "The student could not be deleted.",
    "error"
  );
}
};

  // Edit student info
  const [originalIdNumber, setOriginalIdNumber] = useState("");

 const handleEdit = (student = selectedRow) => {
  if (!student) return;

  setSelectedRow(student);
  setOriginalIdNumber(student.IdNumber);

  setEditStudent({
    ...student,
    profilePictureFile: null,
  });

  setShowEditForm(true);
};

const handleEditSave = async (e) => {
  e.preventDefault();

  // Validate before uploading anything
  if (!validateStudentEdit(editStudent, allStudents, originalIdNumber)) {
    return;
  }

  let imageUrl = editStudent.profile_url;
  let newFilePath = null;

  try {
    // Upload only when a new image was selected
    if (
      editStudent.profilePictureFile &&
      editStudent.profilePictureFile instanceof File
    ) {
      const file = editStudent.profilePictureFile;

      const extension =
        file.name.split(".").pop()?.toLowerCase() || "jpg";

      // Create a new Supabase object every time
      const fileName = `${editStudent.IdNumber}_${Date.now()}.${extension}`;
      newFilePath = `profiles/${fileName}`;

      const { error: uploadError } = await supabase.storage
        .from("student-images")
        .upload(newFilePath, file, {
          upsert: false,
          cacheControl: "3600",
          contentType: file.type,
        });

      if (uploadError) {
        console.error("UPLOAD ERROR:", uploadError);
        showNotification(
  "Upload Failed",
  uploadError.message || "The image could not be uploaded.",
  "error"
);

        return;
      }

      const { data: urlData } = supabase.storage
        .from("student-images")
        .getPublicUrl(newFilePath);

      imageUrl = urlData.publicUrl;
    }

    const oldImageUrl = editStudent.profile_url;

    // Update PostgreSQL through Flask
    const response = await fetch(
      `http://127.0.0.1:5000/students/${originalIdNumber}`,
      {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          IdNumber: editStudent.IdNumber,
          FirstName: editStudent.FirstName,
          LastName: editStudent.LastName,
          YearLevel: editStudent.YearLevel,
          Gender: editStudent.Gender,
          ProgramCode: editStudent.ProgramCode,
          profile_url: imageUrl,
        }),
      }
    );

    const responseText = await response.text();

    let data = {};

    try {
      data = responseText ? JSON.parse(responseText) : {};
    } catch {
      throw new Error("The backend returned an invalid response.");
    }

    if (!response.ok) {
      // Remove the newly uploaded image if database update failed
      if (newFilePath) {
        await supabase.storage
          .from("student-images")
          .remove([newFilePath]);
      }

      throw new Error(data.error || "Student update failed.");
    }

    const updatedStudent = {
      ...editStudent,
      profile_url: imageUrl,
      profilePictureFile: null,
    };

    // Update current page
    setStudents((previousStudents) =>
      previousStudents.map((student) =>
        student.IdNumber === originalIdNumber
          ? updatedStudent
          : student
      )
    );

    // Update validation list
    setAllStudents((previousStudents) =>
      previousStudents.map((student) =>
        student.IdNumber === originalIdNumber
          ? updatedStudent
          : student
      )
    );

    setSelectedRow(updatedStudent);

    // Remove the previous image from the current Supabase project
    if (
      newFilePath &&
      oldImageUrl &&
      oldImageUrl.includes(
        "cgsuyduqaiwngxhjpklt.supabase.co/storage/v1/object/public/student-images/"
      )
    ) {
      try {
        const cleanOldUrl = oldImageUrl.split("?")[0];
        const oldFilePath = cleanOldUrl.split("/student-images/")[1];

        if (oldFilePath && oldFilePath !== newFilePath) {
          const { error: removeError } = await supabase.storage
            .from("student-images")
            .remove([oldFilePath]);

          if (removeError) {
            console.warn("OLD IMAGE DELETE WARNING:", removeError);
          }
        }
      } catch (removeError) {
        console.warn("Could not delete the old image:", removeError);
      }
    }

    setEditStudent(updatedStudent);
    setShowEditForm(false);
    setShowEditConfirm(false);

  showNotification(
  "Update Successful",
  "The student information was updated successfully.",
  "success"
);

    await fetchStudents(page);
    await fetchAllStudents();
  } catch (error) {
    console.error("EDIT ERROR:", error);
    showNotification(
  "Update Failed",
  error.message || "The student could not be updated.",
  "error"
);
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
      showNotification(
        "Missing Information",
        `${key} is required.`,
        "warning"
      );
      return false;
    }
  }

  if (!idPattern.test(student.IdNumber)) {
    showNotification(
      "Invalid ID Number",
      "ID Number must use the format YYYY-NNNN, such as 2020-0001.",
      "warning"
    );
    return false;
  }

  const year = parseInt(student.IdNumber.split("-")[0], 10);

  if (isNaN(year) || year < 2020) {
    showNotification(
      "Invalid Year",
      "The ID Number year must be 2020 or later.",
      "warning"
    );
    return false;
  }

  if (
    /^0000-\d{4}$/.test(student.IdNumber) ||
    /^\d{4}-0000$/.test(student.IdNumber)
  ) {
    showNotification(
      "Invalid ID Number",
      "The ID Number cannot contain all zeros in either section.",
      "warning"
    );
    return false;
  }

  const duplicateId = existingStudents.find(
    (existingStudent) =>
      existingStudent.IdNumber === student.IdNumber
  );

  if (duplicateId) {
    showNotification(
      "Duplicate Student",
      "A student with this ID Number already exists.",
      "warning"
    );
    return false;
  }

  const duplicateName = existingStudents.find(
    (existingStudent) =>
      existingStudent.FirstName.toLowerCase() ===
        student.FirstName.toLowerCase() &&
      existingStudent.LastName.toLowerCase() ===
        student.LastName.toLowerCase()
  );

  if (duplicateName) {
    showNotification(
      "Duplicate Student",
      "A student with the same first and last name already exists.",
      "warning"
    );
    return false;
  }

  return true;
};

  const validateStudentEdit = (
  student,
  existingStudents,
  originalId
) => {
  const otherStudents = existingStudents.filter(
    (existingStudent) =>
      existingStudent.IdNumber !== originalId
  );

  return validateStudent(student, otherStudents);
};

const handleAddStudent = async (e) => {
  e.preventDefault();

  if (!validateStudent(newStudent, allStudents)) return;

  let imageUrl = null;

  if (newStudent.profilePictureFile) {
    const file = newStudent.profilePictureFile;

    // 🔥 FIX: one image per student
    const fileName = `${newStudent.IdNumber}.jpg`;

    const { error } = await supabase.storage
      .from("student-images")
      .upload(`profiles/${fileName}`, file, {
        upsert: true, // 🔥 overwrite if exists
      });

    if (error) {
  console.error(error);

  showNotification(
    "Upload Failed",
    error.message || "The student image could not be uploaded.",
    "error"
  );

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
      showNotification(
  "Student Added",
  "The new student was added successfully.",
  "success"
);
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
      await fetchAllStudents();
   } else {
  showNotification(
    "Add Failed",
    data.error || "The student could not be added.",
    "error"
  );
}
  } catch (err) {
    console.error(err);
    showNotification(
  "Add Failed",
  "An error occurred while adding the student.",
  "error"
);
  }
};

  // Actually save profile picture to Supabase + backend
const saveProfileChanges = async () => {
  if (!selectedRow || !profileDraftFile) return;

  try {
    const file = profileDraftFile;

    // Preserve the selected file's actual extension
    const extension = file.name.split(".").pop()?.toLowerCase() || "jpg";

    // New filename on every upload
    const fileName = `${selectedRow.IdNumber}_${Date.now()}.${extension}`;
    const filePath = `profiles/${fileName}`;

    // STEP 1: Upload as a completely new Supabase object
    const { error: uploadError } = await supabase.storage
      .from("student-images")
      .upload(filePath, file, {
        upsert: false,
        cacheControl: "3600",
        contentType: file.type,
      });

    if (uploadError) {
      console.error("UPLOAD ERROR:", uploadError);
      showNotification(
  "Upload Failed",
  uploadError.message || "The image could not be uploaded.",
  "error"
);
      return;
    }

    // STEP 2: Get the new public URL
    const { data: urlData } = supabase.storage
      .from("student-images")
      .getPublicUrl(filePath);

    const imageUrl = urlData.publicUrl;

    // Keep the previous URL so its old file can be removed afterward
    const oldImageUrl = selectedRow.profile_url;

    // STEP 3: Update PostgreSQL through Flask
    const response = await fetch(
      `http://127.0.0.1:5000/students/${selectedRow.IdNumber}`,
      {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          ...selectedRow,
          profile_url: imageUrl,
        }),
      }
    );

    const responseText = await response.text();

    let data = {};

    try {
      data = responseText ? JSON.parse(responseText) : {};
    } catch {
      throw new Error("The backend returned an invalid response.");
    }

    if (!response.ok) {
      throw new Error(data.error || "Failed to update student profile.");
    }

    // STEP 4: Update React state
    setSelectedRow((prev) =>
      prev
        ? {
            ...prev,
            profile_url: imageUrl,
          }
        : prev
    );

    setStudents((prev) =>
      prev.map((student) =>
        student.IdNumber === selectedRow.IdNumber
          ? {
              ...student,
              profile_url: imageUrl,
            }
          : student
      )
    );

    setAllStudents((prev) =>
      prev.map((student) =>
        student.IdNumber === selectedRow.IdNumber
          ? {
              ...student,
              profile_url: imageUrl,
            }
          : student
      )
    );

    // STEP 5: Remove the previous image from the current Supabase project
    if (
      oldImageUrl &&
      oldImageUrl.includes(
        "cgsuyduqaiwngxhjpklt.supabase.co/storage/v1/object/public/student-images/"
      )
    ) {
      try {
        const cleanOldUrl = oldImageUrl.split("?")[0];
        const marker = "/student-images/";
        const oldFilePath = cleanOldUrl.split(marker)[1];

        if (oldFilePath && oldFilePath !== filePath) {
          const { error: removeError } = await supabase.storage
            .from("student-images")
            .remove([oldFilePath]);

          if (removeError) {
            console.warn("OLD IMAGE DELETE WARNING:", removeError);
          }
        }
      } catch (deleteError) {
        console.warn("Could not remove the previous image:", deleteError);
      }
    }

    // STEP 6: Clear temporary states
    setProfileDraftFile(null);
    setProfileDraftPreviewUrl(null);
    setProfileDraftDeleted(false);

    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }

    showNotification(
  "Profile Updated",
  "The student's profile picture was updated successfully.",
  "success"
);
} catch (err) {
  console.error("PROFILE UPDATE ERROR:", err);

  showNotification(
    "Profile Update Failed",
    err.message || "The profile picture could not be updated.",
    "error"
  );
}
};  
const handleRemoveProfilePicture = async () => {
  if (!selectedRow) return;

  try {
    let filePath = null;

    if (
      selectedRow.profile_url &&
      selectedRow.profile_url.includes(
        "cgsuyduqaiwngxhjpklt.supabase.co/storage/v1/object/public/student-images/"
      )
    ) {
      const cleanUrl = selectedRow.profile_url.split("?")[0];
      filePath = cleanUrl.split("/student-images/")[1];
    }

    // Delete the image from Supabase
    if (filePath) {
      const { error: storageError } = await supabase.storage
        .from("student-images")
        .remove([filePath]);

      if (storageError) {
        console.error(
          "SUPABASE DELETE ERROR:",
          storageError
        );

        showNotification(
          "Image Delete Failed",
          storageError.message ||
            "The profile image could not be deleted.",
          "error"
        );

        return;
      }
    }

    // Set profile_url to null in PostgreSQL
    const response = await fetch(
      `http://127.0.0.1:5000/students/${selectedRow.IdNumber}`,
      {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          ...selectedRow,
          profile_url: null,
        }),
      }
    );

    const responseText = await response.text();

    let data = {};

    try {
      data = responseText
        ? JSON.parse(responseText)
        : {};
    } catch {
      throw new Error(
        "The backend returned an invalid response."
      );
    }

    if (!response.ok) {
      throw new Error(
        data.error || "Failed to update student."
      );
    }

    setStudents((previousStudents) =>
      previousStudents.map((student) =>
        student.IdNumber === selectedRow.IdNumber
          ? {
              ...student,
              profile_url: null,
            }
          : student
      )
    );

    setAllStudents((previousStudents) =>
      previousStudents.map((student) =>
        student.IdNumber === selectedRow.IdNumber
          ? {
              ...student,
              profile_url: null,
            }
          : student
      )
    );

    setSelectedRow((previousStudent) =>
      previousStudent
        ? {
            ...previousStudent,
            profile_url: null,
          }
        : previousStudent
    );

    showNotification(
      "Profile Removed",
      "The profile picture was removed successfully.",
      "success"
    );
  } catch (error) {
    console.error(
      "REMOVE PROFILE ERROR:",
      error
    );

    showNotification(
      "Profile Removal Failed",
      error.message ||
        "The profile picture could not be removed.",
      "error"
    );
  }
};

  // Commit draft changes (upload OR delete) when user confirms on close
 const commitProfileChanges = async () => {
  if (!selectedRow) return;

  if (profileDraftDeleted && !profileDraftFile) {
    await handleRemoveProfilePicture();
  } else if (profileDraftFile) {
    await saveProfileChanges();
  }

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

    <th
      onClick={() => handleSort("IdNumber")}
      style={{ cursor: "pointer", userSelect: "none" }}
    >
      ID Number{" "}
      {getSortArrow("IdNumber")}
    </th>

    <th
      onClick={() => handleSort("FirstName")}
      style={{ cursor: "pointer", userSelect: "none" }}
    >
      First Name{" "}
      {getSortArrow("FirstName")}
    </th>

    <th
      onClick={() => handleSort("LastName")}
      style={{ cursor: "pointer", userSelect: "none" }}
    >
      Last Name{" "}
    {getSortArrow("LastName")}
    </th>

    <th
      onClick={() => handleSort("YearLevel")}
      style={{ cursor: "pointer", userSelect: "none" }}
    >
      Year Level{" "}
     {getSortArrow("YearLevel")}
    </th>

    <th
      onClick={() => handleSort("Gender")}
      style={{ cursor: "pointer", userSelect: "none" }}
    >
      Gender{" "}
      {getSortArrow("Gender")}
    </th>

    <th
  onClick={() => handleSort("ProgramCode")}
  style={{
    cursor: "pointer",
    userSelect: "none",
    width: "160px",
    whiteSpace: "nowrap",
    overflow: "visible",
    textOverflow: "clip",
  }}
>
  Program Code{" "}
 {getSortArrow("ProgramCode")}
</th>

    <th style={{ width: "110px" }}>Actions</th>
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
        {/* Profile */}
        <td
          onClick={(e) => {
            e.stopPropagation();
            setSelectedRow(student);

            setProfileDraftFile(null);
            setProfileDraftPreviewUrl(null);
            setProfileDraftDeleted(false);

            if (fileInputRef.current) {
              fileInputRef.current.value = "";
            }

            setShowProfileModal(true);
          }}
          style={{ cursor: "pointer" }}
        >
          <img
            src={student.profile_url || defprofile}
            alt="Profile"
            style={{
              width: "49px",
              height: "43px",
              borderRadius: "50%",
              objectFit: "cover",
            }}
          />
        </td>

        <td>{student.IdNumber}</td>
        <td>{student.FirstName}</td>
        <td>{student.LastName}</td>
        <td>{student.YearLevel}</td>
        <td>{student.Gender}</td>
        <td>{student.ProgramCode}</td>

        {/* Actions */}
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
              title="Edit student"
             onClick={(e) => {
  e.stopPropagation();
  handleEdit(student);
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
              title="Delete student"
              onClick={(e) => {
  e.stopPropagation();
  handleDelete(student);
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
      <td colSpan="8" style={{ textAlign: "center", color: "#999" }}>
        No students found
      </td>
    </tr>
  )}

  {Array.from({
    length: Math.max(0, 4 - students.length),
  }).map((_, i) => (
    <tr key={`filler-${i}`} className="filler-row">
      <td colSpan="8">&nbsp;</td>
    </tr>
  ))}
</tbody>

            </table>
          </div>

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
    type="button"
    className="deletebut"
    onClick={() => setShowFilterModal(true)}
    style={{
      width: "120px",
      height: "50px",
      fontSize: "16px",
      gap: "6px",
      padding: "0",
    }}
  >
    <img
      src={sortIcon}
      alt="Filter"
      style={{
        width: "24px",
        height: "24px",
      }}
    />

    <span>Filters</span>
  </button>
</div>
          </div>

          {/* sort button and popup */}
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
                  onClick={(e) => e.stopPropagation()}
                />

                <button type="submit" style={{ display: "none" }}>
                  Search
                </button>
              </form>
            </div>

        
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

  

{/* NOTIFICATION MODAL */}


{/* FILTER MODAL */}
{showFilterModal && (
  <div
    className="modal-overlay"
    onClick={() => setShowFilterModal(false)}
  >
    <div
      className="modal-content"
      onClick={(e) => e.stopPropagation()}
    >
      {/* Purple header */}
      <div className="navbarhead">
        <img
          src={sortIcon}
          alt="Filter students"
          style={{
            width: "60px",
            height: "60px",
            position: "absolute",
            left: "3vw",
            top: "1.5vh",
            objectFit: "contain",
            zIndex: 3,
          }}
        />

        <h2
          style={{
            color: "#fff",
            fontWeight: "bold",
            position: "absolute",
            left: "8vw",
            top: "1vh",
          }}
        >
          Filter Students
        </h2>
      </div>

      {/* Close button */}
      <button
        type="button"
        onClick={() => setShowFilterModal(false)}
        style={{
          position: "absolute",
          top: "10px",
          right: "18px",
          border: "none",
          backgroundColor: "transparent",
          color: "#fff",
          fontSize: "28px",
          cursor: "pointer",
          zIndex: 5,
        }}
      >
        ×
      </button>

      <div
        style={{
          display: "flex",
          flexDirection: "column",
          gap: "18px",
          width: "330px",
          margin: "120px auto 0",
          color: "#2E3070",
        }}
      >
        {/* Gender */}
        <label
          style={{
            display: "flex",
            flexDirection: "column",
            gap: "7px",
            fontWeight: "bold",
          }}
        >
          Gender

          <select
            value={filterGender}
            onChange={(e) => setFilterGender(e.target.value)}
            style={{
              width: "100%",
              height: "42px",
              padding: "0 12px",
              border: "1px solid #D0D0D0",
              borderRadius: "7px",
              backgroundColor: "#fff",
              color: "#2E3070",
              fontSize: "14px",
              outline: "none",
            }}
          >
            <option value="">All Genders</option>
            <option value="Male">Male</option>
            <option value="Female">Female</option>
          </select>
        </label>

        {/* Year level */}
        <label
          style={{
            display: "flex",
            flexDirection: "column",
            gap: "7px",
            fontWeight: "bold",
          }}
        >
          Year Level

          <select
            value={filterYearLevel}
            onChange={(e) => setFilterYearLevel(e.target.value)}
            style={{
              width: "100%",
              height: "42px",
              padding: "0 12px",
              border: "1px solid #D0D0D0",
              borderRadius: "7px",
              backgroundColor: "#fff",
              color: "#2E3070",
              fontSize: "14px",
              outline: "none",
            }}
          >
            <option value="">All Years</option>
            <option value="1st Year">1st Year</option>
            <option value="2nd Year">2nd Year</option>
            <option value="3rd Year">3rd Year</option>
            <option value="4th Year">4th Year</option>
          </select>
        </label>

        {/* Program */}
        <label
          style={{
            display: "flex",
            flexDirection: "column",
            gap: "7px",
            fontWeight: "bold",
          }}
        >
          Program

          <select
            value={filterProgram}
            onChange={(e) => setFilterProgram(e.target.value)}
            style={{
              width: "100%",
              height: "42px",
              padding: "0 12px",
              border: "1px solid #D0D0D0",
              borderRadius: "7px",
              backgroundColor: "#fff",
              color: "#2E3070",
              fontSize: "14px",
              outline: "none",
            }}
          >
            <option value="">All Programs</option>

            {programs.map((prog) => (
              <option
                key={prog.programcode}
                value={prog.programcode}
              >
                {prog.programcode}
              </option>
            ))}
          </select>
        </label>
      </div>

      {/* Buttons */}
      <div
        style={{
          display: "flex",
          justifyContent: "center",
          gap: "12px",
          marginTop: "30px",
        }}
      >
        <button
          type="button"
          onClick={() => {
            setFilterGender("");
            setFilterYearLevel("");
            setFilterProgram("");
            setShowFilterModal(false);

            fetchStudents(1);
          }}
          style={{
            minWidth: "120px",
            padding: "10px 20px",
            borderRadius: "7px",
            border: "1px solid #2E3070",
            backgroundColor: "#fff",
            color: "#2E3070",
            fontWeight: "bold",
            cursor: "pointer",
          }}
        >
          Clear
        </button>

        <button
          type="button"
          onClick={() => {
            applyFilters(1);
            setShowFilterModal(false);
          }}
          style={{
            minWidth: "120px",
            padding: "10px 20px",
            borderRadius: "7px",
            border: "none",
            backgroundColor: "#2E3070",
            color: "#fff",
            fontWeight: "bold",
            cursor: "pointer",
          }}
        >
          Apply Filter
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

export default Student;
