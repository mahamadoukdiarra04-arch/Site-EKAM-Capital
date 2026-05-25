const menuToggle = document.querySelector(".menu-toggle");
const nav = document.querySelector(".primary-nav");
const dropdownToggles = document.querySelectorAll(".dropdown-toggle");
const revealSections = document.querySelectorAll(".section-reveal");
const ekamWhatsAppNumber = "22372824157";

if (menuToggle && nav) {
  menuToggle.addEventListener("click", () => {
    const isOpen = document.body.classList.toggle("menu-open");
    menuToggle.setAttribute("aria-expanded", String(isOpen));
  });

  nav.querySelectorAll("a").forEach((link) => {
    link.addEventListener("click", () => {
      document.body.classList.remove("menu-open");
      menuToggle.setAttribute("aria-expanded", "false");
    });
  });
}

dropdownToggles.forEach((toggle) => {
  toggle.addEventListener("click", () => {
    const dropdown = toggle.closest(".nav-dropdown");
    const isOpen = dropdown.classList.toggle("open");
    toggle.setAttribute("aria-expanded", String(isOpen));
  });
});

document.addEventListener("click", (event) => {
  if (!event.target.closest(".nav-dropdown")) {
    document.querySelectorAll(".nav-dropdown.open").forEach((dropdown) => {
      dropdown.classList.remove("open");
      const toggle = dropdown.querySelector(".dropdown-toggle");
      if (toggle) toggle.setAttribute("aria-expanded", "false");
    });
  }
});

if ("IntersectionObserver" in window) {
  const observer = new IntersectionObserver(
    (entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          entry.target.classList.add("is-visible");
          observer.unobserve(entry.target);
        }
      });
    },
    { threshold: 0.14 }
  );

  revealSections.forEach((section) => observer.observe(section));
} else {
  revealSections.forEach((section) => section.classList.add("is-visible"));
}

const getFieldValue = (form, name) => {
  const field = form.elements[name];
  return field ? field.value.trim() : "";
};

const getPhoneValue = (form) => {
  const indicatif = getFieldValue(form, "indicatif");
  const telephone = getFieldValue(form, "telephone");
  return [indicatif, telephone].filter(Boolean).join(" ");
};

const diagnosticFields = [
  { name: "nom", label: "Nom et prénom" },
  { name: "entreprise", label: "Nom de l'entreprise" },
  { label: "Téléphone / WhatsApp", getValue: getPhoneValue },
  { name: "email", label: "Email" },
  { name: "type_organisation", label: "Type d'organisation" },
  { name: "service", label: "Service recherché" },
  { name: "probleme", label: "Problème principal rencontré" },
  { name: "message", label: "Message" },
];

const syncPhonePlaceholder = (select) => {
  const form = select.form;
  const phoneInput = form?.elements.telephone;
  const selectedOption = select.selectedOptions[0];
  const example = selectedOption?.dataset.example;

  if (!phoneInput || !example) return;

  phoneInput.placeholder = example;
  phoneInput.setAttribute("aria-label", `Numéro local, exemple ${example}`);
};

const buildDiagnosticMessage = (form) =>
  diagnosticFields
    .map((field) => {
      const value = field.getValue ? field.getValue(form) : getFieldValue(form, field.name);
      const label = field.label;
      return value ? `${label}: ${value}` : null;
    })
    .filter(Boolean)
    .join("\n");

const setFormFeedback = (form, type) => {
  const feedback = form.querySelector(".form-feedback");
  if (!feedback) return;

  const title = feedback.querySelector("strong");
  const text = feedback.querySelector("span");

  if (type === "success") {
    title.textContent = "Demande reçue par EKAM Capital.";
    text.textContent =
      "Merci pour votre confiance. Notre équipe analysera vos informations et reviendra vers vous dans les plus brefs délais.";
  } else if (type === "whatsapp") {
    title.textContent = "Message WhatsApp prêt à envoyer.";
    text.textContent =
      "Votre demande a été préparée dans WhatsApp avec les informations du formulaire. Envoyez le message pour lancer l'échange avec EKAM Capital.";
  } else {
    title.textContent = "Envoi momentanément indisponible.";
    text.textContent =
      "Votre demande n'a pas pu être transmise automatiquement. Vous pouvez utiliser le bouton WhatsApp pour envoyer les mêmes informations à EKAM Capital.";
  }

  feedback.hidden = false;
  feedback.classList.remove("is-error");
  feedback.classList.toggle("is-error", type === "error");
  feedback.classList.add("is-visible");
};

document.querySelectorAll(".contact-form").forEach((form) => {
  const submitButton = form.querySelector('button[type="submit"]');
  const whatsappButton = form.querySelector("[data-whatsapp-submit]");
  const indicatifSelect = form.elements.indicatif;

  if (indicatifSelect) {
    syncPhonePlaceholder(indicatifSelect);
    indicatifSelect.addEventListener("change", () => syncPhonePlaceholder(indicatifSelect));
  }

  form.addEventListener("submit", async (event) => {
    event.preventDefault();
    if (!form.reportValidity()) return;

    form.classList.add("form-submitted", "is-sending");
    if (submitButton) submitButton.disabled = true;

    try {
      const response = await fetch(form.action, {
        method: "POST",
        body: new FormData(form),
        headers: {
          Accept: "application/json",
          "X-Requested-With": "XMLHttpRequest",
        },
      });
      const data = await response.json().catch(() => ({}));

      if (!response.ok || data.ok !== true) {
        throw new Error(data.message || "Form submission failed");
      }

      form.reset();
      if (indicatifSelect) syncPhonePlaceholder(indicatifSelect);
      setFormFeedback(form, "success");
    } catch (error) {
      setFormFeedback(form, "error");
    } finally {
      form.classList.remove("is-sending");
      if (submitButton) submitButton.disabled = false;
    }
  });

  if (whatsappButton) {
    whatsappButton.addEventListener("click", (event) => {
      event.preventDefault();
      if (!form.reportValidity()) return;

      const message = [
        "Bonjour EKAM Capital,",
        "Je souhaite demander un diagnostic pour mon entreprise.",
        "",
        buildDiagnosticMessage(form),
      ].join("\n");
      const whatsappUrl = `https://wa.me/${ekamWhatsAppNumber}?text=${encodeURIComponent(message)}`;

      window.open(whatsappUrl, "_blank", "noopener");
      setFormFeedback(form, "whatsapp");
    });
  }
});
