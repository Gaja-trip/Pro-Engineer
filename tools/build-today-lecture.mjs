import { writeFile } from "node:fs/promises";
import { readFileSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { PDFParse } from "pdf-parse";
import hwp from "hwp.js";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const rootDir = path.resolve(__dirname, "..");
const baseUrl = "https://www.q-net.or.kr";
const sourceUrl = `${baseUrl}/cst006.do?id=cst00601&code=1203&gSite=Q&gId=`;
const searchTerm = "지적기술사";
const minYear = 2015;
const maxYear = 2026;
const { parse: parseHwp } = hwp;

const themes = [
  {
    id: "cadastral-resurvey",
    title: "지적재조사와 경계 불부합",
    keywords: ["지적재조사", "불부합", "경계", "지적도", "지형도"],
    why: "측량 분야는 기준·성과·도면 정합성을, 지적 분야는 경계 확정과 권리관계를 중점으로 다룹니다.",
    frame: ["사업 배경과 불부합 유형", "기준점·좌표 기반 현황측량", "경계 조정과 주민 협의", "성과 검증·공시·유지관리"],
  },
  {
    id: "spatial-law",
    title: "공간정보법과 측량 성과의 효력",
    keywords: ["공간정보 구축 및 관리 등에 관한 법률", "공간정보법", "공공측량", "일반측량", "기본측량", "성과심사", "측량성과", "검사제도"],
    why: "두 종목 모두 법적 효력을 갖는 측량성과와 절차적 정당성을 답안의 중심축으로 삼습니다.",
    frame: ["측량의 법적 구분", "성과 작성·검사·심사", "오차와 책임 범위", "디지털 전환에 맞춘 제도 개선"],
  },
  {
    id: "control-point",
    title: "국가기준점과 지적측량 기준",
    keywords: ["국가기준점", "측량기준점", "통합기준점", "기준점", "측량원점"],
    why: "공간정보의 위치 정확도와 지적 경계의 법적 안정성은 모두 기준점 체계에서 출발합니다.",
    frame: ["기준점 종류와 역할", "상호 연계와 성과 관리", "현장 검측과 망 조정", "지적측량·공공측량 적용"],
  },
  {
    id: "coordinate-system",
    title: "세계측지계·좌표계·좌표변환",
    keywords: ["세계측지계", "한국측지계", "좌표계", "좌표변환", "지구기준측지좌표계"],
    why: "좌표 기준의 통일은 지적도 정비, 공간정보 통합, GNSS 측량의 공통 전제입니다.",
    frame: ["좌표계 정의", "변환 필요성과 오차 원인", "변환 절차와 검증", "행정자료·공간정보 통합 활용"],
  },
  {
    id: "gnss-cadastre",
    title: "GNSS·RTK 기반 위치 결정",
    keywords: ["GNSS", "GPS", "RTK", "VRS", "FKP", "네트워크 RTK"],
    why: "현장 지적측량과 공간정보 구축 모두 빠른 위치결정과 정확도 검증을 요구합니다.",
    frame: ["위성측위 원리", "오차 요인과 보정", "현장 적용 절차", "성과 검증과 한계"],
  },
  {
    id: "three-dimensional-cadastre",
    title: "3차원 지적과 입체 공간정보",
    keywords: ["3차원", "입체", "지하공간", "지하시설물", "실내공간", "디지털 트윈"],
    why: "복합건축물, 지하공간, 도시 디지털트윈은 지적과 공간정보의 경계가 가장 많이 겹치는 영역입니다.",
    frame: ["입체 권리·객체 정의", "3D 취득과 모델링", "공간정보 표준·LoD", "관리·갱신·활용 체계"],
  },
  {
    id: "spatial-standard-quality",
    title: "공간정보 표준과 품질관리",
    keywords: ["표준", "품질", "메타데이터", "ISO 19157", "기관표준", "데이터품질"],
    why: "두 종목 모두 데이터가 행정·산업에서 재사용되려면 표준과 품질요소를 갖춰야 한다는 논리를 공유합니다.",
    frame: ["표준의 필요성", "품질요소와 메타데이터", "검사·검수 절차", "플랫폼 연계와 재사용"],
  },
  {
    id: "uav-cadastre",
    title: "UAV·드론 기반 지형·지적 자료 취득",
    keywords: ["UAV", "드론", "무인항공", "무인비행", "사진측량"],
    why: "UAV는 지형도 제작뿐 아니라 지적재조사, 현황조사, 경계 검토의 보조 자료로 확장됩니다.",
    frame: ["촬영 계획과 GCP", "영상처리·정사영상", "정확도 검증", "지적·공공측량 적용 한계"],
  },
  {
    id: "nsdi",
    title: "국가공간정보 인프라와 정책",
    keywords: ["국가공간정보", "NSDI", "공간정보정책", "기본계획", "국가공간정보인프라"],
    why: "측량 성과와 지적 정보는 국가공간정보 인프라의 핵심 기반자료로 함께 활용됩니다.",
    frame: ["정책 비전과 데이터 기반", "기관 간 연계", "표준·품질·보안", "민간 활용과 서비스"],
  },
  {
    id: "boundary-error",
    title: "오차·정확도·성과 검증",
    keywords: ["오차", "정확도", "정밀도", "착오", "성과", "검증"],
    why: "공학적 정확도와 법적 안정성이 만나는 영역이라 기술사 답안에서 반복 출제됩니다.",
    frame: ["오차와 착오 구분", "관측·처리·성과 오차", "정확도 확보 대책", "검사·품질관리"],
  },
];

function normalizeText(text) {
  return text
    .replace(/\r/g, "")
    .replace(/\t/g, " ")
    .replace(/\u00a0/g, " ")
    .replace(/[ ]{2,}/g, " ")
    .replace(/[ ]+\n/g, "\n")
    .replace(/\n[ ]+/g, "\n")
    .replace(/\n{3,}/g, "\n\n")
    .trim();
}

function compactText(text) {
  return normalizeText(text).replace(/\s+/g, " ").trim();
}

function titleToYear(title, postedAt) {
  const titleYear = title.match(/\((\d{4})년\)/);
  if (titleYear) return Number(titleYear[1]);
  return Number(postedAt.slice(0, 4));
}

function parseSearchRows(html) {
  return [...html.matchAll(/<tr[\s\S]*?<\/tr>/g)]
    .map((match) => match[0])
    .filter((row) => row.includes("지적"))
    .map((row) => {
      const seq = row.match(/goNext\('(\d+)'/);
      const title = row.match(/title="([^"]+)"/);
      const postedAt = row.match(/<span class="date">([^<]+)<\/span>/);
      const round = title?.[1]?.match(/제(\d+)회/);
      if (!seq || !title || !postedAt || !round) return null;
      return {
        artlSeq: seq[1],
        title: title[1],
        postedAt: postedAt[1],
        round: Number(round[1]),
        year: titleToYear(title[1], postedAt[1]),
      };
    })
    .filter(Boolean);
}

async function fetchText(url, options = {}) {
  const response = await fetch(url, {
    ...options,
    headers: {
      "User-Agent": "Mozilla/5.0 (compatible; SurveyorMasterCourse/1.0)",
      ...(options.headers ?? {}),
    },
  });
  if (!response.ok) throw new Error(`Request failed ${response.status}: ${url}`);
  return response.text();
}

async function fetchBuffer(url) {
  const response = await fetch(url, {
    headers: { "User-Agent": "Mozilla/5.0 (compatible; SurveyorMasterCourse/1.0)" },
  });
  if (!response.ok) throw new Error(`Download failed ${response.status}: ${url}`);
  return Buffer.from(await response.arrayBuffer());
}

async function getSearchResults() {
  const rows = [];
  for (let page = 1; page <= 8; page += 1) {
    const url = `${baseUrl}/cst006.do?id=cst00601s01&gSite=Q&gId=&page=${page}&schText=${encodeURIComponent(searchTerm)}&schType=T&brdId=Q006&code=1203`;
    const html = await fetchText(url);
    const pageRows = parseSearchRows(html);
    if (pageRows.length === 0) break;
    rows.push(...pageRows);
  }
  return rows
    .filter((row) => row.year >= minYear && row.year <= maxYear)
    .sort((a, b) => b.round - a.round);
}

async function getAttachment(row) {
  const body = new URLSearchParams({
    page: "1",
    schType: "T",
    schText: searchTerm,
    artlSeq: row.artlSeq,
    brdId: "Q006",
    code: "1203",
    cst: "Y",
  });
  const html = await fetchText(`${baseUrl}/cst006.do?id=cst00602&gSite=Q&gId=`, {
    method: "POST",
    body,
    headers: { "Content-Type": "application/x-www-form-urlencoded;charset=UTF-8" },
  });
  const files = [
    ...html.matchAll(/fileDown\('([^']+)',\s*'([\s\S]*?)',\s*'([^']+)',\s*'([^']+)'\)/g),
  ].map((match) => ({
    filePath: match[1],
    fileName: compactText(match[2]),
    fileSeq: match[3],
    artlSeq: match[4],
  }));
  if (!files.length) throw new Error(`No attachment found for ${row.title}`);
  const file = files.find((item) => item.fileName.includes(searchTerm)) ?? files.find((item) => item.fileName.includes(`제${row.round}회`)) ?? files[0];
  return {
    ...file,
    downloadUrl: `${baseUrl}/cst006.do?id=cst00602s01&gSite=Q&gId=&fileCode=R001&filePath=${encodeURIComponent(file.filePath)}&fileName=${encodeURIComponent(file.fileName)}&fileSeq=${encodeURIComponent(file.fileSeq)}&artlSeq=${encodeURIComponent(file.artlSeq)}&href=0`,
  };
}

async function extractPdfText(buffer) {
  const parser = new PDFParse({ data: buffer });
  const result = await parser.getText();
  await parser.destroy();
  return normalizeText(result.text);
}

function textFromHwpNode(node) {
  if (!node) return "";
  if (typeof node === "string") return node;
  if (Array.isArray(node)) return node.map(textFromHwpNode).filter(Boolean).join("");
  if (typeof node === "object") {
    let text = "";
    if (typeof node.value === "string") text += node.value;
    if (Array.isArray(node.content)) text += node.content.map(textFromHwpNode).join("");
    if (Array.isArray(node.items)) text += node.items.map(textFromHwpNode).join("\n");
    if (Array.isArray(node.controls)) text += node.controls.map(textFromHwpNode).join("\n");
    return text;
  }
  return "";
}

function extractHwpText(buffer) {
  const document = parseHwp(buffer, { type: "buffer" });
  return normalizeText(
    document.sections
      .flatMap((section) => section.content.map((paragraph) => textFromHwpNode(paragraph)))
      .join("\n"),
  );
}

async function extractDocumentText(buffer, fileName) {
  const ext = path.extname(fileName).toLowerCase();
  if (ext === ".hwp") return extractHwpText(buffer);
  return extractPdfText(buffer);
}

function parsePeriod(block, periodNumber) {
  let markerIndex = block.indexOf("※");
  if (markerIndex === -1) markerIndex = block.search(/다음\s*문제\s*중/);
  if (markerIndex === -1) return null;
  let body = block
    .slice(markerIndex)
    .replace(/\n?\s*\d+\s*[-–—]\s*\d+\s*(?:※[^\n]*)?/g, "\n")
    .trim();
  const instructionMatch = body.match(/^(?:※\s*)?(?:(?:총\s*\d+\s*문제\s*중)|(?:다음\s*문제\s*중))[^\n]+/);
  if (!instructionMatch) return null;
  const total = instructionMatch[0].match(/총\s*(\d+)문제/);
  const expectedQuestionCount = total ? Number(total[1]) : periodNumber === 1 ? 13 : 6;
  const questionText = body
    .slice(instructionMatch[0].length)
    .replace(/^\s*(\d{1,2})\s+/, "$1. ")
    .replace(/(^|\n)\s*[lI][\.\)]?\s+/g, (_match, prefix) => `${prefix}1. `)
    .replace(/(시오[\.，,]?|하시오[\.，,]?|설명하시오[\.，,]?)\s+(\d{1,2})[\.\)]?\s+/g, "$1\n$2. ")
    .trim();
  const strict = [...questionText.matchAll(/(?:^|\n)\s*(\d{1,2})\.\s*([\s\S]*?)(?=(?:\n\s*\d{1,2}\.\s*)|$)/g)];
  const loose = [...questionText.matchAll(/(?:^|\n)\s*(\d{1,2})[\.\)]?\s+([\s\S]*?)(?=(?:\n\s*\d{1,2}[\.\)]?\s+)|$)/g)];
  const matches = strict.length < expectedQuestionCount && loose.length >= expectedQuestionCount ? loose : strict;
  const rawQuestions = matches
    .map((match) => ({ no: Number(match[1]), text: compactText(match[2]) }))
    .filter((question) => question.text);
  const questions = [];
  rawQuestions.forEach((question) => {
    const previous = questions.at(-1);
    if (previous && question.no <= previous.no) {
      previous.text = compactText(`${previous.text} ${question.no}. ${question.text}`);
      return;
    }
    questions.push(question);
  });
  return {
    period: periodNumber,
    instruction: compactText(instructionMatch[0]),
    questions,
  };
}

