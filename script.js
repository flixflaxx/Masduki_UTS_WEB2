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
// Default Data
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

function navigate(page) {
  const mainApp = document.getElementById('main-app');
  const landing = document.getElementById('page-landing');
  const navbar = document.getElementById('navbar');

  if (page === 'landing') {
    landing.classList.remove('hidden');
    mainApp.classList.add('hidden');
    navbar.classList.add('hidden');
    window.scrollTo(0, 0);
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

  if (page === 'home') renderProductGrid();
  if (page === 'cart') cartRender();
  if (page === 'checkout') renderCheckoutPage();
  if (page === 'orders') {
    if (!authGetSession()) { navigate('login'); return; }
    orderRender();
  }
  if (page === 'admin') {
    if (!authIsAdmin()) { navigate('home'); showToast('Akses ditolak', 'error'); return; }
    adminRender();
  }

  // Close mobile menu on navigate
  document.getElementById('mobile-menu')?.classList.add('hidden');
  window.scrollTo(0, 0);
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
        <p class="text-indigo-600 dark:text-indigo-400 font-bold text-base sm:text-lg mb-3">${formatRupiah(p.price)}</p>
        <div class="mt-auto flex gap-2">
          <button onclick="productShowModal('${p.id}')" class="flex-1 border border-indigo-600 text-indigo-600 dark:text-indigo-400 hover:bg-indigo-50 dark:hover:bg-indigo-900 text-xs sm:text-sm py-1.5 rounded-lg transition">Detail</button>
          <button onclick="cartAdd('${p.id}', this)" class="flex-1 bg-indigo-600 hover:bg-indigo-700 text-white text-xs sm:text-sm py-1.5 rounded-lg transition">+ Keranjang</button>
        </div>
      </div>
    </div>
  `).join('');
}

function productShowModal(productId) {
  const product = productGetAll().find(p => p.id === productId);
  if (!product) return;
  document.getElementById('modal-content').innerHTML = `
    <img src="${product.image}" alt="${product.name}" class="w-full h-48 object-cover rounded-xl mb-4" />
    <span class="text-xs text-indigo-500 dark:text-indigo-400 font-medium bg-indigo-50 dark:bg-indigo-900/40 px-2 py-0.5 rounded-full">${product.category}</span>
    <h2 class="text-xl font-bold mt-2 mb-2 text-gray-800 dark:text-gray-100">${product.name}</h2>
    <p class="text-2xl font-bold text-indigo-600 dark:text-indigo-400 mb-3">${formatRupiah(product.price)}</p>
    <p class="text-gray-600 dark:text-gray-300 text-sm mb-5">${product.description}</p>
    <button onclick="cartAdd('${product.id}', this); closeModal();" class="w-full bg-indigo-600 hover:bg-indigo-700 text-white font-semibold py-2.5 rounded-lg transition">Tambah ke Keranjang</button>
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

function renderProductGrid(skipSkeleton = false) {
  const query = document.getElementById('search-input')?.value || document.getElementById('search-input-mobile')?.value || '';
  const category = document.getElementById('filter-category')?.value || document.getElementById('filter-category-mobile')?.value || '';
  const priceRange = document.getElementById('filter-price')?.value || document.getElementById('filter-price-mobile')?.value || '';
  let minPrice = 0, maxPrice = Infinity;
  if (priceRange) { [minPrice, maxPrice] = priceRange.split('-').map(Number); }
  const filtered = productFilter(query, category, minPrice, maxPrice);

  if (skipSkeleton) {
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

  setTimeout(() => productRenderGrid(filtered), 700);
}

function handleSearch() {
  if (document.getElementById('page-home').classList.contains('hidden')) navigate('home');
  else renderProductGrid(true); // skip skeleton on search/filter
}

function handleSearchMobile() {
  const mq = document.getElementById('search-input-mobile')?.value || '';
  const mc = document.getElementById('filter-category-mobile')?.value || '';
  const mp = document.getElementById('filter-price-mobile')?.value || '';
  if (document.getElementById('search-input')) document.getElementById('search-input').value = mq;
  if (document.getElementById('filter-category')) document.getElementById('filter-category').value = mc;
  if (document.getElementById('filter-price')) document.getElementById('filter-price').value = mp;
  handleSearch();
}

function filterByCategory(category) {
  const catEl = document.getElementById('filter-category');
  const catMEl = document.getElementById('filter-category-mobile');
  if (catEl) catEl.value = category;
  if (catMEl) catMEl.value = category;
  navigate('home'); // will trigger skeleton via navigate → renderProductGrid()
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

function cartAdd(productId, originEl = null) {
  const product = productGetAll().find(p => p.id === productId);
  if (!product) return;
  const cart = cartGet();
  const existing = cart.find(i => i.productId === productId);
  if (existing) { existing.quantity += 1; }
  else { cart.push({ productId: product.id, name: product.name, price: product.price, quantity: 1, image: product.image }); }
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
    total: cartGetTotal()
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
  if (!authGetSession()) { navigate('login'); return; }
  if (cartGet().length === 0) { navigate('cart'); return; }
  const cart = cartGet();
  document.getElementById('checkout-summary').innerHTML = `
    <div class="divide-y divide-gray-100 dark:divide-gray-700">
      ${cart.map(i => `
        <div class="flex justify-between py-2 text-sm">
          <span class="text-gray-700 dark:text-gray-300">${i.name} <span class="text-gray-400">x${i.quantity}</span></span>
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

function handleCheckout(e) {
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
  const result = checkoutProcess(name, address, phone);
  if (result.error) { showToast(result.error, 'error'); return; }
  showToast('Pesanan berhasil dikonfirmasi! 🎉', 'success');
  navigate('orders');
}

// =====================
// Order Module
// =====================
function orderGetAll() {
  return storageGet(KEYS.ORDERS) || [];
}

function orderRender() {
  const orders = orderGetAll();
  const el = document.getElementById('orders-content');
  if (orders.length === 0) {
    el.innerHTML = `<div class="text-center py-16 text-gray-400 dark:text-gray-500">
      <div class="text-5xl mb-3">📦</div>
      <p class="text-lg font-medium">Belum ada pesanan</p>
      <button onclick="navigate('home')" class="mt-4 bg-indigo-600 hover:bg-indigo-700 text-white px-6 py-2 rounded-lg transition">Mulai Belanja</button>
    </div>`;
    return;
  }
  el.innerHTML = orders.map(o => `
    <div class="bg-white dark:bg-gray-800 rounded-2xl shadow p-4 sm:p-5 mb-4">
      <div class="flex flex-wrap justify-between items-start gap-2 mb-3">
        <div class="min-w-0">
          <p class="font-bold text-indigo-600 dark:text-indigo-400 text-xs sm:text-sm font-mono truncate">${o.transactionId}</p>
          <p class="text-xs text-gray-400 mt-0.5">${new Date(o.date).toLocaleString('id-ID')}</p>
        </div>
        <span class="bg-green-100 dark:bg-green-900 text-green-700 dark:text-green-300 text-xs font-semibold px-2 sm:px-3 py-1 rounded-full shrink-0">Selesai</span>
      </div>
      <div class="text-xs sm:text-sm text-gray-600 dark:text-gray-300 mb-3">
        <p class="truncate">📍 ${o.customer.name} — ${o.customer.address}</p>
        <p>📞 ${o.customer.phone}</p>
      </div>
      <div class="divide-y divide-gray-100 dark:divide-gray-700">
        ${o.items.map(i => `
          <div class="flex justify-between py-1.5 text-xs sm:text-sm gap-2">
            <span class="truncate">${i.name} <span class="text-gray-400">x${i.quantity}</span></span>
            <span class="shrink-0">${formatRupiah(i.price * i.quantity)}</span>
          </div>
        `).join('')}
      </div>
      <div class="flex justify-between mt-3 pt-3 border-t border-gray-100 dark:border-gray-700 font-bold text-sm sm:text-base">
        <span>Total</span>
        <span class="text-indigo-600 dark:text-indigo-400">${formatRupiah(o.total)}</span>
      </div>
    </div>
  `).join('') + `<button onclick="navigate('home')" class="w-full bg-green-600 hover:bg-green-700 text-white font-semibold py-3 rounded-xl transition text-sm sm:text-base mt-2">← Kembali ke Toko</button>`;
}

// =====================
// Admin Module
// =====================
function adminRender() {
  const el = document.getElementById('admin-content');
  const products = productGetAll();
  const users = (storageGet(KEYS.USERS) || []).filter(u => u.role !== 'admin');
  const orders = orderGetAll();
  const totalRevenue = orders.reduce((s, o) => s + o.total, 0);

  const catColors = {
    'Pakaian':    { bg: 'bg-pink-100 dark:bg-pink-900/40',    text: 'text-pink-700 dark:text-pink-300',    dot: 'bg-pink-500' },
    'Elektronik': { bg: 'bg-blue-100 dark:bg-blue-900/40',    text: 'text-blue-700 dark:text-blue-300',    dot: 'bg-blue-500' },
    'Sepatu':     { bg: 'bg-green-100 dark:bg-green-900/40',  text: 'text-green-700 dark:text-green-300',  dot: 'bg-green-500' },
    'Tas':        { bg: 'bg-yellow-100 dark:bg-yellow-900/40',text: 'text-yellow-700 dark:text-yellow-300',dot: 'bg-yellow-500' },
  };
  const getCat = c => catColors[c] || { bg: 'bg-gray-100 dark:bg-gray-700', text: 'text-gray-600 dark:text-gray-300', dot: 'bg-gray-400' };

  const avatarColors = ['bg-indigo-500','bg-pink-500','bg-green-500','bg-yellow-500','bg-purple-500','bg-red-500','bg-teal-500'];
  const getAvatar = (name, i) => `<div class="w-9 h-9 rounded-full ${avatarColors[i % avatarColors.length]} flex items-center justify-center text-white font-bold text-sm shrink-0">${name.charAt(0).toUpperCase()}</div>`;

  el.innerHTML = `
    <!-- Admin Header Banner -->
    <div class="rounded-2xl bg-gradient-to-r from-indigo-600 via-purple-600 to-pink-600 p-6 mb-6 text-white">
      <div class="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 class="text-2xl font-extrabold mb-1">⚙️ Admin Panel</h2>
          <p class="text-white/70 text-sm">Selamat datang kembali! Berikut ringkasan toko Anda hari ini.</p>
        </div>
      </div>
    </div>

    <!-- Stats Cards -->
    <div class="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4 mb-5 sm:mb-6">
      <div class="bg-white dark:bg-gray-800 rounded-2xl shadow-sm border border-gray-100 dark:border-gray-700 p-3 sm:p-5 flex items-center gap-3 sm:gap-4">
        <div class="w-9 h-9 sm:w-12 sm:h-12 rounded-xl bg-indigo-100 dark:bg-indigo-900/40 flex items-center justify-center text-xl sm:text-2xl shrink-0">📦</div>
        <div>
          <p class="text-xs text-gray-500 dark:text-gray-400 font-medium">Total Produk</p>
          <p class="text-xl sm:text-2xl font-extrabold text-indigo-600 dark:text-indigo-400">${products.length}</p>
        </div>
      </div>
      <div class="bg-white dark:bg-gray-800 rounded-2xl shadow-sm border border-gray-100 dark:border-gray-700 p-3 sm:p-5 flex items-center gap-3 sm:gap-4">
        <div class="w-9 h-9 sm:w-12 sm:h-12 rounded-xl bg-green-100 dark:bg-green-900/40 flex items-center justify-center text-xl sm:text-2xl shrink-0">👥</div>
        <div>
          <p class="text-xs text-gray-500 dark:text-gray-400 font-medium">Customer</p>
          <p class="text-xl sm:text-2xl font-extrabold text-green-600 dark:text-green-400">${users.length}</p>
        </div>
      </div>
      <div class="bg-white dark:bg-gray-800 rounded-2xl shadow-sm border border-gray-100 dark:border-gray-700 p-3 sm:p-5 flex items-center gap-3 sm:gap-4">
        <div class="w-9 h-9 sm:w-12 sm:h-12 rounded-xl bg-yellow-100 dark:bg-yellow-900/40 flex items-center justify-center text-xl sm:text-2xl shrink-0">🧾</div>
        <div>
          <p class="text-xs text-gray-500 dark:text-gray-400 font-medium">Pesanan</p>
          <p class="text-xl sm:text-2xl font-extrabold text-yellow-600 dark:text-yellow-400">${orders.length}</p>
        </div>
      </div>
      <div class="bg-white dark:bg-gray-800 rounded-2xl shadow-sm border border-gray-100 dark:border-gray-700 p-3 sm:p-5 flex items-center gap-3 sm:gap-4">
        <div class="w-9 h-9 sm:w-12 sm:h-12 rounded-xl bg-pink-100 dark:bg-pink-900/40 flex items-center justify-center text-xl sm:text-2xl shrink-0">💰</div>
        <div>
          <p class="text-xs text-gray-500 dark:text-gray-400 font-medium">Pendapatan</p>
          <p class="text-sm sm:text-base font-extrabold text-pink-600 dark:text-pink-400">${formatRupiah(totalRevenue)}</p>
        </div>
      </div>
    </div>

    <!-- Tab Navigation -->
    <div class="flex gap-1 sm:gap-2 mb-5 sm:mb-6 bg-gray-100 dark:bg-gray-800 p-1 sm:p-1.5 rounded-2xl w-full sm:w-fit overflow-x-auto">
      <button onclick="adminTab('products')" id="tab-products"
        class="flex-1 sm:flex-none px-3 sm:px-5 py-2 text-xs sm:text-sm font-semibold rounded-xl bg-white dark:bg-gray-700 text-indigo-600 dark:text-indigo-400 shadow-sm transition whitespace-nowrap">
        📦 Produk
      </button>
      <button onclick="adminTab('customers')" id="tab-customers"
        class="flex-1 sm:flex-none px-3 sm:px-5 py-2 text-xs sm:text-sm font-semibold rounded-xl text-gray-500 dark:text-gray-400 hover:bg-white/60 dark:hover:bg-gray-700/60 transition whitespace-nowrap">
        👥 Customer
      </button>
      <button onclick="adminTab('orders')" id="tab-orders"
        class="flex-1 sm:flex-none px-3 sm:px-5 py-2 text-xs sm:text-sm font-semibold rounded-xl text-gray-500 dark:text-gray-400 hover:bg-white/60 dark:hover:bg-gray-700/60 transition whitespace-nowrap">
        🧾 Pesanan
      </button>
    </div>

    <!-- ===== TAB: PRODUCTS ===== -->
    <div id="admin-tab-products">
      <div class="grid lg:grid-cols-5 gap-4 sm:gap-6">

        <!-- Add Product Form (2 cols) -->
        <div class="lg:col-span-2 bg-white dark:bg-gray-800 rounded-2xl shadow-sm border border-gray-100 dark:border-gray-700 overflow-hidden">
          <div class="bg-gradient-to-r from-indigo-500 to-purple-600 px-4 sm:px-6 py-3 sm:py-4">
            <h3 class="text-white font-bold text-sm sm:text-base">✨ Tambah Produk Baru</h3>
            <p class="text-white/70 text-xs mt-0.5">Isi semua field untuk menambah produk</p>
          </div>
          <form onsubmit="adminAddProduct(event)" class="p-4 sm:p-6 space-y-3 sm:space-y-4">
            <div>
              <label class="block text-xs font-semibold mb-1.5 text-gray-600 dark:text-gray-400 uppercase tracking-wide">Nama Produk</label>
              <input id="adm-name" type="text" placeholder="Contoh: Kemeja Batik Pria"
                class="w-full border border-gray-200 dark:border-gray-600 rounded-xl px-3 py-2 sm:py-2.5 bg-gray-50 dark:bg-gray-700/50 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-400 text-sm transition" />
              <p id="adm-name-err" class="text-red-500 text-xs mt-1 hidden">⚠ Wajib diisi</p>
            </div>
            <div class="grid grid-cols-2 gap-2 sm:gap-3">
              <div>
                <label class="block text-xs font-semibold mb-1.5 text-gray-600 dark:text-gray-400 uppercase tracking-wide">Harga (Rp)</label>
                <input id="adm-price" type="number" min="0" placeholder="150000"
                  class="w-full border border-gray-200 dark:border-gray-600 rounded-xl px-3 py-2 sm:py-2.5 bg-gray-50 dark:bg-gray-700/50 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-400 text-sm transition" />
                <p id="adm-price-err" class="text-red-500 text-xs mt-1 hidden">⚠ Wajib diisi</p>
              </div>
              <div>
                <label class="block text-xs font-semibold mb-1.5 text-gray-600 dark:text-gray-400 uppercase tracking-wide">Kategori</label>
                <select id="adm-category"
                  class="w-full border border-gray-200 dark:border-gray-600 rounded-xl px-3 py-2 sm:py-2.5 bg-gray-50 dark:bg-gray-700/50 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-400 text-sm transition">
                  <option value="">Pilih...</option>
                  <option>Pakaian</option><option>Elektronik</option><option>Sepatu</option><option>Tas</option>
                </select>
                <p id="adm-category-err" class="text-red-500 text-xs mt-1 hidden">⚠ Wajib dipilih</p>
              </div>
            </div>
            <div>
              <label class="block text-xs font-semibold mb-1.5 text-gray-600 dark:text-gray-400 uppercase tracking-wide">Deskripsi</label>
              <textarea id="adm-desc" rows="2" placeholder="Deskripsi singkat produk..."
                class="w-full border border-gray-200 dark:border-gray-600 rounded-xl px-3 py-2 sm:py-2.5 bg-gray-50 dark:bg-gray-700/50 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-400 text-sm transition resize-none"></textarea>
              <p id="adm-desc-err" class="text-red-500 text-xs mt-1 hidden">⚠ Wajib diisi</p>
            </div>
            <div>
              <label class="block text-xs font-semibold mb-1.5 text-gray-600 dark:text-gray-400 uppercase tracking-wide">Path / URL Gambar</label>
              <input id="adm-image" type="text" placeholder="images/products/nama_file.jpg"
                class="w-full border border-gray-200 dark:border-gray-600 rounded-xl px-3 py-2 sm:py-2.5 bg-gray-50 dark:bg-gray-700/50 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-400 text-sm transition" />
              <p class="text-xs text-gray-400 mt-1">Upload ke folder <code class="bg-gray-100 dark:bg-gray-700 px-1 rounded">images/products/</code></p>
              <p id="adm-image-err" class="text-red-500 text-xs mt-1 hidden">⚠ Wajib diisi</p>
            </div>
            <button type="submit" class="w-full bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 text-white font-bold py-2.5 rounded-xl transition shadow-md shadow-indigo-200 dark:shadow-none text-sm">
              + Simpan Produk
            </button>
          </form>
        </div>

        <!-- Product Cards Grid (3 cols) -->
        <div class="lg:col-span-3">
          <div class="flex items-center justify-between mb-3 sm:mb-4">
            <h3 class="font-bold text-gray-700 dark:text-gray-200 text-sm sm:text-base">Daftar Produk <span class="text-gray-400 font-normal">(${products.length})</span></h3>
          </div>
          <div class="grid grid-cols-2 sm:grid-cols-2 xl:grid-cols-3 gap-3 sm:gap-4 max-h-[600px] sm:max-h-[680px] overflow-y-auto pr-1">
            ${products.map(p => {
              const cat = getCat(p.category);
              return `
              <div class="bg-white dark:bg-gray-800 rounded-2xl border border-gray-100 dark:border-gray-700 overflow-hidden shadow-sm hover:shadow-md transition group">
                <div class="relative h-24 sm:h-32 bg-gray-100 dark:bg-gray-700 overflow-hidden">
                  <img src="${p.image}" alt="${p.name}" class="w-full h-full object-cover group-hover:scale-105 transition duration-300"
                    onerror="this.src='https://placehold.co/400x300/e2e8f0/94a3b8?text=No+Image'" />
                  <span class="absolute top-1.5 left-1.5 ${cat.bg} ${cat.text} text-xs font-semibold px-1.5 py-0.5 rounded-full">${p.category}</span>
                </div>
                <div class="p-2 sm:p-3">
                  <p class="font-semibold text-xs sm:text-sm text-gray-800 dark:text-gray-100 truncate mb-1">${p.name}</p>
                  <p class="text-indigo-600 dark:text-indigo-400 font-bold text-xs sm:text-sm mb-2">${formatRupiah(p.price)}</p>
                  <button onclick="adminDeleteProduct('${p.id}')"
                    class="w-full text-xs text-red-500 hover:text-white hover:bg-red-500 border border-red-200 dark:border-red-800 py-1 sm:py-1.5 rounded-lg transition font-medium">
                    🗑 Hapus
                  </button>
                </div>
              </div>`;
            }).join('')}
          </div>
        </div>
      </div>
    </div>

    <!-- ===== TAB: CUSTOMERS ===== -->
    <div id="admin-tab-customers" class="hidden">
      <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4">
        ${users.length === 0
          ? `<div class="col-span-full text-center py-16 text-gray-400"><div class="text-5xl mb-3">👥</div><p>Belum ada customer terdaftar</p></div>`
          : users.map((u, i) => {
              const userOrders = orders.filter(o => o.customer && o.customer.name === u.name);
              const totalSpent = userOrders.reduce((s, o) => s + o.total, 0);
              return `
              <div class="bg-white dark:bg-gray-800 rounded-2xl border border-gray-100 dark:border-gray-700 shadow-sm p-4 sm:p-5 hover:shadow-md transition">
                <div class="flex items-center gap-3 mb-3 sm:mb-4">
                  ${getAvatar(u.name, i)}
                  <div class="min-w-0">
                    <p class="font-bold text-gray-800 dark:text-gray-100 truncate text-sm sm:text-base">${u.name}</p>
                    <p class="text-xs text-gray-400 truncate">${u.email}</p>
                  </div>
                </div>
                <div class="grid grid-cols-2 gap-2 sm:gap-3">
                  <div class="bg-indigo-50 dark:bg-indigo-900/30 rounded-xl p-2 sm:p-3 text-center">
                    <p class="text-lg sm:text-xl font-extrabold text-indigo-600 dark:text-indigo-400">${userOrders.length}</p>
                    <p class="text-xs text-gray-500 dark:text-gray-400 mt-0.5">Pesanan</p>
                  </div>
                  <div class="bg-green-50 dark:bg-green-900/30 rounded-xl p-2 sm:p-3 text-center">
                    <p class="text-xs sm:text-sm font-extrabold text-green-600 dark:text-green-400 leading-tight">${totalSpent > 0 ? formatRupiah(totalSpent) : 'Rp 0'}</p>
                    <p class="text-xs text-gray-500 dark:text-gray-400 mt-0.5">Total Belanja</p>
                  </div>
                </div>
                <div class="mt-3 flex items-center gap-2">
                  <span class="w-2 h-2 rounded-full bg-green-400 shrink-0"></span>
                  <span class="text-xs text-gray-400">Aktif</span>
                  <span class="ml-auto text-xs bg-gray-100 dark:bg-gray-700 text-gray-500 dark:text-gray-400 px-2 py-0.5 rounded-full">${u.role}</span>
                </div>
              </div>`;
            }).join('')
        }
      </div>
    </div>

    <!-- ===== TAB: ORDERS ===== -->
    <div id="admin-tab-orders" class="hidden">
      ${orders.length === 0
        ? `<div class="text-center py-16 text-gray-400 dark:text-gray-500"><div class="text-5xl mb-3">🧾</div><p class="text-lg font-medium">Belum ada pesanan masuk</p></div>`
        : `<div class="flex flex-col gap-3 sm:gap-4">
            ${orders.map((o, i) => {
              return `
              <div class="bg-white dark:bg-gray-800 rounded-2xl border border-gray-100 dark:border-gray-700 shadow-sm overflow-hidden hover:shadow-md transition">
                <div class="flex flex-wrap items-center justify-between gap-2 sm:gap-3 px-4 sm:px-5 py-3 sm:py-4 border-b border-gray-50 dark:border-gray-700 bg-gray-50/50 dark:bg-gray-700/30">
                  <div class="flex items-center gap-2 sm:gap-3 min-w-0">
                    <div class="w-8 h-8 sm:w-9 sm:h-9 rounded-xl bg-indigo-100 dark:bg-indigo-900/40 flex items-center justify-center text-base sm:text-lg shrink-0">🧾</div>
                    <div class="min-w-0">
                      <p class="font-bold text-indigo-600 dark:text-indigo-400 text-xs font-mono truncate">${o.transactionId}</p>
                      <p class="text-xs text-gray-400">${new Date(o.date).toLocaleString('id-ID')}</p>
                    </div>
                  </div>
                  <div class="flex items-center gap-2 sm:gap-3 shrink-0">
                    <span class="bg-green-100 dark:bg-green-900/40 text-green-700 dark:text-green-400 text-xs font-bold px-2 sm:px-3 py-1 rounded-full">✓ Selesai</span>
                    <span class="text-sm sm:text-base font-extrabold text-gray-800 dark:text-gray-100">${formatRupiah(o.total)}</span>
                  </div>
                </div>
                <div class="px-4 sm:px-5 py-3 sm:py-4 flex flex-col sm:flex-row gap-3 sm:gap-4">
                  <div class="sm:w-44 shrink-0">
                    <p class="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-2">Penerima</p>
                    <div class="flex items-center gap-2 mb-1">
                      ${getAvatar(o.customer.name, i)}
                      <p class="font-semibold text-sm text-gray-800 dark:text-gray-100 truncate">${o.customer.name}</p>
                    </div>
                    <p class="text-xs text-gray-400 mt-1 truncate">📍 ${o.customer.address}</p>
                    <p class="text-xs text-gray-400 mt-0.5">📞 ${o.customer.phone}</p>
                  </div>
                  <div class="flex-1 min-w-0">
                    <p class="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-2">Item Pesanan</p>
                    <div class="flex flex-col gap-1">
                      ${o.items.map(item => `
                        <div class="flex justify-between items-center text-xs sm:text-sm bg-gray-50 dark:bg-gray-700/40 rounded-lg px-2 sm:px-3 py-1.5 gap-2">
                          <span class="text-gray-700 dark:text-gray-300 truncate">${item.name}</span>
                          <span class="shrink-0 text-gray-400">x${item.quantity} · <span class="font-semibold text-gray-700 dark:text-gray-200">${formatRupiah(item.price * item.quantity)}</span></span>
                        </div>
                      `).join('')}
                    </div>
                  </div>
                </div>
              </div>`;
            }).join('')}
          </div>`
      }
    </div>
  `;
}


function adminTab(tab) {
  ['products', 'customers', 'orders'].forEach(t => {
    document.getElementById('admin-tab-' + t)?.classList.toggle('hidden', t !== tab);
    const btn = document.getElementById('tab-' + t);
    if (btn) {
      if (t === tab) {
        btn.className = 'px-5 py-2 text-sm font-semibold rounded-xl bg-white dark:bg-gray-700 text-indigo-600 dark:text-indigo-400 shadow-sm transition';
      } else {
        btn.className = 'px-5 py-2 text-sm font-semibold rounded-xl text-gray-500 dark:text-gray-400 hover:bg-white/60 dark:hover:bg-gray-700/60 transition';
      }
    }
  });
}

function adminAddProduct(e) {
  e.preventDefault();
  const fields = ['adm-name', 'adm-price', 'adm-category', 'adm-desc', 'adm-image'];
  let valid = true;
  fields.forEach(id => {
    const val = document.getElementById(id).value.trim();
    const err = document.getElementById(id + '-err');
    if (!val) { err.classList.remove('hidden'); valid = false; }
    else err.classList.add('hidden');
  });
  if (!valid) return;
  productAdd({
    id: 'prod_' + Date.now(),
    name: document.getElementById('adm-name').value.trim(),
    price: parseInt(document.getElementById('adm-price').value),
    category: document.getElementById('adm-category').value,
    description: document.getElementById('adm-desc').value.trim(),
    image: document.getElementById('adm-image').value.trim()
  });
  showToast('Produk berhasil ditambahkan', 'success');
  adminRender();
}

function adminDeleteProduct(productId) {
  if (!confirm('Hapus produk ini?')) return;
  productDelete(productId);
  showToast('Produk dihapus', 'info');
  adminRender();
}

// =====================
// Auth Handlers
// =====================
function handleLogin(e) {
  e.preventDefault();
  const email = document.getElementById('login-email').value.trim();
  const password = document.getElementById('login-password').value;
  const result = authLogin(email, password);
  const errEl = document.getElementById('login-error');
  if (result.error) {
    errEl.textContent = result.error;
    errEl.classList.remove('hidden');
    return;
  }
  errEl.classList.add('hidden');
  updateNavbar();
  showToast(`Selamat datang, ${result.session.name}!`, 'success');
  // Admin goes directly to admin panel
  if (result.session.role === 'admin') { navigate('admin'); }
  else { navigate('home'); }
}

function handleRegister(e) {
  e.preventDefault();
  const name = document.getElementById('reg-name').value.trim();
  const email = document.getElementById('reg-email').value.trim();
  const password = document.getElementById('reg-password').value;
  const result = authRegister(name, email, password);
  const errEl = document.getElementById('reg-error');
  if (result.error) {
    errEl.textContent = result.error;
    errEl.classList.remove('hidden');
    return;
  }
  errEl.classList.add('hidden');
  showToast('Registrasi berhasil! Silakan login.', 'success');
  navigate('login');
}

function handleLogout() {
  authLogout();
  updateNavbar();
  showToast('Berhasil keluar', 'info');
  navigate('landing');
}

// =====================
// Init
// =====================
document.addEventListener('DOMContentLoaded', () => {
  initDefaultData();
  initDarkMode();
  updateNavbar();

  // Start at landing page
  navigate('landing');

  // Close modal on backdrop click
  document.getElementById('modal-product').addEventListener('click', function(e) {
    if (e.target === this) closeModal();
  });
});
