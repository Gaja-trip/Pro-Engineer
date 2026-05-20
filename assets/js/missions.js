document.addEventListener("DOMContentLoaded", () => {
  const app = window.SurveyorApp;
  const missions = window.LIFE_MISSIONS ?? [];
  const board = document.querySelector("[data-mission-board]");
  const route = document.querySelector("[data-mission-route]");

  if (board) {
    board.innerHTML = missions
      .map((mission, index) => {
        const module = app.moduleById(mission.module);
        return `
          <article class="mission-card">
            <div class="mission-check">${index + 1}</div>
            <div>
              <div class="tag-row">${app.topicPill(mission.module, module?.title ?? mission.module)}</div>
              <h3 style="margin:12px 0 6px">${app.escapeHTML(mission.place)}</h3>
              <p>${app.escapeHTML(mission.task)}</p>
              <p style="margin:10px 0 0;color:var(--muted)">${app.escapeHTML(mission.proof)}</p>
            </div>
          </article>
        `;
      })
      .join("");
  }

  if (route) {
    route.innerHTML = `
      <div class="timeline-item">
        <div class="step">아침</div>
        <div><strong>위치와 이동</strong><p style="margin:6px 0 0;color:var(--muted)">지하철, 버스, 내비게이션에서 GNSS와 네트워크 분석을 관찰합니다.</p></div>
      </div>
      <div class="timeline-item">
        <div class="step">점심</div>
        <div><strong>공간 필터</strong><p style="margin:6px 0 0;color:var(--muted)">카페·식당·편의시설을 버퍼와 레이어 관점으로 분해합니다.</p></div>
      </div>
      <div class="timeline-item">
        <div class="step">퇴근</div>
        <div><strong>도시 객체</strong><p style="margin:6px 0 0;color:var(--muted)">도로시설물, 공사장 기준점, 하천 수위표를 답안 소재로 기록합니다.</p></div>
      </div>
    `;
  }
});
