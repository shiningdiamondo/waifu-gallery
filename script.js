
  const gallery = document.getElementById('gallery');
  const favToggle = document.getElementById('fav-toggle');
  const favoritesPanel = document.getElementById('favorites');
  const favClose = document.getElementById('fav-close');
  const favGrid = document.getElementById('fav-grid');
  const modal = document.getElementById('modal');
  const modalImg = modal.querySelector('img');
  const modalDesc = document.getElementById('modal-desc');
  const modalClose = document.getElementById('modal-close');

  let page = 1, loading = false;
  const seen = new Set();
  let favorites = JSON.parse(localStorage.getItem('waifu_gif_favs')||'[]');

  function saveFavs(){ localStorage.setItem('waifu_gif_favs', JSON.stringify(favorites)); }

  function fakeDesc(url){
    const tags = ["Maid Cosplay", "Cat Ears", "School Uniform", "Magical Girl", "Battle Armor"];
    let h=0; for(let c of url) h+=c.charCodeAt(0);
    return tags[h % tags.length];
  }

  // Utilidad para crear elementos con atributos
  function el(tag, attrs = {}, ...children) {
    const e = document.createElement(tag);
    for (const [k, v] of Object.entries(attrs)) {
      if (k.startsWith('on') && typeof v === 'function') e[k.toLowerCase()] = v;
      else if (k === 'class') e.className = v;
      else if (k === 'style') e.style.cssText = v;
      else e.setAttribute(k, v);
    }
    for (const c of children) if (c) e.append(c);
    return e;
  }

  function renderFavs(){
    favGrid.innerHTML = '';
    if(!favorites.length) {
      favGrid.textContent = 'Sin favoritos aún.';
      return;
    }
    for(let fav of favorites){
      // fav puede ser string (legacy) o objeto
      let data = typeof fav === 'string' ? { url: fav } : fav;
      const img = el('img', {
        src: data.url,
        alt: 'Gif favorito',
        tabIndex: 0,
        onclick: ()=>openModal(data)
      });
      favGrid.appendChild(img);
    }
  }

  function openModal(data){
    // data: {url, artist_name, artist_href, source_url, ...}
    modalImg.src = data.url;
    let html = '';
    if(data.artist_name && data.artist_href){
      html += `<b>Artista:</b> <a href="${data.artist_href}" target="_blank" rel="noopener">${data.artist_name}</a><br>`;
    }
    if(data.source_url){
      html += `<b>Fuente:</b> <a href="${data.source_url}" target="_blank" rel="noopener">Ver original</a><br>`;
    }
    html += `<b>Descripción:</b> ${data.desc || fakeDesc(data.url)}`;
    modalDesc.innerHTML = html;
    modal.classList.add('open');
  }
  function closeModal(){
    modal.classList.remove('open');
    modalImg.src='';
  }
  modal.onclick = e => { if(e.target === modal) closeModal(); };
  modalClose.onclick = closeModal;
  document.addEventListener('keydown', e=> e.key==='Escape' && modal.classList.contains('open') && closeModal());

  favToggle.onclick = ()=>{
    const open = favoritesPanel.classList.toggle('open');
    favToggle.setAttribute('aria-expanded', open);
    favoritesPanel.setAttribute('aria-hidden', !open);
    if(open) favoritesPanel.focus();
  };
  favClose.onclick = () => favToggle.click();

  function isFav(data) {
    // Compara por url
    return favorites.some(f => (typeof f === 'string' ? f : f.url) === data.url);
  }

  function createCard(data){
    // data: {url, artist_name, artist_href, source_url, ...}
    const card = el('div', { class: 'card' });
    const img = el('img', {
      src: data.url,
      loading: 'lazy',
      onload: e => e.target.classList.add('loaded'),
      onclick: ()=>openModal(data)
    });
    const heart = el('div', {
      class: 'heart' + (isFav(data) ? ' fav' : ''),
      onclick: e => {
        e.stopPropagation();
        if(isFav(data)){
          favorites = favorites.filter(f => (typeof f === 'string' ? f : f.url) !== data.url);
          heart.classList.remove('fav');
        } else {
          favorites.push(data);
          heart.classList.add('fav');
        }
        saveFavs(); renderFavs();
      }
    });
    card.append(img, heart);
    return card;
  }
let noMoreImages = false;

async function loadImages(){
  if(loading || noMoreImages) return;
  loading = true;
  try {
    const res = await fetch(`https://nekos.best/api/v2/waifu?amount=100`);
    const data = await res.json();
    let newImagesCount = 0;
    data.results.forEach(item => {
      // item puede tener artist_name, artist_href, source_url, url
      if(!seen.has(item.url)){
        seen.add(item.url);
        gallery.append(createCard(item));
        newImagesCount++;
      }
    });
    if(newImagesCount === 0){
      noMoreImages = true;
      showMessage('No quedan más imágenes para cargar.');
    }
  } catch {
    showMessage('Error al cargar imágenes');
  }
  loading = false;
}

function showMessage(text){
  const msg = document.createElement('div');
  msg.textContent = text;
  msg.style = `
    position: fixed; bottom: 20px; left: 50%; transform: translateX(-50%);
    background: #e91e63cc; color: white; padding: 10px 20px;
    border-radius: 20px; font-weight: bold; z-index: 9999;
    pointer-events: none; user-select: none;`;
  document.body.appendChild(msg);
  setTimeout(() => msg.remove(), 3000);
}

// En el scroll listener:

window.addEventListener('scroll', () => {
  if(window.innerHeight + window.scrollY >= document.body.offsetHeight - 400){
    loadImages();
  }
});

// Carga inicial: si la página abre y el scroll ya está casi abajo, cargar imágenes para evitar "vacíos":

window.addEventListener('load', () => {
  if(window.innerHeight + window.scrollY >= document.body.offsetHeight - 400){
    loadImages();
  }
});

  // start-up
  loadImages(); renderFavs();