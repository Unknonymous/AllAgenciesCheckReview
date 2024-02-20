// Function to handle file selection
function handleFileSelect(callback, auditNumber) {
  const fileInput = document.createElement('input');
  fileInput.type = 'file';
  fileInput.addEventListener('change', function() {
    const selectedFile = fileInput.files[0];
    const reader = new FileReader();
    reader.onload = function(event) {
      const fileText = event.target.result;
      callback(fileText, auditNumber);
    };
    reader.readAsText(selectedFile);
  });
  fileInput.click();
}

// Callback function for handling loaded file
function handleFileLoad(fileText, auditNumber) {
  const auditData = JSON.parse(fileText);
  window['audit' + auditNumber] = auditData;
  console.log('Audit ' + auditNumber + ' file loaded:', auditData);
  displayAuditContent(auditNumber);
  checkEnableAnalyzeButton();
}

// Handle click on the first button
document.getElementById('audit1Button').addEventListener('click', function() {
  handleFileSelect(handleFileLoad, 1);
});

// Handle click on the second button
document.getElementById('audit2Button').addEventListener('click', function() {
  handleFileSelect(handleFileLoad, 2);
});

// Function to display the content of audit1 and audit2
function displayAuditContent(auditNumber) {
  const audit = window['audit' + auditNumber];
  if (audit && audit.name && audit.timestamp) {
    const loadedFiles = document.getElementById('loadedFiles');
    const auditContent = document.createElement('p');
    auditContent.textContent = 'Audit ' + auditNumber + ' Content: ' + audit.name + ' : ' + audit.timestamp;
    loadedFiles.appendChild(auditContent);
    // document.body.appendChild(auditContent);
  } else {
    console.error('Invalid audit data for Audit ' + auditNumber);
  }
}

// Function to check and enable the "Analyze Reports" button
function checkEnableAnalyzeButton() {
  const analyzeButton = document.getElementById('analyzeButton');
  const exportButton = document.getElementById('exportButton');
  if (window.audit1 && window.audit2) {
    analyzeButton.disabled = false;
    exportButton.disabled = false;
  } else {
    analyzeButton.disabled = true;
    exportButton.disabled = true;
  }
}

// Handle click on the "Analyze Reports" button
document.getElementById('analyzeButton').addEventListener('click', function() {
  analyzeReports();
});

// Function to analyze reports
const agencyData = {}; // Object to store aggregated data by agency name
const auditDates = {}; // Object to store audit execution dates
function analyzeReports() {
  console.log('III analyzeReports');
  // Assuming audit1 and audit2 are global objects containing the respective JSON data
  if (!window.audit1 || !window.audit2) {
    console.error('Audit data not loaded for analysis.');
    return;
  }

  // const agencyData = {}; // Object to store aggregated data by agency name

  // Function to update or initialize agencyData
  function updateAgencyData(audit, auditNumber) {
    // console.log('III  audit.results[1].allTests', audit.results[1].allTests);
    if (!auditDates['audit'+auditNumber + '_date']){
      const auditDate = new Date(audit.timestamp).toLocaleDateString();
      auditDates['audit'+auditNumber + '_date'] = auditDate;
    }
    audit.results[1].allTests.forEach(result => {
      const agencyName = Object.keys(result)[1] ? Object.keys(result)[1].replace(/^Contact Count for (.+):.*/, '$1') : 'Unknown Agency';
      const contactCount = Object.keys(result)[1] ? parseInt(Object.keys(result)[1].split(" ").pop()) : NaN;
      console.log('III  contactCount', contactCount);
      console.log('III  agencyName', agencyName);
      if (!agencyData[agencyName]) {
        agencyData[agencyName] = {
          name: agencyName,
          audit1_contact_count: 0,
          audit2_contact_count: 0,
          contact_count_diff: 0,
          alert: false,
        };
      }
      agencyData[agencyName]['audit' + auditNumber + '_contact_count'] += contactCount;
    });
  }

  // Update agencyData for audit1 and audit2
  updateAgencyData(window.audit1, 1);
  updateAgencyData(window.audit2, 2);

  // Function to calculate contact_count_diff and set alert
  function calculateDiffAndAlert() {
    for (const agencyName in agencyData) {
      const audit1_count = agencyData[agencyName].audit1_contact_count;
      const audit2_count = agencyData[agencyName].audit2_contact_count;

      // Calculate contact_count_diff
      agencyData[agencyName].contact_count_diff = audit2_count - audit1_count;

      // Set alert based on 80% variance
      agencyData[agencyName].alert = Math.abs(agencyData[agencyName].contact_count_diff) > 0.8 * Math.max(audit1_count, audit2_count);
    }
  }

  // Calculate contact_count_diff and set alert
  calculateDiffAndAlert();

  // // Display results in a table in the UI
  displayResultsInTable(agencyData);
}

