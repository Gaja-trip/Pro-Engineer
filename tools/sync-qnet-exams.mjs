import { mkdir, writeFile } from "node:fs/promises";
import { readFileSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { PDFParse } from "pdf-parse";
import hwp from "hwp.js";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const rootDir = path.resolve(__dirname, "..");
const pdfDir = path.join(rootDir, "sources", "qnet-pdf");
const dataDir = path.join(rootDir, "assets", "js");
const baseUrl = "https://www.q-net.or.kr";
const sourceUrl = `${baseUrl}/cst006.do?id=cst00601&code=1203&gSite=Q&gId=`;
const searchTerm = "측량및지형공간정보";
const minYear = 2015;
const maxYear = 2026;
const { parse: parseHwp } = hwp;

const topicRules = [
  {
    id: "gnss",
    label: "GNSS·측지",
    module: "gnss",
    keywords: [
      "GNSS",
      "GPS",
      "PPP",
      "RTK",
      "VRS",
      "FKP",
      "측지",
      "지오이드",
      "타원체",
      "정표고",
      "타원체고",
      "기준점",
      "좌표",
      "위성측위",
      "오차",
    ],
  },
  {
    id: "remote",
    label: "사진측량·원격탐사",
    module: "remote",
    keywords: [
      "사진측량",
      "항공",
      "LiDAR",
      "라이다",
      "UAV",
      "드론",
      "영상",
      "원격탐사",
      "위성",
      "KOMPSAT",
      "정사영상",
      "SIFT",
      "SfM",
      "분광",
      "NDVI",
      "점군",
    ],
  },
  {
    id: "gis",
    label: "GIS·공간분석",
    module: "gis",
    keywords: [
      "GIS",
      "공간분석",
      "공간정보",
      "DEM",
      "지도",
      "국가기본도",
      "주소",
      "보간",
      "래스터",
      "벡터",
      "데이터",
      "지형",
      "LoD",
    ],
  },
  {
    id: "digital",
    label: "디지털트윈·스마트시티",
    module: "digital",
    keywords: [
      "디지털 트윈",
      "디지털트윈",
      "DTS",
      "BIM",
      "MMS",
      "정밀도로지도",
      "스마트시티",
      "자율주행",
      "가상현실",
      "증강현실",
      "3차원",
      "실감",
    ],
  },
  {
    id: "policy",
    label: "법·정책·지적",
    module: "policy",
    keywords: [
      "공간정보법",
      "지적",
      "법",
      "정책",
      "국가공간정보",
      "기본계획",
      "표준",
      "제도",
      "품질",
      "공공측량",
      "일반측량",
      "등록",
    ],
  },
  {
    id: "field",
    label: "현장측량·인프라",
    module: "field",
    keywords: [
      "하천",
      "철도",
      "터널",
      "시공",
      "건설",
      "수심",
      "해양",
      "GPR",
      "땅꺼짐",
      "지하시설물",
      "유지관리",
      "정밀도",
      "검측",
    ],
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

function scoreTopic(text, topic) {
  const upperText = text.toUpperCase();
  return topic.keywords.reduce((score, keyword) => {
    const normalizedKeyword = keyword.toUpperCase();
    return upperText.includes(normalizedKeyword) ? score + 1 : score;
  }, 0);
}

function detectTopic(text) {
  const ranked = topicRules
    .map((topic) => ({ ...topic, score: scoreTopic(text, topic) }))
    .sort((a, b) => b.score - a.score);

  const best = ranked[0];
  if (!best || best.score === 0) {
    return {
      id: "field",
      label: "현장측량·인프라",
      module: "field",
      keywords: [],
    };
  }

  return {
    id: best.id,
    label: best.label,
    module: best.module,
    keywords: best.keywords.filter((keyword) =>
      text.toUpperCase().includes(keyword.toUpperCase()),
    ),
  };
}

function parsePeriod(block, periodNumber) {
  let markerIndex = block.indexOf("※");
  if (markerIndex === -1) {
    markerIndex = block.search(/다음\s*문제\s*중/);
  }
  if (markerIndex === -1) {
    return null;
  }

  let body = block.slice(markerIndex);
  body = body
    .replace(/\n?\s*\d+\s*[-–—]\s*\d+\s*(?:※[^\n]*)?/g, "\n")
    .trim();

  const instructionMatch = body.match(
    /^(?:※\s*)?(?:(?:총\s*\d+\s*문제\s*중)|(?:다음\s*문제\s*중))[^\n]+/,
  );
  if (!instructionMatch) {
    return null;
  }

  const instruction = compactText(instructionMatch[0]);
  const total = instruction.match(/총\s*(\d+)문제/);
  const choose = instruction.match(/중\s*(\d+)문제/);
  const points = instruction.match(/각\s*(\d+)점/);
  const expectedQuestionCount = total
    ? Number(total[1])
    : periodNumber === 1
      ? 13
      : 6;
  const questionText = body
    .slice(instructionMatch[0].length)
    .replace(/^\s*(\d{1,2})\s+/, "$1. ")
    .replace(/(^|\n)\s*[lI][\.\)]?\s+/g, (_match, prefix) => `${prefix}1. `)
    .replace(/(시오[\.，,]?|하시오[\.，,]?|설명하시오[\.，,]?)\s+(\d{1,2})[\.\)]?\s+/g, "$1\n$2. ")
    .trim();
  const strictPattern =
    /(?:^|\n)\s*(\d{1,2})\.\s*([\s\S]*?)(?=(?:\n\s*\d{1,2}\.\s*)|$)/g;
  const loosePattern =
    /(?:^|\n)\s*(\d{1,2})[\.\)]?\s+([\s\S]*?)(?=(?:\n\s*\d{1,2}[\.\)]?\s+)|$)/g;
  const strictMatches = [...questionText.matchAll(strictPattern)];
  const looseMatches = [...questionText.matchAll(loosePattern)];
  const questionMatches =
    strictMatches.length < expectedQuestionCount && looseMatches.length >= expectedQuestionCount
      ? looseMatches
      : strictMatches;

  const rawQuestions = questionMatches
    .map((match) => {
      const text = compactText(match[2].replace(/\n?\s*\d+\s*-\s*\d+\s*$/g, ""));
      if (!text) {
        return null;
      }

      const topic = detectTopic(text);
      return {
        no: Number(match[1]),
        text,
        topic: topic.id,
        topicLabel: topic.label,
        module: topic.module,
        matchedKeywords: topic.keywords,
      };
    })
    .filter(Boolean);
  const questions = [];

  rawQuestions.forEach((question) => {
    const previous = questions.at(-1);
    if (previous && question.no <= previous.no) {
      previous.text = compactText(`${previous.text} ${question.no}. ${question.text}`);
      const topic = detectTopic(previous.text);
      previous.topic = topic.id;
      previous.topicLabel = topic.label;
      previous.module = topic.module;
      previous.matchedKeywords = topic.keywords;
      return;
    }

    questions.push(question);
  });

  return {
    period: periodNumber,
    instruction,
    totalQuestions: total ? Number(total[1]) : questions.length,
    chooseQuestions: choose ? Number(choose[1]) : null,
    points: points ? Number(points[1]) : null,
    questions,
  };
}

