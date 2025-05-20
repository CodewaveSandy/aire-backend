export const extractName = (text: string): string | null => {
  const FAMILY_LABELS = [
    "father",
    "mother",
    "guardian",
    "spouse",
    "husband",
    "wife",
  ];
  const HEADER_LABELS = [
    "work experience",
    "education",
    "skills",
    "projects",
    "summary",
    "objective",
    "overview",
    "declaration",
  ];
  const familyRegex = new RegExp(`\\b(${FAMILY_LABELS.join("|")})\\b`, "i");
  const headingRegex = new RegExp(`^(${HEADER_LABELS.join("|")})$`, "i");

  const normalized = text.replace(/\s+/g, " ").trim();

  // 1. Label-based match
  const labelMatch = normalized.match(
    /\b(name|full name|first name)\s*[:\-–]\s*([A-Z][^\n\r\t\f\v]+?)(?=\b(father|mother|guardian|spouse|husband|wife)\b|$)/i
  );
  if (labelMatch) {
    return labelMatch[2].trim();
  }

  // 2. Line-by-line analysis
  const lines = text
    .split(/\r?\n/)
    .map((line) => line.trim())
    .filter(Boolean);

  for (const line of lines.slice(0, 10)) {
    const clean = line.replace(/[^A-Za-z\s().-]/g, "").trim();

    if (
      clean.length > 0 &&
      !familyRegex.test(clean) &&
      !headingRegex.test(clean.toLowerCase()) &&
      /^[A-Z][a-zA-Z().\s-]{2,}$/.test(clean) &&
      clean.split(" ").length <= 5 // human name limit
    ) {
      return clean;
    }
  }

  // 3. Fallback: word sequence before heading keyword
  const headingIndex = lines.findIndex((line) =>
    headingRegex.test(line.toLowerCase())
  );
  if (headingIndex > 0) {
    const candidate = lines[headingIndex - 1];
    const clean = candidate.replace(/[^A-Za-z\s().-]/g, "").trim();

    if (
      clean.length > 0 &&
      !familyRegex.test(clean) &&
      clean.split(" ").length <= 5 &&
      /^[A-Z][a-zA-Z().\s-]+$/.test(clean)
    ) {
      return clean;
    }
  }

  return null;
};

export const extractEmail = (text: string): string | null => {
  const match = text.match(
    /\b[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Z|a-z]{2,7}\b/
  );
  return match ? match[0] : null;
};

export const extractPhone = (text: string): string | null => {
  const match = text.match(/\(?\d{3}\)?[-.\s]?\d{3}[-.\s]?\d{4}/);
  return match ? match[0] : null;
};

export const extractRelevantSections = (text: string): string => {
  const sectionHeaderKeywords = [
    "skills",
    "technical skills",
    "tools",
    "technologies",
    "languages known",
    "experience",
    "work experience",
    "professional experience",
    "employment history",
    "projects",
    "roles & responsibility",
    "technology used",
  ];

  const sectionStopKeywords = [
    "education",
    "certification",
    "declaration",
    "objective",
    "summary",
    "contact",
    "personal info",
  ];

  const normalize = (s: string) => s.trim().toLowerCase();

  const lines = text.split(/\r?\n/).map((l) => l.trimEnd());

  const collected: string[] = [];
  let isCollecting = false;

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    const normalized = normalize(line);

    // Start if a line matches a header
    if (
      sectionHeaderKeywords.some(
        (keyword) => normalized === keyword || normalized.includes(keyword)
      )
    ) {
      isCollecting = true;
      collected.push(`\n### ${line.toUpperCase()} ###`);
      continue;
    }

    // Stop if a known non-relevant section starts
    if (
      isCollecting &&
      sectionStopKeywords.some(
        (keyword) => normalized === keyword || normalized.includes(keyword)
      )
    ) {
      isCollecting = false;
      continue;
    }

    // If collecting and not hitting a new unrelated section, collect the line
    if (isCollecting) {
      collected.push(line);
    }
  }

  return collected.join("\n").trim();
};

