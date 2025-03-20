// document.addEventListener("DOMContentLoaded", function () {
//   console.log("Script Loaded!"); // Debugging

//   const showHistoryBtn = document.getElementById("showHistoryBtn");
//   const logHistorySection = document.getElementById("logHistorySection");

//   if (!showHistoryBtn || !logHistorySection) {
//     console.error("Elements not found in DOM.");
//     return;
//   }

//   showHistoryBtn.addEventListener("click", function () {
//     if (
//       logHistorySection.style.display === "none" ||
//       logHistorySection.style.display === ""
//     ) {
//       logHistorySection.style.display = "block";
//       showHistoryBtn.textContent = "Hide Log History";
//       fetchLogHistory(); // Fetch log data when shown
//     } else {
//       logHistorySection.style.display = "none";
//       showHistoryBtn.textContent = "Show Log History";
//     }
//   });

//   function fetchLogHistory() {
//     fetch("/log-history")
//       .then((response) => response.json())
//       .then((data) => {
//         const tbody = document.querySelector("#logHistorySection tbody");
//         tbody.innerHTML = ""; // Clear old data

//         data.forEach((log) => {
//           const row = `<tr>
//               <td>${log.action}</td>
//               <td>${new Date(log.timestamp).toLocaleString()}</td>
//               <td>${
//                 log.clockInTime
//                   ? new Date(log.clockInTime).toLocaleString()
//                   : "N/A"
//               }</td>
//               <td>${
//                 log.clockOutTime
//                   ? new Date(log.clockOutTime).toLocaleString()
//                   : "N/A"
//               }</td>
//             </tr>`;
//           tbody.innerHTML += row;
//         });
//       })
//       .catch((error) => console.error("Error fetching log history:", error));
//   }
// });

document.addEventListener("DOMContentLoaded", function () {
  console.log("Script Loaded!"); // Debugging

  const showHistoryBtn = document.getElementById("showHistoryBtn");
  const logHistorySection = document.getElementById("logHistorySection");
  const dateFilter = document.getElementById("dateFilter");

  if (!showHistoryBtn || !logHistorySection || !dateFilter) {
    console.error("Elements not found in DOM.");
    return;
  }

  showHistoryBtn.addEventListener("click", function () {
    if (
      logHistorySection.style.display === "none" ||
      logHistorySection.style.display === ""
    ) {
      logHistorySection.style.display = "block";
      showHistoryBtn.textContent = "Hide Log History";
      fetchLogHistory(); // Fetch log data when shown
    } else {
      logHistorySection.style.display = "none";
      showHistoryBtn.textContent = "Show Log History";
    }
  });

  // Fetch log history data
  function fetchLogHistory() {
    fetch("/log-history")
      .then((response) => response.json())
      .then((data) => {
        const tbody = document.querySelector("#logHistorySection tbody");
        tbody.innerHTML = ""; // Clear old data

        data.forEach((log) => {
          const row = `<tr>
              <td>${log.action}</td>
              <td>${new Date(log.timestamp).toLocaleString()}</td>
              <td>${
                log.clockInTime
                  ? new Date(log.clockInTime).toLocaleString()
                  : "N/A"
              }</td>
              <td>${
                log.clockOutTime
                  ? new Date(log.clockOutTime).toLocaleString()
                  : "N/A"
              }</td>
            </tr>`;
          tbody.innerHTML += row;
        });

        // After loading the log history, apply the filter
        applyDateFilter();
      })
      .catch((error) => console.error("Error fetching log history:", error));
  }

  // Apply date filter to the logs
  dateFilter.addEventListener("input", function () {
    applyDateFilter();
  });

  function applyDateFilter() {
    const filterDate = dateFilter.value;
    const rows = document.querySelectorAll("#logHistorySection tbody tr");

    if (!filterDate) {
      rows.forEach((row) => (row.style.display = ""));
      return;
    }

    rows.forEach((row) => {
      const dateClockIn = row.cells[2].innerText; // Date of Clock In
      const dateClockOut = row.cells[3].innerText; // Date of Clock Out

      // Normalize the dates to a comparable format (YYYY-MM-DD)
      const dateClockInFormatted = new Date(dateClockIn)
        .toISOString()
        .split("T")[0];
      const dateClockOutFormatted = new Date(dateClockOut)
        .toISOString()
        .split("T")[0];

      // Check if the filtered date matches either clock-in or clock-out date
      if (
        dateClockInFormatted === filterDate ||
        dateClockOutFormatted === filterDate
      ) {
        row.style.display = ""; // Show this row if dates match
      } else {
        row.style.display = "none"; // Hide this row if dates don't match
      }
    });
  }
});
