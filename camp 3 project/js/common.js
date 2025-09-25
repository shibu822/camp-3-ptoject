window.store = {
  get(key){ try { return JSON.parse(localStorage.getItem(key) || '[]'); } catch(e){ return []; } },
  set(key, val){ localStorage.setItem(key, JSON.stringify(val)); }
};

window.guardRoute = function(requiredRole){
  try{
    const file = (location.pathname.split('/').pop() || 'index.html').toLowerCase();
    const isIndex = (file === '' || file === 'index.html');
    if(isIndex) return null;

    const raw = sessionStorage.getItem('loggedInUser');
    if(!raw){ window.location.replace('index.html'); return null; }

    const user = JSON.parse(raw);
    if(requiredRole && user.role !== requiredRole){ window.location.replace('index.html'); return null; }

    const el = document.getElementById('userInfo');
    if(el) el.textContent = `${user.username} (${user.role})`;
    return user;
  }catch(e){
    console.error('guardRoute error', e);
    return null;
  }
};

window.setupLogout = function(btnId='logoutBtn'){
  const btn = document.getElementById(btnId);
  if(!btn) return;
  btn.addEventListener('click', () => {
    try{ sessionStorage.removeItem('loggedInUser'); }catch(e){}
    window.location.replace('index.html');
  });
};
