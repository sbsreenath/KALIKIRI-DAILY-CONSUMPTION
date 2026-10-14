/* FEEDER AND ICT SETTINGS */
const monthlyMeterSettings = {
  rtpp1: {
    name: "RTPP-1",
    firstEnd: "Kalikiri",
    secondEnd: "RTPP",
    firstMF: 1000000 / 3,
    secondMF: 1000000
  },

  rtpp2: {
    name: "RTPP-2",
    firstEnd: "Kalikiri",
    secondEnd: "RTPP",
    firstMF: 1000000 / 3,
    secondMF: 1000000
  },

  chittoor1: {
    name: "Chittoor-1",
    firstEnd: "Kalikiri",
    secondEnd: "Chittoor",
    firstMF: 1000000 / 3,
    secondMF: 2000000
  },

  chittoor2: {
    name: "Chittoor-2",
    firstEnd: "Kalikiri",
    secondEnd: "Chittoor",
    firstMF: 1000000 / 3,
    secondMF: 2000000
  },

  ict1: {
    name: "ICT-1",
    firstEnd: "HV",
    secondEnd: "LV",
    firstMF: 1000000 / 6,
    secondMF: 1000
  },

  ict2: {
    name: "ICT-2",
    firstEnd: "HV",
    secondEnd: "LV",
    firstMF: 1000000 / 6,
    secondMF: 1000
  },

  kalikiri1: {
    name: "Kalikiri-1",
    firstEnd: "Kalikiri SS",
    secondEnd: "Other End",
    firstMF: 500,
    secondMF: 1000
  },

  kalikiri2: {
    name: "Kalikiri-2",
    firstEnd: "Kalikiri SS",
    secondEnd: "Other End",
    firstMF: 500,
    secondMF: 1000
  },

  madanapalli1: {
    name: "Madanapalli-1",
    firstEnd: "Kalikiri SS",
    secondEnd: "Other End",
    firstMF: 500,
    secondMF: 1000
  },

  madanapalli2: {
    name: "Madanapalli-2",
    firstEnd: "Kalikiri SS",
    secondEnd: "Other End",
    firstMF: 500,
    secondMF: 1000
  }
};
/* PAGE ELEMENTS */
const registerMonth = document.getElementById("registerMonth");
registerMonth.value = window.energyReportDate.get().slice(0, 7);
const registerPanel = document.getElementById("registerPanel");
const registerTitle = document.getElementById("registerTitle");
const registerStatus = document.getElementById("registerStatus");
const formulaBox = document.getElementById("formulaBox");
const openingReadings = document.getElementById("openingReadings");
const monthlyTableHead = document.getElementById("monthlyTableHead");
const monthlyTableBody = document.getElementById("monthlyTableBody");
const registerCaption = document.getElementById("registerCaption");

let selectedMonthlyFeeder = "";

/* FOUR READING CHANNELS */
function getMonthlyChannels(settings) {
  const firstLabel = settings.firstEnd === "HV"
    ? "HV Side"
    : settings.firstEnd + " End";

  const secondLabel = settings.secondEnd === "LV"
    ? "LV Side"
    : settings.secondEnd === "Other End"
      ? "Other End"
      : settings.secondEnd + " End";

  return [
    { key: "firstImport", label: firstLabel + " Import" },
    { key: "firstExport", label: firstLabel + " Export" },
    { key: "secondImport", label: secondLabel + " Import" },
    { key: "secondExport", label: secondLabel + " Export" }
  ];
}

window.monthlyMeterConfiguration = {settings: monthlyMeterSettings, channels: getMonthlyChannels};

/* CREATE THE SELECTED MONTH REGISTER */
function createMonthlyRegister() {
  if (!registerMonth.value || !selectedMonthlyFeeder) {
    registerPanel.hidden = true;
    registerStatus.textContent = "Select a month and feeder.";
    return;
  }

  const settings = monthlyMeterSettings[selectedMonthlyFeeder];
  const channels = getMonthlyChannels(settings);

  const [year, month] = registerMonth.value.split("-").map(Number);
  const daysInMonth = new Date(year, month, 0).getDate();

  const monthLabel = new Date(year, month - 1, 1).toLocaleDateString(
    "en-IN",
    { month: "long", year: "numeric" }
  );

  registerPanel.hidden = false;
  registerTitle.textContent = settings.name + " — " + monthLabel;
  registerCaption.textContent = "Daily Closing Readings — 24:00";

  formulaBox.textContent =
    "Difference = Closing − Opening. " +
    "Consumption (kWh) = Difference × M.F. " +
    settings.firstEnd + " M.F.: " + settings.firstMF + " | " +
    settings.secondEnd + " M.F.: " + settings.secondMF;

  /* MONTH OPENING BOXES */
  openingReadings.innerHTML = channels.map(channel => `
    <div>
      <label for="opening-${channel.key}">
        ${channel.label}
      </label>
      <input
        id="opening-${channel.key}"
        data-opening="${channel.key}"
        type="number"
        min="0"
        step="any">
    </div>
  `).join("");

  /* TABLE HEADINGS */
const firstEndTitle = settings.firstEnd === "HV"
  ? "HV SIDE"
  : settings.firstEnd.toUpperCase() + " END";

const secondEndTitle = settings.secondEnd === "LV"
  ? "LV SIDE"
  : settings.secondEnd === "Other End"
    ? "OTHER END"
    : settings.secondEnd.toUpperCase() + " END";

monthlyTableHead.innerHTML =
  '<tr>' +
    '<th rowspan="3" scope="col">Date</th>' +
    '<th colspan="6" class="end-first" scope="colgroup">' +
      firstEndTitle +
    '</th>' +
    '<th colspan="6" class="end-second" scope="colgroup">' +
      secondEndTitle +
    '</th>' +
    '<th colspan="4" scope="colgroup">ENERGY LOSS</th>' +
  '</tr>' +

  '<tr>' +
    '<th colspan="3" class="end-first">Import</th>' +
    '<th colspan="3" class="end-first">Export</th>' +
    '<th colspan="3" class="end-second">Import</th>' +
    '<th colspan="3" class="end-second">Export</th>' +
    '<th colspan="2">' +
      settings.firstEnd + ' → ' + settings.secondEnd +
    '</th>' +
    '<th colspan="2">' +
      settings.secondEnd + ' → ' + settings.firstEnd +
    '</th>' +
  '</tr>' +

  '<tr>' +
    channels.map(function (channel, index) {
      const endClass = index < 2 ? "end-first" : "end-second";

      return '<th class="' + endClass + '">Reading</th>' +
        '<th class="' + endClass + '">Difference</th>' +
        '<th class="' + endClass + '">kWh</th>';
    }).join("") +
    '<th>Loss kWh</th>' +
    '<th>Loss %</th>' +
    '<th>Loss kWh</th>' +
    '<th>Loss %</th>' +
  '</tr>';

  /* ONE ROW FOR EACH DATE */
  let rows = "";

  for (let day = 1; day <= daysInMonth; day++) {
    const dateLabel =
      String(day).padStart(2, "0") + "/" +
      String(month).padStart(2, "0") + "/" + year;

    rows += `
      <tr data-day="${day}">
        <th scope="row">${dateLabel}</th>

        ${channels.map(channel => `
          <td>
            <input
              type="number"
              min="0"
              step="any"
              data-channel="${channel.key}"
              aria-label="${dateLabel} ${channel.label} closing reading">
          </td>
          <td data-difference="${channel.key}">—</td>
          <td data-energy="${channel.key}">—</td>
        `).join("")}

        <td data-loss="forward">—</td>
        <td data-percent="forward">—</td>
        <td data-loss="reverse">—</td>
        <td data-percent="reverse">—</td>
      </tr>
    `;
  }

  monthlyTableBody.innerHTML = rows;

  registerStatus.textContent =
    settings.name + " — " + monthLabel +
    ": " + daysInMonth + " date rows ready.";
}

/* FEEDER SELECTION — OPEN SEPARATE PAGE */
document.querySelectorAll("[data-feeder]").forEach(button => {
  button.addEventListener("click", function () {
    if (!registerMonth.value) {
      registerStatus.textContent = "First month select cheyyandi.";
      registerMonth.focus();
      return;
    }

    const params = new URLSearchParams({
      feeder: this.dataset.feeder,
      month: registerMonth.value
    });

    window.location.href = "monthly-register.html?" + params.toString();
  });
});

