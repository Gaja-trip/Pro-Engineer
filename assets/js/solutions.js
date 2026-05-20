document.addEventListener("DOMContentLoaded", () => {
  const app = window.SurveyorApp;
  const data = app.getExamData();
  const examSelect = document.querySelector("[data-solution-exam]");
  const periodSelect = document.querySelector("[data-solution-period]");
  const questionSelect = document.querySelector("[data-solution-question]");
  const output = document.querySelector("[data-solution-output]");

  function commandType(text) {
    if (text.includes("비교")) return "비교형";
    if (text.includes("방안") || text.includes("개선")) return "대책형";
    if (text.includes("절차") || text.includes("방법")) return "공정형";
    if (text.includes("원리")) return "원리형";
    return "설명형";
  }

  function populateExams() {
    examSelect.innerHTML = data.exams
      .map((exam) => `<option value="${exam.id}">제${exam.round}회 · ${exam.year}년</option>`)
      .join("");
  }

  function selectedExam() {
    return data.exams.find((exam) => exam.id === examSelect.value) ?? data.exams[0];
  }

  function selectedPeriod() {
    const exam = selectedExam();
    return exam.periods.find((period) => String(period.period) === periodSelect.value) ?? exam.periods[0];
  }

  function selectedQuestion() {
    const period = selectedPeriod();
    return period.questions.find((question) => String(question.no) === questionSelect.value) ?? period.questions[0];
  }

  function populatePeriods() {
    const exam = selectedExam();
    periodSelect.innerHTML = exam.periods
      .map((period) => `<option value="${period.period}">${period.period}교시 · ${period.questions.length}문항</option>`)
      .join("");
    populateQuestions();
  }

  function populateQuestions() {
    const period = selectedPeriod();
    questionSelect.innerHTML = period.questions
      .map((question) => `<option value="${question.no}">${question.no}번 · ${app.escapeHTML(question.text.slice(0, 42))}</option>`)
      .join("");
    renderSolution();
  }

  function renderSolution() {
    const exam = selectedExam();
    const period = selectedPeriod();
    const question = selectedQuestion();
    const module = app.moduleById(question.module);
    const type = commandType(question.text);

    output.innerHTML = `
      <div class="answer-paper">
        <div class="tag-row">
          <span class="tag">제${exam.round}회 ${period.period}교시 ${question.no}번</span>
          <span class="tag">${type}</span>
          ${app.topicPill(question.topic, question.topicLabel)}
        </div>
        <h3 style="margin-top:18px">${app.escapeHTML(question.text)}</h3>

        <section class="answer-block">
          <h4>1. 문제 해체</h4>
          <p>핵심 대상은 <b>${app.escapeHTML(question.topicLabel)}</b>이며, 요구 형식은 <b>${type}</b>입니다. 먼저 정의와 필요성을 짧게 잡고, 이후 원리·절차·정확도·활용 순서로 확장합니다.</p>
        </section>

        <section class="answer-block">
          <h4>2. 답안 뼈대</h4>
          <ol>
            ${(module?.answerFrame ?? ["개요", "핵심 원리", "적용 절차", "기대효과"])
              .map((item) => `<li>${app.escapeHTML(item)}</li>`)
              .join("")}
          </ol>
        </section>

        <section class="answer-block">
          <h4>3. 실생활 연결 문장</h4>
          <p>${app.escapeHTML(module?.hook ?? "현장에서 관찰 가능한 공간정보 현상을 먼저 제시합니다.")}</p>
        </section>

        <section class="answer-block">
          <h4>4. 25점형 작성 루틴</h4>
          <p>개요 3줄, 본론 4개 묶음, 도식 1개, 결론 2줄로 제한합니다. 대책형은 “현황-문제-기술대안-제도대안”, 비교형은 “기준축-차이-선택조건-활용” 순서가 안정적입니다.</p>
        </section>
      </div>
    `;
  }

  if (!data.exams.length) {
    output.innerHTML = `<div class="empty-state">기출 데이터가 없습니다. npm run sync:qnet을 먼저 실행해 주세요.</div>`;
    return;
  }

  populateExams();
  populatePeriods();
  examSelect.addEventListener("change", populatePeriods);
  periodSelect.addEventListener("change", populateQuestions);
  questionSelect.addEventListener("change", renderSolution);
});