function parsePeriods(text) {
  const normalized = normalizeText(text);
  const blocks = normalized.includes("-- 1 of")
    ? normalized.split(/\n--\s*\d+\s+of\s+\d+\s*--\n?/g)
    : normalized.split(/(?=기술사\s+제\s*\d+\s*회\s+제\s*\d+\s*교시)/g);
  return blocks.map((block, index) => parsePeriod(block, index + 1)).filter(Boolean);
}

async function buildCadastralExam(row) {
  const attachment = await getAttachment(row);
  const buffer = await fetchBuffer(attachment.downloadUrl);
  const fullText = await extractDocumentText(buffer, attachment.fileName);
  const periods = parsePeriods(fullText);
  return {
    id: `cadastral-${row.round}`,
    round: row.round,
    year: row.year,
    title: row.title,
    sourceType: (path.extname(attachment.fileName).replace(".", "") || "pdf").toUpperCase(),
    periods,
  };
}

function questionBank(exams, subject) {
  return exams.flatMap((exam) =>
    exam.periods.flatMap((period) =>
      period.questions.map((question) => ({
        subject,
        examRound: exam.round,
        year: exam.year,
        period: period.period,
        no: question.no,
        text: question.text,
      })),
    ),
  );
}

function keywordScore(text, keywords) {
  const normalized = text.toUpperCase().replace(/\s+/g, "");
  return keywords.reduce((score, keyword) => {
    return normalized.includes(keyword.toUpperCase().replace(/\s+/g, "")) ? score + 1 : score;
  }, 0);
}

