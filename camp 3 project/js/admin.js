guardRoute('admin');
setupLogout();

function uniquePush(arr, val, key='name'){
  if(!arr.find(x => (x[key]||'').toLowerCase() === (val[key]||'').toLowerCase())) arr.push(val);
  return arr;
}

// Departments
function fillDeptOptions(){
  const sel = document.getElementById('s_dept');
  const depts = store.get('departments');
  sel.innerHTML = '<option value="">Select department</option>';
  depts.forEach(d => {
    const opt = document.createElement('option'); opt.value = d.name; opt.textContent = d.name; sel.appendChild(opt);
  });
}
function renderDepts(){
  const tbody = document.querySelector('#deptTable tbody');
  const depts = store.get('departments');
  tbody.innerHTML = '';
  depts.forEach(d => {
    const tr = document.createElement('tr');
    tr.innerHTML = `<td>${d.name}</td><td class="actions-row"><button data-act="del-d" data-id="${d.name}">Remove</button></td>`;
    tbody.appendChild(tr);
  });
}
function addOrUpdateDept(e){
  e.preventDefault();
  const name = document.getElementById('d_name').value.trim();
  if(!name) return;
  let depts = store.get('departments');
  uniquePush(depts, { name }, 'name');
  store.set('departments', depts);
  renderDepts(); fillDeptOptions();
  e.target.reset();
}
function handleDeptsClick(e){
  const btn = e.target.closest('button'); if(!btn) return;
  const name = btn.getAttribute('data-id');
  let depts = store.get('departments').filter(d => d.name.toLowerCase() !== name.toLowerCase());
  store.set('departments', depts);
  renderDepts(); fillDeptOptions();
}

// Staff with credentials
function renderStaff(){
  const tbody = document.querySelector('#staffTable tbody');
  const staff = store.get('staff');
  tbody.innerHTML = '';
  staff.forEach(m => {
    const tr = document.createElement('tr');
    tr.innerHTML = `
      <td>${m.id}</td><td>${m.name}</td><td>${m.role}</td><td>${m.role==='doctor' ? (m.department||'-') : '-'}</td><td>${m.username}</td>
      <td class="actions-row">
        <button data-act="edit-staff" data-id="${m.id}">Edit</button>
        <button data-act="del-staff" data-id="${m.id}">Delete</button>
      </td>`;
    tbody.appendChild(tr);
  });
}
function addOrUpdateStaff(e){
  e.preventDefault();
  const id = document.getElementById('s_id').value.trim();
  const name = document.getElementById('s_name').value.trim();
  const role = document.getElementById('s_role').value;
  const dept = document.getElementById('s_dept').value;
  const username = document.getElementById('s_username').value.trim();
  const password = document.getElementById('s_password').value.trim();
  if(!id || !name || !role || !username || !password) return;

  let staff = store.get('staff');
  const exists = staff.find(x => x.id === id);
  const staffObj = { id, name, role, department: role==='doctor' ? dept : '', username, password };
  if(exists){ Object.assign(exists, staffObj); } else { staff.push(staffObj); }
  store.set('staff', staff);

  // Sync to flat users list for login
  let users = store.get('users');
  const u = users.find(x => x.username === username);
  const userObj = { username, password, role };
  if(u){ Object.assign(u, userObj); } else { users.push(userObj); }
  store.set('users', users);

  renderStaff();
  e.target.reset();
  onRoleChange();
}
function handleStaffClick(e){
  const btn = e.target.closest('button'); if(!btn) return;
  const id = btn.getAttribute('data-id');
  const act = btn.getAttribute('data-act');
  if(act === 'edit-staff'){
    const rec = store.get('staff').find(x => x.id === id); if(!rec) return;
    document.getElementById('s_id').value = rec.id;
    document.getElementById('s_name').value = rec.name;
    document.getElementById('s_role').value = rec.role;
    document.getElementById('s_dept').value = rec.department || '';
    document.getElementById('s_username').value = rec.username || '';
    document.getElementById('s_password').value = rec.password || '';
    onRoleChange();
  } else if(act === 'del-staff'){
    let staff = store.get('staff').filter(x => x.id !== id);
    store.set('staff', staff); renderStaff();
  }
}
function onRoleChange(){
  const role = document.getElementById('s_role').value;
  document.getElementById('deptWrap').style.display = role === 'doctor' ? 'block' : 'none';
}

// Settings (doctor fee), Medicines, Lab Tests with price
function renderSettings(){
  const st = (store.get('settings')||[])[0] || { doctorFee: 0 };
  document.getElementById('set_doctorFee').value = st.doctorFee || 0;
}
function saveSettings(e){
  e.preventDefault();
  const doctorFee = parseFloat(document.getElementById('set_doctorFee').value || 0);
  store.set('settings', [{ doctorFee }]);
  alert('Settings saved.');
}

