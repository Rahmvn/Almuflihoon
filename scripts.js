const hamburger = document.getElementById("hamburger");
const navLinks = document.getElementById("navLinks");
const navbar = document.querySelector(".navbar");
const navDropdowns = document.querySelectorAll(".nav-item-dropdown");

const closeNavDropdowns = () => {
  navDropdowns.forEach((dropdown) => {
    dropdown.classList.remove("open");

    const toggle = dropdown.querySelector(".nav-parent-toggle");

    if (toggle) {
      toggle.setAttribute("aria-expanded", "false");
    }
  });
};

const toggleNavDropdown = (dropdown) => {
  const toggle = dropdown.querySelector(".nav-parent-toggle");
  const isOpen = dropdown.classList.contains("open");

  closeNavDropdowns();

  if (!isOpen) {
    dropdown.classList.add("open");

    if (toggle) {
      toggle.setAttribute("aria-expanded", "true");
    }
  }
};

if (hamburger && navLinks) {
  const toggleMenu = () => {
    const isActive = hamburger.classList.toggle("active");
    navLinks.classList.toggle("active", isActive);

    hamburger.setAttribute("aria-expanded", String(isActive));

    if (!isActive) {
      closeNavDropdowns();
    }

    document.body.style.overflow = isActive ? "hidden" : "";
  };

  const closeMenu = () => {
    hamburger.classList.remove("active");
    navLinks.classList.remove("active");
    closeNavDropdowns();

    hamburger.setAttribute("aria-expanded", "false");

    document.body.style.overflow = "";
  };

  hamburger.addEventListener("click", toggleMenu);

  navLinks.querySelectorAll("a").forEach((link) => {
    if (link.classList.contains("nav-parent-link")) {
      return;
    }

    link.addEventListener("click", closeMenu);
  });

  window.addEventListener("resize", () => {
    if (window.innerWidth > 900) {
      closeMenu();
    }
  });

  window.addEventListener("keydown", (event) => {
    if (event.key === "Escape") {
      closeMenu();
    }
  });
}

navDropdowns.forEach((dropdown) => {
  const parentLink = dropdown.querySelector(".nav-parent-link");
  const toggle = dropdown.querySelector(".nav-parent-toggle");

  if (parentLink) {
    parentLink.addEventListener("click", (event) => {
      if (window.innerWidth > 900) {
        return;
      }

      event.preventDefault();
      event.stopPropagation();
      toggleNavDropdown(dropdown);
    });
  }

  if (!toggle) {
    return;
  }

  toggle.addEventListener("click", (event) => {
    if (window.innerWidth > 900) {
      return;
    }

    event.preventDefault();
    event.stopPropagation();
    toggleNavDropdown(dropdown);
  });
});

if (navbar) {
  const updateNavbarState = () => {
    navbar.classList.toggle("scrolled", window.scrollY > 80);
  };

  window.addEventListener("scroll", updateNavbarState);
  updateNavbarState();
}
