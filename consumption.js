let rtpp1 = document.getElementById("rtpp1");
let rtpp2 = document.getElementById("rtpp2");
let chittoor1 = document.getElementById("chittoor1");
let chittoor2 = document.getElementById("chittoor2");

let import400 = document.getElementById("import400");
let importict = document.getElementById("importict");
let totalImport = document.getElementById("totalImport");

/* =========================
   TEST MESSAGE AUTO FILL
========================= */

let testMessage =
    document.getElementById("testMessage");

let autoFill =
    document.getElementById("autoFill");


autoFill.addEventListener(
    "click",
    autoFillReport
);
function getValue(text, pattern) {

    let match =
        text.match(pattern);

    if (!match) {
        return "";
    }

    return match[1];
}


function setField(id, value) {

    let field =
        document.getElementById(id);

    if (field && value !== "") {
        field.value = value;
    }
}

function getSection(text, startText, endText) {

    let startNumber =
        startText.match(/\d+/)[0];

    let endNumberMatch =
    endText.match(/\d+/);

let endNumber =
    endNumberMatch
        ? endNumberMatch[0]
        : null;

    let lines =
        text.split(/\r?\n/);

    let startLine = -1;
    let endLine = lines.length;

    for (let i = 0; i < lines.length; i++) {

        let line =
            lines[i].trim();

        if (
            line.match(
                new RegExp(
                    "^\\(?"+startNumber+"\\s*[).:-]",
                    "i"
                )
            )
        ) {
            startLine = i;
            break;
        }
    }

    if (startLine === -1) {
        return "";
    }

    for (
        let i = startLine + 1;
        i < lines.length;
        i++
    ) {

        let line =
            lines[i].trim();

        if (
            line.match(
                new RegExp(
                    "^\\(?"+endNumber+"\\s*[).:-]",
                    "i"
                )
            )
        ) {
            endLine = i;
            break;
        }
    }

    return lines
        .slice(startLine + 1, endLine)
        .join("\n");
}
function setField(id, value) {

    let field =
        document.getElementById(id);

    if (field && value !== "") {
        field.value = value;
    }
}