// Function to display results in a table
function displayResultsInTable(agencyData) {
  const tableContainer = document.getElementById('resultsTable');
  if (!tableContainer) {
    console.error('Table container not found.');
    return;
  }

  // Clear existing content
  tableContainer.innerHTML = '';

  // Create the table
  const table = document.createElement('table');
  table.innerHTML = `
    <thead>
      <tr>
        <th onclick="sortTable(agencyData, 'name')"> Agency Name</th>
        <th onclick="sortTable(agencyData, 'audit1_contact_count')">Contact Count \n ${auditDates.audit1_date}</th>
        <th onclick="sortTable(agencyData, 'audit2_contact_count')">${auditDates.audit2_date} Contact Count</th>
        <th onclick="sortTable(agencyData, 'contact_count_diff')">Contact Count Diff</th>
        <th onclick="sortTable(agencyData, 'alert')">Delta >80%</th>
      </tr>
    </thead>
    <tbody id="tableBody">
      ${Object.values(agencyData)
        .map(
          agency =>
            `<tr>
              <td>${agency.name}</td>
              <td>${agency.audit1_contact_count}</td>
              <td>${agency.audit2_contact_count}</td>
              <td>${agency.contact_count_diff}</td>
              <td class="${agency.alert ? 'alert-true' : ''}">${agency.alert}</td>
            </tr>`
        )
        .join('')}
    </tbody>
  `;

  // Append the table to the container
  tableContainer.appendChild(table);
}

// Function to sort the table data
function sortTable(data, column) {
  const tableBody = document.getElementById('tableBody');
  if (!tableBody) {
      console.error('Table body not found.');
      return;
  }

  // Initialize or retrieve the current sorting order from the column header
  const sortOrder = tableBody.getAttribute('data-sort-order') === 'asc' ? 'desc' : 'asc';

  // Sort the data based on the selected column and sorting order
  const sortedData = Object.values(data).sort((a, b) => {
      let comparisonResult;

      if (column === 'name') {
          // Use String() to ensure comparison is done as strings
          comparisonResult = String(a[column]).localeCompare(String(b[column]));
      // } else if (column === 'alert') {
      //     // Sort booleans based on the sorting order
      //     comparisonResult = sortOrder === 'asc' ? a[column] - b[column] : b[column] - a[column];
      } else {
          // Use Number() to ensure comparison is done as numbers
          comparisonResult = Number(a[column]) - Number(b[column]);
      }

      // Reverse the result for descending order
      return sortOrder === 'asc' ? comparisonResult : -comparisonResult;
  });

  // Update the sorting order attribute for the next click
  tableBody.setAttribute('data-sort-order', sortOrder);

  // Clear the existing content
  tableBody.innerHTML = '';

  // Append the sorted data to the table
  tableBody.innerHTML = sortedData
      .map(
          agency =>
              `<tr>
                  <td>${agency.name}</td>
                  <td>${agency.audit1_contact_count}</td>
                  <td>${agency.audit2_contact_count}</td>
                  <td>${agency.contact_count_diff}</td>
                  <td class="${agency.alert ? 'alert-true' : ''}">${agency.alert}</td>
              </tr>`
      )
      .join('');
}

// Handle click on the "Export Report" button
document.getElementById('exportButton').addEventListener('click', function() {
  exportReportToCSV(agencyData);
});

// Function to export the report data to CSV
function exportReportToCSV(data) {
  const csvContent = generateCSVContent(data);

  // Create a Blob with the CSV data
  const blob = new Blob([csvContent], { type: 'text/csv' });

  // Create a link element to trigger the download
  const link = document.createElement('a');
  link.href = URL.createObjectURL(blob);
  link.download = 'report.csv';

  // Append the link to the document and trigger the click event
  document.body.appendChild(link);
  link.click();

  // Remove the link from the document
  document.body.removeChild(link);
}

// Function to generate CSV content from the report data
function generateCSVContent(data) {
  const header = ['Agency Name', 'Audit 1 Contact Count', 'Audit 2 Contact Count', 'Contact Count Diff', 'Delta >80%'].join(',');
  const rows = Object.values(data)
    .map(agency => [agency.name, agency.audit1_contact_count, agency.audit2_contact_count, agency.contact_count_diff, agency.alert].join(','))
    .join('\n');

  return `${header}\n${rows}`;
}