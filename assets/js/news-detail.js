document.addEventListener("DOMContentLoaded", () => {
  const app = window.SurveyorApp;
  const mount = document.querySelector("[data-news-detail]");
  if (!mount) {
    return;
  }

  const params = new URLSearchParams(window.location.search);
  const topicId = params.get("topic");
  const sourceIndex = Number(params.get("source") ?? "0");
  const lectures = window.TODAY_LECTURE?.lectures ?? [];
  const digests = window.TODAY_NEWS_DIGESTS ?? {};
  const lecture = lectures.find((item) => item.id === topicId) ?? lectures[0];
  const digest = digests[lecture?.id] ?? Object.values(digests)[0];

  if (!lecture || !digest) {
    mount.innerHTML = `<div class="empty-state">보도자료 상세 데이터를 찾을 수 없습니다.</div>`;
    return;
  }

  const sources = digest.sources ?? [];
  const selectedSource = sources[sourceIndex] ?? sources[0];
  const keywordList = [...new Set([...(lecture.keywords ?? []), "정부 보도자료", "신문기사", "답안포인트", "현장사례"])];

  function renderSource(source, index) {
    const active = source === selectedSource ? "active" : "";
    return `
      <a class="news-source-link ${active}" href="news-detail.html?topic=${app.escapeHTML(lecture.id)}&source=${index}">
        <span>${app.escapeHTML(source.type)}</span>
        <b>${app.escapeHTML(source.title)}</b>
        <small>${app.escapeHTML(source.date)}</small>
      </a>
    `;
  }

  mount.innerHTML = `
    <div class="news-detail-layout">
      <aside class="news-detail-sidebar">
        <div class="detail-heading compact">
          <span>자료 목록</span>
          <h3>${app.escapeHTML(lecture.title)}</h3>
        </div>
        <div class="news-source-list">
          ${sources.map(renderSource).join("")}
        </div>
      </aside>

      <article class="news-detail-main">
        <div class="detail-heading">
          <span>${app.escapeHTML(selectedSource.type)} · ${app.escapeHTML(selectedSource.date)}</span>
          <h2>${app.escapeHTML(selectedSource.title)}</h2>
        </div>

        <div class="answer-keyword-panel">
          <b>자료 읽기 키워드</b>
          <div>
            ${keywordList.map((keyword) => `<span>${app.escapeHTML(keyword)}</span>`).join("")}
          </div>
        </div>

        <section class="news-detail-section">
          <h3>1. 원문 핵심 요약</h3>
          <p>${app.escapeHTML(selectedSource.summary)}</p>
          <p>${app.escapeHTML(digest.context)}</p>
        </section>

        <section class="news-detail-section">
          <h3>2. 기술사 답안 연결 포인트</h3>
          <p>${app.escapeHTML(selectedSource.answerPoint)}</p>
          <div class="answer-map news-answer-map">
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

        <section class="news-detail-section">
          <h3>3. 답안에 넣을 확장 문장</h3>
          <div class="expanded-note-grid">
            <section>
              <b>개요 문장</b>
              <p>${app.escapeHTML(digest.headline)}</p>
            </section>
            <section>
              <b>현황 문장</b>
              <p>최근 자료는 ${app.escapeHTML(lecture.title)}가 정책사업, 현장검증, 데이터 품질관리와 결합되는 흐름을 보여준다.</p>
            </section>
            <section>
              <b>개선 문장</b>
              <p>따라서 답안에서는 기술절차뿐 아니라 표준화, 성과검증, 기관 간 협업, 사후관리 체계를 함께 제안해야 한다.</p>
            </section>
          </div>
        </section>

        <section class="news-detail-section">
          <h3>4. 전체 관련 자료</h3>
          <div class="news-digest-grid">
            ${sources
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
                      <a href="news-detail.html?topic=${app.escapeHTML(lecture.id)}&source=${index}">이 자료 보기</a>
                      <a href="${app.escapeHTML(source.url)}" target="_blank" rel="noopener">원문 열기</a>
                    </div>
                  </article>
                `,
              )
              .join("")}
          </div>
        </section>
      </article>
    </div>
  `;
});
