document.addEventListener("DOMContentLoaded", () => {
  const app = window.SurveyorApp;
  const modules = window.CURRICULUM_MODULES ?? [];
  const list = document.querySelector("[data-module-list]");
  const detail = document.querySelector("[data-module-detail]");

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

        <section style="margin-top:26px">
          <div class="section-head">
            <div>
              <h2>연결 기출</h2>
              <p>Q-net 원문에서 추출된 문항 중 이 모듈과 바로 이어지는 문제입니다.</p>
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
                : `<div class="empty-state">연결 문항이 없습니다.</div>`
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

    selectModule(modules[0].id);
  }
});
