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
  depts.forEach(d => { const o=document.createElement('option'); o.value=d.name; o.textContent=d.name; sel.appendChild(o); });
}
function renderDepts(){
  const tb=document.querySelector('#deptTable tbody'); const depts=store.get('departments'); tb.innerHTML='';
  depts.forEach(d => { const tr=document.createElement('tr'); tr.innerHTML=`<td>${d.name}</td><td><button data-act="del-d" data-id="${d.name}" class="btn btn--ghost">Remove</button></td>`; tb.appendChild(tr); });
}
document.getElementById('deptForm').addEventListener('submit', e=>{
  e.preventDefault(); const name=d_name.value.trim(); if(!name) return;
  let depts=store.get('departments'); uniquePush(depts,{name},'name'); store.set('departments',depts); renderDepts(); fillDeptOptions(); e.target.reset();
});
document.getElementById('deptTable').addEventListener('click', e=>{
  const b=e.target.closest('button'); if(!b) return;
  if(b.dataset.act==='del-d'){ let depts=store.get('departments').filter(x=>x.name.toLowerCase()!==b.dataset.id.toLowerCase()); store.set('departments',depts); renderDepts(); fillDeptOptions(); }
});

// Staff + users sync (Staff ID is manual; Admin creates usernames/passwords)
function renderStaff(){
  const tb=document.querySelector('#staffTable tbody'); const staff=store.get('staff'); tb.innerHTML='';
  staff.forEach(m=>{
    const tr=document.createElement('tr');
    tr.innerHTML=`<td>${m.id}</td><td>${m.name}</td><td>${m.role}</td><td>${m.role==='doctor'?(m.department||'-'):'-'}</td><td>${m.username}</td>
      <td><button class="btn btn--ghost" data-act="edit-staff" data-id="${m.id}">Edit</button>
          <button class="btn btn--ghost" data-act="del-staff" data-id="${m.id}">Delete</button></td>`;
    tb.appendChild(tr);
  });
}
function addOrUpdateStaff(e){
  e.preventDefault();
  const id = s_id.value.trim();
  const name = s_name.value.trim();
  const role = s_role.value;
  const dept = s_dept.value;
  const username = s_username.value.trim();
  const password = s_password.value.trim();
  if(!id||!name||!role||!username||!password) return;

  let staff=store.get('staff'); const ex=staff.find(x=>x.id===id);
  const obj={ id, name, role, department: role==='doctor'?dept:'', username, password };
  if(ex){ Object.assign(ex,obj); } else { staff.push(obj); }
  store.set('staff',staff);

  let users=store.get('users'); const ux=users.find(u=>u.username===username); const uobj={ username,password,role };
  if(ux){ Object.assign(ux,uobj); } else { users.push(uobj); }
  store.set('users',users);

  renderStaff(); e.target.reset(); onRoleChange();
}
function handleStaffClick(e){
  const b=e.target.closest('button'); if(!b) return;
  const id=b.dataset.id; const act=b.dataset.act;
  if(act==='edit-staff'){
    const rec=store.get('staff').find(x=>x.id===id); if(!rec) return;
    s_id.value=rec.id; s_name.value=rec.name; s_role.value=rec.role; s_dept.value=rec.department||''; s_username.value=rec.username||''; s_password.value=rec.password||'';
    onRoleChange();
  } else if(act==='del-staff'){
    let staff=store.get('staff').filter(x=>x.id!==id); store.set('staff',staff); renderStaff();
  }
}
function onRoleChange(){
  const role=s_role.value;
  document.getElementById('deptWrap').style.display = role==='doctor' ? 'block' : 'none';
}
document.getElementById('staffForm').addEventListener('submit', addOrUpdateStaff);
document.getElementById('staffTable').addEventListener('click', handleStaffClick);
document.getElementById('s_role').addEventListener('change', onRoleChange);

