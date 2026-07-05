// =====================
// Configuration
// =====================
const USE_BACKEND = true; // Set ke true untuk menggunakan Backend API Express + MySQL, false untuk LocalStorage
const API_BASE_URL = 'http://localhost:3000/api';

// =====================
// Storage Module
// =====================
const KEYS = {
  USERS: 'users',
  SESSION: 'session',
  CART: 'cart',
  ORDERS: 'order_history',
  PRODUCTS: 'products',
  DARK_MODE: 'dark_mode'
};

function storageGet(key) {
  try { return JSON.parse(localStorage.getItem(key)); } catch { return null; }
}

function storageSet(key, value) {
  localStorage.setItem(key, JSON.stringify(value));
}

// =====================
// Default Data (Offline Mode fallback)
// =====================
const DEFAULT_PRODUCTS = [
  { id: 'prod_001', name: 'Kemeja Batik Pria', price: 150000, category: 'Pakaian', description: 'Kemeja batik modern dengan motif klasik, cocok untuk acara formal maupun kasual.', image: 'images/products/prod_001.jpg' },
  { id: 'prod_002', name: 'Dress Casual Wanita', price: 200000, category: 'Pakaian', description: 'Dress casual elegan dengan bahan nyaman untuk aktivitas sehari-hari.', image: 'images/products/prod_002.jpg' },
  { id: 'prod_003', name: 'Laptop Stand Aluminium', price: 350000, category: 'Elektronik', description: 'Stand laptop ergonomis dari aluminium premium, mendukung berbagai ukuran laptop.', image: 'images/products/prod_003.jpg' },
  { id: 'prod_004', name: 'Wireless Mouse', price: 120000, category: 'Elektronik', description: 'Mouse wireless 2.4GHz dengan baterai tahan lama dan desain ergonomis.', image: 'images/products/prod_004.jpg' },
  { id: 'prod_005', name: 'Sepatu Sneakers Pria', price: 450000, category: 'Sepatu', description: 'Sneakers pria stylish dengan sol karet anti-slip, nyaman untuk aktivitas harian.', image: 'images/products/prod_005.jpg' },
  { id: 'prod_006', name: 'Sandal Wanita Casual', price: 95000, category: 'Sepatu', description: 'Sandal wanita ringan dan nyaman dengan desain modern.', image: 'images/products/prod_006.jpg' },
  { id: 'prod_007', name: 'Tas Ransel Laptop', price: 280000, category: 'Tas', description: 'Tas ransel multifungsi dengan kompartemen laptop 15 inch dan bahan waterproof.', image: 'images/products/prod_007.jpg' },
  { id: 'prod_008', name: 'Dompet Kulit Pria', price: 175000, category: 'Tas', description: 'Dompet kulit asli dengan banyak slot kartu dan desain slim.', image: 'images/products/prod_008.jpg' },
];

const DEFAULT_CUSTOMERS = [
  { id: 'user_001', name: 'Budi Santoso', email: 'budi@email.com', password: 'budi123', role: 'user' },
  { id: 'user_002', name: 'Siti Rahayu', email: 'siti@email.com', password: 'siti123', role: 'user' },
  { id: 'user_003', name: 'Andi Wijaya', email: 'andi@email.com', password: 'andi123', role: 'user' },
];

// =====================
// Auth Module
// =====================
function initDefaultData() {
  if (USE_BACKEND) return; // Skip in backend mode
  let users = storageGet(KEYS.USERS) || [];
  // Add admin if not exists
  if (!users.find(u => u.email === 'admin@toko.com')) {
    users.push({ id: 'admin_001', name: 'Admin', email: 'admin@toko.com', password: 'admin123', role: 'admin' });
  }
  // Add dummy customers if not exists
  DEFAULT_CUSTOMERS.forEach(c => {
    if (!users.find(u => u.email === c.email)) users.push(c);
  });
  storageSet(KEYS.USERS, users);
}

function authRegister(name, email, password) {
  if (password.length < 6) return { error: 'Password minimal 6 karakter' };
  const users = storageGet(KEYS.USERS) || [];
  if (users.find(u => u.email === email)) return { error: 'Email sudah terdaftar' };
  const user = { id: 'user_' + Date.now(), name, email, password, role: 'user' };
  users.push(user);
  storageSet(KEYS.USERS, users);
  return { success: true };
}

function authLogin(email, password) {
  const users = storageGet(KEYS.USERS) || [];
  const user = users.find(u => u.email === email && u.password === password);
  if (!user) return { error: 'Email atau password salah' };
  const session = { userId: user.id, name: user.name, email: user.email, role: user.role };
  storageSet(KEYS.SESSION, session);
  return { success: true, session };
}

function authLogout() {
  localStorage.removeItem(KEYS.SESSION);
}

function authGetSession() {
  return storageGet(KEYS.SESSION);
}

function authIsAdmin() {
  const s = authGetSession();
  return s && s.role === 'admin';
}

// =====================
// UI Module
// =====================
const PAGES = ['home', 'login', 'register', 'cart', 'checkout', 'orders', 'admin'];

async function navigate(page) {
  const mainApp = document.getElementById('main-app');
  const landing = document.getElementById('page-landing');
  const navbar = document.getElementById('navbar');

  if (page === 'landing') {
    landing.classList.remove('hidden');
    mainApp.classList.add('hidden');
    navbar.classList.add('hidden');
    if (typeof lenis !== 'undefined') {
      lenis.resize();
      lenis.scrollTo(0, { immediate: true });
    } else {
      window.scrollTo(0, 0);
    }
    initScrollReveal();
    return;
  }

  landing.classList.add('hidden');
  mainApp.classList.remove('hidden');
  navbar.classList.remove('hidden');

  // Hide store-only controls (search, filters, cart) when in admin panel
  const storeControls = document.getElementById('nav-store-controls');
  const mobileMenu = document.getElementById('mobile-menu');

  if (page === 'admin') {
    navbar.classList.add('hidden');
    storeControls?.classList.add('hidden');
    mobileMenu?.classList.add('hidden');
  } else {
    navbar.classList.remove('hidden');
    storeControls?.classList.remove('hidden');
  }

  PAGES.forEach(p => {
    const el = document.getElementById('page-' + p);
    if (el) el.classList.toggle('hidden', p !== page);
  });

  if (page === 'home') await renderProductGrid();
  if (page === 'cart') cartRender();
  if (page === 'checkout') renderCheckoutPage();
  if (page === 'orders') {
    if (!authGetSession()) { navigate('login'); return; }
    await orderRender();
  }
  if (page === 'admin') {
    if (!authIsAdmin()) { navigate('home'); showToast('Akses ditolak', 'error'); return; }
    await adminRender();
  }

  // Close mobile menu on navigate
  document.getElementById('mobile-menu')?.classList.add('hidden');
  
  if (typeof lenis !== 'undefined') {
    lenis.resize();
    lenis.scrollTo(0, { immediate: true });
  } else {
    window.scrollTo(0, 0);
  }
  initScrollReveal();
}

function showToast(message, type = 'success') {
  const container = document.getElementById('toast-container');

  const config = {
    success: { icon: '✓', bar: 'bg-emerald-500', text: 'text-emerald-600 dark:text-emerald-400', bg: 'bg-white dark:bg-gray-800', border: 'border-emerald-200 dark:border-emerald-800' },
    error:   { icon: '✕', bar: 'bg-red-500',     text: 'text-red-600 dark:text-red-400',         bg: 'bg-white dark:bg-gray-800', border: 'border-red-200 dark:border-red-800' },
    info:    { icon: 'ℹ', bar: 'bg-blue-500',    text: 'text-blue-600 dark:text-blue-400',        bg: 'bg-white dark:bg-gray-800', border: 'border-blue-200 dark:border-blue-800' },
  };
  const c = config[type] || config.info;

  const toast = document.createElement('div');
  toast.className = `relative ${c.bg} border ${c.border} rounded-xl shadow-lg overflow-hidden w-72 toast-enter`;
  toast.innerHTML = `
    <div class="flex items-start gap-3 px-4 py-3">
      <span class="mt-0.5 w-5 h-5 rounded-full ${c.bar} text-white flex items-center justify-center text-xs font-bold shrink-0">${c.icon}</span>
      <p class="text-sm text-gray-700 dark:text-gray-200 leading-snug flex-1">${message}</p>
      <button onclick="this.closest('.toast-enter, .toast-leave')?.remove()" class="text-gray-300 hover:text-gray-500 dark:hover:text-gray-300 text-lg leading-none shrink-0 -mt-0.5 transition">×</button>
    </div>
    <div class="h-0.5 ${c.bar} opacity-30 w-full">
      <div class="h-full ${c.bar} toast-progress" style="width:100%;transition:width 3s linear"></div>
    </div>
  `;
  container.appendChild(toast);

  // Shrink progress bar
  requestAnimationFrame(() => {
    const bar = toast.querySelector('.toast-progress');
    if (bar) { requestAnimationFrame(() => { bar.style.width = '0%'; }); }
  });

  // Auto dismiss
  const timer = setTimeout(() => {
    toast.classList.replace('toast-enter', 'toast-leave');
    setTimeout(() => toast.remove(), 300);
  }, 3000);

  // Click to dismiss early
  toast.addEventListener('click', () => {
    clearTimeout(timer);
    toast.classList.replace('toast-enter', 'toast-leave');
    setTimeout(() => toast.remove(), 300);
  });
}

function toggleDarkMode() {
  const isDark = document.documentElement.classList.toggle('dark');
  storageSet(KEYS.DARK_MODE, isDark);
  const icon = isDark ? '☀️' : '🌙';
  const btn = document.getElementById('dark-mode-btn');
  if (btn) btn.textContent = icon;
}

function initDarkMode() {
  const isDark = storageGet(KEYS.DARK_MODE);
  if (isDark) {
    document.documentElement.classList.add('dark');
    const btn = document.getElementById('dark-mode-btn');
    if (btn) btn.textContent = '☀️';
  }
}

function toggleMobileMenu() {
  document.getElementById('mobile-menu').classList.toggle('hidden');
}

