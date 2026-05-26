document.addEventListener("DOMContentLoaded", () => {
  const app = window.SurveyorApp;
  const modules = window.CURRICULUM_MODULES ?? [];
  const list = document.querySelector("[data-module-list]");
  const detail = document.querySelector("[data-module-detail]");
  let zoomScale = 1;

  function ensureImageViewer() {
    let viewer = document.querySelector("[data-image-viewer]");
    if (viewer) {
      return viewer;
    }

    document.body.insertAdjacentHTML(
      "beforeend",
      `
        <div class="image-viewer" data-image-viewer aria-hidden="true">
          <div class="image-viewer-backdrop" data-image-viewer-action="close"></div>
          <section class="image-viewer-panel" role="dialog" aria-modal="true" aria-label="이미지 확대 보기">
            <header class="image-viewer-header">
              <div>
                <span>이미지 확대 보기</span>
                <h3 data-image-viewer-title></h3>
              </div>
              <div class="image-viewer-controls">
                <button type="button" data-image-viewer-action="zoom-out" aria-label="이미지 축소">−</button>
                <button type="button" data-image-viewer-action="reset">100%</button>
                <button type="button" data-image-viewer-action="zoom-in" aria-label="이미지 확대">+</button>
                <button type="button" data-image-viewer-action="close">닫기</button>
              </div>
            </header>
            <div class="image-viewer-stage">
              <img data-image-viewer-img alt="">
            </div>
          </section>
        </div>
      `,
    );

    viewer = document.querySelector("[data-image-viewer]");
    viewer.addEventListener("click", (event) => {
      const actionButton = event.target.closest("[data-image-viewer-action]");
      if (!actionButton) {
        return;
      }
      const action = actionButton.dataset.imageViewerAction;
      if (action === "close") closeImageViewer();
      if (action === "zoom-in") setImageZoom(zoomScale + 0.25);
      if (action === "zoom-out") setImageZoom(zoomScale - 0.25);
      if (action === "reset") setImageZoom(1);
    });

    document.addEventListener("keydown", (event) => {
      if (event.key === "Escape" && viewer.classList.contains("open")) {
        closeImageViewer();
      }
    });

    return viewer;
  }

  function setImageZoom(nextScale) {
    const viewer = ensureImageViewer();
    const image = viewer.querySelector("[data-image-viewer-img]");
    const resetButton = viewer.querySelector('[data-image-viewer-action="reset"]');
    zoomScale = Math.min(3, Math.max(0.5, nextScale));
    image.style.width = `${Math.round(zoomScale * 100)}%`;
    resetButton.textContent = `${Math.round(zoomScale * 100)}%`;
  }

  function openImageViewer(src, alt, title) {
    const viewer = ensureImageViewer();
    const image = viewer.querySelector("[data-image-viewer-img]");
    viewer.querySelector("[data-image-viewer-title]").textContent = title;
    image.src = src;
    image.alt = alt;
    viewer.classList.add("open");
    viewer.setAttribute("aria-hidden", "false");
    document.body.classList.add("modal-open");
    setImageZoom(1);
  }

  function closeImageViewer() {
    const viewer = document.querySelector("[data-image-viewer]");
    if (!viewer) {
      return;
    }
    viewer.classList.remove("open");
    viewer.setAttribute("aria-hidden", "true");
    document.body.classList.remove("modal-open");
  }

  function renderDemLesson(lesson) {
    if (!lesson) {
      return "";
    }

    return `
      <section class="dem-lesson" aria-labelledby="dem-lesson-title">
        <div class="detail-heading">
          <span>DEM 집중 강의</span>
          <h3 id="dem-lesson-title">${app.escapeHTML(lesson.title)}</h3>
        </div>
        <p class="presentation-subtitle">${app.escapeHTML(lesson.subtitle)}</p>

        <figure class="dem-infographic">
          <button class="image-zoom-trigger" type="button" data-zoom-src="${app.escapeHTML(lesson.image)}" data-zoom-title="${app.escapeHTML(lesson.title)}" data-zoom-alt="DEM의 개념, 종류, 생성 과정, 활용 사례를 정리한 인포그래픽">
            <img src="${app.escapeHTML(lesson.image)}" alt="DEM의 개념, 종류, 생성 과정, 활용 사례를 정리한 인포그래픽">
            <span>크게 보기</span>
          </button>
          <figcaption>${app.escapeHTML(lesson.keyMessage)}</figcaption>
        </figure>

        <div class="dem-concept-grid">
          ${(lesson.concepts ?? [])
            .map(
              (concept) => `
                <article class="dem-concept-card">
                  <b>${app.escapeHTML(concept.term)}</b>
                  <p>${app.escapeHTML(concept.explain)}</p>
                </article>
              `,
            )
            .join("")}
        </div>

        <div class="detail-heading compact">
          <span>제작 방법</span>
          <h3>실제 DEM 제작 절차</h3>
        </div>
        <div class="dem-process-list">
          ${(lesson.productionSteps ?? [])
            .map(
              (item) => `
                <section class="dem-process-card">
                  <div>
                    <h4>${app.escapeHTML(item.step)}</h4>
                    <p>${app.escapeHTML(item.detail)}</p>
                  </div>
                  <aside>${app.escapeHTML(item.answerTip)}</aside>
                </section>
              `,
            )
            .join("")}
        </div>

        <div class="detail-heading compact">
          <span>답안 목차</span>
          <h3>기술사 답안에 바로 쓰는 구성</h3>
        </div>
        <div class="dem-answer-grid">
          ${(lesson.answerOutline ?? [])
            .map(
              (section) => `
                <section class="dem-answer-card">
                  <h4>${app.escapeHTML(section.heading)}</h4>
                  <ul>${section.points.map((point) => `<li>${app.escapeHTML(point)}</li>`).join("")}</ul>
                </section>
              `,
            )
            .join("")}
        </div>

        <div class="dem-answer-example">
          <b>답안 예시 문장</b>
          <p>${app.escapeHTML(lesson.answerExample)}</p>
        </div>
      </section>
    `;
  }

  function renderDetail(module) {
    const related = app
      .allQuestions()
      .filter((question) => question.module === module.id)
      .slice(0, 5);

    detail.innerHTML = `
      <div class="panel pad module-detail">
        <div class="tag-row">${module.keywords.map((keyword) => `<span class="tag">${app.escapeHTML(keyword)}</span>`).join("")}</div>
        <h2 class="page-title small" style="margin-top:18px">${app.escapeHTML(module.title)}</h2>
        <p class="lead">${app.escapeHTML(module.hook)}</p>

        <div class="learning-flow" style="margin-top:24px">
          ${module.flow
            .map(
              ([label, text]) => `
                <div class="flow-step">
                  <b>${app.escapeHTML(label)}</b>
                  <span>${app.escapeHTML(text)}</span>
                </div>
              `,
            )
            .join("")}
        </div>

        <div class="two-column" style="margin-top:24px;align-items:start">
          <section>
            <h3>생활 장면</h3>
            <p>${app.escapeHTML(module.lifeScene)}</p>
            <h3 style="margin-top:22px">답안 연결</h3>
            <p>${app.escapeHTML(module.outcome)}</p>
          </section>
          <section>
            <h3>답안 골격</h3>
            <div class="timeline">
              ${module.answerFrame
                .map(
                  (item, index) => `
                    <div class="timeline-item">
                      <div class="step">0${index + 1}</div>
                      <div>${app.escapeHTML(item)}</div>
                    </div>
                  `,
                )
                .join("")}
            </div>
          </section>
        </div>

        ${renderDemLesson(module.demLesson)}

        <section style="margin-top:26px">
          <div class="section-head">
            <div>
              <h2>연계 기출</h2>
              <p>Q-net 원문에서 추출한 문항 중 이 모듈과 바로 이어지는 문제입니다.</p>
            </div>
          </div>
          <div class="question-list">
            ${
              related.length
                ? related
                    .map(
                      (question) => `
                        <article class="question-item">
                          <strong>제${question.exam.round}회 ${question.period}교시 ${question.no}번</strong>
                          <p style="margin:8px 0 0">${app.escapeHTML(question.text)}</p>
                        </article>
                      `,
                    )
                    .join("")
                : `<div class="empty-state">연계 문항이 없습니다.</div>`
            }
          </div>
        </section>
      </div>
    `;
  }

  function selectModule(id) {
    const module = modules.find((item) => item.id === id) ?? modules[0];
    document.querySelectorAll("[data-module-id]").forEach((button) => {
      button.classList.toggle("active", button.dataset.moduleId === module.id);
    });
    renderDetail(module);
    if (window.location.hash !== `#${module.id}`) {
      window.history.replaceState(null, "", `#${module.id}`);
    }
  }

  if (list && detail && modules.length) {
    list.innerHTML = modules
      .map(
        (module) => `
          <button class="module-button" type="button" data-module-id="${module.id}">
            <strong>${app.escapeHTML(module.mark)} · ${app.escapeHTML(module.title)}</strong>
            <span>${app.escapeHTML(module.subtitle)}</span>
          </button>
        `,
      )
      .join("");

    list.addEventListener("click", (event) => {
      const button = event.target.closest("[data-module-id]");
      if (button) {
        selectModule(button.dataset.moduleId);
      }
    });

    detail.addEventListener("click", (event) => {
      const trigger = event.target.closest("[data-zoom-src]");
      if (!trigger) {
        return;
      }
      openImageViewer(trigger.dataset.zoomSrc, trigger.dataset.zoomAlt, trigger.dataset.zoomTitle);
    });

    const hashModule = window.location.hash.replace("#", "");
    selectModule(modules.some((module) => module.id === hashModule) ? hashModule : modules[0].id);
  }
});