function bestQuestion(questions, theme, usedKeys) {
  return questions
    .map((question) => ({
      question,
      hits: keywordScore(question.text, theme.keywords),
      score:
        keywordScore(question.text, theme.keywords) * 10 +
        (question.period > 1 ? 2 : 0) +
        Math.min(3, Math.floor(question.text.length / 45)),
    }))
    .filter(({ question, hits }) => hits > 0 && !usedKeys.has(`${question.subject}-${question.examRound}-${question.period}-${question.no}`))
    .sort((a, b) => b.score - a.score)[0]?.question;
}

function solutionFor(theme, survey, cadastral) {
  return {
    intro: `${theme.title}은 측량및지형공간정보기술사와 지적기술사가 공통으로 묻는 고빈도 융합 주제다. 측량 답안은 위치 정확도와 데이터 구축 절차를, 지적 답안은 경계·권리·공시의 안정성을 함께 제시해야 한다.`,
    steps: theme.frame.map((item, index) => `${index + 1}. ${item}`),
    fieldLink: `생활 장면은 토지 경계 표지, 도로 공사 기준점, 지적도와 실제 도로 선형 차이처럼 눈에 보이는 대상으로 잡는다.`,
    closing: `결론에서는 ${survey.subject} 문제의 기술적 정확도와 ${cadastral.subject} 문제의 법적 안정성을 동시에 만족시키는 관리체계를 제안하면 차별화된다.`,
  };
}

