/* ENERGY METER CONFIGURATION */

import { watchDashboardAccess } from "./auth-guard.js";

import {

    previousEnergyDate,

    watchEnergyLogin,

    loadEnergyDay,

    saveEnergyDay

} from "./energy-cloud.js";

const meterGroups = [

    {

        title: "400 kV Feeders",

        meters: [

            { id: "rtpp1", name: "RTPP-1" },

            { id: "rtpp2", name: "RTPP-2" },

            { id: "chittoor1", name: "Chittoor-1" },

            { id: "chittoor2", name: "Chittoor-2" }

        ],

        mf: 1000000 / 3,

        mfLabel: "1000000 / 3"

    },

    {

        title: "ICT Meter Readings",

        meters: [

            {

                id: "ict1hv",

                name: "ICT-1 HV",

                mf: 1000000 / 6,

                mfLabel: "1000000 / 6"

            },

            {

                id: "ict1lv",

                name: "ICT-1 LV",

                mf: 1000,

                mfLabel: "1000"

            },

            {

                id: "ict2hv",

                name: "ICT-2 HV",

                mf: 1000000 / 6,

                mfLabel: "1000000 / 6"

            },

            {

                id: "ict2lv",

                name: "ICT-2 LV",

                mf: 1000,

                mfLabel: "1000"

            }

        ]

    },

    {

        title: "220 kV Feeders",

        meters: [

            { id: "kalikiri1", name: "Kalikiri-1" },

            { id: "kalikiri2", name: "Kalikiri-2" },

            { id: "madanapalli1", name: "Madanapalli-1" },

            { id: "madanapalli2", name: "Madanapalli-2" }

        ],

        mf: 500,

        mfLabel: "500"

    }

];

const tablesBox = document.getElementById("energyTables");

const dateInput = document.getElementById("energyDate");

const messageBox = document.getElementById("energyMessage");

/* CREATE METER TABLES */

function createMeterTables() {

    tablesBox.innerHTML = meterGroups.map((group) => {

        const rows = group.meters.map((meter) => {

            const mf = meter.mf ?? group.mf;

            const mfLabel = meter.mfLabel ?? group.mfLabel;

            return ["Import", "Export"].map((flow) => {

                const key = `${meter.id}_${flow.toLowerCase()}`;

                const description = `${meter.name} ${flow}`;

                return `

                    <tr data-meter="${key}" data-mf="${mf}">

                        ${flow === "Import"

    ? `<th scope="rowgroup" rowspan="2" class="meter-name">${meter.name}</th>`

    : ""}

                        <td>${flow}</td>

                        <td>

                            <input

                                type="number"

                                min="0"

                                step="any"

                                class="energy-start"

                                aria-label="${description} 00:00 reading">

                        </td>

                        <td>

                            <input

                                type="number"

                                min="0"

                                step="any"

                                class="energy-end"

                                aria-label="${description} 24:00 reading">

                        </td>

                        <td class="energy-difference">—</td>

                        <td>${mfLabel}</td>

                        <td class="energy-kwh">—</td>

                        <td class="energy-mu">—</td>

                    </tr>

                `;

            }).join("");

        }).join("");

        return `

            <section class="energy-section">

                <h2>${group.title}</h2>

                <div class="energy-table-scroll">

                    <table class="energy-table">

                        <thead>

                            <tr>

                                <th scope="col">Meter</th>

                                <th scope="col">Flow</th>

                                <th scope="col">00:00 Reading</th>

                                <th scope="col">24:00 Reading</th>

                                <th scope="col">Difference</th>

                                <th scope="col">M.F.</th>

                                <th scope="col">Energy (kWh)</th>

                                <th scope="col">Energy (MU)</th>

                            </tr>

                        </thead>

                        <tbody>${rows}</tbody>

                    </table>

                </div>

            </section>

        `;

    }).join("");

}

/* CALCULATE A SINGLE METER ROW */

function calculateRow(row) {

    const startInput = row.querySelector(".energy-start");

    const endInput = row.querySelector(".energy-end");

    const differenceCell = row.querySelector(".energy-difference");

    const kwhCell = row.querySelector(".energy-kwh");

    const muCell = row.querySelector(".energy-mu");

    differenceCell.textContent = "—";

    kwhCell.textContent = "—";

    muCell.textContent = "—";

    startInput.setCustomValidity("");

    endInput.setCustomValidity("");

    if (startInput.value === "" || endInput.value === "") {

        return;

    }

    const start = startInput.valueAsNumber;

    const end = endInput.valueAsNumber;

    const mf = Number(row.dataset.mf);

    if (!Number.isFinite(start) || !Number.isFinite(end)) {

        return;

    }

    if (start < 0 || end < 0) {

        differenceCell.textContent = "Check reading";

        return;

    }

    if (end < start) {

        endInput.setCustomValidity(

            "24:00 reading must not be below 00:00 reading."

        );

        differenceCell.textContent = "Check reading";

        return;

    }

    const difference = end - start;

    const kwh = difference * mf;

    const mu = kwh / 1000000;

    differenceCell.textContent = difference.toFixed(3);

    kwhCell.textContent = kwh.toFixed(2);

    muCell.textContent = mu.toFixed(3);

}