function updateNavbar() {
  const session = authGetSession();
  const navAuth = document.getElementById('nav-auth');
  if (session) {
    navAuth.innerHTML = `
      <span class="text-sm font-medium hidden sm:inline text-gray-700 dark:text-gray-300 max-w-[80px] truncate">👤 ${session.name}</span>
      ${session.role === 'admin' ? `<button onclick="navigate('admin')" class="text-xs bg-yellow-500 hover:bg-yellow-600 text-white px-2 py-1 rounded-lg transition whitespace-nowrap">Panel</button>` : ''}
      ${session.role !== 'admin' ? `<button onclick="navigate('orders')" class="text-xs bg-indigo-100 dark:bg-indigo-900 hover:bg-indigo-200 dark:hover:bg-indigo-800 text-indigo-700 dark:text-indigo-300 px-2 py-1 rounded-lg transition whitespace-nowrap">Pesanan</button>` : ''}
      <button onclick="handleLogout()" class="text-xs bg-red-100 dark:bg-red-900 hover:bg-red-200 dark:hover:bg-red-800 text-red-700 dark:text-red-300 px-2 py-1 rounded-lg transition">Keluar</button>
    `;
  } else {
    navAuth.innerHTML = `
      <button onclick="navigate('login')" class="text-sm bg-indigo-600 hover:bg-indigo-700 text-white px-3 py-1.5 rounded-lg transition font-medium whitespace-nowrap">Masuk</button>
      <button onclick="navigate('register')" class="hidden sm:block text-sm border border-indigo-600 text-indigo-600 dark:text-indigo-400 hover:bg-indigo-50 dark:hover:bg-indigo-900 px-3 py-1.5 rounded-lg transition font-medium whitespace-nowrap">Daftar</button>
    `;
  }
  updateCartBadge();
}

// =====================
// Product Module
// =====================
function productGetAll() {
  return storageGet(KEYS.PRODUCTS) || DEFAULT_PRODUCTS;
}

function productFilter(query = '', category = '', minPrice = 0, maxPrice = Infinity) {
  return productGetAll().filter(p => {
    const matchName = p.name.toLowerCase().includes(query.toLowerCase());
    const matchCat = !category || p.category === category;
    const matchPrice = p.price >= minPrice && p.price <= maxPrice;
    return matchName && matchCat && matchPrice;
  });
}

function formatRupiah(n) {
  return 'Rp ' + n.toLocaleString('id-ID');
}

function productRenderGrid(products) {
  const grid = document.getElementById('product-grid');
  if (!products || products.length === 0) {
    grid.innerHTML = `<div class="col-span-full text-center py-16 text-gray-400 dark:text-gray-500">
      <div class="text-5xl mb-3">🔍</div>
      <p class="text-lg font-medium">Produk tidak ditemukan</p>
      <p class="text-sm mt-1">Coba ubah kata kunci atau filter pencarian</p>
    </div>`;
    return;
  }
  grid.innerHTML = products.map(p => `
    <div class="bg-white dark:bg-gray-800 rounded-2xl shadow card-hover overflow-hidden flex flex-col">
      <div class="relative">
        <img src="${p.image}" alt="${p.name}" class="w-full h-40 sm:h-48 object-cover" loading="lazy" />
        <span class="absolute top-2 left-2 bg-white/90 dark:bg-gray-800/90 text-indigo-600 dark:text-indigo-400 text-xs font-semibold px-2 py-0.5 rounded-full">${p.category}</span>
      </div>
      <div class="p-3 sm:p-4 flex flex-col flex-1">
        <h3 class="font-semibold text-gray-800 dark:text-gray-100 mb-1 line-clamp-2 text-sm sm:text-base">${p.name}</h3>
        <p class="text-indigo-605 dark:text-indigo-400 font-bold text-base sm:text-lg mb-3">${formatRupiah(p.price)}</p>
        <div class="mt-auto flex gap-2">
          <button onclick="productShowModal('${p.id}')" class="flex-1 border border-indigo-600 text-indigo-600 dark:text-indigo-400 hover:bg-indigo-50 dark:hover:bg-indigo-900 text-xs sm:text-sm py-1.5 rounded-lg transition">Detail</button>
          <button onclick="cartAdd('${p.id}', this)" class="flex-1 bg-indigo-600 hover:bg-indigo-700 text-white text-xs sm:text-sm py-1.5 rounded-lg transition">+ Keranjang</button>
        </div>
      </div>
    </div>
  `).join('');
}

async function productShowModal(productId) {
  let product;
  if (USE_BACKEND) {
    try {
      const res = await fetch(`${API_BASE_URL}/products/${productId}`);
      if (!res.ok) throw new Error();
      product = await res.json();
    } catch (e) {
      showToast('Gagal memuat detail produk dari server', 'error');
      return;
    }
  } else {
    product = productGetAll().find(p => p.id === productId);
  }

  if (!product) return;

  const isOutOfStock = USE_BACKEND && product.stock <= 0;

  document.getElementById('modal-content').innerHTML = `
    <img src="${product.image}" alt="${product.name}" class="w-full h-48 object-cover rounded-xl mb-4" />
    <span class="text-xs text-indigo-500 dark:text-indigo-400 font-medium bg-indigo-50 dark:bg-indigo-900/40 px-2 py-0.5 rounded-full">${product.category}</span>
    <h2 class="text-xl font-bold mt-2 mb-2 text-gray-800 dark:text-gray-100">${product.name}</h2>
    <p class="text-2xl font-bold text-indigo-600 dark:text-indigo-400 mb-2">${formatRupiah(product.price)}</p>
    ${USE_BACKEND ? `<p class="text-xs text-gray-500 dark:text-gray-405 font-bold mb-3">Stok Tersedia: ${product.stock}</p>` : ''}
    <p class="text-gray-600 dark:text-gray-300 text-sm mb-5">${product.description}</p>
    <button onclick="cartAdd('${product.id}', this); closeModal();" 
      class="w-full bg-indigo-600 hover:bg-indigo-700 text-white font-semibold py-2.5 rounded-lg transition ${isOutOfStock ? 'opacity-50 cursor-not-allowed' : ''}" 
      ${isOutOfStock ? 'disabled' : ''}>
      ${isOutOfStock ? 'Stok Habis' : 'Tambah ke Keranjang'}
    </button>
  `;
  document.getElementById('modal-product').classList.remove('hidden');
}

function closeModal() {
  document.getElementById('modal-product').classList.add('hidden');
}

function productAdd(product) {
  const products = productGetAll();
  products.push(product);
  storageSet(KEYS.PRODUCTS, products);
}

function productDelete(productId) {
  storageSet(KEYS.PRODUCTS, productGetAll().filter(p => p.id !== productId));
}

// Mengambil produk dari server backend
async function fetchProductsFromAPI(query = '', category = '', minPrice = 0, maxPrice = Infinity) {
  try {
    let url = `${API_BASE_URL}/products?`;
    if (query) url += `q=${encodeURIComponent(query)}&`;
    if (category) url += `category=${encodeURIComponent(category)}&`;
    if (minPrice && minPrice > 0) url += `minPrice=${minPrice}&`;
    if (maxPrice && maxPrice < Infinity) url += `maxPrice=${maxPrice}&`;

    const res = await fetch(url);
    if (!res.ok) throw new Error();
    return await res.json();
  } catch (error) {
    console.error('API Error:', error);
    showToast('Gagal memuat produk dari database', 'error');
    return [];
  }
}

async function renderProductGrid(skipSkeleton = false) {
  const query = document.getElementById('search-input')?.value || document.getElementById('search-input-mobile')?.value || '';
  const category = document.getElementById('filter-category')?.value || document.getElementById('filter-category-mobile')?.value || '';
  const priceRange = document.getElementById('filter-price')?.value || document.getElementById('filter-price-mobile')?.value || '';
  let minPrice = 0, maxPrice = Infinity;
  if (priceRange) { [minPrice, maxPrice] = priceRange.split('-').map(Number); }

  let filtered = [];

  if (skipSkeleton) {
    if (USE_BACKEND) {
      filtered = await fetchProductsFromAPI(query, category, minPrice, maxPrice);
    } else {
      filtered = productFilter(query, category, minPrice, maxPrice);
    }
    productRenderGrid(filtered);
    return;
  }

  // Show skeleton first
  const grid = document.getElementById('product-grid');
  grid.innerHTML = Array(8).fill(0).map(() => `
    <div class="bg-white dark:bg-gray-800 rounded-2xl overflow-hidden shadow">
      <div class="skeleton w-full h-40 sm:h-48"></div>
      <div class="p-3 sm:p-4 space-y-2.5">
        <div class="skeleton h-3 rounded-full w-1/3"></div>
        <div class="skeleton h-4 rounded-full w-4/5"></div>
        <div class="skeleton h-4 rounded-full w-2/5"></div>
        <div class="flex gap-2 pt-1">
          <div class="skeleton h-8 rounded-lg flex-1"></div>
          <div class="skeleton h-8 rounded-lg flex-1"></div>
        </div>
      </div>
    </div>
  `).join('');

  if (USE_BACKEND) {
    filtered = await fetchProductsFromAPI(query, category, minPrice, maxPrice);
  } else {
    filtered = productFilter(query, category, minPrice, maxPrice);
  }

  setTimeout(() => productRenderGrid(filtered), 700);
}

async function handleSearch() {
  if (document.getElementById('page-home').classList.contains('hidden')) await navigate('home');
  else await renderProductGrid(true); // skip skeleton on search/filter
}

async function handleSearchMobile() {
  const mq = document.getElementById('search-input-mobile')?.value || '';
  const mc = document.getElementById('filter-category-mobile')?.value || '';
  const mp = document.getElementById('filter-price-mobile')?.value || '';
  if (document.getElementById('search-input')) document.getElementById('search-input').value = mq;
  if (document.getElementById('filter-category')) document.getElementById('filter-category').value = mc;
  if (document.getElementById('filter-price')) document.getElementById('filter-price').value = mp;
  await handleSearch();
}

async function filterByCategory(category) {
  const catEl = document.getElementById('filter-category');
  const catMEl = document.getElementById('filter-category-mobile');
  if (catEl) catEl.value = category;
  if (catMEl) catMEl.value = category;
  await navigate('home'); // will trigger skeleton via navigate → renderProductGrid()
}

// =====================
// Cart Module
// =====================
function cartGet() {
  return storageGet(KEYS.CART) || [];
}

function flyToCart(imgSrc, originEl) {
  const cartBtn = document.querySelector('[onclick="navigate(\'cart\')"]');
  if (!cartBtn || !originEl) return;

  const from = originEl.getBoundingClientRect();
  const to   = cartBtn.getBoundingClientRect();

  const img = document.createElement('img');
  img.src = imgSrc;
  img.className = 'fly-img';
  img.style.left = (from.left + from.width / 2 - 30) + 'px';
  img.style.top  = (from.top  + from.height / 2 - 30) + 'px';

  const dx = (to.left + to.width / 2) - (from.left + from.width / 2);
  const dy = (to.top  + to.height / 2) - (from.top  + from.height / 2);
  img.style.setProperty('--fly-x', dx + 'px');
  img.style.setProperty('--fly-y', dy + 'px');

  document.body.appendChild(img);
  img.addEventListener('animationend', () => {
    img.remove();
    // Pop the cart badge
    const badge = document.getElementById('cart-badge');
    if (badge) {
      badge.classList.remove('cart-pop');
      void badge.offsetWidth; // reflow
      badge.classList.add('cart-pop');
      badge.addEventListener('animationend', () => badge.classList.remove('cart-pop'), { once: true });
    }
  });
}