function parsePeriods(text) {
  const normalized = normalizeText(text);
  const blocks = normalized.includes("-- 1 of")
    ? normalized.split(/\n--\s*\d+\s+of\s+\d+\s*--\n?/g)
    : normalized.split(/(?=기술사\s+제\s*\d+\s*회\s+제\s*\d+\s*교시)/g);

  return blocks
    .map((block, index) => parsePeriod(block, index + 1))
    .filter(Boolean);
}

function countTopics(periods) {
  return periods
    .flatMap((period) => period.questions)
    .reduce((acc, question) => {
      acc[question.topic] = (acc[question.topic] ?? 0) + 1;
      return acc;
    }, {});
}

function titleToYear(title, postedAt) {
  const titleYear = title.match(/\((\d{4})년\)/);
  if (titleYear) {
    return Number(titleYear[1]);
  }
  return Number(postedAt.slice(0, 4));
}

function parseSearchRows(html) {
  return [...html.matchAll(/<tr[\s\S]*?<\/tr>/g)]
    .map((match) => match[0])
    .filter((row) => row.includes("측량"))
    .map((row) => {
      const seq = row.match(/goNext\('(\d+)'/);
      const title = row.match(/title="([^"]+)"/);
      const postedAt = row.match(/<span class="date">([^<]+)<\/span>/);
      const round = title?.[1]?.match(/제(\d+)회/);

      if (!seq || !title || !postedAt || !round) {
        return null;
      }

      const year = titleToYear(title[1], postedAt[1]);
      return {
        artlSeq: seq[1],
        title: title[1],
        postedAt: postedAt[1],
        round: Number(round[1]),
        year,
      };
    })
    .filter(Boolean);
}

