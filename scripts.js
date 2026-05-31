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

document.querySelectorAll("[data-formspree]").forEach((form) => {
  if (window.location.protocol === "file:") {
    return;
  }

  const status = form.querySelector("[data-form-status]");
  const submitButton = form.querySelector('button[type="submit"]');
  const defaultButtonText = submitButton ? submitButton.textContent : "";

  const setStatus = (message, state) => {
    if (!status) {
      return;
    }

    status.textContent = message;
    status.classList.remove("is-success", "is-error");

    if (state) {
      status.classList.add(state);
    }
  };

  form.addEventListener("submit", async (event) => {
    event.preventDefault();

    if (submitButton) {
      submitButton.disabled = true;
      submitButton.textContent = "Sending...";
    }

    setStatus("Sending your message...", null);

    try {
      const response = await fetch(form.action, {
        method: form.method,
        body: new FormData(form),
        headers: {
          Accept: "application/json",
        },
      });

      if (!response.ok) {
        throw new Error("Submission failed");
      }

      form.reset();
      setStatus(
        form.dataset.successMessage || "Thanks. Your message has been sent.",
        "is-success"
      );
    } catch (error) {
      setStatus(
        "We couldn't send your message right now. Please try again or contact the school by phone or WhatsApp.",
        "is-error"
      );
    } finally {
      if (submitButton) {
        submitButton.disabled = false;
        submitButton.textContent = defaultButtonText;
      }
    }
  });
});

