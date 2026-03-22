/**
 * ═══════════════════════════════════════════════════════════
 * Inventory Pro — Dashboard Frontend Logic
 * Professional SaaS-grade inventory management
 * ═══════════════════════════════════════════════════════════
 */

// ─── Constants ─────────────────────────────────────────────
const API = '/products';

// ─── DOM References ────────────────────────────────────────
const productsTbody = document.getElementById('products-tbody');
const emptyState = document.getElementById('empty-state');
const addProductBtn = document.getElementById('add-product-btn');
const modalOverlay = document.getElementById('modal-overlay');
const modalClose = document.getElementById('modal-close');
const modalCancel = document.getElementById('modal-cancel');
const addForm = document.getElementById('add-form');
const searchInput = document.getElementById('search-input');
const filterCategory = document.getElementById('filter-category');
const filterStatus = document.getElementById('filter-status');
const themeToggle = document.getElementById('theme-toggle');
const menuToggle = document.getElementById('menu-toggle');
const sidebar = document.getElementById('sidebar');
const toastContainer = document.getElementById('toast-container');
const exportBtn = document.getElementById('export-btn');

// ─── Stats Elements ───────────────────────────────────────
const statTotal = document.getElementById('stat-total');
const statValue = document.getElementById('stat-value');
const statLow = document.getElementById('stat-low');
const statCategories = document.getElementById('stat-categories');

// ─── State ─────────────────────────────────────────────────
let products = [];
let searchQuery = '';
let categoryFilter = '';
let statusFilter = '';

// ═══════════════════════════════════════════════════════════
// API OPERATIONS
// ═══════════════════════════════════════════════════════════

/** Fetch all products from backend */
async function fetchProducts() {
  try {
    const res = await fetch(API);
    if (!res.ok) throw new Error('Failed to fetch');
    products = await res.json();
    updateEverything();
  } catch (err) {
    showToast('Failed to load products', 'error');
    console.error(err);
  }
}

/** Add a new product */
async function addProduct(data) {
  try {
    const res = await fetch(API, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    });
    if (!res.ok) {
      const err = await res.json();
      throw new Error(err.error || 'Failed to add');
    }
    const product = await res.json();
    products.push(product);
    updateEverything();
    showToast(`"${product.name}" added successfully`, 'success');
  } catch (err) {
    showToast(err.message, 'error');
  }
}

/** Delete a product with animation */
async function deleteProduct(id, row) {
  try {
    row.classList.add('row--removing');
    await delay(300);
    const res = await fetch(`${API}/${id}`, { method: 'DELETE' });
    if (!res.ok) throw new Error('Failed to delete');
    const name = products.find(p => p.id === id)?.name;
    products = products.filter(p => p.id !== id);
    updateEverything();
    showToast(`"${name}" removed`, 'success');
  } catch (err) {
    row.classList.remove('row--removing');
    showToast('Delete failed', 'error');
  }
}

// ═══════════════════════════════════════════════════════════
// RENDERING
// ═══════════════════════════════════════════════════════════

/** Master update function */
function updateEverything() {
  renderTable();
  updateStats();
  updateCategoryFilter();
}

