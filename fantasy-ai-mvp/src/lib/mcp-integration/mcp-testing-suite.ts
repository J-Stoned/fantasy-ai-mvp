import { EventEmitter } from "events";
import { unifiedMCPManager } from "./unified-mcp-manager";

/**
 * MCP Testing Suite Service
 * Comprehensive testing using Playwright and Puppeteer MCPs
 */

export interface TestSuite {
  id: string;
  name: string;
  description: string;
  type: "unit" | "integration" | "e2e" | "performance" | "visual" | "accessibility" | "security";
  framework: "playwright" | "puppeteer" | "jest" | "cypress";
  environment: "local" | "staging" | "production";
  tests: TestCase[];
  configuration: {
    browsers?: string[];
    viewport?: { width: number; height: number };
    timeout: number;
    retries: number;
    parallel: boolean;
    headless: boolean;
    slowMotion?: number;
    recordVideo?: boolean;
    screenshots?: boolean;
  };
  schedule?: {
    enabled: boolean;
    cron: string;
    timezone: string;
  };
  notifications: {
    onFailure: boolean;
    onSuccess: boolean;
    channels: string[];
  };
}

export interface TestCase {
  id: string;
  name: string;
  description: string;
  category: string;
  priority: "low" | "medium" | "high" | "critical";
  tags: string[];
  steps: TestStep[];
  assertions: TestAssertion[];
  setup?: TestStep[];
  teardown?: TestStep[];
  dataProvider?: any[];
  dependencies: string[];
  timeout: number;
  flaky: boolean;
}

export interface TestStep {
  id: string;
  action: string;
  target?: string;
  value?: any;
  options?: Record<string, any>;
  waitFor?: {
    type: "element" | "network" | "timeout" | "load";
    value: string | number;
  };
  screenshot?: boolean;
}

export interface TestAssertion {
  id: string;
  type: "equals" | "contains" | "exists" | "visible" | "enabled" | "count" | "performance";
  target: string;
  expected: any;
  message?: string;
}

export interface TestExecution {
  id: string;
  suiteId: string;
  trigger: "manual" | "scheduled" | "ci" | "webhook";
  status: "running" | "completed" | "failed" | "cancelled";
  startedAt: Date;
  completedAt?: Date;
  duration?: number;
  environment: string;
  browser?: string;
  results: TestResult[];
  summary: {
    total: number;
    passed: number;
    failed: number;
    skipped: number;
    flaky: number;
  };
  coverage?: {
    statements: number;
    branches: number;
    functions: number;
    lines: number;
  };
  performance?: {
    pageLoadTime: number;
    firstContentfulPaint: number;
    largestContentfulPaint: number;
    cumulativeLayoutShift: number;
  };
  artifacts: {
    screenshots: string[];
    videos: string[];
    traces: string[];
    reports: string[];
  };
}

export interface TestResult {
  testId: string;
  testName: string;
  status: "passed" | "failed" | "skipped" | "flaky";
  duration: number;
  error?: string;
  steps: StepResult[];
  assertions: AssertionResult[];
  screenshot?: string;
  retry: number;
}

export interface StepResult {
  stepId: string;
  action: string;
  status: "passed" | "failed";
  duration: number;
  error?: string;
  screenshot?: string;
}

export interface AssertionResult {
  assertionId: string;
  type: string;
  status: "passed" | "failed";
  expected: any;
  actual: any;
  message?: string;
}

export class MCPTestingSuiteService extends EventEmitter {
  private testSuites: Map<string, TestSuite> = new Map();
  private activeExecutions: Map<string, TestExecution> = new Map();
  private executionHistory: Map<string, TestExecution> = new Map();
  private scheduledTests: Map<string, NodeJS.Timeout> = new Map();

  constructor() {
    super();
    this.initializeDefaultTestSuites();
  }

