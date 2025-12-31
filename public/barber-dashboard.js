// =======================================
// GECE MODU FONKSİYONLARI
// =======================================
function initDarkMode() {
  const savedDarkMode = localStorage.getItem("darkMode");
  
  // Eğer daha önce gece modu açılmışsa, sayfa açılırken uygula
  if (savedDarkMode === "true") {
    document.body.classList.add("dark-mode");
  }
  
  // DOM yüklendikten sonra buton event listener'ı ekle
  document.addEventListener("DOMContentLoaded", () => {
    const darkModeToggle = document.getElementById("dark-mode-toggle");
    
    if (darkModeToggle) {
      // İkonu ayarla
      const isDarkMode = document.body.classList.contains("dark-mode");
      darkModeToggle.textContent = isDarkMode ? "☀️" : "🌙";
      
      // Toggle butonuna tıklama olayı ekle
      darkModeToggle.addEventListener("click", () => {
        document.body.classList.toggle("dark-mode");
        const isDarkMode = document.body.classList.contains("dark-mode");
        localStorage.setItem("darkMode", isDarkMode);
        
        // İkon değiştir
        darkModeToggle.textContent = isDarkMode ? "☀️" : "🌙";
      });
    }
  });
}

// Sayfa yüklendiğinde gece modu başlat
initDarkMode();
// =======================================

// ===============================
//  KUAFÖR PANELİ JAVASCRIPT
// ===============================

// 1) Giriş + rol kontrolü
// === SADECE BERBER ERİŞEBİLSİN ===
const authUserJSON = localStorage.getItem("authUser");
let authUser = null;

if (!authUserJSON) {
  window.location.href = "index.html";
} else {
  authUser = JSON.parse(authUserJSON);
  // Rol berber veya admin değilse müşteri paneline at
  if (authUser.role !== "barber" && authUser.role !== "admin") {
    window.location.href = "dashboard.html";
  }
}
// === BURADAN SONRA ESKİ KODUN DEVAM EDEBİLİR ===

// DOM
const welcomeNameEl = document.getElementById("welcome-name");
const logoutBtn = document.getElementById("logout-btn");

// Stats (üstteki 3 kart)
const statTotalAppointments = document.getElementById(
  "stat-total-appointments"
);
const statPendingAppointments = document.getElementById(
  "stat-pending-appointments"
);
const statTotalProducts = document.getElementById("stat-total-products");

// Tabs
const tabButtons = document.querySelectorAll(".tab-btn");
const tabSections = document.querySelectorAll(".tab-section");

// Randevular
const appointmentsContainer = document.getElementById("appointments-container");
const completedAppointmentsContainer = document.getElementById(
  "completed-appointments-container"
);

// Ürün yönetimi
const newProductBtn = document.getElementById("new-product-btn");
const newProductForm = document.getElementById("new-product-form");
const addProductBtn = document.getElementById("add-product-btn");
const productMessageEl = document.getElementById("product-message");
const prodNameInput = document.getElementById("prod-name");
const prodCategoryInput = document.getElementById("prod-category");
const prodPriceInput = document.getElementById("prod-price");
const prodStockInput = document.getElementById("prod-stock");
const productsGrid = document.getElementById("products-grid");
const LOW_STOCK_LIMIT = 20;
// Hizmet yönetimi
const newServiceBtn = document.getElementById("new-service-btn");
const newServiceForm = document.getElementById("new-service-form");
const addServiceBtn = document.getElementById("add-service-btn");
const serviceMessageEl = document.getElementById("service-message");
const serviceNameInput = document.getElementById("service-name");
const servicePriceInput = document.getElementById("service-price");
const serviceDurationInput = document.getElementById("service-duration");
const servicesGrid = document.getElementById("services-grid");

// Analitik
const statTotalUsage = document.getElementById("stat-total-usage");
const statLowStockAnalytics = document.getElementById(
  "stat-low-stock-analytics"
);
const statTotalAppointmentsAnalytics = document.getElementById(
  "stat-total-appointments-analytics"
);
const statBusiestDay = document.getElementById("stat-busiest-day");
const statWeeklyRevenue = document.getElementById("stat-weekly-revenue");
const statMonthlyRevenue = document.getElementById("stat-monthly-revenue");
const statWeeklyExpense = document.getElementById("stat-weekly-expense");
const statMonthlyExpense = document.getElementById("stat-monthly-expense");
const statWeeklyNet = document.getElementById('stat-weekly-net');
const statMonthlyNet = document.getElementById('stat-monthly-net');
const statWeeklyServiceRevenue = document.getElementById('stat-weekly-service-revenue');
const statWeeklyProductRevenue = document.getElementById('stat-weekly-product-revenue');
const statMonthlyServiceRevenue = document.getElementById('stat-monthly-service-revenue');
const statMonthlyProductRevenue = document.getElementById('stat-monthly-product-revenue');

// Analytics filter
const analyticsWeekStartInput = document.getElementById('analytics-week-start');
const analyticsRefreshBtn = document.getElementById('analytics-refresh');

// Expense UI elements
const expenseAmountInput = document.getElementById('expense-amount');
const expenseCategoryInput = document.getElementById('expense-category');
const expenseDateInput = document.getElementById('expense-date');
const expenseNotesInput = document.getElementById('expense-notes');
const addExpenseBtn = document.getElementById('add-expense-btn');
const expensesGrid = document.getElementById('expenses-grid');
const productsTableBody = document.getElementById("products-table-body");

// Gün durumu + saat görünümü
const dayStatusDateInput = document.getElementById("day-status-date");
const dayStatusLabel = document.getElementById("day-status-label");
const toggleDayStatusBtn = document.getElementById("toggle-day-status-btn");
const timeSlotsGrid = document.getElementById("time-slots-grid");
const timeSlotsDateLabel = document.getElementById("time-slots-date-label");

// Charts
let chartTopProducts = null;
let chartDaily = null;
let chartHourly = null;
let chartServicePie = null; // HİZMET PASTA GRAFİĞİ

// Format helpers
function formatCurrency(value) {
  const num = Number(value || 0);
  return new Intl.NumberFormat("tr-TR", { style: "currency", currency: "TRY", maximumFractionDigits: 2 }).format(num);
}

