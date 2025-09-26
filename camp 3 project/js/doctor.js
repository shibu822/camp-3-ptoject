guardRoute('doctor');
setupLogout();

let currentPatientId = null;

document.getElementById('globalSearch').addEventListener('input', function(){
  const q=(this.value||'').toLowerCase();
  document.querySelectorAll('#apptsTable tbody tr').forEach(r=>r.style.display=r.textContent.toLowerCase().includes(q)?'':'none');
  document.querySelectorAll('#visitsTable tbody tr').forEach(r=>r.style.display=r.textContent.toLowerCase().includes(q)?'':'none');
});

function renderAppts(){
  const tb=document.querySelector('#apptsTable tbody'); const appts=store.get('appointments'); tb.innerHTML='';
  const today=new Date().toISOString().slice(0,10);
  appts.filter(a=>a.doctor && a.datetime && a.datetime.slice(0,10)===today).forEach(a=>{
    const tr=document.createElement('tr');
    tr.innerHTML=`<td>${a.id}</td><td>${a.patientId}</td><td>${a.doctor}</td><td>${a.datetime}</td><td>${a.status}</td>
      <td><button class="btn btn--ghost" data-act="open" data-patient="${a.patientId}">Open</button></td>`;
    tb.appendChild(tr);
  });
}
document.getElementById('apptsTable').addEventListener('click', e=>{
  const b=e.target.closest('button'); if(!b) return;
  if(b.dataset.act==='open'){ openPatient(b.dataset.patient); }
});

function openPatient(patientId){
  currentPatientId=patientId;
  const p=store.get('patients').find(x=>x.id===patientId);
  document.getElementById('patientHeader').textContent = p ? `${p.id} - ${p.name}` : `Patient ${patientId}`;
  document.getElementById('visitWrap').classList.remove('hidden');
  document.getElementById('visitForm').reset();
  renderVisits();
}

function fillLabTests(){
  const sel=document.getElementById('v_labtests'); const tests=store.get('labTests'); sel.innerHTML='';
  tests.forEach(t=>{ const o=document.createElement('option'); o.value=t.name; o.textContent=t.name; sel.appendChild(o); });
}
function getSelectedLabTests(){
  const sel=document.getElementById('v_labtests');
  return Array.from(sel.selectedOptions).map(o=>o.value);
}
function computeBMI(w,h){ if(!w||!h) return null; const m=h/100; return Math.round((w/(m*m))*10)/10; }

function saveVisit(e){
  e.preventDefault();
  if(!currentPatientId){ alert('Open an appointment/patient first.'); return; }

  const weight=parseFloat(v_weight.value||0), height=parseFloat(v_height.value||0);
  const symptoms=v_symptoms.value.trim(), diagnosis=v_diagnosis.value.trim();
  const prescriptionsStr=v_prescriptions.value.trim();
  const prescriptions = prescriptionsStr ? prescriptionsStr.split(',').map(s=>s.trim()).filter(Boolean) : [];
  const labtests=getSelectedLabTests(); const bmi=computeBMI(weight,height);

  const entry={ patientId:currentPatientId, date:new Date().toISOString(), weight,height,bmi, symptoms,diagnosis, prescriptions, labtests };
  const visits=store.get('visits'); visits.push(entry); store.set('visits',visits);

  if(labtests.length){
    const labReqs=store.get('labRequests');
    labtests.forEach(t=>{ labReqs.push({ id:'L'+(labReqs.length+1).toString().padStart(3,'0'), patientId:currentPatientId, testName:t, requestedOn:entry.date, status:'Requested', result:'' }); });
    store.set('labRequests',labReqs);
  }
  if(prescriptions.length){
    const rx=store.get('prescriptions');
    prescriptions.forEach(item=>{ rx.push({ id:'RX'+(rx.length+1).toString().padStart(3,'0'), patientId:currentPatientId, item, prescribedOn:entry.date, status:'Pending' }); });
    store.set('prescriptions',rx);
  }

  (function createDraftInvoice(){
    const settings=(store.get('settings')||[])[0]||{doctorFee:0};
    const meds=store.get('medicines'); const tests=store.get('labTests');
    const items=[];
    if(settings.doctorFee>0) items.push({ name:'Doctor Fee', price:Number(settings.doctorFee) });
    labtests.forEach(t=>{ const rec=(tests||[]).find(x=>x.name.toLowerCase()===t.toLowerCase()); items.push({ name:`Lab: ${t}`, price: rec?Number(rec.price||0):0 }); });
    prescriptions.forEach(m=>{ const rec=(meds||[]).find(x=>x.name.toLowerCase()===m.toLowerCase()); items.push({ name:`Medicine: ${m}`, price: rec?Number(rec.price||0):0 }); });

    if(items.length){
      let invoices=store.get('invoices'); const today=new Date().toISOString().slice(0,10);
      let inv=invoices.find(b=>b.patientId===currentPatientId && b.date===today);
      if(inv){ inv.items=(inv.items||[]).concat(items); inv.total=(inv.items||[]).reduce((s,i)=>s+Number(i.price||0),0); }
      else { inv={ id:'INV'+(invoices.length+1).toString().padStart(3,'0'), patientId:currentPatientId, date:today, items, discount:0, total:items.reduce((s,i)=>s+Number(i.price||0),0), status:'Unpaid' }; invoices.push(inv); }
      store.set('invoices',invoices);
    }
  })();

  renderVisits(); e.target.reset(); alert('Visit saved successfully.');
}
document.getElementById('visitForm').addEventListener('submit', saveVisit);

function renderVisits(){
  const tb=document.querySelector('#visitsTable tbody'); const vs=store.get('visits').filter(v=>v.patientId===currentPatientId); tb.innerHTML='';
  vs.forEach(v=>{
    const tr=document.createElement('tr');
    tr.innerHTML=`<td>${v.date.slice(0,16).replace('T',' ')}</td><td>${v.weight||'-'}</td><td>${v.height||'-'}</td><td>${v.bmi??'-'}</td><td>${v.symptoms||'-'}</td><td>${v.diagnosis||'-'}</td><td>${(v.prescriptions||[]).join(', ')||'-'}</td><td>${(v.labtests||[]).join(', ')||'-'}</td>`;
    tb.appendChild(tr);
  });
}

renderAppts(); fillLabTests();