document.querySelectorAll("[data-carousel]").forEach((carousel) => {
  const track = carousel.querySelector("[data-carousel-track]");
  const baseSlides = Array.from(track ? track.querySelectorAll(".poster-slide") : []);
  const prevButton = carousel.querySelector("[data-carousel-prev]");
  const nextButton = carousel.querySelector("[data-carousel-next]");
  const dotsContainer = carousel.querySelector("[data-carousel-dots]");

  if (!track || baseSlides.length === 0 || !prevButton || !nextButton || !dotsContainer) {
    return;
  }

  const totalSlides = baseSlides.length;
  let renderedSlides = [];
  let visibleSlides = 2;
  let currentRealIndex = 0;
  let currentRenderIndex = 0;
  let pageCount = 1;
  let autoAdvanceTimer = null;
  let isTransitioning = false;

  const updateVisibleSlides = () => {
    visibleSlides = window.innerWidth <= 700 ? 1 : 2;
    pageCount = Math.max(1, totalSlides);
    currentRealIndex = Math.min(currentRealIndex, totalSlides - 1);
  };

  const renderDots = () => {
    dotsContainer.innerHTML = "";

    Array.from({ length: pageCount }).forEach((_, index) => {
      const dot = document.createElement("button");
      dot.type = "button";
      dot.className = "poster-carousel-dot";
      dot.setAttribute("aria-label", `Show achievement ${index + 1}`);
      dot.addEventListener("click", () => {
        if (isTransitioning) {
          return;
        }

        currentRealIndex = index;
        currentRenderIndex = visibleSlides + currentRealIndex;
        updateCarousel(true);
        startAutoAdvance();
      });
      dotsContainer.appendChild(dot);
    });
  };

  const setSlideWidths = () => {
    const gap = visibleSlides > 1 ? 14 : 0;

    renderedSlides.forEach((slide) => {
      slide.style.flexBasis =
        visibleSlides > 1 ? `calc((100% - ${gap}px) / ${visibleSlides})` : "100%";
    });
  };

  const setTrackPosition = (animate) => {
    const targetSlide = renderedSlides[currentRenderIndex];
    const offset = targetSlide ? targetSlide.offsetLeft : 0;

    track.style.transition = animate ? "transform 0.38s ease" : "none";
    track.style.transform = `translateX(-${offset}px)`;
  };

  const buildCircularTrack = () => {
    updateVisibleSlides();

    const leadingClones = baseSlides
      .slice(-visibleSlides)
      .map((slide) => slide.cloneNode(true));
    const trailingClones = baseSlides
      .slice(0, visibleSlides)
      .map((slide) => slide.cloneNode(true));

    track.innerHTML = "";
    [...leadingClones, ...baseSlides.map((slide) => slide.cloneNode(true)), ...trailingClones].forEach(
      (slide) => {
        track.appendChild(slide);
      }
    );

    renderedSlides = Array.from(track.querySelectorAll(".poster-slide"));
    setSlideWidths();
    currentRenderIndex = visibleSlides + currentRealIndex;
    setTrackPosition(false);

    if (dotsContainer.childElementCount !== pageCount) {
      renderDots();
    }
  };

  const updateDots = () => {
    dotsContainer.querySelectorAll(".poster-carousel-dot").forEach((dot, index) => {
      dot.classList.toggle("is-active", index === currentRealIndex);
    });
  };

  const updateCarousel = (animate) => {
    setSlideWidths();
    setTrackPosition(animate);
    updateDots();
  };

  const moveCarousel = (direction) => {
    if (isTransitioning || totalSlides <= 1) {
      return;
    }

    isTransitioning = true;
    currentRealIndex = (currentRealIndex + direction + totalSlides) % totalSlides;
    currentRenderIndex += direction;
    updateCarousel(true);
  };

  const stopAutoAdvance = () => {
    if (autoAdvanceTimer) {
      window.clearInterval(autoAdvanceTimer);
      autoAdvanceTimer = null;
    }
  };

  const startAutoAdvance = () => {
    stopAutoAdvance();

    if (pageCount <= 1) {
      return;
    }

    autoAdvanceTimer = window.setInterval(() => {
      moveCarousel(1);
    }, 4200);
  };

  prevButton.addEventListener("click", () => {
    moveCarousel(-1);
    startAutoAdvance();
  });

  nextButton.addEventListener("click", () => {
    moveCarousel(1);
    startAutoAdvance();
  });

  track.addEventListener("transitionend", () => {
    if (!isTransitioning) {
      return;
    }

    if (currentRenderIndex >= totalSlides + visibleSlides) {
      currentRenderIndex = visibleSlides;
      setTrackPosition(false);
    } else if (currentRenderIndex < visibleSlides) {
      currentRenderIndex = totalSlides + visibleSlides - 1;
      setTrackPosition(false);
    }

    isTransitioning = false;
    updateDots();
  });

  window.addEventListener("resize", () => {
    buildCircularTrack();
    startAutoAdvance();
  });

  buildCircularTrack();
  updateDots();
  startAutoAdvance();
});

const imageViewer = document.querySelector("[data-image-viewer]");
const imageViewerImage = imageViewer ? imageViewer.querySelector("[data-image-viewer-image]") : null;
const imageViewerClose = imageViewer ? imageViewer.querySelector("[data-image-viewer-close]") : null;

if (imageViewer && imageViewerImage && imageViewerClose) {
  const closeImageViewer = () => {
    imageViewer.hidden = true;
    imageViewerImage.removeAttribute("src");
    imageViewerImage.alt = "";
    document.body.style.overflow = "";
  };

  const openImageViewer = (src, alt) => {
    imageViewerImage.src = src;
    imageViewerImage.alt = alt || "";
    imageViewer.hidden = false;
    document.body.style.overflow = "hidden";
  };

  document.addEventListener("click", (event) => {
    const trigger = event.target.closest("[data-image-viewer-open]");

    if (!trigger) {
      return;
    }

    event.preventDefault();
    openImageViewer(trigger.dataset.imageSrc, trigger.dataset.imageAlt);
  });

  imageViewerClose.addEventListener("click", closeImageViewer);

  imageViewer.addEventListener("click", (event) => {
    if (event.target === imageViewer) {
      closeImageViewer();
    }
  });

  window.addEventListener("keydown", (event) => {
    if (event.key === "Escape" && !imageViewer.hidden) {
      closeImageViewer();
    }
  });
}