/* UPDATE CALCULATIONS WHILE TYPING */

tablesBox.addEventListener("input", (event) => {

    if (!event.target.matches(".energy-start, .energy-end")) {

        return;

    }

    const row = event.target.closest("tr[data-meter]");

    calculateRow(row);

});

/* CLOUD SAVING AND DATE LOADING */

const saveButton = document.getElementById("saveEnergy");

const printButton = document.getElementById("printEnergy");

let signedInUser = null;

let loadedDate = "";

let loadedUserId = "";

let dirty = false;

let busy = false;

let loadVersion = 0;

let energyCanEdit = false;

let energyAccess = null;

let energyBaseline = null;

let energyLeaving = false;

let energyOperation = "";

createMeterTables();

function getEnergyRows() {

    return Array.from(tablesBox.querySelectorAll("tr[data-meter]"));

}

function energyRawValues() {

    return getEnergyRows().map(row => [

        row.dataset.meter,

        row.querySelector(".energy-start").value,

        row.querySelector(".energy-end").value

    ]);

}

function energyHasUnsaved() {

    return energyBaseline !== null &&

        JSON.stringify(energyRawValues()) !== energyBaseline;

}

function energyPageState() {

    return {

        user: Boolean(signedInUser),

        ready: Boolean(signedInUser && loadedDate && !busy),

        busy,

        operation: energyOperation,

        canEdit: energyCanEdit,

        date: loadedDate || dateInput.value,

        dirty: energyHasUnsaved(),

        message: messageBox.textContent

    };

}

function notifyEnergyState() {

    window.dispatchEvent(new CustomEvent("energy-page-state", {

        detail: energyPageState()

    }));

}

function updateEnergyControls() {

    const ready = Boolean(signedInUser && loadedDate && !busy);

    const editable = ready && energyCanEdit;

    saveButton.disabled = !editable;

    printButton.disabled = !ready;

    ["excelEnergy", "wordEnergy", "whatsappEnergy"].forEach(id => {

        const button = document.getElementById(id);

        if (button) button.disabled = !ready;

    });

    getEnergyRows().forEach(row => {

        row.querySelector(".energy-start").disabled = !editable;

        row.querySelector(".energy-end").disabled = !editable;

    });

    dateInput.disabled = busy || !signedInUser;

    notifyEnergyState();

}

function clearEnergyRows() {

    getEnergyRows().forEach(row => {

        row.querySelector(".energy-start").value = "";

        row.querySelector(".energy-end").value = "";

        calculateRow(row);

    });

}

async function openEnergyDate(date) {

    if (!signedInUser) return;

    const version = ++loadVersion;

    const userId = signedInUser.uid;

    busy = true;

    energyOperation = "loading";

    loadedDate = "";

    loadedUserId = "";

    dirty = false;

    energyBaseline = null;

    clearEnergyRows();

    messageBox.textContent = "Loading readings from Firebase...";

    updateEnergyControls();

    try {

        const saved = await loadEnergyDay(date);

        let previous = null;

        if (!saved) previous = await loadEnergyDay(previousEnergyDate(date));

        if (version !== loadVersion || signedInUser?.uid !== userId) return;

        let missingStarts = 0;

        getEnergyRows().forEach(row => {

            const key = row.dataset.meter;

            const startInput = row.querySelector(".energy-start");

            const endInput = row.querySelector(".energy-end");

            if (saved) {

                const reading = saved.readings?.[key];

                if (Number.isFinite(reading?.start)) startInput.value = reading.start;

                if (Number.isFinite(reading?.end)) endInput.value = reading.end;

            } else {

                const lastEnd = previous?.readings?.[key]?.end;

                if (Number.isFinite(lastEnd)) startInput.value = lastEnd;

                else missingStarts++;

            }

            calculateRow(row);

        });

        loadedDate = date;

        loadedUserId = userId;

        energyBaseline = JSON.stringify(energyRawValues());

        if (saved) messageBox.textContent = "Saved readings loaded for " + date + ".";

        else if (missingStarts === 0) {

            messageBox.textContent = "00:00 readings loaded from previous day's saved 24:00 readings. Enter today's 24:00 readings.";

        } else {

            messageBox.textContent = "Previous-day readings missing for " + missingStarts +

                " rows. Enter those 00:00 readings manually.";

        }

    } catch (error) {

        if (version === loadVersion) messageBox.textContent =

            "Loading failed: " + (error.code || error.message);

    } finally {

        if (version === loadVersion) {

            busy = false;

            energyOperation = "";

            updateEnergyControls();

        }

    }

}