function autoFillReport() {

    let text =
        testMessage.value;


    if (!text.trim()) {

        alert("Please paste the test message first.");

        return;
    }

    /* =========================
       CLEAR OLD AUTO-FILL DATA
    ========================= */

    let autoFillFields = [
        "reportDate",
        "rtpp1",
        "rtpp2",
        "chittoor1",
        "chittoor2",
        "import400",
        "importict",
        "totalImport",
        "rtpp1export",
        "rtpp2export",
        "chittoor1export",
        "chittoor2export",
        "export400",
        "exportict",
        "totalexport",
        "mdict",
        "mdict1",
        "mdict2",
        "mdictime",
        "totalgeneration",
        "maxvoltage",
        "minvoltage",
        "maxvoltagetime",
        "minvoltagetime",
        "busreactor",
        "Interruptions"
    ];

    autoFillFields.forEach(function(id) {

        let field =
            document.getElementById(id);

        if (field) {
            field.value = "";
        }

    });


    /* =========================
       DATE
    ========================= */

    let dateMatch =
        text.match(
            /consumption particulars on\s+(\d{2})[./-](\d{2})[./-](\d{4})/i
        );

    if (dateMatch) {

        setField(
            "reportDate",
            dateMatch[3] +
            "-" +
            dateMatch[2] +
            "-" +
            dateMatch[1]
        );
    }


    /* =========================
       IMPORT SECTION
    ========================= */

    let importSection =
        getSection(
            text,
            "(1) IMPORT",
            "(2) EXPORT"
        );


    setField(
        "rtpp1",
        getValue(
            importSection,
            /RTPP-1\s*=\s*([\d.]+)\s*MU/i
        )
    );


    setField(
        "rtpp2",
        getValue(
            importSection,
            /RTPP-2\s*=\s*([\d.]+)\s*MU/i
        )
    );


    setField(
        "chittoor1",
        getValue(
            importSection,
            /Chittoor-1\s*=\s*([\d.]+)\s*MU/i
        )
    );


    setField(
        "chittoor2",
        getValue(
            importSection,
            /Chittoor-2\s*=\s*([\d.]+)\s*MU/i
        )
    );


    setField(
        "importict",
        getValue(
            importSection,
            /ICTs\s+Import\s*=\s*([\d.]+)\s*MU/i
        )
    );


    /* =========================
       EXPORT SECTION
    ========================= */

    let exportSection =
        getSection(
            text,
            "(2) EXPORT",
            "(3) MD on ICTs"
        );


    setField(
        "rtpp1export",
        getValue(
            exportSection,
            /RTPP\s*-\s*1\s*[:=]\s*([\d.]+)\s*MU/i) || "0.000"
        
    );


    setField(
        "rtpp2export",
        getValue(
            exportSection,
            /RTPP\s*-\s*2\s*[:=]\s*([\d.])\s*MU/i) || "0.000"
    );


    setField(
        "chittoor1export",
        getValue(
            exportSection,
            /Chittoor-1\s*=\s*([\d.]+)\s*MU/i
        )
    );


    setField(
        "chittoor2export",
        getValue(
            exportSection,
            /Chittoor-2\s*=\s*([\d.]+)\s*MU/i
        )
    );


    setField(
        "exportict",
        getValue(
            exportSection,
            /ICTs\s+Export\s*=\s*([\d.]+)\s*MU/i
        )
    );


/* =========================
   MD ON ICTs
========================= */

let mdict1Match =
    text.match(
        /315\s*MVA\s*ICT-1\s*=\s*([\d.]+)\s*MW/i
    );

if (mdict1Match) {

    setField(
        "mdict1",
        mdict1Match[1]
    );
}


let mdict2Match =
    text.match(
        /315\s*MVA\s*ICT-2\s*=\s*([\d.]+)\s*MW/i
    );

if (mdict2Match) {

    setField(
        "mdict2",
        mdict2Match[1]
    );
}


let mdTimeMatch =
    text.match(
        /MD\s+on\s+ICTs\s*=\s*[\d.]+\s*MW\s*@\s*([0-9]{1,2}:[0-9]{2})\s*Hrs/i
    );

if (mdTimeMatch) {

    setField(
        "mdictime",
        mdTimeMatch[1]
    );
}

    /* =========================
       TOTAL GENERATION
    ========================= */

    let generationSection =
        getSection(
            text,
            "(4) Total generating units",
            "(5) 400KV Bus voltages"
        );


    setField(
        "totalgeneration",
        getValue(
            generationSection,
            /Total\s+generating\s+units\s*=\s*([\d.]+)\s*MU/i
        )
    );


    /* =========================
       BUS VOLTAGES
    ========================= */

    let voltageSection =
        getSection(
            text,
            "(5) 400KV Bus voltages",
            "(6) 400kV Bus Reactors"
        );


    setField(
        "maxvoltage",
        getValue(
            voltageSection,
            /Maximum\s*=\s*([\d.]+)\s*KV/i
        )
    );


    setField(
        "minvoltage",
        getValue(
            voltageSection,
            /Minimum\s*=\s*([\d.]+)\s*KV/i
        )
    );


    let maxTime =
        getValue(
            voltageSection,
            /Maximum\s*=\s*[\d.]+\s*KV\s*@\s*([0-9]{2}:[0-9]{2})/i
        );


    let minTime =
        getValue(
            voltageSection,
            /Minimum\s*=\s*[\d.]+\s*KV\s*@\s*([0-9]{2}:[0-9]{2})/i
        );


    setField(
        "maxvoltagetime",
        maxTime
    );


    setField(
        "minvoltagetime",
        minTime
    );


/* =========================
   BUS REACTOR
========================= */

let reactorMatch =
    text.match(
        /reactors?\s*[:\-=@\/!]\s(.+)/im
    );

if (reactorMatch) {

    setField(
        "busreactor",
        reactorMatch[1].trim()
    );
}

/* =========================
   INTERRUPTIONS
========================= */

let lines =
    text.split(/\r?\n/);

let interruptionIndex =
    lines.findIndex(line =>
        /interruptions?/i.test(line)
    );

if (interruptionIndex !== -1) {

    let interruptionLines = [];

    /* First line */
    let firstLine =
        lines[interruptionIndex]
            .replace(
                /^[\s\S]*\binterruptions?\b/i,
                ""
            )
            .replace(
                /^[\s:=\-\/!>]+/,
                ""
            )
            .trim();

    if (firstLine) {
        interruptionLines.push(firstLine);
    }

    /* Following lines */
    for (
        let i = interruptionIndex + 1;
        i < lines.length;
        i++
    ) {

        /* Stop at name / designation */
        if (
            /^\s*(DEE|AE|AEE|SE)\s*\/?/i.test(
                lines[i]
            )
        ) {
            break;
        }

        interruptionLines.push(
            lines[i].trim()
        );
    }

    /* REMOVE SIGNATURE / DESIGNATION */

let signatureIndex =
    interruptionLines.findIndex(line =>
        /DEPUTY EXECUTIVE ENGINEER|EXECUTIVE ENGINEER|ASSISTANT ENGINEER|SUPERINTENDING ENGINEER/i.test(line)
    );

if (signatureIndex !== -1) {

    /* Remove designation and everything after it */
    interruptionLines =
        interruptionLines.slice(0, signatureIndex);

    /* Remove person's name immediately before designation */
    while (
        interruptionLines.length > 0 &&
        interruptionLines[interruptionLines.length - 1].trim() === ""
    ) {
        interruptionLines.pop();
    }

    if (interruptionLines.length > 0) {
        interruptionLines.pop();
    }
}
    
    setField(
        "Interruptions",
        interruptionLines
            .join("\n")
            .trim()
    );
}
    /* =========================
       RECALCULATE
    ========================= */

    calculateImport();

    calculateexport400();

    calculatemdict();

    calculategeneration();


    alert(
        "Test message values filled successfully."
    );
}
/* =========================
   IMPORT CALCULATION
========================= */

function calculateImport() {

    let value1 = Number(rtpp1.value);
    let value2 = Number(rtpp2.value);
    let value3 = Number(chittoor1.value);
    let value4 = Number(chittoor2.value);

    import400.value =
        (value1 + value2 + value3 + value4).toFixed(3);

    calculatetotalimport();
}


function calculatetotalimport() {

    let value1 = Number(import400.value);
    let value2 = Number(importict.value);

    totalImport.value =
        (value1 + value2).toFixed(3);
}


rtpp1.addEventListener("input", calculateImport);
rtpp2.addEventListener("input", calculateImport);
chittoor1.addEventListener("input", calculateImport);
chittoor2.addEventListener("input", calculateImport);

import400.addEventListener("input", calculatetotalimport);
importict.addEventListener("input", calculatetotalimport);


/* =========================
   EXPORT
========================= */

let rtpp1export = document.getElementById("rtpp1export");
let rtpp2export = document.getElementById("rtpp2export");
let chittoor1export = document.getElementById("chittoor1export");
let chittoor2export = document.getElementById("chittoor2export");

let export400 = document.getElementById("export400");
let exportict = document.getElementById("exportict");
let totalexport = document.getElementById("totalexport");


