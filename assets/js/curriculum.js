document.addEventListener("DOMContentLoaded", () => {
  const app = window.SurveyorApp;
  const modules = window.CURRICULUM_MODULES ?? [];
  const list = document.querySelector("[data-module-list]");
  const detail = document.querySelector("[data-module-detail]");

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
          <img src="${app.escapeHTML(lesson.image)}" alt="DEM의 개념, 종류, 생성 과정, 활용 사례를 정리한 인포그래픽">
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

    const hashModule = window.location.hash.replace("#", "");
    selectModule(modules.some((module) => module.id === hashModule) ? hashModule : modules[0].id);
  }
});