tablesBox.addEventListener("input", event => {

    if (event.target.matches(".energy-start, .energy-end")) {

        dirty = energyHasUnsaved();

        messageBox.textContent = dirty ? "Unsaved changes. Save Readings to keep your changes." : "Readings unchanged.";

        notifyEnergyState();

    }

});

dateInput.addEventListener("change", function () {

    const selectedDate = dateInput.value;

    if (busy) { dateInput.value = loadedDate; return; }

    if (dirty && !window.energyNavigationGuardReady &&

        !window.confirm("These changes are not saved. Change the date anyway?")) {

        dateInput.value = loadedDate;

        return;

    }

    if (!selectedDate) {

        loadVersion++;

        loadedDate = "";

        loadedUserId = "";

        dirty = false;

        energyBaseline = null;

        clearEnergyRows();

        messageBox.textContent = "Select a date.";

        updateEnergyControls();

        return;

    }

    if (signedInUser) openEnergyDate(selectedDate);

});

async function saveCurrentEnergy() {

    if (busy || !signedInUser || !loadedDate || !energyCanEdit ||

        signedInUser.uid !== loadedUserId) return false;

    const readings = {};
    let enteredCells = 0;
    let completedRows = 0;
    for (const row of getEnergyRows()) {
        calculateRow(row);
        const startInput = row.querySelector(".energy-start");
        const endInput = row.querySelector(".energy-end");
        for (const input of [startInput, endInput]) {
            if (!input.checkValidity() ||
                (input.value !== "" && (!Number.isFinite(input.valueAsNumber) || input.valueAsNumber < 0))) {
                messageBox.textContent = "Enter a valid reading for " + row.dataset.meter + ".";
                input.focus();
                input.reportValidity();
                notifyEnergyState();
                return false;
            }
        }
        const start = startInput.value === "" ? null : startInput.valueAsNumber;
        const end = endInput.value === "" ? null : endInput.valueAsNumber;
        if (start !== null) enteredCells++;
        if (end !== null) enteredCells++;
        if (start !== null && end !== null) completedRows++;
        if (start !== null || end !== null) readings[row.dataset.meter] = { start, end };
    }
    if (!enteredCells) {
        messageBox.textContent = "Enter at least one reading before saving.";
        notifyEnergyState();
        return false;
    }
    const dateToSave = loadedDate;

    const userId = signedInUser.uid;

    const version = loadVersion;

    const captured = JSON.stringify(energyRawValues());

    busy = true;

    energyOperation = "saving";

    messageBox.textContent = "Checking saved readings...";

    updateEnergyControls();

    try {

        const existing = await loadEnergyDay(dateToSave);

        if (version !== loadVersion || signedInUser?.uid !== userId || !energyCanEdit) return false;

        if (existing && !window.confirm("Readings already exist for this date. Replace them?")) {

            messageBox.textContent = "Save cancelled. Your changes are not saved.";

            return false;

        }

        messageBox.textContent = "Saving to Firebase...";

        notifyEnergyState();

        await saveEnergyDay(dateToSave, readings);

        if (version !== loadVersion || signedInUser?.uid !== userId) return false;

        energyBaseline = captured;

        dirty = energyHasUnsaved();

        messageBox.textContent = "Readings saved to Firebase for " + dateToSave +
            ". " + completedRows + "/24 rows complete. " +
            (completedRows < 24 ? "Remaining readings can be entered and saved later." : "All readings complete.");

        return true;

    } catch (error) {

        if (version === loadVersion) messageBox.textContent =

            "Saving failed: " + (error.code || error.message) + ". Your readings remain here.";

        return false;

    } finally {

        if (version === loadVersion) {

            busy = false;

            energyOperation = "";

            updateEnergyControls();

        }

    }

}

window.energyPageAccess = {

    state: energyPageState,

    hasUnsaved: energyHasUnsaved,

    save: saveCurrentEnergy,

    allowLeave: () => { energyLeaving = true; }

};

saveButton.addEventListener("click", saveCurrentEnergy);

window.addEventListener("beforeunload", event => {

    if (!energyLeaving && (energyHasUnsaved() || busy)) {

        event.preventDefault();

        event.returnValue = "";

    }

});

watchEnergyLogin(function (user) {

    signedInUser = user;

    energyCanEdit = Boolean(energyAccess?.ready && energyAccess?.canEdit &&

        user && energyAccess.user?.uid === user.uid);

    if (!user) {

        loadVersion++;

        busy = false;

        energyOperation = "";

        loadedDate = "";

        loadedUserId = "";

        dirty = false;

        energyBaseline = null;

        clearEnergyRows();

        messageBox.textContent = "Login required.";

        updateEnergyControls();

        return;

    }

    updateEnergyControls();

    if (dateInput.value) openEnergyDate(dateInput.value);

    else { messageBox.textContent = "Select a date to load energy readings."; notifyEnergyState(); }

});