// Hoş geldin
if (authUser && welcomeNameEl) {
  const firstName = authUser.fullName
    ? authUser.fullName.split(" ")[0]
    : "Kuaför";
  welcomeNameEl.textContent = firstName;
}

// Çıkış
logoutBtn.addEventListener("click", () => {
  localStorage.removeItem("authToken");
  localStorage.removeItem("authUser");
  window.location.href = "index.html";
});

// ===============================
//  TAB GEÇİŞLERİ
// ===============================
tabButtons.forEach((btn) => {
  btn.addEventListener("click", () => {
    const target = btn.dataset.tab;
    const targetEl = document.getElementById(target);
    if (!targetEl) return;

    tabButtons.forEach((b) => b.classList.remove("active"));
    tabSections.forEach((s) => s.classList.remove("active"));

    btn.classList.add("active");
    targetEl.classList.add("active");
  });
});

// ===============================
//  RANDEVU YÖNETİMİ
// ===============================
async function loadAppointments(selectedDate = null) {
  try {
    const query = selectedDate ? `?date=${selectedDate}` : "";
    const res = await fetch(`/api/appointments${query}`);
    const data = await res.json();

    // İptal edilmeyen tüm randevular (tek kuaför varsayımı)
    const myAppointments = data.filter((a) => a.status !== "cancelled");

    // Aktif randevular (sadece beklemede olanlar)
    const activeAppointments = myAppointments.filter((a) => a.status === "pending");

    // Tamamlananlar: onaylanmış ve tamamlanmış (approved OR completed)
    const completedAppointments = myAppointments.filter(
      (a) => a.status === "approved" || a.status === "completed"
    );

    // --- AKTİF RANDEVULAR ---
    appointmentsContainer.innerHTML = "";

    if (activeAppointments.length === 0) {
      appointmentsContainer.innerHTML =
        '<div class="empty-state">Aktif randevunuz yok.</div>';
    } else {
      activeAppointments.forEach((appt) => {
        const card = document.createElement("div");
        card.className = "appointment-card";

        const d = new Date(appt.dateTime);
        const dateStr = d.toLocaleDateString("tr-TR");
        const timeStr = d.toLocaleTimeString("tr-TR", {
          hour: "2-digit",
          minute: "2-digit",
        });

        const serviceText =
          (appt.notes && appt.notes.split(" | ")[0]) || "Hizmet";

        const statusMap = {
          pending: "Beklemede",
          approved: "Onaylandı",
          completed: "Tamamlandı",
          done: "Tamamlandı",
          finished: "Tamamlandı",
        };
        const statusText = statusMap[appt.status] || appt.status;

        let actionsHtml = "";
        if (appt.status === "pending") {
          // Onayla tuşu: DB'de status = 'approved' olacak
          actionsHtml = `
            <button class="approve-btn small-btn" data-id="${appt.id}">Onayla</button>
            <button class="cancel-btn small-btn" data-id="${appt.id}">İptal Et</button>
          `;
        } else if (appt.status === "approved") {
          actionsHtml = `
            <button class="complete-btn small-btn" data-id="${appt.id}">Tamamlandı</button>
          `;
        }

        card.innerHTML = `
          <div class="appointment-card-header">
            <div class="appointment-title">${serviceText}</div>
            <div class="appointment-status-pill">${statusText}</div>
          </div>
          <div class="appointment-card-body">
            <div class="appointment-row">
              <span>📅</span><span>${dateStr}</span>
            </div>
            <div class="appointment-row">
              <span>⏰</span><span>${timeStr}</span>
            </div>
            ${appt.customer ? `<div class="appointment-row"><span>👤</span><span>${appt.customer.fullName}${appt.customer.phone ? ` • ${appt.customer.phone}` : ''}</span></div>` : ''}
            ${
              appt.notes
                ? `<div class="appointment-notes">${appt.notes}</div>`
                : ""
            }
              ${appt.totalPrice ? `<div class="appointment-row"><span>💰</span><span>${Number(appt.totalPrice).toFixed(2)} ₺</span></div>` : ''}
              ${appt.ProductSales && appt.ProductSales.length > 0 ? `
                <div class="appointment-products">
                  <div style="font-weight:600; margin-top:6px;">Ürünler:</div>
                  ${appt.ProductSales.map(ps => `
                    <div class="appointment-product-row">${(ps.Product && ps.Product.name) ? ps.Product.name : 'Ürün #' + ps.productId} • ${ps.quantity} adet x ${Number(ps.unitPrice).toFixed(2)}₺ = ${Number(ps.totalPrice).toFixed(2)}₺</div>
                  `).join('')}
                </div>
              ` : ''}
          </div>
          <div class="appointment-card-footer">
            ${actionsHtml}
          </div>
        `;
        appointmentsContainer.appendChild(card);
      });
    }

    // --- TAMAMLANAN RANDEVULAR ---
    completedAppointmentsContainer.innerHTML = "";

    if (completedAppointments.length === 0) {
      completedAppointmentsContainer.innerHTML =
        '<div class="empty-state">Henüz tamamlanan randevu yok.</div>';
    } else {
      completedAppointments.forEach((appt) => {
        const card = document.createElement("div");
        card.className = "appointment-card appointment-card-completed";

        const d = new Date(appt.dateTime);
        const dateStr = d.toLocaleDateString("tr-TR");
        const timeStr = d.toLocaleTimeString("tr-TR", {
          hour: "2-digit",
          minute: "2-digit",
        });

        const serviceText =
          (appt.notes && appt.notes.split(" | ")[0]) || "Hizmet";

        card.innerHTML = `
          <div class="appointment-card-header">
            <div class="appointment-title">${serviceText}</div>
            <div class="appointment-status-pill status-completed">Tamamlandı</div>
          </div>
          <div class="appointment-card-body">
            <div class="appointment-row">
              <span>📅</span><span>${dateStr}</span>
            </div>
            <div class="appointment-row">
              <span>⏰</span><span>${timeStr}</span>
            </div>
            ${appt.customer ? `<div class="appointment-row"><span>👤</span><span>${appt.customer.fullName}${appt.customer.phone ? ` • ${appt.customer.phone}` : ''}</span></div>` : ''}
            ${
              appt.notes
                ? `<div class="appointment-notes">${appt.notes}</div>`
                : ""
            }
            ${appt.totalPrice ? `<div class="appointment-row"><span>💰</span><span>${Number(appt.totalPrice).toFixed(2)} ₺</span></div>` : ''}
            ${appt.ProductSales && appt.ProductSales.length > 0 ? `
              <div class="appointment-products">
                <div style="font-weight:600; margin-top:6px;">Ürünler:</div>
                ${appt.ProductSales.map(ps => `
                  <div class="appointment-product-row">${(ps.Product && ps.Product.name) ? ps.Product.name : 'Ürün #' + ps.productId} • ${ps.quantity} adet x ${formatCurrency(ps.unitPrice)} = ${formatCurrency(ps.totalPrice)}</div>
                `).join('')}
              </div>
            ` : ''}
          </div>
          <div class="appointment-card-footer">
            <button class="no-show-btn small-btn" data-id="${appt.id}">Gelmedi</button>
          </div>
        `;

        completedAppointmentsContainer.appendChild(card);
      });
    }
  } catch (err) {
    console.error("loadAppointments error:", err);
  }
}