async function cartAdd(productId, originEl = null) {
  let product;
  if (USE_BACKEND) {
    try {
      const res = await fetch(`${API_BASE_URL}/products/${productId}`);
      if (!res.ok) throw new Error();
      product = await res.json();
    } catch {
      showToast('Gagal memuat info produk terbaru', 'error');
      return;
    }
  } else {
    product = productGetAll().find(p => p.id === productId);
  }

  if (!product) return;

  // Cek validasi stok di backend sebelum menambahkan
  if (USE_BACKEND && product.stock <= 0) {
    showToast('Maaf, stok produk ini telah habis', 'error');
    return;
  }

  const cart = cartGet();
  const existing = cart.find(i => i.productId === productId);
  
  if (existing) {
    if (USE_BACKEND && existing.quantity >= product.stock) {
      showToast(`Batas stok tercapai! Hanya tersedia ${product.stock} pcs`, 'error');
      return;
    }
    existing.quantity += 1;
  } else {
    cart.push({ 
      productId: product.id, 
      name: product.name, 
      price: product.price, 
      quantity: 1, 
      image: product.image,
      category: product.category
    });
  }

  storageSet(KEYS.CART, cart);
  updateCartBadge();
  if (originEl) {
    flyToCart(product.image, originEl);
  } else {
    showToast(`${product.name} ditambahkan ke keranjang`, 'success');
  }
}

function cartUpdateQty(productId, qty) {
  const cart = cartGet();
  const item = cart.find(i => i.productId === productId);
  if (item) {
    item.quantity = Math.max(1, qty);
    storageSet(KEYS.CART, cart);
    updateCartBadge();
    cartRender();
  }
}

function cartRemove(productId) {
  storageSet(KEYS.CART, cartGet().filter(i => i.productId !== productId));
  updateCartBadge();
  cartRender();
}

function cartClear() {
  storageSet(KEYS.CART, []);
  updateCartBadge();
}

function cartGetTotal() {
  return cartGet().reduce((sum, i) => sum + i.price * i.quantity, 0);
}

function cartGetItemCount() {
  return cartGet().reduce((sum, i) => sum + i.quantity, 0);
}

function updateCartBadge() {
  const badge = document.getElementById('cart-badge');
  if (!badge) return;
  const count = cartGetItemCount();
  badge.textContent = count;
  badge.classList.toggle('hidden', count === 0);
}

function cartRender() {
  const cart = cartGet();
  const el = document.getElementById('cart-content');
  if (cart.length === 0) {
    el.innerHTML = `<div class="text-center py-16 text-gray-400 dark:text-gray-500">
      <div class="text-5xl mb-3">🛒</div>
      <p class="text-lg font-medium">Keranjang belanja Anda kosong</p>
      <button onclick="navigate('home')" class="mt-4 bg-indigo-600 hover:bg-indigo-700 text-white px-6 py-2 rounded-lg transition">Mulai Belanja</button>
    </div>`;
    return;
  }
  el.innerHTML = `
    <div class="flex flex-col gap-4">
      ${cart.map(item => `
        <div class="bg-white dark:bg-gray-800 rounded-2xl shadow p-4 flex gap-3 sm:gap-4 items-center">
          <img src="${item.image}" alt="${item.name}" class="w-16 h-16 sm:w-20 sm:h-20 object-cover rounded-xl shrink-0" />
          <div class="flex-1 min-w-0">
            <p class="font-semibold text-gray-800 dark:text-gray-100 truncate text-sm sm:text-base">${item.name}</p>
            <p class="text-indigo-600 dark:text-indigo-400 font-bold text-sm">${formatRupiah(item.price)}</p>
            <div class="flex items-center gap-2 mt-2">
              <button onclick="cartUpdateQty('${item.productId}', ${item.quantity - 1})" class="w-7 h-7 rounded-full bg-gray-200 dark:bg-gray-700 hover:bg-gray-300 dark:hover:bg-gray-600 flex items-center justify-center font-bold transition">−</button>
              <span class="w-7 text-center font-semibold text-sm">${item.quantity}</span>
              <button onclick="cartUpdateQty('${item.productId}', ${item.quantity + 1})" class="w-7 h-7 rounded-full bg-gray-200 dark:bg-gray-700 hover:bg-gray-300 dark:hover:bg-gray-600 flex items-center justify-center font-bold transition">+</button>
            </div>
          </div>
          <div class="text-right shrink-0">
            <p class="font-bold text-gray-800 dark:text-gray-100 text-sm sm:text-base">${formatRupiah(item.price * item.quantity)}</p>
            <button onclick="cartRemove('${item.productId}')" class="text-red-500 hover:text-red-700 text-xs mt-2 transition">Hapus</button>
          </div>
        </div>
      `).join('')}
      <div class="bg-white dark:bg-gray-800 rounded-2xl shadow p-4 flex justify-between items-center">
        <span class="text-lg font-semibold">Total</span>
        <span class="text-xl sm:text-2xl font-bold text-indigo-600 dark:text-indigo-400">${formatRupiah(cartGetTotal())}</span>
      </div>
      <button onclick="goToCheckout()" class="w-full bg-green-600 hover:bg-green-700 text-white font-semibold py-3 rounded-xl transition text-lg">Lanjut ke Checkout →</button>
    </div>
  `;
}

// =====================
// Checkout Module
// =====================
function generateTransactionId() {
  return 'TXN-' + Date.now() + '-' + Math.floor(Math.random() * 9000 + 1000);
}

function checkoutProcess(name, address, phone) {
  const cart = cartGet();
  if (!name || !address || !phone) return { error: 'Semua field wajib diisi' };
  if (cart.length === 0) return { error: 'Keranjang kosong' };
  const order = {
    transactionId: generateTransactionId(),
    date: new Date().toISOString(),
    customer: { name, address, phone },
    items: cart,
    total: cartGetTotal(),
    status: 'pending'
  };
  const orders = orderGetAll();
  orders.unshift(order);
  storageSet(KEYS.ORDERS, orders);
  cartClear();
  return { success: true, order };
}

function goToCheckout() {
  if (!authGetSession()) { navigate('login'); showToast('Silakan login terlebih dahulu', 'info'); return; }
  if (cartGet().length === 0) { showToast('Keranjang masih kosong', 'error'); return; }
  navigate('checkout');
}

function renderCheckoutPage() {
  const session = authGetSession();
  if (!session) { navigate('login'); return; }
  if (cartGet().length === 0) { navigate('cart'); return; }

  // Isi otomatis Nama Penerima dengan nama akun yang sedang login
  const nameInput = document.getElementById('co-name');
  if (nameInput) {
    nameInput.value = session.name || '';
  }

  const cart = cartGet();
  document.getElementById('checkout-summary').innerHTML = `
    <div class="divide-y divide-gray-100 dark:divide-gray-700">
      ${cart.map(i => `
        <div class="flex justify-between py-2 text-sm">
          <span class="text-gray-700 dark:text-gray-300">${i.name} <span class="text-gray-450 font-medium">x${i.quantity}</span></span>
          <span class="font-medium">${formatRupiah(i.price * i.quantity)}</span>
        </div>
      `).join('')}
      <div class="flex justify-between py-3 font-bold text-base">
        <span>Total</span>
        <span class="text-indigo-600 dark:text-indigo-400">${formatRupiah(cartGetTotal())}</span>
      </div>
    </div>
  `;
}

async function handleCheckout(e) {
  e.preventDefault();
  let valid = true;
  ['co-name', 'co-address', 'co-phone'].forEach(id => {
    const val = document.getElementById(id).value.trim();
    const err = document.getElementById(id + '-err');
    if (!val) { err.classList.remove('hidden'); valid = false; }
    else err.classList.add('hidden');
  });
  if (!valid) return;
  const name = document.getElementById('co-name').value.trim();
  const address = document.getElementById('co-address').value.trim();
  const phone = document.getElementById('co-phone').value.trim();

  if (USE_BACKEND) {
    const cart = cartGet();
    const session = authGetSession();
    try {
      const response = await fetch(`${API_BASE_URL}/checkout`, {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          'Authorization': session ? `Bearer ${session.token}` : ''
        },
        body: JSON.stringify({
          name,
          phone,
          address,
          items: cart.map(i => ({
            productId: i.productId,
            quantity: i.quantity,
            subtotal: i.price * i.quantity
          }))
        })
      });

      const data = await response.json();
      if (!response.ok) {
        showToast(data.error || 'Proses checkout di server gagal', 'error');
        return;
      }

      cartClear();
      showToast('Pesanan berhasil dikonfirmasi! Mengalihkan ke WhatsApp... 🎉', 'success');
      await navigate('orders');
      
      if (data.whatsapp_url) {
        window.open(data.whatsapp_url, '_blank');
      }
    } catch (err) {
      showToast('Tidak dapat terhubung ke server backend untuk checkout', 'error');
    }
  } else {
    const result = checkoutProcess(name, address, phone);
    if (result.error) { showToast(result.error, 'error'); return; }

    // Forward to WhatsApp Admin (Offline Mode)
    const order = result.order;
    const waNumber = '6289527204180'; 
    
    let message = `*KONFIRMASI PESANAN BARU - FLIXXMART*\n\n`;
    message += `*ID Transaksi:* ${order.transactionId}\n`;
    message += `*Tanggal:* ${new Date(order.date).toLocaleString('id-ID')}\n\n`;
    message += `*Penerima:* ${order.customer.name}\n`;
    message += `*Alamat:* ${order.customer.address}\n`;
    message += `*No. HP:* ${order.customer.phone}\n\n`;
    message += `*Detail Belanja:*\n`;
    order.items.forEach((item, idx) => {
      message += `${idx + 1}. ${item.name} (${item.quantity}x) - ${formatRupiah(item.price * item.quantity)}\n`;
    });
    message += `\n*TOTAL PEMBAYARAN:* *${formatRupiah(order.total)}*\n\n`;
    message += `Mohon segera diproses ya Admin, terima kasih! 🙏`;

    const encodedText = encodeURIComponent(message);
    const waUrl = `https://wa.me/${waNumber}?text=${encodedText}`;

    showToast('Pesanan berhasil dikonfirmasi! Mengalihkan ke WhatsApp... 🎉', 'success');
    navigate('orders');
    window.open(waUrl, '_blank');
  }
}