/* ENERGY READINGS PRINT / PDF */

printButton.addEventListener("click", () => {

    if (!loadedDate || busy) return;

    getEnergyRows().forEach(calculateRow);

    const report = tablesBox.cloneNode(true);

    // Print actual readings instead of input boxes.

    report.querySelectorAll("input").forEach(input => {

        const text = document.createElement("span");

        text.textContent = input.value === "" ? "—" : input.value;

        input.replaceWith(text);

    });

    const reportDate = loadedDate.split("-").reverse().join("/");

    const printWindow = window.open("", "_blank");

    if (!printWindow) {

        messageBox.textContent =

            "Allow pop-ups for this page to open Print / PDF.";

        return;

    }

    printWindow.document.write(`

        <!DOCTYPE html>

        <html lang="en">

        <head>

            <meta charset="UTF-8">

            <title>Energy Readings ${loadedDate}</title>

            <style>

                @page {

                    size: A4 landscape;

                    margin: 8mm;

                }

                * {

                    box-sizing: border-box;

                }

                body {

                    margin: 0;

                    color: #111;

                    background: white;

                    font-family: Arial, sans-serif;

                    font-size: 9pt;

                }

                h1 {

                    margin: 0 0 3mm;

                    text-align: center;

                    font-size: 15pt;

                }

                .report-date {

                    margin: 0 0 3mm;

                    text-align: right;

                    font-weight: bold;

                }

                .energy-section {

                    margin: 0 0 3mm;

                    break-inside: avoid;

                }

                h2 {

                    margin: 0;

                    padding: 1.5mm;

                    border: 1px solid #333;

                    border-bottom: 0;

                    font-size: 10pt;

                }

                table {

                    width: 100%;

                    border-collapse: collapse;

                    table-layout: fixed;

                    font-size: 8pt;

                }

                th, td {

                    border: 1px solid #333;

                    padding: 1.2mm 1mm;

                    text-align: center;

                    overflow-wrap: anywhere;

                }

                tbody th {

                    text-align: left;

                }

                thead th {

                    font-weight: bold;

                }

                tr {

                    break-inside: avoid;

                }

                .formula {

                    margin: 2mm 0 0;

                    font-size: 8pt;

                }

            </style>

        </head>

        <body>

            <h1>

                APTRANSCO — 400 KV SS KALIKIRI<br>

                ENERGY METER READINGS

            </h1>

            <p class="report-date">Date: ${reportDate}</p>

            ${report.innerHTML}

            <p class="formula">

                Difference = 24:00 − 00:00 |

                Energy (kWh) = Difference × M.F. |

                Energy (MU) = kWh ÷ 1000000

            </p>

        </body>

        </html>

    `);

    printWindow.document.close();

    printWindow.setTimeout(() => {

        printWindow.focus();

        printWindow.print();

    }, 300);

});

/* ENERGY METER READINGS — FORMATTED EXCEL */