function existingLectureExtras() {
  try {
    const text = readFileSync(path.join(rootDir, "assets", "js", "today-lecture-data.js"), "utf8");
    const match = text.match(/window\.TODAY_LECTURE\s*=\s*([\s\S]*);\s*$/);
    if (!match) return new Map();
    const existing = JSON.parse(match[1]);
    return new Map(
      (existing.lectures ?? []).map((lecture) => [
        lecture.id,
        {
          answerExample: lecture.answerExample,
          basicLecture: lecture.basicLecture,
          cardNews: lecture.cardNews,
          presentationSummary: lecture.presentationSummary,
          reportSummary: lecture.reportSummary,
        },
      ]),
    );
  } catch {
    return new Map();
  }
}

async function main() {
  const surveyData = JSON.parse(readFileSync(path.join(rootDir, "sources", "qnet-exams.json"), "utf8"));
  const extrasByLecture = existingLectureExtras();
  const cadastralRows = await getSearchResults();
  const cadastralExams = [];
  for (const row of cadastralRows) {
    console.log(`Reading ${row.title}`);
    cadastralExams.push(await buildCadastralExam(row));
  }
  const surveyQuestions = questionBank(surveyData.exams, "측량 및 지형공간정보기술사");
  const cadastralQuestions = questionBank(cadastralExams, "지적기술사");
  const used = new Set();
  const lectures = [];
  for (const theme of themes) {
    const survey = bestQuestion(surveyQuestions, theme, used);
    const cadastral = bestQuestion(cadastralQuestions, theme, used);
    if (!survey || !cadastral) continue;
    used.add(`${survey.subject}-${survey.examRound}-${survey.period}-${survey.no}`);
    used.add(`${cadastral.subject}-${cadastral.examRound}-${cadastral.period}-${cadastral.no}`);
    const extras = extrasByLecture.get(theme.id) ?? {};
    lectures.push({
      id: theme.id,
      title: theme.title,
      keywords: theme.keywords,
      overlapReason: theme.why,
      surveyQuestion: survey,
      cadastralQuestion: cadastral,
      solution: solutionFor(theme, survey, cadastral),
      ...(extras.reportSummary ? { reportSummary: extras.reportSummary } : {}),
      ...(extras.basicLecture ? { basicLecture: extras.basicLecture } : {}),
      ...(extras.answerExample ? { answerExample: extras.answerExample } : {}),
      ...(extras.presentationSummary ? { presentationSummary: extras.presentationSummary } : {}),
      ...(extras.cardNews ? { cardNews: extras.cardNews } : {}),
    });
    if (lectures.length === 10) break;
  }
  const data = {
    source: {
      surveySource: surveyData.source.url,
      cadastralSearchTerm: searchTerm,
      fetchedAt: new Date().toISOString(),
      note: "측량및지형공간정보기술사와 지적기술사 과년도 문항에서 공통 키워드와 답안 축이 겹치는 10개 주제를 선별했습니다.",
    },
    lectures,
  };
  await writeFile(path.join(rootDir, "assets", "js", "today-lecture-data.js"), `window.TODAY_LECTURE = ${JSON.stringify(data, null, 2)};\n`, "utf8");
  await writeFile(path.join(rootDir, "sources", "qnet-cadastral-exams.json"), `${JSON.stringify({ source: data.source, exams: cadastralExams }, null, 2)}\n`, "utf8");
  console.log(`Built ${lectures.length} lecture overlaps`);
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
