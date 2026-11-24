const topbar = document.querySelector(".topbar");
const sections = [...document.querySelectorAll("[data-section]")];
const progressSteps = [...document.querySelectorAll(".progress-step")];
const currentSection = document.querySelector("#current-section");
const progressSelect = document.querySelector(".progress-select");
const fullscreenButton = document.querySelector(".fullscreen");
const fullscreenStatus = document.querySelector(".fullscreen-status");
const reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)");

let framePending = false;

function updateNavigation() {
  framePending = false;
  const coverBottom = sections[0].getBoundingClientRect().bottom;
  const hideTopbar = coverBottom <= topbar.offsetHeight;
  topbar.classList.toggle("is-hidden", hideTopbar);
  topbar.inert = hideTopbar;

  const readingLine = window.innerHeight * 0.35;
  const activeIndex = sections.findLastIndex(section => section.getBoundingClientRect().top <= readingLine);
  const index = Math.max(0, activeIndex);
  const activeSection = sections[index];
  const sectionNumber = activeSection.dataset.section;
  progressSelect.value = activeSection.id;

  if (currentSection.textContent !== sectionNumber) {
    currentSection.textContent = sectionNumber;
    progressSteps.forEach((step, stepIndex) => {
      if (stepIndex === index) step.setAttribute("aria-current", "step");
      else step.removeAttribute("aria-current");
    });
  }
}

progressSelect.addEventListener("change", () => {
  window.location.hash = progressSelect.value;
});

function scheduleNavigationUpdate() {
  if (framePending) return;
  framePending = true;
  window.requestAnimationFrame(updateNavigation);
}

window.addEventListener("scroll", scheduleNavigationUpdate, { passive: true });
window.addEventListener("resize", scheduleNavigationUpdate);
window.addEventListener("pageshow", scheduleNavigationUpdate);
updateNavigation();

function syncFullscreenButton() {
  const active = Boolean(document.fullscreenElement);
  const label = active ? "الخروج من ملء الشاشة" : "ملء الشاشة";
  fullscreenButton.setAttribute("aria-pressed", String(active));
  fullscreenButton.setAttribute("aria-label", label);
  fullscreenButton.title = label;
  fullscreenStatus.textContent = "";
  scheduleNavigationUpdate();
}

fullscreenButton.hidden = !document.fullscreenEnabled;
document.addEventListener("fullscreenchange", syncFullscreenButton);
fullscreenButton.addEventListener("click", async () => {
  try {
    if (document.fullscreenElement) await document.exitFullscreen();
    else await document.documentElement.requestFullscreen();
    syncFullscreenButton();
  } catch {
    fullscreenStatus.textContent = "تعذّر تغيير وضع ملء الشاشة.";
  }
});

if ("IntersectionObserver" in window && !reducedMotion.matches) {
  const reveals = document.querySelectorAll(".reveal");
  const observer = new IntersectionObserver(entries => {
    for (const entry of entries) {
      if (!entry.isIntersecting) continue;
      entry.target.classList.remove("is-pending");
      observer.unobserve(entry.target);
    }
  }, { threshold: 0.06 });

  for (const reveal of reveals) {
    if (reveal.getBoundingClientRect().top >= window.innerHeight) reveal.classList.add("is-pending");
    observer.observe(reveal);
  }
}

const galleryItems = [...document.querySelectorAll(".gallery-item")];
const imageViewer = document.querySelector(".image-viewer");
const imageTitle = document.querySelector("#image-viewer-title");
const imageCurrent = document.querySelector(".gallery-current");
let galleryIndex = 0;

function updateGallery() {
  const item = galleryItems[galleryIndex];
  const photo = item.querySelector("img");
  const placeholder = item.querySelector(".gallery-placeholder");
  const preview = (photo.naturalWidth ? photo : placeholder).cloneNode(true);
  preview.removeAttribute("loading");
  preview.removeAttribute("aria-hidden");
  imageCurrent.replaceChildren(preview);
  imageTitle.textContent = photo.alt;
}

function stepGallery(direction) {
  galleryIndex = (galleryIndex + direction + galleryItems.length) % galleryItems.length;
  updateGallery();
}

galleryItems.forEach((item, index) => {
  const photo = item.querySelector("img");
  const markLoaded = () => {
    if (!photo.naturalWidth) return;
    item.classList.add("has-photo");
    if (imageViewer.open && galleryIndex === index) updateGallery();
  };
  photo.addEventListener("load", markLoaded);
  markLoaded();
  item.addEventListener("click", () => {
    galleryIndex = index;
    updateGallery();
    imageViewer.showModal();
  });
});

imageViewer.querySelector(".gallery-previous").addEventListener("click", () => stepGallery(-1));
imageViewer.querySelector(".gallery-next").addEventListener("click", () => stepGallery(1));
imageViewer.addEventListener("keydown", event => {
  if (event.key === "ArrowLeft") stepGallery(1);
  else if (event.key === "ArrowRight") stepGallery(-1);
  else return;
  event.preventDefault();
});
imageViewer.addEventListener("close", () => imageCurrent.replaceChildren());

for (const button of document.querySelectorAll("[data-video]")) {
  button.addEventListener("click", () => {
    const player = document.createElement("iframe");
    const status = document.createElement("span");
    status.className = "video-loading";
    status.setAttribute("role", "status");
    status.textContent = "جارٍ تحميل مشغل الفيديو…";
    player.addEventListener("load", () => status.remove(), { once: true });
    player.title = button.getAttribute("aria-label");
    player.src = `https://www.youtube-nocookie.com/embed/${button.dataset.video}`;
    player.allow = "encrypted-media; picture-in-picture; fullscreen";
    player.allowFullscreen = true;
    player.referrerPolicy = "strict-origin-when-cross-origin";
    button.replaceWith(player, status);
    player.focus();
  });
}