function calculateexport400() {

    let value1 = Number(rtpp1export.value);
    let value2 = Number(rtpp2export.value);
    let value3 = Number(chittoor1export.value);
    let value4 = Number(chittoor2export.value);

    export400.value =
        (value1 + value2 + value3 + value4).toFixed(3);

    calculatetotalexport();
}


function calculatetotalexport() {

    let value1 = Number(export400.value);
    let value2 = Number(exportict.value);

    totalexport.value =
        (value1 + value2).toFixed(3);
}


rtpp1export.addEventListener("input", calculateexport400);
rtpp2export.addEventListener("input", calculateexport400);
chittoor1export.addEventListener("input", calculateexport400);
chittoor2export.addEventListener("input", calculateexport400);

export400.addEventListener("input", calculatetotalexport);
exportict.addEventListener("input", calculatetotalexport);


/* =========================
   MD ON ICTs
========================= */

let mdict1 = document.getElementById("mdict1");
let mdict2 = document.getElementById("mdict2");
let mdict = document.getElementById("mdict");


function calculatemdict() {

    let value1 = Number(mdict1.value);
    let value2 = Number(mdict2.value);

    mdict.value =
        (value1 + value2).toFixed(2);
}


mdict1.addEventListener("input", calculatemdict);
mdict2.addEventListener("input", calculatemdict);


/* =========================
   TOTAL GENERATION
========================= */

let totalgeneration =
    document.getElementById("totalgeneration");


function calculategeneration() {

    let value1 = Number(rtpp1.value);
    let value2 = Number(rtpp2.value);

    totalgeneration.value =
        (value1 + value2).toFixed(3);
}


rtpp1.addEventListener("input", calculategeneration);
rtpp2.addEventListener("input", calculategeneration);

calculategeneration();


/* =========================
   OTHER ELEMENTS
========================= */

let busreactor =
    document.getElementById("busreactor");

let interruptions =
    document.getElementById("Interruptions");

let reportName =
    document.getElementById("reportName");


/* =========================
   TIME FORMAT
========================= */

function formatReportTime(time) {

    if (time === "00:00") {
        return "24:00";
    }

    return time;
}


/* =========================
   GENERATE REPORT
========================= */

let generateReport =
    document.getElementById("generateReport");

generateReport.addEventListener(
    "click",
    generateReportFunction
);