// Seçili gün için 09:00-20:00 saatlerini renklendir
function renderTimeSlots(dateStr, isOpen, appointmentsForDay) {
  if (!timeSlotsGrid) return;

  timeSlotsGrid.innerHTML = "";

  // Tarih etiketi
  if (timeSlotsDateLabel) {
    const d = new Date(dateStr);
    timeSlotsDateLabel.textContent = d.toLocaleDateString("tr-TR", {
      weekday: "long",
      day: "numeric",
      month: "short",
    });
  }

  for (let hour = 9; hour <= 20; hour++) {
    const pill = document.createElement("div");
    pill.classList.add("time-slot-pill");

    const label = `${String(hour).padStart(2, "0")}:00`;
    pill.textContent = label;

    if (!isOpen) {
      pill.classList.add("slot-closed");
    } else {
      const hasAppt = appointmentsForDay.some((appt) => {
        if (!appt.dateTime) return false;
        const d = new Date(appt.dateTime);
        return d.getHours() === hour;
      });

      if (hasAppt) {
        pill.classList.add("slot-busy");
      } else {
        pill.classList.add("slot-free");
      }
    }

    timeSlotsGrid.appendChild(pill);
  }
}

// Seçili gün için: gün durumu + saat görünümü
async function refreshDayOverview() {
  if (!dayStatusDateInput) return;
  const dateStr = dayStatusDateInput.value;
  if (!dateStr) return;

  try {
    // Set loading state for day status label while fetching
    if (dayStatusLabel) {
      dayStatusLabel.textContent = 'Gün durumu yükleniyor...';
      dayStatusLabel.classList.remove('chip-danger');
      dayStatusLabel.classList.add('chip-soft');
    }
    // 1) Gün açık mı?
    const statusRes = await fetch(`/api/barber/day-status?date=${dateStr}`);
    let isOpen = true;

    if (statusRes.ok) {
      const statusData = await statusRes.json();
      isOpen = statusData.isOpen;

      if (dayStatusLabel) {
        if (isOpen) {
          dayStatusLabel.textContent =
            "Gün açık (müşteriler randevu alabilir)";
          dayStatusLabel.classList.remove("chip-danger");
          dayStatusLabel.classList.add("chip-soft");
        } else {
          dayStatusLabel.textContent =
            "Gün kapalı (müşteriler randevu alamaz)";
          dayStatusLabel.classList.remove("chip-soft");
          dayStatusLabel.classList.add("chip-danger");
        }
      }
    }

    // 2) Bu güne ait randevular (API'den tarih ile filtreleyerek al)
    const apptRes = await fetch(`/api/appointments?date=${dateStr}`);
    const allAppointments = apptRes.ok ? await apptRes.json() : [];

    // Sadece iptal edilmemiş randevuları dikkate al (busy olarak say)
    const appointmentsForDay = allAppointments.filter((appt) => {
      if (!appt.dateTime) return false;
      const d = new Date(appt.dateTime);
      const ymd = d.toISOString().split("T")[0];
      if (ymd !== dateStr) return false;
      return appt.status !== 'cancelled';
    });

    renderTimeSlots(dateStr, isOpen, appointmentsForDay);
  } catch (err) {
    console.error("refreshDayOverview error:", err);
  }
}

// Randevu durumu güncelle
async function updateAppointmentStatus(id, status) {
  try {
    const res = await fetch(`/api/appointments/${id}/status`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status }),
    });
    const data = await res.json();

    if (!res.ok) {
      alert(data.message || "Randevu durumu güncellenemedi.");
      return;
    }

    await loadAppointments(dayStatusDateInput.value || null);
    await loadAnalytics(getSelectedWeekStart());
  } catch (err) {
    console.error("updateAppointmentStatus error:", err);
    alert("Sunucu hatası.");
  }
}

appointmentsContainer.addEventListener("click", (e) => {
  if (e.target.classList.contains("approve-btn")) {
    const id = e.target.dataset.id;
    // Set status to 'approved'
    updateAppointmentStatus(id, "approved");
  }
  if (e.target.classList.contains("complete-btn")) {
    const id = e.target.dataset.id;
    updateAppointmentStatus(id, "completed");
  }

  if (e.target.classList.contains("cancel-btn")) {
    const id = e.target.dataset.id;
    const ok = confirm("Bu randevuyu iptal etmek istiyor musunuz?");
    if (!ok) return;
    updateAppointmentStatus(id, "cancelled");
  }
});

// Tamamlanan randevular için (no-show => sil)
if (completedAppointmentsContainer) {
  completedAppointmentsContainer.addEventListener('click', async (e) => {
    if (e.target.classList.contains('no-show-btn')) {
      const id = e.target.dataset.id;
      const ok = confirm('Bu randevu gelmedi olarak işaretlenip silinsin mi?');
      if (!ok) return;
      await deleteAppointment(id);
    }
  });
}

