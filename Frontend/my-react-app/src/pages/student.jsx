import React, { useEffect, useState, useRef } from "react";
import "../assets/student.css";
import editIcon from "../images/edit.png";
import addIcon from "../images/add.png";
import deleteIcon from "../images/delete.png";
import sortIcon from "../images/sort.png"; // make sure this exists
import arrowIcon from "../images/arrowdown.png"

function Student() {
  const [students, setStudents] = useState([]);
  const [originalStudents, setOriginalStudents] = useState([]); // store original data
  const [selectedRow, setSelectedRow] = useState(null);
  const [showSortMenu, setShowSortMenu] = useState(false);
  const tableRef = useRef(null);

  useEffect(() => {
    fetch("http://127.0.0.1:5000/students")
      .then((response) => response.json())
      .then((data) => {
        setStudents(data);
        setOriginalStudents(data); // keep a copy of original
      })
      .catch((error) => console.error("Error fetching students:", error));
  }, []);

  // deselect row if the user clicks outside the table
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

  // sorting logic
  const handleSort = (key) => {
    if (key === "default") {
      setStudents(originalStudents); // reset to original order
      setShowSortMenu(false);
      return;
    }

    const sorted = [...students].sort((a, b) =>
      a[key] > b[key] ? 1 : -1
    );
    setStudents(sorted);
    setShowSortMenu(false);
  };

  return (
    <div className="containers">
      {students.length === 0 ? (
        <p style={{ color: "blue" }}>Loading...</p>
      ) : (
        <>
          {/* table */}
          <div
            className="table-container"
            style={{
              height: "26.3vw",
              width: "79vw",
              border: "2px solid #E7E7E7",
              borderTopLeftRadius: "10px",
              borderTopRightRadius: "10px",
              overflow: "auto",
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
                {students.map((student, rowIndex) => (
                  <tr
                    key={student.IdNumber}
                    className={selectedRow === rowIndex ? "selected" : ""}
                    onClick={() => setSelectedRow(rowIndex)}
                    style={{ cursor: "pointer" }}
                  >
                    <td>{student.IdNumber}</td>
                    <td>{student.FirstName}</td>
                    <td>{student.LastName}</td>
                    <td>{student.YearLevel}</td>
                    <td>{student.Gender}</td>
                    <td>{student.ProgramCode}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* bottom buttons */}
          <div className="bottomcon">
            {/* edit button */}
            <button className="editbut">
              <img
                src={editIcon}
                alt="Edit"
                className="icon"
                style={{ width: "30px", height: "30px", position: "absolute", left: "32px", }}
              />
              Edit
            </button>

            {/* add button */}
            <button className="addbut">
              <img
                src={addIcon}
                alt="Add"
                className="addicon"
                 style={{ width: "30px", height: "30px", position: "absolute", left: "30px", }}
              />
              Add
            </button>

            {/* delete button */}
            <button className="deletebut">
              <img
                src={deleteIcon}
                alt="Delete"
                className="icon"
                style={{ width: "30px", height: "30px", position: "absolute", left: "30px", }}
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
                
                style={{ width: "30px", height: "30px", position: "absolute", left: "32px"}}
              />
              <img
                src={arrowIcon}
                alt="arrrowdown"
                
                style={{ width: "35px", height: "35px", position: "absolute", left: "140px"}}
              />
              Sort by:
            </button>

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
