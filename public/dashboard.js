// ===============================
//  MÜŞTERİ PANELİ JAVASCRIPT
// ===============================

// 1) Giriş kontrolü
const authUserJSON = localStorage.getItem("authUser");
let authUser = null;

if (!authUserJSON) {
  window.location.href = "index.html";
} else {
  authUser = JSON.parse(authUserJSON);
}

// 2) DOM elemanları
const welcomeNameEl = document.getElementById("welcome-name");
const logoutBtn = document.getElementById("logout-btn");
const appointmentsContainer = document.getElementById("appointments-container");
const openModalBtn = document.getElementById("open-modal-btn");
const closeModalBtn = document.getElementById("close-modal-btn");
const modalBackdrop = document.getElementById("modal-backdrop");
const modalForm = document.getElementById("modal-form");
const modalMessageEl = document.getElementById("modal-message");
const productsGrid = document.getElementById("products-grid");
const selectedProductsContainer = document.getElementById("selected-products");
const productTotalEl = document.getElementById('product-total');
const serviceTotalEl = document.getElementById('service-total');
const grandTotalEl = document.getElementById('grand-total');

// HİZMET SEÇİMİ (çoklu)
const serviceSelect = document.getElementById("service-select");
const addServiceBtn = document.getElementById("add-service-btn");
const selectedServicesContainer = document.getElementById("selected-services");

// Seçili hizmetler listesi (array of {id, name, price})
let selectedServices = [];
// Seçili ürünler listesi: {id, name, price, quantity}
let selectedProducts = [];

// 3) Hoş geldin yazısı
if (authUser && welcomeNameEl) {
  const firstName = authUser.fullName
    ? authUser.fullName.split(" ")[0]
    : "Müşteri";
  welcomeNameEl.textContent = firstName;
}

// 4) Çıkış yap
if (logoutBtn) {
  logoutBtn.addEventListener("click", () => {
    localStorage.removeItem("authToken");
    localStorage.removeItem("authUser");
    window.location.href = "index.html";
  });
}

// ===============================
//  HİZMET ETİKETLERİNİ ÇİZ
// ===============================
function renderSelectedServices() {
  if (!selectedServicesContainer) return;

  selectedServicesContainer.innerHTML = "";

  if (selectedServices.length === 0) {
    selectedServicesContainer.innerHTML =
      '<span style="font-size:0.85rem; color:#6b7280;">Henüz hizmet eklenmedi.</span>';
    if (serviceTotalEl) serviceTotalEl.textContent = '0 ₺';
    updateGrandTotal();
    return;
  }

  selectedServices.forEach((s) => {
    const chip = document.createElement("span");
    chip.className = "service-chip";
    chip.dataset.id = s.id;
    chip.innerHTML = `
      ${s.name} • ${s.price} ₺
      <button type="button" class="chip-remove-btn" data-id="${s.id}">×</button>
    `;
    selectedServicesContainer.appendChild(chip);
  });
  
  // Hizmet toplamını güncelle
  if (serviceTotalEl) {
    const serviceTotal = selectedServices.reduce((sum, s) => sum + Number(s.price || 0), 0);
    serviceTotalEl.textContent = new Intl.NumberFormat('tr-TR', { style: 'currency', currency: 'TRY' }).format(serviceTotal);
  }
  updateGrandTotal();
}

// Seçili ürünleri render
function renderSelectedProducts() {
  if (!selectedProductsContainer) return;
  selectedProductsContainer.innerHTML = "";
  if (selectedProducts.length === 0) {
    selectedProductsContainer.innerHTML = '<span style="font-size:0.85rem; color:#6b7280;">Henüz ürün seçilmedi.</span>';
    if (productTotalEl) productTotalEl.textContent = (new Intl.NumberFormat('tr-TR', { style: 'currency', currency: 'TRY' }).format(0));
    return;
  }

  selectedProducts.forEach((p) => {
    const chip = document.createElement('div');
    chip.className = 'service-chip';
    chip.dataset.id = p.id;
    chip.innerHTML = `
      ${p.name} • ${p.price} ₺ x ${p.quantity}
      <button type="button" class="chip-remove-btn" data-id="${p.id}">×</button>
    `;
    selectedProductsContainer.appendChild(chip);
  });
  // update product total display
  if (productTotalEl) {
    const productTotal = selectedProducts.reduce((sum, p) => sum + (Number(p.price || 0) * Number(p.quantity || 0)), 0);
    productTotalEl.textContent = (new Intl.NumberFormat('tr-TR', { style: 'currency', currency: 'TRY' }).format(productTotal));
  }
  updateGrandTotal();
}

