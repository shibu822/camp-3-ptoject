// Guard and logout setup
guardRoute('doctor');
setupLogout();

// Storage helpers via common.js:
// window.store.get(key), window.store.set(key)

let currentPatientId = null;

// Global search in tables
document.getElementById('globalSearch').addEventListener('input', function(){
  const q = (this.value || '').toLowerCase();
  const apptRows = document.querySelectorAll('#apptsTable tbody tr');
  apptRows.forEach(r => { r.style.display = r.textContent.toLowerCase().includes(q) ? '' : 'none'; });
  const visitRows = document.querySelectorAll('#visitsTable tbody tr');
  visitRows.forEach(r => { r.style.display = r.textContent.toLowerCase().includes(q) ? '' : 'none'; });
});

// Render today's appointments (optionally filter by logged-in doctor later)
function renderAppts(){
  const tbody = document.querySelector('#apptsTable tbody');
  const appts = store.get('appointments');
  tbody.innerHTML = '';
  const today = new Date().toISOString().slice(0,10);
  appts
    .filter(a => a.doctor && a.datetime && a.datetime.slice(0,10) === today)
    .forEach(a => {
      const tr = document.createElement('tr');
      tr.innerHTML = `
        <td>${a.id}</td>
        <td>${a.patientId}</td>
        <td>${a.doctor}</td>
        <td>${a.datetime}</td>
        <td>${a.status}</td>
        <td class="actions-row">
          <button data-act="open" data-patient="${a.patientId}">Open</button>
        </td>`;
      tbody.appendChild(tr);
    });
}

function openPatient(patientId){
  currentPatientId = patientId;
  const patients = store.get('patients');
  const p = patients.find(x => x.id === patientId);
  document.getElementById('patientHeader').textContent = p ? (p.id + ' - ' + p.name) : ('Patient ' + patientId);

  // Clear form
  document.getElementById('visitForm').reset();
  renderVisits();
}

// Helpers for lab tests and BMI
function fillLabTests(){
  const sel = document.getElementById('v_labtests');
  const tests = store.get('labTests'); // provided by Admin
  sel.innerHTML = '';
  tests.forEach(t => {
    const opt = document.createElement('option');
    opt.value = t.name;
    opt.textContent = t.name;
    sel.appendChild(opt);
  });
}
function getSelectedLabTests(){
  const sel = document.getElementById('v_labtests');
  return Array.from(sel.selectedOptions).map(o => o.value);
}
function computeBMI(weightKg, heightCm){
  if(!weightKg || !heightCm) return null;
  const h = heightCm / 100;
  const bmi = weightKg / (h*h);
  return Math.round(bmi * 10) / 10;
}

// Save visit with vitals, notes, prescriptions, lab requests
function saveVisit(e){
  e.preventDefault();
  if(!currentPatientId){ alert('Open an appointment/patient first.'); return; }

  const weight = parseFloat(document.getElementById('v_weight').value || 0);
  const height = parseFloat(document.getElementById('v_height').value || 0);
  const symptoms = document.getElementById('v_symptoms').value.trim();
  const diagnosis = document.getElementById('v_diagnosis').value.trim();

  // Auto-create draft invoice for Receptionist
(function createDraftInvoice(){
  const settings = (store.get('settings') || [])[0] || { doctorFee: 0 };
  const medCatalog = store.get('medicines');
  const testCatalog = store.get('labTests');

  const items = [];
  if(settings.doctorFee > 0){
    items.push({ name: 'Doctor Fee', price: Number(settings.doctorFee) });
  }
  labtests.forEach(t => {
    const rec = (testCatalog || []).find(x => x.name.toLowerCase() === t.toLowerCase());
    items.push({ name: `Lab: ${t}`, price: rec ? Number(rec.price||0) : 0 });
  });
  prescriptions.forEach(m => {
    const rec = (medCatalog || []).find(x => x.name.toLowerCase() === m.toLowerCase());
    items.push({ name: `Medicine: ${m}`, price: rec ? Number(rec.price||0) : 0 });
  });

  if(items.length){
    let invoices = store.get('invoices');
    const today = new Date().toISOString().slice(0,10);
    let inv = invoices.find(b => b.patientId === currentPatientId && b.date === today);
    if(inv){
      inv.items = (inv.items || []).concat(items);
      inv.total = (inv.items || []).reduce((s,i)=> s + Number(i.price||0), 0);
    } else {
      inv = {
        id: 'INV' + (invoices.length + 1).toString().padStart(3,'0'),
        patientId: currentPatientId,
        date: today,
        items,
        discount: 0,
        total: items.reduce((s,i)=> s + Number(i.price||0), 0),
        status: 'Unpaid'
      };
      invoices.push(inv);
    }
    store.set('invoices', invoices);
  }
})();


  // Prescriptions as comma-separated list -> array
  const prescriptionsStr = document.getElementById('v_prescriptions').value.trim();
  const prescriptions = prescriptionsStr ? prescriptionsStr.split(',').map(s => s.trim()).filter(Boolean) : [];

  // Lab tests from multi-select
  const labtests = getSelectedLabTests();

  // Optional BMI
  const bmi = computeBMI(weight, height);

  // Build visit record
  const entry = {
    patientId: currentPatientId,
    date: new Date().toISOString(),
    weight, height, bmi,
    symptoms, diagnosis,
    prescriptions,
    labtests
  };

  // Persist visit
  const visits = store.get('visits');
  visits.push(entry);
  store.set('visits', visits);

  // Generate lab requests for Lab Technician
  if(labtests.length){
    const labReqs = store.get('labRequests');
    labtests.forEach(test => {
      labReqs.push({
        id: 'L' + (labReqs.length + 1).toString().padStart(3,'0'),
        patientId: currentPatientId,
        testName: test,
        requestedOn: entry.date,
        status: 'Requested',
        result: ''
      });
    });
    store.set('labRequests', labReqs);
  }

  // Generate prescriptions for Pharmacist
  if(prescriptions.length){
    const rx = store.get('prescriptions');
    prescriptions.forEach(item => {
      rx.push({
        id: 'RX' + (rx.length + 1).toString().padStart(3,'0'),
        patientId: currentPatientId,
        item,
        prescribedOn: entry.date,
        status: 'Pending'
      });
    });
    store.set('prescriptions', rx);
  }

  renderVisits();
  e.target.reset();
  alert('Visit saved successfully.');
}

function renderVisits(){
  const tbody = document.querySelector('#visitsTable tbody');
  const visits = store.get('visits').filter(v => v.patientId === currentPatientId);
  tbody.innerHTML = '';
  visits.forEach(v => {
    const tr = document.createElement('tr');
    tr.innerHTML = `
      <td>${v.date.slice(0,16).replace('T',' ')}</td>
      <td>${v.weight || '-'}</td>
      <td>${v.height || '-'}</td>
      <td>${v.bmi ?? '-'}</td>
      <td>${v.symptoms || '-'}</td>
      <td>${v.diagnosis || '-'}</td>
      <td>${(v.prescriptions||[]).join(', ') || '-'}</td>
      <td>${(v.labtests||[]).join(', ') || '-'}</td>
    `;
    tbody.appendChild(tr);
  });
}

// Event bindings
document.getElementById('visitForm').addEventListener('submit', saveVisit);
document.getElementById('apptsTable').addEventListener('click', (e) => {
  const btn = e.target.closest('button');
  if(!btn) return;
  if(btn.getAttribute('data-act') === 'open'){
    const pid = btn.getAttribute('data-patient');
    openPatient(pid);
  }
});

// Init
renderAppts();
fillLabTests();
