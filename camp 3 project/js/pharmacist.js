guardRoute('pharmacist');
setupLogout();

function renderRx(){
  const tbody = document.querySelector('#rxTable tbody');
  const rx = store.get('prescriptions');
  tbody.innerHTML = '';
  rx.forEach(r => {
    const tr = document.createElement('tr');
    tr.innerHTML = `
      <td>${r.id}</td><td>${r.patientId}</td><td>${r.item}</td><td>${(r.prescribedOn||'').slice(0,16).replace('T',' ')}</td><td>${r.status}</td>
      <td class="actions-row">
        <button data-act="dispense" data-id="${r.id}">Dispense</button>
        <button data-act="cancel" data-id="${r.id}">Cancel</button>
      </td>`;
    tbody.appendChild(tr);
  });
}

function renderStock(){
  const tbody = document.querySelector('#stockTable tbody');
  const stock = store.get('stock');
  tbody.innerHTML = '';
  stock.forEach(s => {
    const tr = document.createElement('tr');
    tr.innerHTML = `<td>${s.name}</td><td>${s.qty}</td><td class="actions-row"><button data-act="remove" data-name="${s.name}">Remove</button></td>`;
    tbody.appendChild(tr);
  });
}

function addOrUpdateStock(e){
  e.preventDefault();
  const name = document.getElementById('s_name').value.trim();
  const qty = parseInt(document.getElementById('s_qty').value, 10);
  if(!name) return;
  let stock = store.get('stock');
  const existing = stock.find(s => s.name.toLowerCase() === name.toLowerCase());
  if(existing){ existing.qty = qty; } else { stock.push({ name, qty }); }
  store.set('stock', stock); renderStock(); e.target.reset();
}

function removeStock(name){
  let stock = store.get('stock').filter(s => s.name.toLowerCase() !== name.toLowerCase());
  store.set('stock', stock); renderStock();
}

function dispense(id){
  const rx = store.get('prescriptions');
  const rec = rx.find(x => x.id === id);
  if(!rec) return;

  let stock = store.get('stock');
  const item = stock.find(s => s.name.toLowerCase() === rec.item.toLowerCase());
  if(!item || item.qty <= 0){
    alert('Out of stock: ' + rec.item);
    return;
  }
  item.qty = Math.max(0, item.qty - 1);
  store.set('stock', stock);
  renderStock();

  rec.status = 'Dispensed';
  store.set('prescriptions', rx);
  renderRx();
}

// Bind
document.getElementById('stockForm').addEventListener('submit', addOrUpdateStock);
document.getElementById('rxTable').addEventListener('click', (e) => {
  const btn = e.target.closest('button'); if(!btn) return;
  const act = btn.getAttribute('data-act'); const id = btn.getAttribute('data-id');
  if(act === 'dispense'){ dispense(id); }
  if(act === 'cancel'){
    const rx = store.get('prescriptions');
    const rec = rx.find(x => x.id === id); if(!rec) return;
    rec.status = 'Cancelled';
    store.set('prescriptions', rx);
    renderRx();
  }
});
document.getElementById('stockTable').addEventListener('click', (e) => {
  const btn = e.target.closest('button'); if(!btn) return;
  const act = btn.getAttribute('data-act'); const name = btn.getAttribute('data-name');
  if(act === 'remove'){ removeStock(name); }
});

// Init
renderRx(); renderStock();