// Genel toplamı güncelle
function updateGrandTotal() {
  if (!grandTotalEl) return;
  
  const serviceTotal = selectedServices.reduce((sum, s) => sum + Number(s.price || 0), 0);
  const productTotal = selectedProducts.reduce((sum, p) => sum + (Number(p.price || 0) * Number(p.quantity || 0)), 0);
  const grandTotal = serviceTotal + productTotal;
  
  grandTotalEl.textContent = new Intl.NumberFormat('tr-TR', { style: 'currency', currency: 'TRY' }).format(grandTotal);
}

// Hizmet ekle butonu
if (addServiceBtn && serviceSelect) {
  addServiceBtn.addEventListener("click", () => {
    const opt = serviceSelect.selectedOptions[0];
    if (!opt || !opt.value) return;
    const id = opt.value;
    const name = opt.dataset.name || opt.textContent;
    const price = Number(opt.dataset.price || 0);

    if (!selectedServices.some(s => String(s.id) === String(id))) {
      selectedServices.push({ id, name, price });
      renderSelectedServices();
    }
  });
}

// Etiketten hizmet silme (× butonu)
if (selectedServicesContainer) {
  selectedServicesContainer.addEventListener("click", (e) => {
    if (e.target.classList.contains("chip-remove-btn")) {
      const id = e.target.dataset.id;
      selectedServices = selectedServices.filter((s) => String(s.id) !== String(id));
      renderSelectedServices();
    }
  });
}

// Selected products click handling inside modal
if (selectedProductsContainer) {
  selectedProductsContainer.addEventListener('click', (e) => {
    if (e.target.classList.contains('chip-remove-btn')) {
      const id = e.target.dataset.id;
      const removed = selectedProducts.find((p) => String(p.id) === String(id));
      selectedProducts = selectedProducts.filter((p) => String(p.id) !== String(id));
      // restore UI stock in product card
      const card = document.querySelector(`.product-card[data-id="${id}"]`);
      if (card && removed) {
        const prevStock = Number(card.dataset.stock || 0);
        const newStock = prevStock + Number(removed.quantity || 0);
        card.dataset.stock = newStock;
        const stockEl = card.querySelector('.product-stock');
        if (stockEl) {
          let stockText = 'Stokta';
          if (newStock <= 0) stockText = 'Stokta yok';
          else if (newStock <= 5) stockText = 'Az stok';
          stockEl.textContent = stockText;
        }
        const addBtn = card.querySelector('.add-product-btn');
        const qtyInput = card.querySelector('.product-qty');
        if (newStock > 0) {
          if (addBtn) addBtn.disabled = false;
          if (qtyInput) {
            qtyInput.disabled = false;
            qtyInput.max = newStock;
            if (Number(qtyInput.value) > newStock) qtyInput.value = newStock;
          }
        }
      }
      renderSelectedProducts();
    }
  });
}

// 5) Modal aç/kapat
if (openModalBtn) {
  openModalBtn.addEventListener("click", () => {
    modalMessageEl.textContent = "";
    modalForm.reset();
    if (serviceSelect) serviceSelect.value = "";
    // seçili hizmetleri sıfırla
    selectedServices = [];
    // ÜRÜNLERİ SIFIRLAMA — müşterinin seçimini koru
    renderSelectedServices();
    renderSelectedProducts();
    modalBackdrop.classList.remove("hidden");
  });
}

if (closeModalBtn) {
  closeModalBtn.addEventListener("click", () => {
    modalBackdrop.classList.add("hidden");
  });
}

if (modalBackdrop) {
  modalBackdrop.addEventListener("click", (e) => {
    if (e.target === modalBackdrop) {
      modalBackdrop.classList.add("hidden");
    }
  });
}

// ===============================
//  RANDEVULAR
// ===============================

// Randevuları yükle (sadece bu müşteriye ait aktif randevular)
async function loadAppointments() {
  try {
    const res = await fetch("/api/appointments");
    const data = await res.json();

    const myAppointments = data.filter(
      (a) => a.customerId === authUser.id && a.status !== "cancelled"
    );

    appointmentsContainer.innerHTML = "";

    if (myAppointments.length === 0) {
      const div = document.createElement("div");
      div.className = "empty-state";
      div.innerHTML = `
        <div class="empty-state-icon">📅</div>
        <div>Henüz randevunuz yok. Yeni randevu oluşturun!</div>
      `;
      appointmentsContainer.appendChild(div);
      return;
    }

    myAppointments.forEach((appt) => {
      const item = document.createElement("div");
      item.className = "appointment-item";

      const date = new Date(appt.dateTime);
      const dateStr = date.toLocaleString("tr-TR", {
        dateStyle: "medium",
        timeStyle: "short",
      });

      const statusMap = {
        pending: "Beklemede",
        approved: "Onaylandı",
        completed: "Tamamlandı",
        cancelled: "İptal Edildi",
      };
      const statusText = statusMap[appt.status] || appt.status;

      const serviceText =
        (appt.notes && appt.notes.split(" | ")[0]) || "Hizmet";

      item.innerHTML = `
        <div class="appointment-main">
          <div class="appointment-service">${serviceText}</div>
          <div class="appointment-sub">${dateStr}</div>
          ${appt.totalPrice ? `<div class="appointment-price">${appt.totalPrice} ₺</div>` : ''}
        </div>
        <div class="appointment-right">
          <div class="appointment-status">${statusText}</div>
          <button class="cancel-btn" data-id="${appt.id}">İptal Et</button>
        </div>
      `;

      appointmentsContainer.appendChild(item);
    });
  } catch (err) {
    console.error("Randevular yüklenirken hata:", err);
  }
}