/* MONTH SELECTION */
registerMonth.addEventListener("change", function () {
  if (selectedMonthlyFeeder) {
    createMonthlyRegister();
  }
});

/* OPEN THE SELECTED FEEDER ON REGISTER PAGE */
if (window.location.pathname.endsWith("/monthly-register.html")) {
  const params = new URLSearchParams(window.location.search);
  const feeder = params.get("feeder");
  const month = params.get("month");

  if (monthlyMeterSettings[feeder] && /^\d{4}-\d{2}$/.test(month || "")) {
    selectedMonthlyFeeder = feeder;
    registerMonth.value = month;
    createMonthlyRegister();
  } else {
    registerStatus.textContent =
      "Back to Feeder Selection nokki month and feeder select cheyyandi.";
  }
}
/* READ A NUMBER: EMPTY BOX IS NOT ZERO */
function readMonthlyNumber(input) {
  if (!input || input.value.trim() === "") {
    return null;
  }

  const value = input.valueAsNumber;

  return Number.isFinite(value) && value >= 0
    ? value
    : null;
}

/* CALCULATE ALL DAILY ROWS */
function calculateMonthlyReadings() {
  if (!selectedMonthlyFeeder || registerPanel.hidden) {
    return;
  }

  const settings = monthlyMeterSettings[selectedMonthlyFeeder];
  const channels = getMonthlyChannels(settings);
  const rows = Array.from(monthlyTableBody.rows);

  const isICT =
    selectedMonthlyFeeder === "ict1" ||
    selectedMonthlyFeeder === "ict2";

  rows.forEach((row, index) => {
    const energies = {};

    channels.forEach(channel => {
      const closingInput = row.querySelector(
        `[data-channel="${channel.key}"]`
      );

      const openingInput = index === 0
        ? openingReadings.querySelector(
            `[data-opening="${channel.key}"]`
          )
        : rows[index - 1].querySelector(
            `[data-channel="${channel.key}"]`
          );

      const opening = readMonthlyNumber(openingInput);
      const closing = readMonthlyNumber(closingInput);

     const differenceCell = row.querySelector(
  '[data-difference="' + channel.key + '"]'
);

const energyCell = row.querySelector(
  '[data-energy="' + channel.key + '"]'
);

      closingInput.setCustomValidity("");
      energies[channel.key] = null;

      if (opening === null || closing === null) {
        differenceCell.textContent = "—";
        energyCell.textContent = "—";
        return;
      }

      if (closing < opening) {
        closingInput.setCustomValidity(
          "Closing reading must not be below opening reading."
        );
        differenceCell.textContent = "Check";
        energyCell.textContent = "—";
        return;
      }

      const difference = closing - opening;

      const mf = channel.key.startsWith("first")
        ? settings.firstMF
        : settings.secondMF;

      const energy = difference * mf;
      energies[channel.key] = energy;

      differenceCell.textContent = difference.toFixed(3);
      energyCell.textContent = energy.toFixed(2);
    });

    /* LINE AND ICT IMPORT/EXPORT PAIRING */
    const forwardSending = isICT
      ? energies.firstImport
      : energies.firstExport;

    const forwardReceiving = isICT
      ? energies.secondExport
      : energies.secondImport;

    const reverseSending = isICT
      ? energies.secondImport
      : energies.secondExport;

    const reverseReceiving = isICT
      ? energies.firstExport
      : energies.firstImport;

    showMonthlyLoss(
      row, "forward", forwardSending, forwardReceiving
    );

    showMonthlyLoss(
      row, "reverse", reverseSending, reverseReceiving
    );
  });
}

/* DISPLAY LOSS: PERCENTAGE WITH TWO DECIMALS */
function showMonthlyLoss(row, direction, sending, receiving) {
  const lossCell = row.querySelector(
    `[data-loss="${direction}"]`
  );

  const percentCell = row.querySelector(
    `[data-percent="${direction}"]`
  );

  if (sending === null || receiving === null) {
    lossCell.textContent = "—";
    percentCell.textContent = "—";
    return;
  }

  const loss = sending - receiving;

  lossCell.textContent = loss.toFixed(2);
  percentCell.textContent = sending > 0
    ? (loss / sending * 100).toFixed(2) + "%"
    : "—";

  lossCell.title = loss < 0
    ? "Negative loss: check readings, M.F. and reading times."
    : "";
}

