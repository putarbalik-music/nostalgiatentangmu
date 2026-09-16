const ADMIN_WHATSAPP = "6281335992224";

const sizes = [
  { name: "S", price: 175000 },
  { name: "M", price: 175000 },
  { name: "L", price: 175000 },
  { name: "XL", price: 175000 },
  { name: "XXL", price: 185000 },
];

const quantities = Object.fromEntries(sizes.map(({ name }) => [name, 0]));
const currency = new Intl.NumberFormat("id-ID", {
  style: "currency",
  currency: "IDR",
  maximumFractionDigits: 0,
});

const orderForm = document.querySelector("#orderForm");
const sizeOptions = document.querySelector("#sizeOptions");
const sizeError = document.querySelector("#sizeError");
const summaryItems = document.querySelector("#summaryItems");
const summaryQuantity = document.querySelector("#summaryQuantity");
const summaryTotal = document.querySelector("#summaryTotal");
const bottomQuantity = document.querySelector("#bottomQuantity");
const bottomTotal = document.querySelector("#bottomTotal");
const toast = document.querySelector("#toast");

function formatCurrency(value) {
  return currency.format(value).replace(/\s/g, "");
}

function calculateOrder() {
  return sizes.reduce(
    (result, size) => {
      const quantity = quantities[size.name];
      result.quantity += quantity;
      result.total += quantity * size.price;
      return result;
    },
    { quantity: 0, total: 0 },
  );
}

function renderSizeOptions() {
  sizeOptions.innerHTML = sizes
    .map(
      (size) => `
        <div class="size-option" data-size-card="${size.name}">
          <span class="size-label">${size.name}</span>
          <span class="size-price">${formatCurrency(size.price)} / pcs</span>
          <div class="quantity-control">
            <button type="button" data-action="decrease" data-size="${size.name}" aria-label="Kurangi ukuran ${size.name}">−</button>
            <output aria-live="polite" aria-label="Jumlah ukuran ${size.name}">${quantities[size.name]}</output>
            <button type="button" data-action="increase" data-size="${size.name}" aria-label="Tambah ukuran ${size.name}">+</button>
          </div>
        </div>`,
    )
    .join("");
}

function renderSummary() {
  const selectedSizes = sizes.filter((size) => quantities[size.name] > 0);
  const { quantity, total } = calculateOrder();

  summaryItems.innerHTML = selectedSizes.length
    ? selectedSizes
        .map(
          (size) => `
            <div class="summary-item">
              <span>Ukuran ${size.name} × ${quantities[size.name]}</span>
              <strong>${formatCurrency(size.price * quantities[size.name])}</strong>
            </div>`,
        )
        .join("")
    : '<p class="empty-summary">Belum ada ukuran yang dipilih.</p>';

  summaryQuantity.textContent = `${quantity} pcs`;
  summaryTotal.textContent = formatCurrency(total);
  bottomQuantity.textContent = quantity;
  bottomTotal.textContent = formatCurrency(total);

  sizes.forEach((size) => {
    const card = document.querySelector(`[data-size-card="${size.name}"]`);
    card?.classList.toggle("selected", quantities[size.name] > 0);
  });

  if (quantity > 0) sizeError.textContent = "";
}

sizeOptions.addEventListener("click", (event) => {
  const button = event.target.closest("button[data-size]");
  if (!button) return;

  const selectedSize = button.dataset.size;
  const difference = button.dataset.action === "increase" ? 1 : -1;
  quantities[selectedSize] = Math.max(0, Math.min(99, quantities[selectedSize] + difference));

  const output = button.parentElement.querySelector("output");
  output.textContent = quantities[selectedSize];
  renderSummary();
});

document.querySelectorAll(".thumbnail").forEach((button) => {
  button.addEventListener("click", () => {
    const mainImage = document.querySelector("#mainProductImage");
    if (mainImage.src.endsWith(button.dataset.image)) return;

    document.querySelectorAll(".thumbnail").forEach((item) => item.classList.remove("active"));
    button.classList.add("active");
    mainImage.classList.add("is-changing");

    const preload = new Image();
    preload.onload = () => {
      mainImage.src = button.dataset.image;
      mainImage.alt = button.dataset.alt;
      requestAnimationFrame(() => mainImage.classList.remove("is-changing"));
    };
    preload.src = button.dataset.image;
  });
});