function generateReportFunction() {

    function formatLine(name, value, unit = "MU") {

        const namePart =
            name.padEnd(20, " ");

        const valuePart =
            Number(value).toFixed(3).padStart(6, " ");

        return namePart +
            " = " +
            valuePart +
            " " +
            unit;
    }


    /* =========================
       REPORT DATE
    ========================= */

    let reportDate =
        new Date(
            document.getElementById("reportDate").value +
            "T00:00:00"
        );


    reportDate =
        String(reportDate.getDate()).padStart(2, "0") +
        "/" +
        String(reportDate.getMonth() + 1).padStart(2, "0") +
        "/" +
        reportDate.getFullYear();


    /* =========================
       WHATSAPP REPORT
    ========================= */

    let report =
        "Good Morning Sir.\n";

    report +=
        "\n*400KV SS Kalikiri Consumption Particulars on " +
        reportDate +
        ":*\n\n";


    /* IMPORT */

    report += "\n*1. IMPORT*\n";

    report +=
        "\n" + formatLine("RTPP-1", rtpp1.value);

    report +=
        "\n" + formatLine("RTPP-2", rtpp2.value);

    report +=
        "\n" + formatLine("Chittoor-1", chittoor1.value);

    report +=
        "\n" + formatLine("Chittoor-2", chittoor2.value);

    report +=
        "\n" + formatLine("400KV Import", import400.value);

    report +=
        "\n" + formatLine("ICTs Import", importict.value);

    report +=
        "\n" + formatLine("TOTAL IMPORT", totalImport.value);


    /* EXPORT */

    report += "\n\n*2. EXPORT*\n";

    report +=
        "\nRTPP-1=" +
        Number(rtpp1export.value).toFixed(3) +
        "MU";

    report +=
        "\nRTPP-2=" +
        Number(rtpp2export.value).toFixed(3) +
        "MU";

    report +=
        "\nChittoor-1=" +
        Number(chittoor1export.value).toFixed(3) +
        "MU";

    report +=
        "\nChittoor-2=" +
        Number(chittoor2export.value).toFixed(3) +
        "MU";

    report +=
        "\n400KV Export=" +
        Number(export400.value).toFixed(3) +
        "MU";

    report +=
        "\nICTs Export=" +
        Number(exportict.value).toFixed(3) +
        "MU";

    report +=
        "\nTOTAL EXPORT=" +
        Number(totalexport.value).toFixed(3) +
        "MU";


    /* MD ON ICTs */

    report +=
        "\n\n*3. MD on ICTs* = " +
        Number(mdict.value).toFixed(2) +
        " MW @" +
        formatReportTime(mdictime.value) +
        " Hrs.\n";

    report +=
        "\n 315 MVA ICT-1= " +
        Number(mdict1.value).toFixed(2) +
        "MW.";

    report +=
        "\n 315 MVA ICT-2= " +
        Number(mdict2.value).toFixed(2) +
        "MW.";


    /* TOTAL GENERATION */

    report +=
        "\n\n*4. Total Generation Units* = " +
        Number(totalgeneration.value).toFixed(3) +
        " MU\n";


    /* BUS VOLTAGES */

    report +=
        "\n\n*5. 400 KV Bus Voltages:*\n";

    report +=
        "\n Maximum = " +
        Number(maxvoltage.value).toFixed(2) +
        " KV @" +
        formatReportTime(maxvoltagetime.value) +
        " Hrs.";

    report +=
        "\n Minimum = " +
        Number(minvoltage.value).toFixed(2) +
        " KV @" +
        formatReportTime(minvoltagetime.value) +
        " Hrs.";


    /* BUS REACTOR */

    report +=
        "\n\n*6. 400KV Bus Reactor* : " +
        busreactor.value +
        "\n";


    /* INTERRUPTIONS */

    report +=
        "\n\n*7. Interruptions* : " +
        interruptions.value +
        "\n";


    report +=
        "\n " + reportName.value;

    report +=
        "\n Deputy Executive Engineer";

    report +=
        "\n 400KV SS Kalikiri";


    window.lastReport = report;
    /* =========================
SAVE REPORT DATE-WISE
========================= */

const selectedDate =
document.getElementById("reportDate").value;

if (selectedDate) {
const savedReports =
JSON.parse(
localStorage.getItem("kalikiriReports") || "{}"
);

savedReports[selectedDate] = report;

localStorage.setItem(
    "kalikiriReports",
    JSON.stringify(savedReports)
);
if (typeof window.saveReportToCloud === "function") {
    window.saveReportToCloud(selectedDate, report);
}
}


    /* =====================================================
       REPORT WINDOW
    ===================================================== */

    let reportWindow =
        window.open(
            "",
            "_blank",
            "width=900,height=900"
        );


    reportWindow.document.write(`

<html>

<head>

<title>
400 KV SS Kalikiri Consumption Report
</title>


<style>

@page {
    size: A4 portrait;
    margin: 7mm;
}


body {

    font-family:
        "Times New Roman",
        Times,
        serif;

    font-size: 12pt;

    margin: 0;
    padding: 0;

    line-height: 1;

    color: black;
    background: white;
}


.report {

    width: 100%;

    max-width: 760px;

    margin: 0 auto;

    padding: 0;
}


.good-morning {

    font-size: 12pt;

    font-weight: bold;

    margin: 0 0 4px 0;

    padding: 0;
}


.title {

    color: blue;

    font-weight: bold;

    font-size: 14pt;

    margin: 0 0 7px 0;

    padding: 0;

    line-height: 1.05;
}


.section {

    color: #5b2a83;

    font-weight: bold;

    font-size: 13pt;

    text-decoration: underline;

    margin: 6px 0 2px 0;

    padding: 0;

    line-height: 1;
}


.row {

    display: grid;

    grid-template-columns:
        145px
        18px
        75px
        1fr;

    column-gap: 2px;

    align-items: center;

    height: 18px;

    min-height: 18px;

    margin: 0;

    padding: 0;

    line-height: 18px;
}


.row span {

    font-family:
        "Times New Roman",
        Times,
        serif;

    font-size: 12pt;

    margin: 0;

    padding: 0;

    line-height: 18px;
}


.row .name {

    grid-column: 1;

    white-space: nowrap;
}


.row .equal {

    grid-column: 2;

    text-align: left;
}


.row .value {

    grid-column: 3;

    font-weight: bold;

    text-align: left;

    white-space: nowrap;
}


.row .unit {

    grid-column: 4;

    white-space: nowrap;
}


.row .total {

    color: red;

    font-weight: bold;
}


.signature {

    width: 100%;

    text-align: center;

    color: #4b2a73;

    font-weight: bold;

    margin-top: 10px;

    line-height: 1.25;

    font-size: 12pt;
}


.report-button {

    display: block;

    margin: 8px auto 0 auto;

    padding: 7px 18px;

    font-size: 12pt;

    font-family:
        "Times New Roman",
        Times,
        serif;

    font-weight: bold;

    cursor: pointer;
}


@media print {

    @page {

        size: A4 portrait;

        margin: 7mm;
    }


    body {

        font-family:
            "Times New Roman",
            Times,
            serif !important;

        font-size: 12pt !important;

        line-height: 1 !important;

        margin: 0 !important;

        padding: 0 !important;
    }


    .report {

        width: 100% !important;

        max-width: none !important;

        margin: 0 !important;

        padding: 0 !important;
    }


    .row {

        height: 18px !important;

        min-height: 18px !important;

        margin: 0 !important;

        padding: 0 !important;

        line-height: 18px !important;
    }


    .row span {

        font-size: 12pt !important;

        line-height: 18px !important;

        margin: 0 !important;

        padding: 0 !important;
    }


    .section {

        margin-top: 5px !important;

        margin-bottom: 2px !important;
    }


    .title {

        margin-bottom: 5px !important;
    }


    .signature {

        margin-top: 8px !important;
    }


    .report-button {

        display: none !important;
    }

}

</style>

</head>


<body>


<div class="report">


<div class="good-morning">
Good morning sir.
</div>


<div class="title">
400 KV SS KALIKIRI Consumption Particulars on ${reportDate}
</div>


<div class="section">
(1) IMPORT
</div>


<div class="row">
<span class="name">RTPP-1</span>
<span class="equal">=</span>
<span class="value">${rtpp1.value}</span>
<span class="unit">MU</span>
</div>


<div class="row">
<span class="name">RTPP-2</span>
<span class="equal">=</span>
<span class="value">${rtpp2.value}</span>
<span class="unit">MU</span>
</div>


<div class="row">
<span class="name">Chittoor-1</span>
<span class="equal">=</span>
<span class="value">${chittoor1.value}</span>
<span class="unit">MU</span>
</div>


<div class="row">
<span class="name">Chittoor-2</span>
<span class="equal">=</span>
<span class="value">${chittoor2.value}</span>
<span class="unit">MU</span>
</div>


<div class="row">
<span class="name">400KV Import</span>
<span class="equal">=</span>
<span class="value">${import400.value}</span>
<span class="unit">MU</span>
</div>


<div class="row">
<span class="name">ICTs Import</span>
<span class="equal">=</span>
<span class="value">${importict.value}</span>
<span class="unit">MU</span>
</div>


<div class="row">
<span class="name">TOTAL IMPORT</span>
<span class="equal">=</span>
<span class="value total">${totalImport.value}</span>
<span class="unit">MU</span>
</div>


<div class="section">
(2) EXPORT
</div>


<div class="row">
<span class="name">RTPP-1</span>
<span class="equal">=</span>
<span class="value">${rtpp1export.value}</span>
<span class="unit">MU</span>
</div>


<div class="row">
<span class="name">RTPP-2</span>
<span class="equal">=</span>
<span class="value">${rtpp2export.value}</span>
<span class="unit">MU</span>
</div>


<div class="row">
<span class="name">Chittoor-1</span>
<span class="equal">=</span>
<span class="value">${chittoor1export.value}</span>
<span class="unit">MU</span>
</div>


<div class="row">
<span class="name">Chittoor-2</span>
<span class="equal">=</span>
<span class="value">${chittoor2export.value}</span>
<span class="unit">MU</span>
</div>


<div class="row">
<span class="name">400KV Export</span>
<span class="equal">=</span>
<span class="value">${export400.value}</span>
<span class="unit">MU</span>
</div>


<div class="row">
<span class="name">ICTs Export</span>
<span class="equal">=</span>
<span class="value">${exportict.value}</span>
<span class="unit">MU</span>
</div>


<div class="row">
<span class="name">TOTAL EXPORT</span>
<span class="equal">=</span>
<span class="value total">${totalexport.value}</span>
<span class="unit">MU</span>
</div>


<div class="section">
(3) MD on ICTs
</div>


<div class="row">
<span class="name">MD on ICTs</span>
<span class="equal">=</span>
<span class="value">${Number(mdict.value).toFixed(2)}</span>
<span class="unit">
MW @ ${formatReportTime(mdictime.value)} Hrs.
</span>
</div>


<div class="row">
<span class="name">315MVA ICT-1</span>
<span class="equal">=</span>
<span class="value">${Number(mdict1.value).toFixed(2)}</span>
<span class="unit">MW</span>
</div>


<div class="row">
<span class="name">315MVA ICT-2</span>
<span class="equal">=</span>
<span class="value">${Number(mdict2.value).toFixed(2)}</span>
<span class="unit">MW</span>
</div>


<div class="section">
(4) Total Generation Units
</div>


<div class="row">
<span class="name">Total Generation Units</span>
<span class="equal">=</span>
<span class="value">${Number(totalgeneration.value).toFixed(3)}</span>
<span class="unit">MU</span>
</div>


<div class="section">
(5) 400KV Bus Voltages
</div>


<div class="row">
<span class="name">Maximum</span>
<span class="equal">=</span>
<span class="value">${Number(maxvoltage.value).toFixed(2)}</span>
<span class="unit">
KV @ ${formatReportTime(maxvoltagetime.value)} Hrs.
</span>
</div>


<div class="row">
<span class="name">Minimum</span>
<span class="equal">=</span>
<span class="value">${Number(minvoltage.value).toFixed(2)}</span>
<span class="unit">
KV @ ${formatReportTime(minvoltagetime.value)} Hrs.
</span>
</div>


<div class="section">
(6) 400KV Bus Reactor
</div>


<div class="row">
<span class="name">400KV Bus Reactor</span>
<span class="equal">=</span>
<span class="value">${busreactor.value}</span>
<span class="unit"></span>
</div>


<div class="section">
(7) Interruptions
</div>


<div style="margin-top: 10px; width: 100%;">

    <div style="margin-bottom: 5px;">
        <span class="name">Interruptions</span>
        <span class="equal">=</span>
    </div>

    <div style="margin-left: 150px; width: 500px; white-space: pre-wrap; overflow-wrap: break-word; line-height: 1.4;">
        ${interruptions.value}
    </div>

</div>


<div class="signature" style="clear: both; position: static; margin-top: 25px; text-align: center;">

${reportName.value}

<br>

Deputy Executive Engineer

<br>

400KV SS Kalikiri.

</div>


<button
class="report-button"
onclick="window.print()">
Download PDF
</button>


<button
class="report-button"
onclick="window.opener.downloadWord(document.documentElement.outerHTML)">
Download Word
</button>
<button
    class="report-button"
    onclick="window.opener.downloadExcel(document.documentElement.outerHTML)">
    Download Excel
</button>

</div>


</body>

</html>

`);


    reportWindow.document.close();
}
function downloadExcel() {

    const excelHTML = `
<!DOCTYPE html>
<html>
<head>
<meta charset="UTF-8">

<style>

body {
    font-family: "Times New Roman", Times, serif;
    font-size: 12pt;
}

table {
    border-collapse: collapse;
    width: 100%;
}

td {
    border: 1px solid #999;
    padding: 4px 6px;
}

.title {
    color: blue;
    font-weight: bold;
    font-size: 15pt;
}

.section {
    color: #5b2a83;
    font-weight: bold;
    font-size: 13pt;
}

.value {
    color: green;
    font-weight: bold;
}

.total {
    color: red;
    font-weight: bold;
}

</style>
</head>

<body>

<table>

<tr>
<td colspan="4" class="title">
400 KV SS KALIKIRI Consumption Particulars
</td>
</tr>

<tr>
<td colspan="4">
<b>Good Morning Sir.</b>
</td>
</tr>

<tr>
<td colspan="4" class="section">IMPORT</td>
</tr>

<tr><td>RTPP-1</td><td>=</td><td class="value">${rtpp1.value}</td><td>MU</td></tr>
<tr><td>RTPP-2</td><td>=</td><td class="value">${rtpp2.value}</td><td>MU</td></tr>
<tr><td>Chittoor-1</td><td>=</td><td class="value">${chittoor1.value}</td><td>MU</td></tr>
<tr><td>Chittoor-2</td><td>=</td><td class="value">${chittoor2.value}</td><td>MU</td></tr>
<tr><td>400KV Import</td><td>=</td><td class="value">${import400.value}</td><td>MU</td></tr>
<tr><td>ICTs Import</td><td>=</td><td class="value">${importict.value}</td><td>MU</td></tr>
<tr><td class="total">TOTAL IMPORT</td><td>=</td><td class="total">${totalImport.value}</td><td class="total">MU</td></tr>

<tr>
<td colspan="4" class="section">EXPORT</td>
</tr>

<tr><td>RTPP-1</td><td>=</td><td class="value">${rtpp1export.value}</td><td>MU</td></tr>
<tr><td>RTPP-2</td><td>=</td><td class="value">${rtpp2export.value}</td><td>MU</td></tr>
<tr><td>Chittoor-1</td><td>=</td><td class="value">${chittoor1export.value}</td><td>MU</td></tr>
<tr><td>Chittoor-2</td><td>=</td><td class="value">${chittoor2export.value}</td><td>MU</td></tr>
<tr><td>400KV Export</td><td>=</td><td class="value">${export400.value}</td><td>MU</td></tr>
<tr><td>ICTs Export</td><td>=</td><td class="value">${exportict.value}</td><td>MU</td></tr>
<tr><td class="total">TOTAL EXPORT</td><td>=</td><td class="total">${totalexport.value}</td><td class="total">MU</td></tr>

<tr>
<td colspan="4" class="section">MD on ICTs</td>
</tr>

<tr><td>MD on ICTs</td><td>=</td><td class="value">${mdict.value}</td><td>MW</td></tr>
<tr><td>315 MVA ICT-1</td><td>=</td><td class="value">${mdict1.value}</td><td>MW</td></tr>
<tr><td>315 MVA ICT-2</td><td>=</td><td class="value">${mdict2.value}</td><td>MW</td></tr>

<tr>
<td colspan="4" class="section">Total Generation Units</td>
</tr>

<tr><td>Total Generation Units</td><td>=</td><td class="value">${totalgeneration.value}</td><td>MU</td></tr>

<tr>
<td colspan="4" class="section">400KV Bus Voltages</td>
</tr>

<tr><td>Maximum</td><td>=</td><td class="value">${maxvoltage.value}</td><td>KV</td></tr>
<tr><td>Minimum</td><td>=</td><td class="value">${minvoltage.value}</td><td>KV</td></tr>

<tr>
<td colspan="4" class="section">400KV Bus Reactor</td>
</tr>

<tr><td>Bus Reactor</td><td>=</td><td class="value">${busreactor.value}</td><td></td></tr>

<tr>
<td colspan="4" class="section">Interruptions</td>
</tr>

<tr><td colspan="4" style="white-space: pre-wrap; overflow-wrap: anywhere;">${interruptions.value}</td></tr>

</table>

</body>
</html>
`;

    const blob = new Blob(
        [excelHTML],
        { type: "application/vnd.ms-excel" }
    );

    const url = URL.createObjectURL(blob);

    const link = document.createElement("a");

    link.href = url;

    link.download =
        "Kalikiri_Consumption_Report.xls";

    document.body.appendChild(link);

    link.click();

    document.body.removeChild(link);

    URL.revokeObjectURL(url);
}