// Randevuyu sil (no-show)
async function deleteAppointment(id) {
  try {
    const res = await fetch(`/api/appointments/${id}`, { method: 'DELETE' });
    const data = await res.json();
    if (!res.ok) {
      alert(data.message || 'Randevu silinemedi.');
      return;
    }
    await loadAppointments(dayStatusDateInput.value || null);
    await loadAnalytics(getSelectedWeekStart());
    if (dayStatusDateInput && dayStatusDateInput.value) {
      await refreshDayOverview();
    }
  } catch (err) {
    console.error('deleteAppointment error:', err);
    alert('Sunucu hatası.');
  }
}

// ===============================
//  ÜRÜN YÖNETİMİ
// ===============================
newProductBtn.addEventListener("click", () => {
  newProductForm.classList.toggle("hidden");
  productMessageEl.textContent = "";
});

async function loadProducts() {
  try {
    const res = await fetch("/api/products");
    const data = await res.json();

    productsGrid.innerHTML = "";

    if (!Array.isArray(data) || data.length === 0) {
      productsGrid.innerHTML =
        '<div class="empty-state">Henüz ürün eklenmedi.</div>';
      return;
    }

    data.forEach((p) => {
      const card = document.createElement("div");
      card.className = "product-card";

      card.innerHTML = `
        <div class="product-card-header">
          <div>
            <div class="product-name">${p.name}</div>
            <div class="product-category">${p.category}</div>
          </div>
          <div class="product-card-actions">
            <button class="icon-btn delete-product" data-id="${p.id}">🗑</button>
          </div>
        </div>
        <div class="product-card-body">
          <div class="product-price">${p.price} ₺</div>
          <div class="product-stock-line">
            Stok: <span class="product-stock-value" data-id="${p.id}">${p.stock}</span> adet
          </div>
          <div class="product-usage-line">
            Kullanım: <span class="product-usage-value">${p.usageCount}</span> kez
          </div>
          <div class="product-stock-update">
            <input
              type="number"
              class="stock-input"
              placeholder="Eklenecek stok"
              data-id="${p.id}"
              min="0"
            />
            <button class="small-btn save-stock" data-id="${p.id}">
              Stok Ekle
            </button>
          </div>
          <div class="product-usage-buttons">
            <button class="small-btn usage-plus" data-id="${p.id}">+ Kullanım</button>
            <button class="small-btn usage-minus" data-id="${p.id}">- Kullanım</button>
          </div>
        </div>
      `;

      productsGrid.appendChild(card);
    });
  } catch (err) {
    console.error("loadProducts error:", err);
  }
}

// Hizmetleri yükle
async function loadServices() {
  try {
    const res = await fetch("/api/services");
    const data = await res.json();

    servicesGrid.innerHTML = "";
    if (!Array.isArray(data) || data.length === 0) {
      servicesGrid.innerHTML = '<div class="empty-state">Henüz hizmet eklenmedi.</div>';
      return;
    }

    data.forEach((s) => {
      const card = document.createElement("div");
      card.className = "product-card"; // reuse product-card CSS

      card.innerHTML = `
        <div class="product-card-header">
          <div>
            <div class="product-name">${s.name}</div>
          </div>
          <div class="product-card-actions">
            <button class="icon-btn edit-service" data-id="${s.id}">✏️</button>
            <button class="icon-btn delete-service" data-id="${s.id}">🗑</button>
          </div>
        </div>
        <div class="product-card-body">
          <div class="product-price">${s.price} ₺</div>
          <div class="product-usage-line">Süre: ${s.durationMinutes || '-'} dk</div>
        </div>
      `;

      servicesGrid.appendChild(card);
    });
  } catch (err) {
    console.error("loadServices error:", err);
  }
}

addServiceBtn.addEventListener("click", async () => {
  serviceMessageEl.textContent = "";
  const name = serviceNameInput.value.trim();
  const price = parseFloat(servicePriceInput.value);
  const duration = parseInt(serviceDurationInput.value || '0', 10);
  if (!name || isNaN(price)) {
    serviceMessageEl.textContent = "Hizmet adı ve fiyat zorunludur.";
    serviceMessageEl.style.color = "#b91c1c";
    return;
  }

  try {
    const res = await fetch('/api/services', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name, price, durationMinutes: duration }),
    });
    const data = await res.json();
    if (!res.ok) {
      serviceMessageEl.textContent = data.message || 'Hata oluştu.';
      serviceMessageEl.style.color = '#b91c1c';
      return;
    }
    serviceMessageEl.textContent = 'Hizmet kaydedildi.';
    serviceMessageEl.style.color = '#15803d';
    serviceNameInput.value = '';
    servicePriceInput.value = '';
    serviceDurationInput.value = '';
    await loadServices();
  } catch (err) {
    console.error('addService error:', err);
    serviceMessageEl.textContent = 'Sunucu hatası.';
    serviceMessageEl.style.color = '#b91c1c';
  }
});

// Hizmet delete/edit click handling
if (servicesGrid) {
  servicesGrid.addEventListener('click', async (e) => {
    const id = e.target.dataset.id;
    if (!id) return;

    if (e.target.classList.contains('delete-service')) {
      const ok = confirm('Bu hizmeti silmek istediğinize emin misiniz?');
      if (!ok) return;
      try {
        const res = await fetch(`/api/services/${id}`, { method: 'DELETE' });
        const data = await res.json();
        if (!res.ok) { alert(data.message || 'Hizmet silinemedi.'); return; }
        await loadServices();
        await loadAnalytics(getSelectedWeekStart());
      } catch (err) {
        console.error('deleteService error:', err);
        alert('Hizmet silinirken hata oluştu.');
      }
    }

    if (e.target.classList.contains('edit-service')) {
      // Edit flow using simple prompts for now
      const card = e.target.closest('.product-card');
      const nameEl = card ? card.querySelector('.product-name') : null;
      const priceEl = card ? card.querySelector('.product-price') : null;
      const currentName = nameEl ? nameEl.textContent.trim() : '';
      const currentPrice = priceEl ? priceEl.textContent.replace(/[^0-9.]/g, '') : '0';
      const newName = prompt('Hizmet adı', currentName) || currentName;
      const newPrice = parseFloat(prompt('Fiyat (₺)', currentPrice) || currentPrice);
      if (Number.isNaN(newPrice)) { alert('Geçerli bir fiyat yazın.'); return; }
      try {
        const res = await fetch(`/api/services/${id}`, {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ name: newName, price: newPrice }),
        });
        const data = await res.json();
        if (!res.ok) { alert(data.message || 'Hizmet güncellenemedi.'); return; }
        await loadServices();
      } catch (err) {
        console.error('editService error:', err);
        alert('Hizmet güncellenirken hata oluştu.');
      }
    }
  });
}