  /**
   * Initialize default test suites for Fantasy.AI
   */
  private initializeDefaultTestSuites() {
    // E2E Test Suite
    this.createTestSuite({
      id: "fantasy_ai_e2e",
      name: "Fantasy.AI End-to-End Tests",
      description: "Comprehensive E2E testing for Fantasy.AI application",
      type: "e2e",
      framework: "playwright",
      environment: "staging",
      tests: [
        {
          id: "user_registration",
          name: "User Registration Flow",
          description: "Test complete user registration process",
          category: "authentication",
          priority: "critical",
          tags: ["auth", "registration", "critical"],
          steps: [
            {
              id: "navigate_to_signup",
              action: "navigate",
              target: "/signup",
              waitFor: { type: "load", value: 5000 }
            },
            {
              id: "fill_email",
              action: "fill",
              target: "[data-testid=email-input]",
              value: "test@fantasy-ai.com"
            },
            {
              id: "fill_password",
              action: "fill",
              target: "[data-testid=password-input]",
              value: "SecurePassword123!"
            },
            {
              id: "fill_confirm_password",
              action: "fill",
              target: "[data-testid=confirm-password-input]",
              value: "SecurePassword123!"
            },
            {
              id: "click_signup",
              action: "click",
              target: "[data-testid=signup-button]",
              waitFor: { type: "network", value: "/api/auth/register" }
            }
          ],
          assertions: [
            {
              id: "redirect_to_dashboard",
              type: "equals",
              target: "url",
              expected: "/dashboard",
              message: "Should redirect to dashboard after successful registration"
            },
            {
              id: "welcome_message_visible",
              type: "visible",
              target: "[data-testid=welcome-message]",
              expected: true,
              message: "Welcome message should be visible"
            }
          ],
          dependencies: [],
          timeout: 30000,
          flaky: false
        },
        {
          id: "dashboard_navigation",
          name: "Dashboard Navigation",
          description: "Test navigation through dashboard sections",
          category: "navigation",
          priority: "high",
          tags: ["dashboard", "navigation"],
          steps: [
            {
              id: "navigate_to_dashboard",
              action: "navigate",
              target: "/dashboard",
              waitFor: { type: "element", value: "[data-testid=dashboard-nav]" }
            },
            {
              id: "click_analytics_tab",
              action: "click",
              target: "[data-testid=analytics-tab]",
              waitFor: { type: "element", value: "[data-testid=analytics-content]" }
            },
            {
              id: "click_lineup_tab",
              action: "click",
              target: "[data-testid=lineup-tab]",
              waitFor: { type: "element", value: "[data-testid=lineup-builder]" }
            },
            {
              id: "click_players_tab",
              action: "click",
              target: "[data-testid=players-tab]",
              waitFor: { type: "element", value: "[data-testid=players-list]" }
            }
          ],
          assertions: [
            {
              id: "all_tabs_functional",
              type: "count",
              target: "[data-testid*='-content']:visible",
              expected: 1,
              message: "Only one tab content should be visible at a time"
            }
          ],
          dependencies: ["user_registration"],
          timeout: 20000,
          flaky: false
        },
        {
          id: "player_search_and_analysis",
          name: "Player Search and Analysis",
          description: "Test player search functionality and detailed analysis",
          category: "features",
          priority: "high",
          tags: ["search", "analysis", "players"],
          steps: [
            {
              id: "navigate_to_players",
              action: "navigate",
              target: "/dashboard/players",
              waitFor: { type: "element", value: "[data-testid=player-search]" }
            },
            {
              id: "search_player",
              action: "fill",
              target: "[data-testid=player-search]",
              value: "Christian McCaffrey"
            },
            {
              id: "click_search_result",
              action: "click",
              target: "[data-testid=player-card]:first-child",
              waitFor: { type: "element", value: "[data-testid=player-details]" }
            },
            {
              id: "view_analytics",
              action: "click",
              target: "[data-testid=view-analytics-button]",
              waitFor: { type: "element", value: "[data-testid=player-analytics-chart]" }
            }
          ],
          assertions: [
            {
              id: "player_details_loaded",
              type: "visible",
              target: "[data-testid=player-details]",
              expected: true,
              message: "Player details should be visible"
            },
            {
              id: "analytics_chart_present",
              type: "visible",
              target: "[data-testid=player-analytics-chart]",
              expected: true,
              message: "Player analytics chart should be displayed"
            }
          ],
          dependencies: [],
          timeout: 25000,
          flaky: false
        }
      ],
      configuration: {
        browsers: ["chromium", "firefox", "webkit"],
        viewport: { width: 1920, height: 1080 },
        timeout: 30000,
        retries: 2,
        parallel: true,
        headless: true,
        recordVideo: true,
        screenshots: true
      },
      schedule: {
        enabled: true,
        cron: "0 2 * * *", // Daily at 2 AM
        timezone: "UTC"
      },
      notifications: {
        onFailure: true,
        onSuccess: false,
        channels: ["slack", "email"]
      }
    });

    // Performance Test Suite
    this.createTestSuite({
      id: "fantasy_ai_performance",
      name: "Fantasy.AI Performance Tests",
      description: "Performance and load testing for critical user journeys",
      type: "performance",
      framework: "playwright",
      environment: "production",
      tests: [
        {
          id: "homepage_performance",
          name: "Homepage Performance",
          description: "Test homepage loading performance",
          category: "performance",
          priority: "high",
          tags: ["performance", "homepage", "core"],
          steps: [
            {
              id: "navigate_homepage",
              action: "navigate",
              target: "/",
              waitFor: { type: "load", value: 10000 }
            },
            {
              id: "measure_performance",
              action: "measure_performance",
              target: "page"
            }
          ],
          assertions: [
            {
              id: "load_time_under_3s",
              type: "performance",
              target: "loadEventEnd",
              expected: 3000,
              message: "Page should load in under 3 seconds"
            },
            {
              id: "fcp_under_1s",
              type: "performance",
              target: "firstContentfulPaint",
              expected: 1000,
              message: "First Contentful Paint should be under 1 second"
            }
          ],
          dependencies: [],
          timeout: 15000,
          flaky: false
        },
        {
          id: "dashboard_performance",
          name: "Dashboard Performance",
          description: "Test dashboard loading and interaction performance",
          category: "performance",
          priority: "high",
          tags: ["performance", "dashboard", "authenticated"],
          steps: [
            {
              id: "login_user",
              action: "login",
              target: "test@fantasy-ai.com",
              value: "password123"
            },
            {
              id: "navigate_dashboard",
              action: "navigate",
              target: "/dashboard",
              waitFor: { type: "load", value: 10000 }
            },
            {
              id: "measure_interactive_performance",
              action: "measure_interactive_performance",
              target: "dashboard"
            }
          ],
          assertions: [
            {
              id: "dashboard_interactive_under_2s",
              type: "performance",
              target: "timeToInteractive",
              expected: 2000,
              message: "Dashboard should be interactive within 2 seconds"
            }
          ],
          dependencies: [],
          timeout: 20000,
          flaky: false
        }
      ],
      configuration: {
        browsers: ["chromium"],
        viewport: { width: 1920, height: 1080 },
        timeout: 15000,
        retries: 1,
        parallel: false,
        headless: true,
        recordVideo: false,
        screenshots: false
      },
      notifications: {
        onFailure: true,
        onSuccess: false,
        channels: ["slack"]
      }
    });

    // Visual Regression Test Suite
    this.createTestSuite({
      id: "fantasy_ai_visual",
      name: "Fantasy.AI Visual Regression Tests",
      description: "Visual regression testing for UI consistency",
      type: "visual",
      framework: "playwright",
      environment: "staging",
      tests: [
        {
          id: "homepage_visual",
          name: "Homepage Visual Test",
          description: "Visual regression test for homepage",
          category: "visual",
          priority: "medium",
          tags: ["visual", "homepage"],
          steps: [
            {
              id: "navigate_homepage",
              action: "navigate",
              target: "/",
              waitFor: { type: "load", value: 5000 }
            },
            {
              id: "take_screenshot",
              action: "screenshot",
              target: "page",
              options: { fullPage: true }
            }
          ],
          assertions: [
            {
              id: "visual_comparison",
              type: "exists",
              target: "homepage",
              expected: "baseline",
              message: "Homepage should match visual baseline"
            }
          ],
          dependencies: [],
          timeout: 10000,
          flaky: false
        }
      ],
      configuration: {
        browsers: ["chromium"],
        viewport: { width: 1920, height: 1080 },
        timeout: 10000,
        retries: 1,
        parallel: true,
        headless: true,
        screenshots: true
      },
      notifications: {
        onFailure: true,
        onSuccess: false,
        channels: ["slack"]
      }
    });

    console.log("✅ Initialized default test suites");
  }

