(() => {
  const storageKey = "ladhat-broast-cart";
  const branchSelect = document.querySelector("[data-branch-select]");
  const cartDialog = document.querySelector("[data-cart-dialog]");
  const cartItems = document.querySelector("[data-cart-items]");
  const cartEmpty = document.querySelector("[data-cart-empty]");
  const totalOutput = document.querySelector("[data-cart-total]");
  const numberFormat = new Intl.NumberFormat("ar-SA", { maximumFractionDigits: 0 });
  let cart = [];

  try {
    const storedCart = JSON.parse(localStorage.getItem(storageKey) || "[]");
    if (Array.isArray(storedCart)) {
      cart = storedCart.filter((item) => item && typeof item.id === "string" && typeof item.name === "string" && Number.isFinite(item.price) && Number.isInteger(item.quantity) && item.quantity > 0);
    }
  } catch {
    cart = [];
  }

  function saveCart() {
    try {
      localStorage.setItem(storageKey, JSON.stringify(cart));
    } catch {
      showToast("تعذر حفظ السلة على هذا الجهاز.");
    }
  }

  function formatPrice(value) {
    return `${numberFormat.format(value)} ر.س`;
  }

  function updateCart() {
    const itemCount = cart.reduce((sum, item) => sum + item.quantity, 0);
    const total = cart.reduce((sum, item) => sum + item.price * item.quantity, 0);
    document.querySelectorAll("[data-cart-count]").forEach((element) => {
      element.textContent = numberFormat.format(itemCount);
    });
    if (totalOutput) totalOutput.textContent = formatPrice(total);
    if (!cartItems) return;

    cartItems.replaceChildren();
    cartEmpty.hidden = cart.length > 0;
    cart.forEach((item) => {
      const row = document.createElement("article");
      row.className = "cart-item";

      const details = document.createElement("div");
      details.className = "cart-item-details";
      const name = document.createElement("h3");
      name.textContent = item.variant ? `${item.name} - ${item.variant}` : item.name;
      const lineTotal = document.createElement("span");
      lineTotal.textContent = formatPrice(item.price * item.quantity);
      details.append(name, lineTotal);

      const controls = document.createElement("div");
      controls.className = "quantity-controls";
      controls.setAttribute("aria-label", `كمية ${item.name}${item.variant ? ` ${item.variant}` : ""}`);
      const itemLabel = `${item.name}${item.variant ? ` ${item.variant}` : ""}`;
      const decrease = createQuantityButton("−", "decrease", item.id, `تقليل كمية ${itemLabel}`);
      const quantity = document.createElement("span");
      quantity.textContent = numberFormat.format(item.quantity);
      const increase = createQuantityButton("＋", "increase", item.id, `زيادة كمية ${itemLabel}`);
      decrease.dataset.variant = item.variant || "";
      increase.dataset.variant = item.variant || "";
      controls.append(decrease, quantity, increase);
      row.append(details, controls);
      cartItems.append(row);
    });
  }

  function createQuantityButton(label, action, id, accessibleName) {
    const button = document.createElement("button");
    button.type = "button";
    button.textContent = label;
    button.dataset.cartAction = action;
    button.dataset.id = id;
    button.setAttribute("aria-label", accessibleName);
    return button;
  }

  function installProductVariants() {
    const variantExceptions = new Set(["fries-large", "fries-small", "tex-fries", "salad"]);
    document.querySelectorAll("[data-add-to-cart]").forEach((button) => {
      if (variantExceptions.has(button.dataset.id)) return;
      const product = button.closest(".product-card");
      if (!product || product.querySelector("[data-variant-select]")) return;

      const label = document.createElement("label");
      label.className = "product-variant";
      const labelText = document.createElement("span");
      labelText.textContent = "النكهة";
      const select = document.createElement("select");
      select.dataset.variantSelect = "";
      select.setAttribute("aria-label", `نكهة ${button.dataset.name}`);
      ["عادي", "حراق"].forEach((variant) => {
        const option = document.createElement("option");
        option.value = variant;
        option.textContent = variant;
        select.append(option);
      });
      label.append(labelText, select);
      product.insertBefore(label, product.querySelector(".product-buy"));
    });
  }

  function installThemeToggle() {
    let savedTheme = "light";
    try {
      savedTheme = localStorage.getItem("ladhat-broast-theme") === "dark" ? "dark" : "light";
    } catch {
      savedTheme = "light";
    }
    document.documentElement.dataset.theme = savedTheme;

    document.querySelectorAll(".site-header").forEach((header) => {
      const toggle = document.createElement("button");
      toggle.type = "button";
      toggle.className = "theme-toggle";
      toggle.setAttribute("aria-pressed", String(savedTheme === "dark"));
      toggle.setAttribute("aria-label", "تبديل الوضع الليلي والنهاري");
      const icon = document.createElement("span");
      icon.className = "theme-icon";
      icon.setAttribute("aria-hidden", "true");
      const text = document.createElement("span");
      const updateLabel = (theme) => {
        const isDark = theme === "dark";
        icon.textContent = isDark ? "☀" : "☾";
        text.textContent = isDark ? "الوضع النهاري" : "الوضع الليلي";
        toggle.setAttribute("aria-pressed", String(isDark));
      };
      toggle.append(icon, text);
      updateLabel(savedTheme);
      toggle.addEventListener("click", () => {
        const theme = document.documentElement.dataset.theme === "dark" ? "light" : "dark";
        document.documentElement.dataset.theme = theme;
        updateLabel(theme);
        try {
          localStorage.setItem("ladhat-broast-theme", theme);
        } catch {
          showToast("لن يُحفظ اختيار المظهر بعد إغلاق الصفحة.");
        }
      });
      header.insertBefore(toggle, header.querySelector("[data-open-cart]"));
    });
  }

  installThemeToggle();
  installProductVariants();

  function showToast(message) {
    let toast = document.querySelector("[data-toast]");
    if (!toast) {
      toast = document.createElement("div");
      toast.dataset.toast = "";
      toast.className = "site-toast";
      toast.setAttribute("role", "status");
      toast.setAttribute("aria-live", "polite");
      document.body.append(toast);
    }
    toast.textContent = message;
    toast.classList.add("is-visible");
    window.clearTimeout(showToast.timeout);
    showToast.timeout = window.setTimeout(() => toast.classList.remove("is-visible"), 2600);
  }

  function openWhatsApp(phone, message) {
    const url = `https://wa.me/${phone}?text=${encodeURIComponent(message)}`;
    window.open(url, "_blank", "noopener,noreferrer");
  }

  document.querySelectorAll("[data-open-cart]").forEach((button) => {
    button.addEventListener("click", () => cartDialog?.showModal());
  });

  document.querySelectorAll("[data-close-cart]").forEach((button) => {
    button.addEventListener("click", () => cartDialog?.close());
  });

  cartDialog?.addEventListener("click", (event) => {
    if (event.target === cartDialog) cartDialog.close();
  });

  document.querySelectorAll("[data-add-to-cart]").forEach((button) => {
    button.addEventListener("click", () => {
      const id = button.dataset.id;
      const variant = button.closest(".product-card")?.querySelector("[data-variant-select]")?.value || "";
      const existingItem = cart.find((item) => item.id === id && (item.variant || "") === variant);
      if (existingItem) {
        existingItem.quantity += 1;
      } else {
        cart.push({
          id,
          name: button.dataset.name,
          price: Number(button.dataset.price),
          quantity: 1,
          variant,
        });
      }
      saveCart();
      updateCart();
      const cartHint = document.querySelector(".cart-hint");
      if (cartHint) {
        cartHint.setAttribute("aria-live", "polite");
        cartHint.textContent = `أُضيف ${button.dataset.name}${variant ? ` (${variant})` : ""} إلى السلة.`;
      }
      if (cartDialog && !cartDialog.open) cartDialog.showModal();
    });
  });

  cartItems?.addEventListener("click", (event) => {
    const button = event.target.closest("[data-cart-action]");
    if (!button) return;
    const item = cart.find((entry) => entry.id === button.dataset.id && (entry.variant || "") === (button.dataset.variant || ""));
    if (!item) return;
    if (button.dataset.cartAction === "increase") item.quantity += 1;
    if (button.dataset.cartAction === "decrease") {
      item.quantity -= 1;
      if (item.quantity === 0) cart = cart.filter((entry) => entry.id !== item.id);
    }
    saveCart();
    updateCart();
  });

  document.querySelector("[data-checkout]")?.addEventListener("click", () => {
    if (cart.length === 0) {
      showToast("أضيفوا وجبة للسلة أولًا.");
      return;
    }
    const branch = branchSelect?.selectedOptions[0];
    if (!branch || !branchSelect.value) {
      showToast("اختاروا الفرع لإكمال الطلب.");
      return;
    }
    const total = cart.reduce((sum, item) => sum + item.price * item.quantity, 0);
    const itemCount = cart.reduce((sum, item) => sum + item.quantity, 0);
    const invoiceNumber = `MB-${Date.now().toString(36).toUpperCase()}`;
    const orderDate = new Intl.DateTimeFormat("ar-SA-u-ca-gregory", { dateStyle: "medium", timeStyle: "short" }).format(new Date());
    const lines = cart.map((item, index) => {
      const name = `${item.name}${item.variant ? ` - ${item.variant}` : ""}`;
      return `${String(index + 1).padStart(2, "0")}. ${name}\n    ${formatPrice(item.price)} × ${numberFormat.format(item.quantity)} = ${formatPrice(item.price * item.quantity)}`;
    });
    const message = [
      "🧾 فاتورة طلب - لذة البروست",
      `رقم الطلب: ${invoiceNumber}`,
      `التاريخ: ${orderDate}`,
      `الفرع: ${branch.textContent}`,
      "────────────────",
      ...lines,
      "────────────────",
      `عدد القطع: ${numberFormat.format(itemCount)}`,
      `الإجمالي: ${formatPrice(total)}`,
      "يرجى تأكيد الطلب ووقت الاستلام.",
    ].join("\n");
    openWhatsApp(branchSelect.value, message);
  });

  document.querySelector("[data-contact-form]")?.addEventListener("submit", (event) => {
    event.preventDefault();
    const form = event.currentTarget;
    const name = form.elements.name.value.trim();
    const message = form.elements.message.value.trim();
    const branch = form.elements.branch.selectedOptions[0];
    if (!name || !message || !branch) return;
    const text = [`السلام عليكم، أنا ${name}.`, `الفرع: ${branch.textContent}`, "", message].join("\n");
    openWhatsApp(form.elements.branch.value, text);
  });

  const menuToggle = document.querySelector(".menu-toggle");
  const mainNav = document.querySelector(".main-nav");
  menuToggle?.addEventListener("click", () => {
    const isOpen = menuToggle.getAttribute("aria-expanded") === "true";
    menuToggle.setAttribute("aria-expanded", String(!isOpen));
    mainNav?.classList.toggle("is-open", !isOpen);
  });

  mainNav?.querySelectorAll("a").forEach((link) => {
    link.addEventListener("click", () => {
      menuToggle?.setAttribute("aria-expanded", "false");
      mainNav.classList.remove("is-open");
    });
  });

  document.addEventListener("click", (event) => {
    if (!mainNav?.classList.contains("is-open")) return;
    if (mainNav.contains(event.target) || menuToggle?.contains(event.target)) return;
    menuToggle?.setAttribute("aria-expanded", "false");
    mainNav.classList.remove("is-open");
  });

  document.querySelectorAll("[data-year]").forEach((element) => {
    element.textContent = new Date().getFullYear();
  });

  updateCart();
})();