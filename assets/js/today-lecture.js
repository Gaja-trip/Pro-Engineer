document.addEventListener("DOMContentLoaded", () => {
  const app = window.SurveyorApp;
  const data = window.TODAY_LECTURE ?? { lectures: [] };
  const list = document.querySelector("[data-today-lecture-list]");
  const detail = document.querySelector("[data-today-lecture-detail]");
  let selectedId = data.lectures[0]?.id;

  function questionMeta(question) {
    return `제${question.examRound}회 · ${question.period}교시 ${question.no}번`;
  }

  function renderBullets(items = []) {
    return items.map((item) => `<li>${app.escapeHTML(item)}</li>`).join("");
  }

  function renderReportSummary(summary) {
    if (!summary) {
      return "";
    }

    return `
      <section class="lecture-report">
        <div class="detail-heading">
          <span>보고서 핵심 정리</span>
          <h3>${app.escapeHTML(summary.title)}</h3>
        </div>
        <ul class="summary-list">
          ${renderBullets(summary.corePoints)}
        </ul>

        <div class="comparison-table" aria-label="지형도와 지적도 비교">
          <div class="comparison-row comparison-head">
            <b>구분</b>
            <b>지형도</b>
            <b>지적도</b>
          </div>
          ${(summary.comparison ?? [])
            .map(
              (row) => `
                <div class="comparison-row">
                  <b>${app.escapeHTML(row.label)}</b>
                  <span>${app.escapeHTML(row.topographic)}</span>
                  <span>${app.escapeHTML(row.cadastral)}</span>
                </div>
              `,
            )
            .join("")}
        </div>

        <div class="insight-grid">
          <div>
            <h4>주요 원인</h4>
            <ul>${renderBullets(summary.causes)}</ul>
          </div>
          <div>
            <h4>현장 영향</h4>
            <ul>${renderBullets(summary.effects)}</ul>
          </div>
        </div>
      </section>
    `;
  }

  function renderAnswerExample(example) {
    if (!example) {
      return "";
    }

    return `
      <section class="answer-example">
        <div class="detail-heading">
          <span>답안 예시</span>
          <h3>${app.escapeHTML(example.title)}</h3>
        </div>
        <p class="answer-opening">${app.escapeHTML(example.opening)}</p>
        <div class="answer-example-grid">
          ${(example.sections ?? [])
            .map(
              (section) => `
                <section class="answer-example-section">
                  <h4>${app.escapeHTML(section.heading)}</h4>
                  <ul>${renderBullets(section.points)}</ul>
                </section>
              `,
            )
            .join("")}
        </div>
        <p class="answer-closing">${app.escapeHTML(example.closing)}</p>
      </section>
    `;
  }

  function renderList() {
    if (!list) {
      return;
    }

    list.innerHTML = data.lectures.length
      ? data.lectures
          .map(
            (lecture, index) => `
              <button class="lecture-problem-button ${lecture.id === selectedId ? "active" : ""}" type="button" data-lecture-id="${lecture.id}">
                <strong>${index + 1}. ${app.escapeHTML(lecture.title)}</strong>
                <span>측량 ${questionMeta(lecture.surveyQuestion)}</span>
                <span>지적 ${questionMeta(lecture.cadastralQuestion)}</span>
              </button>
            `,
          )
          .join("")
      : `<div class="empty-state">오늘 강의 데이터가 없습니다. npm run build:lecture를 실행해 주세요.</div>`;
  }

  function renderDetail() {
    if (!detail) {
      return;
    }

    const lecture = data.lectures.find((item) => item.id === selectedId) ?? data.lectures[0];
    if (!lecture) {
      detail.innerHTML = `<div class="empty-state">문제를 선택해 주세요.</div>`;
      return;
    }

    detail.innerHTML = `
      <article class="lecture-card">
        <div class="tag-row">
          ${lecture.keywords.slice(0, 5).map((keyword) => `<span class="tag">${app.escapeHTML(keyword)}</span>`).join("")}
        </div>
        <h2 style="margin:14px 0 8px">${app.escapeHTML(lecture.title)}</h2>

        <div class="pair-grid">
          <div class="pair-box">
            <b>측량 및 지형공간정보기술사</b>
            <p style="margin:0;color:var(--muted)">${questionMeta(lecture.surveyQuestion)}</p>
            <p style="margin:10px 0 0">${app.escapeHTML(lecture.surveyQuestion.text)}</p>
          </div>
          <div class="pair-box">
            <b>지적기술사</b>
            <p style="margin:0;color:var(--muted)">${questionMeta(lecture.cadastralQuestion)}</p>
            <p style="margin:10px 0 0">${app.escapeHTML(lecture.cadastralQuestion.text)}</p>
          </div>
        </div>

        <div class="answer-paper" style="margin-top:16px">
          <section class="answer-block">
            <h4>설명</h4>
            <p>${app.escapeHTML(lecture.overlapReason)}</p>
            <p>${app.escapeHTML(lecture.solution.intro)}</p>
          </section>
          <section class="answer-block">
            <h4>답안 작성 순서</h4>
            <ol>
              ${lecture.solution.steps.map((step) => `<li>${app.escapeHTML(step)}</li>`).join("")}
            </ol>
          </section>
          <section class="answer-block">
            <h4>현장감 문장</h4>
            <p>${app.escapeHTML(lecture.solution.fieldLink)}</p>
          </section>
          <section class="answer-block">
            <h4>마무리 방향</h4>
            <p>${app.escapeHTML(lecture.solution.closing)}</p>
          </section>
        </div>

        ${renderReportSummary(lecture.reportSummary)}
        ${renderAnswerExample(lecture.answerExample)}
      </article>
    `;
  }

  list?.addEventListener("click", (event) => {
    const button = event.target.closest("[data-lecture-id]");
    if (!button) {
      return;
    }
    selectedId = button.dataset.lectureId;
    renderList();
    renderDetail();
  });

  renderList();
  renderDetail();
});
