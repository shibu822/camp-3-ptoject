// Guard & logout
guardRoute('labtechnician');
setupLogout();

// Render lab requests
function renderLabRequests(){
  const tbody = document.querySelector('#labTable tbody');
  const labReqs = store.get('labRequests');
  tbody.innerHTML = '';
  labReqs.forEach(r => {
    const tr = document.createElement('tr');
    tr.innerHTML = `
      <td>${r.id}</td>
      <td>${r.patientId}</td>
      <td>${r.testName}</td>
      <td>${(r.requestedOn || '').slice(0,16).replace('T',' ')}</td>
      <td>${r.status}</td>
      <td>
        <textarea data-id="${r.id}" class="result-ta" placeholder="Enter result...">${r.result || ''}</textarea>
      </td>
      <td class="actions-row">
        <button data-act="save" data-id="${r.id}">Save Result</button>
        <button data-act="complete" data-id="${r.id}">Mark Completed</button>
        <button data-act="reject" data-id="${r.id}">Reject</button>
      </td>`;
    tbody.appendChild(tr);
  });
}

function saveResult(id){
  const labReqs = store.get('labRequests');
  const req = labReqs.find(x => x.id === id);
  if(!req) return;
  const ta = document.querySelector(`textarea.result-ta[data-id="${id}"]`);
  req.result = (ta?.value || '').trim();
  store.set('labRequests', labReqs);
  alert('Result saved.');
}

function setStatus(id, status){
  const labReqs = store.get('labRequests');
  const req = labReqs.find(x => x.id === id);
  if(!req) return;
  req.status = status;
  if(status === 'Completed' && !req.result){
    req.result = 'Result available';
  }
  store.set('labRequests', labReqs);
  renderLabRequests();
}

// Event delegation for actions
document.getElementById('labTable').addEventListener('click', (e) => {
  const btn = e.target.closest('button');
  if(!btn) return;
  const id = btn.getAttribute('data-id');
  const act = btn.getAttribute('data-act');
  if(act === 'save'){ saveResult(id); }
  if(act === 'complete'){ setStatus(id, 'Completed'); }
  if(act === 'reject'){ setStatus(id, 'Rejected'); }
});

// Init
renderLabRequests();