// =====================
// Order Module
// =====================
const orderStatusStyle = {
  pending: 'bg-yellow-100 dark:bg-yellow-900/30 text-yellow-750 dark:text-yellow-400 border border-yellow-250 dark:border-yellow-800/40',
  paid:    'bg-green-100 dark:bg-green-900/30 text-green-750 dark:text-green-400 border border-green-250 dark:border-green-800/40',
  shipped: 'bg-blue-100 dark:bg-blue-900/30 text-blue-750 dark:text-blue-400 border border-blue-250 dark:border-blue-800/40',
  done:    'bg-emerald-100 dark:bg-emerald-900/30 text-emerald-750 dark:text-emerald-400 border border-emerald-250 dark:border-emerald-800/40',
  failed:  'bg-red-100 dark:bg-red-900/30 text-red-750 dark:text-red-400 border border-red-250 dark:border-red-800/40',
  cancellation_requested: 'bg-orange-100 dark:bg-orange-900/30 text-orange-750 dark:text-orange-400 border border-orange-255 dark:border-orange-800/40',
  refunded_cancelled: 'bg-rose-100 dark:bg-rose-900/30 text-rose-755 dark:text-rose-400 border border-rose-250 dark:border-rose-800/40',
};

const orderStatusLabel = { 
  pending: '⏳ Menunggu Konfirmasi', 
  paid: '✅ Dibayar', 
  shipped: '🚚 Dikirim', 
  done: '✓ Selesai', 
  failed: '❌ Gagal',
  cancellation_requested: '⚠️ Minta Batal',
  refunded_cancelled: '💸 Refund & Batal'
};

function orderGetAll() {
  return storageGet(KEYS.ORDERS) || [];
}

