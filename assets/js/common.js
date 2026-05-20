(function () {
  const topicClass = {
    gnss: "gnss",
    remote: "remote",
    gis: "gis",
    digital: "digital",
    policy: "policy",
    field: "field",
  };

  function escapeHTML(value) {
    return String(value ?? "")
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;")
      .replace(/'/g, "&#039;");
  }

  function topicPill(topic, label) {
    const cls = topicClass[topic] ?? "field";
    return `<span class="topic-pill ${cls}">${escapeHTML(label)}</span>`;
  }

  function getExamData() {
    return window.QNET_EXAMS ?? { exams: [], topics: [], analysis: {}, source: {} };
  }

  function allQuestions(exams = getExamData().exams) {
    return exams.flatMap((exam) =>
      exam.periods.flatMap((period) =>
        period.questions.map((question) => ({
          ...question,
          exam,
          period: period.period,
        })),
      ),
    );
  }

  function moduleById(id) {
    return (window.CURRICULUM_MODULES ?? []).find((module) => module.id === id);
  }

  function renderBars(target, rows, options = {}) {
    const max = Math.max(1, ...rows.map((row) => row.value));
    target.innerHTML = rows
      .map((row) => {
        const percent = Math.max(4, Math.round((row.value / max) * 100));
        return `
          <div class="bar-row">
            <strong>${escapeHTML(row.label)}</strong>
            <div class="bar-track" aria-hidden="true">
              <div class="bar-fill" style="--value:${percent}%; background:${row.color ?? "var(--sage)"}"></div>
            </div>
            <span>${options.suffix ? `${row.value}${options.suffix}` : row.value}</span>
          </div>
        `;
      })
      .join("");
  }

  function setActiveNavigation() {
    const current = location.pathname.split("/").pop() || "index.html";
    document.querySelectorAll("[data-nav]").forEach((link) => {
      const href = link.getAttribute("href");
      if (href === current || (current === "" && href === "index.html")) {
        link.classList.add("active");
      }
    });
  }

  function setupMenu() {
    const toggle = document.querySelector("[data-menu-toggle]");
    const links = document.querySelector("[data-nav-links]");
    if (!toggle || !links) {
      return;
    }

    toggle.addEventListener("click", () => {
      links.classList.toggle("open");
      toggle.setAttribute("aria-expanded", links.classList.contains("open") ? "true" : "false");
    });
  }

  function sourceSummary() {
    const data = getExamData();
    return `${data.source.yearRange ?? "2015-2026"} · 최신 제${data.source.latestRound ?? "-"}회 · ${data.exams.length}개 회차`;
  }

  document.addEventListener("DOMContentLoaded", () => {
    setActiveNavigation();
    setupMenu();
  });

  window.SurveyorApp = {
    allQuestions,
    escapeHTML,
    getExamData,
    moduleById,
    renderBars,
    sourceSummary,
    topicPill,
  };
})();
