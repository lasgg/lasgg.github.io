function escapeHtml(value) {
  return String(value ?? "")
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#39;");
}

function getEmbeddedProfileData() {
  const node = document.getElementById("embedded-profile-data");

  if (!node) {
    return null;
  }

  try {
    return JSON.parse(node.textContent);
  } catch {
    return null;
  }
}

async function loadProfileData() {
  const embedded = getEmbeddedProfileData();

  try {
    const response = await fetch("content/profile.json", { cache: "no-store" });

    if (!response.ok) {
      throw new Error(`Unexpected status: ${response.status}`);
    }

    return await response.json();
  } catch {
    return embedded;
  }
}

function setText(selector, value) {
  document.querySelectorAll(selector).forEach((node) => {
    node.textContent = value;
  });
}

function setLink(selector, href, label) {
  document.querySelectorAll(selector).forEach((node) => {
    if (!href) {
      node.classList.add("is-hidden");
      node.removeAttribute("href");
      return;
    }

    node.classList.remove("is-hidden");
    node.setAttribute("href", href);

    if (label) {
      node.textContent = label;
    }
  });
}

function renderFocus(items) {
  const container = document.getElementById("focus-list");

  if (!container || !Array.isArray(items) || items.length === 0) {
    return;
  }

  container.innerHTML = items
    .map((item) => `<span>${escapeHtml(item)}</span>`)
    .join("");
}

function renderSkills(groups) {
  const container = document.getElementById("skills-list");

  if (!container || !Array.isArray(groups) || groups.length === 0) {
    return;
  }

  container.innerHTML = groups
    .map((group) => {
      const chips = Array.isArray(group.items)
        ? group.items.map((item) => `<span>${escapeHtml(item)}</span>`).join("")
        : "";

      return `
        <article class="skill-group">
          <p class="mini-label">${escapeHtml(group.group)}</p>
          <div class="chip-row">${chips}</div>
        </article>
      `;
    })
    .join("");
}

function renderHighlights(items) {
  const container = document.getElementById("highlights-list");

  if (!container || !Array.isArray(items) || items.length === 0) {
    return;
  }

  container.innerHTML = items
    .map(
      (item, index) => `
        <article class="highlight-card">
          <span class="card-index">${String(index + 1).padStart(2, "0")}</span>
          <h3>${escapeHtml(item.title)}</h3>
          <p>${escapeHtml(item.impact || item.context || "")}</p>
        </article>
      `
    )
    .join("");
}

function renderWork(items) {
  const container = document.getElementById("work-list");

  if (!container || !Array.isArray(items) || items.length === 0) {
    return;
  }

  container.innerHTML = items
    .map((item) => {
      const links = Array.isArray(item.links)
        ? item.links
            .map(
              (link) => `
                <a href="${escapeHtml(link.url || "#")}" target="_blank" rel="noreferrer">
                  ${escapeHtml(link.label || "Open")}
                </a>
              `
            )
            .join("")
        : "";

      return `
        <article class="work-card">
          <div class="work-body">
            <div class="work-meta">
              <span>${escapeHtml(item.type || "Work")}</span>
              <span>${escapeHtml(item.source || "")}</span>
            </div>
            <h3>${escapeHtml(item.title || "")}</h3>
            <p>${escapeHtml(item.summary || "")}</p>
            <div class="work-links">${links}</div>
          </div>
        </article>
      `;
    })
    .join("");
}

function renderProfile(data) {
  if (!data || !data.profile) {
    return;
  }

  const { profile, about, skills, highlights, work, contact } = data;
  const linkedinUrl = contact?.primaryCtaUrl || profile.linkedinUrl || "";
  const linkedinLabel = contact?.primaryCtaLabel || "Find me on LinkedIn";
  const secondaryUrl =
    contact?.secondaryCtaUrl || (profile.email ? `mailto:${profile.email}` : "");
  const secondaryLabel =
    contact?.secondaryCtaLabel || (profile.email ? "Send email" : "");

  setText("[data-profile-name]", profile.name || "Sam Liu");
  setText("[data-profile-headline]", profile.headline || "");
  setText("[data-profile-intro]", profile.intro || "");
  setText("[data-profile-location]", profile.location || "");
  setText("[data-about-summary]", about?.summary || "");

  setLink("[data-linkedin-link]", linkedinUrl, linkedinLabel);
  setLink("[data-linkedin-link-footer]", linkedinUrl);
  setLink("[data-email-link]", secondaryUrl, secondaryLabel);

  renderFocus(about?.focusAreas || []);
  renderSkills(skills || []);
  renderHighlights(highlights || []);
  renderWork(work || []);

  const heroPhoto = document.getElementById("hero-photo");
  const heroFallback = document.getElementById("hero-fallback");

  if (heroPhoto && heroFallback) {
    if (profile.heroImage) {
      heroPhoto.src = profile.heroImage;
      heroPhoto.classList.remove("is-hidden");
    } else {
      heroPhoto.classList.add("is-hidden");
      heroPhoto.removeAttribute("src");
    }

    heroFallback.classList.remove("is-hidden");
  }
}

function setupMenu() {
  const header = document.querySelector(".site-header");
  const toggle = document.querySelector(".menu-toggle");
  const nav = document.getElementById("site-nav");

  if (!header || !toggle || !nav) {
    return;
  }

  toggle.addEventListener("click", () => {
    const open = header.classList.toggle("is-open");
    toggle.setAttribute("aria-expanded", String(open));
  });

  nav.querySelectorAll("a").forEach((link) => {
    link.addEventListener("click", () => {
      header.classList.remove("is-open");
      toggle.setAttribute("aria-expanded", "false");
    });
  });
}

function setupActiveNav() {
  if (!("IntersectionObserver" in window)) {
    return;
  }

  const links = [...document.querySelectorAll(".site-nav a")];
  const sectionMap = new Map();

  links.forEach((link) => {
    const href = link.getAttribute("href");

    if (!href || !href.startsWith("#")) {
      return;
    }

    const section = document.querySelector(href);

    if (section) {
      sectionMap.set(section, link);
    }
  });

  if (sectionMap.size === 0) {
    return;
  }

  const observer = new IntersectionObserver(
    (entries) => {
      entries.forEach((entry) => {
        if (!entry.isIntersecting) {
          return;
        }

        links.forEach((link) => link.classList.remove("is-active"));
        const activeLink = sectionMap.get(entry.target);

        if (activeLink) {
          activeLink.classList.add("is-active");
        }
      });
    },
    {
      rootMargin: "-35% 0px -45% 0px",
      threshold: 0.08
    }
  );

  sectionMap.forEach((_, section) => observer.observe(section));
}

function setupReveal() {
  const items = document.querySelectorAll(".reveal");

  if (items.length === 0) {
    return;
  }

  if (!("IntersectionObserver" in window)) {
    items.forEach((item) => item.classList.add("is-visible"));
    return;
  }

  const observer = new IntersectionObserver(
    (entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          entry.target.classList.add("is-visible");
          observer.unobserve(entry.target);
        }
      });
    },
    {
      rootMargin: "0px 0px -10% 0px",
      threshold: 0.12
    }
  );

  items.forEach((item) => observer.observe(item));
}

async function init() {
  setupMenu();
  setupActiveNav();
  setupReveal();

  const data = await loadProfileData();
  renderProfile(data);
}

init();
