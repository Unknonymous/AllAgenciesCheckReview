// Function to handle file selection
function handleFileSelect(callback, auditNumber) {
  const input = document.createElement('input');
  input.type = 'file';
  input.addEventListener('change', function() {
    const file = input.files[0];
    const reader = new FileReader();
    reader.onload = function(event) {
      const fileContents = event.target.result;
      callback(fileContents, auditNumber);
    };
    reader.readAsText(file);
  });
  input.click();
}

// Handle click on the first button
document.getElementById('audit1Button').addEventListener('click', function() {
  handleFileSelect(function(fileContents, auditNumber) {
    const auditData = JSON.parse(fileContents);
    window['audit' + auditNumber] = auditData;
    console.log('Audit ' + auditNumber + ' file loaded:', auditData);
    displayAuditContent(auditNumber);
  }, 1);
});

// Handle click on the second button
document.getElementById('audit2Button').addEventListener('click', function() {
  handleFileSelect(function(fileContents, auditNumber) {
    const auditData = JSON.parse(fileContents);
    window['audit' + auditNumber] = auditData;
    console.log('Audit ' + auditNumber + ' file loaded:', auditData);
    displayAuditContent(auditNumber);
  }, 2);
});

// Function to display the content of audit1 and audit2
function displayAuditContent(auditNumber) {
  const auditContent = document.createElement('p');
  auditContent.textContent = 'Audit ' + auditNumber + ' Content: ' + window['audit' + auditNumber].name + ' : ' + window['audit' + auditNumber].timestamp;
  document.body.appendChild(auditContent);

  if (window.audit1 && window.audit2) {
    console.log('Both files loaded');
  }
}