async function requestOrderCancellation(transactionId) {
  if (!confirm('Apakah Anda yakin ingin meminta pembatalan untuk pesanan ini?')) return;

  if (USE_BACKEND) {
    const session = authGetSession();
    try {
      const response = await fetch(`${API_BASE_URL}/orders/${transactionId}/status`, {
        method: 'PUT',
        headers: { 
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${session.token}`
        },
        body: JSON.stringify({ status: 'cancellation_requested' })
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error);

      showToast('Permintaan pembatalan telah dikirim ke Admin', 'info');
      await orderRender();
    } catch (err) {
      showToast(err.message || 'Gagal mengirim pembatalan', 'error');
    }
  } else {
    const orders = orderGetAll();
    const idx = orders.findIndex(o => o.transactionId === transactionId);
    if (idx !== -1) {
      orders[idx].status = 'cancellation_requested';
      storageSet(KEYS.ORDERS, orders);
      showToast('Permintaan pembatalan telah dikirim', 'info');
      orderRender();
    }
  }
}

async function orderRender() {
  const session = authGetSession();
  const el = document.getElementById('orders-content');

  let orders = [];
  if (USE_BACKEND) {
    try {
      const response = await fetch(`${API_BASE_URL}/orders`, {
        headers: { 'Authorization': `Bearer ${session.token}` }
      });
      if (!response.ok) throw new Error();
      orders = await response.json();
    } catch {
      el.innerHTML = `<p class="text-center text-red-500 py-8">Gagal memuat daftar pesanan dari server</p>`;
      return;
    }
  } else {
    orders = orderGetAll();
  }

  if (orders.length === 0) {
    el.innerHTML = `<div class="text-center py-16 text-gray-400 dark:text-gray-500">
      <div class="text-5xl mb-3">📦</div>
      <p class="text-lg font-medium">Belum ada pesanan</p>
      <button onclick="navigate('home')" class="mt-4 bg-indigo-600 hover:bg-indigo-700 text-white px-6 py-2 rounded-lg transition">Mulai Belanja</button>
    </div>`;
    return;
  }
  
  // Filter user orders only
  const userOrders = !USE_BACKEND && session && session.role !== 'admin' 
    ? orders.filter(o => o.customer.name === session.name)
    : orders;

  if (userOrders.length === 0) {
    el.innerHTML = `<div class="text-center py-16 text-gray-400 dark:text-gray-500">
      <div class="text-5xl mb-3">📦</div>
      <p class="text-lg font-medium">Anda belum melakukan pesanan</p>
      <button onclick="navigate('home')" class="mt-4 bg-indigo-600 hover:bg-indigo-700 text-white px-6 py-2 rounded-lg transition">Mulai Belanja</button>
    </div>`;
    return;
  }

  el.innerHTML = userOrders.map(o => {
    const status = o.status || 'pending';
    const badgeClass = orderStatusStyle[status] || 'bg-yellow-100 dark:bg-yellow-900 text-yellow-700';
    const badgeLabel = orderStatusLabel[status] || 'Menunggu';
    
    // Show Minta Batal button for pending / paid status
    const canCancel = status === 'pending' || status === 'paid';
    const cancelBtn = canCancel 
      ? `<button onclick="requestOrderCancellation('${o.transactionId}')" class="mt-3 w-full sm:w-auto bg-gray-100 hover:bg-gray-200 dark:bg-gray-700 dark:hover:bg-gray-600 text-red-650 dark:text-red-400 font-semibold px-4 py-2 rounded-xl text-xs transition border border-red-200/50 dark:border-red-900/40">⚠️ Minta Pembatalan</button>`
      : '';

    return `
    <div class="bg-white dark:bg-gray-800 rounded-2xl shadow border border-gray-100 dark:border-gray-700 p-4 sm:p-5 mb-4">
      <div class="flex flex-wrap justify-between items-start gap-2 mb-3">
        <div class="min-w-0">
          <p class="font-bold text-indigo-600 dark:text-indigo-400 text-xs sm:text-sm font-mono truncate">${o.transactionId}</p>
          <p class="text-xs text-gray-400 mt-0.5">${new Date(o.date).toLocaleString('id-ID')}</p>
        </div>
        <span class="${badgeClass} text-xs font-semibold px-2.5 py-1 rounded-full shrink-0">${badgeLabel}</span>
      </div>
      <div class="text-xs sm:text-sm text-gray-650 dark:text-gray-300 mb-3">
        <p class="truncate">📍 ${o.customer.name} — ${o.customer.address}</p>
        <p>📞 ${o.customer.phone}</p>
      </div>
      <div class="divide-y divide-gray-100 dark:divide-gray-700">
        ${o.items.map(i => `
          <div class="flex justify-between py-1.5 text-xs sm:text-sm gap-2">
            <span class="truncate">${i.name} <span class="text-gray-450 font-medium">x${i.quantity}</span></span>
            <span class="shrink-0 font-medium">${formatRupiah(i.price * i.quantity)}</span>
          </div>
        `).join('')}
      </div>
      <div class="flex justify-between items-center mt-3 pt-3 border-t border-gray-105 dark:border-gray-700 font-bold text-sm sm:text-base">
        <span>Total</span>
        <span class="text-indigo-605 dark:text-indigo-400">${formatRupiah(o.total)}</span>
      </div>
      ${cancelBtn}
    </div>
    `;
  }).join('') + `<button onclick="navigate('home')" class="w-full bg-green-600 hover:bg-green-700 text-white font-semibold py-3 rounded-xl transition text-sm sm:text-base mt-2">← Kembali ke Toko</button>`;
}

// =====================
// Admin Module
// =====================
let adminEditingProductId = null;
let adminActiveTab = 'dashboard';
let adminActiveOrderFilter = 'all';

const statusStyle = {
  pending: 'bg-yellow-100 dark:bg-yellow-900/30 text-yellow-700 dark:text-yellow-400 border border-yellow-200 dark:border-yellow-800/40',
  paid:    'bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400 border border-green-200 dark:border-green-800/40',
  shipped: 'bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-400 border border-blue-200 dark:border-blue-800/40',
  done:    'bg-emerald-100 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-800/40',
  failed:  'bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-400 border border-red-200 dark:border-red-800/40',
  cancellation_requested: 'bg-orange-100 dark:bg-orange-900/30 text-orange-700 dark:text-orange-400 border border-orange-200 dark:border-orange-800/40',
  refunded_cancelled: 'bg-rose-100 dark:bg-rose-900/30 text-rose-700 dark:text-rose-400 border border-rose-200 dark:border-rose-800/40',
};

const statusLabel = { 
  pending: '⏳ Menunggu', 
  paid: '✅ Dibayar', 
  shipped: '🚚 Dikirim', 
  done: '✓ Selesai', 
  failed: '❌ Gagal',
  cancellation_requested: '⚠️ Minta Batal',
  refunded_cancelled: '💸 Refund & Batal'
};

async function adminRender() {
  const el = document.getElementById('admin-main-content');
  if (!el) return;

  const session = authGetSession();
  let products = [];
  let users = [];
  let orders = [];

  if (USE_BACKEND) {
    try {
      const [prodRes, custRes, ordRes] = await Promise.all([
        fetch(`${API_BASE_URL}/products`),
        fetch(`${API_BASE_URL}/admin/customers`, { headers: { 'Authorization': `Bearer ${session.token}` } }),
        fetch(`${API_BASE_URL}/orders`, { headers: { 'Authorization': `Bearer ${session.token}` } })
      ]);
      
      if (!prodRes.ok || !custRes.ok || !ordRes.ok) throw new Error();
      
      products = await prodRes.json();
      users = await custRes.json();
      orders = await ordRes.json();
    } catch {
      el.innerHTML = `<p class="text-center text-red-500 py-8">Gagal memuat data administrasi dari server</p>`;
      return;
    }
  } else {
    products = productGetAll();
    users = (storageGet(KEYS.USERS) || []).filter(u => u.role !== 'admin');
    orders = orderGetAll();
  }

  const totalRevenue = orders.reduce((s, o) => s + (o.status !== 'refunded_cancelled' && o.status !== 'failed' ? o.total : 0), 0);

  // Update static sidebar admin info
  if (session) {
    const nameEl = document.getElementById('admin-sidebar-name');
    const emailEl = document.getElementById('admin-sidebar-email');
    const avatarEl = document.getElementById('admin-sidebar-avatar');
    if (nameEl) nameEl.textContent = session.name;
    if (emailEl) emailEl.textContent = session.email;
    if (avatarEl) avatarEl.textContent = session.name.charAt(0).toUpperCase();
  }

  const headerDateEl = document.getElementById('admin-header-date');
  if (headerDateEl) {
    headerDateEl.textContent = new Date().toLocaleDateString('id-ID', {
      day: '2-digit',
      month: 'short',
      year: 'numeric'
    });
  }

  const catColors = {
    'Pakaian':    { bg: 'bg-pink-100 dark:bg-pink-900/40',    text: 'text-pink-700 dark:text-pink-300',    dot: 'bg-pink-500' },
    'Elektronik': { bg: 'bg-blue-100 dark:bg-blue-900/40',    text: 'text-blue-700 dark:text-blue-300',    dot: 'bg-blue-500' },
    'Sepatu':     { bg: 'bg-green-100 dark:bg-green-900/40',  text: 'text-green-700 dark:text-green-300',  dot: 'bg-green-500' },
    'Tas':        { bg: 'bg-yellow-100 dark:bg-yellow-900/40',text: 'text-yellow-700 dark:text-yellow-300',dot: 'bg-yellow-500' },
  };
  const getCat = c => catColors[c] || { bg: 'bg-gray-100 dark:bg-gray-700', text: 'text-gray-600 dark:text-gray-300', dot: 'bg-gray-400' };

  const avatarColors = ['bg-indigo-500','bg-pink-500','bg-green-500','bg-yellow-500','bg-purple-500','bg-red-500','bg-teal-500'];
  const getAvatar = (name, i) => {
    return '<div class="w-9 h-9 rounded-full ' + avatarColors[i % avatarColors.length] + ' flex items-center justify-center text-white font-bold text-sm shrink-0">' + name.charAt(0).toUpperCase() + '</div>';
  };

  // Filter orders for orders tab
  const filteredOrders = orders.filter(o => {
    const s = o.status || 'pending';
    if (adminActiveOrderFilter === 'all') return true;
    if (adminActiveOrderFilter === 'pending') return s === 'pending';
    if (adminActiveOrderFilter === 'paid') return s === 'paid';
    if (adminActiveOrderFilter === 'shipped') return s === 'shipped';
    if (adminActiveOrderFilter === 'done') return s === 'done';
    if (adminActiveOrderFilter === 'cancel') return s === 'cancellation_requested' || s === 'refunded_cancelled';
    return true;
  });

  // Calculate order counts for order filters
  const counts = { pending: 0, paid: 0, shipped: 0, done: 0, failed: 0, cancellation_requested: 0, refunded_cancelled: 0 };
  orders.forEach(o => {
    const s = o.status || 'pending';
    if (counts[s] !== undefined) counts[s]++;
  });

  const allCount = orders.length;
  const pendingCount = counts.pending;
  const paidCount = counts.paid;
  const shippedCount = counts.shipped;
  const doneCount = counts.done;
  const cancelCount = counts.cancellation_requested + counts.refunded_cancelled;

  // Form edit product pre-fill logic
  let editProd = null;
  if (adminEditingProductId) {
    editProd = products.find(p => p.id === adminEditingProductId);
  }
  const nameVal = editProd ? editProd.name : '';
  const priceVal = editProd ? editProd.price : '';
  const catVal = editProd ? editProd.category : '';
  const descVal = editProd ? editProd.description : '';
  const imgVal = editProd ? editProd.image : '';

  el.innerHTML = `
    <!-- ===== TAB: DASHBOARD ===== -->
    <div id="admin-tab-dashboard" class="space-y-6">
      <!-- Stats Cards Grid -->
      <div class="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <div class="bg-white dark:bg-gray-800 rounded-2xl shadow-sm border border-gray-100 dark:border-gray-700 p-4 sm:p-5 flex items-center gap-4">
          <div class="w-10 h-10 sm:w-12 sm:h-12 rounded-xl bg-indigo-50 dark:bg-indigo-955/40 flex items-center justify-center text-xl sm:text-2xl shrink-0">📦</div>
          <div>
            <p class="text-xs text-gray-400 font-medium">Total Produk</p>
            <p class="text-xl sm:text-2xl font-extrabold text-indigo-600 dark:text-indigo-400 mt-0.5">${products.length}</p>
          </div>
        </div>
        <div class="bg-white dark:bg-gray-800 rounded-2xl shadow-sm border border-gray-100 dark:border-gray-700 p-4 sm:p-5 flex items-center gap-4">
          <div class="w-10 h-10 sm:w-12 sm:h-12 rounded-xl bg-green-50 dark:bg-green-955/40 flex items-center justify-center text-xl sm:text-2xl shrink-0">👥</div>
          <div>
            <p class="text-xs text-gray-400 font-medium">Customer</p>
            <p class="text-xl sm:text-2xl font-extrabold text-green-600 dark:text-green-400 mt-0.5">${users.length}</p>
          </div>
        </div>
        <div class="bg-white dark:bg-gray-800 rounded-2xl shadow-sm border border-gray-100 dark:border-gray-700 p-4 sm:p-5 flex items-center gap-4">
          <div class="w-10 h-10 sm:w-12 sm:h-12 rounded-xl bg-yellow-50 dark:bg-yellow-955/40 flex items-center justify-center text-xl sm:text-2xl shrink-0">🧾</div>
          <div>
            <p class="text-xs text-gray-450 font-medium">Pesanan</p>
            <p class="text-xl sm:text-2xl font-extrabold text-yellow-600 dark:text-yellow-400 mt-0.5">${orders.length}</p>
          </div>
        </div>
        <div class="bg-white dark:bg-gray-800 rounded-2xl shadow-sm border border-gray-100 dark:border-gray-700 p-4 sm:p-5 flex items-center gap-4">
          <div class="w-10 h-10 sm:w-12 sm:h-12 rounded-xl bg-pink-50 dark:bg-pink-955/40 flex items-center justify-center text-xl sm:text-2xl shrink-0">💰</div>
          <div>
            <p class="text-xs text-gray-450 font-medium">Pendapatan</p>
            <p class="text-base sm:text-lg font-extrabold text-pink-600 dark:text-pink-400 mt-0.5 truncate">${formatRupiah(totalRevenue)}</p>
          </div>
        </div>
      </div>

      <!-- Dashboard Main Section -->
      <div class="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <!-- Recent Orders (Left 2 cols) -->
        <div class="lg:col-span-2 bg-white dark:bg-gray-800 rounded-2xl border border-gray-100 dark:border-gray-700 p-4 sm:p-5 shadow-sm">
          <div class="flex items-center justify-between mb-4 border-b border-gray-50 dark:border-gray-750 pb-3">
            <h3 class="font-bold text-gray-800 dark:text-white text-sm sm:text-base">🛒 Pesanan Terbaru</h3>
            <button onclick="adminTab('orders')" class="text-xs text-indigo-600 dark:text-indigo-400 hover:underline font-semibold">Semua Pesanan →</button>
          </div>
          <div class="overflow-x-auto">
            <table class="w-full text-left border-collapse min-w-[500px]">
              <thead>
                <tr class="border-b border-gray-100 dark:border-gray-700 text-xs text-gray-400 uppercase font-semibold">
                  <th class="py-2.5 px-4">Order ID</th>
                  <th class="py-2.5 px-4">Customer</th>
                  <th class="py-2.5 px-4">Tanggal</th>
                  <th class="py-2.5 px-4 text-right">Total</th>
                  <th class="py-2.5 px-4 text-center">Status</th>
                  <th class="py-2.5 px-4 text-center">Aksi</th>
                </tr>
              </thead>
              <tbody class="divide-y divide-gray-50 dark:divide-gray-700/50">
                ${orders.length === 0 
                  ? `<tr><td colspan="6" class="text-center py-8 text-gray-400 text-xs">Belum ada transaksi</td></tr>`
                  : orders.slice(0, 5).map(o => {
                      const status = o.status || 'pending';
                      const badge = `<span class="${statusStyle[status] || ''} text-[10px] font-semibold px-2 py-0.5 rounded-full whitespace-nowrap">${statusLabel[status] || status}</span>`;
                      return `
                        <tr class="hover:bg-slate-50 dark:hover:bg-gray-700/50 transition">
                          <td class="px-4 py-3 font-mono text-xs text-indigo-600 dark:text-indigo-400 font-semibold truncate max-w-[120px]">${o.transactionId}</td>
                          <td class="px-4 py-3 text-xs sm:text-sm font-medium text-gray-700 dark:text-gray-300 truncate max-w-[120px]">${o.customer.name}</td>
                          <td class="px-4 py-3 text-[10px] sm:text-xs text-gray-400 whitespace-nowrap">${new Date(o.date).toLocaleDateString('id-ID')}</td>
                          <td class="px-4 py-3 text-right text-xs sm:text-sm font-bold text-gray-800 dark:text-gray-200">${formatRupiah(o.total)}</td>
                          <td class="px-4 py-3 text-center">${badge}</td>
                          <td class="px-4 py-3 text-center">
                            <button onclick="adminGoToOrder('${o.transactionId}')" class="text-xs text-indigo-600 dark:text-indigo-400 hover:underline font-semibold whitespace-nowrap">Detail</button>
                          </td>
                        </tr>`;
                    }).join('')
                }
              </tbody>
            </table>
          </div>
        </div>

        <!-- Status Legend & Ringkasan (Right 1 col) -->
        <div class="bg-white dark:bg-gray-800 rounded-2xl border border-gray-100 dark:border-gray-700 p-4 sm:p-5 shadow-sm space-y-4">
          <h3 class="font-bold text-gray-800 dark:text-white text-sm sm:text-base border-b border-gray-50 dark:border-gray-750 pb-3">📊 Ringkasan Status</h3>
          <div class="space-y-3">
            <div class="flex items-center justify-between text-xs sm:text-sm">
              <span class="text-gray-500 flex items-center gap-2">⏳ Menunggu Konfirmasi</span>
              <span class="font-bold bg-yellow-50 dark:bg-yellow-955/20 text-yellow-600 px-2 py-0.5 rounded-full">${counts.pending}</span>
            </div>
            <div class="flex items-center justify-between text-xs sm:text-sm">
              <span class="text-gray-500 flex items-center gap-2">✅ Dibayar</span>
              <span class="font-bold bg-green-50 dark:bg-green-955/20 text-green-600 px-2 py-0.5 rounded-full">${counts.paid}</span>
            </div>
            <div class="flex items-center justify-between text-xs sm:text-sm">
              <span class="text-gray-500 flex items-center gap-2">🚚 Dikirim</span>
              <span class="font-bold bg-blue-50 dark:bg-blue-955/20 text-blue-600 px-2 py-0.5 rounded-full">${counts.shipped}</span>
            </div>
            <div class="flex items-center justify-between text-xs sm:text-sm">
              <span class="text-gray-500 flex items-center gap-2">✓ Selesai</span>
              <span class="font-bold bg-emerald-50 dark:bg-emerald-955/20 text-emerald-600 px-2 py-0.5 rounded-full">${counts.done}</span>
            </div>
            <div class="flex items-center justify-between text-xs sm:text-sm border-t border-gray-50 dark:border-gray-700/50 pt-2.5">
              <span class="text-gray-500 flex items-center gap-2">⚠️ Permintaan Batal</span>
              <span class="font-bold bg-orange-50 dark:bg-orange-955/20 text-orange-600 px-2 py-0.5 rounded-full">${counts.cancellation_requested}</span>
            </div>
            <div class="flex items-center justify-between text-xs sm:text-sm">
              <span class="text-gray-500 flex items-center gap-2">💸 Refund & Batal</span>
              <span class="font-bold bg-rose-50 dark:bg-rose-955/20 text-rose-600 px-2 py-0.5 rounded-full">${counts.refunded_cancelled}</span>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- ===== TAB: PRODUCTS ===== -->
    <div id="admin-tab-products" class="hidden">
      <div class="grid lg:grid-cols-5 gap-6">
        <!-- Add/Edit Product Form (2 cols) -->
        <div class="lg:col-span-2 bg-white dark:bg-gray-800 rounded-2xl shadow-sm border border-gray-100 dark:border-gray-700 overflow-hidden self-start">
          <div class="bg-gradient-to-r from-indigo-600 to-purple-600 px-5 py-4">
            <h3 class="text-white font-bold text-sm sm:text-base" id="admin-product-form-title">
              ${adminEditingProductId ? '✏️ Edit Produk' : '✨ Tambah Produk Baru'}
            </h3>
            <p class="text-white/70 text-xs mt-0.5">Isi semua field untuk menyimpan produk</p>
          </div>
          <form onsubmit="adminSubmitProduct(event, '${adminEditingProductId || ''}')" class="p-5 space-y-4">
            <div>
              <label class="block text-xs font-semibold mb-1.5 text-gray-550 dark:text-gray-400 uppercase tracking-wide">Nama Produk</label>
              <input id="adm-name" type="text" placeholder="Contoh: Kemeja Batik Pria" value="${nameVal}"
                class="w-full border border-gray-200 dark:border-gray-600 rounded-xl px-3 py-2.5 bg-gray-50 dark:bg-gray-700/50 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-400 text-sm transition" required />
            </div>
            <div class="grid grid-cols-2 gap-3">
              <div>
                <label class="block text-xs font-semibold mb-1.5 text-gray-550 dark:text-gray-400 uppercase tracking-wide">Harga (Rp)</label>
                <input id="adm-price" type="number" min="0" placeholder="150000" value="${priceVal}"
                  class="w-full border border-gray-200 dark:border-gray-600 rounded-xl px-3 py-2.5 bg-gray-50 dark:bg-gray-700/50 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-400 text-sm transition" required />
              </div>
              <div>
                <label class="block text-xs font-semibold mb-1.5 text-gray-550 dark:text-gray-400 uppercase tracking-wide">Kategori</label>
                <select id="adm-category"
                  class="w-full border border-gray-200 dark:border-gray-600 rounded-xl px-3 py-2.5 bg-gray-50 dark:bg-gray-700/50 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-400 text-sm transition" required>
                  <option value="">Pilih...</option>
                  <option value="Pakaian" ${catVal === 'Pakaian' ? 'selected' : ''}>Pakaian</option>
                  <option value="Elektronik" ${catVal === 'Elektronik' ? 'selected' : ''}>Elektronik</option>
                  <option value="Sepatu" ${catVal === 'Sepatu' ? 'selected' : ''}>Sepatu</option>
                  <option value="Tas" ${catVal === 'Tas' ? 'selected' : ''}>Tas</option>
                </select>
              </div>
            </div>
            <div>
              <label class="block text-xs font-semibold mb-1.5 text-gray-550 dark:text-gray-400 uppercase tracking-wide">Deskripsi</label>
              <textarea id="adm-desc" rows="3" placeholder="Deskripsi singkat produk..."
                class="w-full border border-gray-200 dark:border-gray-600 rounded-xl px-3 py-2.5 bg-gray-50 dark:bg-gray-700/50 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-400 text-sm transition resize-none" required>${descVal}</textarea>
            </div>
            <div>
              <label class="block text-xs font-semibold mb-1.5 text-gray-550 dark:text-gray-400 uppercase tracking-wide">Path / URL Gambar</label>
              <input id="adm-image" type="text" placeholder="images/products/nama_file.jpg" value="${imgVal}"
                class="w-full border border-gray-200 dark:border-gray-600 rounded-xl px-3 py-2.5 bg-gray-50 dark:bg-gray-700/50 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-400 text-sm transition" required />
            </div>
            <div class="flex gap-2">
              ${adminEditingProductId ? `<button type="button" onclick="adminCancelEditProduct()" class="flex-1 bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-250 font-bold py-2.5 rounded-xl transition text-sm">Batal</button>` : ''}
              <button type="submit" class="flex-1 bg-indigo-600 hover:bg-indigo-700 text-white font-bold py-2.5 rounded-xl transition text-sm shadow-md">
                ${adminEditingProductId ? 'Simpan Perubahan' : '+ Tambah Produk'}
              </button>
            </div>
          </form>
        </div>

        <!-- Product Cards Grid (3 cols) -->
        <div class="lg:col-span-3">
          <div class="flex items-center justify-between mb-4">
            <h3 class="font-bold text-gray-700 dark:text-gray-200 text-sm sm:text-base">Daftar Produk <span class="text-gray-400 font-normal">(${products.length})</span></h3>
          </div>
          <div class="grid grid-cols-2 sm:grid-cols-2 xl:grid-cols-3 gap-4 max-h-[600px] overflow-y-auto pr-1">
            ${products.map(p => {
              const cat = getCat(p.category);
              return `
              <div class="reveal bg-white dark:bg-gray-800 rounded-2xl border border-gray-150 dark:border-gray-700 overflow-hidden shadow-sm hover:shadow-md transition group">
                <div class="relative h-24 sm:h-32 bg-gray-100 dark:bg-gray-700 overflow-hidden">
                  <img src="${p.image}" alt="${p.name}" class="w-full h-full object-cover group-hover:scale-105 transition duration-300"
                    onerror="this.src='https://placehold.co/400x300/e2e8f0/94a3b8?text=No+Image'" />
                  <span class="absolute top-1.5 left-1.5 ${cat.bg} ${cat.text} text-[10px] font-semibold px-2 py-0.5 rounded-full">${p.category}</span>
                </div>
                <div class="p-3">
                  <p class="font-semibold text-xs sm:text-sm text-gray-800 dark:text-gray-100 truncate mb-1">${p.name}</p>
                  <p class="text-indigo-600 dark:text-indigo-400 font-bold text-xs sm:text-sm mb-3">${formatRupiah(p.price)}</p>
                  <div class="flex gap-2">
                    <button onclick="adminStartEditProduct('${p.id}')"
                      class="flex-1 text-center text-xs text-indigo-600 dark:text-indigo-400 hover:text-white hover:bg-indigo-600 border border-indigo-200 dark:border-indigo-800 py-1.5 rounded-lg transition font-medium">
                      ✏️ Edit
                    </button>
                    <button onclick="adminDeleteProduct('${p.id}')"
                      class="flex-1 text-center text-xs text-red-500 hover:text-white hover:bg-red-500 border border-red-200 dark:border-red-800 py-1.5 rounded-lg transition font-medium">
                      🗑 Hapus
                    </button>
                  </div>
                </div>
              </div>`;
            }).join('')}
          </div>
        </div>
      </div>
    </div>

    <!-- ===== TAB: ORDERS ===== -->
    <div id="admin-tab-orders" class="hidden space-y-6">
      <!-- Status filter bar -->
      <div class="flex gap-1.5 sm:gap-2 bg-gray-100 dark:bg-gray-850 p-1 sm:p-1.5 rounded-2xl w-full overflow-x-auto scrollbar-none">
        <button onclick="adminSetOrderFilter('all')" class="px-3.5 py-1.5 text-xs font-semibold rounded-xl transition ${adminActiveOrderFilter === 'all' ? 'bg-white dark:bg-gray-700 text-indigo-600 dark:text-indigo-400 shadow-sm' : 'text-gray-500 dark:text-gray-400 hover:bg-white/60 dark:hover:bg-gray-700/60'} whitespace-nowrap">Semua (${allCount})</button>
        <button onclick="adminSetOrderFilter('pending')" class="px-3.5 py-1.5 text-xs font-semibold rounded-xl transition ${adminActiveOrderFilter === 'pending' ? 'bg-white dark:bg-gray-700 text-indigo-600 dark:text-indigo-400 shadow-sm' : 'text-gray-500 dark:text-gray-400 hover:bg-white/60 dark:hover:bg-gray-700/60'} whitespace-nowrap">⏳ Menunggu (${pendingCount})</button>
        <button onclick="adminSetOrderFilter('paid')" class="px-3.5 py-1.5 text-xs font-semibold rounded-xl transition ${adminActiveOrderFilter === 'paid' ? 'bg-white dark:bg-gray-700 text-indigo-600 dark:text-indigo-400 shadow-sm' : 'text-gray-550 dark:text-gray-400 hover:bg-white/60 dark:hover:bg-gray-700/60'} whitespace-nowrap">✅ Dibayar (${paidCount})</button>
        <button onclick="adminSetOrderFilter('shipped')" class="px-3.5 py-1.5 text-xs font-semibold rounded-xl transition ${adminActiveOrderFilter === 'shipped' ? 'bg-white dark:bg-gray-700 text-indigo-600 dark:text-indigo-400 shadow-sm' : 'text-gray-550 dark:text-gray-400 hover:bg-white/60 dark:hover:bg-gray-700/60'} whitespace-nowrap">🚚 Dikirim (${shippedCount})</button>
        <button onclick="adminSetOrderFilter('done')" class="px-3.5 py-1.5 text-xs font-semibold rounded-xl transition ${adminActiveOrderFilter === 'done' ? 'bg-white dark:bg-gray-700 text-indigo-600 dark:text-indigo-400 shadow-sm' : 'text-gray-550 dark:text-gray-400 hover:bg-white/60 dark:hover:bg-gray-700/60'} whitespace-nowrap">✓ Selesai (${doneCount})</button>
        <button onclick="adminSetOrderFilter('cancel')" class="px-3.5 py-1.5 text-xs font-semibold rounded-xl transition ${adminActiveOrderFilter === 'cancel' ? 'bg-white dark:bg-gray-700 text-indigo-600 dark:text-indigo-400 shadow-sm' : 'text-gray-550 dark:text-gray-400 hover:bg-white/60 dark:hover:bg-gray-700/60'} whitespace-nowrap">⚠️ Batal/Minta Batal (${cancelCount})</button>
      </div>

      <div class="flex flex-col gap-4">
        ${filteredOrders.length === 0
          ? `<div class="text-center py-16 text-gray-400 dark:text-gray-550"><div class="text-5xl mb-3">🧾</div><p class="text-lg font-medium">Tidak ada pesanan yang sesuai filter</p></div>`
          : filteredOrders.map((o, i) => {
              const status = o.status || 'pending';
              const badge = `<span class="${statusStyle[status] || ''} text-xs font-bold px-3 py-1 rounded-full whitespace-nowrap">${statusLabel[status] || status}</span>`;
              return `
              <div id="admin-order-card-${o.transactionId}" class="reveal bg-white dark:bg-gray-800 rounded-2xl border border-gray-150 dark:border-gray-700 shadow-sm overflow-hidden hover:shadow-md transition">
                <div class="flex flex-wrap items-center justify-between gap-3 px-5 py-4 border-b border-gray-100 dark:border-gray-700 bg-gray-50/50 dark:bg-gray-700/30">
                  <div class="flex items-center gap-3 min-w-0">
                    <div class="w-9 h-9 rounded-xl bg-indigo-50 dark:bg-indigo-955/40 flex items-center justify-center text-lg shrink-0">🧾</div>
                    <div class="min-w-0">
                      <p class="font-bold text-indigo-600 dark:text-indigo-400 text-xs font-mono truncate">${o.transactionId}</p>
                      <p class="text-[10px] sm:text-xs text-gray-400">${new Date(o.date).toLocaleString('id-ID')}</p>
                    </div>
                  </div>
                  <div class="flex items-center gap-3 shrink-0">
                    ${badge}
                    <span class="text-sm sm:text-base font-extrabold text-gray-800 dark:text-gray-100">${formatRupiah(o.total)}</span>
                  </div>
                </div>
                
                <div class="p-5 flex flex-col md:flex-row gap-5">
                  <!-- Penerima -->
                  <div class="md:w-56 shrink-0 border-b md:border-b-0 md:border-r border-gray-100 dark:border-gray-700 pb-4 md:pb-0 md:pr-5">
                    <p class="text-[10px] font-semibold text-gray-400 uppercase tracking-wide mb-3">Penerima & Alamat</p>
                    <div class="flex items-center gap-2 mb-2">
                       ${getAvatar(o.customer.name, i)}
                      <p class="font-bold text-sm text-gray-800 dark:text-gray-100 truncate">${o.customer.name}</p>
                    </div>
                    <p class="text-xs text-gray-650 mt-2">📍 ${o.customer.address}</p>
                    <p class="text-xs text-gray-550 mt-1">📞 ${o.customer.phone}</p>
                  </div>
                  
                  <!-- Items -->
                  <div class="flex-1 min-w-0">
                    <p class="text-[10px] font-semibold text-gray-400 uppercase tracking-wide mb-3">Rincian Item</p>
                    <div class="flex flex-col gap-2">
                      ${o.items.map(item => `
                        <div class="flex justify-between items-center text-xs sm:text-sm bg-gray-50 dark:bg-gray-750/30 rounded-xl px-3 py-2 gap-2 border border-gray-100/50 dark:border-gray-700/50">
                          <span class="text-gray-700 dark:text-gray-300 truncate font-medium">${item.name}</span>
                          <span class="shrink-0 text-gray-400 text-xs">x${item.quantity} · <span class="font-bold text-gray-700 dark:text-gray-200">${formatRupiah(item.price * item.quantity)}</span></span>
                        </div>
                      `).join('')}
                    </div>

                    <!-- Status Changer Dropdown -->
                    <div class="mt-5 pt-4 border-t border-gray-100 dark:border-gray-700 flex flex-wrap items-center justify-between gap-3">
                      <span class="text-xs text-gray-500 dark:text-gray-400 font-medium">Ubah Status Pesanan:</span>
                      <select onchange="adminUpdateOrderStatus('${o.transactionId}', this.value)" 
                        class="text-xs border border-gray-200 dark:border-gray-600 rounded-lg px-3 py-1.5 bg-white dark:bg-gray-700 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-400 transition font-semibold">
                        <option value="pending" ${status === 'pending' ? 'selected' : ''}>⏳ Menunggu Konfirmasi</option>
                        <option value="paid" ${status === 'paid' ? 'selected' : ''}>✅ Dibayar</option>
                        <option value="shipped" ${status === 'shipped' ? 'selected' : ''}>🚚 Dikirim</option>
                        <option value="done" ${status === 'done' ? 'selected' : ''}>✓ Selesai</option>
                        <option value="failed" ${status === 'failed' ? 'selected' : ''}>❌ Gagal</option>
                        <option value="cancellation_requested" ${status === 'cancellation_requested' ? 'selected' : ''}>⚠️ Minta Batal (Pending)</option>
                        <option value="refunded_cancelled" ${status === 'refunded_cancelled' ? 'selected' : ''}>💸 Refund & Batal</option>
                      </select>
                    </div>
                  </div>
                </div>
              </div>`;
            }).join('')}
      </div>
    </div>

    <!-- ===== TAB: CUSTOMERS ===== -->
    <div id="admin-tab-customers" class="hidden">
      <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        ${users.length === 0
          ? `<div class="col-span-full text-center py-16 text-gray-400"><div class="text-5xl mb-3">👥</div><p>Belum ada customer terdaftar</p></div>`
          : users.map((u, i) => {
              const userOrders = orders.filter(o => o.customer && o.customer.name === u.name);
              const totalSpent = USE_BACKEND ? u.total_spent : userOrders.reduce((s, o) => s + (o.status !== 'refunded_cancelled' && o.status !== 'failed' ? o.total : 0), 0);
              const orderCount = USE_BACKEND ? u.order_count : userOrders.length;
              return `
              <div class="reveal bg-white dark:bg-gray-800 rounded-2xl border border-gray-150 dark:border-gray-700 shadow-sm p-5 hover:shadow-md transition">
                <div class="flex items-center gap-3.5 mb-4">
                  ${getAvatar(u.name, i)}
                  <div class="min-w-0">
                    <p class="font-bold text-gray-800 dark:text-gray-100 truncate text-sm sm:text-base">${u.name}</p>
                    <p class="text-xs text-gray-400 truncate">${u.email}</p>
                  </div>
                </div>
                <div class="grid grid-cols-2 gap-3">
                  <div class="bg-indigo-50 dark:bg-indigo-955/20 rounded-xl p-3 text-center">
                    <p class="text-xl sm:text-2xl font-extrabold text-indigo-600 dark:text-indigo-400">${orderCount}</p>
                    <p class="text-[10px] text-gray-500 mt-0.5">Pesanan</p>
                  </div>
                  <div class="bg-green-50 dark:bg-green-955/20 rounded-xl p-3 text-center flex flex-col justify-center">
                    <p class="text-xs sm:text-sm font-extrabold text-green-600 dark:text-green-400 leading-tight truncate">${formatRupiah(totalSpent)}</p>
                    <p class="text-[10px] text-gray-500 mt-0.5">Total Belanja</p>
                  </div>
                </div>
                <div class="mt-4 flex items-center gap-2 border-t border-gray-50 dark:border-gray-700/50 pt-3">
                  <span class="w-2 h-2 rounded-full bg-green-400 shrink-0"></span>
                  <span class="text-xs text-gray-400">Status Aktif</span>
                  <span class="ml-auto text-[10px] bg-gray-100 dark:bg-gray-700 text-gray-500 dark:text-gray-400 px-2 py-0.5 rounded-full font-semibold uppercase">${u.role}</span>
                </div>
              </div>`;
            }).join('')
        }
      </div>
    </div>

    <!-- ===== TAB: REPORTS ===== -->
    <div id="admin-tab-reports" class="hidden space-y-6">
      <div class="bg-white dark:bg-gray-800 rounded-2xl border border-gray-150 dark:border-gray-700 p-5 shadow-sm">
        <h3 class="font-bold text-gray-800 dark:text-white text-sm sm:text-base mb-4">📈 Penjualan Per Kategori</h3>
        <div class="h-80 w-full relative">
          <canvas id="salesChart"></canvas>
        </div>
      </div>

      <div class="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div class="bg-gradient-to-br from-indigo-500 to-indigo-600 text-white rounded-2xl p-5 shadow-sm">
          <p class="text-indigo-100 text-xs font-semibold uppercase tracking-wide">Rata-Rata Transaksi</p>
          <p class="text-2xl font-extrabold mt-1">
            ${orders.length > 0 ? formatRupiah(Math.floor(totalRevenue / orders.length)) : 'Rp 0'}
          </p>
          <p class="text-xs text-indigo-200 mt-2">Dihitung dari total penjualan bersih</p>
        </div>
        <div class="bg-gradient-to-br from-purple-500 to-purple-600 text-white rounded-2xl p-5 shadow-sm">
          <p class="text-purple-100 text-xs font-semibold uppercase tracking-wide">Transaksi Tertinggi</p>
          <p class="text-2xl font-extrabold mt-1">
            ${orders.length > 0 ? formatRupiah(Math.max(...orders.map(o => o.total))) : 'Rp 0'}
          </p>
          <p class="text-xs text-purple-200 mt-2">Nilai pesanan tunggal tertinggi</p>
        </div>
        <div class="bg-gradient-to-br from-pink-500 to-pink-600 text-white rounded-2xl p-5 shadow-sm">
          <p class="text-pink-100 text-xs font-semibold uppercase tracking-wide">Tingkat Penyelesaian</p>
          <p class="text-2xl font-extrabold mt-1">
            ${orders.length > 0 ? Math.round((orders.filter(o => o.status === 'done').length / orders.length) * 100) : 0}%
          </p>
          <p class="text-xs text-pink-200 mt-2">Rasio pesanan berstatus Selesai</p>
        </div>
      </div>
    </div>
  `;

  // Retain selected tab visual states
  await adminTab(adminActiveTab);
}

async function adminTab(tab) {
  adminActiveTab = tab;
  const tabs = ['dashboard', 'products', 'orders', 'customers', 'reports'];
  tabs.forEach(t => {
    const el = document.getElementById('admin-tab-' + t);
    if (el) el.classList.toggle('hidden', t !== tab);

    const btn = document.getElementById('tab-' + t);
    if (btn) {
      if (t === tab) {
        btn.classList.add('active', 'text-white');
        btn.classList.remove('text-slate-400');
      } else {
        btn.classList.remove('active', 'text-white');
        btn.classList.add('text-slate-400');
      }
    }
  });

  // Update header title
  const titles = {
    dashboard: 'Dashboard',
    products: 'Manajemen Produk',
    orders: 'Daftar Pesanan',
    customers: 'Daftar Customer',
    reports: 'Laporan Penjualan'
  };
  const titleEl = document.getElementById('admin-page-title');
  if (titleEl) titleEl.textContent = titles[tab] || 'Admin Panel';

  if (tab === 'reports') {
    setTimeout(initReportsChart, 100);
  }
  
  if (typeof lenis !== 'undefined') {
    lenis.resize();
  }
  initScrollReveal();
}

async function adminSubmitProduct(e, productId) {
  e.preventDefault();
  const name = document.getElementById('adm-name').value.trim();
  const price = parseInt(document.getElementById('adm-price').value);
  const category = document.getElementById('adm-category').value;
  const description = document.getElementById('adm-desc').value.trim();
  const image = document.getElementById('adm-image').value.trim();

  if (!name || !price || !category || !description || !image) {
    showToast('Semua field wajib diisi', 'error');
    return;
  }

  if (productId) {
    // Edit Mode
    if (USE_BACKEND) {
      const session = authGetSession();
      try {
        const response = await fetch(`${API_BASE_URL}/products/${productId}`, {
          method: 'PUT',
          headers: { 
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${session.token}`
          },
          body: JSON.stringify({ name, price, category, description, image })
        });
        const data = await response.json();
        if (!response.ok) throw new Error(data.error);

        showToast('Produk berhasil diperbarui', 'success');
        adminEditingProductId = null;
        await adminRender();
        await renderProductGrid(true);
      } catch (err) {
        showToast(err.message || 'Gagal memperbarui produk', 'error');
      }
    } else {
      const products = productGetAll();
      const idx = products.findIndex(p => p.id === productId);
      if (idx !== -1) {
        products[idx] = { id: productId, name, price, category, description, image };
        storageSet(KEYS.PRODUCTS, products);
        showToast('Produk berhasil diperbarui', 'success');
        adminEditingProductId = null;
        adminRender();
        renderProductGrid(true);
      }
    }
  } else {
    // Add Mode
    if (USE_BACKEND) {
      const session = authGetSession();
      try {
        const response = await fetch(`${API_BASE_URL}/products`, {
          method: 'POST',
          headers: { 
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${session.token}`
          },
          body: JSON.stringify({ name, price, category, description, image, stock: 15 }) // Default stock
        });
        const data = await response.json();
        if (!response.ok) throw new Error(data.error);

        showToast('Produk berhasil ditambahkan ke database', 'success');
        await adminRender();
        await renderProductGrid(true);
      } catch (err) {
        showToast(err.message || 'Gagal menambahkan produk', 'error');
      }
    } else {
      productAdd({
        id: 'prod_' + Date.now(),
        name,
        price,
        category,
        description,
        image
      });
      showToast('Produk berhasil ditambahkan', 'success');
      adminRender();
      renderProductGrid(true);
    }
  }
}

async function adminStartEditProduct(productId) {
  adminEditingProductId = productId;
  await adminRender();
  // Scroll to edit form
  document.getElementById('adm-name')?.scrollIntoView({ behavior: 'smooth' });
}

async function adminCancelEditProduct() {
  adminEditingProductId = null;
  await adminRender();
}

async function adminDeleteProduct(productId) {
  if (!confirm('Apakah Anda yakin ingin menghapus produk ini?')) return;
  
  if (USE_BACKEND) {
    const session = authGetSession();
    try {
      const response = await fetch(`${API_BASE_URL}/products/${productId}`, {
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${session.token}` }
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error);

      showToast('Produk berhasil dihapus dari database', 'info');
      await adminRender();
      await renderProductGrid(true);
    } catch (err) {
      showToast(err.message || 'Gagal menghapus produk', 'error');
    }
  } else {
    productDelete(productId);
    showToast('Produk berhasil dihapus', 'info');
    adminRender();
    renderProductGrid(true);
  }
}

async function adminSetOrderFilter(filter) {
  adminActiveOrderFilter = filter;
  await adminRender();
}

async function adminGoToOrder(orderId) {
  adminActiveOrderFilter = 'all';
  await adminTab('orders');
  setTimeout(() => {
    const card = document.getElementById('admin-order-card-' + orderId);
    if (card) {
      card.scrollIntoView({ behavior: 'smooth', block: 'center' });
      card.classList.add('ring-2', 'ring-indigo-500');
      setTimeout(() => card.classList.remove('ring-2', 'ring-indigo-500'), 2500);
    }
  }, 200);
}

async function adminUpdateOrderStatus(orderId, newStatus) {
  if (USE_BACKEND) {
    const session = authGetSession();
    try {
      const response = await fetch(`${API_BASE_URL}/orders/${orderId}/status`, {
        method: 'PUT',
        headers: { 
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${session.token}`
        },
        body: JSON.stringify({ status: newStatus })
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error);

      showToast(`Status pesanan ${orderId} diubah menjadi: ${statusLabel[newStatus]}`, 'success');
      await adminRender();
    } catch (err) {
      showToast(err.message || 'Gagal memperbarui status order', 'error');
    }
  } else {
    const orders = orderGetAll();
    const idx = orders.findIndex(o => o.transactionId === orderId);
    if (idx !== -1) {
      orders[idx].status = newStatus;
      storageSet(KEYS.ORDERS, orders);
      showToast(`Status pesanan ${orderId} diubah menjadi: ${statusLabel[newStatus]}`, 'success');
      adminRender();
    }
  }
}

async function initReportsChart() {
  if (typeof Chart === 'undefined') return;
  const canvas = document.getElementById('salesChart');
  if (!canvas) return;
  const ctx = canvas.getContext('2d');
  if (!ctx) return;

  if (window.mySalesChart) window.mySalesChart.destroy();

  let categorySales = { Pakaian: 0, Elektronik: 0, Sepatu: 0, Tas: 0 };

  if (USE_BACKEND) {
    const session = authGetSession();
    try {
      const response = await fetch(`${API_BASE_URL}/admin/reports/category-sales`, {
        headers: { 'Authorization': `Bearer ${session.token}` }
      });
      if (response.ok) {
        categorySales = await response.json();
      }
    } catch (err) {
      console.error('Gagal memuat grafik laporan', err);
    }
  } else {
    const orders = orderGetAll().filter(o => o.status !== 'refunded_cancelled' && o.status !== 'failed');
    orders.forEach(o => {
      o.items.forEach(item => {
        const cat = item.category || 'Pakaian';
        if (categorySales[cat] !== undefined) {
          categorySales[cat] += item.price * item.quantity;
        }
      });
    });
  }

  window.mySalesChart = new Chart(ctx, {
    type: 'bar',
    data: {
      labels: Object.keys(categorySales),
      datasets: [{
        label: 'Penjualan Bersih (Rp)',
        data: Object.values(categorySales),
        backgroundColor: [
          'rgba(236, 72, 153, 0.75)', // pink
          'rgba(59, 130, 246, 0.75)',  // blue
          'rgba(16, 185, 129, 0.75)',  // emerald
          'rgba(245, 158, 11, 0.75)'   // amber
        ],
        borderColor: [
          '#ec4899',
          '#3b82f6',
          '#10b981',
          '#f59e0b'
        ],
        borderWidth: 1.5,
        borderRadius: 8
      }]
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      plugins: {
        legend: { display: false }
      },
      scales: {
        y: {
          beginAtZero: true,
          ticks: {
            callback: function(value) {
              return 'Rp ' + value.toLocaleString('id-ID');
            }
          }
        }
      }
    }
  });
}

// =====================
// Auth Handlers
// =====================
async function handleLogin(e) {
  e.preventDefault();
  const email = document.getElementById('login-email').value.trim();
  const password = document.getElementById('login-password').value;
  const errEl = document.getElementById('login-error');

  if (USE_BACKEND) {
    try {
      const response = await fetch(`${API_BASE_URL}/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password })
      });
      const data = await response.json();
      
      if (!response.ok) {
        errEl.textContent = data.error || 'Email atau password salah';
        errEl.classList.remove('hidden');
        return;
      }

      errEl.classList.add('hidden');
      storageSet(KEYS.SESSION, data.session);
      updateNavbar();
      showToast(`Selamat datang, ${data.session.name}!`, 'success');
      
      if (data.session.role === 'admin') { 
        await navigate('admin'); 
      } else { 
        await navigate('home'); 
      }
    } catch (err) {
      errEl.textContent = 'Gagal menghubungi server backend';
      errEl.classList.remove('hidden');
    }
  } else {
    const result = authLogin(email, password);
    if (result.error) {
      errEl.textContent = result.error;
      errEl.classList.remove('hidden');
      return;
    }
    errEl.classList.add('hidden');
    updateNavbar();
    showToast(`Selamat datang, ${result.session.name}!`, 'success');
    if (result.session.role === 'admin') { navigate('admin'); }
    else { navigate('home'); }
  }
}

