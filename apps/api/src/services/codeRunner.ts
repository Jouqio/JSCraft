import vm from 'node:vm';

export interface TestCase {
  description: string;
  expectedOutput: string;
  input?: string;
  hidden?: boolean;
  isHidden?: boolean;
}

export interface TestCaseResult {
  description: string;
  passed: boolean;
  expectedOutput?: string;
  actualOutput?: string;
  error?: string;
  hidden?: boolean;
}

export interface RunResult {
  passed: boolean;
  totalTests: number;
  passedTests: number;
  results: TestCaseResult[];
  output: string[];
  error?: string;
}

const EXECUTION_TIMEOUT_MS = 2000;
const MAX_LOG_ENTRIES = 50;
const MAX_LOG_LENGTH = 10000;

/**
 * Executes user code safely inside a sandboxed VM against an array of test cases.
 */
export function runExerciseCode(userCode: string, testCases: TestCase[]): RunResult {
  const allOutputs: string[] = [];
  const results: TestCaseResult[] = [];
  let allPassed = true;

  // Static AST / syntax check or blacklist check before execution
  const forbiddenPatterns = [
    /\bprocess\s*\.\s*(?:exit|env|kill|binding|dlopen|mainModule)/i,
    /\bchild_process\b/i,
    /\brequire\s*\(/i,
    /\bimport\s*\(/i,
  ];

  for (const pattern of forbiddenPatterns) {
    if (pattern.test(userCode)) {
      return {
        passed: false,
        totalTests: testCases.length,
        passedTests: 0,
        results: testCases.map((tc) => ({
          description: tc.description,
          passed: false,
          error: 'Kode mengandung operasi atau akses terlarang',
          hidden: Boolean(tc.hidden || tc.isHidden),
        })),
        output: [],
        error: 'Kode mengandung instruksi yang tidak diizinkan oleh sistem',
      };
    }
  }

  for (const tc of testCases) {
    const isHidden = Boolean(tc.hidden || tc.isHidden);
    const capturedLogs: string[] = [];
    let currentLength = 0;

    const appendLog = (...args: any[]) => {
      if (capturedLogs.length >= MAX_LOG_ENTRIES) return;
      const formatted = args
        .map((a) => (typeof a === 'object' && a !== null ? JSON.stringify(a) : String(a)))
        .join(' ');
      if (currentLength + formatted.length <= MAX_LOG_LENGTH) {
        capturedLogs.push(formatted);
        currentLength += formatted.length;
      }
    };

    // Safe isolated sandbox object
    const sandbox: Record<string, any> = {
      console: {
        log: appendLog,
        info: appendLog,
        warn: appendLog,
        error: appendLog,
      },
      Math,
      Date,
      JSON,
      parseInt,
      parseFloat,
      isNaN,
      isFinite,
      Boolean,
      Number,
      String,
      Array,
      Object,
      RegExp,
      Map,
      Set,
      Promise: undefined, // Disallow async unhandled microtasks
      process: undefined,
      require: undefined,
      global: undefined,
      globalThis: undefined,
    };

    // Disallow eval and Function strings inside VM
    const context = vm.createContext(sandbox, {
      codeGeneration: { strings: false, wasm: false },
    });

    let codeToRun = userCode;
    if (tc.input && tc.input.trim().length > 0) {
      codeToRun += `\n;${tc.input};`;
    }

    let tcPassed = false;
    let tcError: string | undefined;
    let actualOutput = '';

    try {
      const script = new vm.Script(codeToRun, {
        filename: 'exercise.js',
      });

      const evaluatedResult = script.runInContext(context, {
        timeout: EXECUTION_TIMEOUT_MS,
        displayErrors: true,
      });

      actualOutput = capturedLogs.join('\n').trim();
      if (!isHidden) {
        allOutputs.push(...capturedLogs);
      }

      const expected = String(tc.expectedOutput).trim();

      // Check stdout match
      if (actualOutput === expected) {
        tcPassed = true;
      }
      // Check variable `result` if defined in sandbox
      else if (sandbox.result !== undefined && String(sandbox.result).trim() === expected) {
        tcPassed = true;
        if (!actualOutput) actualOutput = String(sandbox.result).trim();
      }
      // Check evaluated result of the script/expression
      else if (evaluatedResult !== undefined && String(evaluatedResult).trim() === expected) {
        tcPassed = true;
        if (!actualOutput) actualOutput = String(evaluatedResult).trim();
      }
    } catch (err: any) {
      tcPassed = false;
      if (err.code === 'ERR_SCRIPT_EXECUTION_TIMEOUT') {
        tcError = `Batas waktu eksekusi terlampaui (${EXECUTION_TIMEOUT_MS}ms). Periksa kemungkinan perulangan tak terhingga (infinite loop).`;
      } else {
        tcError = err.message || 'Terjadi kesalahan saat mengeksekusi kode';
      }
    }

    if (!tcPassed) {
      allPassed = false;
    }

    if (isHidden) {
      // Hidden test cases do NOT leak expected output, actual output, or internal error to client
      results.push({
        description: tc.description,
        passed: tcPassed,
        hidden: true,
        ...(tcError ? { error: tcError } : {}),
      });
    } else {
      results.push({
        description: tc.description,
        passed: tcPassed,
        expectedOutput: String(tc.expectedOutput),
        actualOutput,
        ...(tcError ? { error: tcError } : {}),
        hidden: false,
      });
    }
  }

  const passedTests = results.filter((r) => r.passed).length;

  return {
    passed: allPassed && testCases.length > 0,
    totalTests: testCases.length,
    passedTests,
    results,
    output: allOutputs,
  };
}