(function setupEnergyExcel() {

    const button = document.getElementById("excelEnergy");

    if (!button) return;

    function loadExcelLibrary() {

        if (window.ExcelJS) {

            return Promise.resolve(window.ExcelJS);

        }

        return new Promise((resolve, reject) => {

            const script = document.createElement("script");

            script.src =

                "https://cdn.jsdelivr.net/npm/exceljs@4.4.0/dist/exceljs.min.js";

            const timer = setTimeout(() => {

                script.remove();

                reject(new Error("Excel library loading timed out."));

            }, 20000);

            script.onload = () => {

                clearTimeout(timer);

                if (window.ExcelJS) {

                    resolve(window.ExcelJS);

                } else {

                    reject(new Error("Excel library unavailable."));

                }

            };

            script.onerror = () => {

                clearTimeout(timer);

                script.remove();

                reject(new Error("Excel library download failed."));

            };

            document.head.appendChild(script);

        });

    }

    button.addEventListener("click", async function () {

        if (!signedInUser || !loadedDate || busy) return;

        getEnergyRows().forEach(calculateRow);

        const report = tablesBox.cloneNode(true);

        report.querySelectorAll("input").forEach(input => {

            const text = document.createElement("span");

            text.textContent = input.value === "" ? "—" : input.value;

            input.replaceWith(text);

        });

        const exportDate = loadedDate;

        const dateText = exportDate.split("-").reverse().join("/");

        const originalText = button.textContent;

        button.disabled = true;

        button.textContent = "Preparing Excel...";

        try {

            const ExcelJS = await loadExcelLibrary();

            const workbook = new ExcelJS.Workbook();

            const sheet = workbook.addWorksheet("Energy Meter Readings");

            sheet.views = [{ showGridLines: false }];

            sheet.pageSetup = {

                paperSize: 9,

                orientation: "landscape",

                fitToPage: true,

                fitToWidth: 1,

                fitToHeight: 1,

                horizontalCentered: true,

                margins: {

                    left: 0.4,

                    right: 0.4,

                    top: 0.3,

                    bottom: 0.3,

                    header: 0,

                    footer: 0

                }

            };

            const widths = [20, 12, 20, 20, 18, 20, 23, 18];

            widths.forEach((width, index) => {

                sheet.getColumn(index + 1).width = width;

            });

            let nextRow = 1;

            function addHeading(text, size, sectionHeading) {

                const row = nextRow++;

                sheet.mergeCells(row, 1, row, 8);

                const cell = sheet.getCell(row, 1);

                cell.value = text;

                cell.font = {

                    name: "Times New Roman",

                    size,

                    bold: true,

                    color: {

                        argb: sectionHeading ? "FFFFFFFF" : "FF153B65"

                    }

                };

                cell.alignment = {

                    horizontal: "center",

                    vertical: "middle",

                    wrapText: true

                };

                if (sectionHeading) {

                    cell.fill = {

                        type: "pattern",

                        pattern: "solid",

                        fgColor: { argb: "FF153B65" }

                    };

                    cell.border = {

                        top: { style: "thin" },

                        bottom: { style: "thin" },

                        left: { style: "thin" },

                        right: { style: "thin" }

                    };

                }

                sheet.getRow(row).height = size >= 16 ? 26 : 22;

            }

            addHeading("APTRANSCO", 18, false);

            addHeading("400 kV SUBSTATION, KALIKIRI", 14, false);

            addHeading(

                "ENERGY METER READINGS REPORT on " + dateText,

                12,

                false

            );

            sheet.getRow(nextRow++).height = 8;

            report.querySelectorAll(".energy-section").forEach(section => {

                addHeading(

                    section.querySelector("h2").textContent.trim(),

                    12,

                    true

                );

                const table = section.querySelector("table");

                const startRow = nextRow;

                const occupied = new Set();

                Array.from(table.rows).forEach((htmlRow, rowIndex) => {

                    const excelRow = startRow + rowIndex;

                    const isHeader =

                        htmlRow.parentElement.tagName === "THEAD";

                    sheet.getRow(excelRow).height = isHeader ? 26 : 20;

                    let column = 1;

                    Array.from(htmlRow.cells).forEach(htmlCell => {

                        while (occupied.has(excelRow + ":" + column)) {

                            column++;

                        }

                        const span = htmlCell.colSpan || 1;

                        const rowSpan = htmlCell.rowSpan || 1;

                        const text = htmlCell.textContent.trim();

                        const cell = sheet.getCell(excelRow, column);

                        cell.value = text;

                        if (

                            !isHeader &&

                            /^-?\d+(\.\d+)?$/.test(text)

                        ) {

                            cell.value = Number(text);

                            const decimals = text.includes(".")

                                ? text.split(".")[1].length

                                : 0;

                            cell.numFmt = decimals

                                ? "0." + "0".repeat(decimals)

                                : "0";

                        }

                        for (let r = excelRow; r < excelRow + rowSpan; r++) {

                            for (let c = column; c < column + span; c++) {

                                occupied.add(r + ":" + c);

                                const target = sheet.getCell(r, c);

                                target.font = {

                                    name: "Times New Roman",

                                    size: 10,

                                    bold: isHeader || column === 1

                                };

                                target.alignment = {

    horizontal:

        !isHeader && column === 1

            ? "left"

            : "center",

    vertical: "middle",

    wrapText: true,

    indent: !isHeader && column === 1 ? 1 : 0

};

                                target.fill = {

                                    type: "pattern",

                                    pattern: "solid",

                                    fgColor: {

                                        argb: isHeader

                                            ? "FFEAF1F8"

                                            : rowIndex % 2

                                                ? "FFFFFFFF"

                                                : "FFF3F7FB"

                                    }

                                };

                                target.border = {

                                    top: { style: "thin" },

                                    bottom: { style: "thin" },

                                    left: { style: "thin" },

                                    right: { style: "thin" }

                                };

                            }

                        }

                        if (span > 1 || rowSpan > 1) {

                            sheet.mergeCells(

                                excelRow,

                                column,

                                excelRow + rowSpan - 1,

                                column + span - 1

                            );

                        }

                        column += span;

                    });

                });

                nextRow = startRow + table.rows.length;

                sheet.getRow(nextRow++).height = 8;

            });

            addHeading(

                "Difference = 24:00 − 00:00 | " +

                "Energy (kWh) = Difference × M.F. | " +

                "Energy (MU) = kWh ÷ 1000000",

                10,

                false

            );

            sheet.pageSetup.printArea = "A1:H" + (nextRow - 1);

            const buffer = await workbook.xlsx.writeBuffer();

            const blob = new Blob([buffer], {

                type:

                    "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"

            });

            const url = URL.createObjectURL(blob);

            const link = document.createElement("a");

            link.href = url;

            link.download =

                "Kalikiri-Energy-Readings-" + exportDate + ".xlsx";

            document.body.appendChild(link);

            link.click();

            link.remove();

            setTimeout(() => URL.revokeObjectURL(url), 30000);

        } catch (error) {

            console.error("Energy Excel export failed:", error);

            alert("Excel download kaaledu: " + error.message);

        } finally {

            button.textContent = originalText;

            updateEnergyControls();

        }

    });

})();