  /**
   * Create a new test suite
   */
  createTestSuite(suite: TestSuite): void {
    this.testSuites.set(suite.id, suite);
    
    if (suite.schedule?.enabled) {
      this.scheduleTestSuite(suite);
    }
    
    this.emit("testSuiteCreated", suite);
    console.log(`📋 Created test suite: ${suite.name}`);
  }

  /**
   * Execute a test suite
   */
  async executeTestSuite(
    suiteId: string, 
    options?: {
      environment?: string;
      browsers?: string[];
      tests?: string[];
      parallel?: boolean;
    }
  ): Promise<TestExecution> {
    const suite = this.testSuites.get(suiteId);
    if (!suite) {
      throw new Error(`Test suite not found: ${suiteId}`);
    }

    const execution: TestExecution = {
      id: `exec_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      suiteId,
      trigger: "manual",
      status: "running",
      startedAt: new Date(),
      environment: options?.environment || suite.environment,
      results: [],
      summary: {
        total: 0,
        passed: 0,
        failed: 0,
        skipped: 0,
        flaky: 0
      },
      artifacts: {
        screenshots: [],
        videos: [],
        traces: [],
        reports: []
      }
    };

    this.activeExecutions.set(execution.id, execution);
    
    console.log(`🏃 Executing test suite: ${suite.name}`);
    this.emit("testExecutionStarted", execution);

    try {
      const testsToRun = options?.tests ? 
        suite.tests.filter(t => options.tests!.includes(t.id)) : 
        suite.tests;
      
      const browsers = options?.browsers || suite.configuration.browsers || ["chromium"];
      
      for (const browser of browsers) {
        execution.browser = browser;
        await this.executeTestsInBrowser(suite, testsToRun, execution, browser, options);
      }
      
      execution.status = "completed";
      execution.completedAt = new Date();
      execution.duration = execution.completedAt.getTime() - execution.startedAt.getTime();
      
      this.executionHistory.set(execution.id, execution);
      this.activeExecutions.delete(execution.id);
      
      this.emit("testExecutionCompleted", execution);
      
      if (execution.summary.failed > 0 && suite.notifications.onFailure) {
        await this.sendNotification(suite, execution, "failure");
      } else if (execution.summary.failed === 0 && suite.notifications.onSuccess) {
        await this.sendNotification(suite, execution, "success");
      }
      
    } catch (error) {
      execution.status = "failed";
      this.emit("testExecutionFailed", execution);
      
      if (suite.notifications.onFailure) {
        await this.sendNotification(suite, execution, "failure");
      }
    }

    return execution;
  }

  /**
   * Execute tests in a specific browser
   */
  private async executeTestsInBrowser(
    suite: TestSuite,
    tests: TestCase[],
    execution: TestExecution,
    browser: string,
    options?: any
  ): Promise<void> {
    const serverId = suite.framework === "playwright" ? "playwright_official" : "puppeteer";
    
    // Initialize browser context
    const browserContext = await unifiedMCPManager.executeCapability({
      operation: "create_browser_context",
      servers: [serverId],
      priority: "high",
      parameters: {
        browser,
        viewport: suite.configuration.viewport,
        headless: suite.configuration.headless,
        recordVideo: suite.configuration.recordVideo,
        slowMotion: suite.configuration.slowMotion
      }
    });
    
    try {
      for (const test of tests) {
        const testResult = await this.executeTest(suite, test, execution, browserContext, serverId);
        execution.results.push(testResult);
        
        execution.summary.total++;
        if (testResult.status === "passed") {
          execution.summary.passed++;
        } else if (testResult.status === "failed") {
          execution.summary.failed++;
        } else if (testResult.status === "skipped") {
          execution.summary.skipped++;
        } else if (testResult.status === "flaky") {
          execution.summary.flaky++;
        }
        
        this.emit("testCompleted", { executionId: execution.id, result: testResult });
      }
    } finally {
      // Close browser context
      await unifiedMCPManager.executeCapability({
        operation: "close_browser_context",
        servers: [serverId],
        priority: "medium",
        parameters: { contextId: browserContext.id }
      });
    }
  }

  /**
   * Execute a single test
   */
  private async executeTest(
    suite: TestSuite,
    test: TestCase,
    execution: TestExecution,
    browserContext: any,
    serverId: string
  ): Promise<TestResult> {
    const testStartTime = Date.now();
    
    console.log(`▶️ Running test: ${test.name}`);
    
    const result: TestResult = {
      testId: test.id,
      testName: test.name,
      status: "passed",
      duration: 0,
      steps: [],
      assertions: [],
      retry: 0
    };
    
    let retryCount = 0;
    while (retryCount <= suite.configuration.retries) {
      try {
        result.retry = retryCount;
        
        // Create new page for test
        const page = await unifiedMCPManager.executeCapability({
          operation: "create_page",
          servers: [serverId],
          priority: "high",
          parameters: { contextId: browserContext.id }
        });
        
        try {
          // Execute setup steps
          if (test.setup) {
            for (const step of test.setup) {
              await this.executeTestStep(step, page, serverId, result);
            }
          }
          
          // Execute main test steps
          for (const step of test.steps) {
            await this.executeTestStep(step, page, serverId, result);
          }
          
          // Execute assertions
          for (const assertion of test.assertions) {
            await this.executeAssertion(assertion, page, serverId, result);
          }
          
          // Execute teardown steps
          if (test.teardown) {
            for (const step of test.teardown) {
              await this.executeTestStep(step, page, serverId, result);
            }
          }
          
          result.status = "passed";
          break; // Success, no retry needed
          
        } finally {
          // Close page
          await unifiedMCPManager.executeCapability({
            operation: "close_page",
            servers: [serverId],
            priority: "low",
            parameters: { pageId: page.id }
          });
        }
        
      } catch (error) {
        result.error = error instanceof Error ? error.message : String(error);
        
        if (retryCount === suite.configuration.retries) {
          result.status = test.flaky ? "flaky" : "failed";
        } else {
          console.log(`⚠️ Test ${test.name} failed, retrying (${retryCount + 1}/${suite.configuration.retries})`);
          retryCount++;
        }
      }
    }
    
    result.duration = Date.now() - testStartTime;
    
    return result;
  }

  /**
   * Execute a test step
   */
  private async executeTestStep(
    step: TestStep,
    page: any,
    serverId: string,
    result: TestResult
  ): Promise<void> {
    const stepStartTime = Date.now();
    
    const stepResult: StepResult = {
      stepId: step.id,
      action: step.action,
      status: "passed",
      duration: 0
    };
    
    try {
      switch (step.action) {
        case "navigate":
          await unifiedMCPManager.executeCapability({
            operation: "navigate",
            servers: [serverId],
            priority: "high",
            parameters: {
              pageId: page.id,
              url: step.target,
              waitUntil: "networkidle"
            }
          });
          break;
          
        case "click":
          await unifiedMCPManager.executeCapability({
            operation: "click",
            servers: [serverId],
            priority: "high",
            parameters: {
              pageId: page.id,
              selector: step.target,
              options: step.options
            }
          });
          break;
          
        case "fill":
          await unifiedMCPManager.executeCapability({
            operation: "fill",
            servers: [serverId],
            priority: "high",
            parameters: {
              pageId: page.id,
              selector: step.target,
              value: step.value
            }
          });
          break;
          
        case "screenshot":
          const screenshot = await unifiedMCPManager.executeCapability({
            operation: "screenshot",
            servers: [serverId],
            priority: "medium",
            parameters: {
              pageId: page.id,
              options: step.options
            }
          });
          stepResult.screenshot = screenshot.path;
          break;
          
        case "measure_performance":
          const performance = await unifiedMCPManager.executeCapability({
            operation: "measure_performance",
            servers: [serverId],
            priority: "medium",
            parameters: {
              pageId: page.id
            }
          });
          // Store performance metrics in result
          break;
          
        default:
          throw new Error(`Unknown step action: ${step.action}`);
      }
      
      // Handle wait conditions
      if (step.waitFor) {
        await this.handleWaitCondition(step.waitFor, page, serverId);
      }
      
    } catch (error) {
      stepResult.status = "failed";
      stepResult.error = error instanceof Error ? error.message : String(error);
      throw error;
    } finally {
      stepResult.duration = Date.now() - stepStartTime;
      result.steps.push(stepResult);
    }
  }

  /**
   * Execute an assertion
   */
  private async executeAssertion(
    assertion: TestAssertion,
    page: any,
    serverId: string,
    result: TestResult
  ): Promise<void> {
    const assertionResult: AssertionResult = {
      assertionId: assertion.id,
      type: assertion.type,
      status: "passed",
      expected: assertion.expected,
      actual: null
    };
    
    try {
      let actualValue;
      
      switch (assertion.type) {
        case "equals":
          if (assertion.target === "url") {
            const url = await unifiedMCPManager.executeCapability({
              operation: "get_url",
              servers: [serverId],
              priority: "medium",
              parameters: { pageId: page.id }
            });
            actualValue = new URL(url).pathname;
          } else {
            actualValue = await unifiedMCPManager.executeCapability({
              operation: "get_text",
              servers: [serverId],
              priority: "medium",
              parameters: {
                pageId: page.id,
                selector: assertion.target
              }
            });
          }
          break;
          
        case "visible":
          actualValue = await unifiedMCPManager.executeCapability({
            operation: "is_visible",
            servers: [serverId],
            priority: "medium",
            parameters: {
              pageId: page.id,
              selector: assertion.target
            }
          });
          break;
          
        case "count":
          actualValue = await unifiedMCPManager.executeCapability({
            operation: "count_elements",
            servers: [serverId],
            priority: "medium",
            parameters: {
              pageId: page.id,
              selector: assertion.target
            }
          });
          break;
          
        default:
          throw new Error(`Unknown assertion type: ${assertion.type}`);
      }
      
      assertionResult.actual = actualValue;
      
      // Compare actual vs expected
      const passed = this.compareValues(assertion.type, actualValue, assertion.expected);
      
      if (!passed) {
        assertionResult.status = "failed";
        assertionResult.message = assertion.message || `Expected ${assertion.expected}, got ${actualValue}`;
        throw new Error(assertionResult.message);
      }
      
    } catch (error) {
      assertionResult.status = "failed";
      if (!assertionResult.message) {
        assertionResult.message = error instanceof Error ? error.message : String(error);
      }
      throw error;
    } finally {
      result.assertions.push(assertionResult);
    }
  }

  /**
   * Handle wait conditions
   */
  private async handleWaitCondition(waitFor: TestStep["waitFor"], page: any, serverId: string): Promise<void> {
    if (!waitFor) return;
    
    switch (waitFor.type) {
      case "element":
        await unifiedMCPManager.executeCapability({
          operation: "wait_for_selector",
          servers: [serverId],
          priority: "medium",
          parameters: {
            pageId: page.id,
            selector: waitFor.value,
            timeout: 10000
          }
        });
        break;
        
      case "timeout":
        await new Promise(resolve => setTimeout(resolve, waitFor.value as number));
        break;
        
      case "network":
        await unifiedMCPManager.executeCapability({
          operation: "wait_for_request",
          servers: [serverId],
          priority: "medium",
          parameters: {
            pageId: page.id,
            urlPattern: waitFor.value,
            timeout: 10000
          }
        });
        break;
        
      case "load":
        await unifiedMCPManager.executeCapability({
          operation: "wait_for_load_state",
          servers: [serverId],
          priority: "medium",
          parameters: {
            pageId: page.id,
            state: "networkidle",
            timeout: waitFor.value
          }
        });
        break;
    }
  }

  /**
   * Compare values for assertions
   */
  private compareValues(type: string, actual: any, expected: any): boolean {
    switch (type) {
      case "equals":
        return actual === expected;
      case "contains":
        return String(actual).includes(String(expected));
      case "visible":
        return Boolean(actual) === Boolean(expected);
      case "count":
        return Number(actual) === Number(expected);
      case "performance":
        return Number(actual) <= Number(expected);
      default:
        return false;
    }
  }

  /**
   * Schedule test suite execution
   */
  private scheduleTestSuite(suite: TestSuite): void {
    if (!suite.schedule?.enabled) return;
    
    // Simple interval scheduling (in production, use a proper cron scheduler)
    const intervalMs = this.parseCronToInterval(suite.schedule.cron);
    
    const job = setInterval(async () => {
      try {
        await this.executeTestSuite(suite.id);
      } catch (error) {
        console.error(`Scheduled test execution failed for ${suite.name}:`, error);
      }
    }, intervalMs);
    
    this.scheduledTests.set(suite.id, job);
    console.log(`⏰ Scheduled test suite: ${suite.name}`);
  }

  /**
   * Send test notifications
   */
  private async sendNotification(
    suite: TestSuite,
    execution: TestExecution,
    type: "success" | "failure"
  ): Promise<void> {
    const message = {
      suite: suite.name,
      status: type,
      environment: execution.environment,
      duration: execution.duration,
      summary: execution.summary,
      failedTests: execution.results.filter(r => r.status === "failed").map(r => r.testName)
    };
    
    for (const channel of suite.notifications.channels) {
      try {
        console.log(`📢 Test notification to ${channel}:`, message);
      } catch (error) {
        console.warn(`Failed to send notification to ${channel}:`, error);
      }
    }
  }

  /**
   * Get test execution by ID
   */
  getExecution(executionId: string): TestExecution | null {
    return this.activeExecutions.get(executionId) || this.executionHistory.get(executionId) || null;
  }

  /**
   * Get all test suites
   */
  getTestSuites(): TestSuite[] {
    return Array.from(this.testSuites.values());
  }

  /**
   * Get test suite by ID
   */
  getTestSuite(suiteId: string): TestSuite | null {
    return this.testSuites.get(suiteId) || null;
  }

  /**
   * Get test statistics
   */
  getStatistics() {
    const executions = Array.from(this.executionHistory.values());
    const recentExecutions = executions.filter(e => 
      e.startedAt.getTime() > Date.now() - (7 * 24 * 60 * 60 * 1000) // Last 7 days
    );
    
    return {
      totalSuites: this.testSuites.size,
      totalExecutions: executions.length,
      activeExecutions: this.activeExecutions.size,
      recentExecutions: recentExecutions.length,
      averageSuccessRate: recentExecutions.length > 0 ? 
        recentExecutions.reduce((sum, e) => sum + (e.summary.passed / e.summary.total), 0) / recentExecutions.length : 0,
      averageExecutionTime: recentExecutions.length > 0 ?
        recentExecutions.reduce((sum, e) => sum + (e.duration || 0), 0) / recentExecutions.length : 0,
      flakiness: recentExecutions.length > 0 ?
        recentExecutions.reduce((sum, e) => sum + e.summary.flaky, 0) / recentExecutions.reduce((sum, e) => sum + e.summary.total, 0) : 0
    };
  }

  /**
   * Helper method to parse cron expression (simplified)
   */
  private parseCronToInterval(cronExpression: string): number {
    // Simplified cron parsing
    if (cronExpression === "0 2 * * *") return 24 * 60 * 60 * 1000; // Daily
    if (cronExpression === "0 */6 * * *") return 6 * 60 * 60 * 1000; // Every 6 hours
    if (cronExpression === "*/30 * * * *") return 30 * 60 * 1000; // Every 30 minutes
    
    return 60 * 60 * 1000; // Default to 1 hour
  }
}

// Export singleton instance
export const mcpTestingSuiteService = new MCPTestingSuiteService();