// Settings, Medicines, Lab tests
function renderSettings(){ const st=(store.get('settings')||[])[0]||{doctorFee:0}; set_doctorFee.value=st.doctorFee||0; }
document.getElementById('settingsForm').addEventListener('submit', e=>{
  e.preventDefault(); const v=parseFloat(set_doctorFee.value||0); store.set('settings',[{doctorFee:v}]); alert('Settings saved.');
});

function renderMeds(){ const tb=document.querySelector('#medTable tbody'); const meds=store.get('medicines'); tb.innerHTML='';
  meds.forEach(m=>{ const tr=document.createElement('tr'); tr.innerHTML=`<td>${m.name}</td><td>${Number(m.price||0).toFixed(2)}</td><td><button class="btn btn--ghost" data-act="del-med" data-id="${m.name}">Remove</button></td>`; tb.appendChild(tr); });
}
document.getElementById('medForm').addEventListener('submit', e=>{
  e.preventDefault(); const name=med_name.value.trim(); const price=parseFloat(med_price.value||0); if(!name) return;
  let meds=store.get('medicines'); const ex=meds.find(x=>x.name.toLowerCase()===name.toLowerCase());
  if(ex){ ex.price=price; } else { meds.push({name,price}); }
  store.set('medicines',meds); renderMeds(); e.target.reset();
});
document.getElementById('medTable').addEventListener('click', e=>{
  const b=e.target.closest('button'); if(!b) return;
  if(b.dataset.act==='del-med'){ let meds=store.get('medicines').filter(m=>m.name.toLowerCase()!==b.dataset.id.toLowerCase()); store.set('medicines',meds); renderMeds(); }
});

function renderLabTests(){ const tb=document.querySelector('#labTestTable tbody'); const tests=store.get('labTests'); tb.innerHTML='';
  tests.forEach(t=>{ const tr=document.createElement('tr'); tr.innerHTML=`<td>${t.name}</td><td>${Number(t.price||0).toFixed(2)}</td><td><button class="btn btn--ghost" data-act="del-lt" data-id="${t.name}">Remove</button></td>`; tb.appendChild(tr); });
}
document.getElementById('labTestForm').addEventListener('submit', e=>{
  e.preventDefault(); const name=lt_name.value.trim(); const price=parseFloat(lt_price.value||0); if(!name) return;
  let tests=store.get('labTests'); const ex=tests.find(x=>x.name.toLowerCase()===name.toLowerCase());
  if(ex){ ex.price=price; } else { tests.push({name,price}); }
  store.set('labTests',tests); renderLabTests(); e.target.reset();
});
document.getElementById('labTestTable').addEventListener('click', e=>{
  const b=e.target.closest('button'); if(!b) return;
  if(b.dataset.act==='del-lt'){ let tests=store.get('labTests').filter(t=>t.name.toLowerCase()!==b.dataset.id.toLowerCase()); store.set('labTests',tests); renderLabTests(); }
});

// Reports
function renderStats(){
  const patients=store.get('patients'); const appts=store.get('appointments');
  const lab=store.get('labRequests').filter(r=>r.status!=='Completed').length;
  const rx=store.get('prescriptions').filter(p=>p.status!=='Dispensed').length;
  statPatients.textContent=patients.length; statAppts.textContent=appts.length; statLab.textContent=lab; statRx.textContent=rx;
}

// Search
document.getElementById('globalSearch').addEventListener('input', function(){
  const q=(this.value||'').toLowerCase();
  const patients=store.get('patients').filter(p=>Object.values(p).join(' ').toLowerCase().includes(q));
  const staff=store.get('staff').filter(s=>Object.values(s).join(' ').toLowerCase().includes(q));
  const depts=store.get('departments').filter(d=>d.name.toLowerCase().includes(q));
  console.log('Search:', {patients,staff,depts});
});

// Init
fillDeptOptions(); onRoleChange(); renderDepts(); renderStaff(); renderSettings(); renderMeds(); renderLabTests(); renderStats();