/* RECALCULATE WHEN A READING CHANGES */
registerPanel.addEventListener("input", function (event) {
  if (event.target.matches("input[type='number']")) {
    calculateMonthlyReadings();
  }
});
/* MONTHLY REGISTER — FIREBASE SAVE / LOAD */
(async function setupMonthlyCloud() {
  const saveButton = document.getElementById("saveMonthly");
  let cloudReady = false;
  let busy = false;
  let loadVersion = 0;
  let monthlyCanEdit = false;
  let loadedUserId = "";
  let loadedFeeder = "";
  let loadedMonth = "";
  let baseline = null;
  let lastSaved = false;

  function captureReadings() {
    const opening = {};
    const days = {};
    openingReadings.querySelectorAll("[data-opening]").forEach(input => {
      opening[input.dataset.opening] = input.value;
    });
    Array.from(monthlyTableBody.rows).forEach(row => {
      const readings = {};
      row.querySelectorAll("[data-channel]").forEach(input => {
        readings[input.dataset.channel] = input.value;
      });
      days[row.dataset.day] = readings;
    });
    return { opening, days };
  }

  function hasUnsaved() {
    return baseline !== null &&
      JSON.stringify(captureReadings()) !== baseline;
  }

  function state() {
    return {
      ready: cloudReady,
      busy,
      canEdit: monthlyCanEdit,
      dirty: hasUnsaved(),
      saved: lastSaved,
      feeder: loadedFeeder || selectedMonthlyFeeder,
      month: loadedMonth || registerMonth.value,
      message: registerStatus.textContent
    };
  }

  function notifyState() {
    window.dispatchEvent(new CustomEvent("monthly-register-state", {
      detail: state()
    }));
  }

  function lockRegister(locked) {
    const editable = !locked && cloudReady && !busy && monthlyCanEdit;
    registerPanel.querySelectorAll("input[type='number']").forEach(input => {
      input.disabled = !editable;
    });
    saveButton.disabled = !editable;
    registerPanel.dataset.monthlyReady = String(!locked && cloudReady && !busy);
    registerMonth.disabled = busy;
    notifyState();
  }

  window.monthlyRegisterAccess = { state, hasUnsaved, save: async () => false };

  registerPanel.addEventListener("input", event => {
    if (!event.target.matches("input[type='number']")) return;
    if (cloudReady && monthlyCanEdit && !busy) {
      registerStatus.textContent = hasUnsaved()
        ? "Unsaved changes. Save Readings to keep your changes."
        : "Readings unchanged.";
      notifyState();
    }
  });

  lockRegister(true);

  try {
    const { app, auth, watchDashboardAccess } = await import("./auth-guard.js");
    const { getFirestore, doc, getDocFromServer, setDoc, serverTimestamp } =
      await import("https://www.gstatic.com/firebasejs/12.0.0/firebase-firestore.js");
    const db = getFirestore(app);

    watchDashboardAccess(access => {
      monthlyCanEdit = Boolean(access.ready && access.user && access.canEdit &&
        access.user.uid === auth.currentUser?.uid);
      if (loadedUserId && access.user?.uid !== loadedUserId) {
        loadVersion++;
        cloudReady = false;
      }
      lockRegister(!cloudReady || busy);
    });

    await auth.authStateReady();
    if (!auth.currentUser) return;

    function registerReference(feeder, month) {
      return doc(db, "monthlyEnergyRegisters", month + "_" + feeder);
    }

    async function loadMonthlyCloud() {
      if (!selectedMonthlyFeeder || !registerMonth.value) return;
      const version = ++loadVersion;
      const feeder = selectedMonthlyFeeder;
      const month = registerMonth.value;
      const userId = auth.currentUser?.uid;
      cloudReady = false;
      baseline = null;
      lastSaved = false;
      registerStatus.textContent = "Loading saved monthly readings...";
      lockRegister(true);
      try {
        const snapshot = await getDocFromServer(registerReference(feeder, month));
        if (version !== loadVersion || feeder !== selectedMonthlyFeeder ||
          month !== registerMonth.value || auth.currentUser?.uid !== userId) return;
        const data = snapshot.exists() ? snapshot.data() : {};
        openingReadings.querySelectorAll("[data-opening]").forEach(input => {
          input.value = data.opening?.[input.dataset.opening] ?? "";
        });
        Array.from(monthlyTableBody.rows).forEach(row => {
          row.querySelectorAll("[data-channel]").forEach(input => {
            input.value = data.days?.[row.dataset.day]?.[input.dataset.channel] ?? "";
          });
        });
        calculateMonthlyReadings();
        loadedFeeder = feeder;
        loadedMonth = month;
        loadedUserId = userId;
        baseline = JSON.stringify(captureReadings());
        lastSaved = snapshot.exists();
        cloudReady = true;
        registerStatus.textContent = snapshot.exists()
          ? "Saved readings loaded successfully."
          : "No saved readings for this month and feeder.";
        lockRegister(false);
      } catch (error) {
        if (version !== loadVersion) return;
        console.error("Monthly load failed:", error);
        cloudReady = false;
        registerStatus.textContent = "Could not load readings. Check your connection and refresh.";
        lockRegister(true);
      }
    }

    async function saveMonthlyCloud() {
      if (busy || !cloudReady || !monthlyCanEdit || !selectedMonthlyFeeder ||
        !auth.currentUser || auth.currentUser.uid !== loadedUserId ||
        selectedMonthlyFeeder !== loadedFeeder || registerMonth.value !== loadedMonth) {
        return false;
      }
      calculateMonthlyReadings();
      const inputs = Array.from(registerPanel.querySelectorAll("input[type='number']"));
      const invalid = inputs.find(input => !input.checkValidity());
      if (invalid) {
        registerStatus.textContent = "Please correct the highlighted reading before saving.";
        invalid.reportValidity();
        notifyState();
        return false;
      }
      if (!inputs.some(input => input.value.trim() !== "")) {
        registerStatus.textContent = "Please enter readings before saving.";
        notifyState();
        return false;
      }
      const readings = captureReadings();
      const feeder = loadedFeeder;
      const month = loadedMonth;
      const userId = auth.currentUser.uid;
      busy = true;
      registerStatus.textContent = "Saving to Firebase...";
      lockRegister(true);
      try {
        await setDoc(registerReference(feeder, month), {
          feeder, month,
          opening: readings.opening,
          days: readings.days,
          savedBy: userId,
          savedAt: serverTimestamp()
        }, { merge: true });
        baseline = JSON.stringify(readings);
        lastSaved = true;
        registerStatus.textContent = monthlyMeterSettings[feeder].name + " — " + month +
          ": Readings saved to Firebase successfully.";
        return true;
      } catch (error) {
        console.error("Monthly save failed:", error);
        registerStatus.textContent = "Save failed. Your readings remain here. Check your connection and try again.";
        return false;
      } finally {
        busy = false;
        lockRegister(!cloudReady);
      }
    }

    window.monthlyRegisterAccess.save = saveMonthlyCloud;
    saveButton.addEventListener("click", saveMonthlyCloud);
    registerMonth.addEventListener("change", loadMonthlyCloud);
    await loadMonthlyCloud();
  } catch (error) {
    console.error("Monthly Firebase setup failed:", error);
    cloudReady = false;
    registerStatus.textContent = "Firebase connection unavailable. Check your connection and refresh.";
    lockRegister(true);
  }
})();
/* CONSOLIDATED REPORT — SELECTED DATE */
(async function setupConsolidatedReport() {
  const dateInput = document.getElementById("consolidatedDate");
  const viewButton = document.getElementById("viewConsolidated");
  const status = document.getElementById("consolidatedStatus");
  const reportBody = document.getElementById("consolidatedReportBody");
  const reportDate = document.getElementById("consolidatedReportDate");
  const tables = document.getElementById("consolidatedTables");

  /* THIS SECTION EXISTS ONLY ON MONTHLY-ENERGY PAGE */
  if (!dateInput || !viewButton) return;

  dateInput.value = window.energyReportDate.get();

  let requestVersion = 0;

  viewButton.disabled = true;

  try {
    const { app, auth } = await import("./auth-guard.js");

    const {
      getFirestore,
      doc,
      getDocFromServer
    } = await import(
      "https://www.gstatic.com/firebasejs/12.0.0/firebase-firestore.js"
    );

    const db = getFirestore(app);

    await auth.authStateReady();

    if (!auth.currentUser) return;

    viewButton.disabled = false;

    /* EMPTY READING MUST NOT BECOME ZERO */
    function numberValue(value) {
      if (
        value === null ||
        value === undefined ||
        String(value).trim() === ""
      ) {
        return null;
      }

      const number = Number(value);

      return Number.isFinite(number) && number >= 0
        ? number
        : null;
    }

    function displayNumber(value, decimals) {
      return value === null
        ? "—"
        : value.toFixed(decimals);
    }

    function lossValues(sending, receiving) {
      if (sending === null || receiving === null) {
        return ["—", "—"];
      }

      const loss = sending - receiving;

      return [
        loss.toFixed(2),
        sending > 0
          ? (loss / sending * 100).toFixed(2) + "%"
          : "—"
      ];
    }

    /* SAME CALCULATIONS AS THE MONTHLY REGISTER */
    function feederRow(feeder, data, day, serial) {
      const settings = monthlyMeterSettings[feeder];
      const channels = getMonthlyChannels(settings);

      const closing = data?.days?.[String(day)] || {};

      const opening = day === 1
        ? data?.opening || {}
        : data?.days?.[String(day - 1)] || {};

      const energies = {};

      let cells =
        "<td>" + serial + "</td>" +
        '<th scope="row" class="feeder-name">' +
          settings.name +
        "</th>";

      channels.forEach((channel, index) => {
        const current = numberValue(closing[channel.key]);
        const previous = numberValue(opening[channel.key]);

        const invalid =
          current !== null &&
          previous !== null &&
          current < previous;

        const difference =
          current === null || previous === null || invalid
            ? null
            : current - previous;

        const mf = index < 2
          ? settings.firstMF
          : settings.secondMF;

        const energy = difference === null
          ? null
          : difference * mf;

        energies[channel.key] = energy;

        const endClass = index < 2
          ? "end-first"
          : "end-second";

        cells +=
          '<td class="' + endClass + '">' +
            displayNumber(current, 3) +
          "</td>" +
          '<td class="' + endClass + '">' +
            (invalid ? "Check" : displayNumber(difference, 3)) +
          "</td>" +
          '<td class="' + endClass + '">' +
            displayNumber(energy, 2) +
          "</td>";
      });

      const isICT = feeder === "ict1" || feeder === "ict2";

      const forward = lossValues(
        isICT ? energies.firstImport : energies.firstExport,
        isICT ? energies.secondExport : energies.secondImport
      );

      const reverse = lossValues(
        isICT ? energies.secondImport : energies.secondExport,
        isICT ? energies.firstExport : energies.firstImport
      );

      [...forward, ...reverse].forEach(value => {
        cells += '<td class="loss-column">' + value + "</td>";
      });

      return "<tr>" + cells + "</tr>";
    }

    function buildTable(title, feeders, records, day, isICT) {
      const firstEnd = isICT ? "HV SIDE" : "KALIKIRI END";
      const secondEnd = isICT ? "LV SIDE" : "OTHER END";

      const forwardLabel = isICT
        ? "HV → LV"
        : "Kalikiri → Other End";

      const reverseLabel = isICT
        ? "LV → HV"
        : "Other End → Kalikiri";

      const channelHeaders = [0, 1, 2, 3].map(index => {
        const endClass = index < 2
          ? "end-first"
          : "end-second";

        return (
          '<th class="' + endClass + '">Reading</th>' +
          '<th class="' + endClass + '">Difference</th>' +
          '<th class="' + endClass + '">kWh</th>'
        );
      }).join("");

      return `
        <div class="consolidated-table-wrap">
          <table class="consolidated-table">
            <caption>${title}</caption>

            <thead>
              <tr>
                <th rowspan="3">S.No.</th>
                <th rowspan="3">Feeder / ICT</th>

                <th colspan="6" class="end-first">
                  ${firstEnd}
                </th>

                <th colspan="6" class="end-second">
                  ${secondEnd}
                </th>

                <th colspan="4" class="loss-column">
                  ENERGY LOSS
                </th>
              </tr>

              <tr>
                <th colspan="3" class="end-first">Import</th>
                <th colspan="3" class="end-first">Export</th>

                <th colspan="3" class="end-second">Import</th>
                <th colspan="3" class="end-second">Export</th>

                <th colspan="2" class="loss-column">
                  ${forwardLabel}
                </th>

                <th colspan="2" class="loss-column">
                  ${reverseLabel}
                </th>
              </tr>

              <tr>
                ${channelHeaders}
                <th>Loss kWh</th>
                <th>Loss %</th>
                <th>Loss kWh</th>
                <th>Loss %</th>
              </tr>
            </thead>

            <tbody>
              ${feeders.map((feeder, index) =>
                feederRow(feeder, records[feeder], day, index + 1)
              ).join("")}
            </tbody>
          </table>
        </div>
      `;
    }

    /* DATE CHANGES MUST CLEAR THE PREVIOUS REPORT */
    dateInput.addEventListener("change", function () {
      if (!window.energyReportDate.valid(dateInput.value)) {
        dateInput.value = window.energyReportDate.get();
        return;
      }
      window.energyReportDate.set(dateInput.value);
      const month = dateInput.value.slice(0, 7);
      if (registerMonth.value !== month && (!registerMonth.max || month <= registerMonth.max)) {
        registerMonth.value = month;
        registerMonth.dispatchEvent(new Event("change", {bubbles: true}));
      }
      requestVersion++;
      reportBody.hidden = true;
      tables.innerHTML = "";
      viewButton.disabled = false;

      status.textContent =
        "View Report nokki selected date readings chudandi.";
    });

    viewButton.addEventListener("click", async function () {
      if (!dateInput.value || !dateInput.checkValidity()) {
        status.textContent = "First date select cheyyandi.";
        dateInput.focus();
        return;
      }

      const selectedDate = dateInput.value;
      const month = selectedDate.slice(0, 7);
      const day = Number(selectedDate.slice(8, 10));
      const version = ++requestVersion;

      const feeders = Object.keys(monthlyMeterSettings);

      reportBody.hidden = true;
      tables.innerHTML = "";
      viewButton.disabled = true;

      status.textContent = "Loading consolidated readings...";

      try {
        /* LOAD DAILY ENERGY READINGS AND MONTHLY REGISTERS */
const { loadEnergyDay } = await import("./energy-cloud.js");

const [dailySaved, results] = await Promise.all([
  loadEnergyDay(selectedDate),

  Promise.all(
    feeders.map(async feeder => {
      const snapshot = await getDocFromServer(
        doc(
          db,
          "monthlyEnergyRegisters",
          month + "_" + feeder
        )
      );

      return {
        feeder,
        data: snapshot.exists() ? snapshot.data() : null
      };
    })
  )
]);

if (version !== requestVersion) return;

const records = {};

results.forEach(result => {
  records[result.feeder] = result.data;
});

/* APPLY DAILY VALUES TO THE REPORT COPY ONLY */
if (dailySaved?.readings) {
  feeders.forEach(feeder => {
    const savedMonthly = records[feeder] || {};

    const data = {
      ...savedMonthly,
      opening: { ...(savedMonthly.opening || {}) },
      days: { ...(savedMonthly.days || {}) }
    };

    const currentDay = String(day);
    const previousDay = String(day - 1);

    data.days[currentDay] = {
      ...(data.days[currentDay] || {})
    };

    if (day > 1) {
      data.days[previousDay] = {
        ...(data.days[previousDay] || {})
      };
    }

    const isICT = feeder === "ict1" || feeder === "ict2";

    const mappings = isICT
      ? [
          ["firstImport", feeder + "hv_import"],
          ["firstExport", feeder + "hv_export"],
          ["secondImport", feeder + "lv_import"],
          ["secondExport", feeder + "lv_export"]
        ]
      : [
          ["firstImport", feeder + "_import"],
          ["firstExport", feeder + "_export"]
        ];

    mappings.forEach(([channel, dailyKey]) => {
      const reading = dailySaved.readings[dailyKey];

      if (!reading) return;

      data.days[currentDay][channel] = reading.end ?? "";

      if (day === 1) {
        data.opening[channel] = reading.start ?? "";
      } else {
        data.days[previousDay][channel] = reading.start ?? "";
      }
    });

    records[feeder] = data;
  });
}

        const [year, monthNumber, dateNumber] =
          selectedDate.split("-");

        reportDate.textContent =
          dateNumber + "/" + monthNumber + "/" + year;

        tables.innerHTML =
          buildTable(
            "400 kV FEEDERS",
            ["rtpp1", "rtpp2", "chittoor1", "chittoor2"],
            records, day, false
          ) +
          buildTable(
            "ICTs — HV / LV",
            ["ict1", "ict2"],
            records, day, true
          ) +
          buildTable(
            "220 kV FEEDERS",
            ["kalikiri1", "kalikiri2", "madanapalli1", "madanapalli2"],
            records, day, false
          );

        reportBody.hidden = false;

        status.textContent =
          "Selected date saved readings loaded. " +
          "— = required reading missing; Check = closing below opening. " +
          "Other End: RTPP / Chittoor for the respective 400 kV feeder. " +
          "Closing readings: 24:00.";
      } catch (error) {
        if (version !== requestVersion) return;

        console.error("Consolidated report failed:", error);

        status.textContent =
          "Report load kaaledu. Internet / permissions check chesi retry cheyyandi.";
      } finally {
        if (version === requestVersion) {
          viewButton.disabled = false;
        }
      }
    });

  } catch (error) {
    console.error("Consolidated setup failed:", error);

    status.textContent =
      "Firebase connection ready kaaledu. Page refresh cheyyandi.";
  }
})();
/* CONSOLIDATED REPORT — PRINT / PDF */
(function setupConsolidatedPrint() {
  const button = document.getElementById("printConsolidated");

  if (!button) return;

  button.addEventListener("click", function () {
    const report = document.getElementById(
      "consolidatedReportBody"
    );

    if (
      !report ||
      report.hidden ||
      !report.querySelector(".consolidated-table")
    ) {
      alert("First date select chesi View Report nokkandi.");
      return;
    }

    const copy = report.cloneNode(true);

    copy.querySelectorAll(".register-actions")
      .forEach(element => element.remove());

    const printWindow = window.open(
      "",
      "_blank",
      "width=1200,height=800"
    );

    if (!printWindow) {
      alert("Print kosam browser pop-ups allow cheyyandi.");
      return;
    }

    printWindow.document.open();

    printWindow.document.write(`
      <!DOCTYPE html>
      <html lang="en">
      <head>
        <meta charset="UTF-8">
        <title>Kalikiri Consolidated Energy Report</title>

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
            color: #000;
            background: #fff;
            font-family: "Times New Roman", serif;
          }

          .consolidated-heading {
            margin-bottom: 14px;
            text-align: center;
          }

          .consolidated-heading h2 {
            margin: 0 0 5px;
            font-size: 18pt;
          }

          .consolidated-heading h3 {
            margin: 5px 0;
            font-size: 12pt;
          }

          .consolidated-table-wrap {
            margin-bottom: 14px;
            overflow: visible;
          }

          .consolidated-table {
            width: 100%;
            table-layout: fixed;
            border-collapse: collapse;
            font-size: 7pt;
          }

          .consolidated-table caption {
            padding: 6px;
            border: 1px solid #000;
            border-bottom: 0;
            background: #e7edf4;
            font-size: 11pt;
            font-weight: bold;
            text-align: center;
          }

          .consolidated-table th,
          .consolidated-table td {
            padding: 4px 2px;
            border: 1px solid #000;
            text-align: center;
            vertical-align: middle;
            white-space: normal;
            overflow-wrap: anywhere;
          }

          .consolidated-table thead {
            display: table-header-group;
          }

          .consolidated-table thead th {
            background: #eaf1f8;
          }

          .consolidated-table .end-first {
            background: #f0f7ff;
          }

          .consolidated-table .end-second {
            background: #fff8e8;
          }

          .consolidated-table .loss-column {
            background: #edf7ef;
          }

          .consolidated-table .feeder-name {
            text-align: left;
          }

          .consolidated-table tr {
            break-inside: avoid;
          }

          .consolidated-table thead tr:first-child
          > th:first-child {
            width: 4%;
          }

          .consolidated-table thead tr:first-child
          > th:nth-child(2) {
            width: 9%;
          }

          @media print {
            body {
              print-color-adjust: exact;
              -webkit-print-color-adjust: exact;
            }
          }
        </style>
      </head>

      <body>
        ${copy.innerHTML}
      </body>
      </html>
    `);

    printWindow.document.close();

    printWindow.focus();

    printWindow.requestAnimationFrame(function () {
      printWindow.requestAnimationFrame(function () {
        printWindow.print();
      });
    });
  });
})();
/* CONSOLIDATED REPORT — PRINT / PDF */
(function setupConsolidatedPrint() {
  const button = document.getElementById("printConsolidated");

  if (!button) return;

  button.addEventListener("click", function () {
    const report = document.getElementById(
      "consolidatedReportBody"
    );

    if (
      !report ||
      report.hidden ||
      !report.querySelector(".consolidated-table")
    ) {
      alert("First date select chesi View Report nokkandi.");
      return;
    }

    const copy = report.cloneNode(true);

    copy.querySelectorAll(".register-actions")
      .forEach(element => element.remove());

    const printWindow = window.open(
      "",
      "_blank",
      "width=1200,height=800"
    );

    if (!printWindow) {
      alert("Print kosam browser pop-ups allow cheyyandi.");
      return;
    }

    printWindow.document.open();

    printWindow.document.write(`
      <!DOCTYPE html>
      <html lang="en">
      <head>
        <meta charset="UTF-8">
        <title>Kalikiri Consolidated Energy Report</title>

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
            color: #000;
            background: #fff;
            font-family: "Times New Roman", serif;
          }

          .consolidated-heading {
            margin-bottom: 14px;
            text-align: center;
          }

          .consolidated-heading h2 {
            margin: 0 0 5px;
            font-size: 18pt;
          }

          .consolidated-heading h3 {
            margin: 5px 0;
            font-size: 12pt;
          }

          .consolidated-table-wrap {
            margin-bottom: 14px;
            overflow: visible;
          }

          .consolidated-table {
            width: 100%;
            table-layout: fixed;
            border-collapse: collapse;
            font-size: 7pt;
          }

          .consolidated-table caption {
            padding: 6px;
            border: 1px solid #000;
            border-bottom: 0;
            background: #e7edf4;
            font-size: 11pt;
            font-weight: bold;
            text-align: center;
          }

          .consolidated-table th,
          .consolidated-table td {
            padding: 4px 2px;
            border: 1px solid #000;
            text-align: center;
            vertical-align: middle;
            white-space: normal;
            overflow-wrap: anywhere;
          }

          .consolidated-table thead {
            display: table-header-group;
          }

          .consolidated-table thead th {
            background: #eaf1f8;
          }

          .consolidated-table .end-first {
            background: #f0f7ff;
          }

          .consolidated-table .end-second {
            background: #fff8e8;
          }

          .consolidated-table .loss-column {
            background: #edf7ef;
          }

          .consolidated-table .feeder-name {
            text-align: left;
          }

          .consolidated-table tr {
            break-inside: avoid;
          }

          .consolidated-table thead tr:first-child
          > th:first-child {
            width: 4%;
          }

          .consolidated-table thead tr:first-child
          > th:nth-child(2) {
            width: 9%;
          }

          @media print {
            body {
              print-color-adjust: exact;
              -webkit-print-color-adjust: exact;
            }
          }
        </style>
      </head>

      <body>
        ${copy.innerHTML}
      </body>
      </html>
    `);

    printWindow.document.close();

    printWindow.focus();

    printWindow.requestAnimationFrame(function () {
      printWindow.requestAnimationFrame(function () {
        printWindow.print();
      });
    });
  });
})();
/* CONSOLIDATED REPORT — FORMATTED EXCEL */
(function setupConsolidatedExcel() {
  const button = document.getElementById("excelConsolidated");

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
    const report = document.getElementById(
      "consolidatedReportBody"
    );

    const sourceTables = report
      ? Array.from(report.querySelectorAll(".consolidated-table"))
      : [];

    if (!report || report.hidden || sourceTables.length !== 3) {
      alert("First date select chesi View Report nokkandi.");
      return;
    }

    const tables = sourceTables.map(table => table.cloneNode(true));

    const dateText = document.getElementById(
      "consolidatedReportDate"
    ).textContent.trim();

    const filenameDate = dateText.split("/").reverse().join("-");

    const originalText = button.textContent;
    button.disabled = true;
    button.textContent = "Preparing Excel...";

    try {
      const ExcelJS = await loadExcelLibrary();
      const workbook = new ExcelJS.Workbook();

      const sheet = workbook.addWorksheet("Consolidated Report");

      sheet.views = [{ showGridLines: false }];

      /* ONE A4 LANDSCAPE PRINT PAGE */
      sheet.pageSetup = {
        paperSize: 9,
        orientation: "landscape",
        fitToPage: true,
        fitToWidth: 1,
        fitToHeight: 1,
        horizontalCentered: true,
        margins: {
          left: 0.25,
          right: 0.25,
          top: 0.3,
          bottom: 0.3,
          header: 0,
          footer: 0
        }
      };

      sheet.getColumn(1).width = 6;
      sheet.getColumn(2).width = 19;

      for (let column = 3; column <= 18; column++) {
        sheet.getColumn(column).width = 14;
      }

      let nextRow = 1;

      function addHeading(text, size, background) {
        const rowNumber = nextRow++;

        sheet.mergeCells(rowNumber, 1, rowNumber, 18);

        const cell = sheet.getCell(rowNumber, 1);
        cell.value = text;

        cell.font = {
          name: "Times New Roman",
          size,
          bold: true,
          color: { argb: background ? "FFFFFFFF" : "FF153B65" }
        };

        cell.alignment = {
          horizontal: "center",
          vertical: "middle",
          wrapText: true
        };

        if (background) {
          cell.fill = {
            type: "pattern",
            pattern: "solid",
            fgColor: { argb: background }
          };

          cell.border = {
            top: { style: "thin", color: { argb: "FF000000" } },
            bottom: { style: "thin", color: { argb: "FF000000" } },
            left: { style: "thin", color: { argb: "FF000000" } },
            right: { style: "thin", color: { argb: "FF000000" } }
          };
        }

        sheet.getRow(rowNumber).height = size >= 16 ? 28 : 24;
      }

      addHeading("APTRANSCO", 18);
      addHeading("400 kV SUBSTATION, KALIKIRI", 14);

      addHeading(
        "CONSOLIDATED ENERGY METER READINGS REPORT on " + dateText,
        12
      );

      sheet.getRow(nextRow++).height = 10;

      /* ALL THREE TABLES ON THE SAME SHEET */
      tables.forEach(table => {
        addHeading(table.caption.textContent.trim(), 13, "FF153B65");

        const startRow = nextRow;
        const occupied = new Set();

        Array.from(table.rows).forEach((htmlRow, rowIndex) => {
          const excelRow = startRow + rowIndex;
          const isHeader = htmlRow.parentElement.tagName === "THEAD";

          sheet.getRow(excelRow).height = isHeader ? 28 : 23;

          let column = 1;

          Array.from(htmlRow.cells).forEach(htmlCell => {
            while (occupied.has(excelRow + ":" + column)) {
              column++;
            }

            const columnSpan = htmlCell.colSpan || 1;
            const rowSpan = htmlCell.rowSpan || 1;

            const text = htmlCell.textContent.trim();
            const cell = sheet.getCell(excelRow, column);

            cell.value = text;

            /* REAL NUMBERS WITH THE DISPLAYED DECIMALS */
            if (!isHeader && /^-?\d+(\.\d+)?%$/.test(text)) {
              cell.value = Number(text.slice(0, -1)) / 100;
              cell.numFmt = "0.00%";
            } else if (!isHeader && /^-?\d+(\.\d+)?$/.test(text)) {
              cell.value = Number(text);

              const decimals = text.includes(".")
                ? text.split(".")[1].length
                : 0;

              cell.numFmt = decimals
                ? "0." + "0".repeat(decimals)
                : "0";
            }

            let background = isHeader ? "FFEAF1F8" : "FFFFFFFF";

            if (htmlCell.classList.contains("end-first")) {
              background = "FFF0F7FF";
            }

            if (htmlCell.classList.contains("end-second")) {
              background = "FFFFF8E8";
            }

            if (htmlCell.classList.contains("loss-column")) {
              background = "FFEDF7EF";
            }

            /* INNER AND OUTER TABLE BORDERS */
            for (let r = excelRow; r < excelRow + rowSpan; r++) {
              for (let c = column; c < column + columnSpan; c++) {
                occupied.add(r + ":" + c);

                const target = sheet.getCell(r, c);

                target.font = {
                  name: "Times New Roman",
                  size: 10,
                  bold: isHeader || column === 2
                };

                target.alignment = {
                  horizontal:
                    !isHeader && column === 2 ? "left" : "center",
                  vertical: "middle",
                  wrapText: true
                };

                target.fill = {
                  type: "pattern",
                  pattern: "solid",
                  fgColor: { argb: background }
                };

                target.border = {
                  top: {
                    style: "thin",
                    color: { argb: "FF000000" }
                  },
                  bottom: {
                    style: "thin",
                    color: { argb: "FF000000" }
                  },
                  left: {
                    style: "thin",
                    color: { argb: "FF000000" }
                  },
                  right: {
                    style: "thin",
                    color: { argb: "FF000000" }
                  }
                };
              }
            }

            /* PRESERVE GROUPED HEADINGS */
            if (columnSpan > 1 || rowSpan > 1) {
              sheet.mergeCells(
                excelRow,
                column,
                excelRow + rowSpan - 1,
                column + columnSpan - 1
              );
            }

            column += columnSpan;
          });
        });

        nextRow = startRow + table.rows.length;
        sheet.getRow(nextRow++).height = 12;
      });

      sheet.pageSetup.printArea = "A1:R" + (nextRow - 1);

      const buffer = await workbook.xlsx.writeBuffer();

      const blob = new Blob([buffer], {
        type:
          "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
      });

      const url = URL.createObjectURL(blob);
      const link = document.createElement("a");

      link.href = url;
      link.download =
        "Kalikiri-Consolidated-" + filenameDate + ".xlsx";

      document.body.appendChild(link);
      link.click();
      link.remove();

      setTimeout(() => URL.revokeObjectURL(url), 30000);

    } catch (error) {
      console.error("Formatted Excel export failed:", error);

      alert(
        "Excel download kaaledu: " + error.message +
        "\nInternet check chesi retry cheyyandi."
      );
    } finally {
      button.disabled = false;
      button.textContent = originalText;
    }
  });
})();
/* CONSOLIDATED REPORT — WORD DOCUMENT */
(function setupConsolidatedWord() {
  const button = document.getElementById("wordConsolidated");

  if (!button) return;

  button.addEventListener("click", async function () {
    const report = document.getElementById(
      "consolidatedReportBody"
    );

    if (
      !report ||
      report.hidden ||
      report.querySelectorAll(".consolidated-table").length !== 3
    ) {
      alert("First date select chesi View Report nokkandi.");
      return;
    }

    const tables = Array.from(
      report.querySelectorAll(".consolidated-table")
    ).map(table => table.cloneNode(true));

    const dateText = document.getElementById(
      "consolidatedReportDate"
    ).textContent.trim();

    const originalText = button.textContent;
    button.disabled = true;
    button.textContent = "Preparing Word...";

    try {
      const {
        Document,
        Packer,
        Paragraph,
        TextRun,
        Table,
        TableRow,
        TableCell,
        AlignmentType,
        WidthType,
        BorderStyle,
        VerticalAlign,
        TableLayoutType,
        PageOrientation
      } = await import(
        "https://cdn.jsdelivr.net/npm/docx@9.5.1/+esm"
      );

      const border = {
        style: BorderStyle.SINGLE,
        size: 4,
        color: "000000"
      };

      function paragraph(text, size, bold, centered) {
        return new Paragraph({
          alignment: centered
            ? AlignmentType.CENTER
            : AlignmentType.LEFT,
          spacing: { before: 0, after: 60 },
          children: [
            new TextRun({
              text,
              font: "Times New Roman",
              size,
              bold
            })
          ]
        });
      }

      const children = [
        paragraph("APTRANSCO", 36, true, true),
        paragraph(
          "400 kV SUBSTATION, KALIKIRI",
          26, true, true
        ),
        paragraph(
          "CONSOLIDATED ENERGY METER READINGS REPORT on " +
            dateText,
          22, true, true
        )
      ];

      tables.forEach(source => {
        children.push(
          paragraph(
            source.caption.textContent.trim(),
            22, true, true
          )
        );

        const occupied = new Set();

        const rows = Array.from(source.rows).map(
          (htmlRow, rowIndex) => {
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

              let fill = isHeader ? "EAF1F8" : "FFFFFF";

              if (htmlCell.classList.contains("end-first")) {
                fill = "F0F7FF";
              }

              if (htmlCell.classList.contains("end-second")) {
                fill = "FFF8E8";
              }

              if (htmlCell.classList.contains("loss-column")) {
                fill = "EDF7EF";
              }

              const widths = [600, 1500, ...Array(16).fill(860)];

              const width = widths
                .slice(startColumn, startColumn + span)
                .reduce((sum, value) => sum + value, 0);

              return new TableCell({
                columnSpan: span,
                rowSpan,
                width: { size: width, type: WidthType.DXA },
                verticalAlign: VerticalAlign.CENTER,
                shading: { fill },
                margins: {
                  top: 45,
                  bottom: 45,
                  left: 35,
                  right: 35
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
                      !isHeader && startColumn === 1
                        ? AlignmentType.LEFT
                        : AlignmentType.CENTER,
                    spacing: { before: 0, after: 0 },
                    children: [
                      new TextRun({
                        text: htmlCell.textContent.trim(),
                        font: "Times New Roman",
                        size: 14,
                        bold: isHeader || startColumn === 1
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
          }
        );

        children.push(
          new Table({
            width: { size: 15860, type: WidthType.DXA },
            columnWidths: [600, 1500, ...Array(16).fill(860)],
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
            children: [new TextRun({ text: "", size: 8 })]
          })
        );
      });

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
                left: 480,
                right: 480
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
        "Kalikiri-Consolidated-" +
        dateText.split("/").reverse().join("-") +
        ".docx";

      document.body.appendChild(link);
      link.click();
      link.remove();

      setTimeout(() => URL.revokeObjectURL(url), 30000);

    } catch (error) {
      console.error("Word export failed:", error);

      alert("Word download kaaledu: " + error.message);
    } finally {
      button.disabled = false;
      button.textContent = originalText;
    }
  });
})();
/* CONSOLIDATED REPORT — WHATSAPP SHARE */
(function setupConsolidatedWhatsApp() {
  const button = document.getElementById(
    "whatsappConsolidated"
  );

  if (!button) return;

  button.addEventListener("click", function () {
    const report = document.getElementById(
      "consolidatedReportBody"
    );

    const tables = report
      ? Array.from(report.querySelectorAll(".consolidated-table"))
      : [];

    if (!report || report.hidden || tables.length !== 3) {
      alert("First date select chesi View Report nokkandi.");
      return;
    }

    const dateText = document.getElementById(
      "consolidatedReportDate"
    ).textContent.trim();

    const lines = [
      "APTRANSCO",
      "400 kV SUBSTATION, KALIKIRI",
      "CONSOLIDATED ENERGY METER READINGS REPORT",
      "on " + dateText + "",
      "",
      "Closing readings: 24:00",
      "Reading | Difference | Energy (kWh)",
      ""
    ];

    tables.forEach((table, tableIndex) => {
      lines.push(
        "" + table.caption.textContent.trim() + "",
        ""
      );

      Array.from(table.tBodies[0].rows).forEach(row => {
        const values = Array.from(row.cells).map(cell =>
          cell.textContent.trim()
        );

        const feeder = values[1];

        /* SKIP EMPTY FEEDERS */
        if (values.slice(2).every(value => value === "—")) {
          lines.push("" + feeder + "", "Readings unavailable.", "");
          return;
        }

        const isICT = tableIndex === 1;

        const firstEnd = isICT ? "HV" : "Kalikiri";

        const secondEnd = isICT
          ? "LV"
          : tableIndex === 0
            ? feeder.startsWith("RTPP") ? "RTPP" : "Chittoor"
            : "Other End";

        function channelLine(label, start) {
          return label + ": " +
            values[start] + " | " +
            values[start + 1] + " | " +
            values[start + 2];
        }

        lines.push(
          "" + feeder + "",

          channelLine(firstEnd + " Import", 2),
          channelLine(firstEnd + " Export", 5),

          channelLine(secondEnd + " Import", 8),
          channelLine(secondEnd + " Export", 11),

          "Loss " + firstEnd + " → " + secondEnd + ": " +
            values[14] + " kWh | " + values[15],

          "Loss " + secondEnd + " → " + firstEnd + ": " +
            values[16] + " kWh | " + values[17],

          ""
        );
      });
    });

    lines.push("— = required reading unavailable.");

    const message = lines.join("\n");

    const link = document.createElement("a");

    link.href =
      "https://wa.me/?text=" + encodeURIComponent(message);

    link.target = "_blank";
    link.rel = "noopener noreferrer";

    document.body.appendChild(link);
    link.click();
    link.remove();
  });
})();
/* INDIVIDUAL MONTHLY REGISTER — PRINT / PDF */
(function setupMonthlyRegisterPrint() {
  const printButton = document.getElementById("printMonthly");
  const saveButton = document.getElementById("saveMonthly");

  if (!printButton || !saveButton) return;

  /* ENABLE AFTER CLOUD LOADING IS COMPLETE */
  function updateMonthlyPrintButton() {
  printButton.disabled =
    registerPanel.dataset.monthlyReady !== "true" ||
    registerPanel.hidden;
}

new MutationObserver(updateMonthlyPrintButton).observe(
  registerPanel,
  {
    attributes: true,
    attributeFilter: ["data-monthly-ready", "hidden"]
  }
);

  updateMonthlyPrintButton();

  printButton.addEventListener("click", function () {
    if (
      printButton.disabled ||
      !selectedMonthlyFeeder ||
      !registerMonth.value
    ) {
      return;
    }

    calculateMonthlyReadings();

    const report = registerPanel.cloneNode(true);

    report.removeAttribute("hidden");

    report.querySelectorAll(
      ".register-actions, #registerStatus"
    ).forEach(element => element.remove());

    /* PRINT ACTUAL INPUT VALUES */
    report.querySelectorAll("input").forEach(input => {
      const value = document.createElement("span");

      value.textContent =
        input.value === "" ? "—" : input.value;

      input.replaceWith(value);
    });

    const printWindow = window.open(
      "",
      "_blank",
      "width=1200,height=800"
    );

    if (!printWindow) {
      alert("Print kosam browser pop-ups allow cheyyandi.");
      return;
    }

    printWindow.document.open();

    printWindow.document.write(`
      <!DOCTYPE html>
      <html lang="en">
      <head>
        <meta charset="UTF-8">
        <title>Kalikiri Monthly Energy Register</title>

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
            background: white;
            color: black;
            font-family: "Times New Roman", serif;
          }

          .report-heading {
            margin-bottom: 6px;
            text-align: center;
          }

          .report-heading h1 {
            margin: 0 0 3px;
            font-size: 15pt;
          }

          .report-heading p {
            margin: 2px 0;
            font-size: 10pt;
            font-weight: bold;
          }

          #registerTitle {
            margin: 5px 0;
            text-align: center;
            font-size: 11pt;
          }

          #formulaBox {
            margin: 4px 0;
            font-size: 7pt;
            line-height: 1.2;
          }

          h3 {
            margin: 4px 0 2px;
            font-size: 8pt;
          }

          p {
            margin: 2px 0;
            font-size: 7pt;
          }

          #openingReadings {
            display: grid;
            grid-template-columns: repeat(4, 1fr);
            gap: 6px;
            margin: 4px 0 6px;
          }

          #openingReadings > div {
            padding: 3px 5px;
            border: 1px solid #555;
            font-size: 7pt;
          }

          #openingReadings label {
            display: block;
            margin-bottom: 2px;
            font-weight: bold;
          }

          .table-scroll {
            overflow: visible;
          }

          #monthlyTable {
            width: 100%;
            table-layout: fixed;
            border-collapse: collapse;
            font-size: 6.5pt;
          }

          #monthlyTable caption {
            padding: 3px;
            font-size: 8pt;
            font-weight: bold;
            text-align: center;
          }

          #monthlyTable th,
          #monthlyTable td {
            padding: 2px 1px;
            border: 1px solid #333;
            text-align: center;
            vertical-align: middle;
            white-space: normal;
            overflow-wrap: anywhere;
          }

          #monthlyTable thead {
            display: table-header-group;
          }

          #monthlyTable thead th {
            background: #eaf1f8;
          }

          #monthlyTable thead th.end-first {
            background: #dceeff;
          }

          #monthlyTable thead th.end-second {
            background: #ffe7b3;
          }

          #monthlyTable tbody tr > :nth-child(n+2):nth-child(-n+7) {
            background: #f0f7ff;
          }

          #monthlyTable tbody tr > :nth-child(n+8):nth-child(-n+13) {
            background: #fff8e8;
          }

          #monthlyTable tbody tr > :nth-child(n+14) {
            background: #edf7ef;
          }

          #monthlyTable thead tr:first-child > th:first-child {
            width: 7%;
          }

          #monthlyTable tr {
            break-inside: avoid;
          }

          #monthlySummary {
            margin-top: 5px;
            font-size: 8pt;
          }

          @media print {
            body {
              print-color-adjust: exact;
              -webkit-print-color-adjust: exact;
            }
          }
        </style>
      </head>

      <body>
        <div class="report-heading">
          <h1>APTRANSCO</h1>
          <p>400 kV SUBSTATION, KALIKIRI</p>
          <p>MONTHLY ENERGY METER REGISTER</p>
        </div>

        ${report.innerHTML}
      </body>
      </html>
    `);

    printWindow.document.close();
    printWindow.focus();

    printWindow.requestAnimationFrame(function () {
      printWindow.requestAnimationFrame(function () {
        printWindow.print();
      });
    });
  });
})();
/* YEAR CALENDAR — MONTH SELECTION */
(function setupMonthlyCalendar() {
  const calendar = document.getElementById("monthlyCalendarMonths");
  if (!calendar) return;

  const scrollBox = document.getElementById("monthlyCalendarScroll");
  const yearHeading = document.getElementById("calendarYearHeading");
  const selectedLabel = document.getElementById("calendarSelectedMonth");
  const clock = document.getElementById("monthlyCalendarClock");

  const monthNames = [
    "JANUARY", "FEBRUARY", "MARCH", "APRIL",
    "MAY", "JUNE", "JULY", "AUGUST",
    "SEPTEMBER", "OCTOBER", "NOVEMBER", "DECEMBER"
  ];

  function indiaToday() {
    const parts = new Intl.DateTimeFormat("en-GB", {
      timeZone: "Asia/Kolkata",
      year: "numeric",
      month: "2-digit",
      day: "2-digit"
    }).formatToParts(new Date());

    const values = {};

    parts.forEach(part => {
      values[part.type] = part.value;
    });

    return {
      year: Number(values.year),
      month: Number(values.month),
      day: Number(values.day),
      monthKey: values.year + "-" + values.month,
      dateKey: values.year + "-" + values.month + "-" + values.day
    };
  }

  let today = indiaToday();
  const requestedMonth = window.location.pathname.endsWith("/consolidated-report.html")
    ? null : new URLSearchParams(window.location.search).get("month");
  if (/^\d{4}-(0[1-9]|1[0-2])$/.test(requestedMonth || "") &&
      requestedMonth <= today.monthKey) {
    registerMonth.value = requestedMonth;
  }
  let displayedYear = registerMonth.value
    ? Number(registerMonth.value.slice(0, 4))
    : today.year;

  registerMonth.max = today.monthKey;

  if (
    !registerMonth.value ||
    registerMonth.value > today.monthKey
  ) {
    registerMonth.value = today.monthKey;
  }

  function updateSelectedLabel() {
    const [year, month] = registerMonth.value.split("-").map(Number);

    selectedLabel.textContent = monthNames[month - 1] + " " + year;
  }

  function selectMonth(key) {
    /* FUTURE MONTHS CANNOT BE SELECTED */
    today = indiaToday();

    if (key > today.monthKey) return;

    registerMonth.value = key;

    registerMonth.dispatchEvent(
      new Event("change", { bubbles: true })
    );

    updateSelectedLabel();

    calendar.querySelectorAll("[data-calendar-month]").forEach(block => {
      block.classList.toggle(
        "selected",
        block.dataset.calendarMonth === key
      );
    });

    registerStatus.textContent =
      selectedLabel.textContent +
      " selected. Choose a feeder or ICT.";
  }

  function renderCalendar(scrollToSelected) {
    yearHeading.textContent = displayedYear;

    let html = "";

    for (let month = 1; month <= 12; month++) {
      const key = displayedYear + "-" +
        String(month).padStart(2, "0");

      const future = key > today.monthKey;
      const selected = key === registerMonth.value;

      const firstDay = new Date(
        Date.UTC(displayedYear, month - 1, 1)
      ).getUTCDay();

      /* MONDAY IS THE FIRST COLUMN */
      const offset = (firstDay + 6) % 7;

      const days = new Date(
        Date.UTC(displayedYear, month, 0)
      ).getUTCDate();

      let grid = ["Mo", "Tu", "We", "Th", "Fr", "Sa", "Su"]
        .map(day =>
          '<span class="monthly-calendar-weekday">' + day + "</span>"
        ).join("");

      for (let cell = 0; cell < 42; cell++) {
        const day = cell - offset + 1;

        if (day < 1 || day > days) {
          grid += '<span aria-hidden="true"></span>';
          continue;
        }

        const isToday =
          displayedYear === today.year &&
          month === today.month &&
          day === today.day;

        grid += `
          <button type="button"
                  class="monthly-calendar-day ${isToday ? "today" : ""}"
                  data-select-month="${key}"
                  aria-label="Select ${monthNames[month - 1]} ${displayedYear}"
                  ${isToday ? 'aria-current="date"' : ""}
                  ${future ? "disabled" : ""}>
            ${day}
          </button>
        `;
      }

      html += `
        <section class="monthly-calendar-month
                        ${future ? "future" : ""}
                        ${selected ? "selected" : ""}"
                        ${key === today.monthKey ? "running-month" : ""}
                 data-calendar-month="${key}">

          <button type="button"
                  class="monthly-calendar-month-title"
                  data-select-month="${key}"
                  ${future ? "disabled" : ""}>
            ${monthNames[month - 1]} ${displayedYear}
          </button>

          <div class="monthly-calendar-days">${grid}</div>
        </section>
      `;
    }

    calendar.innerHTML = html;
    updateSelectedLabel();

    if (scrollToSelected) {
      const selectedMonth = Number(
        registerMonth.value.slice(5, 7)
      );

      const sameYear =
        Number(registerMonth.value.slice(0, 4)) === displayedYear;

      /* SHOW PREVIOUS, SELECTED AND NEXT MONTH WHERE POSSIBLE */
      const firstVisibleMonth = sameYear
        ? Math.max(1, Math.min(10, selectedMonth - 1))
        : 1;

      scrollBox.scrollTop = (firstVisibleMonth - 1) * 220;
    }
  }

  calendar.addEventListener("click", function (event) {
    const button = event.target.closest("[data-select-month]");

    if (!button || button.disabled) return;

    selectMonth(button.dataset.selectMonth);
  });

  document.getElementById("calendarPreviousYear")
    .addEventListener("click", function () {
      if (displayedYear <= 1900) return;

      displayedYear--;
      renderCalendar(true);
    });

  document.getElementById("calendarNextYear")
    .addEventListener("click", function () {
      if (displayedYear >= 2100) return;

      displayedYear++;
      renderCalendar(true);
    });

  function updateCalendarClock() {
    const now = new Date();

    clock.textContent =
      now.toLocaleDateString("en-GB", {
        timeZone: "Asia/Kolkata",
        day: "2-digit",
        month: "short",
        year: "numeric"
      }) +
      " | " +
      now.toLocaleTimeString("en-US", {
        timeZone: "Asia/Kolkata",
        hour: "2-digit",
        minute: "2-digit",
        second: "2-digit",
        hour12: true
      });

    const current = indiaToday();

    if (current.dateKey !== today.dateKey) {
      const monthChanged = current.monthKey !== today.monthKey;
      const followingCurrentMonth =
        registerMonth.value === today.monthKey;
      const viewingCurrentYear = displayedYear === today.year;

      today = current;
      registerMonth.max = today.monthKey;

      if (monthChanged && followingCurrentMonth) {
        registerMonth.value = today.monthKey;

        if (viewingCurrentYear) {
          displayedYear = today.year;
        }

        registerMonth.dispatchEvent(new Event("change"));
      }

      const position = scrollBox.scrollTop;

      renderCalendar(monthChanged && followingCurrentMonth);

      if (!monthChanged || !followingCurrentMonth) {
        scrollBox.scrollTop = position;
      }
    }
  }

  renderCalendar(true);
  updateCalendarClock();

  registerStatus.textContent =
    selectedLabel.textContent +
    " selected. Choose a feeder or ICT.";

  setInterval(updateCalendarClock, 1000);
})();
/* ARROW KEYS MOVE BETWEEN READING BOXES */

document.addEventListener("keydown", function (event) {
    const input = event.target;

    if (
        !input.matches(
            "#registerPanel input[type='number']"
        ) ||
        ![
            "ArrowUp",
            "ArrowDown",
            "ArrowLeft",
            "ArrowRight"
        ].includes(event.key) ||
        event.altKey ||
        event.ctrlKey ||
        event.metaKey ||
        event.shiftKey
    ) {
        return;
    }

    event.preventDefault();

    const openingBox =
        document.getElementById("openingReadings");

    const tableBody =
        document.getElementById("monthlyTableBody");

    const openingInputs = Array.from(
        openingBox.querySelectorAll(
            "input[type='number']"
        )
    );

    const readingRows = Array.from(tableBody.rows)
        .map(function (row) {
            return Array.from(
                row.querySelectorAll(
                    "input[type='number']"
                )
            );
        });

    const grid = [
        openingInputs,
        ...readingRows
    ].filter(function (row) {
        return row.length > 0;
    });

    let rowIndex = -1;
    let columnIndex = -1;

    grid.forEach(function (row, index) {
        const position = row.indexOf(input);

        if (position !== -1) {
            rowIndex = index;
            columnIndex = position;
        }
    });

    if (rowIndex === -1) return;

    let nextRow = rowIndex;
    let nextColumn = columnIndex;

    if (event.key === "ArrowUp") nextRow--;
    if (event.key === "ArrowDown") nextRow++;
    if (event.key === "ArrowLeft") nextColumn--;
    if (event.key === "ArrowRight") nextColumn++;

    const nextInput = grid[nextRow]?.[nextColumn];

    if (!nextInput || nextInput.disabled) return;

    nextInput.focus({ preventScroll: true });

    nextInput.scrollIntoView({
        block: "nearest",
        inline: "nearest",
        behavior: "auto"
    });

    nextInput.select();
});

/* MOUSE WHEEL MUST NOT CHANGE READINGS */

document.addEventListener("wheel", function (event) {
    if (
        event.target.matches(
            "#registerPanel input[type='number']"
        ) &&
        document.activeElement === event.target
    ) {
        event.target.blur();
    }
}, { passive: true, capture: true });