import { execSync } from "node:child_process";
import { mkdirSync, writeFileSync, rmSync } from "node:fs";
import { join } from "node:path";

const rates = [50, 100, 200, 300, 500];
const type = process.argv[2] ?? "redirect";

mkdirSync("benchmarks/tmp", { recursive: true });

const results = [];

for (const rate of rates) {
  const yml =
    type === "create"
      ? `config:
  target: "http://localhost:8080"
  phases:
    - duration: 15
      arrivalRate: ${rate}
  processor: "../load-test.cjs"
  plugins:
    expect: {}

scenarios:
  - flow:
      - function: "generateShortUrlRequest"
      - post:
          url: "/api/v1/create-short-url"
          json:
            longUrl: "{{ longUrl }}"
          expect:
            - statusCode: 200
`
      : `config:
  target: "http://localhost:8080"
  phases:
    - duration: 15
      arrivalRate: ${rate}
  plugins:
    expect: {}

scenarios:
  - flow:
      - get:
          url: "/q17"
          followRedirect: false
          expect:
            - statusCode: 302
`;

  const ymlPath = join("benchmarks/tmp", `${type}-${rate}.yml`);
  const jsonPath = join("benchmarks/tmp", `${type}-${rate}.json`);
  writeFileSync(ymlPath, yml);

  try {
    execSync(`pnpm exec artillery run "${ymlPath}" --output "${jsonPath}"`, {
      stdio: "pipe",
      encoding: "utf8",
    });
    const report = JSON.parse(
      execSync(`pnpm exec artillery report --output json "${jsonPath}"`, {
        encoding: "utf8",
      })
    );

    const agg = report.aggregate;
    results.push({
      type,
      rate,
      requests: agg.counters["http.requests"] ?? 0,
      failed: agg.counters["vusers.failed"] ?? 0,
      expectFailed: agg.counters["plugins.expect.failed"] ?? 0,
      p95: agg.summaries["http.response_time"]?.p95 ?? null,
      mean: agg.summaries["http.response_time"]?.mean ?? null,
    });
  } catch (error) {
    results.push({ type, rate, error: "benchmark failed" });
  }
}

console.table(results);
rmSync("benchmarks/tmp", { recursive: true, force: true });