/* ENERGY METER READINGS — WORD */

(function setupEnergyWord() {

    const button = document.getElementById("wordEnergy");

    if (!button) return;

    let exporting = false;

    button.addEventListener("click", async function () {

        if (exporting || !signedInUser || !loadedDate || busy) return;

        getEnergyRows().forEach(calculateRow);

        const report = tablesBox.cloneNode(true);

        report.querySelectorAll("input").forEach(input => {

            const text = document.createElement("span");

            text.textContent = input.value === "" ? "—" : input.value;

            input.replaceWith(text);

        });

        const exportDate = loadedDate;

        const dateText = exportDate.split("-").reverse().join("/");

        const originalText = button.textContent;

        exporting = true;

        button.disabled = true;

        button.textContent = "Preparing Word...";

        try {

            const {

                Document, Packer, Paragraph, TextRun,

                Table, TableRow, TableCell,

                AlignmentType, WidthType, BorderStyle,

                VerticalAlign, TableLayoutType, PageOrientation

            } = await import(

                "https://cdn.jsdelivr.net/npm/docx@9.5.1/+esm"

            );

            const widths = [

                1800, 1000, 2200, 2200,

                1800, 2100, 2400, 2100

            ];

            const border = {

                style: BorderStyle.SINGLE,

                size: 4,

                color: "000000"

            };

            function heading(text, size) {

                return new Paragraph({

                    alignment: AlignmentType.CENTER,

                    spacing: { before: 0, after: 60 },

                    children: [

                        new TextRun({

                            text,

                            font: "Times New Roman",

                            size,

                            bold: true

                        })

                    ]

                });

            }

            const children = [

                heading("APTRANSCO", 30),

                heading("400 kV SUBSTATION, KALIKIRI", 24),

                heading(

                    "ENERGY METER READINGS REPORT on " + dateText,

                    22

                )

            ];

            report.querySelectorAll(".energy-section").forEach(section => {

                children.push(

                    heading(section.querySelector("h2").textContent.trim(), 20)

                );

                const source = section.querySelector("table");

                const occupied = new Set();

                const rows = Array.from(source.rows).map((htmlRow, rowIndex) => {

                    const isHeader =

                        htmlRow.parentElement.tagName === "THEAD";

                    let column = 0;

                    const cells = Array.from(htmlRow.cells).map(htmlCell => {

                        while (occupied.has(rowIndex + ":" + column)) {

                            column++;

                        }

                        const startColumn = column;

                        const span = htmlCell.colSpan || 1;

                        const rowSpan = htmlCell.rowSpan || 1;

                        for (let r = rowIndex; r < rowIndex + rowSpan; r++) {

                            for (let c = column; c < column + span; c++) {

                                occupied.add(r + ":" + c);

                            }

                        }

                        column += span;

                        const width = widths

                            .slice(startColumn, startColumn + span)

                            .reduce((sum, value) => sum + value, 0);

                        return new TableCell({

                            columnSpan: span,

                            rowSpan,

                            width: { size: width, type: WidthType.DXA },

                            verticalAlign: VerticalAlign.CENTER,

                            shading: {

                                fill: isHeader ? "EAF1F8" : "FFFFFF"

                            },

                            margins: {

                                top: 30,

                                bottom: 30,

                                left: startColumn === 0 ? 100 : 45,

                                right: 45

                            },

                            borders: {

                                top: border,

                                bottom: border,

                                left: border,

                                right: border

                            },

                            children: [

                                new Paragraph({

                                    alignment:

                                        !isHeader && startColumn === 0

                                            ? AlignmentType.LEFT

                                            : AlignmentType.CENTER,

                                    spacing: { before: 0, after: 0 },

                                    children: [

                                        new TextRun({

                                            text: htmlCell.textContent.trim(),

                                            font: "Times New Roman",

                                            size: 16,

                                            bold: isHeader || startColumn === 0

                                        })

                                    ]

                                })

                            ]

                        });

                    });

                    return new TableRow({

                        tableHeader: isHeader,

                        cantSplit: true,

                        children: cells

                    });

                });

                children.push(

                    new Table({

                        width: { size: 15600, type: WidthType.DXA },

                        columnWidths: widths,

                        layout: TableLayoutType.FIXED,

                        alignment: AlignmentType.CENTER,

                        borders: {

                            top: border,

                            bottom: border,

                            left: border,

                            right: border,

                            insideHorizontal: border,

                            insideVertical: border

                        },

                        rows

                    }),

                    new Paragraph({

                        spacing: { before: 0, after: 0 },

                        children: [new TextRun({ text: "", size: 6 })]

                    })

                );

            });

            children.push(

                new Paragraph({

                    alignment: AlignmentType.CENTER,

                    spacing: { before: 0, after: 0 },

                    children: [

                        new TextRun({

                            text:

                                "Difference = 24:00 − 00:00 | " +

                                "Energy (kWh) = Difference × M.F. | " +

                                "Energy (MU) = kWh ÷ 1000000",

                            font: "Times New Roman",

                            size: 16

                        })

                    ]

                })

            );

            const documentFile = new Document({

                sections: [{

                    properties: {

                        page: {

                            size: {

                                width: 11906,

                                height: 16838,

                                orientation: PageOrientation.LANDSCAPE

                            },

                            margin: {

                                top: 480,

                                bottom: 480,

                                left: 600,

                                right: 600

                            }

                        }

                    },

                    children

                }]

            });

            const blob = await Packer.toBlob(documentFile);

            const url = URL.createObjectURL(blob);

            const link = document.createElement("a");

            link.href = url;

            link.download =

                "Kalikiri-Energy-Readings-" + exportDate + ".docx";

            document.body.appendChild(link);

            link.click();

            link.remove();

            setTimeout(() => URL.revokeObjectURL(url), 30000);

        } catch (error) {

            console.error("Energy Word export failed:", error);

            alert("Word download kaaledu: " + error.message);

        } finally {

            exporting = false;

            button.textContent = originalText;

            updateEnergyControls();

        }

    });

})();