/* =========================
   DOWNLOAD WORD
========================= */

function downloadWord(content) {

    const parser = new DOMParser();
    const doc = parser.parseFromString(content, "text/html");

    doc.querySelectorAll("button").forEach(button => button.remove());

const reportContent = doc.body.innerHTML;

    const wordHTML = `
<!DOCTYPE html>
<html>
<head>
<meta charset="UTF-8">

<style>

@page {
    size: A4;
    margin: 15mm;
}

body {
    font-family: "Times New Roman", Times, serif;
    font-size: 12pt;
    line-height: 1.05;
    margin: 0;
    padding: 0;
}

.report {
    width: 100%;
}

.title {
    color: blue;
    font-weight: bold;
    font-size: 15pt;
    margin: 4px 0;
}

.section {
    color: #5b2a83;
    font-weight: bold;
    font-size: 13pt;
    text-decoration: underline;
    margin-top: 7px;
    margin-bottom: 2px;
}

.row {
    display: grid;
    grid-template-columns: 145px 18px 75px 160px;
    column-gap: 2px;
    margin: 0;
    padding: 0;
    min-height: 19px;
    line-height: 19px;
}

.row span {
    font-family: "Times New Roman", Times, serif;
    font-size: 12pt;
    margin: 0;
    padding: 0;
}

.name {
    color: #333333;
}

.value {
    color: green;
    font-weight: bold;
}

.total {
    color: red;
    font-weight: bold;
}

button {
    display: none;
}

</style>
</head>

<body>

<div class="report">

${reportContent}

</div>

</body>
</html>
`;

    const blob = new Blob(
        [wordHTML],
        { type: "application/msword" }
    );

    const url = URL.createObjectURL(blob);

    const link = document.createElement("a");

    link.href = url;
    link.download = "Kalikiri_Consumption_Report.doc";

    document.body.appendChild(link);

    link.click();

    document.body.removeChild(link);

    URL.revokeObjectURL(url);
}