// Randevu iptal et
async function cancelAppointment(id) {
  const onay = confirm("Bu randevuyu iptal etmek istediğinize emin misiniz?");
  if (!onay) return;

  try {
    const res = await fetch(`/api/appointments/${id}/status`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status: "cancelled" }),
    });

    let data;
    try {
      data = await res.json();
    } catch (e) {
      const text = await res.text();
      console.error("JSON parse edilemedi, gelen text:", text);
      alert("Sunucudan beklenmeyen cevap geldi.");
      return;
    }

    if (!res.ok) {
      console.error("İptal hatası:", data);
      alert(data.message || "Randevu iptal edilemedi.");
      return;
    }

    await loadAppointments();
  } catch (err) {
    console.error("Randevu iptal edilirken hata:", err);
    alert("Sunucuya bağlanırken bir hata oluştu.");
  }
}

// Appointment listesinde İptal Et butonuna tıklamayı yakala
if (appointmentsContainer) {
  appointmentsContainer.addEventListener("click", (e) => {
    if (e.target.classList.contains("cancel-btn")) {
      const id = e.target.dataset.id;
      cancelAppointment(id);
    }
  });
}

// ===============================
//  YENİ RANDEVU OLUŞTUR
// ===============================

if (modalForm) {
  modalForm.addEventListener("submit", async (e) => {
    e.preventDefault();
    modalMessageEl.textContent = "";

    const date = document.getElementById("date").value;
    const time = document.getElementById("time").value;
    const notes = document.getElementById("modal-notes").value.trim();

    if (!selectedServices.length || !date || !time) {
      modalMessageEl.textContent =
        "Lütfen en az bir hizmet, tarih ve saat seçin.";
      modalMessageEl.style.color = "#b91c1c";
      return;
    }

    const dateTimeStr = `${date}T${time}:00`;
    const DEFAULT_BARBER_ID = 1;

    const serviceTotal = selectedServices.reduce((sum, s) => sum + Number(s.price || 0), 0);
    const productTotal = selectedProducts.reduce((sum, p) => sum + Number(p.price || 0) * Number(p.quantity || 1), 0);
    const totalPrice = serviceTotal + productTotal;
    const serviceSummary = selectedServices.map(s => s.name).join(', ');

    const body = {
      customerId: authUser.id,
      barberId: DEFAULT_BARBER_ID,
      dateTime: dateTimeStr,
      // ilk kısma tüm hizmetleri yazıyoruz
      notes: serviceSummary + (notes ? " | " + notes : ""),
      totalPrice: totalPrice,
      selectedProducts: selectedProducts.map((p) => ({ productId: Number(p.id), quantity: Number(p.quantity) })),
      selectedServices: selectedServices.map((s) => ({ serviceId: Number(s.id), quantity: 1 })),
    };

    try {
      const res = await fetch("/api/appointments", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });

      const data = await res.json();

      if (!res.ok) {
        modalMessageEl.textContent = data.message || "Randevu oluşturulamadı.";
        if (data.error) modalMessageEl.textContent += ' ' + data.error;
        modalMessageEl.style.color = "#b91c1c";
        return;
      }

      modalMessageEl.textContent = data.message || "Randevu oluşturuldu.";
      modalMessageEl.style.color = "#15803d";
      // Clear selections and UI
      selectedServices = [];
      selectedProducts = [];
      renderSelectedServices();
      renderSelectedProducts();
      await loadAppointments();

      setTimeout(() => {
        modalBackdrop.classList.add("hidden");
      }, 700);
    } catch (err) {
      console.error("Randevu oluşturulurken hata:", err);
      modalMessageEl.textContent =
        "Sunucuya bağlanırken bir hata oluştu.";
      modalMessageEl.style.color = "#b91c1c";
    }
  });
}

// ===============================
//  ÜRÜNLER (BACKEND'DEN)
// ===============================