addProductBtn.addEventListener("click", async () => {
  productMessageEl.textContent = "";

  const name = prodNameInput.value.trim();
  const category = prodCategoryInput.value.trim();
  const price = parseFloat(prodPriceInput.value);
  const stock = parseInt(prodStockInput.value || "0", 10);

  if (!name || !category || isNaN(price)) {
    productMessageEl.textContent =
      "Ürün adı, kategori ve fiyat zorunludur.";
    productMessageEl.style.color = "#b91c1c";
    return;
  }

  

  try {
    const res = await fetch("/api/products", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name, category, price, stock }),
    });

    const data = await res.json();

    if (!res.ok) {
      productMessageEl.textContent =
        data.message || "Ürün eklenirken hata oluştu.";
      if (data.error) productMessageEl.textContent += ' ' + data.error;
      productMessageEl.style.color = "#b91c1c";
      return;
    }

    productMessageEl.textContent = "Ürün başarıyla eklendi.";
    productMessageEl.style.color = "#15803d";

    prodNameInput.value = "";
    prodCategoryInput.value = "";
    prodPriceInput.value = "";
    prodStockInput.value = "";

    await loadProducts();
    await loadAnalytics(getSelectedWeekStart());
  } catch (err) {
    console.error("addProduct error:", err);
    productMessageEl.textContent = "Sunucuya bağlanırken bir hata oluştu.";
    productMessageEl.style.color = "#b91c1c";
  }
});

productsGrid.addEventListener("click", async (e) => {
  const id = e.target.dataset.id;
  if (!id) return;

  if (e.target.classList.contains("save-stock")) {
    const input = productsGrid.querySelector(`.stock-input[data-id="${id}"]`);
    const delta = parseInt(input.value || "0", 10);

    if (!delta) return;

    try {
      const res = await fetch(`/api/products/${id}/stock`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ delta }),
      });
      const data = await res.json();
      if (!res.ok) {
        alert(data.message || "Stok güncellenemedi.");
        return;
      }

      input.value = "";
      await loadProducts();
      await loadAnalytics(getSelectedWeekStart());
    } catch (err) {
      console.error("updateStock error:", err);
      alert("Sunucu hatası.");
    }
  }

  if (e.target.classList.contains("usage-plus")) {
    await updateUsage(id, 1);
  }

  if (e.target.classList.contains("usage-minus")) {
    await updateUsage(id, -1);
  }

  if (e.target.classList.contains("delete-product")) {
    const ok = confirm("Bu ürünü silmek istediğinize emin misiniz?");
    if (!ok) return;

    try {
      const res = await fetch(`/api/products/${id}`, {
        method: "DELETE",
      });
      const data = await res.json();
      if (!res.ok) {
        alert(data.message || "Ürün silinemedi.");
        return;
      }
      await loadProducts();
      await loadAnalytics(getSelectedWeekStart());
    } catch (err) {
      console.error("deleteProduct error:", err);
      alert("Sunucu hatası.");
    }
  }
});

async function updateUsage(id, delta) {
  try {
    const res = await fetch(`/api/products/${id}/usage`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ delta }),
    });
    const data = await res.json();
    if (!res.ok) {
      alert(data.message || "Kullanım güncellenemedi.");
      return;
    }
    await loadProducts();
    await loadAnalytics(getSelectedWeekStart());
  } catch (err) {
    console.error("updateUsage error:", err);
    alert("Sunucu hatası.");
  }
}

// ===============================
//  GÜN AÇ / KAPAT (KUAFÖR)
// ===============================
function updateDayStatusUI(isOpen) {
  if (!dayStatusLabel || !toggleDayStatusBtn) return;

  if (isOpen) {
    dayStatusLabel.textContent = "Gün açık (müşteriler randevu alabilir)";
    dayStatusLabel.classList.remove("chip-danger");
    dayStatusLabel.classList.add("chip-soft");
    toggleDayStatusBtn.textContent = "Günü Kapat";
  } else {
    dayStatusLabel.textContent = "Gün kapalı (müşteriler randevu alamaz)";
    dayStatusLabel.classList.remove("chip-soft");
    dayStatusLabel.classList.add("chip-danger");
    toggleDayStatusBtn.textContent = "Günü Aç";
  }
}

async function fetchDayStatus(dateStr) {
  try {
    if (dayStatusLabel) {
      dayStatusLabel.textContent = 'Gün durumu yükleniyor...';
      dayStatusLabel.classList.remove('chip-danger');
      dayStatusLabel.classList.add('chip-soft');
    }
    const res = await fetch(`/api/barber/day-status?date=${dateStr}`);
    const data = await res.json();

    if (!res.ok) {
      console.error("day-status error:", data);
      dayStatusLabel.textContent = "Durum alınamadı";
      return;
    }

    updateDayStatusUI(data.isOpen);
  } catch (err) {
    console.error("fetchDayStatus error:", err);
    if (dayStatusLabel) dayStatusLabel.textContent = "Durum alınamadı";
  }
}

