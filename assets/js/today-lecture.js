document.addEventListener("DOMContentLoaded", () => {
  const app = window.SurveyorApp;
  const data = window.TODAY_LECTURE ?? { lectures: [] };
  const list = document.querySelector("[data-today-lecture-list]");
  const summary = document.querySelector("[data-today-lecture-summary]");

  if (summary) {
    summary.innerHTML = `
      <div class="metric"><strong>${data.lectures.length}</strong><span>공통 예상 문항</span></div>
      <div class="metric"><strong>2</strong><span>비교 대상 종목</span></div>
      <div class="metric"><strong>2015-2026</strong><span>Q-net 과년도 범위</span></div>
      <div class="metric"><strong>답안형</strong><span>풀이 루틴 포함</span></div>
    `;
  }

  if (!list) {
    return;
  }

  list.innerHTML = data.lectures.length
    ? data.lectures
        .map(
          (lecture, index) => `
            <article class="lecture-card">
              <div class="tag-row">
                <span class="tag">오늘 강의 ${index + 1}</span>
                ${lecture.keywords.slice(0, 4).map((keyword) => `<span class="tag">${app.escapeHTML(keyword)}</span>`).join("")}
              </div>
              <h2 style="margin:14px 0 8px">${app.escapeHTML(lecture.title)}</h2>
              <p style="margin:0;color:var(--muted)">${app.escapeHTML(lecture.overlapReason)}</p>

              <div class="pair-grid">
                <div class="pair-box">
                  <b>측량 및 지형공간정보기술사</b>
                  <p style="margin:0;color:var(--muted)">제${lecture.surveyQuestion.examRound}회 · ${lecture.surveyQuestion.period}교시 ${lecture.surveyQuestion.no}번</p>
                  <p style="margin:10px 0 0">${app.escapeHTML(lecture.surveyQuestion.text)}</p>
                </div>
                <div class="pair-box">
                  <b>지적기술사</b>
                  <p style="margin:0;color:var(--muted)">제${lecture.cadastralQuestion.examRound}회 · ${lecture.cadastralQuestion.period}교시 ${lecture.cadastralQuestion.no}번</p>
                  <p style="margin:10px 0 0">${app.escapeHTML(lecture.cadastralQuestion.text)}</p>
                </div>
              </div>

              <div class="answer-paper" style="margin-top:16px">
                <section class="answer-block">
                  <h4>풀이 접근</h4>
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
            </article>
          `,
        )
        .join("")
    : `<div class="empty-state">오늘 강의 데이터가 없습니다. npm run build:lecture를 실행해 주세요.</div>`;
});
