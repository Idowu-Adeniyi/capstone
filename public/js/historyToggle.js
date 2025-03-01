document.addEventListener("DOMContentLoaded", function () {
  console.log("Script Loaded!"); // Debugging

  const showHistoryBtn = document.getElementById("showHistoryBtn");
  const logHistorySection = document.getElementById("logHistorySection");

  if (!showHistoryBtn || !logHistorySection) {
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
      })
      .catch((error) => console.error("Error fetching log history:", error));
  }
});