/* =========================
   DATE & TIME
========================= */

function updateDateTime() {

    let now = new Date();

    let year = now.getFullYear();
    let month = now.getMonth();
    let day = now.getDate();

    let hours = now.getHours();
    let minutes = now.getMinutes();
    let seconds = now.getSeconds();


    let formattedDate =
        String(day).padStart(2, "0") +
        "/" +
        String(month + 1).padStart(2, "0") +
        "/" +
        year;


    let ampm =
        hours >= 12 ? "PM" : "AM";


    let displayHours =
        hours % 12;


    displayHours =
        displayHours === 0 ? 12 : displayHours;


    let formattedTime =
        displayHours +
        ":" +
        String(minutes).padStart(2, "0") +
        ":" +
        String(seconds).padStart(2, "0") +
        " " +
        ampm;


    document.getElementById("dateTime").innerText =
        "Date:" +
        formattedDate +
        "  |  Time:" +
        formattedTime;
}


updateDateTime();

setInterval(
    updateDateTime,
    1000
);


/* =========================
   SERVICE STATUS
========================= */

let status =
    document.getElementById("status");

let changeStatus =
    document.getElementById("changeStatus");


changeStatus.onclick =
function () {

    if (
        status.innerText ===
        "Status: In Service"
    ) {

        status.innerText =
            "Status : Out of Service";

        status.style.color =
            "red";

        changeStatus.innerText =
            "Restore Service";

    } else {

        status.innerText =
            "Status: In Service";

        status.style.color =
            "green";

        changeStatus.innerText =
            "Take Out of Service";
    }
};