async function loadProducts() {
  try {
    const res = await fetch("/api/products");
    const data = await res.json();

    productsGrid.innerHTML = "";

    if (!Array.isArray(data) || data.length === 0) {
      productsGrid.innerHTML =
        '<div style="text-align:center; color:#6b7280">Henüz ürün eklenmedi.</div>';
      return;
    }

    data.forEach((p) => {
      const div = document.createElement("div");
      div.className = "product-card";
      div.dataset.id = p.id;
      div.dataset.stock = p.stock;

      let stockText = "Stokta";
      if (p.stock <= 0) stockText = "Stokta yok";
      else if (p.stock <= 5) stockText = "Az stok";

      div.innerHTML = `
        <div>
          <div class="product-name">${p.name}</div>
          <div class="product-category">${p.category}</div>
        </div>
        <div class="product-bottom">
          <div class="product-price">${p.price} ₺</div>
          <div class="product-stock">${stockText}</div>
        </div>
        <div class="product-actions">
          <input type="number" min="1" max="${p.stock}" value="1" class="product-qty" data-id="${p.id}" style="width:70px; margin-right:8px;" ${p.stock<=0? 'disabled' : ''} />
          <button class="secondary-btn add-product-btn" data-id="${p.id}" ${p.stock<=0? 'disabled' : ''}>Sepete Ekle</button>
        </div>
      `;
      productsGrid.appendChild(div);
    });
  } catch (err) {
    console.error("Ürünler yüklenirken hata:", err);
    productsGrid.innerHTML =
      '<div style="text-align:center; color:#b91c1c">Ürünler yüklenirken bir hata oluştu.</div>';
  }
}

// Sepete ekleme ('add-product-btn')
if (productsGrid) {
  productsGrid.addEventListener('click', (e) => {
    if (e.target.classList.contains('add-product-btn')) {
      const id = e.target.dataset.id;
      const input = productsGrid.querySelector(`.product-qty[data-id="${id}"]`);
      const qty = Number(input && input.value ? input.value : 1);
      const card = e.target.closest('.product-card');
      const nameEl = card ? card.querySelector('.product-name') : null;
      const priceEl = card ? card.querySelector('.product-price') : null;
      const stockAttr = card ? Number(card.dataset.stock || 0) : 0;
      const price = Number(priceEl ? priceEl.textContent.replace(/[^0-9.]/g, '') : 0);
      const name = nameEl ? nameEl.textContent.trim() : '';
      if (qty <= 0) return;
      if (qty > stockAttr) { alert('Yeterli stok yok.'); return; }
      const exists = selectedProducts.find((p) => String(p.id) === String(id));
      if (exists) {
        exists.quantity = Math.max(1, exists.quantity + qty);
      } else {
        selectedProducts.push({ id, name, price, quantity: qty });
      }
      // update available stock in card UI
      if (card) {
        const newStock = Math.max(0, Number(card.dataset.stock || 0) - qty);
        card.dataset.stock = newStock;
        const stockEl = card.querySelector('.product-stock');
        if (stockEl) {
          let stockText = 'Stokta';
          if (newStock <= 0) stockText = 'Stokta yok';
          else if (newStock <= 5) stockText = 'Az stok';
          stockEl.textContent = stockText;
        }
        const addBtn = card.querySelector('.add-product-btn');
        const qtyInput = card.querySelector('.product-qty');
        if (newStock <= 0) { if (addBtn) addBtn.disabled = true; if (qtyInput) qtyInput.disabled = true; }
        if (qtyInput) qtyInput.max = newStock;
      }
      renderSelectedProducts();
    }
  });
}

// ===============================
//  HİZMETLER (BACKEND'DEN)
// ===============================
async function loadServices() {
  if (!serviceSelect) return;
  try {
    const res = await fetch("/api/services");
    const data = await res.json();

    serviceSelect.innerHTML = "";
    const placeholder = document.createElement("option");
    placeholder.value = "";
    placeholder.textContent = "Hizmet seçin...";
    serviceSelect.appendChild(placeholder);

    if (!Array.isArray(data) || data.length === 0) {
      const opt = document.createElement("option");
      opt.value = "";
      opt.textContent = "Henüz hizmet eklenmedi";
      opt.disabled = true;
      serviceSelect.appendChild(opt);
      return;
    }

    data.forEach((s) => {
      const opt = document.createElement("option");
      opt.value = s.id;
      opt.dataset.name = s.name;
      opt.dataset.price = s.price;
      opt.textContent = `${s.name} • ${s.price} ₺`;
      serviceSelect.appendChild(opt);
    });
  } catch (err) {
    console.error("Hizmetler yüklenirken hata:", err);
    serviceSelect.innerHTML = "";
    const opt = document.createElement("option");
    opt.value = "";
    opt.textContent = "Hizmetler yüklenemedi";
    opt.disabled = true;
    serviceSelect.appendChild(opt);
  }
}

// ===============================
//  SAYFA YÜKLENİNCE
// ===============================
renderSelectedServices();
loadAppointments();
loadProducts();
loadServices();
