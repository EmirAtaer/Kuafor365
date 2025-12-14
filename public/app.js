// public/app.js

const form = document.getElementById("appointment-form");
const messageEl = document.getElementById("form-message");
const loadBtn = document.getElementById("load-appointments");
const tableBody = document.getElementById("appointments-table-body");

// Product + Service elements
const productsContainer = document.getElementById('products-container'); // container for product list (if present)
const serviceSelect = document.getElementById('service-select');
const selectedProductsContainer = document.getElementById('selected-products');
const selectedServicesContainer = document.getElementById('selected-services');
const productTotalEl = document.getElementById('product-total-display');

let availableProducts = [];
let selectedProducts = []; // [{id, name, price, quantity}]

// Helpers: render selected products
function renderSelectedProducts() {
  if (!selectedProductsContainer) return;
  selectedProductsContainer.innerHTML = '';
  if (selectedProducts.length === 0) {
    selectedProductsContainer.textContent = 'Henüz ürün seçilmedi.';
    if (productTotalEl) productTotalEl.textContent = '0 ₺';
    return;
  }
  selectedProducts.forEach(p => {
    const div = document.createElement('div');
    div.className = 'product-chip';
    div.dataset.id = p.id;
    div.innerHTML = `${p.name} • ${p.price} ₺ x ${p.quantity} <button data-id="${p.id}" class="remove-product">×</button>`;
    selectedProductsContainer.appendChild(div);
  });
  // update total
  const total = selectedProducts.reduce((s, p) => s + (Number(p.price || 0) * Number(p.quantity || 1)), 0);
  if (productTotalEl) productTotalEl.textContent = (new Intl.NumberFormat('tr-TR', { style: 'currency', currency: 'TRY' }).format(total));
}

// Randevu oluşturma
form.addEventListener("submit", async (e) => {
  e.preventDefault();

  const customerId = document.getElementById("customerId").value;
  const barberId = document.getElementById("barberId").value;
  const dateTime = document.getElementById("dateTime").value;
  const notes = document.getElementById("notes").value;

  // compute totals
  let servicePrice = 0;
  const serviceId = serviceSelect ? Number(serviceSelect.value || 0) : 0;
  if (serviceId && serviceSelect) {
    const opt = serviceSelect.selectedOptions && serviceSelect.selectedOptions[0];
    if (opt) servicePrice = Number(opt.dataset.price || 0);
  }
  const productTotal = selectedProducts.reduce((s, p) => s + (Number(p.price || 0) * Number(p.quantity || 1)), 0);
  const totalPrice = servicePrice + productTotal;

  const body = {
    customerId: Number(customerId),
    barberId: Number(barberId),
    dateTime: dateTime,
    notes: notes,
    totalPrice: totalPrice,
    selectedProducts: selectedProducts.map(p => ({ productId: Number(p.id), quantity: Number(p.quantity) })),
  };

  try {
    const res = await fetch("/api/appointments", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });

    const data = await res.json();

    if (!res.ok) {
      messageEl.textContent = "Hata: " + (data.message || "Bilinmeyen hata");
      messageEl.style.color = "red";
    } else {
      messageEl.textContent = data.message || "Randevu oluşturuldu.";
      messageEl.style.color = "green";
      form.reset();
      loadAppointments(); // tabloyu güncelle
    }
  } catch (err) {
    console.error(err);
    messageEl.textContent = "Sunucuya bağlanırken hata oluştu.";
    messageEl.style.color = "red";
  }
});

// Randevuları yükleme
async function loadAppointments() {
  try {
    const res = await fetch("/api/appointments");
    const data = await res.json();

    tableBody.innerHTML = "";

    data.forEach((appt) => {
      const tr = document.createElement("tr");

      const date = new Date(appt.dateTime);

      tr.innerHTML = `
        <td>${appt.id}</td>
        <td>${appt.customerId}</td>
        <td>${appt.barberId}</td>
        <td>${date.toLocaleString("tr-TR")}</td>
        <td>${appt.status}</td>
        <td>${appt.notes || ""}</td>
      `;

      tableBody.appendChild(tr);
    });
  } catch (err) {
    console.error(err);
  }
}

loadBtn.addEventListener("click", loadAppointments);

// Load available products and services when the page loads to let the user add them
async function loadProductsAndServices() {
  try {
    // products
    const resP = await fetch('/api/products');
    const products = await resP.json();
    availableProducts = Array.isArray(products) ? products : [];
    if (productsContainer) {
      productsContainer.innerHTML = '';
      if (!availableProducts.length) {
        productsContainer.innerHTML = '<div style="text-align:center; color:#6b7280">Henüz ürün eklenmedi.</div>';
      } else {
        availableProducts.forEach(p => {
          const card = document.createElement('div');
          card.className = 'product-card-small';
          card.dataset.id = p.id;
          card.innerHTML = `<div>${p.name} • ${p.price} ₺</div>
            <div>
              <input type="number" min="1" value="1" style="width:70px" class="product-qty" data-id="${p.id}" />
              <button data-id="${p.id}" class="add-product-btn small">Sepete Ekle</button>
            </div>`;
          productsContainer.appendChild(card);
        });
      }
    }

    // services
    const resS = await fetch('/api/services');
    const services = await resS.json();
    if (serviceSelect) {
      serviceSelect.innerHTML = '<option value="">Hizmet seçin</option>';
      if (Array.isArray(services) && services.length) {
        services.forEach(s => {
          const opt = document.createElement('option');
          opt.value = s.id;
          opt.dataset.price = Number(s.price || 0);
          opt.textContent = `${s.name} • ${s.price} ₺`;
          serviceSelect.appendChild(opt);
        });
      }
    }
  } catch (err) {
    console.error('loadProductsAndServices error:', err);
  }
}

// Document-level click handlers for small product add/remove
document.addEventListener('click', (e) => {
  if (e.target.classList.contains('add-product-btn')) {
    const id = e.target.dataset.id;
    const input = document.querySelector(`.product-qty[data-id="${id}"]`);
    const qty = Number(input && input.value ? input.value : 1);
    const prod = availableProducts.find(p => String(p.id) === String(id));
    if (!prod) return;
    const exists = selectedProducts.find(sp => String(sp.id) === String(id));
    if (exists) {
      exists.quantity = Math.max(1, exists.quantity + qty);
    } else {
      selectedProducts.push({ id: prod.id, name: prod.name, price: Number(prod.price), quantity: qty });
    }
    renderSelectedProducts();
  }
  if (e.target.classList.contains('remove-product')) {
    const id = e.target.dataset.id;
    selectedProducts = selectedProducts.filter(sp => String(sp.id) !== String(id));
    renderSelectedProducts();
  }
});

// initialize
renderSelectedProducts();
loadProductsAndServices();

// Sayfa açılır açılmaz randevuları yükleyelim
loadAppointments();
