// document.addEventListener("DOMContentLoaded", function () {
//   const timerDisplay = document.getElementById("timerDisplay");

//   if (timerDisplay && clockInTime) {
//     function updateTimer() {
//       const now = new Date();
//       const clockInDate = new Date(clockInTime);
//       const elapsedMs = now - clockInDate;

//       let seconds = Math.floor(elapsedMs / 1000) % 60;
//       let minutes = Math.floor(elapsedMs / (1000 * 60)) % 60;
//       let hours = Math.floor(elapsedMs / (1000 * 60 * 60));

//       timerDisplay.textContent = `${hours}h ${minutes}m ${seconds}s`;
//     }

//     updateTimer(); // Run immediately
//     setInterval(updateTimer, 1000); // Update every second
//   }
// });

// document.addEventListener("DOMContentLoaded", function () {
//   const timerDisplay = document.getElementById("timerDisplay");
//   const clockInTime = window.clockInTime ? new Date(window.clockInTime) : null;

//   if (clockInTime && timerDisplay) {
//     startLiveTimer(clockInTime, timerDisplay);
//   }
// });

// function startLiveTimer(clockInTime, timerDisplay) {
//   function updateTimer() {
//     const now = new Date();
//     const elapsedMs = now - clockInTime;

//     const hours = Math.floor(elapsedMs / (1000 * 60 * 60));
//     const minutes = Math.floor((elapsedMs / (1000 * 60)) % 60);
//     const seconds = Math.floor((elapsedMs / 1000) % 60);

//     timerDisplay.textContent = `${hours}h ${minutes}m ${seconds}s`;
//   }

//   updateTimer();
//   setInterval(updateTimer, 1000);
// }

document.addEventListener("DOMContentLoaded", function () {
  const timerDisplay = document.getElementById("timerDisplay");
  const clockInTime = window.clockInTime ? new Date(window.clockInTime) : null;

  if (clockInTime instanceof Date && !isNaN(clockInTime) && timerDisplay) {
    startLiveTimer(clockInTime, timerDisplay);
  }
});

function startLiveTimer(clockInTime, timerDisplay) {
  function updateTimer() {
    const now = new Date();
    const elapsedMs = now - clockInTime;

    const hours = Math.floor(elapsedMs / (1000 * 60 * 60));
    const minutes = Math.floor((elapsedMs / (1000 * 60)) % 60);
    const seconds = Math.floor((elapsedMs / 1000) % 60);

    timerDisplay.textContent = `${hours}h ${String(minutes).padStart(
      2,
      "0"
    )}m ${String(seconds).padStart(2, "0")}s`;
  }

  updateTimer();
  setInterval(updateTimer, 1000);
}