/** Render the product table rows */
function renderTable() {
  const filtered = getFilteredProducts();

  if (filtered.length === 0) {
    productsTbody.innerHTML = '';
    emptyState.style.display = 'block';
    document.querySelector('.table-responsive').style.display = 'none';
    return;
  }

  emptyState.style.display = 'none';
  document.querySelector('.table-responsive').style.display = 'block';

  productsTbody.innerHTML = filtered.map((p, i) => {
    const status = getStatus(p.quantity);
    const initials = getInitials(p.name);
    return `
      <tr style="animation-delay: ${i * 0.04}s" data-id="${p.id}">
        <td class="data-table__td">
          <div class="product-info">
            <div class="product-info__icon">${initials}</div>
            <span class="product-info__name">${esc(p.name)}</span>
          </div>
        </td>
        <td class="data-table__td">
          <span class="category-badge">${esc(p.category)}</span>
        </td>
        <td class="data-table__td data-table__td--right">
          <span class="price-text">$${p.price.toFixed(2)}</span>
        </td>
        <td class="data-table__td data-table__td--right">
          <span class="qty-text">${p.quantity.toLocaleString()}</span>
        </td>
        <td class="data-table__td">
          <span class="status-badge status-badge--${status.class}">
            <span class="status-badge__dot"></span>
            ${status.label}
          </span>
        </td>
        <td class="data-table__td data-table__td--right">
          <button class="btn--danger-sm" onclick="handleDelete('${p.id}', this)" title="Delete product">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="3 6 5 6 21 6"/><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/></svg>
          </button>
        </td>
      </tr>
    `;
  }).join('');
}

/** Update stats cards */
function updateStats() {
  const total = products.length;
  const value = products.reduce((s, p) => s + p.price * p.quantity, 0);
  const low = products.filter(p => p.quantity > 0 && p.quantity <= 10).length;
  const cats = new Set(products.map(p => p.category)).size;

  animateStat(statTotal, total);
  animateStat(statValue, '$' + value.toLocaleString('en-US', { maximumFractionDigits: 0 }));
  animateStat(statLow, low);
  animateStat(statCategories, cats);
}

/** Populate the category filter dropdown */
function updateCategoryFilter() {
  const cats = [...new Set(products.map(p => p.category))].sort();
  const current = filterCategory.value;
  filterCategory.innerHTML = '<option value="">All Categories</option>' +
    cats.map(c => `<option value="${c}" ${c === current ? 'selected' : ''}>${esc(c)}</option>`).join('');
}

// ═══════════════════════════════════════════════════════════
// FILTERING
// ═══════════════════════════════════════════════════════════

function getFilteredProducts() {
  return products.filter(p => {
    const matchSearch = !searchQuery ||
      p.name.toLowerCase().includes(searchQuery) ||
      p.category.toLowerCase().includes(searchQuery);
    const matchCat = !categoryFilter || p.category === categoryFilter;
    const matchStatus = !statusFilter || getStatus(p.quantity).class === statusFilter;
    return matchSearch && matchCat && matchStatus;
  });
}

function getStatus(qty) {
  if (qty === 0) return { class: 'out-of-stock', label: 'Out of Stock' };
  if (qty <= 10) return { class: 'low-stock', label: 'Low Stock' };
  return { class: 'in-stock', label: 'In Stock' };
}

// ═══════════════════════════════════════════════════════════
// EVENT HANDLERS
// ═══════════════════════════════════════════════════════════

// ── Modal Controls ──
addProductBtn.addEventListener('click', () => openModal());
modalClose.addEventListener('click', () => closeModal());
modalCancel.addEventListener('click', () => closeModal());
modalOverlay.addEventListener('click', (e) => {
  if (e.target === modalOverlay) closeModal();
});

document.addEventListener('keydown', (e) => {
  if (e.key === 'Escape') closeModal();
});

function openModal() {
  modalOverlay.classList.add('modal-overlay--visible');
  document.getElementById('product-name').focus();
}

function closeModal() {
  modalOverlay.classList.remove('modal-overlay--visible');
  addForm.reset();
}

// ── Form Submit ──
addForm.addEventListener('submit', (e) => {
  e.preventDefault();
  const name = document.getElementById('product-name').value.trim();
  if (!name) return showToast('Product name is required', 'error');

  addProduct({
    name,
    category: document.getElementById('product-category').value.trim() || 'Uncategorized',
    price: parseFloat(document.getElementById('product-price').value) || 0,
    quantity: parseInt(document.getElementById('product-quantity').value) || 0,
  });
  closeModal();
});

// ── Delete Handler ──
function handleDelete(id, btn) {
  const row = btn.closest('tr');
  deleteProduct(id, row);
}

