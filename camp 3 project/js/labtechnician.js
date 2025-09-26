guardRoute('labtechnician');
setupLogout();

function renderLab(){
  const tb=document.querySelector('#labTable tbody');
  const reqs=store.get('labRequests');
  tb.innerHTML='';
  reqs.forEach(r=>{
    const tr=document.createElement('tr');
    const resultArea = (r.status==='Requested' || r.status==='Rejected') 
      ? `<textarea data-id="${r.id}" placeholder="Enter result or rejection reason">${r.result||''}</textarea>`
      : `<div class="muted">${r.result ? r.result : '-'}</div>`;
    const actions = (r.status==='Requested')
      ? `<button class="btn btn--success" data-act="complete" data-id="${r.id}">Complete</button>
         <button class="btn btn--danger" data-act="reject" data-id="${r.id}">Reject</button>`
      : `<button class="btn btn--ghost" data-act="reset" data-id="${r.id}">Reset</button>`;
    tr.innerHTML = `
      <td>${r.id}</td>
      <td>${r.patientId}</td>
      <td>${r.testName}</td>
      <td>${(r.requestedOn||'').slice(0,16).replace('T',' ')}</td>
      <td>${r.status}</td>
      <td>${resultArea}<div class="mt-2">${actions}</div></td>`;
    tb.appendChild(tr);
  });
}

document.getElementById('labTable').addEventListener('click', (e)=>{
  const b=e.target.closest('button'); if(!b) return;
  const act=b.dataset.act; const id=b.dataset.id;
  let reqs=store.get('labRequests'); const rec=reqs.find(x=>x.id===id); if(!rec) return;

  if(act==='complete'){
    const ta=document.querySelector(`textarea[data-id="${id}"]`);
    rec.result = (ta && ta.value.trim()) || rec.result || 'Completed';
    rec.status = 'Completed';
    store.set('labRequests',reqs); renderLab();
  }
  if(act==='reject'){
    const ta=document.querySelector(`textarea[data-id="${id}"]`);
    rec.result = (ta && ta.value.trim()) || 'Rejected';
    rec.status = 'Rejected';
    store.set('labRequests',reqs); renderLab();
  }
  if(act==='reset'){
    rec.status='Requested';
    rec.result='';
    store.set('labRequests',reqs); renderLab();
  }
});

renderLab();