/* ENERGY METER READINGS — WHATSAPP */

(function setupEnergyWhatsApp() {

    const button = document.getElementById("whatsappEnergy");

    if (!button) return;

    button.addEventListener("click", function () {

        if (!signedInUser || !loadedDate || busy) return;

        getEnergyRows().forEach(calculateRow);

        const dateText = loadedDate.split("-").reverse().join("/");

        const lines = [

            "APTRANSCO",

            "400 kV SUBSTATION, KALIKIRI",

            "ENERGY METER READINGS REPORT on " + dateText + "",

            ""

        ];

        meterGroups.forEach(group => {

            lines.push("" + group.title + "", "");

            group.meters.forEach(meter => {

                lines.push("" + meter.name + "");

                ["import", "export"].forEach(flow => {

                    const row = tablesBox.querySelector(

                        '[data-meter="' + meter.id + "_" + flow + '"]'

                    );

                    const start = row.querySelector(".energy-start").value;

                    const end = row.querySelector(".energy-end").value;

                    const difference = row.querySelector(

                        ".energy-difference"

                    ).textContent.trim();

                    const kwh = row.querySelector(

                        ".energy-kwh"

                    ).textContent.trim();

                    const mu = row.querySelector(

                        ".energy-mu"

                    ).textContent.trim();

                    lines.push(

                        flow === "import" ? "Import:" : "Export:",

                        "00:00 = " + (start === "" ? "—" : start),

                        "24:00 = " + (end === "" ? "—" : end),

                        "Difference = " + difference,

                        "M.F. = " + (meter.mfLabel ?? group.mfLabel),

                        "Energy = " + kwh + " kWh | " + mu + " MU",

                        ""

                    );

                });

            });

        });

        lines.push("— = reading / calculation unavailable.");

        const link = document.createElement("a");

        link.href =

            "https://wa.me/?text=" +

            encodeURIComponent(lines.join("\n"));

        link.target = "_blank";

        link.rel = "noopener noreferrer";

        document.body.appendChild(link);

        link.click();

        link.remove();

    });

})();

watchDashboardAccess(function (access) {

    energyAccess = access;

    energyCanEdit = Boolean(access.ready && access.canEdit && access.user &&

        access.user.uid === signedInUser?.uid);

    updateEnergyControls();

});

/* HORIZONTAL CALENDAR — CLOUD SAVED DATES */