/* =========================
   INTERRUPTIONS AUTO HEIGHT
========================= */

interruptions.addEventListener(
    "input",
    function () {

        this.style.height = "auto";

        this.style.height =
            this.scrollHeight + "px";
    }
);


/* =========================
   WHATSAPP SHARE
========================= */

const shareWhatsApp =
    document.getElementById("shareWhatsApp");


shareWhatsApp.addEventListener(
    "click",
    function () {

        if (!window.lastReport) {

            alert(
                "Please Generate Report first."
            );

            return;
        }


        function whatsappFormat(report) {

            function line(name, value) {

                const valuePart =
                    Number(value)
                        .toFixed(3)
                        .padStart(6, " ");

                return (
                    name.padEnd(14, " ") +
                    " = " +
                    valuePart +
                    " MU"
                );
            }


            function blankLine(name) {
                return (
            name.padEnd(14, " ") +
            " =       MU"
        );
    }


    return report

        .replace(
            /^\s*\(1\)IMPORT/m,
            "(1) IMPORT"
        )


        /* IMPORT */

        .replace(
            /RTPP-1\s*=\s*([0-9.]+)\s*MU/g,
            (_, value) =>
                line("RTPP-1", value)
        )

        .replace(
            /RTPP-2\s*=\s*([0-9.]+)\s*MU/g,
            (_, value) =>
                line("RTPP-2", value)
        )

        .replace(
            /Chittoor-1\s*=\s*([0-9.]+)\s*MU/g,
            (_, value) =>
                line("Chittoor-1", value)
        )

        .replace(
            /Chittoor-2\s*=\s*([0-9.]+)\s*MU/g,
            (_, value) =>
                line("Chittoor-2", value)
        )

        .replace(
            /400KV Import\s*=\s*([0-9.]+)\s*MU/g,
            (_, value) =>
                line("400KV Import", value)
        )

        .replace(
            /ICTs Import\s*=\s*([0-9.]+)\s*MU/g,
            (_, value) =>
                line("ICTs Import", value)
        )

        .replace(
            /TOTAL IMPORT\s*=\s*([0-9.]+)\s*MU/g,
            (_, value) =>
                line("TOTAL IMPORT", value)
        )


        /* EXPORT */

        .replace(
            /RTPP-1\s*=\s*([0-9.]+)\s*MU/g,
            (_, value) =>
            line("RTPP-1", value)
)

        .replace(
            /RTPP-2\s*=\s*([0-9.]+)\s*MU/g,
            (_, value) =>
            line("RTPP-2", value)
)

        .replace(
            /Chittoor-1\s*=\s*([0-9.]+)\s*MU/g,
            (_, value) =>
            line("Chittoor-1", value)
)

        .replace(
            /Chittoor-2\s*=\s*([0-9.]+)\s*MU/g,
            (_, value) =>
            line("Chittoor-2", value)
)
       
        .replace(
            /400KV Export\s*=\s*([0-9.]+)\s*MU/g,
            (_, value) =>
                line("400KV Export", value)
        )

        .replace(
            /ICTs Export\s*=\s*([0-9.]+)\s*MU/g,
            (_, value) =>
                line("ICTs Export", value)
        )

        .replace(
            /TOTAL EXPORT\s*=\s*([0-9.]+)\s*MU/g,
            (_, value) =>
                line("TOTAL EXPORT", value)
        )


        /* MD ON ICTs */

        .replace(
            /MD on ICTs\s*=\s*([0-9.]+)\s*MW\s*@\s*([0-9]+):([0-9]+)\s*Hrs\./g,

            (_, value, hour, minute) =>
                `MD on ICTs = ${value} MW @ ${hour}:${minute} Hrs.`
        )

    
        .replace(
            /315 MVA ICT-1\s*=\s*([0-9.]+)\s*MW\./g,

            (_, value) =>
                `315 MVA ICT-1 = ${value} MW.`
        )


        .replace(
            /315 MVA ICT-2\s*=\s*([0-9.]+)\s*MW\./g,

            (_, value) =>
                `315 MVA ICT-2 = ${value} MW.`
        )


        /* GENERATION */

        .replace(
            /Total Generation Units\s*=\s*([0-9.]+)\s*MU/g,

            (_, value) =>
                `Total Generation Units = ${value} MU`
        )


        /* VOLTAGES */

        .replace(
            /Maximum\s*=\s*([0-9.]+)\s*KV\s*@\s*([0-9]+):([0-9]+)\s*Hrs\./g,

            (_, value, hour, minute) =>
                `Maximum = ${value} KV @ ${hour}:${minute} Hrs.`
        )

        .replace(
            /Minimum\s*=\s*([0-9.]+)\s*KV\s*@\s*([0-9]+):([0-9]+)\s*Hrs\./g,

            (_, value, hour, minute) =>
                `Minimum = ${value} KV @ ${hour}:${minute} Hrs.`
        )


        /* BUS REACTOR */

        .replace(
            /400KV Bus Reactor\s*=\s*/g,
            "400KV Bus Reactor = "
        )


        /* INTERRUPTIONS */

        .replace(
            /Interruptions\s*=\s*/g,
            "Interruptions = "
        );
}


const whatsappText =
    "" +
    whatsappFormat(window.lastReport)
        .replace(/\*/g, "")
        .replace(/\n@/g, " @") +
    "";


const whatsappUrl =
    "https://wa.me/?text=" +
    encodeURIComponent(
        whatsappText
    );


window.open(
    whatsappUrl,
    "_blank"
);

    }
);
/* Monthly Calendar */
const calendarMonth = document.getElementById("calendarMonth");
const calendarDays = document.getElementById("calendarDays");
const prevMonth = document.getElementById("prevMonth");
const nextMonth = document.getElementById("nextMonth");

