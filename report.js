document.addEventListener("DOMContentLoaded", function () {
    let workData = JSON.parse(localStorage.getItem("workData")) || [];
    let tableBody = document.querySelector("#report-section tbody");

    tableBody.innerHTML = ""; // Clear old data

    let totalMinutes = 0;

    workData.forEach(entry => {
        let row = document.createElement("tr");
        
        row.innerHTML = `
            <td>${entry.date}</td>
            <td>${entry.startTime || "-"}</td>
            <td>${entry.endTime || "-"}</td>
            <td>${entry.hoursWorked}</td>
            <td>${entry.weekOff}</td>
        `;

        tableBody.appendChild(row);

        let [h, m] = entry.hoursWorked.split(":").map(Number);
        totalMinutes += h * 60 + m;
    });

    document.getElementById("total-hours").innerText = `${Math.floor(totalMinutes / 60)}:${String(totalMinutes % 60).padStart(2, '0')}`;

    // ✅ Fix: Add event listener to the button
    document.getElementById("downloadReportBtn").addEventListener("click", downloadPDF);
});

function downloadPDF() {
    if (!window.jspdf || !window.jspdf.jsPDF) {
        alert("Error: jsPDF is not loaded properly. Check script imports.");
        return;
    }

    const { jsPDF } = window.jspdf;
    const doc = new jsPDF();

    doc.setFont("helvetica", "bold");
    doc.text("Work Hours Report", 105, 15, null, null, "center");

    let headers = ["Date", "Start Time", "End Time", "Hours Worked", "Week Off"];
    let workData = JSON.parse(localStorage.getItem("workData")) || [];

    if (workData.length === 0) {
        alert("No data available to generate the report.");
        return;
    }

    let data = workData.map(entry => [
        entry.date,
        entry.startTime || "-",
        entry.endTime || "-",
        entry.hoursWorked,
        entry.weekOff
    ]);

    doc.autoTable({
        head: [headers],
        body: data,
        startY: 25,
        theme: "grid",
        styles: { fontSize: 10 },
        headStyles: { fillColor: [110, 142, 251] }
    });

    doc.save("Work_Hours_Report.pdf");
}