async function fetchText(url, options = {}) {
  const response = await fetch(url, {
    ...options,
    headers: {
      "User-Agent":
        "Mozilla/5.0 (compatible; SurveyorMasterCourse/1.0; +https://www.q-net.or.kr/)",
      ...(options.headers ?? {}),
    },
  });

  if (!response.ok) {
    throw new Error(`Request failed ${response.status}: ${url}`);
  }

  return response.text();
}

async function fetchBuffer(url) {
  const response = await fetch(url, {
    headers: {
      "User-Agent":
        "Mozilla/5.0 (compatible; SurveyorMasterCourse/1.0; +https://www.q-net.or.kr/)",
    },
  });

  if (!response.ok) {
    throw new Error(`Download failed ${response.status}: ${url}`);
  }

  return Buffer.from(await response.arrayBuffer());
}

async function getSearchResults() {
  const rows = [];

  for (let page = 1; page <= 8; page += 1) {
    const url = `${baseUrl}/cst006.do?id=cst00601s01&gSite=Q&gId=&page=${page}&schText=${encodeURIComponent(
      searchTerm,
    )}&schType=T&brdId=Q006&code=1203`;
    const html = await fetchText(url);
    const pageRows = parseSearchRows(html);

    if (pageRows.length === 0) {
      break;
    }

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
    headers: {
      "Content-Type": "application/x-www-form-urlencoded;charset=UTF-8",
    },
  });

  const files = [
    ...html.matchAll(
      /fileDown\('([^']+)',\s*'([\s\S]*?)',\s*'([^']+)',\s*'([^']+)'\)/g,
    ),
  ].map((match) => ({
    filePath: match[1],
    fileName: compactText(match[2]),
    fileSeq: match[3],
    artlSeq: match[4],
  }));

  if (files.length === 0) {
    throw new Error(`No attachment found for ${row.title}`);
  }

  const file =
    files.find((item) => item.fileName.includes(searchTerm)) ??
    files.find((item) => item.fileName.includes(`제${row.round}회`)) ??
    files[0];

  const { filePath, fileName, fileSeq, artlSeq } = file;
  const downloadUrl = `${baseUrl}/cst006.do?id=cst00602s01&gSite=Q&gId=&fileCode=R001&filePath=${encodeURIComponent(
    filePath,
  )}&fileName=${encodeURIComponent(fileName)}&fileSeq=${encodeURIComponent(
    fileSeq,
  )}&artlSeq=${encodeURIComponent(artlSeq)}&href=0`;

  return {
    filePath,
    fileName,
    fileSeq,
    downloadUrl,
  };
}

async function extractPdfText(pdfPath) {
  const parser = new PDFParse({ data: readFileSync(pdfPath) });
  const result = await parser.getText();
  await parser.destroy();
  return normalizeText(result.text);
}

function textFromHwpNode(node) {
  if (!node) {
    return "";
  }

  if (typeof node === "string") {
    return node;
  }

  if (Array.isArray(node)) {
    return node.map(textFromHwpNode).filter(Boolean).join("");
  }

  if (typeof node === "object") {
    let text = "";
    if (typeof node.value === "string") {
      text += node.value;
    }
    if (Array.isArray(node.content)) {
      text += node.content.map(textFromHwpNode).join("");
    }
    if (Array.isArray(node.items)) {
      text += node.items.map(textFromHwpNode).join("\n");
    }
    if (Array.isArray(node.controls)) {
      text += node.controls.map(textFromHwpNode).join("\n");
    }
    return text;
  }

  return "";
}

function extractHwpText(documentPath) {
  const document = parseHwp(readFileSync(documentPath), { type: "buffer" });
  return normalizeText(
    document.sections
      .flatMap((section) => section.content.map((paragraph) => textFromHwpNode(paragraph)))
      .join("\n"),
  );
}