let calendarDate = new Date();

function renderCalendar() {
    const year = calendarDate.getFullYear();
    const month = calendarDate.getMonth();

    calendarMonth.textContent =
        calendarDate.toLocaleDateString("en-IN", {
            month: "long",
            year: "numeric"
        });

    calendarDays.innerHTML = "";

    ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"]
        .forEach(day => {
            const heading = document.createElement("div");
            heading.className = "calendarWeekday";
            heading.textContent = day;
            calendarDays.appendChild(heading);
        });

    const firstDay = new Date(year, month, 1).getDay();
    const daysInMonth = new Date(year, month + 1, 0).getDate();
    const today = new Date();

    for (let i = 0; i < firstDay; i++) {
        calendarDays.appendChild(document.createElement("div"));
    }

    for (let day = 1; day <= daysInMonth; day++) {
        const button = document.createElement("button");
        button.type = "button";
        button.className = "calendarDay";
        button.textContent = day;
        const selectedDate = new Date(year, month, day);
        const dateKey = [
    selectedDate.getFullYear(),
    String(selectedDate.getMonth() + 1).padStart(2, "0"),
    String(selectedDate.getDate()).padStart(2, "0")
].join("-");

const savedReports = JSON.parse(
    localStorage.getItem("kalikiriReports") || "{}"
);

if (savedReports[dateKey]) {
    button.title = "Saved Report Available";
    button.classList.add("hasReport");
    button.addEventListener("mouseenter", () => {
    if (savedReports[dateKey]) {
        const report = savedReports[dateKey];

       const popup = document.createElement("div");
popup.textContent = report;
popup.style.cssText = `
    position: fixed;
top: 10%;
left: 60%;
transform: translateX(-50%);
width: 340px;
max-width: 90vw;
height: 70vh;
overflow-y: auto;
overscroll-behavior: contain;
-webkit-overflow-scrolling: touch;
white-space: pre-wrap;
background: white;
color: black;
padding: 20px;
border: 2px solid green;
border-radius: 10px;
z-index: 99999;
`;
document.body.appendChild(popup);
popup.addEventListener("mouseenter", () => {
    popup.dataset.keepOpen = "true";
});
let closeTimer;

button.addEventListener("mouseleave", () => {
    closeTimer = setTimeout(() => {
        if (!popup.matches(":hover")) {
            popup.remove();
        }
    }, 300);
});

popup.addEventListener("mouseenter", () => {
    clearTimeout(closeTimer);
});

popup.addEventListener("mouseleave", () => {
    popup.remove();
});
    }
});
} else {
    button.title = "No report saved for this date";
}
        if (
            day === today.getDate() &&
            month === today.getMonth() &&
            year === today.getFullYear()
        ) {
            button.classList.add("today");
        }

        button.addEventListener("click", () => {
         
            const dateString = [
                selectedDate.getFullYear(),
                String(selectedDate.getMonth() + 1).padStart(2, "0"),
                String(selectedDate.getDate()).padStart(2, "0")
            ].join("-");

            document.getElementById("reportDate").value = dateString;
            document.getElementById("reportDate").dispatchEvent(
                new Event("change", { bubbles: true })
            );
        });
        button.addEventListener("click", () => {
            const savedReports = JSON.parse(
                localStorage.getItem("kalikiriReports") || "{}"
            );

            const report = savedReports[dateKey];

            if (report) {
                document.getElementById("reportDate").value = dateKey;

if (typeof report === "string") {
    document.getElementById("reportOutput").textContent = report;
} else {
    console.log(report);
    alert("Report data found. Output element ID needs checking.");
}
            } else {
                alert("No report saved for " + dateKey);
            }
        });    

        calendarDays.appendChild(button);
    }
}

prevMonth.addEventListener("click", () => {
    calendarDate.setMonth(calendarDate.getMonth() - 1);
    renderCalendar();
});

nextMonth.addEventListener("click", () => {
    calendarDate.setMonth(calendarDate.getMonth() + 1);
    renderCalendar();
});

renderCalendar();