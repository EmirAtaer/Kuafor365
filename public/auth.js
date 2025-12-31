// =======================================
// GECE MODU FONKSİYONLARI
// =======================================
function initDarkMode() {
  const darkModeToggle = document.getElementById("dark-mode-toggle");
  const savedDarkMode = localStorage.getItem("darkMode");
  
  // Eğer daha önce gece modu açılmışsa, sayfa açılırken uygula
  if (savedDarkMode === "true") {
    document.body.classList.add("dark-mode");
  }
  
  // Toggle butonuna tıklama olayı ekle
  if (darkModeToggle) {
    darkModeToggle.addEventListener("click", () => {
      document.body.classList.toggle("dark-mode");
      const isDarkMode = document.body.classList.contains("dark-mode");
      localStorage.setItem("darkMode", isDarkMode);
      
      // İkon değiştir
      darkModeToggle.textContent = isDarkMode ? "☀️" : "🌙";
    });
    
    // İkonu ayarla
    const isDarkMode = document.body.classList.contains("dark-mode");
    darkModeToggle.textContent = isDarkMode ? "☀️" : "🌙";
  }
}

// Sayfa yüklendiğinde gece modu başlat
document.addEventListener("DOMContentLoaded", initDarkMode);
// =======================================

// Rol ve mod state
let currentRole = "customer"; // "customer" | "barber"
let currentMode = "login"; // "login" | "register"

const roleButtons = document.querySelectorAll("#role-toggle .toggle-btn");
const modeButtons = document.querySelectorAll("#mode-toggle .toggle-btn");

const form = document.getElementById("auth-form");
const fullNameInput = document.getElementById("fullName");
const emailInput = document.getElementById("email");
const phoneInput = document.getElementById("phone");
const passwordInput = document.getElementById("password");
const submitBtn = document.getElementById("submit-btn");
const messageEl = document.getElementById("auth-message");
const barberCodeGroup = document.getElementById("barber-code-group");

// KUAFÖR KODU ALANINI ROLE + MODE'A GÖRE GÖSTER/GİZLE
function updateBarberCodeVisibility() {
  if (currentRole === "barber" && currentMode === "register") {
    barberCodeGroup.style.display = "flex";
  } else {
    barberCodeGroup.style.display = "none";
  }
}

// Rol toggle
roleButtons.forEach((btn) => {
  btn.addEventListener("click", () => {
    roleButtons.forEach((b) => b.classList.remove("active"));
    btn.classList.add("active");
    currentRole = btn.dataset.role; // "customer" | "barber"
    updateBarberCodeVisibility();
  });
});

// Mod toggle
modeButtons.forEach((btn) => {
  btn.addEventListener("click", () => {
    modeButtons.forEach((b) => b.classList.remove("active"));
    btn.classList.add("active");
    currentMode = btn.dataset.mode; // "login" | "register"
    updateFormForMode();
    updateBarberCodeVisibility();
  });
});

function updateFormForMode() {
  const nameGroup = document.querySelector(".form-group-name");
  const phoneGroup = document.querySelector(".form-group-phone");

  if (currentMode === "login") {
    nameGroup.style.display = "none";
    phoneGroup.style.display = "none";
    submitBtn.textContent = "Giriş Yap";
  } else {
    nameGroup.style.display = "flex";
    phoneGroup.style.display = "flex";
    submitBtn.textContent = "Kayıt Ol";
  }
}

// İlk durumda login ekranı
updateFormForMode();

// Form submit
form.addEventListener("submit", async (e) => {
  e.preventDefault();
  messageEl.textContent = "";

  const email = emailInput.value.trim();
  const password = passwordInput.value.trim();
  const fullName = fullNameInput.value.trim();
  const phone = phoneInput.value.trim();

  if (!email || !password) {
    messageEl.textContent = "E-posta ve şifre zorunludur.";
    messageEl.style.color = "#b91c1c";
    return;
  }

  let url;
  let body;

  if (currentMode === "login") {
    url = "/api/auth/login";
    body = { email, password };
  } else {
    if (!fullName) {
      messageEl.textContent = "Kayıt için ad soyad gereklidir.";
      messageEl.style.color = "#b91c1c";
      return;
    }

    url = "/api/auth/register";
    body = {
  fullName,
  email,
  password,
  phone,
  role: currentRole,
};
if (currentRole === "barber") {
  body.inviteCode = document.getElementById("inviteCode").value.trim();
}
  }

  try {
    const res = await fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });

    const data = await res.json();

    if (!res.ok) {
      messageEl.textContent =
        data.message || "İşlem sırasında bir hata oluştu.";
      messageEl.style.color = "#b91c1c"; // kırmızı
      return;
    }

    // Başarılı durumlar
    if (currentMode === "register") {
      messageEl.textContent = "Kayıt başarılı! Şimdi giriş yapabilirsiniz.";
      messageEl.style.color = "#15803d"; // yeşil
      // otomatik login moduna geçir
      currentMode = "login";
      modeButtons.forEach((b) =>
        b.classList.toggle("active", b.dataset.mode === "login")
      );
      updateFormForMode();
        } else {
      messageEl.textContent = "Giriş başarılı, yönlendiriliyorsunuz...";
      messageEl.style.color = "#15803d";

     // Kullanıcı bilgisini her durumda sakla
if (data.user) {
  localStorage.setItem("authUser", JSON.stringify(data.user));
}

// İleride token eklersek onu da ayrıca saklarız
if (data.token) {
  localStorage.setItem("authToken", data.token);
}


      // Kullanıcının rolüne göre yönlendir
      const userRole = data.user && data.user.role;

      setTimeout(() => {
        if (userRole === "barber") {
          // Kuaför paneli
          window.location.href = "barber-dashboard.html";
        } else {
          // Müşteri veya diğer tüm roller
          window.location.href = "dashboard.html";
        }
      }, 800);
    }

  } catch (err) {
    console.error(err);
    messageEl.textContent = "Sunucuya bağlanırken bir hata oluştu.";
    messageEl.style.color = "#b91c1c";
  }
});

// İlk yüklemede barber kod grubunu gizle
updateBarberCodeVisibility();