function showToast(message) {
  toast.textContent = message;
  toast.classList.add("show");
  window.clearTimeout(showToast.timeout);
  showToast.timeout = window.setTimeout(() => toast.classList.remove("show"), 2600);
}

document.querySelector("#copyAccount").addEventListener("click", async () => {
  try {
    await navigator.clipboard.writeText("1370016221398");
    showToast("Nomor rekening berhasil disalin.");
  } catch {
    showToast("Nomor rekening: 1370016221398");
  }
});

const validators = {
  name: (value) => (value.trim().length >= 3 ? "" : "Nama lengkap minimal 3 karakter."),
  phone: (value) => (/^(?:\+62|62|0)8[1-9][0-9]{7,11}$/.test(value.replace(/[\s-]/g, "")) ? "" : "Masukkan nomor WhatsApp Indonesia yang valid."),
  address: (value) => (value.trim().length >= 10 ? "" : "Tuliskan alamat lengkap minimal 10 karakter."),
};

function validateField(field) {
  const message = validators[field.name]?.(field.value) ?? "";
  const wrapper = field.closest(".field");
  wrapper.classList.toggle("invalid", Boolean(message));
  wrapper.querySelector(".field-error").textContent = message;
  field.setAttribute("aria-invalid", String(Boolean(message)));
  return !message;
}

Object.keys(validators).forEach((name) => {
  const field = orderForm.elements[name];
  if (!field) return;

  field.addEventListener("blur", () => validateField(field));
  field.addEventListener("input", () => {
    if (field.closest(".field").classList.contains("invalid")) validateField(field);
  });
});

function buildWhatsAppMessage(formData) {
  const { quantity, total } = calculateOrder();
  const orderLines = sizes
    .filter((size) => quantities[size.name] > 0)
    .map((size) => `- ${size.name} × ${quantities[size.name]} = ${formatCurrency(size.price * quantities[size.name])}`)
    .join("\n");

  const address = formData.get("address").trim();

  return [
    "Halo Admin Tika, saya ingin memesan Merch Putar Balik edisi Nostalgia Tentangmu.",
    "",
    "*DATA PEMESAN*",
    `Nama: ${formData.get("name").trim()}`,
    `No. WhatsApp: ${formData.get("phone").trim()}`,
    `Alamat: ${address}`,
    "",
    "*DETAIL PESANAN*",
    orderLines,
    "",
    `Total barang: ${quantity} pcs`,
    `Subtotal: ${formatCurrency(total)}`,
    "Ongkir: Belum termasuk",
    "",
    `Catatan: ${formData.get("note").trim() || "-"}`,
    "",
    "Tunggu sebentar ya kak, Admin Tika akan menghitungkan ongkirnya sesuai tujuan alamat pengiriman dan akan menginfokan total yang harus dibayar.",
  ].join("\n");
}

orderForm.addEventListener("submit", (event) => {
  event.preventDefault();

  const fields = Object.keys(validators)
    .map((name) => orderForm.elements[name])
    .filter(Boolean);
  const invalidFields = fields.filter((field) => !validateField(field));
  const { quantity } = calculateOrder();

  if (quantity === 0) {
    sizeError.textContent = "Pilih minimal satu ukuran kaos.";
  }

  if (invalidFields.length || quantity === 0) {
    const target = invalidFields[0] || sizeOptions;
    target.scrollIntoView({ behavior: "smooth", block: "center" });
    invalidFields[0]?.focus({ preventScroll: true });
    showToast("Mohon lengkapi data pemesanan terlebih dahulu.");
    return;
  }

  const message = buildWhatsAppMessage(new FormData(orderForm));
  const whatsappUrl = ADMIN_WHATSAPP
    ? `https://wa.me/${ADMIN_WHATSAPP}?text=${encodeURIComponent(message)}`
    : `https://api.whatsapp.com/send?text=${encodeURIComponent(message)}`;

  window.open(whatsappUrl, "_blank", "noopener,noreferrer");
});

renderSizeOptions();
renderSummary();
