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

  function renderBasicLecture(lecture) {
    if (!lecture) {
      return "";
    }

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

  const basicLecturesById = {
    "cadastral-resurvey": {
      title: "기본강의: 지적재조사와 경계 불부합",
      subtitle: "지적재조사는 낡은 도면과 실제 토지 이용이 어긋난 상태를 좌표 기반 지적으로 바로잡는 사업입니다.",
      coreMessage: "불부합의 본질은 도면·현장·권리의 불일치이고, 해법은 기준점·좌표·협의·공시의 순서로 정리된다.",
      lead: "생활 속에서는 담장, 도로 경계석, 주차장 선, 건축물 외벽처럼 눈에 보이는 경계가 지적도 경계와 다를 수 있습니다. 기술사 답안에서는 이 차이를 단순 오차가 아니라 역사적 도해지적, 측량기준 변화, 점유관계, 행정절차가 결합된 문제로 설명해야 합니다.",
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
        { term: "답안 포인트", explain: "원인, 조사절차, 경계결정, 성과검증, 유지관리 순서로 쓰면 기술성과 행정성을 함께 잡을 수 있다." },
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

  function basicLectureFor(lecture) {
    return lecture.basicLecture ?? basicLecturesById[lecture.id];
  }

  function lecturePages(lecture) {
    const basicLecture = basicLectureFor(lecture);

    return [
      { id: "explanation", label: "답안작성 설명", render: () => renderAnswerWriting(lecture) },
      ...(lecture.reportSummary ? [{ id: "report", label: "보고서 핵심 정리", render: () => renderReportSummary(lecture.reportSummary) }] : []),
      ...(basicLecture ? [{ id: "basic", label: "기본강의", render: () => renderBasicLecture(basicLecture) }] : []),
      ...(lecture.answerExample ? [{ id: "example", label: "답안 예시", render: () => renderAnswerExample(lecture.answerExample) }] : []),
      ...(lecture.presentationSummary ? [{ id: "presentation", label: "PPT 이해정리", render: () => renderPresentationSummary(lecture.presentationSummary) }] : []),
      ...(lecture.cardNews ? [{ id: "card-news", label: "카드뉴스", render: () => renderCardNews(lecture.cardNews) }] : []),
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