// ── Search ──
searchInput.addEventListener('input', (e) => {
  searchQuery = e.target.value.toLowerCase().trim();
  renderTable();
});

// ── Filters ──
filterCategory.addEventListener('change', (e) => {
  categoryFilter = e.target.value;
  renderTable();
});

filterStatus.addEventListener('change', (e) => {
  statusFilter = e.target.value;
  renderTable();
});

// ── Theme Toggle ──
themeToggle.addEventListener('click', () => {
  const current = document.documentElement.getAttribute('data-theme');
  const next = current === 'light' ? 'dark' : 'light';
  document.documentElement.setAttribute('data-theme', next);
  localStorage.setItem('theme', next);
});

// Apply saved theme
(function initTheme() {
  const saved = localStorage.getItem('theme');
  if (saved) document.documentElement.setAttribute('data-theme', saved);
})();

// ── Mobile Menu ──
menuToggle.addEventListener('click', () => {
  sidebar.classList.toggle('sidebar--open');
  toggleOverlay();
});

function toggleOverlay() {
  let overlay = document.querySelector('.sidebar-overlay');
  if (!overlay) {
    overlay = document.createElement('div');
    overlay.className = 'sidebar-overlay';
    overlay.addEventListener('click', () => {
      sidebar.classList.remove('sidebar--open');
      overlay.classList.remove('sidebar-overlay--visible');
    });
    document.body.appendChild(overlay);
  }
  if (sidebar.classList.contains('sidebar--open')) {
    overlay.classList.add('sidebar-overlay--visible');
  } else {
    overlay.classList.remove('sidebar-overlay--visible');
  }
}

// ── Export ──
exportBtn.addEventListener('click', () => {
  if (products.length === 0) return showToast('No products to export', 'error');
  const headers = ['Name', 'Category', 'Price', 'Quantity', 'Status'];
  const rows = products.map(p => [
    p.name, p.category, p.price.toFixed(2), p.quantity, getStatus(p.quantity).label
  ]);
  const csv = [headers, ...rows].map(r => r.map(c => `"${c}"`).join(',')).join('\n');
  const blob = new Blob([csv], { type: 'text/csv' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = 'inventory_export.csv';
  a.click();
  URL.revokeObjectURL(url);
  showToast('Inventory exported as CSV', 'success');
});

// ═══════════════════════════════════════════════════════════
// UTILITIES
// ═══════════════════════════════════════════════════════════

function esc(text) {
  const el = document.createElement('span');
  el.textContent = text;
  return el.innerHTML;
}

function getInitials(name) {
  return name.split(' ').map(w => w[0]).join('').substring(0, 2).toUpperCase();
}

function delay(ms) {
  return new Promise(r => setTimeout(r, ms));
}

function animateStat(el, value) {
  el.style.transform = 'scale(1.08)';
  el.style.transition = 'transform 0.25s cubic-bezier(0.34, 1.56, 0.64, 1)';
  el.textContent = value;
  setTimeout(() => { el.style.transform = 'scale(1)'; }, 150);
}

/** Show a toast notification */
function showToast(message, type = 'success') {
  const icons = {
    success: '<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/><polyline points="22 4 12 14.01 9 11.01"/></svg>',
    error: '<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"/><line x1="15" y1="9" x2="9" y2="15"/><line x1="9" y1="9" x2="15" y2="15"/></svg>',
  };

  const toast = document.createElement('div');
  toast.className = `toast toast--${type}`;
  toast.innerHTML = `<span class="toast__icon">${icons[type]}</span><span>${message}</span>`;
  toastContainer.appendChild(toast);

  setTimeout(() => {
    toast.classList.add('toast--removing');
    setTimeout(() => toast.remove(), 300);
  }, 3500);
}

// ═══════════════════════════════════════════════════════════
// INIT
// ═══════════════════════════════════════════════════════════
document.addEventListener('DOMContentLoaded', fetchProducts);