(async function setupEnergyCalendar() {

    const monthLabel =

        document.getElementById("energyCalendarMonth");

    const daysBox =

        document.getElementById("energyCalendarDays");

    const previousButton =

        document.getElementById("energyPreviousMonth");

    const nextButton =

        document.getElementById("energyNextMonth");

    if (

        !monthLabel ||

        !daysBox ||

        !previousButton ||

        !nextButton

    ) {

        return;

    }

    const {

        watchEnergyMonth,

        watchEnergyLogin: watchCalendarLogin

    } = await import("./energy-cloud.js");

    const todayKey = new Intl.DateTimeFormat(

        "en-CA",

        {

            timeZone: "Asia/Kolkata",

            year: "numeric",

            month: "2-digit",

            day: "2-digit"

        }

    ).formatToParts(new Date());

    function todayPart(type) {

        return todayKey.find(function (part) {

            return part.type === type;

        }).value;

    }

    const today =

        todayPart("year") + "-" +

        todayPart("month") + "-" +

        todayPart("day");

    let calendarMonth =

        (dateInput.value || today).slice(0, 7);

    let savedDates = new Set();

    let calendarUser = null;

    let stopMonthWatch = null;

    let watchVersion = 0;

    let calendarStatus = "loading";

    function updateCalendarControls() {

        const disabled = !calendarUser || busy;

        previousButton.disabled = disabled;

        nextButton.disabled = disabled;

        daysBox.querySelectorAll("button")

            .forEach(function (button) {

                button.disabled = disabled;

            });

    }

    function renderEnergyCalendar() {

        const monthDate = new Date(

            calendarMonth + "-01T00:00:00Z"

        );

        monthLabel.textContent =

            monthDate.toLocaleDateString("en-US", {

                month: "short",

                timeZone: "UTC"

            });

        monthLabel.title =

            monthDate.toLocaleDateString("en-US", {

                month: "long",

                year: "numeric",

                timeZone: "UTC"

            });

        monthLabel.setAttribute(

            "aria-label",

            monthLabel.title

        );

        const lastDay = new Date(

            Date.UTC(

                monthDate.getUTCFullYear(),

                monthDate.getUTCMonth() + 1,

                0

            )

        ).getUTCDate();

        daysBox.replaceChildren();

        for (let day = 1; day <= lastDay; day++) {

            const date =

                calendarMonth + "-" +

                String(day).padStart(2, "0");

            const button =

                document.createElement("button");

            button.type = "button";

            button.className = "energy-calendar-day";

            button.textContent = day;

            const saved = savedDates.has(date);

            button.classList.toggle(

                "has-readings",

                saved

            );

            button.classList.toggle(

                "is-selected",

                date === dateInput.value

            );

            button.classList.toggle(

                "is-today",

                date === today

            );

            button.setAttribute(

                "aria-pressed",

                String(date === dateInput.value)

            );

            if (date === today) {

                button.setAttribute("aria-current", "date");

            }

            const availability = saved

                ? "Saved readings available"

                : calendarStatus === "ready"

                    ? "No saved readings"

                    : calendarStatus === "error"

                        ? "Saved dates could not load"

                        : "Checking saved dates";

            button.title = date + ": " + availability;

            button.setAttribute(

                "aria-label",

                button.title

            );

            button.addEventListener("click", function () {

                if (!calendarUser || busy) return;

                dateInput.value = date;

                dateInput.dispatchEvent(

                    new Event("change", { bubbles: true })

                );

            });

            daysBox.appendChild(button);

        }

        updateCalendarControls();

    }

    function connectCalendarMonth() {

        const version = ++watchVersion;

        if (stopMonthWatch) {

            stopMonthWatch();

            stopMonthWatch = null;

        }

        savedDates = new Set();

        calendarStatus = calendarUser

            ? "loading"

            : "signed-out";

        renderEnergyCalendar();

        if (!calendarUser) return;

        const userId = calendarUser.uid;

        stopMonthWatch = watchEnergyMonth(

            calendarMonth,

            function (dates) {

                if (

                    version !== watchVersion ||

                    calendarUser?.uid !== userId

                ) {

                    return;

                }

                savedDates = dates;

                calendarStatus = "ready";

                renderEnergyCalendar();

            },

            function () {

                if (version !== watchVersion) return;

                savedDates = new Set();

                calendarStatus = "error";

                renderEnergyCalendar();

            }

        );

    }

    function moveCalendarMonth(amount) {

        if (!calendarUser || busy) return;

        const monthDate = new Date(

            calendarMonth + "-01T00:00:00Z"

        );

        monthDate.setUTCMonth(

            monthDate.getUTCMonth() + amount

        );

        calendarMonth =

            monthDate.toISOString().slice(0, 7);

        connectCalendarMonth();

    }

    previousButton.addEventListener("click", function () {

        moveCalendarMonth(-1);

    });

    nextButton.addEventListener("click", function () {

        moveCalendarMonth(1);

    });

    dateInput.addEventListener("change", function () {

        const selectedMonth =

            dateInput.value.slice(0, 7);

        if (

            selectedMonth &&

            selectedMonth !== calendarMonth

        ) {

            calendarMonth = selectedMonth;

            connectCalendarMonth();

        } else {

            renderEnergyCalendar();

        }

    });

    new MutationObserver(updateCalendarControls).observe(

        dateInput,

        {

            attributes: true,

            attributeFilter: ["disabled"]

        }

    );

    renderEnergyCalendar();

    watchCalendarLogin(function (user) {

        calendarUser = user;

        connectCalendarMonth();

    });

})();