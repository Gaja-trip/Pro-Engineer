document.addEventListener("DOMContentLoaded", () => {
  const app = window.SurveyorApp;
  const surveyData = app.getExamData();
  const cadastralData = window.QNET_CADASTRAL_EXAMS ?? { exams: [], source: {} };
  const topics = surveyData.topics ?? [];
  const topicLabels = Object.fromEntries(topics.map((topic) => [topic.id, topic.label]));

  const subjectFilter = document.querySelector("[data-subject-filter]");
  const yearFilter = document.querySelector("[data-year-filter]");
  const topicFilter = document.querySelector("[data-topic-filter]");
  const searchInput = document.querySelector("[data-search]");
  const list = document.querySelector("[data-exam-list]");
  const detail = document.querySelector("[data-exam-detail]");
  const heat = document.querySelector("[data-heatmap]");
  const bars = document.querySelector("[data-exam-topic-bars]");
  const qnetSourceList = document.querySelector("[data-qnet-source-list]");

  const subjectMeta = {
    survey: {
      label: "측량 및 지형공간정보기술사",
      shortLabel: "측량",
      sourceUrl: surveyData.source?.url ?? "https://www.q-net.or.kr/cst006.do?id=cst00601&code=1203&gSite=Q&gId=",
    },
    cadastral: {
      label: "지적기술사",
      shortLabel: "지적",
      sourceUrl: cadastralData.source?.surveySource ?? "https://www.q-net.or.kr/cst006.do?id=cst00601&code=1203&gSite=Q&gId=",
    },
  };

  const topicRules = [
    { id: "gnss", words: ["gnss", "gps", "측지", "측지계", "좌표", "기준점", "삼각", "수준", "위성", "utm", "원점"] },
    { id: "remote", words: ["항공사진", "정사", "lidar", "라이다", "드론", "uav", "원격탐사", "영상", "사진측량"] },
    { id: "gis", words: ["gis", "공간분석", "dem", "수치표고", "주제도", "중첩", "보간", "공간정보"] },
    { id: "digital", words: ["디지털트윈", "3차원", "입체", "geoai", "ai", "스마트", "플랫폼", "메타버스"] },
    { id: "field", words: ["하천", "도로", "철도", "터널", "준공", "시공", "현황측량", "지하시설", "관리"] },
    { id: "policy", words: ["지적", "경계", "토지", "공부", "재조사", "등록", "공시", "법", "조정금", "소유권", "필지"] },
  ];

  function inferTopic(text) {
    const normalized = String(text ?? "").toLowerCase();
    const rule = topicRules.find((item) => item.words.some((word) => normalized.includes(word.toLowerCase())));
    return rule?.id ?? "policy";
  }

  function normalizeExam(exam, subject) {
    const periods = (exam.periods ?? []).map((period) => ({
      ...period,
      questions: (period.questions ?? []).map((question) => {
        const topic = question.topic ?? inferTopic(question.text);
        return {
          ...question,
          topic,
          topicLabel: question.topicLabel ?? topicLabels[topic] ?? "정책·법률",
        };
      }),
    }));
    const totalQuestions = exam.totalQuestions ?? periods.reduce((sum, period) => sum + period.questions.length, 0);

    return {
      ...exam,
      periods,
      subject,
      subjectLabel: subjectMeta[subject].label,
      subjectShortLabel: subjectMeta[subject].shortLabel,
      qnetSourceUrl: exam.qnetSourceUrl ?? subjectMeta[subject].sourceUrl,
      postedAt: exam.postedAt ?? "Q-net 공개자료",
      totalQuestions,
    };
  }

  const allExams = [
    ...(surveyData.exams ?? []).map((exam) => normalizeExam(exam, "survey")),
    ...(cadastralData.exams ?? []).map((exam) => normalizeExam(exam, "cadastral")),
  ];

  const groupMap = new Map();
  allExams.forEach((exam) => {
    const key = `round-${exam.round}`;
    const group = groupMap.get(key) ?? { key, round: exam.round, year: exam.year, exams: [] };
    group.year = Math.max(group.year ?? 0, exam.year ?? 0);
    group.exams.push(exam);
    group.exams.sort((a, b) => (a.subject === "survey" ? -1 : 1) - (b.subject === "survey" ? -1 : 1));
    groupMap.set(key, group);
  });

  const examGroups = [...groupMap.values()].sort((a, b) => b.round - a.round);
  let selectedGroupKey = examGroups[0]?.key;

  function setupFilters() {
    const years = [...new Set(examGroups.map((group) => group.year).filter(Boolean))].sort((a, b) => b - a);
    subjectFilter.innerHTML = `
      <option value="">전체 과목</option>
      <option value="survey">측량 및 지형공간정보기술사</option>
      <option value="cadastral">지적기술사</option>
    `;
    yearFilter.innerHTML = `<option value="">전체 연도</option>${years
      .map((year) => `<option value="${year}">${year}년</option>`)
      .join("")}`;
    topicFilter.innerHTML = `<option value="">전체 주제</option>${topics
      .map((topic) => `<option value="${topic.id}">${app.escapeHTML(topic.label)}</option>`)
      .join("")}`;
  }

  function currentFilters() {
    return {
      subject: subjectFilter.value,
      year: yearFilter.value,
      topic: topicFilter.value,
      term: searchInput.value.trim().toLowerCase(),
    };
  }

  function questionPasses(question, filters, titleMatches = false) {
    const topicMatch = !filters.topic || question.topic === filters.topic;
    const termMatch = !filters.term || titleMatches || question.text.toLowerCase().includes(filters.term);
    return topicMatch && termMatch;
  }

  function examPasses(exam, filters) {
    if (filters.subject && exam.subject !== filters.subject) {
      return false;
    }
    if (filters.year && String(exam.year) !== filters.year) {
      return false;
    }

    const titleMatches =
      !filters.term ||
      exam.title.toLowerCase().includes(filters.term) ||
      exam.subjectLabel.toLowerCase().includes(filters.term) ||
      String(exam.round).includes(filters.term);

    return exam.periods.some((period) =>
      period.questions.some((question) => questionPasses(question, filters, titleMatches)),
    );
  }

  function filteredGroups() {
    const filters = currentFilters();
    return examGroups.filter((group) => group.exams.some((exam) => examPasses(exam, filters)));
  }

  function visibleQuestions(period, exam, filters) {
    const titleMatches =
      !filters.term ||
      exam.title.toLowerCase().includes(filters.term) ||
      exam.subjectLabel.toLowerCase().includes(filters.term) ||
      String(exam.round).includes(filters.term);

    return period.questions.filter((question) => questionPasses(question, filters, titleMatches));
  }

  function visibleQuestionCount(exam, filters) {
    return exam.periods.reduce((sum, period) => sum + visibleQuestions(period, exam, filters).length, 0);
  }

  function topicCountsFor(exams) {
    const counts = Object.fromEntries(topics.map((topic) => [topic.id, 0]));
    exams.forEach((exam) => {
      exam.periods.forEach((period) => {
        period.questions.forEach((question) => {
          counts[question.topic] = (counts[question.topic] ?? 0) + 1;
        });
      });
    });
    return counts;
  }

  function renderHeatmap() {
    if (!heat) {
      return;
    }
    const topicIds = topics.map((topic) => topic.id);
    const rows = examGroups.map((group) => ({
      round: group.round,
      topics: topicCountsFor(group.exams),
    }));
    const max = Math.max(1, ...rows.flatMap((row) => topicIds.map((topic) => row.topics[topic] ?? 0)));

    heat.innerHTML = `
      <div class="heat-row" aria-hidden="true">
        <strong>회차</strong>
        ${topics.map((topic) => `<strong style="font-size:12px">${app.escapeHTML(topic.label.split("·")[0])}</strong>`).join("")}
      </div>
      ${rows
        .slice()
        .reverse()
        .map(
          (row) => `
            <div class="heat-row">
              <strong>${row.round}</strong>
              ${topicIds
                .map((topic) => {
                  const value = row.topics[topic] ?? 0;
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
    if (!bars) {
      return;
    }
    const filters = currentFilters();
    const exams = allExams.filter((exam) => {
      const subjectMatch = !filters.subject || exam.subject === filters.subject;
      const yearMatch = !filters.year || String(exam.year) === filters.year;
      return subjectMatch && yearMatch;
    });
    const counts = topicCountsFor(exams);
    const rows = topics
      .map((topic) => ({ label: topic.label, value: counts[topic.id] ?? 0 }))
      .sort((a, b) => b.value - a.value);
    app.renderBars(bars, rows, { suffix: "문" });
  }

  function renderQnetSourceList() {
    if (!qnetSourceList) {
      return;
    }

    qnetSourceList.innerHTML = examGroups
      .slice(0, 8)
      .map((group) => {
        const subjectTags = group.exams
          .map((exam) => `<span class="tag">${app.escapeHTML(exam.subjectShortLabel)} ${exam.totalQuestions}문항</span>`)
          .join("");
        return `
          <article class="question-item">
            <div class="tag-row">
              <span class="tag">제${group.round}회</span>
              <span class="tag">${group.year}년</span>
              ${subjectTags}
            </div>
            <p style="margin:10px 0 0">측량 및 지형공간정보기술사와 지적기술사 Q-net 공개 기출을 회차별로 통합 표시합니다.</p>
          </article>
        `;
      })
      .join("");
  }

  function renderList() {
    const groups = filteredGroups();
    if (!groups.some((group) => group.key === selectedGroupKey)) {
      selectedGroupKey = groups[0]?.key;
    }

    list.innerHTML = groups.length
      ? groups
          .map((group) => {
            const filters = currentFilters();
            const subjectRows = group.exams
              .filter((exam) => !filters.subject || exam.subject === filters.subject)
              .map(
                (exam) => `
                  <span>${app.escapeHTML(exam.subjectShortLabel)} <b>${visibleQuestionCount(exam, filters)}</b>문항</span>
                `,
              )
              .join("");
            return `
              <button class="exam-round-button ${group.key === selectedGroupKey ? "active" : ""}" type="button" data-select-group="${group.key}">
                <strong>제${group.round}회 · ${group.year}년</strong>
                <span class="exam-round-subjects">${subjectRows}</span>
              </button>
            `;
          })
          .join("")
      : `<div class="empty-state">조건에 맞는 기출문제가 없습니다.</div>`;

    renderDetail();
  }

  function renderSubjectExam(exam, filters) {
    const periodMarkup = exam.periods
      .map((period) => {
        const questions = visibleQuestions(period, exam, filters);
        if (!questions.length) {
          return "";
        }
        return `
          <section class="exam-period-block">
            <h3>${period.period}교시 <span>${app.escapeHTML(period.instruction)}</span></h3>
            <div class="question-list">
              ${questions
                .map(
                  (question) => `
                    <article class="question-item">
                      <div class="tag-row">${app.topicPill(question.topic, question.topicLabel)}</div>
                      <p><strong>${question.no}.</strong> ${app.escapeHTML(question.text)}</p>
                    </article>
                  `,
                )
                .join("")}
            </div>
          </section>
        `;
      })
      .join("");

    const sourceButton = exam.qnetDownloadUrl
      ? `<a class="btn secondary" href="${app.escapeHTML(exam.qnetDownloadUrl)}" target="_blank" rel="noreferrer">원문 열기</a>`
      : `<a class="btn secondary" href="${app.escapeHTML(exam.qnetSourceUrl)}" target="_blank" rel="noreferrer">Q-net 검색</a>`;

    return `
      <section class="subject-exam-panel ${exam.subject}">
        <header class="subject-exam-head">
          <div>
            <p class="eyebrow">${app.escapeHTML(exam.subjectLabel)}</p>
            <h2>${app.escapeHTML(exam.title)}</h2>
            <p>${exam.totalQuestions}문항 · ${app.escapeHTML(exam.sourceType)} · ${app.escapeHTML(exam.postedAt)}</p>
          </div>
          ${sourceButton}
        </header>
        ${periodMarkup || `<div class="empty-state">선택한 조건과 연결된 문항이 없습니다.</div>`}
        ${
          exam.fullText
            ? `
              <details class="raw-text-details">
                <summary class="btn ghost">추출 원문 텍스트 보기</summary>
                <pre class="raw-text">${app.escapeHTML(exam.fullText)}</pre>
              </details>
            `
            : ""
        }
      </section>
    `;
  }

  function renderDetail() {
    if (!detail) {
      return;
    }

    const filters = currentFilters();
    const groups = filteredGroups();
    const group = groups.find((item) => item.key === selectedGroupKey) ?? groups[0];
    if (!group) {
      detail.innerHTML = `<div class="empty-state">회차를 선택해 주세요.</div>`;
      return;
    }
    selectedGroupKey = group.key;

    const exams = group.exams.filter((exam) => examPasses(exam, filters));
    const totalVisible = exams.reduce((sum, exam) => sum + visibleQuestionCount(exam, filters), 0);

    detail.innerHTML = `
      <div class="panel pad exam-detail-shell">
        <div class="section-head">
          <div>
            <p class="eyebrow">통합 기출문제</p>
            <h2>제${group.round}회 ${group.year}년 기출문제</h2>
            <p>현재 조건 기준 ${totalVisible}문항 · 측량 및 지형공간정보기술사와 지적기술사 동시 표시</p>
          </div>
          <a class="btn secondary" href="#qnet-source-panel">Q-net 원문 위치</a>
        </div>
        <div class="exam-subject-grid">
          ${exams.map((exam) => renderSubjectExam(exam, filters)).join("")}
        </div>
      </div>
    `;
  }

  function renderAll() {
    renderTopicBars();
    renderHeatmap();
    renderQnetSourceList();
    renderList();
  }

  setupFilters();
  renderAll();

  [subjectFilter, yearFilter, topicFilter, searchInput].forEach((control) => {
    control.addEventListener("input", renderAll);
  });

  list.addEventListener("click", (event) => {
    const button = event.target.closest("[data-select-group]");
    if (!button) {
      return;
    }
    selectedGroupKey = button.dataset.selectGroup;
    renderList();
    detail.scrollIntoView({ behavior: "smooth", block: "start" });
  });
});
