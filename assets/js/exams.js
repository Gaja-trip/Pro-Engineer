document.addEventListener("DOMContentLoaded", () => {
  const app = window.SurveyorApp;
  const data = app.getExamData();
  const topics = data.topics ?? [];
  let selectedExamId = data.exams[0]?.id;

  const yearFilter = document.querySelector("[data-year-filter]");
  const topicFilter = document.querySelector("[data-topic-filter]");
  const searchInput = document.querySelector("[data-search]");
  const list = document.querySelector("[data-exam-list]");
  const detail = document.querySelector("[data-exam-detail]");
  const heat = document.querySelector("[data-heatmap]");
  const bars = document.querySelector("[data-exam-topic-bars]");

  function setupFilters() {
    const years = [...new Set(data.exams.map((exam) => exam.year))].sort((a, b) => b - a);
    yearFilter.innerHTML = `<option value="">전체 연도</option>${years
      .map((year) => `<option value="${year}">${year}년</option>`)
      .join("")}`;
    topicFilter.innerHTML = `<option value="">전체 주제</option>${topics
      .map((topic) => `<option value="${topic.id}">${app.escapeHTML(topic.label)}</option>`)
      .join("")}`;
  }

  function filteredExams() {
    const year = yearFilter.value;
    const topic = topicFilter.value;
    const term = searchInput.value.trim().toLowerCase();

    return data.exams.filter((exam) => {
      const yearMatch = !year || String(exam.year) === year;
      const topicMatch = !topic || (exam.topicCounts[topic] ?? 0) > 0;
      const termMatch =
        !term ||
        exam.title.toLowerCase().includes(term) ||
        exam.periods.some((period) =>
          period.questions.some((question) => question.text.toLowerCase().includes(term)),
        );
      return yearMatch && topicMatch && termMatch;
    });
  }

  function renderHeatmap() {
    const topicIds = topics.map((topic) => topic.id);
    const max = Math.max(
      1,
      ...data.analysis.yearStats.flatMap((stat) => topicIds.map((topic) => stat.topics[topic] ?? 0)),
    );

    heat.innerHTML = `
      <div class="heat-row" aria-hidden="true">
        <strong>회차</strong>
        ${topics.map((topic) => `<strong style="font-size:12px">${app.escapeHTML(topic.label.split("·")[0])}</strong>`).join("")}
      </div>
      ${data.analysis.yearStats
        .slice()
        .reverse()
        .map(
          (stat) => `
            <div class="heat-row">
              <strong>${stat.round}</strong>
              ${topicIds
                .map((topic) => {
                  const value = stat.topics[topic] ?? 0;
                  const heatValue = Math.round((value / max) * 72);
                  return `<div class="heat-cell" style="--heat:${heatValue}">${value}</div>`;
                })
                .join("")}
            </div>
          `,
        )
        .join("")}
    `;
  }

  function renderTopicBars() {
    const labels = data.analysis.topicLabels ?? {};
    const rows = Object.entries(data.analysis.topicTotals ?? {})
      .map(([topic, value]) => ({ label: labels[topic] ?? topic, value }))
      .sort((a, b) => b.value - a.value);
    app.renderBars(bars, rows, { suffix: "문" });
  }

  function renderList() {
    const exams = filteredExams();
    if (!exams.some((exam) => exam.id === selectedExamId)) {
      selectedExamId = exams[0]?.id;
    }

    list.innerHTML = exams.length
      ? exams
          .map(
            (exam) => `
              <article class="exam-card">
                <div class="round-badge">제${exam.round}회</div>
                <div>
                  <div class="tag-row">
                    <span class="tag">${exam.year}년</span>
                    <span class="tag">${exam.sourceType}</span>
                    <span class="tag">${exam.totalQuestions}문항</span>
                  </div>
                  <h3 style="margin:10px 0 4px">${app.escapeHTML(exam.title)}</h3>
                  <p style="margin:0;color:var(--muted)">Q-net 게시일 ${app.escapeHTML(exam.postedAt)}</p>
                </div>
                <button class="btn secondary" type="button" data-select-exam="${exam.id}">문항 보기</button>
              </article>
            `,
          )
          .join("")
      : `<div class="empty-state">조건에 맞는 기출문제가 없습니다.</div>`;

    renderDetail();
  }

  function renderDetail() {
    const exam = data.exams.find((item) => item.id === selectedExamId);
    if (!exam) {
      detail.innerHTML = `<div class="empty-state">회차를 선택해 주세요.</div>`;
      return;
    }

    const topic = topicFilter.value;
    const periodMarkup = exam.periods
      .map((period) => {
        const questions = topic ? period.questions.filter((question) => question.topic === topic) : period.questions;
        if (questions.length === 0) {
          return "";
        }
        return `
          <section style="margin-top:20px">
            <h3>${period.period}교시 <span style="color:var(--muted);font-size:14px">${app.escapeHTML(period.instruction)}</span></h3>
            <div class="question-list">
              ${questions
                .map(
                  (question) => `
                    <article class="question-item">
                      <div class="tag-row">${app.topicPill(question.topic, question.topicLabel)}</div>
                      <p style="margin:10px 0 0"><strong>${question.no}.</strong> ${app.escapeHTML(question.text)}</p>
                    </article>
                  `,
                )
                .join("")}
            </div>
          </section>
        `;
      })
      .join("");

    detail.innerHTML = `
      <div class="panel pad">
        <div class="section-head">
          <div>
            <p class="eyebrow">Q-net 원문 변환</p>
            <h2>제${exam.round}회 ${exam.year}년 기출문제</h2>
            <p>${exam.totalQuestions}문항 · 원본 ${app.escapeHTML(exam.sourceType)} · 게시일 ${app.escapeHTML(exam.postedAt)}</p>
          </div>
          <a class="btn secondary" href="${app.escapeHTML(exam.qnetDownloadUrl)}" target="_blank" rel="noreferrer">원문 열기</a>
        </div>
        ${periodMarkup || `<div class="empty-state">선택한 주제와 연결된 문항이 없습니다.</div>`}
        <details style="margin-top:22px">
          <summary class="btn ghost" style="display:inline-flex">추출 원문 텍스트 보기</summary>
          <pre class="raw-text">${app.escapeHTML(exam.fullText)}</pre>
        </details>
      </div>
    `;
  }

  setupFilters();
  renderHeatmap();
  renderTopicBars();
  renderList();

  [yearFilter, topicFilter, searchInput].forEach((control) => {
    control.addEventListener("input", renderList);
  });

  list.addEventListener("click", (event) => {
    const button = event.target.closest("[data-select-exam]");
    if (!button) {
      return;
    }
    selectedExamId = button.dataset.selectExam;
    renderDetail();
    detail.scrollIntoView({ behavior: "smooth", block: "start" });
  });
});