// ===============================
//  ANALİTİK
// ===============================
async function loadAnalytics(weekStart = null) {
  try {
    const qs = weekStart ? `?weekStart=${weekStart}` : '';
    const res = await fetch(`/api/analytics/overview${qs}`);
    const data = await res.json();

    if (!res.ok) {
      console.error("analytics error:", data);
      return;
    }

    const { statsCards, charts, productDetails } = data || {};
    if (!statsCards || !charts) {
      console.warn('analytics: missing stats/cards response, using defaults');
    }

    // Düşük stok sayısı (ürün detaylarından tekrar hesapla)
    let lowStockCount = statsCards.lowStockCount || 0;
    if (Array.isArray(productDetails)) {
      lowStockCount = productDetails.filter((p) => {
        const stockNum = Number(p.stock);
        return !Number.isNaN(stockNum) && stockNum <= LOW_STOCK_LIMIT;
      }).length;
    }

    // Üst kartlar
    statTotalAppointments.textContent = statsCards?.totalAppointments ?? 0;
    statPendingAppointments.textContent = statsCards?.pendingAppointments ?? 0;
    statTotalProducts.textContent = statsCards?.totalProducts ?? 0;

    // Analitik kartlar
    statTotalUsage.textContent = statsCards?.totalUsage ?? 0;
    statLowStockAnalytics.textContent = lowStockCount ?? 0;
    statTotalAppointmentsAnalytics.textContent = statsCards?.totalAppointments ?? 0;

    // En yoğun gün: backend gönderirse kullan, yoksa dailyCounts'tan hesapla
    let busiestDayText = "-";
    if (statsCards?.busiestDay && statsCards.busiestDay.day) {
      busiestDayText = `${statsCards.busiestDay.day} (${statsCards.busiestDay.count} randevu)`;
    } else if (charts?.dailyCounts && typeof charts.dailyCounts === 'object') {
      const entries = Object.entries(charts.dailyCounts);
      if (entries.length > 0) {
        entries.sort((a, b) => b[1] - a[1]);
        const [day, count] = entries[0];
        busiestDayText = `${day} (${count} randevu)`;
      }
    }
    statBusiestDay.textContent = busiestDayText;
    // Gelir kartları
    if (statWeeklyRevenue) statWeeklyRevenue.textContent = formatCurrency(statsCards?.weeklyRevenue ?? 0);
    if (statMonthlyRevenue) statMonthlyRevenue.textContent = formatCurrency(statsCards?.monthlyRevenue ?? 0);
    if (statWeeklyExpense) statWeeklyExpense.textContent = formatCurrency(statsCards?.weeklyExpense ?? 0);
    if (statMonthlyExpense) statMonthlyExpense.textContent = formatCurrency(statsCards?.monthlyExpense ?? statsCards?.weeklyExpense ?? 0);

    // Net fallback: backend göndermezse veya 0 ise gelire-gidere göre hesapla
    const weeklyNetVal = Number(statsCards?.weeklyNet ?? 0);
    const weeklyRevenueVal = Number(statsCards?.weeklyRevenue ?? 0);
    const weeklyExpenseVal = Number(statsCards?.weeklyExpense ?? 0);
    const computedWeeklyNet = weeklyRevenueVal - weeklyExpenseVal;
    if (statWeeklyNet) statWeeklyNet.textContent = formatCurrency(weeklyNetVal || computedWeeklyNet || 0);

    const monthlyNetVal = Number(statsCards?.monthlyNet ?? 0);
    const monthlyRevenueVal = Number(statsCards?.monthlyRevenue ?? weeklyRevenueVal ?? 0);
    const monthlyExpenseVal = Number((statsCards?.monthlyExpense ?? statsCards?.weeklyExpense) ?? 0);
    const computedMonthlyNet = monthlyRevenueVal - monthlyExpenseVal;
    if (statMonthlyNet) statMonthlyNet.textContent = formatCurrency(monthlyNetVal || computedMonthlyNet || 0);
    if (statWeeklyServiceRevenue) statWeeklyServiceRevenue.textContent = formatCurrency(statsCards?.weeklyServiceRevenue ?? 0);
    if (statWeeklyProductRevenue) statWeeklyProductRevenue.textContent = formatCurrency(statsCards?.weeklyProductRevenue ?? 0);
    if (statMonthlyServiceRevenue) statMonthlyServiceRevenue.textContent = formatCurrency(statsCards?.monthlyServiceRevenue ?? 0);
    if (statMonthlyProductRevenue) statMonthlyProductRevenue.textContent = formatCurrency(statsCards?.monthlyProductRevenue ?? 0);

    // Ürün tablosu
    productsTableBody.innerHTML = "";
    if (Array.isArray(productDetails)) {
      productDetails.forEach((p) => {
        const tr = document.createElement("tr");
        tr.innerHTML = `
          <td>${p.name}</td>
          <td>${p.category}</td>
          <td>${p.stock}</td>
          <td>${p.usageCount}</td>
          <td>${p.price} ₺</td>
        `;
        productsTableBody.appendChild(tr);
      });
    }

    // Grafikler
    let topProductsForChart = (charts && charts.topProducts) || [];
    if (Array.isArray(productDetails) && productDetails.length > 0) {
      topProductsForChart = [...productDetails]
        .map((p) => ({ name: p.name, usageCount: Number(p.usageCount || 0) }))
        .sort((a, b) => (b.usageCount || 0) - (a.usageCount || 0))
        .slice(0, 5);
      if (topProductsForChart.length === 0) {
        topProductsForChart = [{ name: 'Ürün yok', usageCount: 0 }];
      }
    }

    renderCharts({ ...(charts || {}), topProducts: topProductsForChart, dailyCounts: charts?.dailyCounts || {}, hourlyCounts: charts?.hourlyCounts || {} });
    await renderServicePieChart();
    renderRevenueExpenseChart(charts || {}, statsCards || {});
    await loadExpenses();
  } catch (err) {
    console.error("loadAnalytics error:", err);
  }
}

// Geçerli seçili haftayı inputtan oku
function getSelectedWeekStart() {
  return analyticsWeekStartInput && analyticsWeekStartInput.value
    ? analyticsWeekStartInput.value
    : null;
}

// Haftalık filtre butonu
if (analyticsRefreshBtn && analyticsWeekStartInput) {
  analyticsRefreshBtn.addEventListener('click', async () => {
    const val = analyticsWeekStartInput.value;
    await loadAnalytics(val || null);
  });
}

// Sayfa yüklenirken varsayılan olarak bu haftanın pazartesini inputa yaz
function setDefaultWeekStart() {
  if (!analyticsWeekStartInput) return;
  const today = new Date();
  const day = today.getDay();
  // Pazartesi=1, Pazar=0 -> pazartesi için fark
  const diff = day === 0 ? -6 : 1 - day;
  const monday = new Date(today);
  monday.setDate(today.getDate() + diff);
  analyticsWeekStartInput.value = monday.toISOString().split('T')[0];
}