async function handleRegister(e) {
  e.preventDefault();
  const name = document.getElementById('reg-name').value.trim();
  const email = document.getElementById('reg-email').value.trim();
  const password = document.getElementById('reg-password').value;
  const errEl = document.getElementById('reg-error');

  if (USE_BACKEND) {
    try {
      const response = await fetch(`${API_BASE_URL}/auth/register`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name, email, password })
      });
      const data = await response.json();
      
      if (!response.ok) {
        errEl.textContent = data.error || 'Registrasi gagal';
        errEl.classList.remove('hidden');
        return;
      }

      errEl.classList.add('hidden');
      showToast(data.message || 'Registrasi berhasil! Silakan login.', 'success');
      await navigate('login');
    } catch (err) {
      errEl.textContent = 'Gagal menghubungi server backend';
      errEl.classList.remove('hidden');
    }
  } else {
    const result = authRegister(name, email, password);
    if (result.error) {
      errEl.textContent = result.error;
      errEl.classList.remove('hidden');
      return;
    }
    errEl.classList.add('hidden');
    showToast('Registrasi berhasil! Silakan login.', 'success');
    navigate('login');
  }
}

function handleLogout() {
  authLogout();
  updateNavbar();
  showToast('Berhasil keluar', 'info');
  navigate('landing');
}

