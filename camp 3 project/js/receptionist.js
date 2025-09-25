guardRoute('receptionist');
setupLogout();

// Search filter
document.getElementById('globalSearch').addEventListener('input', function(){
  const q = (this.value || '').toLowerCase();
  ['patientsTable','apptsTable','billTable'].forEach(id=>{
    const rows = document.querySelectorAll(`#${id} tbody tr`);
    rows.forEach(r => { r.style.display = r.textContent.toLowerCase().includes(q) ? '' : 'none'; });
  });
});

function fillDoctorOptions(){
  const sel = document.getElementById('a_doctor');
  const staff = store.get('staff').filter(s => s.role === 'doctor');
  sel.innerHTML = '<option value="">Select doctor</option>';
  staff.forEach(d => {
    const opt = document.createElement('option');
    opt.value = d.name;
    opt.textContent = d.name + (d.department ? ` (${d.department})` : '');
    sel.appendChild(opt);
  });
}
function fillPatientSelect(){
  const sel = document.getElementById('p_select');
  const pts = store.get('patients');
  sel.innerHTML = '<option value="">New Patient</option>';
  pts.forEach(p => {
    const opt = document.createElement('option'); opt.value = p.id; opt.textContent = `${p.id} - ${p.name}`; sel.appendChild(opt);
  });
}

// Patients
function renderPatients(){
  const tbody = document.querySelector('#patientsTable tbody');
  const patients = store.get('patients');
  tbody.innerHTML = '';
  patients.forEach(p => {
    const tr = document.createElement('tr');
    tr.innerHTML = `
      <td>${p.id}</td><td>${p.name}</td><td>${p.age}</td><td>${p.phone}</td><td>${p.address}</td>
      <td class="actions-row"><button data-act="edit-p" data-id="${p.id}">Edit</button><button data-act="del-p" data-id="${p.id}">Delete</button></td>`;
    tbody.appendChild(tr);
  });
  fillPatientSelect();
}
function addOrUpdatePatient(e){
  e.preventDefault();
  const id = document.getElementById('p_id').value.trim();
  const name = document.getElementById('p_name').value.trim();
  const age = parseInt(document.getElementById('p_age').value,10);
  const phone = document.getElementById('p_phone').value.trim();
  const address = document.getElementById('p_address').value.trim();
  if (!id || !name) return;
  let patients = store.get('patients');
  const exists = patients.find(p => p.id === id);
  if(exists){ exists.name=name; exists.age=age; exists.phone=phone; exists.address=address; }
  else { patients.push({ id, name, age, phone, address }); }
  store.set('patients', patients); renderPatients(); e.target.reset(); document.getElementById('p_select').value = '';
}
document.getElementById('p_select').addEventListener('change', function(){
  const id = this.value;
  if(!id){ document.getElementById('patientForm').reset(); return; }
  const p = store.get('patients').find(x => x.id === id); if(!p) return;
  document.getElementById('p_id').value = p.id;
  document.getElementById('p_name').value = p.name;
  document.getElementById('p_age').value = p.age;
  document.getElementById('p_phone').value = p.phone;
  document.getElementById('p_address').value = p.address;
});
document.getElementById('patientsTable').addEventListener('click', (e)=>{
  const btn = e.target.closest('button'); if(!btn) return;
  const id = btn.getAttribute('data-id'); const act = btn.getAttribute('data-act');
  if(act === 'edit-p'){
    const p = store.get('patients').find(x => x.id === id); if(!p) return;
    document.getElementById('p_select').value = p.id;
    document.getElementById('p_id').value = p.id;
    document.getElementById('p_name').value = p.name;
    document.getElementById('p_age').value = p.age;
    document.getElementById('p_phone').value = p.phone;
    document.getElementById('p_address').value = p.address;
  } else if(act === 'del-p'){
    let pts = store.get('patients').filter(x => x.id !== id);
    store.set('patients', pts); renderPatients();
  }
});

