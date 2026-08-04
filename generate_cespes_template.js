import fs from "fs";
import { parseCespesFile } from "./src/utils/ExcelParsers/parsers/cespesParser.js";

// Mock a File object for the parser
class MockFile {
  constructor(buffer, name) {
    this.buffer = buffer;
    this.name = name;
  }
  async arrayBuffer() {
    return this.buffer;
  }
}

async function run() {
  const filePath = "src/assets/Files/CESPES Template.xlsx";
  const buffer = fs.readFileSync(filePath);
  const mockFile = new MockFile(buffer, "CESPES Template.xlsx");
  
  const result = await parseCespesFile(mockFile);
  
  // Transform to DB snake_case format
  const operations = result.operations.records.map(r => ({
    program: r.program,
    indicator_type: r.indicatorType,
    indicator: r.indicator,
    sem1_target: "—",
    sem1_accomplishment: "—",
    sem2_target: "—",
    sem2_accomplishment: "—",
  }));

  const supportOperations = result.supportOperations.records.map(r => ({
    service_activity: r.serviceActivity,
    indicator: r.indicator,
    sem1_target: "—",
    sem1_accomplishment: "—",
    sem2_target: "—",
    sem2_accomplishment: "—",
    person_involved: r.personInvolved,
  }));

  const generalAdmin = result.generalAdmin.records.map(r => ({
    service_activity: r.serviceActivity,
    indicator: r.indicator,
    sem1_target: "—",
    sem1_accomplishment: "—",
    sem2_target: "—",
    sem2_accomplishment: "—",
    person_involved: r.personInvolved,
  }));

  const individualPerformance = result.individualPerformance.records.map(r => ({
    program_output: r.programOutput,
    process_output: r.processOutput,
    performance_indicator: r.performanceIndicator,
    target: "—",
    accomplishment: "—",
    rating: "—",
  }));

  const innovation = result.innovation.records.map(r => ({
    output_outcomes: r.outputOutcomes,
    quality: "—",
    quantity: "—",
    timeliness: "—",
    average: "—",
  }));

  const output = `// Auto-generated CESPES template data
export const DEFAULT_CESPES_DATA = {
  operations: ${JSON.stringify(operations, null, 2)},
  supportOperations: ${JSON.stringify(supportOperations, null, 2)},
  generalAdmin: ${JSON.stringify(generalAdmin, null, 2)},
  individualPerformance: ${JSON.stringify(individualPerformance, null, 2)},
  innovation: ${JSON.stringify(innovation, null, 2)}
};
`;

  if (!fs.existsSync("src/data")) {
    fs.mkdirSync("src/data");
  }
  fs.writeFileSync("src/data/cespesTemplateData.js", output);
  console.log("Template generated successfully at src/data/cespesTemplateData.js");
}

run().catch(console.error);
