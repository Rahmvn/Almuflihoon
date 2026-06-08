// ========================
// 0. Dynamic main padding to match navbar height (remove gap under fixed navbar)
// ========================
(function adjustMainPadding() {
  const navbar = document.querySelector('.navbar');
  const main = document.querySelector('main');
  if (!navbar || !main) return;

  const setPadding = () => {
    const navbarHeight = navbar.offsetHeight;
    main.style.paddingTop = navbarHeight + 'px';
  };

  setPadding();
  window.addEventListener('resize', setPadding);
  // Also re-run after any layout shift (e.g., lazy images)
  if (window.ResizeObserver) {
    const observer = new ResizeObserver(setPadding);
    observer.observe(navbar);
  }
})();


// ========================
// 1. Navigation & Mobile Menu
// ========================
const hamburger = document.getElementById("hamburger");
const navLinks = document.getElementById("navLinks");
const navbar = document.querySelector(".navbar");
const navDropdowns = document.querySelectorAll(".nav-item-dropdown");

const closeNavDropdowns = () => {
  navDropdowns.forEach((dropdown) => {
    dropdown.classList.remove("open");
    const toggle = dropdown.querySelector(".nav-parent-toggle");
    if (toggle) toggle.setAttribute("aria-expanded", "false");
  });
};

const toggleNavDropdown = (dropdown) => {
  const toggle = dropdown.querySelector(".nav-parent-toggle");
  const isOpen = dropdown.classList.contains("open");
  closeNavDropdowns();
  if (!isOpen) {
    dropdown.classList.add("open");
    if (toggle) toggle.setAttribute("aria-expanded", "true");
  }
};

if (hamburger && navLinks) {
  const toggleMenu = () => {
    const isActive = hamburger.classList.toggle("active");
    navLinks.classList.toggle("active", isActive);
    hamburger.setAttribute("aria-expanded", String(isActive));
    if (!isActive) closeNavDropdowns();
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
    if (!link.classList.contains("nav-parent-link")) {
      link.addEventListener("click", closeMenu);
    }
  });
  window.addEventListener("resize", () => {
    if (window.innerWidth > 900) closeMenu();
  });
  window.addEventListener("keydown", (event) => {
    if (event.key === "Escape") closeMenu();
  });
}

navDropdowns.forEach((dropdown) => {
  const parentLink = dropdown.querySelector(".nav-parent-link");
  const toggle = dropdown.querySelector(".nav-parent-toggle");
  if (parentLink) {
    parentLink.addEventListener("click", (event) => {
      if (window.innerWidth <= 900) {
        event.preventDefault();
        event.stopPropagation();
        toggleNavDropdown(dropdown);
      }
    });
  }
  if (toggle) {
    toggle.addEventListener("click", (event) => {
      if (window.innerWidth <= 900) {
        event.preventDefault();
        event.stopPropagation();
        toggleNavDropdown(dropdown);
      }
    });
  }
});

if (navbar) {
  const updateNavbarState = () => navbar.classList.toggle("scrolled", window.scrollY > 80);
  window.addEventListener("scroll", updateNavbarState);
  updateNavbarState();
}

// ========================
// 2. Lazy load images in media frames
// ========================
document.querySelectorAll(".media-frame img").forEach((image) => {
  const frame = image.closest(".media-frame");
  if (!frame) return;
  const markLoaded = () => frame.classList.add("is-loaded");
  if (image.complete && image.naturalWidth > 0) markLoaded();
  else image.addEventListener("load", markLoaded, { once: true });
  image.addEventListener("error", markLoaded, { once: true });
});