async function extractDocumentText(documentPath, fileName) {
  const ext = path.extname(fileName).toLowerCase();
  if (ext === ".hwp") {
    return extractHwpText(documentPath);
  }

  return extractPdfText(documentPath);
}

async function buildExam(row) {
  const attachment = await getAttachment(row);
  const extension = path.extname(attachment.fileName).toLowerCase() || ".pdf";
  const sourceFile = `exam-${row.round}${extension}`;
  const sourcePath = path.join(pdfDir, sourceFile);
  const documentBuffer = await fetchBuffer(attachment.downloadUrl);
  await writeFile(sourcePath, documentBuffer);

  const fullText = await extractDocumentText(sourcePath, attachment.fileName);
  const periods = parsePeriods(fullText);
  const topicCounts = countTopics(periods);
  const totalQuestions = periods.reduce(
    (sum, period) => sum + period.questions.length,
    0,
  );

  return {
    id: `exam-${row.round}`,
    round: row.round,
    year: row.year,
    title: row.title,
    postedAt: row.postedAt,
    qnetSourceUrl: sourceUrl,
    sourceName: attachment.fileName,
    sourceType: extension.replace(".", "").toUpperCase(),
    sourceFile: `sources/qnet-pdf/${sourceFile}`,
    pdfName: attachment.fileName,
    pdfFile: `sources/qnet-pdf/${sourceFile}`,
    qnetDownloadUrl: attachment.downloadUrl,
    totalQuestions,
    topicCounts,
    periods,
    fullText,
  };
}

function buildAnalysis(exams) {
  const yearStats = exams
    .slice()
    .sort((a, b) => a.year - b.year || a.round - b.round)
    .map((exam) => ({
      year: exam.year,
      round: exam.round,
      totalQuestions: exam.totalQuestions,
      topics: exam.topicCounts,
    }));

  const topicTotals = exams.reduce((acc, exam) => {
    Object.entries(exam.topicCounts).forEach(([topic, count]) => {
      acc[topic] = (acc[topic] ?? 0) + count;
    });
    return acc;
  }, {});

  const hotKeywords = exams
    .flatMap((exam) => exam.periods)
    .flatMap((period) => period.questions)
    .flatMap((question) => question.matchedKeywords)
    .reduce((acc, keyword) => {
      acc[keyword] = (acc[keyword] ?? 0) + 1;
      return acc;
    }, {});

  return {
    yearStats,
    topicTotals,
    topicLabels: Object.fromEntries(topicRules.map((topic) => [topic.id, topic.label])),
    hotKeywords: Object.entries(hotKeywords)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 18)
      .map(([keyword, count]) => ({ keyword, count })),
  };
}

async function main() {
  await mkdir(pdfDir, { recursive: true });
  await mkdir(dataDir, { recursive: true });

  const rows = await getSearchResults();
  const exams = [];

  for (const row of rows) {
    console.log(`Syncing ${row.title}`);
    exams.push(await buildExam(row));
  }

  const data = {
    source: {
      title: "Q-net 기출문제(기술사) 자료실",
      url: sourceUrl,
      searchTerm,
      fetchedAt: new Date().toISOString(),
      yearRange: `${minYear}-${maxYear}`,
      latestRound: Math.max(...exams.map((exam) => exam.round)),
      latestYear: Math.max(...exams.map((exam) => exam.year)),
      note:
        "Q-net 게시글의 PDF 첨부파일을 텍스트로 추출해 학습용으로 구조화했습니다. 채점기준 및 기준답안은 Q-net 공지에 따라 제공되지 않습니다.",
    },
    topics: topicRules.map(({ id, label, module }) => ({ id, label, module })),
    analysis: buildAnalysis(exams),
    exams,
  };

  const js = `window.QNET_EXAMS = ${JSON.stringify(data, null, 2)};\n`;
  await writeFile(path.join(dataDir, "exams-data.js"), js, "utf8");
  await writeFile(
    path.join(rootDir, "sources", "qnet-exams.json"),
    `${JSON.stringify(data, null, 2)}\n`,
    "utf8",
  );

  console.log(`Synced ${exams.length} exams to assets/js/exams-data.js`);
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
