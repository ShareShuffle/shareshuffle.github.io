(() => {
  const nav = document.querySelector(".site-nav");
  const toggle = document.querySelector(".menu-toggle");
  const links = document.querySelector(".nav-links");

  const updateNav = () => {
    if (!nav) return;
    nav.classList.toggle("scrolled", window.scrollY > 24);
  };

  updateNav();
  window.addEventListener("scroll", updateNav, { passive: true });

  if (toggle && links) {
    toggle.addEventListener("click", () => {
      const open = links.classList.toggle("open");
      document.body.classList.toggle("menu-open", open);
      toggle.setAttribute("aria-expanded", String(open));
      toggle.setAttribute("aria-label", open ? "Close navigation" : "Open navigation");
      toggle.querySelector("i")?.classList.toggle("fa-bars", !open);
      toggle.querySelector("i")?.classList.toggle("fa-xmark", open);
    });

    links.querySelectorAll("a").forEach((link) => {
      link.addEventListener("click", () => {
        links.classList.remove("open");
        document.body.classList.remove("menu-open");
        toggle.setAttribute("aria-expanded", "false");
        toggle.setAttribute("aria-label", "Open navigation");
        toggle.querySelector("i")?.classList.add("fa-bars");
        toggle.querySelector("i")?.classList.remove("fa-xmark");
      });
    });
  }

  document.querySelectorAll("[data-current-year]").forEach((node) => {
    node.textContent = String(new Date().getFullYear());
  });
})();