function renderMeds(){
  const tbody = document.querySelector('#medTable tbody');
  const meds = store.get('medicines');
  tbody.innerHTML = '';
  meds.forEach(m => {
    const tr = document.createElement('tr');
    tr.innerHTML = `<td>${m.name}</td><td>${Number(m.price||0).toFixed(2)}</td>
      <td class="actions-row"><button data-act="del-med" data-id="${m.name}">Remove</button></td>`;
    tbody.appendChild(tr);
  });
}
function addOrUpdateMed(e){
  e.preventDefault();
  const name = document.getElementById('med_name').value.trim();
  const price = parseFloat(document.getElementById('med_price').value || 0);
  if(!name) return;
  let meds = store.get('medicines');
  const ex = meds.find(x => x.name.toLowerCase() === name.toLowerCase());
  if(ex){ ex.price = price; } else { meds.push({ name, price }); }
  store.set('medicines', meds);
  renderMeds(); e.target.reset();
}
function handleMedsClick(e){
  const btn = e.target.closest('button'); if(!btn) return;
  const name = btn.getAttribute('data-id');
  let meds = store.get('medicines').filter(m => m.name.toLowerCase() !== name.toLowerCase());
  store.set('medicines', meds); renderMeds();
}

function renderLabTests(){
  const tbody = document.querySelector('#labTestTable tbody');
  const tests = store.get('labTests');
  tbody.innerHTML = '';
  tests.forEach(t => {
    const tr = document.createElement('tr');
    tr.innerHTML = `<td>${t.name}</td><td>${Number(t.price||0).toFixed(2)}</td>
      <td class="actions-row"><button data-act="del-lt" data-id="${t.name}">Remove</button></td>`;
    tbody.appendChild(tr);
  });
}
function addOrUpdateLabTest(e){
  e.preventDefault();
  const name = document.getElementById('lt_name').value.trim();
  const price = parseFloat(document.getElementById('lt_price').value || 0);
  if(!name) return;
  let tests = store.get('labTests');
  const ex = tests.find(x => x.name.toLowerCase() === name.toLowerCase());
  if(ex){ ex.price = price; } else { tests.push({ name, price }); }
  store.set('labTests', tests);
  renderLabTests(); e.target.reset();
}
function handleLabTestsClick(e){
  const btn = e.target.closest('button'); if(!btn) return;
  const name = btn.getAttribute('data-id');
  let tests = store.get('labTests').filter(t => t.name.toLowerCase() !== name.toLowerCase());
  store.set('labTests', tests); renderLabTests();
}

// Reports
function renderStats(){
  const patients = store.get('patients');
  const appts = store.get('appointments');
  const lab = store.get('labRequests').filter(r => r.status !== 'Completed').length;
  const rx = store.get('prescriptions').filter(p => p.status !== 'Dispensed').length;
  document.getElementById('statPatients').textContent = patients.length;
  document.getElementById('statAppts').textContent = appts.length;
  document.getElementById('statLab').textContent = lab;
  document.getElementById('statRx').textContent = rx;
}

// Global search (console highlight)
document.getElementById('globalSearch').addEventListener('input', function(){
  const q = (this.value||'').toLowerCase();
  const patients = store.get('patients').filter(p => Object.values(p).join(' ').toLowerCase().includes(q));
  const staff = store.get('staff').filter(s => Object.values(s).join(' ').toLowerCase().includes(q));
  const depts = store.get('departments').filter(d => d.name.toLowerCase().includes(q));
  console.log('Search matches:', { patients, staff, depts });
});

// Bindings and init
document.getElementById('deptForm').addEventListener('submit', addOrUpdateDept);
document.getElementById('deptTable').addEventListener('click', handleDeptsClick);
document.getElementById('staffForm').addEventListener('submit', addOrUpdateStaff);
document.getElementById('staffTable').addEventListener('click', handleStaffClick);
document.getElementById('s_role').addEventListener('change', onRoleChange);

document.getElementById('settingsForm').addEventListener('submit', saveSettings);
document.getElementById('medForm').addEventListener('submit', addOrUpdateMed);
document.getElementById('medTable').addEventListener('click', handleMedsClick);
document.getElementById('labTestForm').addEventListener('submit', addOrUpdateLabTest);
document.getElementById('labTestTable').addEventListener('click', handleLabTestsClick);

fillDeptOptions(); onRoleChange();
renderDepts(); renderStaff(); renderSettings(); renderMeds(); renderLabTests(); renderStats();