// Appointments
function renderAppts(){
  const tbody = document.querySelector('#apptsTable tbody');
  const appts = store.get('appointments');
  tbody.innerHTML = '';
  appts.forEach(a => {
    const tr = document.createElement('tr');
    tr.innerHTML = `
      <td>${a.id}</td><td>${a.patientId}</td><td>${a.doctor}</td><td>${a.datetime}</td><td>${a.status}</td>
      <td class="actions-row">
        <button data-act="set-appt" data-id="${a.id}" data-status="Scheduled">Scheduled</button>
        <button data-act="set-appt" data-id="${a.id}" data-status="Completed">Completed</button>
        <button data-act="set-appt" data-id="${a.id}" data-status="Cancelled">Cancelled</button>
        <button data-act="del-appt" data-id="${a.id}">Delete</button>
      </td>`;
    tbody.appendChild(tr);
  });
}
function addAppt(e){
  e.preventDefault();
  const id = document.getElementById('a_id').value.trim();
  const patientId = document.getElementById('a_patientId').value.trim();
  const doctor = document.getElementById('a_doctor').value;
  const datetime = document.getElementById('a_datetime').value;
  if (!id || !patientId || !doctor || !datetime) return;
  let appts = store.get('appointments');
  const exists = appts.find(a => a.id === id);
  if(exists){ exists.patientId=patientId; exists.doctor=doctor; exists.datetime=datetime; }
  else { appts.push({ id, patientId, doctor, datetime, status:'Scheduled' }); }
  store.set('appointments', appts); renderAppts(); e.target.reset();
}
document.getElementById('apptsTable').addEventListener('click', (e)=>{
  const btn = e.target.closest('button'); if(!btn) return;
  const id = btn.getAttribute('data-id'); const act = btn.getAttribute('data-act');
  if(act === 'set-appt'){
    const status = btn.getAttribute('data-status');
    let appts = store.get('appointments'); const a = appts.find(x => x.id === id);
    if(a){ a.status = status; store.set('appointments', appts); renderAppts(); }
  } else if(act === 'del-appt'){
    let appts = store.get('appointments').filter(a => a.id !== id);
    store.set('appointments', appts); renderAppts();
  }
});

// Billing (read-only items, status only)
function renderItemsReadonly(items){
  const wrap = document.getElementById('itemsList');
  wrap.innerHTML = '';
  (items||[]).forEach(it => {
    const row = document.createElement('div');
    row.style.display='flex'; row.style.justifyContent='space-between'; row.style.margin='6px 0';
    row.innerHTML = `<span>${it.name}</span><span>${Number(it.price||0).toFixed(2)}</span>`;
    wrap.appendChild(row);
  });
}
function renderBills(){
  const tbody = document.querySelector('#billTable tbody');
  const invoices = store.get('invoices');
  tbody.innerHTML = '';
  invoices.forEach(b => {
    const tr = document.createElement('tr');
    tr.innerHTML = `<td>${b.id}</td><td>${b.patientId}</td><td>${b.date}</td><td>${Number(b.total||0).toFixed(2)}</td><td>${b.status}</td>
      <td class="actions-row"><button data-act="edit-b" data-id="${b.id}">Open</button></td>`;
    tbody.appendChild(tr);
  });
}
function loadInvoice(id){
  const inv = store.get('invoices').find(b => b.id === id); if(!inv) return;
  document.getElementById('b_id').value = inv.id;
  document.getElementById('b_patientId').value = inv.patientId;
  document.getElementById('b_date').value = inv.date;
  document.getElementById('b_status').value = inv.status || 'Unpaid';
  renderItemsReadonly(inv.items);
  document.getElementById('b_total').textContent = Number(inv.total||0).toFixed(2);
  window.scrollTo({ top: 0, behavior: 'smooth' });
}
function saveInvoice(e){
  e.preventDefault();
  const id = document.getElementById('b_id').value.trim(); if(!id) return;
  let invoices = store.get('invoices');
  const inv = invoices.find(b => b.id === id); if(!inv) return;
  inv.status = document.getElementById('b_status').value;
  store.set('invoices', invoices);
  renderBills();
}
document.getElementById('billTable').addEventListener('click', (e)=>{
  const btn = e.target.closest('button'); if(!btn) return;
  const id = btn.getAttribute('data-id'); const act = btn.getAttribute('data-act');
  if(act==='edit-b'){ loadInvoice(id); }
});

// Print
document.getElementById('printBtn').addEventListener('click', ()=>{
  const id = document.getElementById('b_id').value.trim();
  if(!id){ alert('Open an invoice first.'); return; }
  const inv = store.get('invoices').find(b => b.id === id); if(!inv){ alert('Invoice not found.'); return; }
  const content = `
    <h2>Clinic Invoice</h2>
    <p><strong>Invoice:</strong> ${inv.id}</p>
    <p><strong>Patient ID:</strong> ${inv.patientId}</p>
    <p><strong>Date:</strong> ${inv.date}</p>
    <hr/><h3>Items</h3><ul>${(inv.items||[]).map(i=>`<li>${i.name} - ${Number(i.price||0).toFixed(2)}</li>`).join('')}</ul>
    <p><strong>Total:</strong> ${Number(inv.total||0).toFixed(2)}</p>
    <p><strong>Status:</strong> ${inv.status}</p>`;
  const wnd = window.open('', '_blank');
  wnd.document.write(`<html><head><title>Invoice ${inv.id}</title></head><body>${content}<script>window.print();</script></body></html>`);
  wnd.document.close();
});

// Bind forms
document.getElementById('patientForm').addEventListener('submit', addOrUpdatePatient);
document.getElementById('apptForm').addEventListener('submit', addAppt);
document.getElementById('billForm').addEventListener('submit', saveInvoice);

// Init
fillDoctorOptions(); renderPatients(); renderAppts(); renderBills();