// Giderleri yükle ve listele
async function loadExpenses() {
  try {
    const res = await fetch('/api/expenses');
    const data = await res.json();
    expensesGrid.innerHTML = '';
    if (!Array.isArray(data) || data.length === 0) {
      expensesGrid.innerHTML = '<div class="empty-state">Henüz gider eklenmedi.</div>';
      return;
    }
    data.forEach((e) => {
      const card = document.createElement('div');
      card.className = 'product-card';
      const d = new Date(e.date);
      card.innerHTML = `
        <div class="product-card-header">
          <div><div class="product-name">${e.category || 'Gider'}</div></div>
          <div class="product-card-actions"><button class="icon-btn delete-expense" data-id="${e.id}">🗑</button></div>
        </div>
        <div class="product-card-body">
          <div class="product-price">${formatCurrency(e.amount)}</div>
          <div class="product-usage-line">${d.toLocaleDateString('tr-TR')}</div>
          <div class="product-usage-line">${e.notes || ''}</div>
        </div>
      `;
      expensesGrid.appendChild(card);
    });
  } catch (err) {
    console.error('loadExpenses error:', err);
    expensesGrid.innerHTML = '<div class="empty-state">Giderler yüklenirken hata oluştu.</div>';
  }
}

// Add new expense
if (addExpenseBtn) {
  addExpenseBtn.addEventListener('click', async (e) => {
    e.preventDefault();
    const amount = parseFloat(expenseAmountInput.value || '0');
    const category = expenseCategoryInput.value.trim();
    const date = expenseDateInput.value || new Date().toISOString().split('T')[0];
    const notes = expenseNotesInput.value.trim();
    if (!amount || isNaN(amount)) {
      alert('Geçerli bir tutar girin.');
      return;
    }
    try {
      const res = await fetch('/api/expenses', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ amount, category, date, notes }),
      });
      const data = await res.json();
      if (!res.ok) {
        alert(data.message || 'Gider eklenemedi.');
        return;
      }
      expenseAmountInput.value = '';
      expenseCategoryInput.value = '';
      expenseDateInput.value = '';
      expenseNotesInput.value = '';
      await loadAnalytics(getSelectedWeekStart());
    } catch (err) {
      console.error('addExpense error', err);
      alert('Gider eklenirken hata oluştu.');
    }
  });
}

// Delete expense (event delegation)
if (expensesGrid) {
  expensesGrid.addEventListener('click', async (e) => {
    if (!e.target.classList.contains('delete-expense')) return;
    const id = e.target.dataset.id;
    const onay = confirm('Bu gideri silmek istiyor musunuz?');
    if (!onay) return;
    try {
      const res = await fetch(`/api/expenses/${id}`, { method: 'DELETE' });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        alert((data && data.message) || 'Gider silinemedi.');
        return;
      }
      await loadExpenses();
      await loadAnalytics(getSelectedWeekStart());
    } catch (err) {
      console.error('deleteExpense error', err);
      alert('Gider silinirken hata oluştu.');
    }
  });
}

// Bar ve çizgi grafikler
function renderCharts(charts) {
  const { topProducts, dailyCounts, hourlyCounts } = charts;

  // Top ürünler
  const labelsTop = topProducts.map((p) => p.name);
  const dataTop = topProducts.map((p) => p.usageCount);

  if (chartTopProducts) chartTopProducts.destroy();
  chartTopProducts = new Chart(
    document.getElementById("chart-top-products"),
    {
      type: "bar",
      data: {
        labels: labelsTop,
        datasets: [
          {
            label: "Kullanım",
            data: dataTop,
          },
        ],
      },
      options: {
        responsive: true,
      },
    }
  );

  // Günlük
  const labelsDaily = Object.keys(dailyCounts);
  const dataDaily = Object.values(dailyCounts);

  if (chartDaily) chartDaily.destroy();
  chartDaily = new Chart(document.getElementById("chart-daily"), {
    type: "bar",
    data: {
      labels: labelsDaily,
      datasets: [
        {
          label: "Randevu Sayısı",
          data: dataDaily,
        },
      ],
    },
    options: {
      responsive: true,
    },
  });

  // Saatlik
  const labelsHourly = Object.keys(hourlyCounts);
  const dataHourly = Object.values(hourlyCounts);

  if (chartHourly) chartHourly.destroy();
  chartHourly = new Chart(document.getElementById("chart-hourly"), {
    type: "line",
    data: {
      labels: labelsHourly,
      datasets: [
        {
          label: "Randevu Sayısı",
          data: dataHourly,
          tension: 0.3,
        },
      ],
    },
    options: {
      responsive: true,
    },
  });
}

