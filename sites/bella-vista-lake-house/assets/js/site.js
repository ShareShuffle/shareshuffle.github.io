document.querySelectorAll("[data-year]").forEach((node) => {
  node.textContent = new Date().getFullYear();
});

const config = window.LAKE_HOUSE_CONFIG || {};
document.querySelectorAll("[data-booking-link]").forEach((link) => {
  link.href = config.bookingUrl || "https://www.vrbo.com/4798748ha";
});

const inquiryForm = document.querySelector("#stay-inquiry");
if (inquiryForm) {
  inquiryForm.addEventListener("submit", async (event) => {
    event.preventDefault();
    const data = new FormData(inquiryForm);
    const details = [
      "Hello Connie,",
      "",
      "I'm interested in The Lake House at Bella Vista.",
      `Name: ${data.get("name")}`,
      `Preferred dates: ${data.get("dates")}`,
      `Guests: ${data.get("guests")}`,
      `Notes: ${data.get("notes") || "None"}`,
      "",
      "Please let me know about availability and next steps."
    ].join("\n");

    if (config.directInquiryEmail) {
      window.location.href = `mailto:${config.directInquiryEmail}?subject=${encodeURIComponent("Lake House stay inquiry")}&body=${encodeURIComponent(details)}`;
      return;
    }

    try {
      await navigator.clipboard.writeText(details);
      document.querySelector("#form-note").textContent = "Your stay details were copied. Vrbo will open so you can message Connie and check current availability.";
    } catch {
      document.querySelector("#form-note").textContent = "Vrbo will open so you can message Connie and check current availability.";
    }
    window.open(config.bookingUrl || "https://www.vrbo.com/4798748ha", "_blank", "noopener");
  });
}

