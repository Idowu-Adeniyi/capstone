document.addEventListener("DOMContentLoaded", function () {
  const timerDisplay = document.getElementById("timerDisplay");

  if (timerDisplay && clockInTime) {
    function updateTimer() {
      const now = new Date();
      const clockInDate = new Date(clockInTime);
      const elapsedMs = now - clockInDate;

      let seconds = Math.floor(elapsedMs / 1000) % 60;
      let minutes = Math.floor(elapsedMs / (1000 * 60)) % 60;
      let hours = Math.floor(elapsedMs / (1000 * 60 * 60));

      timerDisplay.textContent = `${hours}h ${minutes}m ${seconds}s`;
    }

    updateTimer(); // Run immediately
    setInterval(updateTimer, 1000); // Update every second
  }
});

// document.addEventListener("DOMContentLoaded", function () {
//   const timerDisplay = document.getElementById("timerDisplay");

//   if (timerDisplay && clockInTime !== "null") {
//     function updateTimer() {
//       const now = new Date();
//       const clockInDate = new Date(parseInt(clockInTime)); // Ensure it's a valid date
//       const elapsedMs = now - clockInDate;

//       if (elapsedMs > 0) {
//         let seconds = Math.floor(elapsedMs / 1000) % 60;
//         let minutes = Math.floor(elapsedMs / (1000 * 60)) % 60;
//         let hours = Math.floor(elapsedMs / (1000 * 60 * 60));

//         timerDisplay.textContent = `${hours}h ${minutes}m ${seconds}s`;
//       }
//     }

//     updateTimer(); // Run immediately
//     setInterval(updateTimer, 1000); // Update every second
//   }
// });