// =====================
// Scroll Reveal & Animations
// =====================
function initScrollReveal() {
  const reveals = document.querySelectorAll('.reveal');
  if ('IntersectionObserver' in window) {
    const observer = new IntersectionObserver((entries) => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          entry.target.classList.add('active');
        } else {
          entry.target.classList.remove('active');
        }
      });
    }, {
      threshold: 0.05,
      rootMargin: '0px 0px -40px 0px'
    });
    reveals.forEach(el => observer.observe(el));
  } else {
    reveals.forEach(el => el.classList.add('active'));
  }
}

// =====================
// Init
// =====================
document.addEventListener('DOMContentLoaded', () => {
  initDefaultData();
  initDarkMode();
  updateNavbar();

  // Initialize Lenis
  if (typeof Lenis !== 'undefined') {
    window.lenis = new Lenis({
      duration: 1.2,
      easing: (t) => Math.min(1, 1.001 - Math.pow(2, -10 * t))
    });
    function raf(time) {
      window.lenis.raf(time);
      requestAnimationFrame(raf);
    }
    requestAnimationFrame(raf);
  }

  // Start at landing page
  navigate('landing');

  // Close modal on backdrop click
  document.getElementById('modal-product').addEventListener('click', function(e) {
    if (e.target === this) closeModal();
  });
});
