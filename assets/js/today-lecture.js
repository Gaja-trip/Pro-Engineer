document.addEventListener("DOMContentLoaded", () => {
  const app = window.SurveyorApp;
  const data = window.TODAY_LECTURE ?? { lectures: [] };
  const list = document.querySelector("[data-today-lecture-list]");
  const detail = document.querySelector("[data-today-lecture-detail]");
  let selectedId = data.lectures[0]?.id;
  let selectedPage = "explanation";

  function questionMeta(question) {
    return `제${question.examRound}회 · ${question.period}교시 ${question.no}번`;
  }

  function renderBullets(items = []) {
    return items.map((item) => `<li>${app.escapeHTML(item)}</li>`).join("");
  }

  function answerKeywordsFor(lecture) {
    const sectionWords = (lecture.answerExample?.sections ?? []).map((section) => section.heading.replace(/^\d+\.\s*/, ""));
    return [...new Set([...(lecture.keywords ?? []), ...sectionWords])].slice(0, 10);
  }

  function summaryFor(lecture) {
    if (lecture.reportSummary) {
      return lecture.reportSummary;
    }

    return {
      title: `${lecture.title} 핵심정리`,
      corePoints: [
        lecture.overlapReason,
        `${lecture.title}는 측량 및 지형공간정보기술사의 기술적 정확도와 지적기술사의 권리·공시 안정성이 만나는 주제다.`,
        "답안은 정의에서 시작해 제도·기술·성과검증·활용효과 순서로 전개하면 안정적이다.",
      ],
      causes: (lecture.solution.steps ?? []).map((step) => step.replace(/^\d+\.\s*/, "")),
      effects: [
        lecture.solution.fieldLink,
        "현장 사례, 정부 정책, 품질관리 기준을 결론에 연결하면 답안의 현실성이 높아진다.",
      ],
    };
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

        ${
          summary.comparison
            ? `
              <div class="comparison-table" aria-label="핵심 비교">
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
            `
            : ""
        }

        <div class="insight-grid">
          <div>
            <h4>${summary.comparison ? "주요 원인" : "목차 프레임"}</h4>
            <ul>${renderBullets(summary.causes)}</ul>
          </div>
          <div>
            <h4>${summary.comparison ? "현장 영향" : "답안 연결"}</h4>
            <ul>${renderBullets(summary.effects)}</ul>
          </div>
        </div>
      </section>
    `;
  }

  function renderAnswerExample(lecture) {
    const example = lecture.answerExample;
    if (!example) {
      return "";
    }
    const keywords = answerKeywordsFor(lecture);

    return `
      <section class="answer-example">
        <div class="detail-heading">
          <span>답안 예시</span>
          <h3>${app.escapeHTML(example.title)}</h3>
        </div>
        <div class="answer-keyword-panel">
          <b>답안 키워드</b>
          <div>
            ${keywords.map((keyword) => `<span>${app.escapeHTML(keyword)}</span>`).join("")}
          </div>
        </div>
        <div class="answer-outline-panel">
          <b>작성 순서</b>
          <ol>
            ${(lecture.solution.steps ?? []).map((step) => `<li>${app.escapeHTML(step.replace(/^\d+\.\s*/, ""))}</li>`).join("")}
          </ol>
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

  function renderAgreementAnswerVersions(versions) {
    if (!versions?.length) {
      return "";
    }

    return `
      <div class="agreement-answer-versions">
        <div class="detail-heading compact">
          <span>심화 답안 버전</span>
          <h3>토지소유자간 합의에 의한 경계결정 문제점과 개선방안</h3>
        </div>
        <div class="agreement-version-grid">
          ${versions
            .map(
              (version) => `
                <article class="agreement-version-card">
                  <header>
                    <span class="version-label">${app.escapeHTML(version.label)}</span>
                    <h4>${app.escapeHTML(version.title)}</h4>
                    <p class="version-target">${app.escapeHTML(version.target)}</p>
                  </header>
                  <div class="version-keyword-row">
                    ${(version.keywords ?? []).map((keyword) => `<span>${app.escapeHTML(keyword)}</span>`).join("")}
                  </div>
                  <p class="version-opening">${app.escapeHTML(version.opening)}</p>
                  ${(version.sections ?? [])
                    .map(
                      (section) => `
                        <section class="agreement-version-section">
                          <b>${app.escapeHTML(section.heading)}</b>
                          <ul>${renderBullets(section.points)}</ul>
                        </section>
                      `,
                    )
                    .join("")}
                  <p class="version-closing">${app.escapeHTML(version.closing)}</p>
                </article>
              `,
            )
            .join("")}
        </div>
      </div>
    `;
  }

  function renderBasicLecture(lecture) {
    if (!lecture) {
      return "";
    }
    const lectureToc = lecture.toc ?? [
      ...(lecture.flow ?? []).map((item) => ({ title: item.label, detail: item.text })),
      ...(lecture.concepts ?? []).slice(0, 3).map((concept) => ({ title: concept.title, detail: concept.summary })),
    ].slice(0, 7);
    const lectureMaterials = lecture.materials ?? [
      { title: "강의 도입 자료", text: lecture.lead },
      ...(lecture.concepts ?? []).map((concept) => ({
        title: `${concept.kicker}: ${concept.title}`,
        text: `${concept.summary} 핵심어는 ${(concept.points ?? []).join(", ")}이다.`,
      })),
      { title: "답안 전환 자료", text: lecture.memoryLine },
    ].slice(0, 7);

    return `
      <section class="basic-lecture">
        <div class="detail-heading">
          <span>기본강의</span>
          <h3>${app.escapeHTML(lecture.title)}</h3>
        </div>
        <p class="presentation-subtitle">${app.escapeHTML(lecture.subtitle)}</p>

        <div class="basic-hero">
          <div>
            <span class="card-news-label">먼저 잡을 큰 그림</span>
            <h4>${app.escapeHTML(lecture.coreMessage)}</h4>
            <p>${app.escapeHTML(lecture.lead)}</p>
          </div>
          <div class="basic-flow-visual" aria-hidden="true">
            ${(lecture.flow ?? [])
              .map(
                (item) => `
                  <div class="basic-flow-step">
                    <b>${app.escapeHTML(item.label)}</b>
                    <span>${app.escapeHTML(item.text)}</span>
                  </div>
                `,
              )
            .join("")}
          </div>
        </div>

        <div class="lecture-content-plan">
          <div class="detail-heading compact">
            <span>강의 목차</span>
            <h3>문제 풀이 전에 다룰 순서</h3>
          </div>
          <div class="lecture-toc-grid">
            ${lectureToc
              .map(
                (item, index) => `
                  <section class="lecture-toc-card">
                    <span>${String(index + 1).padStart(2, "0")}</span>
                    <h4>${app.escapeHTML(item.title)}</h4>
                    <p>${app.escapeHTML(item.detail)}</p>
                  </section>
                `,
              )
              .join("")}
          </div>
        </div>

        <div class="concept-card-grid">
          ${(lecture.concepts ?? [])
            .map(
              (concept) => `
                <article class="concept-card">
                  <div class="concept-visual ${app.escapeHTML(concept.visual)}">
                    <span></span><span></span><span></span>
                  </div>
                  <div>
                    <span class="takeaway-meta">${app.escapeHTML(concept.kicker)}</span>
                    <h4>${app.escapeHTML(concept.title)}</h4>
                    <p>${app.escapeHTML(concept.summary)}</p>
                    <ul>${renderBullets(concept.points)}</ul>
                  </div>
                </article>
              `,
            )
            .join("")}
        </div>

        <div class="lecture-materials">
          <div class="detail-heading compact">
            <span>강의자료 구성</span>
            <h3>수업에서 설명하면 좋은 자료 묶음</h3>
          </div>
          <div class="lecture-material-list">
            ${lectureMaterials
              .map(
                (item) => `
                  <section class="lecture-material-row">
                    <b>${app.escapeHTML(item.title)}</b>
                    <p>${app.escapeHTML(item.text)}</p>
                  </section>
                `,
              )
            .join("")}
          </div>
        </div>

        ${renderAgreementAnswerVersions(lecture.answerVersions)}

        <div class="basic-knowledge">
          <div class="detail-heading compact">
            <span>기본지식</span>
            <h3>답안 전에 알아둘 핵심</h3>
          </div>
          <div class="knowledge-grid">
            ${(lecture.knowledge ?? [])
              .map(
                (item) => `
                  <section class="knowledge-card">
                    <b>${app.escapeHTML(item.term)}</b>
                    <p>${app.escapeHTML(item.explain)}</p>
                  </section>
                `,
              )
              .join("")}
          </div>
        </div>

        <p class="memory-line">${app.escapeHTML(lecture.memoryLine)}</p>
      </section>
    `;
  }

  function renderPresentationSummary(summary) {
    if (!summary) {
      return "";
    }

    return `
      <section class="presentation-summary">
        <div class="detail-heading">
          <span>PPT 이해정리</span>
          <h3>${app.escapeHTML(summary.title)}</h3>
        </div>
        <p class="presentation-subtitle">${app.escapeHTML(summary.subtitle)}</p>
        <div class="key-message">
          ${app.escapeHTML(summary.coreMessage)}
        </div>

        <div class="presentation-flow">
          ${(summary.flow ?? [])
            .map(
              (step, index) => `
                <section class="presentation-flow-card">
                  <span>${String(index + 1).padStart(2, "0")} · ${app.escapeHTML(step.label)}</span>
                  <h4>${app.escapeHTML(step.title)}</h4>
                  <p>${app.escapeHTML(step.text)}</p>
                </section>
              `,
            )
            .join("")}
        </div>

        <div class="detail-heading compact">
          <span>슬라이드별 핵심</span>
          <h3>그림 자료를 답안 문장으로 바꾸는 법</h3>
        </div>
        <div class="takeaway-grid">
          ${(summary.takeaways ?? [])
            .map(
              (item) => `
                <section class="takeaway-card">
                  <div class="takeaway-meta">Slide ${app.escapeHTML(item.slide)}</div>
                  <h4>${app.escapeHTML(item.title)}</h4>
                  <p>${app.escapeHTML(item.summary)}</p>
                  <b>${app.escapeHTML(item.answerTip)}</b>
                </section>
              `,
            )
            .join("")}
        </div>

        <div class="answer-map">
          <div class="detail-heading compact">
            <span>답안 연결</span>
            <h3>목차별로 가져갈 문장</h3>
          </div>
          ${(summary.answerMap ?? [])
            .map(
              (row) => `
                <div class="answer-map-row">
                  <b>${app.escapeHTML(row.part)}</b>
                  <span>${app.escapeHTML(row.write)}</span>
                </div>
              `,
            )
            .join("")}
        </div>

        <p class="memory-line">${app.escapeHTML(summary.memoryLine)}</p>
      </section>
    `;
  }

  function renderPptWebResource(resource) {
    if (!resource) {
      return "";
    }

    return `
      <section class="ppt-web-resource">
        <div class="detail-heading">
          <span>PPT 자료</span>
          <h3>${app.escapeHTML(resource.title)}</h3>
        </div>
        <p class="presentation-subtitle">${app.escapeHTML(resource.subtitle)}</p>

        <div class="ppt-resource-hero">
          <div>
            <span class="card-news-label">15장 웹 강의자료</span>
            <h4>${app.escapeHTML(resource.headline)}</h4>
            <p>${app.escapeHTML(resource.lead)}</p>
          </div>
          <div class="ppt-resource-meta">
            ${(resource.meta ?? [])
              .map(
                (item) => `
                  <div>
                    <b>${app.escapeHTML(item.value)}</b>
                    <span>${app.escapeHTML(item.label)}</span>
                  </div>
                `,
              )
              .join("")}
          </div>
        </div>

        <div class="ppt-phase-grid">
          ${(resource.phases ?? [])
            .map(
              (phase) => `
                <section class="ppt-phase-card">
                  <span>${app.escapeHTML(phase.range)}</span>
                  <h4>${app.escapeHTML(phase.title)}</h4>
                  <p>${app.escapeHTML(phase.summary)}</p>
                </section>
              `,
            )
            .join("")}
        </div>

        <div class="detail-heading compact">
          <span>슬라이드 웹자료</span>
          <h3>슬라이드별 핵심 내용</h3>
        </div>
        <div class="ppt-slide-grid">
          ${(resource.slides ?? [])
            .map(
              (slide) => `
                <article class="ppt-slide-card">
                  <header>
                    <span>${app.escapeHTML(slide.no)}</span>
                    <h4>${app.escapeHTML(slide.title)}</h4>
                  </header>
                  <p class="ppt-slide-subtitle">${app.escapeHTML(slide.subtitle)}</p>
                  <p class="ppt-slide-message">${app.escapeHTML(slide.message)}</p>
                  <ul>${renderBullets(slide.points)}</ul>
                </article>
              `,
            )
            .join("")}
        </div>

        <div class="answer-map">
          <div class="detail-heading compact">
            <span>답안 연결</span>
            <h3>PPT 내용을 답안 목차로 바꾸기</h3>
          </div>
          ${(resource.answerMap ?? [])
            .map(
              (row) => `
                <div class="answer-map-row">
                  <b>${app.escapeHTML(row.part)}</b>
                  <span>${app.escapeHTML(row.write)}</span>
                </div>
              `,
            )
            .join("")}
        </div>

        <p class="memory-line">${app.escapeHTML(resource.memoryLine)}</p>
      </section>
    `;
  }

  function renderCardNews(news) {
    if (!news) {
      return "";
    }

    return `
      <section class="card-news-board">
        <div class="detail-heading">
          <span>이미지형 카드뉴스</span>
          <h3>${app.escapeHTML(news.title)}</h3>
        </div>
        <p class="presentation-subtitle">${app.escapeHTML(news.subtitle)}</p>

        <div class="card-news-hero">
          <div>
            <span class="card-news-label">핵심 프레임</span>
            <h4>${app.escapeHTML(news.hero.headline)}</h4>
            <p>${app.escapeHTML(news.hero.text)}</p>
            <div class="card-news-chips">
              ${(news.hero.chips ?? []).map((chip) => `<span>${app.escapeHTML(chip)}</span>`).join("")}
            </div>
          </div>
          <div class="layer-visual" aria-hidden="true">
            <div class="layer-card terrain">
              <b>지형도</b>
              <span>도로 · 하천 · 건물</span>
            </div>
            <div class="layer-card boundary">
              <b>지적도</b>
              <span>필지 · 경계 · 지번</span>
            </div>
            <div class="layer-card solution">
              <b>정합</b>
              <span>기준점 · 좌표 · 이력</span>
            </div>
          </div>
        </div>

        <div class="card-news-grid">
          ${(news.cards ?? [])
            .map(
              (card) => `
                <article class="news-card">
                  <div class="news-card-top">
                    <span>${app.escapeHTML(card.no)}</span>
                    <b>${app.escapeHTML(card.kicker)}</b>
                  </div>
                  <h4>${app.escapeHTML(card.title)}</h4>
                  <p>${app.escapeHTML(card.caption)}</p>
                  <ul>${renderBullets(card.points)}</ul>
                </article>
              `,
            )
            .join("")}
        </div>

        <p class="card-news-closing">${app.escapeHTML(news.closing)}</p>
      </section>
    `;
  }

  function renderNewsDigest(digest) {
    if (!digest) {
      return "";
    }

    return `
      <section class="news-digest-board">
        <div class="detail-heading">
          <span>정부·언론 현장자료</span>
          <h3>${app.escapeHTML(digest.title)}</h3>
        </div>
        <p class="presentation-subtitle">${app.escapeHTML(digest.subtitle)}</p>

        <div class="news-digest-hero">
          <div>
            <span class="card-news-label">크롤링 요약</span>
            <h4>${app.escapeHTML(digest.headline)}</h4>
            <p>${app.escapeHTML(digest.context)}</p>
          </div>
          <div class="news-digest-scan" aria-hidden="true">
            <span>정부 보도자료</span>
            <span>신문 기사</span>
            <span>답안 포인트</span>
          </div>
        </div>

        <div class="news-digest-grid">
          ${(digest.sources ?? [])
            .map(
              (source, index) => `
                <article class="news-digest-card">
                  <div class="news-digest-meta">
                    <span>${app.escapeHTML(source.type)}</span>
                    <span>${app.escapeHTML(source.date)}</span>
                  </div>
                  <h4>${app.escapeHTML(source.title)}</h4>
                  <p>${app.escapeHTML(source.summary)}</p>
                  <div class="news-digest-point">
                    <b>답안 연결</b>
                    <span>${app.escapeHTML(source.answerPoint)}</span>
                  </div>
                  <div class="news-digest-actions">
                    <a href="news-detail.html?topic=${app.escapeHTML(digest.id)}&source=${index}">자료 정리 보기</a>
                    <a href="${app.escapeHTML(source.url)}" target="_blank" rel="noopener">원문 보기</a>
                  </div>
                </article>
              `,
            )
            .join("")}
        </div>

        <div class="answer-map news-answer-map">
          <div class="detail-heading compact">
            <span>서술 활용</span>
            <h3>보도자료를 답안 문장으로 바꾸는 포인트</h3>
          </div>
          ${(digest.writeTips ?? [])
            .map(
              (tip) => `
                <div class="answer-map-row">
                  <b>${app.escapeHTML(tip.part)}</b>
                  <span>${app.escapeHTML(tip.write)}</span>
                </div>
              `,
            )
            .join("")}
        </div>
      </section>
    `;
  }

  const basicLecturesById = {
    "cadastral-resurvey": {
      title: "기본강의: 지적재조사와 경계 불부합",
      subtitle: "지적재조사는 낡은 도면과 실제 토지 이용이 어긋난 상태를 좌표 기반 지적으로 바로잡는 사업입니다.",
      coreMessage: "불부합의 본질은 도면·현장·권리의 불일치이고, 해법은 기준점·좌표·협의·공시의 순서로 정리된다.",
      lead: "생활 속에서는 담장, 도로 경계석, 주차장 선, 건축물 외벽처럼 눈에 보이는 경계가 지적도 경계와 다를 수 있습니다. 기술사 답안에서는 이 차이를 단순 오차가 아니라 역사적 도해지적, 측량기준 변화, 점유관계, 행정절차가 결합된 문제로 설명해야 합니다.",
      toc: [
        { title: "불부합 유형 진단", detail: "현실경계형, 기록오차형, 공공용지형, 권리충돌형으로 먼저 분류한다." },
        { title: "좌표기반 예비경계안", detail: "합의 전에 기준점·좌표·현황사진·과거 측량기록으로 설명 가능한 경계안을 만든다." },
        { title: "합의경계의 위험", detail: "정보비대칭, 사실상 강요, 공공용지 잠식, 조정금 분쟁, 사후 소송 위험을 정리한다." },
        { title: "주민협의 구조화", detail: "서명 수집이 아니라 설명자료, 회의록, 이의사유, 취약소유자 보호를 포함한 협의로 설계한다." },
        { title: "성과검증과 공시", detail: "경계점 좌표, 사진, 측량부, 위원회 판단 이유를 연결해 사후 검증 가능한 기록으로 남긴다." },
        { title: "답안 버전 선택", detail: "기본형, 고득점 심화형, 실무 개선안형 중 문제 배점과 출제 의도에 맞춰 선택한다." },
      ],
      materials: [
        { title: "불부합 유형 분류표", text: "도면과 현장이 다른 이유를 현실경계형, 기록오차형, 공공용지형, 권리충돌형으로 나누면 답안의 원인 분석이 선명해진다." },
        { title: "좌표기반 예비경계도", text: "기준점, GNSS·토털스테이션 관측, 드론정사영상, 현황사진, 과거 측량부를 한 장의 설명자료로 묶어 합의 전에 제시한다." },
        { title: "합의경계 위험 체크리스트", text: "정보비대칭, 사실상 강요, 부재지주·고령자 보호, 공공용지 침범, 조정금 불신, 후속 매수인 분쟁을 확인한다." },
        { title: "주민협의 표준 회의록", text: "설명자료 교부, 면적증감·조정금 인지 여부, 반대 사유, 현장사진, 이해관계인 참석 여부를 기록하게 한다." },
        { title: "성과검증·공시 패키지", text: "경계점 좌표, 사진, 측량성과파일, 위원회 판단 이유, 이의신청 안내를 함께 보존해야 사후 분쟁을 줄일 수 있다." },
      ],
      flow: [
        { label: "문제 인식", text: "도면·현황·권리관계 불일치 확인" },
        { label: "기준 정립", text: "기준점과 세계측지계 좌표체계 연결" },
        { label: "경계 확정", text: "현황측량, 소유자 협의, 조정금 처리" },
        { label: "공부 정리", text: "성과검증 후 지적공부와 공간정보 갱신" },
      ],
      concepts: [
        {
          visual: "cadastre",
          kicker: "지적불부합",
          title: "지도와 현장이 맞지 않는 상태",
          summary: "지적도상 경계, 실제 점유 경계, 등기·대장 정보가 서로 일치하지 않아 분쟁과 행정 오류를 유발하는 상태다.",
          points: ["도해지적 한계", "축척·도곽 접합 오차", "토지 이동 누적", "점유 경계 변화"],
        },
        {
          visual: "spatial",
          kicker: "지적재조사",
          title: "좌표 기반 지적으로 전환",
          summary: "현황을 새로 측량하고 경계를 조정해 디지털 지적공부로 정비하는 국가 사업이다.",
          points: ["사업지구 지정", "현황측량", "경계 결정", "조정금·공시"],
        },
        {
          visual: "standard",
          kicker: "합의경계",
          title: "합의는 기준이 아니라 보완수단",
          summary: "토지소유자간 합의는 현장 수용성을 높이지만, 기준점·좌표·기록으로 설명된 예비경계안 이후에 작동해야 한다.",
          points: ["예비경계안 선행", "정보비대칭 차단", "위원회 이유 기재", "공공용지 별도 검증"],
        },
        {
          visual: "quality",
          kicker: "성과검증",
          title: "권리 안정성을 위한 품질확보",
          summary: "경계점 좌표, 면적, 도면 정합성, 소유자 확인 절차를 검증해야 성과가 행정자료로 기능한다.",
          points: ["기준점 검측", "면적 증감 검토", "경계점 검증", "성과 공시"],
        },
        {
          visual: "metadata",
          kicker: "유지관리",
          title: "재조사 후 갱신이 핵심",
          summary: "한 번 정리한 성과도 토지 이동, 개발사업, 시설물 변화와 함께 지속적으로 갱신되어야 한다.",
          points: ["이력 관리", "민원 대응", "공간정보 연계", "분쟁 예방"],
        },
      ],
      knowledge: [
        { term: "도해지적", explain: "종이 도면과 축척에 의존한 지적으로, 좌표 기반 지적보다 경계 복원성과 정밀도가 낮다." },
        { term: "경계점좌표등록부", explain: "경계점을 좌표로 등록해 재현성과 법적 안정성을 높이는 지적공부다." },
        { term: "조정금", explain: "재조사 결과 면적 증감이 발생할 때 토지소유자 간 형평성을 맞추기 위해 정산하는 금액이다." },
        { term: "현황측량", explain: "실제 점유, 시설물, 도로, 담장 등 현실 경계 상태를 파악하는 측량이다." },
        { term: "합의경계", explain: "토지소유자간 합의로 현실경계를 반영하는 방식이지만, 객관 측량성과와 법정 절차를 대체할 수는 없다." },
        { term: "예비경계안", explain: "기준점, 좌표, 과거 기록, 현황자료를 종합해 주민협의 전에 제시하는 설명 가능한 경계 초안이다." },
        { term: "디지털 증거팩", explain: "GNSS·토털스테이션 관측, 드론정사영상, 현황사진, 과거 측량부, 경계점 좌표를 필지별로 묶은 검증자료다." },
        { term: "답안 포인트", explain: "원인, 조사절차, 경계결정, 성과검증, 유지관리 순서로 쓰면 기술성과 행정성을 함께 잡을 수 있다." },
      ],
      answerVersions: [
        {
          label: "버전 1 · 기본형",
          title: "합의경계의 문제점과 개선방안",
          target: "25점 논술형에서 안정적으로 쓰기 좋은 원인-문제-개선 구조",
          keywords: ["지적재조사", "경계불부합", "합의경계", "좌표기반 예비경계안", "조정금", "성과공시"],
          opening: "지적재조사는 실제 현황과 지적공부의 불일치를 해소하고 종이지적을 좌표 기반 디지털 지적으로 전환하는 공적 사업이다. 이 과정에서 토지소유자간 합의는 주민 수용성을 높일 수 있으나, 합의만으로 경계를 결정하면 공적 경계의 객관성과 재현성이 약화될 수 있다.",
          sections: [
            {
              heading: "1. 주요 문제점",
              points: [
                "정보비대칭으로 측량도면과 면적증감을 이해한 소유자가 협의에서 우위에 설 수 있다.",
                "마을 내 우월적 지위나 다수 의견이 소수·부재지주·고령자에게 사실상 강요로 작용할 수 있다.",
                "현실경계에 다툼이 없다는 사실이 곧 소유권 범위의 확정으로 오해될 수 있다.",
                "도로·구거·하천 등 공공용지 접합부를 사적 합의로 처리하면 공공용지 잠식이나 관리청 분쟁이 발생할 수 있다.",
                "면적 증감에 따른 조정금 설명이 부족하면 경계분쟁이 금전분쟁으로 확대된다.",
              ],
            },
            {
              heading: "2. 개선방안",
              points: [
                "합의 전에 기준점·경계점 좌표·현황측량·과거 측량기록을 종합한 좌표기반 예비경계안을 제시한다.",
                "주민협의는 서명 수집이 아니라 설명자료 교부, 면적증감 확인, 반대 사유 기록, 현장사진 첨부 절차로 운영한다.",
                "공공용지 접합부는 소유자 합의보다 관리청 의견과 경계결정위원회의 판단을 우선한다.",
                "성과검증 단계에서 경계점 좌표, 사진, 측량성과파일, 위원회 판단 이유를 함께 공시·보존한다.",
              ],
            },
          ],
          closing: "따라서 바람직한 경계결정은 합의를 배제하는 것이 아니라, 객관 측량성과 위에서 합의가 보완적으로 작동하도록 절차와 기록을 통제하는 것이다.",
        },
        {
          label: "버전 2 · 고득점 심화형",
          title: "판례·절차·품질관리 중심 답안",
          target: "법적 안정성과 기술적 검증을 함께 보여주는 고득점형 답안",
          keywords: ["현실경계", "소유권 범위", "기준점 품질", "디지털 증거팩", "위원회 이유기재", "이의신청"],
          opening: "토지소유자간 합의에 의한 경계결정은 장기간 사용된 현실경계를 반영한다는 장점이 있으나, 지적재조사의 본질은 사적 합의가 아니라 공적 경계의 재설정이다. 특히 현실경계 자체에 다툼이 없다는 사정과 소유권 범위에 다툼이 없다는 사정은 구별되어야 한다.",
          sections: [
            {
              heading: "1. 쟁점의 본질",
              points: [
                "합의경계는 주민 체감 수용성과 민원 조정에는 유리하지만, 객관 좌표선이 아니면 사후 복원성이 낮다.",
                "경계불부합은 현실경계형, 기록오차형, 공공용지형, 권리충돌형이 혼재하므로 동일한 합의 기준을 일률 적용하기 어렵다.",
                "합의서 중심 처리는 권리관계 검토가 필요한 사안을 현장 합의로 봉합해 후속 소송을 유발할 수 있다.",
              ],
            },
            {
              heading: "2. 기술적 통제",
              points: [
                "위성기준점·통합기준점·지적기준점과 연결된 현황측량으로 검증 가능한 좌표선을 먼저 산정한다.",
                "GNSS RTK, 토털스테이션, 드론정사영상, 현황사진, 과거 측량부, 인접 필지 좌표를 필지별 디지털 증거팩으로 구성한다.",
                "기지경계선과 성과가 부합하지 않으면 기준점·관측방법·좌표변환을 재검토해 측량성과의 신뢰도를 확보한다.",
              ],
            },
            {
              heading: "3. 절차적 개선",
              points: [
                "예비경계안, 면적 증감, 조정금 예상액, 공공용지 영향도를 주민설명회와 개별 협의에서 함께 제시한다.",
                "표준 회의록에 설명자료 교부 확인, 이의사유, 이해관계인 참석 여부, 취약소유자 보호조치를 남긴다.",
                "경계결정위원회는 합의 채택 여부와 배척 사유를 이유부로 기재해 행정처분의 설명가능성을 높인다.",
              ],
            },
          ],
          closing: "결론적으로 합의경계의 고도화 방향은 합의 자체의 확대가 아니라 기준점-좌표-증거팩-위원회 판단-공시 이력으로 이어지는 품질관리형 경계결정 체계이다.",
        },
        {
          label: "버전 3 · 현장 실행형",
          title: "실무 개선대책 중심 답안",
          target: "현장 적용 방안과 제도 개선책을 강조하고 싶을 때 쓰는 버전",
          keywords: ["예비조사", "주민협의", "표준 회의록", "공공용지 검증", "QR 이력관리", "유지관리"],
          opening: "현장에서 합의경계가 문제 되는 이유는 소유자들이 경계선을 정했다는 사실보다, 그 합의가 충분한 자료와 설명 위에서 이루어졌는지 확인하기 어렵기 때문이다. 따라서 개선방안은 합의의 폐지가 아니라 합의의 절차화와 데이터화에 있다.",
          sections: [
            {
              heading: "1. 예비조사 단계",
              points: [
                "사업지구 지정 후 기준점 망실·훼손 여부와 기존 지적도·측량기록의 품질을 먼저 점검한다.",
                "현실경계와 등록경계가 다른 필지는 유형을 분류하고, 도로·구거 등 공공용지 접합 필지는 별도 관리목록으로 만든다.",
                "좌표기반 예비경계도와 면적 증감 시뮬레이션을 작성해 주민에게 같은 정보를 제공한다.",
              ],
            },
            {
              heading: "2. 협의 단계",
              points: [
                "협의는 경계를 흥정하는 절차가 아니라 예비경계안의 타당성과 생활상 불편을 검토하는 절차로 운영한다.",
                "고령자·부재지주에게는 큰 글씨 도면, 현장설명, 대리인 확인, 영상기록 등 보호절차를 제공한다.",
                "조정금 산정근거, 이의신청 대상, 재산정 가능 여부를 경계 설명과 분리해 명확히 안내한다.",
              ],
            },
            {
              heading: "3. 공시·유지관리 단계",
              points: [
                "경계점 표지에는 좌표, 설치일, 현장사진, 측량성과파일을 연결한 전자 이력관리를 도입한다.",
                "위원회 결정 사유와 소유자 의견을 지적공부 정리자료와 함께 보존해 후속 매수인도 경계 설정 이유를 추적하게 한다.",
                "후속 토지이동, 개발사업, 시설물 변경과 연계해 재조사 성과를 지속 갱신한다.",
              ],
            },
          ],
          closing: "이와 같이 합의를 자료기반 협의로 바꾸면 주민 수용성, 경계의 재현성, 행정처분의 신뢰성을 동시에 높일 수 있다.",
        },
      ],
      memoryLine: "암기 문장: 지적재조사는 낡은 도면을 새 좌표로 고치는 일이 아니라, 현장과 권리와 행정을 하나의 기준으로 맞추는 과정이다.",
    },
    "spatial-law": {
      title: "기본강의: 공간정보법과 측량 성과의 효력",
      subtitle: "측량 성과는 단순한 도면이 아니라 법령상 절차와 검사를 거쳐 공공사업과 토지행정의 근거가 됩니다.",
      coreMessage: "측량의 효력은 누가, 어떤 목적으로, 어떤 기준과 검사 절차에 따라 수행했는가에서 결정된다.",
      lead: "도로 설계도, 지적도, 도시계획도, 재난지도는 모두 좌표와 속성을 가진 자료지만 법적 효력은 같지 않습니다. 답안에서는 기본측량, 공공측량, 일반측량, 지적측량의 목적과 성과검사 체계를 구분해 설명해야 합니다.",
      flow: [
        { label: "측량 구분", text: "기본·공공·일반·지적측량의 목적 파악" },
        { label: "시행 주체", text: "국가, 지자체, 공공기관, 측량업자 구분" },
        { label: "성과 검사", text: "성과심사와 지적측량성과검사 절차 확인" },
        { label: "효력 활용", text: "공공사업, 재산권, 행정처분의 근거로 사용" },
      ],
      concepts: [
        {
          visual: "standard",
          kicker: "법적 구분",
          title: "목적에 따라 효력이 달라진다",
          summary: "기본측량은 국가 기준, 공공측량은 공공사업, 지적측량은 토지 경계와 권리관계에 직접 연결된다.",
          points: ["기본측량", "공공측량", "일반측량", "지적측량"],
        },
        {
          visual: "quality",
          kicker: "성과심사",
          title: "공공자료의 신뢰성 확인",
          summary: "공공측량 성과는 정확도, 정합성, 표준 준수 여부를 검사해 공공성과 안전성을 확보한다.",
          points: ["계획 검토", "정확도 검사", "자료 완전성", "승인·보완"],
        },
        {
          visual: "cadastre",
          kicker: "지적측량성과",
          title: "토지 권리 판단의 기초",
          summary: "분할, 합병, 경계복원 등 지적측량 결과는 지적공부 정리와 재산권 보호에 직접 영향을 준다.",
          points: ["경계복원", "분할·합병", "등록전환", "성과도 검사"],
        },
        {
          visual: "metadata",
          kicker: "책임 체계",
          title: "절차와 기록이 효력을 만든다",
          summary: "측량 방법, 기준점, 장비, 검사자, 승인번호 등 이력 정보가 성과의 추적성과 책임성을 뒷받침한다.",
          points: ["성과 이력", "검사 기록", "승인번호", "사후관리"],
        },
      ],
      knowledge: [
        { term: "공공측량", explain: "공공사업, 안전, 공공의 이해와 관련되어 국가·지자체 등이 시행하거나 관리하는 측량이다." },
        { term: "공공측량 성과심사", explain: "공공측량 성과가 법정 정확도와 표준에 맞는지 품질관리기관이 확인하는 절차다." },
        { term: "지적측량성과검사", explain: "지적공부에 반영될 경계와 면적이 적법하고 정확한지 확인하는 검사 제도다." },
        { term: "일반측량", explain: "기본측량, 공공측량, 지적측량에 해당하지 않는 측량으로 활용 목적에 따라 효력 범위가 제한된다." },
        { term: "답안 포인트", explain: "정의와 시행자, 대상, 성과검사 절차, 문제점, 디지털 개선방안을 한 흐름으로 서술한다." },
      ],
      memoryLine: "암기 문장: 측량 성과의 힘은 좌표값 자체보다 법정 기준, 검사, 승인, 기록이 결합될 때 생긴다.",
    },
    "control-point": {
      title: "기본강의: 국가기준점과 지적측량 기준",
      subtitle: "기준점은 모든 좌표와 경계의 출발점이며, 측량 성과의 일관성을 보장하는 공간정보의 뼈대입니다.",
      coreMessage: "기준점이 흔들리면 좌표도, 지적경계도, 공공측량 성과도 함께 흔들린다.",
      lead: "등산로 정상의 삼각점, 도로변 수준점, 지적도근점은 일상에서는 작은 표지처럼 보이지만 국가 좌표체계와 현장 측량을 연결하는 핵심 시설입니다. 기술사 답안은 기준점의 종류, 역할, 관리, 지적측량 적용을 한 번에 설명해야 합니다.",
      flow: [
        { label: "기준망", text: "국가기준점과 지적기준점의 위계 이해" },
        { label: "성과 연결", text: "좌표·표고 성과를 현장 측량에 연결" },
        { label: "검측", text: "망 조정, 폐합차, 안정성 확인" },
        { label: "활용", text: "공공측량, 지적측량, GIS 구축에 적용" },
      ],
      concepts: [
        {
          visual: "spatial",
          kicker: "국가기준점",
          title: "전 국토 좌표의 기준",
          summary: "삼각점, 수준점, 통합기준점 등은 위치와 높이의 기준을 제공해 모든 측량의 공통 출발점이 된다.",
          points: ["삼각점", "수준점", "통합기준점", "위성기준점"],
        },
        {
          visual: "cadastre",
          kicker: "지적기준점",
          title: "필지 경계 측량의 현장 기준",
          summary: "지적삼각점과 지적도근점은 경계복원, 분할, 등록전환 등 지적측량 성과의 기준이 된다.",
          points: ["지적삼각점", "지적도근점", "경계점 연결", "성과 관리"],
        },
        {
          visual: "quality",
          kicker: "망 조정",
          title: "관측값을 가장 합리적으로 맞춘다",
          summary: "반복 관측과 조정계산으로 우연오차를 줄이고 기준점망 전체의 일관성을 확보한다.",
          points: ["폐합차", "최소제곱법", "검측", "정확도 평가"],
        },
        {
          visual: "metadata",
          kicker: "기준점 관리",
          title: "성과와 이력의 지속 관리",
          summary: "기준점은 망실, 훼손, 지반침하, 공사 영향에 따라 성과가 변할 수 있어 정기 점검과 이력관리가 필요하다.",
          points: ["현장 점검", "망실 신고", "성과 갱신", "메타데이터"],
        },
      ],
      knowledge: [
        { term: "통합기준점", explain: "평면위치, 표고, 중력 등 다양한 기준 성과를 통합 제공하는 기준점이다." },
        { term: "수준점", explain: "높이 기준을 제공하며 도로, 하천, 침수 분석, 시설물 시공에서 중요하다." },
        { term: "지적도근점", explain: "지적측량의 세부 기준점으로 필지 경계 측량을 현장에 연결한다." },
        { term: "망 조정", explain: "여러 관측값의 불일치를 수학적으로 조정해 기준점 성과의 최적값을 산정하는 절차다." },
        { term: "답안 포인트", explain: "기준점 종류, 법적 기준, 성과관리, 지적측량 활용, 훼손·갱신 대책을 함께 서술한다." },
      ],
      memoryLine: "암기 문장: 기준점은 지도 위 좌표와 현장 경계를 같은 언어로 말하게 하는 국토의 기준 문법이다.",
    },
    "coordinate-system": {
      title: "기본강의: 세계측지계·좌표계·좌표변환",
      subtitle: "좌표계는 지구상의 위치를 숫자로 표현하는 약속이며, 변환은 서로 다른 약속을 맞추는 과정입니다.",
      coreMessage: "좌표값은 절대적인 숫자가 아니라 기준타원체, 데이텀, 투영법이 정해질 때 의미가 생긴다.",
      lead: "같은 지점도 WGS84 경위도, 평면직각좌표, 지적도 좌표로 다르게 표시될 수 있습니다. 답안에서는 세계측지계 전환의 배경, 좌표계 구성요소, 변환오차와 검증 방식을 명확히 구분해야 합니다.",
      flow: [
        { label: "기준 설정", text: "타원체와 데이텀으로 지구 기준 정의" },
        { label: "좌표 표현", text: "경위도, 평면좌표, 높이로 위치 표현" },
        { label: "투영·변환", text: "지도 제작과 자료 통합을 위해 좌표 변환" },
        { label: "검증", text: "공통점, 잔차, 오차 허용범위 확인" },
      ],
      concepts: [
        {
          visual: "spatial",
          kicker: "세계측지계",
          title: "지구 중심 기준의 좌표체계",
          summary: "GNSS와 국제 공간정보 연계를 위해 지구중심 기준을 사용하는 측지 기준체계다.",
          points: ["WGS84", "GRS80", "ITRF", "지구중심 좌표"],
        },
        {
          visual: "standard",
          kicker: "좌표계",
          title: "위치를 표현하는 약속",
          summary: "좌표계는 원점, 축 방향, 단위, 투영법을 정해 위치를 일관되게 표현한다.",
          points: ["경위도", "TM 좌표", "원점", "축척계수"],
        },
        {
          visual: "quality",
          kicker: "좌표변환",
          title: "다른 기준의 자료를 맞추는 절차",
          summary: "기존 자료와 신규 GNSS 성과를 함께 쓰려면 변환계수, 공통점, 잔차 검증이 필요하다.",
          points: ["공통점 선정", "변환계수", "잔차 분석", "정확도 검증"],
        },
        {
          visual: "metadata",
          kicker: "변환 이력",
          title: "좌표계 정보는 반드시 기록한다",
          summary: "좌표계, 변환방법, 사용 공통점, 변환일자와 정확도는 데이터 재사용의 핵심 메타데이터다.",
          points: ["좌표계 명시", "변환방법", "검증 결과", "이력 관리"],
        },
      ],
      knowledge: [
        { term: "데이텀", explain: "지구를 수학적으로 표현하기 위해 정한 기준면, 원점, 방향의 집합이다." },
        { term: "투영", explain: "곡면인 지구를 평면지도에 표현하는 과정이며 면적, 거리, 방향 왜곡을 동반한다." },
        { term: "TM 좌표계", explain: "우리나라 지형도와 공공측량에서 많이 쓰는 횡메르카토르 기반 평면좌표계다." },
        { term: "변환오차", explain: "공통점 품질, 관측시기, 지역 왜곡, 원시자료 오차 때문에 발생할 수 있다." },
        { term: "답안 포인트", explain: "좌표계 정의, 변환 필요성, 절차, 오차요인, 품질검증, 지적·GIS 통합 효과 순서로 쓴다." },
      ],
      memoryLine: "암기 문장: 좌표변환은 숫자를 바꾸는 일이 아니라 기준과 왜곡과 책임 기록을 함께 바꾸는 일이다.",
    },
    "gnss-cadastre": {
      title: "기본강의: GNSS·RTK 기반 위치 결정",
      subtitle: "GNSS는 위성 신호로 위치를 구하고, RTK는 기준국 보정정보로 cm급 위치를 실시간 결정하는 기술입니다.",
      coreMessage: "RTK의 핵심은 위성신호, 기준국 보정, 모호정수 결정, 현장 품질검증의 연결이다.",
      lead: "스마트폰 내비게이션은 수 m 수준이면 충분하지만 지적경계와 공공측량은 cm급 정확도가 필요합니다. GNSS·RTK 답안은 원리, 오차요인, 보정방식, 현장 적용 한계를 함께 제시해야 합니다.",
      flow: [
        { label: "위성 관측", text: "위성 궤도와 신호 도달시간 관측" },
        { label: "오차 보정", text: "기준국 또는 네트워크 보정정보 수신" },
        { label: "해 결정", text: "모호정수 고정과 좌표 산정" },
        { label: "검증", text: "재관측, 기준점 확인, 품질지표 검토" },
      ],
      concepts: [
        {
          visual: "spatial",
          kicker: "GNSS",
          title: "여러 위성항법시스템의 통합 활용",
          summary: "GPS, GLONASS, Galileo, BeiDou 등을 활용해 위치, 속도, 시간을 결정한다.",
          points: ["위성궤도", "신호 도달시간", "다중주파수", "PDOP"],
        },
        {
          visual: "standard",
          kicker: "RTK",
          title: "기준국과 이동국의 실시간 상대측위",
          summary: "기준국에서 관측한 오차 보정정보를 이동국에 적용해 cm급 위치를 산정한다.",
          points: ["기준국", "이동국", "모호정수", "Fix 해"],
        },
        {
          visual: "quality",
          kicker: "오차 요인",
          title: "하늘이 열려 있어야 정확하다",
          summary: "전리층·대류권 지연, 멀티패스, 위성 배치, 통신 지연, 차폐가 위치 정확도를 좌우한다.",
          points: ["멀티패스", "DOP", "전리층 지연", "차폐"],
        },
        {
          visual: "cadastre",
          kicker: "지적 적용",
          title: "빠르지만 검증 없이는 위험하다",
          summary: "경계점 결정에는 기준점 검측, 반복관측, 현장 장애물 확인, 성과검사 기준 충족이 필요하다.",
          points: ["기준점 확인", "반복관측", "성과검사", "현장 기록"],
        },
      ],
      knowledge: [
        { term: "네트워크 RTK", explain: "여러 기준국 자료를 이용해 관측점 주변의 오차를 모델링하고 보정정보를 제공하는 방식이다." },
        { term: "VRS", explain: "가상 기준국을 만들어 사용자 인근 기준국처럼 보정정보를 제공하는 네트워크 RTK 방식이다." },
        { term: "FKP", explain: "면 보정계수를 제공해 지역별 오차 경향을 보정하는 방식이다." },
        { term: "Fix/Float", explain: "모호정수가 고정되면 Fix, 불완전하면 Float이며 지적측량에서는 Fix 상태와 품질지표 확인이 중요하다." },
        { term: "답안 포인트", explain: "원리, 오차, 보정, 현장절차, 적용한계, 성과검증을 짧은 그림처럼 연결한다." },
      ],
      memoryLine: "암기 문장: GNSS는 위성으로 위치를 찾고, RTK는 보정정보로 정확도를 끌어올리며, 검증으로 법적 신뢰를 얻는다.",
    },
    "three-dimensional-cadastre": {
      title: "기본강의: 3차원 지적과 입체 공간정보",
      subtitle: "3차원 지적은 필지의 평면 경계를 넘어 지상·지하·건축물 내부의 입체적 권리와 공간객체를 관리하는 방향입니다.",
      coreMessage: "입체도시는 2D 필지선만으로 설명되지 않으므로 권리, 객체, 높이, 시간 정보를 함께 관리해야 한다.",
      lead: "지하철, 지하상가, 공동구, 고가도로, 복합건축물은 하나의 평면 필지 위아래로 여러 권리와 시설이 겹칩니다. 답안에서는 3D 취득기술보다 왜 입체 지적이 필요한지, 어떤 제도와 표준이 필요한지까지 설명해야 합니다.",
      flow: [
        { label: "대상 정의", text: "지상·지하·실내 공간객체와 권리 범위 구분" },
        { label: "자료 취득", text: "LiDAR, MMS, BIM, 지하시설물 자료 통합" },
        { label: "모델링", text: "3D 객체, LoD, 속성, 권리정보 연결" },
        { label: "운영", text: "디지털트윈, 인허가, 안전관리와 연계" },
      ],
      concepts: [
        {
          visual: "cadastre",
          kicker: "2D 지적의 한계",
          title: "평면 경계만으로는 부족하다",
          summary: "복합건축물과 지하공간에서는 수평 경계뿐 아니라 높이와 입체 권리 범위를 함께 표현해야 한다.",
          points: ["지하공간", "구분지상권", "복합개발", "시설물 중첩"],
        },
        {
          visual: "spatial",
          kicker: "3D 공간객체",
          title: "객체 단위로 공간을 관리",
          summary: "건물, 터널, 공동구, 실내공간을 3차원 객체와 속성으로 표현해 분석과 관리에 활용한다.",
          points: ["객체 모델", "높이 정보", "속성정보", "공간관계"],
        },
        {
          visual: "standard",
          kicker: "표준·LoD",
          title: "상세도와 표현 기준이 필요하다",
          summary: "목적에 따라 필요한 상세도가 다르므로 LoD, 데이터모델, 교환표준을 정해야 한다.",
          points: ["CityGML", "IndoorGML", "BIM 연계", "LoD"],
        },
        {
          visual: "quality",
          kicker: "품질·갱신",
          title: "입체정보는 최신성이 중요하다",
          summary: "공사와 시설물 변경이 잦기 때문에 정확도, 완전성, 갱신주기, 책임기관을 명확히 해야 한다.",
          points: ["위치정확도", "속성정확도", "갱신주기", "관리주체"],
        },
      ],
      knowledge: [
        { term: "입체 지적", explain: "토지의 평면 경계뿐 아니라 지상·지하 공간의 권리와 이용관계를 입체적으로 등록·관리하는 개념이다." },
        { term: "LoD", explain: "3차원 객체를 어느 정도 상세하게 표현할지 정한 단계로 활용 목적에 따라 달라진다." },
        { term: "BIM-GIS 연계", explain: "건축물의 상세 모델과 도시 단위 공간정보를 연결해 설계, 인허가, 유지관리에 활용하는 방식이다." },
        { term: "디지털트윈", explain: "현실 도시와 시설을 가상공간에 연결해 예측, 분석, 시뮬레이션을 수행하는 플랫폼이다." },
        { term: "답안 포인트", explain: "필요성, 대상, 구축기술, 표준, 법제도, 활용효과를 순서대로 제시한다." },
      ],
      memoryLine: "암기 문장: 3차원 지적은 땅의 선을 입체 권리와 시설 안전의 정보체계로 확장하는 일이다.",
    },
    "uav-cadastre": {
      title: "기본강의: UAV·드론 기반 지형·지적 자료 취득",
      subtitle: "UAV는 빠르게 현장을 촬영해 정사영상, 수치표면모델, 점군 등 지형·지적 보조자료를 만드는 기술입니다.",
      coreMessage: "드론 성과의 품질은 비행계획, GCP, 영상처리, 정확도 검증에서 결정된다.",
      lead: "공사 현장, 하천, 농지, 재해지역처럼 넓은 구역을 짧은 시간에 파악할 때 UAV가 유용합니다. 다만 지적 경계 결정에 직접 쓰려면 법정 기준과 정확도 검증을 충족해야 하므로 장점과 한계를 균형 있게 써야 합니다.",
      flow: [
        { label: "비행계획", text: "고도, 중복도, 촬영경로, 안전조건 설정" },
        { label: "기준 확보", text: "GCP·검사점 설치와 GNSS 관측" },
        { label: "영상처리", text: "SfM, 정사영상, DSM, 점군 생성" },
        { label: "검증·활용", text: "검사점 RMSE 확인 후 지형·지적자료 활용" },
      ],
      concepts: [
        {
          visual: "spatial",
          kicker: "UAV 사진측량",
          title: "영상으로 3차원 형상을 복원",
          summary: "중복 촬영된 영상에서 공통점을 찾아 카메라 위치와 지표면 형상을 계산한다.",
          points: ["전방·측방 중복도", "SfM", "MVS", "점군"],
        },
        {
          visual: "standard",
          kicker: "GCP",
          title: "영상과 실제 좌표를 연결",
          summary: "지상기준점은 영상 모델을 현장 좌표계에 맞추는 기준이므로 배치와 관측 품질이 중요하다.",
          points: ["균등 배치", "검사점 분리", "GNSS 관측", "좌표계 명시"],
        },
        {
          visual: "quality",
          kicker: "정확도 검증",
          title: "검사점으로 성과를 확인",
          summary: "처리에 쓰지 않은 검사점과 결과 좌표를 비교해 RMSE와 허용오차 충족 여부를 판단한다.",
          points: ["수평 RMSE", "수직 RMSE", "체계오차", "재처리"],
        },
        {
          visual: "cadastre",
          kicker: "지적 활용",
          title: "현황 파악에는 강하지만 경계확정은 신중",
          summary: "정사영상은 현황 조사와 불부합 파악에 유용하나 법적 경계 결정은 지적측량 기준과 절차를 따라야 한다.",
          points: ["현황조사", "불부합 탐지", "경계협의 보조", "법정측량 한계"],
        },
      ],
      knowledge: [
        { term: "정사영상", explain: "지형 기복과 카메라 기울어짐에 따른 왜곡을 보정해 지도처럼 사용할 수 있게 만든 영상이다." },
        { term: "DSM/DTM", explain: "DSM은 건물·수목을 포함한 표면모델, DTM은 지표면 자체의 지형모델이다." },
        { term: "중복도", explain: "영상 간 공통 영역 비율로 3D 복원 정확도와 안정성에 큰 영향을 준다." },
        { term: "검사점", explain: "처리에는 사용하지 않고 최종 성과의 정확도를 독립적으로 확인하기 위한 점이다." },
        { term: "답안 포인트", explain: "촬영계획, 기준점, 처리과정, 정확도 검증, 법제도 한계를 함께 쓰면 균형 잡힌 답안이 된다." },
      ],
      memoryLine: "암기 문장: 드론은 현장을 빠르게 보여주지만, 기술사 답안은 기준점과 검사점으로 그 영상을 믿을 수 있게 만들어야 한다.",
    },
    nsdi: {
      title: "기본강의: 국가공간정보 인프라와 정책",
      subtitle: "NSDI는 국가와 민간이 공간정보를 함께 생산·공유·활용하기 위한 데이터, 표준, 제도, 플랫폼의 총합입니다.",
      coreMessage: "국가공간정보 인프라는 데이터를 모으는 사업이 아니라 국토 의사결정의 공통 기반을 만드는 정책 체계다.",
      lead: "부동산, 교통, 재난, 환경, 스마트시티 서비스는 모두 공간정보를 필요로 합니다. 답안에서는 데이터 구축만 나열하지 말고 기본공간정보, 표준, 품질, 보안, 민간 활용, 거버넌스를 연결해야 합니다.",
      flow: [
        { label: "기반 구축", text: "기본공간정보와 국가 기준데이터 정비" },
        { label: "연계·공유", text: "기관 간 데이터 표준화와 플랫폼 연계" },
        { label: "품질·보안", text: "품질관리, 메타데이터, 개인정보·보안 관리" },
        { label: "활용 확산", text: "행정, 산업, 국민 서비스로 재사용" },
      ],
      concepts: [
        {
          visual: "spatial",
          kicker: "NSDI",
          title: "국가 공간정보의 공통 기반",
          summary: "공간정보를 국가 차원에서 체계적으로 구축, 관리, 유통, 활용하기 위한 인프라다.",
          points: ["데이터", "표준", "플랫폼", "거버넌스"],
        },
        {
          visual: "standard",
          kicker: "기본공간정보",
          title: "여러 서비스가 공통으로 쓰는 핵심 자료",
          summary: "행정구역, 도로, 건물, 지형, 수계 등 다양한 정책과 서비스의 기반이 되는 자료다.",
          points: ["도로", "건물", "수계", "행정경계"],
        },
        {
          visual: "quality",
          kicker: "품질·표준",
          title: "공유하려면 같은 기준이 필요하다",
          summary: "좌표계, 데이터모델, 코드, 정확도, 메타데이터가 맞아야 기관 간 연계와 민간 활용이 가능하다.",
          points: ["좌표계", "메타데이터", "품질검사", "API"],
        },
        {
          visual: "metadata",
          kicker: "정책 거버넌스",
          title: "누가 만들고 누가 갱신할지 정한다",
          summary: "중복투자를 막고 지속 갱신하려면 중앙정부, 지자체, 공공기관, 민간의 역할분담이 필요하다.",
          points: ["역할분담", "예산", "갱신주기", "개방정책"],
        },
      ],
      knowledge: [
        { term: "국가공간정보정책 기본계획", explain: "국가 공간정보 구축과 활용 방향을 정하는 중장기 정책 계획이다." },
        { term: "기본공간정보", explain: "다른 공간정보의 위치 기준과 공통 기반이 되는 핵심 데이터다." },
        { term: "공간정보 플랫폼", explain: "자료 검색, 조회, 다운로드, API 제공 등을 통해 공간정보를 유통하는 체계다." },
        { term: "데이터 거버넌스", explain: "데이터의 생산, 관리, 품질, 보안, 활용 책임을 정하는 관리 체계다." },
        { term: "답안 포인트", explain: "정책목표, 데이터 기반, 표준·품질, 기관 연계, 민간 활용, 보안·윤리를 함께 제시한다." },
      ],
      memoryLine: "암기 문장: NSDI는 지도 파일의 모음이 아니라 국가가 같은 위치 기준으로 판단하게 하는 데이터 행정 기반이다.",
    },
    "boundary-error": {
      title: "기본강의: 오차·정확도·성과 검증",
      subtitle: "측량에서 오차는 피할 수 없지만, 오차의 성격을 구분하고 허용범위 안에서 관리해야 성과를 신뢰할 수 있습니다.",
      coreMessage: "정확도 답안은 오차의 원인, 처리방법, 검증기준, 품질관리 대책을 한 세트로 써야 한다.",
      lead: "같은 지점을 여러 번 측정해도 값이 조금씩 달라집니다. 기술사 답안은 단순히 오차를 줄인다고 쓰는 것이 아니라 착오, 계통오차, 우연오차를 구분하고 관측·계산·검사 단계별 관리방안을 제시해야 합니다.",
      flow: [
        { label: "오차 구분", text: "착오, 계통오차, 우연오차 분리" },
        { label: "관측 관리", text: "장비점검, 반복관측, 환경조건 통제" },
        { label: "계산 처리", text: "조정계산, 잔차 분석, 이상치 검토" },
        { label: "성과 검증", text: "허용오차, RMSE, 품질보고서 확인" },
      ],
      concepts: [
        {
          visual: "quality",
          kicker: "오차",
          title: "참값과 관측값의 차이",
          summary: "측량값은 관측환경, 장비, 작업자, 처리방법의 영향을 받아 참값과 차이가 생긴다.",
          points: ["착오", "계통오차", "우연오차", "잔차"],
        },
        {
          visual: "standard",
          kicker: "정확도·정밀도",
          title: "가까움과 반복성을 구분",
          summary: "정확도는 참값에 가까운 정도, 정밀도는 반복관측값이 서로 모여 있는 정도를 뜻한다.",
          points: ["정확도", "정밀도", "편의", "분산"],
        },
        {
          visual: "spatial",
          kicker: "조정계산",
          title: "관측망 전체를 일관되게 맞춘다",
          summary: "중복 관측값을 이용해 최확값을 산정하고 잔차와 표준편차로 성과 품질을 평가한다.",
          points: ["최소제곱법", "폐합차", "잔차", "표준편차"],
        },
        {
          visual: "metadata",
          kicker: "성과검증",
          title: "검사 결과를 기록해야 재사용 가능",
          summary: "허용오차 충족 여부, 검사점 결과, 장비·방법·일자를 기록해 성과의 추적성을 확보한다.",
          points: ["검사점", "RMSE", "품질보고", "이력관리"],
        },
      ],
      knowledge: [
        { term: "착오", explain: "읽기 오류, 입력 오류, 점명 혼동처럼 작업 실수로 발생하며 반드시 발견해 제거해야 한다." },
        { term: "계통오차", explain: "장비 상수, 대기 보정, 기준 설정처럼 일정한 방향으로 나타나는 오차로 보정이 가능하다." },
        { term: "우연오차", explain: "불규칙하게 발생하는 작은 오차로 반복관측과 조정계산을 통해 영향을 줄인다." },
        { term: "RMSE", explain: "검사점 오차의 제곱평균제곱근으로 공간정보 위치정확도 평가에 자주 사용된다." },
        { term: "답안 포인트", explain: "오차 구분, 발생 원인, 저감 대책, 검증 지표, 품질관리 체계를 표로 정리하면 좋다." },
      ],
      memoryLine: "암기 문장: 좋은 측량 성과는 오차가 없는 성과가 아니라 오차를 알고, 줄이고, 검증하고, 기록한 성과다.",
    },
  };

  const newsDigestsById = {
    "cadastral-resurvey": {
      title: "현장뉴스: 지적재조사와 경계 불부합",
      subtitle: "지적재조사를 정책, 예산, 민간참여, 주민 재산권 보호의 관점으로 연결합니다.",
      headline: "디지털 지적 전환은 경계 불부합 해소와 스마트국토 기반 구축을 동시에 겨냥한다.",
      context: "정부자료와 언론보도는 지적재조사를 단순 경계정리 사업이 아니라 디지털 수치좌표 전환, 민관 협력, 드론·AI 활용, 토지재산권 보호 사업으로 설명하고 있습니다.",
      sources: [
        {
          type: "정부 정책자료",
          date: "2021.02.26",
          title: "지적재조사 기본계획 수정계획과 디지털지적 전환",
          summary: "국토교통부는 지적재조사를 종이지적에서 디지털 수치좌표 지적으로 전환하는 중장기 과제로 제시하고, 사업절차 간소화와 드론·AI 신기술 활용 방향을 함께 제시했습니다.",
          answerPoint: "개요에서 '지적재조사는 도해지적의 한계를 좌표 기반으로 정비하는 디지털 국토관리 사업'이라고 쓰기 좋습니다.",
          url: "https://www.korea.kr/news/policyNewsView.do?newsId=148884447",
        },
        {
          type: "신문 기사",
          date: "2025.02.17",
          title: "2025년 지적재조사사업 착수와 민간 참여 확대",
          summary: "뉴시스는 2025년 지적재조사사업이 전국 156개 지자체, 381개 사업지구, 16만6000필지 규모로 추진되고 민간업체 참여비율이 확대됐다고 보도했습니다.",
          answerPoint: "현황 파트에서 '재조사 수요가 전국 단위로 지속되고 민간 측량역량과의 협업이 중요해졌다'는 근거로 활용합니다.",
          url: "https://www.newsis.com/view/NISX20250216_0003066864",
        },
      ],
      writeTips: [
        { part: "개요", write: "지적재조사는 낡은 도해지적을 좌표 기반 디지털 지적으로 전환해 경계분쟁과 행정오류를 줄이는 사업이다." },
        { part: "현황", write: "최근 사업은 대규모 사업지구와 민간참여 확대를 통해 속도와 전문성을 동시에 확보하는 방향으로 추진된다." },
        { part: "결론", write: "성과검증, 주민협의, 데이터 갱신체계를 결합해야 스마트시티·자율주행·디지털트윈의 기초자료로 확장될 수 있다." },
      ],
    },
    "spatial-law": {
      title: "현장뉴스: 공간정보법과 측량 성과의 효력",
      subtitle: "공공측량 성과심사와 지적측량성과검사를 법적 효력·공정성·품질관리 관점으로 정리합니다.",
      headline: "측량 성과의 효력은 법정 절차, 성과심사, 검사기준, 책임기관의 공정성에서 나온다.",
      context: "공간정보법 관련 자료는 성과심사 세부항목을 구체화하고 있으며, 언론 보도는 성과심사 업무의 공정성과 전문기관 역할을 쟁점으로 다룹니다.",
      sources: [
        {
          type: "법령·정부자료",
          date: "현행 기준",
          title: "공공측량 성과심사 세부항목 및 판정기준",
          summary: "국가법령정보센터의 성과심사 기준은 기초자료 적정성, 완전성, 논리일관성, 위치정확성, 주제정확성, 메타데이터 누락 여부 등을 검사 항목으로 제시합니다.",
          answerPoint: "성과심사 절차 설명에서 '정확도뿐 아니라 완전성·논리일관성·메타데이터까지 보는 종합 품질심사'로 정리합니다.",
          url: "https://www.law.go.kr/LSW/flDownload.do?bylClsCd=200201&flNm=%5B%EB%B3%84%ED%91%9C+3%5D+%EA%B3%B5%EA%B3%B5%EC%B8%A1%EB%9F%89+%EC%84%B1%EA%B3%BC%EC%8B%AC%EC%82%AC+%EC%84%B8%EB%B6%80%ED%95%AD%EB%AA%A9+%EB%B0%8F+%ED%8C%90%EC%A0%95%EA%B8%B0%EC%A4%80&flSeq=151295087",
        },
        {
          type: "정책 해명자료",
          date: "2015.06.16",
          title: "공공측량 성과심사 별도기구 신설 논란 관련",
          summary: "정책브리핑 자료는 민간단체 위탁 방식의 공정성 우려와 성과심사 업무 개선 필요성을 설명합니다.",
          answerPoint: "문제점과 개선방안에서 '심사기관의 독립성·전문성·책임성 강화'를 제도개선 키워드로 제시합니다.",
          url: "https://m.korea.kr/briefing/pressReleaseView.do?endDate=2019-12-03&newsId=156058297&pageIndex=4807&repCode=&repCodeType=&srchWord=&startDate=2008-02-29",
        },
      ],
      writeTips: [
        { part: "정의", write: "공공측량은 공공사업과 국민 안전에 영향을 미치므로 성과의 법적 효력은 성과심사 통과와 표준 준수에서 확보된다." },
        { part: "문제점", write: "성과심사가 형식화되거나 책임기관이 불명확하면 공공자료의 신뢰성과 사업 간 호환성이 약화된다." },
        { part: "개선", write: "전자심사, 자동검증, 독립 품질관리기관, 사후관리 의무화를 함께 제안하면 고득점 구조가 된다." },
      ],
    },
    "control-point": {
      title: "현장뉴스: 국가기준점과 지적측량 기준",
      subtitle: "기준점은 공공데이터, 지자체 점검, 토지경계 분쟁 예방으로 연결됩니다.",
      headline: "작은 기준점 표지는 국가 좌표체계, 지적측량, 자율주행·드론 산업의 공통 기준이다.",
      context: "정부 개방자료는 국가기준점의 종류와 관리부서를 보여주고, 지역 언론은 기준점 훼손·망실 점검이 지적행정 신뢰와 바로 연결된다는 현장성을 보여줍니다.",
      sources: [
        {
          type: "정부 공공데이터",
          date: "2025.04.28",
          title: "국토교통부 국토지리정보원_국가기준점",
          summary: "공공데이터포털은 위성기준점, 통합기준점, 수준점, 중력점, 삼각점 등 국가기준점 정보를 국토지리정보원 자료로 제공합니다.",
          answerPoint: "기준점 종류와 역할을 쓸 때 '국가기준점은 위치·표고 등 측량 기준성과를 제공하는 국가 인프라'로 연결합니다.",
          url: "https://www.data.go.kr/data/15015480/fileData.do?recommendDataYn=Y",
        },
        {
          type: "신문 기사",
          date: "2024.04.02",
          title: "강서구 지적측량 기준점 일제조사",
          summary: "한국경제는 강서구가 지적기준점, 국가기준점, 도시기준점 등 2천여 점을 조사해 망실·훼손 기준점을 복구·폐기한다고 보도했습니다.",
          answerPoint: "현장관리 파트에서 '기준점 유지관리는 정확도 확보와 토지경계 분쟁 예방의 출발점'이라는 문장으로 활용합니다.",
          url: "https://www.hankyung.com/article/202404023377Y",
        },
      ],
      writeTips: [
        { part: "개요", write: "국가기준점은 모든 측량성과를 동일 좌표체계로 연결하는 기준 인프라다." },
        { part: "현장 문제", write: "도로굴착, 공사, 노후화로 기준점이 훼손되면 지적측량 성과의 재현성과 신뢰성이 낮아진다." },
        { part: "대책", write: "정기조사, 기준점 DB 갱신, 주민 신고, GNSS 기준망 연계를 종합관리 체계로 제시한다." },
      ],
    },
    "coordinate-system": {
      title: "현장뉴스: 세계측지계·좌표계·좌표변환",
      subtitle: "세계측지계와 좌표변환은 지적측량 검사, RTK, 공간정보 통합의 공통 언어입니다.",
      headline: "좌표계 전환은 단순 계산이 아니라 지적·공공측량·도시 인프라 데이터를 같은 기준으로 맞추는 일이다.",
      context: "서울시 GNSS 서비스는 세계측지계 이행과 신구좌표계 변환, 네트워크 RTK 도입을 지적측량 검사 확대와 시설물 변위감시에 연결합니다.",
      sources: [
        {
          type: "지자체 공공서비스",
          date: "상시 운영",
          title: "서울특별시 GNSS 측위서비스",
          summary: "서울시는 세계측지계 이행을 위한 신구좌표계 변환과 네트워크 RTK 기술을 지적측량 검사, 시설물 변위감시 등에 활용하고 있습니다.",
          answerPoint: "좌표변환 필요성을 '과거 자료와 최신 GNSS 성과를 같은 기준으로 통합하기 위한 절차'로 설명합니다.",
          url: "https://gnss.eseoul.go.kr/service",
        },
        {
          type: "정부 홍보자료",
          date: "2025",
          title: "국토지리정보원 2025 리플릿",
          summary: "국토지리정보원 자료는 세계측지계, 국가기준점, 공공측량 등 위치기준 업무가 국가 공간정보의 기반임을 소개합니다.",
          answerPoint: "결론에서 '세계측지계 기반 기준성과 관리가 공공·민간 공간정보의 상호운용성을 높인다'고 정리합니다.",
          url: "https://www.ngii.go.kr/lib/file/2025_KOR-%EA%B5%AD%ED%86%A0%EC%A7%80%EB%A6%AC%EC%A0%95%EB%B3%B4%EC%9B%90%20%EB%A6%AC%ED%94%8C%EB%A6%BF-%EC%9B%B9%EC%9A%A9%28%EA%B3%A0%ED%95%B4%EC%83%81%29.pdf",
        },
      ],
      writeTips: [
        { part: "개요", write: "좌표계는 위치를 표현하는 약속이며, 세계측지계 전환은 GNSS 시대의 국가 위치기준 정비다." },
        { part: "오차", write: "변환계수, 공통점 품질, 원도 오차, 투영 왜곡이 좌표변환 성과의 주요 오차요인이다." },
        { part: "검증", write: "공통점 잔차, 기준점 검측, 메타데이터 기록을 통해 변환성과의 추적성을 확보해야 한다." },
      ],
    },
    "gnss-cadastre": {
      title: "현장뉴스: GNSS·RTK 기반 위치 결정",
      subtitle: "고정밀 위치결정은 지적측량, 자율주행, 드론, 시설물 모니터링의 공통 기반입니다.",
      headline: "GNSS RTK는 빠른 현장성과 cm급 정확도를 제공하지만 기준국·통신·검증 체계가 함께 작동해야 한다.",
      context: "서울시 네트워크 RTK 자료와 산업계 초정밀측위 서비스는 RTK가 공공측량을 넘어 자율주행·드론·시설물 모니터링까지 확장되는 흐름을 보여줍니다.",
      sources: [
        {
          type: "지자체 공공서비스",
          date: "상시 운영",
          title: "서울특별시 멀티 GNSS 네트워크 RTK",
          summary: "서울시는 5개 GNSS 위성기준점과 네트워크 RTK 시스템을 통해 지적측량 검사 확대, 도심 고정밀 측위, 시설물 변위감시 기반을 운영하고 있습니다.",
          answerPoint: "현장 적용 절차에서 '기준국망, 보정정보, Fix 상태, 검사점 검증'을 함께 제시합니다.",
          url: "https://gnss.eseoul.go.kr/service",
        },
        {
          type: "산업 서비스 자료",
          date: "상시 제공",
          title: "RTK 초정밀측위 서비스",
          summary: "민간 통신 기반 RTK 서비스는 GNSS 오차를 줄여 cm급 위치정보를 제공하고, 스마트모빌리티·산업현장 위치관리 수요와 연결됩니다.",
          answerPoint: "결론에서 '고정밀 측위 수요가 공공측량에서 스마트모빌리티·IoT 산업으로 확장된다'고 서술합니다.",
          url: "https://www.biz.lgu.kr/rtk",
        },
      ],
      writeTips: [
        { part: "원리", write: "RTK는 기준국과 이동국의 동시 관측값을 이용해 위성·대기·시계 오차를 보정하는 상대측위 방식이다." },
        { part: "한계", write: "도심 차폐, 멀티패스, 통신 지연, 기준국 이상은 정확도 저하와 오측위의 원인이 된다." },
        { part: "대책", write: "반복관측, 기준점 검측, 품질지표 확인, 현장 장애물 기록을 성과검증 절차에 포함한다." },
      ],
    },
    "three-dimensional-cadastre": {
      title: "현장뉴스: 3차원 지적과 입체 공간정보",
      subtitle: "3D 건물모형, 지하공간통합지도, 디지털트윈 플랫폼을 입체지적 답안의 근거로 정리합니다.",
      headline: "3차원 공간정보는 도시를 보여주는 시각화 자료를 넘어 침수예측, 드론길, 인허가, 안전관리에 쓰이는 정책 인프라다.",
      context: "국토교통부 보도자료는 전국 건축물 3차원 모형 제공과 디지털트윈 활용을 강조하고, 최근 언론은 K-GeoP·V-World 기반 디지털트윈 플랫폼 확산을 다룹니다.",
      sources: [
        {
          type: "정부 보도자료",
          date: "2021.06.29",
          title: "전국 건축물 3차원 건물 모형 서비스",
          summary: "국토교통부는 약 1,900만 동 건축물의 1단계 수준 3차원 건물 모형 구축을 완료하고, 드론길·침수예측·경관분석 등 활용을 제시했습니다.",
          answerPoint: "3차원 지적의 필요성을 '평면 경계에서 높이·객체·권리정보를 포함하는 입체관리로 확장'하는 근거로 사용합니다.",
          url: "https://m.korea.kr/briefing/pressReleaseView.do?endDate=2021-06-30&newsId=156458820&pageIndex=1&repCode=&repCodeType=&srchWord=%EC%8A%A4%EB%A7%88%ED%8A%B8&startDate=2008-02-29",
        },
        {
          type: "신문 기사",
          date: "2026.04.27",
          title: "디지털 트윈국토 플랫폼 권역별 현장간담회",
          summary: "머니투데이는 국토부가 K-GeoP, V-World, 공장인허가 사전진단서비스 등을 소개하며 지방정부 활용사례와 제도개선 의견을 논의한다고 보도했습니다.",
          answerPoint: "활용효과에서 '3D 공간정보가 행정 의사결정과 시뮬레이션 플랫폼으로 확장된다'고 씁니다.",
          url: "https://www.mt.co.kr/amp/estate/2026/04/27/2026042707242968285",
        },
      ],
      writeTips: [
        { part: "필요성", write: "지상·지하·실내 권리가 중첩되는 도시에서는 2D 필지 경계만으로 권리와 시설 안전을 설명하기 어렵다." },
        { part: "구축", write: "3D 건물모형, 지하공간통합지도, BIM-GIS 연계, LoD 기준을 함께 제시한다." },
        { part: "활용", write: "침수예측, 경관분석, 드론길, 공장 인허가 사전진단을 입체공간정보 활용사례로 넣는다." },
      ],
    },
    "spatial-standard-quality": {
      title: "현장뉴스: 공간정보 표준과 품질관리",
      subtitle: "국제표준, 디지털트윈 표준, 품질검증을 답안의 현실 근거로 연결합니다.",
      headline: "공간정보 표준은 국내 행정자료를 넘어 국제협력, 민간 활용, 디지털트윈 품질의 전제조건이다.",
      context: "국토교통부의 ISO/TC 211 총회 자료와 2025년 공간정보 정책사업 자료는 표준개발, 플랫폼 고도화, 데이터 품질관리의 중요성을 반복해서 보여줍니다.",
      sources: [
        {
          type: "정부 보도자료",
          date: "2023.05.10",
          title: "공간정보 전문가 한자리에, 국제표준 성과 확산·공유",
          summary: "국토교통부는 ISO/TC 211 총회를 통해 공간정보 국제표준 논의와 디지털트윈국토, 신기술 활용, 표준 발전포럼을 추진했습니다.",
          answerPoint: "개요에서 '표준은 기관 간 상호운용성과 국제 경쟁력 확보 수단'이라고 정리합니다.",
          url: "https://www.molit.go.kr/USR/NEWS/m_71/dtl.jsp?id=95088285&lcmspage=28",
        },
        {
          type: "신문 기사",
          date: "2023.05.09",
          title: "공간정보 국제표준 성과 확산·공유",
          summary: "파이낸셜뉴스는 ISO/TC 211 총회에서 공간정보 표준화 회의, 표준화 사례 발표, 공간정보표준 발전포럼이 진행된다고 보도했습니다.",
          answerPoint: "개선방안에서 '국내 표준의 국제표준 연계와 민간 참여 확대'를 제안합니다.",
          url: "https://www.fnnews.com/news/202305091100485988",
        },
      ],
      writeTips: [
        { part: "정의", write: "공간정보 표준은 좌표계, 데이터모델, 코드, 메타데이터, 품질요소를 통일하는 약속이다." },
        { part: "품질", write: "완전성, 위치정확도, 논리일관성, 주제정확도, 최신성을 품질관리 항목으로 제시한다." },
        { part: "정책", write: "디지털트윈국토와 플랫폼 활용을 위해 표준개발, 품질검증 자동화, 메타데이터 의무화를 제안한다." },
      ],
    },
    "uav-cadastre": {
      title: "현장뉴스: UAV·드론 기반 지형·지적 자료 취득",
      subtitle: "드론측량 업무규정, 지적재조사, Geo-AI 분석을 UAV 답안의 현장 사례로 정리합니다.",
      headline: "드론은 빠른 현황 취득 도구이고, 답안에서는 GCP·검사점·성과검증을 붙여야 법정 성과로 설득력이 생긴다.",
      context: "언론은 지적측량 드론 활용 표준절차와 지자체 드론·위성 활용 사례를 다루고, 2025년 공간정보 정책자료는 드론 영상 AI 분석을 행정서비스로 확장합니다.",
      sources: [
        {
          type: "신문 기사",
          date: "2023.07.05",
          title: "지적측량 드론 활용성 높인다",
          summary: "머니투데이는 국토교통부가 지적측량 등에 드론 활용을 늘리기 위한 드론측량 업무규정을 행정예고했다고 보도했습니다.",
          answerPoint: "제도 파트에서 '드론 성과를 법정 측량에 쓰려면 표준 업무절차와 정확도 검증 기준이 필요하다'고 연결합니다.",
          url: "https://www.mt.co.kr/estate/2023/07/05/2023070509172827747",
        },
        {
          type: "정부 보도자료",
          date: "2025.05.02",
          title: "2025년 공간정보 정책사업과 드론 영상 AI 분석",
          summary: "국토교통부 2025년 시행계획은 드론 촬영 영상을 AI가 분석해 불법 건축물이나 쓰레기 투기 의심구역을 찾는 공간정보 자동분석 서비스를 예시로 들었습니다.",
          answerPoint: "활용효과에서 'UAV 자료는 단순 정사영상 제작을 넘어 Geo-AI 기반 행정 자동분석으로 확장된다'고 씁니다.",
          url: "https://itskorea.kr/downloadFile.do?fileId=FILE_000000000101521&fileSn=1",
        },
      ],
      writeTips: [
        { part: "절차", write: "비행계획, GCP 설치, 영상처리, 검사점 정확도 평가, 성과품 제출 순서로 쓴다." },
        { part: "한계", write: "정사영상은 현황 파악에 유리하지만 법적 경계확정은 지적측량 기준과 현장검증이 필요하다." },
        { part: "미래", write: "드론 영상과 AI 분석을 결합하면 불법건축물, 재난현장, 지적불부합 탐지에 활용할 수 있다." },
      ],
    },
    nsdi: {
      title: "현장뉴스: 국가공간정보 인프라와 정책",
      subtitle: "국가공간정보정책 시행계획, K-GeoP, V-World, Geo-AI를 NSDI 답안의 최신 근거로 정리합니다.",
      headline: "NSDI는 데이터 구축사업을 넘어 국가행정·민간산업·국민서비스를 연결하는 플랫폼 정책으로 진화하고 있다.",
      context: "2025년 국가공간정보정책 시행계획과 2026년 현장간담회 자료는 대규모 투자, 플랫폼 고도화, 디지털트윈, Geo-AI, 민간개방을 핵심 흐름으로 제시합니다.",
      sources: [
        {
          type: "정부 보도자료",
          date: "2025.05.02",
          title: "2025년 5,800억 원 규모 공간정보 정책사업",
          summary: "국토교통부는 2025년 국가공간정보정책 시행계획을 통해 1,209개 사업, 약 5,838억 원 규모의 공간정보 정책과 디지털트윈국토, 플랫폼 고도화, Geo-AI 적용 방향을 제시했습니다.",
          answerPoint: "현황에서 'NSDI 투자가 디지털트윈 구축과 유통·활용 활성화에 집중되고 있다'고 쓸 수 있습니다.",
          url: "https://itskorea.kr/downloadFile.do?fileId=FILE_000000000101521&fileSn=1",
        },
        {
          type: "신문 기사",
          date: "2026.04.27",
          title: "디지털 트윈국토 플랫폼 현장간담회",
          summary: "머니투데이는 국토부가 전국 5개 권역에서 K-GeoP, V-World, 공장인허가 사전진단 서비스 활용사례를 공유한다고 보도했습니다.",
          answerPoint: "개선방안에서 '중앙 플랫폼과 지자체 정책지도를 연결해 현장 수요 기반으로 고도화해야 한다'고 제시합니다.",
          url: "https://www.mt.co.kr/amp/estate/2026/04/27/2026042707242968285",
        },
      ],
      writeTips: [
        { part: "개요", write: "NSDI는 공간정보의 생산, 표준화, 품질관리, 유통, 활용을 국가 차원에서 통합하는 인프라다." },
        { part: "정책", write: "K-GeoP와 V-World는 행정용·대민용 플랫폼으로 구분해 쓰고, Geo-AI는 차세대 활용 방향으로 제시한다." },
        { part: "개선", write: "중복구축 방지, 표준·품질 의무화, 보안심사, 민간 API 확대, 지자체 역량강화를 함께 제안한다." },
      ],
    },
    "boundary-error": {
      title: "현장뉴스: 오차·정확도·성과 검증",
      subtitle: "성과심사 기준과 지하공간통합지도 고도화 사례를 오차·정확도 답안에 연결합니다.",
      headline: "성과검증은 정확도 수치만 확인하는 절차가 아니라 완전성, 일관성, 메타데이터, 현지심사를 포함한 품질관리 체계다.",
      context: "법령자료는 위치정확성·위상일관성·메타데이터 검사 항목을 제시하고, 국토부 정책자료는 지하공간통합지도 정확도 개선과 위험분석을 추진하고 있습니다.",
      sources: [
        {
          type: "법령·정부자료",
          date: "현행 기준",
          title: "공공측량 성과심사 세부항목 및 판정기준",
          summary: "성과심사 기준은 3차원 지하구조물 데이터의 기준좌표계 적용, 평면·수직 위치 정확성, 인접 정합성, 메타데이터 누락 여부 등을 검토하도록 제시합니다.",
          answerPoint: "검증 항목에서 '외적 정확성, 내적 정확성, 위상일관성, 메타데이터'를 함께 적어 답안 깊이를 높입니다.",
          url: "https://www.law.go.kr/LSW/flDownload.do?bylClsCd=200201&flNm=%5B%EB%B3%84%ED%91%9C+3%5D+%EA%B3%B5%EA%B3%B5%EC%B8%A1%EB%9F%89+%EC%84%B1%EA%B3%BC%EC%8B%AC%EC%82%AC+%EC%84%B8%EB%B6%80%ED%95%AD%EB%AA%A9+%EB%B0%8F+%ED%8C%90%EC%A0%95%EA%B8%B0%EC%A4%80&flSeq=151295087",
        },
        {
          type: "정부 보도자료",
          date: "2025.05.02",
          title: "지하공간통합지도 고도화와 정확도 개선",
          summary: "2025년 공간정보 정책사업 자료는 지반침하 이력, 공동정보, 건설공사 정보 등을 연계하고 상·하수도 시설물 실측 예산 지원으로 정확도 개선을 추진한다고 설명합니다.",
          answerPoint: "개선방안에서 '실측자료 보강, 위험정보 연계, 정확도 검증, 지하공간 안전관리'를 묶어 제시합니다.",
          url: "https://itskorea.kr/downloadFile.do?fileId=FILE_000000000101521&fileSn=1",
        },
      ],
      writeTips: [
        { part: "개요", write: "오차관리는 참값과 관측값의 차이를 줄이는 기술적 과정이자 성과 신뢰성을 확보하는 제도적 과정이다." },
        { part: "검증", write: "RMSE, 허용오차, 검사점, 위상일관성, 메타데이터를 함께 제시하면 단순 수치평가를 넘어 품질관리 답안이 된다." },
        { part: "정책", write: "지하공간통합지도처럼 안전과 연결된 성과는 실측자료 보강과 지속 갱신이 정확도 확보의 핵심이다." },
      ],
    },
  };

  const pptWebResourcesById = {
    "cadastral-resurvey": {
      title: "지적재조사 합의경계 개선방안 3D 인포그래픽 자료",
      subtitle: "첨부 PPT 15장을 웹페이지에서 바로 읽을 수 있도록 강의 흐름, 슬라이드 핵심, 답안 연결 문장으로 재구성했습니다.",
      headline: "합의는 경계 결정 수단이 아니라 수용성 보완 수단이다.",
      lead: "경계는 좌표와 기록으로 먼저 설명하고, 토지소유자 합의는 예비경계안 이해 이후에 작동해야 합니다. 이 자료는 지적재조사의 배경, 불부합 유형, 좌표기반 현황측량, 주민협의, 위원회 심의, 성과검증, 유지관리까지 한 페이지에서 복습하도록 구성했습니다.",
      meta: [
        { label: "PPT 슬라이드", value: "15장" },
        { label: "핵심 주제", value: "합의경계" },
        { label: "답안 활용", value: "25점형" },
      ],
      phases: [
        { range: "01-03", title: "문제 인식", summary: "합의경계의 역할과 지적재조사의 필요성을 잡고, 합의 중심 접근과 자료 기반 판단을 비교한다." },
        { range: "04-05", title: "불부합 유형", summary: "현실경계형, 공공용지형, 권리충돌형을 구분해 원인 분석의 깊이를 만든다." },
        { range: "06-08", title: "자료 기반 경계안", summary: "기준점·좌표 현황측량, 디지털 증거팩, 예비경계안과 조정금 시뮬레이션을 연결한다." },
        { range: "09-12", title: "협의와 심의", summary: "합의 방식의 문제점을 구조화하고 주민협의, 위원회 심의, 조정금 이의신청을 절차화한다." },
        { range: "13-15", title: "검증과 유지관리", summary: "성과검증, 공시, 전자이력, 디지털 증거 보존을 통해 사후 분쟁을 예방한다." },
      ],
      slides: [
        {
          no: "01",
          title: "지적재조사 경계결정의 핵심",
          subtitle: "합의는 경계 결정 수단이 아니라 수용성 보완 수단",
          message: "좌표와 기록으로 먼저 설명하고, 합의는 그 이후에 작동해야 한다.",
          points: [
            "종이지적의 불부합을 좌표 기반 디지털 지적으로 전환",
            "토지소유자 합의는 민원 조정에는 유효",
            "객관 측량·위원회 판단 없이 합의만 앞세우면 분쟁 확대",
          ],
        },
        {
          no: "02",
          title: "합의 중심 vs 자료 기반 판단",
          subtitle: "두 접근의 장점과 위험을 분리해서 보아야 함",
          message: "좋은 합의는 자료 없는 타협이 아니라 자료를 이해한 선택이다.",
          points: [
            "합의 중심은 주민 수용성·신속성이 높지만 정보비대칭 위험이 있다.",
            "측량·위원회 중심은 객관성·재현성·사후검증에 강하다.",
            "최적 모델은 예비경계안, 설명, 협의, 심의의 순서다.",
          ],
        },
        {
          no: "03",
          title: "사업 배경: 왜 지적재조사가 필요한가",
          subtitle: "현실과 공부의 불일치를 바로잡는 공적 경계 정비",
          message: "지적재조사는 단순 도면정비가 아니라 재산권 보호와 디지털 전환이다.",
          points: [
            "실제 점유선과 등록경계가 장기간 괴리",
            "도해지역·축척 차이·기준점 품질 차이 누적",
            "공공용지·사유지 접합부에서 생활경계가 고착",
          ],
        },
        {
          no: "04",
          title: "불부합 유형 1: 현실경계형",
          subtitle: "논둑·담장·수로·진입로가 오래 쓰이며 경계가 달라짐",
          message: "눈에 보이는 담장·논둑이 곧 법적 경계인 것은 아니다.",
          points: [
            "농촌은 논둑·배수로 이동으로 경작선이 변화한다.",
            "도시는 담장·화단·주차장 사용이 고착된다.",
            "현실경계 무다툼과 소유권 무다툼은 구별해야 한다.",
          ],
        },
        {
          no: "05",
          title: "불부합 유형 2: 공공용지·권리충돌형",
          subtitle: "마을안길·구거·도로가 사유지 경계와 충돌하는 사례",
          message: "공공용지와 연결된 경계는 사적 합의만으로 처리하면 위험하다.",
          points: [
            "도로·구거·하천 접합부는 공공성 검토가 필요하다.",
            "소유자 합의만으로 공공통행 기능을 훼손할 수 있다.",
            "관리청 의견과 별도 검증을 절차화해야 한다.",
          ],
        },
        {
          no: "06",
          title: "기준점·좌표 기반 현황측량",
          subtitle: "경계 결정의 출발점은 검증 가능한 좌표선",
          message: "합의한 선보다 먼저 기준점과 좌표로 설명되는 선이 필요하다.",
          points: [
            "GNSS·토털스테이션·드론정사영상을 활용한다.",
            "지적기준점 망실·훼손 여부를 먼저 확인한다.",
            "기지경계선과 부합하지 않으면 재확인한다.",
          ],
        },
        {
          no: "07",
          title: "필지별 디지털 증거팩",
          subtitle: "협의 전, 소유자가 이해할 수 있는 자료 묶음을 제공",
          message: "자료가 모이면 설득력이 생기고, 기록이 남으면 분쟁이 줄어든다.",
          points: [
            "기준점 현황·점유현황도·과거 측량부를 통합한다.",
            "현장사진·드론영상·인접필지 좌표를 연결한다.",
            "필지별 이력과 근거를 하나의 패키지로 보존한다.",
          ],
        },
        {
          no: "08",
          title: "예비경계안과 조정금 시뮬레이션",
          subtitle: "경계 변화가 면적·공공용지·금전에 미치는 영향 제시",
          message: "주민은 선만 보는 것이 아니라 면적과 돈까지 함께 이해해야 한다.",
          points: [
            "예비경계도와 면적 증감표를 함께 제시한다.",
            "공공용지 영향도와 진출입 불편을 검토한다.",
            "조정금 예상 범위 설명으로 사후 불신을 완화한다.",
          ],
        },
        {
          no: "09",
          title: "토지소유자 합의 방식의 주요 문제",
          subtitle: "정보비대칭·압박·권리다툼 은폐·조정금 불신",
          message: "합의서만 있으면 충분하다는 생각이 가장 큰 위험이다.",
          points: [
            "측량도와 면적표를 이해하는 수준 차이가 크다.",
            "마을 영향력·다수 의견이 소수에게 압박이 될 수 있다.",
            "현실경계 합의가 소유권 분쟁 종결은 아니다.",
          ],
        },
        {
          no: "10",
          title: "구조화된 주민 협의 모델",
          subtitle: "설명자료·회의록·취약소유자 보호를 표준화",
          message: "주민협의는 서명 수집이 아니라 이해와 기록을 남기는 절차이다.",
          points: [
            "공람·서면통보·주민설명회 절차를 충실화한다.",
            "설명자료 교부 확인과 반대 사유를 기록한다.",
            "고령자·부재지주에 현장설명·대리확인을 지원한다.",
          ],
        },
        {
          no: "11",
          title: "경계결정위원회 심의",
          subtitle: "합의의 적정성과 법적 타당성을 이유와 함께 남김",
          message: "위원회 판단은 왜 이 경계가 맞는가를 설명할 수 있어야 한다.",
          points: [
            "합의 내용이 객관자료와 충돌하는지 검토한다.",
            "공공용지·권리충돌 필지는 관리청 의견을 반영한다.",
            "결정문에 판단 이유와 검토자료를 명시한다.",
          ],
        },
        {
          no: "12",
          title: "조정금·이의신청의 분리 관리",
          subtitle: "경계 결정과 금전 문제를 구분해서 설명하고 처리",
          message: "조정금 불신은 경계 불복으로 번질 수 있으므로 별도 관리가 필요하다.",
          points: [
            "면적 증감과 조정금 산정근거를 명확히 제시한다.",
            "이의신청 대상과 기간을 공시문에 쉽게 표시한다.",
            "재산정 가능성·불복 절차를 한눈에 안내한다.",
          ],
        },
        {
          no: "13",
          title: "성과 검증·공시 단계",
          subtitle: "끝나는 단계가 아니라 다음 분쟁을 예방하는 단계",
          message: "성과검증은 면적계산 확인이 아니라 종합 품질검사여야 한다.",
          points: [
            "기준점 상태·경계점 표지·현황사진을 확인한다.",
            "인접 필지 폐합과 공공용지 접합 여부를 검토한다.",
            "좌표·사진·측량부·위원회 판단을 연결 보존한다.",
          ],
        },
        {
          no: "14",
          title: "유지관리: 디지털 지적의 신뢰 인프라",
          subtitle: "경계점 전자이력과 데이터 갱신체계가 필요",
          message: "유지관리의 본질은 합의서를 보관하는 것이 아니라 공적 기록체계를 남기는 것이다.",
          points: [
            "경계점 좌표·설치일·사진을 QR 또는 전자이력으로 관리한다.",
            "후속 토지이동과 지적공부 갱신을 연계한다.",
            "필지별 디지털 증거팩을 공시 전후 동일하게 보존한다.",
          ],
        },
        {
          no: "15",
          title: "결론: 객관자료 위의 합의",
          subtitle: "합의를 강화하는 것이 아니라 객관자료 위에서만 작동하게 통제",
          message: "좌표·기록·설명·이의절차가 결합될 때 지적재조사는 신뢰 인프라가 된다.",
          points: [
            "경계는 좌표와 기록으로 먼저 설명한다.",
            "합의는 주민 수용성을 높이는 보완수단이다.",
            "디지털 증거와 유지관리로 사후 분쟁을 예방한다.",
          ],
        },
      ],
      answerMap: [
        { part: "개요", write: "지적재조사는 종이지적의 불부합을 좌표 기반 디지털 지적으로 전환해 재산권 보호와 행정 신뢰성을 확보하는 사업이다." },
        { part: "문제점", write: "토지소유자간 합의만 앞세우면 정보비대칭, 사실상 압박, 권리다툼 은폐, 공공용지 훼손, 조정금 불신이 발생할 수 있다." },
        { part: "개선방안", write: "좌표기반 예비경계안, 필지별 디지털 증거팩, 구조화된 주민협의, 경계결정위원회 이유 기재, 성과검증·공시·전자이력관리를 연계한다." },
        { part: "결론", write: "합의는 경계결정의 기준이 아니라 객관자료 위에서 주민 수용성을 높이는 보완절차로 통제되어야 한다." },
      ],
      memoryLine: "암기 문장: 합의경계는 서명으로 정하는 선이 아니라 좌표·기록·설명·검증 위에서 주민이 수용하는 공적 경계선이다.",
    },
  };

  window.TODAY_NEWS_DIGESTS = newsDigestsById;

  function basicLectureFor(lecture) {
    return lecture.basicLecture ?? basicLecturesById[lecture.id];
  }

  function presentationFor(lecture) {
    if (lecture.presentationSummary) {
      return lecture.presentationSummary;
    }
    const basicLecture = basicLectureFor(lecture);
    return {
      title: `${lecture.title} PPT 정리`,
      subtitle: "강의용 슬라이드로 옮길 때 바로 쓸 수 있는 핵심 흐름입니다.",
      coreMessage: basicLecture?.coreMessage ?? lecture.overlapReason,
      flow: (lecture.solution.steps ?? []).map((step, index) => ({
        label: `Part ${index + 1}`,
        title: step.replace(/^\d+\.\s*/, ""),
        text: index === 0 ? "정의와 출제배경을 먼저 제시해 문제의 범위를 잡습니다." : "기술적 절차와 제도적 관리방안을 연결해 답안의 깊이를 만듭니다.",
      })),
      takeaways: (basicLecture?.concepts ?? []).slice(0, 4).map((concept, index) => ({
        slide: String(index + 1),
        title: concept.title,
        summary: concept.summary,
        answerTip: `${concept.kicker}을 답안의 소제목 또는 키워드로 활용합니다.`,
      })),
      answerMap: [
        { part: "도입", write: lecture.overlapReason },
        { part: "본론", write: (lecture.solution.steps ?? []).map((step) => step.replace(/^\d+\.\s*/, "")).join(" → ") },
        { part: "결론", write: lecture.solution.closing },
      ],
      memoryLine: basicLecture?.memoryLine ?? "암기 문장: 정의, 절차, 검증, 활용을 한 줄로 연결한다.",
    };
  }

  function cardNewsFor(lecture) {
    if (lecture.cardNews) {
      return lecture.cardNews;
    }
    return {
      title: `${lecture.title} 카드뉴스`,
      subtitle: "짧은 이미지 카드로 복습할 수 있도록 핵심 개념을 재구성했습니다.",
      hero: {
        headline: `${lecture.title}는 정의보다 구조가 먼저다.`,
        text: "문제를 보면 키워드, 절차, 검증, 정책 활용을 차례로 떠올리면 답안 골격이 빠르게 잡힙니다.",
        chips: (lecture.keywords ?? []).slice(0, 5),
      },
      cards: [
        {
          no: "01",
          kicker: "정의",
          title: "무엇을 묻는가",
          caption: lecture.overlapReason,
          points: (lecture.keywords ?? []).slice(0, 4),
        },
        {
          no: "02",
          kicker: "절차",
          title: "답안의 뼈대",
          caption: "사업 또는 기술 절차를 단계적으로 제시합니다.",
          points: (lecture.solution.steps ?? []).map((step) => step.replace(/^\d+\.\s*/, "")),
        },
        {
          no: "03",
          kicker: "검증",
          title: "기술사다운 마무리",
          caption: "성과검증, 품질관리, 법제도 개선을 결론에 붙이면 답안 완성도가 높아집니다.",
          points: ["정확도", "표준", "메타데이터", "사후관리"],
        },
      ],
      closing: lecture.solution.closing,
    };
  }

  function newsDigestFor(lecture) {
    const digest = newsDigestsById[lecture.id];
    return digest ? { id: lecture.id, ...digest } : null;
  }

  function pptWebResourceFor(lecture) {
    return pptWebResourcesById[lecture.id] ?? null;
  }

  function lecturePages(lecture) {
    const basicLecture = basicLectureFor(lecture);
    const newsDigest = newsDigestFor(lecture);
    const summary = summaryFor(lecture);
    const presentation = presentationFor(lecture);
    const cardNews = cardNewsFor(lecture);
    const pptResource = pptWebResourceFor(lecture);

    return [
      { id: "explanation", label: "답안작성", render: () => renderAnswerWriting(lecture) },
      { id: "report", label: "핵심정리", render: () => renderReportSummary(summary) },
      { id: "basic", label: "기본강의", render: () => renderBasicLecture(basicLecture) },
      { id: "example", label: "답안예시", render: () => renderAnswerExample(lecture) },
      { id: "presentation", label: "PPT 정리", render: () => renderPresentationSummary(presentation) },
      ...(pptResource ? [{ id: "ppt-resource", label: "PPT 자료", render: () => renderPptWebResource(pptResource) }] : []),
      { id: "card-news", label: "카드뉴스", render: () => renderCardNews(cardNews) },
      { id: "news-digest", label: "보도자료", render: () => renderNewsDigest(newsDigest) },
    ];
  }

  function renderPageTabs(pages) {
    if (pages.length < 2) {
      return "";
    }

    return `
      <nav class="lecture-page-tabs" aria-label="오늘강의 상세 페이지">
        ${pages
          .map(
            (page) => `
              <button class="lecture-page-tab ${page.id === selectedPage ? "active" : ""}" type="button" data-lecture-page="${page.id}">
                ${app.escapeHTML(page.label)}
              </button>
            `,
          )
          .join("")}
      </nav>
    `;
  }

  function renderAnswerWriting(lecture) {
    return `
      <div class="answer-paper lecture-page-body">
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

    const pages = lecturePages(lecture);
    if (!pages.some((page) => page.id === selectedPage)) {
      selectedPage = pages[0].id;
    }
    const currentPage = pages.find((page) => page.id === selectedPage) ?? pages[0];

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

        ${renderPageTabs(pages)}
        <div class="lecture-page-content">
          ${currentPage.render()}
        </div>
      </article>
    `;
  }

  list?.addEventListener("click", (event) => {
    const button = event.target.closest("[data-lecture-id]");
    if (!button) {
      return;
    }
    selectedId = button.dataset.lectureId;
    selectedPage = "explanation";
    renderList();
    renderDetail();
  });

  detail?.addEventListener("click", (event) => {
    const button = event.target.closest("[data-lecture-page]");
    if (!button) {
      return;
    }
    selectedPage = button.dataset.lecturePage;
    renderDetail();
  });

  renderList();
  renderDetail();
});
