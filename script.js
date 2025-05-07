let workData = JSON.parse(localStorage.getItem("workData")) || [];
updateTable();

function addEntry() {
    let date = document.getElementById("date").value;
    let weekOff = document.getElementById("weekOff").checked ? "Yes" : "No";
    
    let startTime = document.getElementById("startTime").value;
    let endTime = document.getElementById("endTime").value;
    
    if (!date) {
        alert("Please enter a valid date.");
        return;
    }

    // ✅ Check if the date already exists in workData
    if (workData.some(entry => entry.date === date)) {
        alert("Entry for this date already exists. Edit the existing entry instead.");
        return;
    }

    let hoursWorked;
    
    if (weekOff === "Yes") {
        startTime = "-";
        endTime = "-";
        hoursWorked = "0:00";  // No work on a week off
    } else {
        if (!startTime || !endTime) {
            alert("Please enter valid start and end times.");
            return;
        }

        startTime = formatTime(startTime);
        endTime = formatTime(endTime);
        hoursWorked = calculateHours(startTime, endTime);
        
        if (hoursWorked === "-") {
            alert("Invalid time range. End time must be after start time.");
            return;
        }
    }

    workData.push({ date, startTime, endTime, hoursWorked, weekOff });
    localStorage.setItem("workData", JSON.stringify(workData));
    updateTable();
    clearInputs(); // Clear input fields after adding entry
}


function formatTime(time) {
    time = time.replace(/\s+/g, "").toUpperCase();
    let match = time.match(/^(\d{1,2}):(\d{2})(AM|PM)$/);
    if (!match) return "";

    let hours = parseInt(match[1]);
    let minutes = match[2];
    let ampm = match[3];

    return `${hours}:${minutes} ${ampm}`;
}

function calculateHours(start, end) {
    let startDate = new Date(`1970-01-01T${convertTo24Hour(start)}:00`);
    let endDate = new Date(`1970-01-01T${convertTo24Hour(end)}:00`);

    let diffMinutes = (endDate - startDate) / (1000 * 60);
    if (diffMinutes < 0) return "-"; // Invalid range

    let hours = Math.floor(diffMinutes / 60);
    let minutes = diffMinutes % 60;

    return `${hours}:${minutes.toString().padStart(2, '0')}`; // HH:MM format
}

function convertTo24Hour(time) {
    let [timePart, ampm] = time.split(" ");
    let [hours, minutes] = timePart.split(":");
    hours = parseInt(hours);

    if (ampm === "PM" && hours !== 12) hours += 12;
    if (ampm === "AM" && hours === 12) hours = 0;

    return `${String(hours).padStart(2, "0")}:${minutes}`;
}

function updateTable() {
    let table = document.getElementById("workTable");
    table.innerHTML =
        "<tr><th>Date</th><th>Start Time</th><th>End Time</th><th>Hours Worked</th><th>Week Off</th><th>Action</th></tr>";
    let totalMinutes = 0;

    workData.forEach((entry, index) => {
        let row = table.insertRow();
        row.insertCell(0).innerText = entry.date;
        row.insertCell(1).innerText = entry.startTime;
        row.insertCell(2).innerText = entry.endTime;
        row.insertCell(3).innerText = entry.hoursWorked;
        row.insertCell(4).innerText = entry.weekOff;

        let actionCell = row.insertCell(5);
        actionCell.innerHTML = `
            <button class="action-btn edit-btn" onclick="editEntry(${index})">✏️</button>
            <button class="action-btn delete-btn" onclick="deleteEntry(${index})">❌</button>
        `;

        let [hours, minutes] = entry.hoursWorked.split(":").map(Number);
        totalMinutes += hours * 60 + minutes;
    });

    let totalHours = Math.floor(totalMinutes / 60);
    let totalMinutesLeft = totalMinutes % 60;
    document.getElementById("totalHours").innerText = `${totalHours}:${totalMinutesLeft.toString().padStart(2, '0')}`;
}

function editEntry(index) {
    let newDate = prompt("Enter new date:", workData[index].date);
    let newWeekOff = confirm("Is this a week off? Click OK for Yes, Cancel for No.") ? "Yes" : "No";
    
    let newStartTime, newEndTime, newHoursWorked;
    
    if (newWeekOff === "Yes") {
        newStartTime = "-";
        newEndTime = "-";
        newHoursWorked = "0:00"; // No hours worked
    } else {
        newStartTime = prompt("Enter new start time (HH:MMAM/PM):", workData[index].startTime);
        newEndTime = prompt("Enter new end time (HH:MMAM/PM):", workData[index].endTime);

        if (!newStartTime || !newEndTime) {
            alert("Invalid input. Changes not saved.");
            return;
        }

        newHoursWorked = calculateHours(newStartTime, newEndTime);
        if (newHoursWorked === "-") {
            alert("Invalid time range. Changes not saved.");
            return;
        }
    }

    workData[index] = {
        date: newDate,
        startTime: newStartTime,
        endTime: newEndTime,
        hoursWorked: newHoursWorked,
        weekOff: newWeekOff,
    };

    localStorage.setItem("workData", JSON.stringify(workData));
    updateTable();
}

function deleteEntry(index) {
    workData.splice(index, 1);
    localStorage.setItem("workData", JSON.stringify(workData));
    updateTable();
}

function clearInputs() {
    document.getElementById("date").value = "";
    document.getElementById("startTime").value = "";
    document.getElementById("endTime").value = "";
    document.getElementById("weekOff").checked = false;
}

function downloadPDF() {
    let { jsPDF } = window.jspdf;
    let doc = new jsPDF();
    doc.setFont("helvetica", "bold");
    doc.text("Work Hours Report", 20, 20);
    doc.setFont("helvetica", "normal");
    
    let y = 30;
    let totalMinutes = 0;
    
    workData.forEach((entry) => {
        let rowText = `${entry.date.padEnd(12)}  ${entry.startTime.padEnd(10)} - ${entry.endTime.padEnd(10)}  ${entry.hoursWorked.padEnd(8)} hours  Week Off: ${entry.weekOff}`;
        doc.text(rowText, 20, y);
        y += 10;
        
        let [hours, minutes] = entry.hoursWorked.split(":").map(Number);
        totalMinutes += hours * 60 + (minutes || 0);
    });
    
    let totalHours = Math.floor(totalMinutes / 60);
    let totalMinutesLeft = totalMinutes % 60;
    
    doc.setFont("helvetica", "bold");
    doc.text("-----------------------------------", 20, y + 5);
    doc.text(`Total Working Hours: ${totalHours}:${totalMinutesLeft.toString().padStart(2, '0')}`, 20, y + 15);
    
    doc.save("Work_Hours_Report.pdf");
}

function redirectToReport() {
    window.location.href = "report.html"; // Redirect to the report page
}


function resetTracker() {
    workData = [];
    localStorage.removeItem("workData");
    updateTable();
}

function toggleMenu() {
    let menu = document.getElementById("menu");
    menu.style.display = menu.style.display === "block" ? "none" : "block";
}