let chartRevenueExpense = null;
function renderRevenueExpenseChart(charts, statsCards = {}) {
  try {
    const rev = (charts.revenueByDay && charts.revenueByDay.revenueByDay) || [];
    const serviceRev = (charts.serviceRevenueByDay && charts.serviceRevenueByDay.revenueByDay) || [];
    const productRev = (charts.productRevenueByDay && charts.productRevenueByDay.revenueByDay) || [];
    const exp = (charts.expenseByDay && charts.expenseByDay.expenseByDay) || [];
    let dates = (charts.revenueByDay && charts.revenueByDay.dates) || (charts.expenseByDay && charts.expenseByDay.dates) || [];

    // Eğer günlük veriler boşsa, karttaki aylık toplamlara göre iki noktalı yumuşak bir çizgi çiz
    const dailySum = [...rev, ...serviceRev, ...productRev, ...exp].reduce((s, v) => s + Math.abs(Number(v) || 0), 0);
    const hasDailyData = dates.length > 0 && dailySum > 0;

    if (!hasDailyData) {
      dates = ['Ayın İlk Yarısı', 'Ayın İkinci Yarısı'];
      const monthlyRevenue = Number(statsCards.monthlyRevenue || 0);
      const monthlyServiceRevenue = Number(statsCards.monthlyServiceRevenue || 0);
      const monthlyProductRevenue = Number(statsCards.monthlyProductRevenue || 0);
      const monthlyExpense = Number(statsCards.monthlyExpense || 0);

      // İki yarıya aynı değeri koyarak düz ama belirgin bir çizgi elde et
      rev.length = 0; rev.push(monthlyRevenue, monthlyRevenue);
      serviceRev.length = 0; serviceRev.push(monthlyServiceRevenue, monthlyServiceRevenue);
      productRev.length = 0; productRev.push(monthlyProductRevenue, monthlyProductRevenue);
      exp.length = 0; exp.push(monthlyExpense, monthlyExpense);
    }
    const ctx = document.getElementById('chart-revenue-expense');
    if (!ctx) return;
    if (chartRevenueExpense) chartRevenueExpense.destroy();
    chartRevenueExpense = new Chart(ctx, {
      type: 'line',
      data: {
        labels: dates.map(d => {
          // "Bu Ay" gibi hazır etiketleri aynen kullan
          if (d === 'Bu Ay') return d;
          const dt = new Date(d);
          return isNaN(dt) ? d : dt.toLocaleDateString('tr-TR');
        }),
        datasets: [
          { label: 'Toplam Gelir', data: rev, borderColor: 'rgba(16,185,129,1)', backgroundColor: 'rgba(16,185,129,0.12)', tension: 0.35, pointRadius: 5, pointHoverRadius: 6, borderWidth: 3, fill: true },
          { label: 'Hizmet Geliri', data: serviceRev, borderColor: 'rgba(59,130,246,1)', backgroundColor: 'rgba(59,130,246,0.12)', tension: 0.35, pointRadius: 5, pointHoverRadius: 6, borderWidth: 3, fill: true },
          { label: 'Ürün Geliri', data: productRev, borderColor: 'rgba(234,179,8,1)', backgroundColor: 'rgba(234,179,8,0.12)', tension: 0.35, pointRadius: 5, pointHoverRadius: 6, borderWidth: 3, fill: true },
          { label: 'Gider', data: exp, borderColor: 'rgba(239,68,68,1)', backgroundColor: 'rgba(239,68,68,0.12)', tension: 0.35, pointRadius: 5, pointHoverRadius: 6, borderWidth: 3, fill: true },
        ],
      },
      options: {
        responsive: true,
        scales: { y: { beginAtZero: true } },
        plugins: { legend: { position: 'top' } },
      },
    });
  } catch (err) {
    console.error('renderRevenueExpenseChart error:', err);
  }
}

// HİZMET TERCİH DAĞILIMI (PASTA GRAFİĞİ)
async function renderServicePieChart() {
  try {
    const res = await fetch("/api/appointments");
    const data = await res.json();

    if (!Array.isArray(data) || data.length === 0) {
      if (chartServicePie) {
        chartServicePie.destroy();
        chartServicePie = null;
      }
      return;
    }

    const validAppointments = data.filter((a) => a.status !== "cancelled");
    const serviceCounts = {};

    validAppointments.forEach((appt) => {
      if (!appt.notes) return;

      const firstPart = appt.notes.split(" | ")[0];
      if (!firstPart) return;

      const services = firstPart
        .split(",")
        .map((s) => s.trim())
        .filter(Boolean);

      services.forEach((name) => {
        serviceCounts[name] = (serviceCounts[name] || 0) + 1;
      });
    });

    const labels = Object.keys(serviceCounts);
    const values = Object.values(serviceCounts);

    if (labels.length === 0) {
      if (chartServicePie) {
        chartServicePie.destroy();
        chartServicePie = null;
      }
      return;
    }

    const baseColors = [
      "rgba(59, 130, 246, 0.9)",
      "rgba(239, 68, 68, 0.9)",
      "rgba(16, 185, 129, 0.9)",
      "rgba(234, 179, 8, 0.9)",
      "rgba(139, 92, 246, 0.9)",
      "rgba(236, 72, 153, 0.9)",
      "rgba(14, 165, 233, 0.9)",
      "rgba(248, 113, 113, 0.9)",
    ];

    const backgroundColors = labels.map(
      (_, idx) => baseColors[idx % baseColors.length]
    );
    const borderColors = backgroundColors.map((c) => c.replace("0.9", "1"));

    if (chartServicePie) chartServicePie.destroy();

    const ctx = document.getElementById("chart-service-pie");
    if (!ctx) return;

    chartServicePie = new Chart(ctx, {
      type: "pie",
      data: {
        labels,
        datasets: [
          {
            data: values,
            backgroundColor: backgroundColors,
            borderColor: borderColors,
            borderWidth: 1,
          },
        ],
      },
      options: {
        responsive: true,
        plugins: {
          legend: {
            position: "bottom",
          },
          datalabels:{
             color: "#fff",
        font: {
          weight: "bold",
          size: 14,
          }
        },
        formatter:(value,ctx)=>{
          const total = ctx.chart.data.datasets[0].data.reduce(
            (sum, val) => sum + val,
            0
          );
          const percentage = ((value / total) * 100).toFixed(1);
          return percentage + "%";
        }
      }
      },
        plugins: [ChartDataLabels],
    });
  } catch (err) {
    console.error("renderServicePieChart error:", err);
  }
}

// ===============================
//  GÜN DURUMU INIT
// ===============================
if (dayStatusDateInput) {
  const todayStr = new Date().toISOString().split("T")[0];
  dayStatusDateInput.value = todayStr;

  refreshDayOverview();

  dayStatusDateInput.addEventListener("change", () => {
    refreshDayOverview();
    loadAppointments(dayStatusDateInput.value || null);
  });
}

if (toggleDayStatusBtn) {
  toggleDayStatusBtn.addEventListener("click", async () => {
    try {
      const dateStr = dayStatusDateInput.value;
      const res = await fetch("/api/barber/day-status", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ date: dateStr }),
      });

      const data = await res.json();
      if (!res.ok) {
        alert(data.message || "Gün durumu güncellenemedi.");
        return;
      }

      refreshDayOverview();
    } catch (err) {
      console.error("toggleDayStatus error:", err);
      alert("Sunucu hatası.");
    }
  });
}

// ===============================
//  SAYFA YÜKLENİNCE
// ===============================
(async function init() {
  await loadAppointments(dayStatusDateInput.value || null);
  await loadProducts();
  await loadServices();
  setDefaultWeekStart();
  const defaultWeek = analyticsWeekStartInput ? analyticsWeekStartInput.value : null;
  await loadAnalytics(defaultWeek || null);

  if (dayStatusDateInput) {
    const todayStr = dayStatusDateInput.value;
    fetchDayStatus(todayStr);
  }
})();