// ========================
// 3. Formspree contact forms
// ========================
document.querySelectorAll("[data-formspree]").forEach((form) => {
  if (window.location.protocol === "file:") return;
  const status = form.querySelector("[data-form-status]");
  const submitButton = form.querySelector('button[type="submit"]');
  const defaultButtonText = submitButton ? submitButton.textContent : "";
  const setStatus = (message, state) => {
    if (!status) return;
    status.textContent = message;
    status.classList.remove("is-success", "is-error");
    if (state) status.classList.add(state);
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
        headers: { Accept: "application/json" },
      });
      if (!response.ok) throw new Error("Submission failed");
      form.reset();
      setStatus(form.dataset.successMessage || "Thanks. Your message has been sent.", "is-success");
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

 
// 4. Video Carousel (Facebook iframe + local MP4) – Stops on exit + skeleton
// ========================
document.querySelectorAll("[data-single-carousel]").forEach((container) => {
  const slides = Array.from(container.querySelectorAll(".single-video-slide"));
  if (slides.length < 2) return;

  let currentIndex = 0;
  const iframeSrcMap = new Map(); // store source URL for each iframe slide

  // Helper: add skeleton loader
  const addSkeleton = (slide) => {
    if (slide.querySelector(".iframe-skeleton")) return;
    const skeleton = document.createElement("div");
    skeleton.className = "iframe-skeleton";
    skeleton.innerHTML = `
      <div class="skeleton-spinner"></div>
      <div class="skeleton-text">Loading video...</div>
    `;
    slide.style.position = "relative";
    slide.appendChild(skeleton);
  };

  const removeSkeleton = (slide) => {
    const skeleton = slide.querySelector(".iframe-skeleton");
    if (skeleton) skeleton.remove();
  };

  // Preload iframe in background (hidden) for faster loading later
  const preloadIframe = (src) => {
    if (!src) return;
    const preloadIframe = document.createElement("iframe");
    preloadIframe.style.display = "none";
    preloadIframe.src = src;
    document.body.appendChild(preloadIframe);
    // Remove after a few seconds to clean up, but the browser cache will keep it
    setTimeout(() => preloadIframe.remove(), 10000);
  };

  const getIframeSrc = (slide) => {
    const iframe = slide.querySelector("iframe");
    return slide.dataset.src || (iframe ? iframe.dataset.src : null);
  };

  const stopIframe = (iframe) => {
    if (iframe && iframe.src) {
      iframe.src = ""; // clears the video, stops playback
    }
  };

  const startIframe = (slide, iframe, src) => {
    if (!iframe || !src) return;
    // Show skeleton while loading
    addSkeleton(slide);
    iframe.src = src;
    // Remove skeleton once loaded
    const onLoad = () => {
      removeSkeleton(slide);
      iframe.removeEventListener("load", onLoad);
    };
    iframe.addEventListener("load", onLoad);
    // Fallback: remove skeleton after 3 seconds anyway
    setTimeout(() => removeSkeleton(slide), 3000);
  };

  const activateSlide = (index, shouldAutoPlay = true) => {
    slides.forEach((slide, i) => {
      const isActive = i === index;
      slide.classList.toggle("is-active", isActive);
      const media = slide.querySelector("iframe, video");
      if (!media) return;

      if (slide.dataset.type === "iframe") {
        const src = iframeSrcMap.get(slide) || getIframeSrc(slide);
        if (!src) return;
        if (isActive) {
          startIframe(slide, media, src);
        } else {
          stopIframe(media);
          removeSkeleton(slide);
        }
      } else if (slide.dataset.type === "video") {
        if (isActive && shouldAutoPlay) {
          media.currentTime = 0;
          media.play().catch((e) => console.log("Video autoplay blocked:", e));
        } else {
          media.pause();
          media.currentTime = 0;
        }
      }
    });
    currentIndex = index;
  };

  const next = () => {
    const newIndex = (currentIndex + 1) % slides.length;
    activateSlide(newIndex, true);
  };

  const prev = () => {
    const newIndex = (currentIndex - 1 + slides.length) % slides.length;
    activateSlide(newIndex, true);
  };

  // Attach button events
  const btnNext = container.querySelector(".single-carousel-btn.next");
  const btnPrev = container.querySelector(".single-carousel-btn.prev");
  if (btnNext) btnNext.addEventListener("click", next);
  if (btnPrev) btnPrev.addEventListener("click", prev);

  // Initialise iframe slides: store src and preload
  slides.forEach((slide) => {
    if (slide.dataset.type === "iframe") {
      const iframe = slide.querySelector("iframe");
      let src = slide.dataset.src;
      if (!src && iframe) {
        src = iframe.src || iframe.dataset.src;
      }
      if (src) {
        iframeSrcMap.set(slide, src);
        preloadIframe(src);
        // Clear the iframe's src initially so it doesn't load until activated
        if (iframe) iframe.src = "";
      }
    }
  });

  // Activate first slide
  activateSlide(0, true);
});

// ========================
// 5. Poster carousel (Qur'an memorization achievements)
// ========================
document.querySelectorAll("[data-carousel]").forEach((carousel) => {
  const track = carousel.querySelector("[data-carousel-track]");
  const baseSlides = Array.from(track ? track.querySelectorAll(".poster-slide") : []);
  const prevButton = carousel.querySelector("[data-carousel-prev]");
  const nextButton = carousel.querySelector("[data-carousel-next]");
  const dotsContainer = carousel.querySelector("[data-carousel-dots]");

  if (!track || baseSlides.length === 0 || !prevButton || !nextButton || !dotsContainer) return;

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
        if (isTransitioning) return;
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
      slide.style.flexBasis = visibleSlides > 1 ? `calc((100% - ${gap}px) / ${visibleSlides})` : "100%";
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
    const leadingClones = baseSlides.slice(-visibleSlides).map((slide) => slide.cloneNode(true));
    const trailingClones = baseSlides.slice(0, visibleSlides).map((slide) => slide.cloneNode(true));
    track.innerHTML = "";
    [...leadingClones, ...baseSlides.map((slide) => slide.cloneNode(true)), ...trailingClones].forEach(
      (slide) => track.appendChild(slide)
    );
    renderedSlides = Array.from(track.querySelectorAll(".poster-slide"));
    setSlideWidths();
    currentRenderIndex = visibleSlides + currentRealIndex;
    setTrackPosition(false);
    if (dotsContainer.childElementCount !== pageCount) renderDots();
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
    if (isTransitioning || totalSlides <= 1) return;
    isTransitioning = true;
    currentRealIndex = (currentRealIndex + direction + totalSlides) % totalSlides;
    currentRenderIndex += direction;
    updateCarousel(true);
  };

  const stopAutoAdvance = () => {
    if (autoAdvanceTimer) clearInterval(autoAdvanceTimer);
    autoAdvanceTimer = null;
  };

  const startAutoAdvance = () => {
    stopAutoAdvance();
    if (pageCount <= 1) return;
    autoAdvanceTimer = setInterval(() => moveCarousel(1), 4200);
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
    if (!isTransitioning) return;
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

// ========================
// 6. Image lightbox (school signboard)
// ========================
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
    if (!trigger) return;
    event.preventDefault();
    openImageViewer(trigger.dataset.imageSrc, trigger.dataset.imageAlt);
  });
  imageViewerClose.addEventListener("click", closeImageViewer);
  imageViewer.addEventListener("click", (event) => {
    if (event.target === imageViewer) closeImageViewer();
  });
  window.addEventListener("keydown", (event) => {
    if (event.key === "Escape" && !imageViewer.hidden) closeImageViewer();
  });
}