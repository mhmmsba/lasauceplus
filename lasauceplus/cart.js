/* =========================================================
   La Sauce+ — منطق السلة (يُستعمل في index.html و cart.html)
   ========================================================= */

/* -------- إعدادات بوت التيليغرام --------
   1) أنشئ بوت جديد عبر @BotFather في تيليغرام و انسخ الـ TOKEN
   2) أرسل أي رسالة للبوت من حسابك، ثم افتح الرابط التالي في المتصفح:
      https://api.telegram.org/bot<TOKEN>/getUpdates
      و انسخ رقم "chat":{"id": ...}
   3) ضع القيمتين هنا تحت بدل القيم الوهمية
--------------------------------------------------------- */
const TELEGRAM_CONFIG = {
  BOT_TOKEN: "8496165325:AAFY7RreMyfnIB9DkRogSCtL-3S19RL2wKI",
  CHAT_ID: "8287007066"
};

/* -------- قائمة المشروبات المقترحة (يمكنك تعديل الأسعار) -------- */
const DRINKS_CATALOG = [
  { id: "water-05", category: "ماء", name: "ماء 0.5 لتر", price: 30 },
  { id: "water-15", category: "ماء", name: "ماء 1.5 لتر", price: 50 },
  { id: "juice-05", category: "عصير", name: "عصير 0.5 لتر", price: 80 },
  { id: "juice-1",  category: "عصير", name: "عصير 1 لتر",   price: 150 },
  { id: "juice-2",  category: "عصير", name: "عصير 2 لتر",   price: 280 },
  { id: "soda-05",  category: "عصير غازي", name: "عصير غازي 0.5 لتر", price: 70 },
  { id: "soda-1",   category: "عصير غازي", name: "عصير غازي 1 لتر",   price: 130 },
  { id: "soda-2",   category: "عصير غازي", name: "عصير غازي 2 لتر",   price: 250 }
];

const CART_KEY = "lasauce_cart";

/* -------- تخزين السلة -------- */
function getCart() {
  try {
    return JSON.parse(localStorage.getItem(CART_KEY)) || [];
  } catch (e) {
    return [];
  }
}

function saveCart(cart) {
  localStorage.setItem(CART_KEY, JSON.stringify(cart));
  updateCartBadge();
}

function cartCount() {
  return getCart().reduce((sum, item) => sum + item.qty, 0);
}

function cartTotal() {
  return getCart().reduce((sum, item) => sum + item.qty * item.price, 0);
}

/* -------- شارة العدد في زر السلة -------- */
function updateCartBadge() {
  const count = cartCount();
  document.querySelectorAll(".cart-badge").forEach((badge) => {
    badge.textContent = count;
    badge.style.display = count > 0 ? "flex" : "none";
    badge.classList.remove("pulse");
    void badge.offsetWidth; /* لإعادة تشغيل الأنيميشن */
    badge.classList.add("pulse");
  });
}

/* -------- إضافة منتج للسلة -------- */
function addToCart(id, name, price) {
  const cart = getCart();
  const existing = cart.find((item) => item.id === id);
  if (existing) {
    existing.qty += 1;
  } else {
    cart.push({ id, name, price, qty: 1 });
  }
  saveCart(cart);
  showToast(`تمت إضافة "${name}" إلى السلة ✅`);
  if (typeof renderCartPage === "function") renderCartPage();
}

/* -------- حذف منتج من السلة -------- */
function removeFromCart(id) {
  let cart = getCart();
  cart = cart.filter((item) => item.id !== id);
  saveCart(cart);
  if (typeof renderCartPage === "function") renderCartPage();
}

/* -------- تعديل الكمية -------- */
function changeQty(id, delta) {
  const cart = getCart();
  const item = cart.find((i) => i.id === id);
  if (!item) return;
  item.qty += delta;
  if (item.qty <= 0) {
    removeFromCart(id);
    return;
  }
  saveCart(cart);
  if (typeof renderCartPage === "function") renderCartPage();
}

function clearCart() {
  saveCart([]);
  if (typeof renderCartPage === "function") renderCartPage();
}

/* -------- إشعار بسيط (Toast) -------- */
function showToast(message) {
  let toast = document.getElementById("cart-toast");
  if (!toast) {
    toast = document.createElement("div");
    toast.id = "cart-toast";
    document.body.appendChild(toast);
  }
  toast.textContent = message;
  toast.classList.remove("show");
  void toast.offsetWidth;
  toast.classList.add("show");
  clearTimeout(toast._timer);
  toast._timer = setTimeout(() => toast.classList.remove("show"), 2200);
}

/* -------- إرسال الطلبية إلى بوت التيليغرام -------- */
async function sendOrderToTelegram(customer, cart, total) {
  const orderTypeLabel = customer.orderType === "delivery" ? "توصيل" : "في المحل";
  let lines = [];
  lines.push("🛎️ طلبية جديدة — La Sauce+");
  lines.push("");
  lines.push(`👤 الاسم: ${customer.fullName}`);
  lines.push(`📞 الهاتف: ${customer.phone}`);
  lines.push(`🚚 نوع الطلب: ${orderTypeLabel}`);
  lines.push("");
  lines.push("🧾 الطلبات:");
  cart.forEach((item) => {
    lines.push(`• ${item.name} × ${item.qty} = ${item.qty * item.price} دج`);
  });
  lines.push("");
  lines.push(`💰 المجموع: ${total} دج`);

  const text = lines.join("\n");
  const url = `https://api.telegram.org/bot${TELEGRAM_CONFIG.BOT_TOKEN}/sendMessage`;

  const response = await fetch(url, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      chat_id: TELEGRAM_CONFIG.CHAT_ID,
      text: text
    })
  });

  if (!response.ok) {
    throw new Error("فشل إرسال الطلبية إلى تيليغرام");
  }
  return response.json();
}

document.addEventListener("DOMContentLoaded", updateCartBadge);
