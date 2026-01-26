# CI/CD Integration

Run Moonsurf in continuous integration and deployment pipelines for automated browser testing.

## Overview

Moonsurf works well in CI/CD environments for:

- End-to-end testing
- Visual regression testing
- Screenshot capture
- Browser-based integration tests

## Requirements

- Node.js 18+
- Chrome or Chromium browser
- Headless mode (for CI without display)

## GitHub Actions

### Basic Workflow

```yaml
name: E2E Tests

on:
  push:
    branches: [main]
  pull_request:
    branches: [main]

jobs:
  e2e-test:
    runs-on: ubuntu-latest

    steps:
      - name: Checkout
        uses: actions/checkout@v4

      - name: Setup Node.js
        uses: actions/setup-node@v4
        with:
          node-version: '20'
          cache: 'npm'

      - name: Install dependencies
        run: npm ci

      - name: Install Chromium
        run: |
          sudo apt-get update
          sudo apt-get install -y chromium-browser

      - name: Start application
        run: npm run start &
        env:
          PORT: 3000

      - name: Wait for app
        run: npx wait-on http://localhost:3000

      - name: Start Moonsurf
        run: |
          npx @moonsurf/browser-control &
          sleep 5
        env:
          BROWSER_DEFAULT_MODE: chromium
          HEADLESS_DEFAULT: true
          LOG_LEVEL: info

      - name: Run E2E tests
        run: npm run test:e2e

      - name: Upload screenshots
        if: always()
        uses: actions/upload-artifact@v4
        with:
          name: screenshots
          path: test-screenshots/
          retention-days: 7
```

### With Matrix Testing

```yaml
name: Cross-Browser Tests

on: [push, pull_request]

jobs:
  test:
    runs-on: ubuntu-latest
    strategy:
      matrix:
        browser: [chromium, chrome]
        viewport: [desktop, mobile]
      fail-fast: false

    steps:
      - uses: actions/checkout@v4

      - name: Setup Node.js
        uses: actions/setup-node@v4
        with:
          node-version: '20'

      - name: Install Chrome
        if: matrix.browser == 'chrome'
        run: |
          wget -q https://dl.google.com/linux/direct/google-chrome-stable_current_amd64.deb
          sudo dpkg -i google-chrome-stable_current_amd64.deb

      - name: Install Chromium
        if: matrix.browser == 'chromium'
        run: sudo apt-get install -y chromium-browser

      - name: Start Moonsurf
        run: npx @moonsurf/browser-control &
        env:
          BROWSER_DEFAULT_MODE: ${{ matrix.browser }}
          HEADLESS_DEFAULT: true

      - name: Run tests
        run: npm run test:e2e -- --viewport=${{ matrix.viewport }}
```

### Scheduled Visual Regression

```yaml
name: Visual Regression

on:
  schedule:
    - cron: '0 6 * * *'  # Daily at 6 AM
  workflow_dispatch:

jobs:
  visual:
    runs-on: ubuntu-latest

    steps:
      - uses: actions/checkout@v4

      - name: Setup
        uses: actions/setup-node@v4
        with:
          node-version: '20'

      - name: Install
        run: |
          npm ci
          sudo apt-get install -y chromium-browser

      - name: Capture screenshots
        run: |
          npx @moonsurf/browser-control &
          sleep 5
          npm run visual-regression
        env:
          BROWSER_DEFAULT_MODE: chromium
          HEADLESS_DEFAULT: true

      - name: Compare with baseline
        run: npm run compare-screenshots

      - name: Upload results
        uses: actions/upload-artifact@v4
        with:
          name: visual-diff
          path: visual-results/
```

## GitLab CI

### Basic Pipeline

```yaml
# .gitlab-ci.yml

stages:
  - test

e2e-tests:
  stage: test
  image: node:20

  services:
    - name: chromium/chromium:latest
      alias: browser

  before_script:
    - apt-get update && apt-get install -y chromium
    - npm ci

  script:
    - npm run start &
    - npx wait-on http://localhost:3000
    - |
      BROWSER_DEFAULT_MODE=chromium \
      HEADLESS_DEFAULT=true \
      npx @moonsurf/browser-control &
    - sleep 5
    - npm run test:e2e

  artifacts:
    when: always
    paths:
      - test-screenshots/
    expire_in: 1 week
```

### With Docker

```yaml
e2e-docker:
  stage: test
  image: docker:latest
  services:
    - docker:dind

  script:
    - docker build -t e2e-tests .
    - docker run --rm e2e-tests npm run test:e2e

  artifacts:
    when: always
    paths:
      - test-screenshots/
```

## Docker Configuration

### Dockerfile

```dockerfile
FROM node:20-slim

# Install Chrome dependencies
RUN apt-get update && apt-get install -y \
    chromium \
    fonts-liberation \
    libasound2 \
    libatk-bridge2.0-0 \
    libatk1.0-0 \
    libcups2 \
    libdbus-1-3 \
    libgbm1 \
    libgtk-3-0 \
    libnspr4 \
    libnss3 \
    libxcomposite1 \
    libxdamage1 \
    libxrandr2 \
    xdg-utils \
    --no-install-recommends \
    && rm -rf /var/lib/apt/lists/*

# Set Chrome path
ENV CHROME_PATH=/usr/bin/chromium

WORKDIR /app

# Copy package files
COPY package*.json ./

# Install dependencies
RUN npm ci

# Copy source
COPY . .

# Environment for CI
ENV BROWSER_DEFAULT_MODE=chromium
ENV HEADLESS_DEFAULT=true
ENV NODE_ENV=test

# Run tests
CMD ["npm", "run", "test:e2e"]
```

### Docker Compose

```yaml
# docker-compose.ci.yml
version: '3.8'

services:
  app:
    build: .
    ports:
      - "3000:3000"
    healthcheck:
      test: ["CMD", "curl", "-f", "http://localhost:3000/health"]
      interval: 5s
      timeout: 5s
      retries: 10

  moonsurf:
    image: node:20-slim
    command: npx @moonsurf/browser-control
    environment:
      - BROWSER_DEFAULT_MODE=chromium
      - HEADLESS_DEFAULT=true
    depends_on:
      app:
        condition: service_healthy

  tests:
    build: .
    command: npm run test:e2e
    environment:
      - APP_URL=http://app:3000
      - MOONSURF_URL=http://moonsurf:3300
    depends_on:
      - moonsurf
```

Run:
```bash
docker-compose -f docker-compose.ci.yml up --exit-code-from tests
```

## CircleCI

```yaml
# .circleci/config.yml
version: 2.1

jobs:
  e2e-tests:
    docker:
      - image: cimg/node:20.0-browsers

    steps:
      - checkout

      - restore_cache:
          keys:
            - v1-deps-{{ checksum "package-lock.json" }}

      - run:
          name: Install dependencies
          command: npm ci

      - save_cache:
          key: v1-deps-{{ checksum "package-lock.json" }}
          paths:
            - node_modules

      - run:
          name: Start application
          command: npm run start
          background: true

      - run:
          name: Start Moonsurf
          command: |
            BROWSER_DEFAULT_MODE=chromium \
            HEADLESS_DEFAULT=true \
            npx @moonsurf/browser-control
          background: true

      - run:
          name: Wait for services
          command: |
            npx wait-on http://localhost:3000
            npx wait-on http://localhost:3300/health

      - run:
          name: Run E2E tests
          command: npm run test:e2e

      - store_artifacts:
          path: test-screenshots
          destination: screenshots

workflows:
  test:
    jobs:
      - e2e-tests
```

## Jenkins

### Jenkinsfile

```groovy
pipeline {
    agent {
        docker {
            image 'node:20-slim'
            args '-u root'
        }
    }

    environment {
        BROWSER_DEFAULT_MODE = 'chromium'
        HEADLESS_DEFAULT = 'true'
    }

    stages {
        stage('Setup') {
            steps {
                sh '''
                    apt-get update
                    apt-get install -y chromium
                    npm ci
                '''
            }
        }

        stage('Start Services') {
            steps {
                sh '''
                    npm run start &
                    npx @moonsurf/browser-control &
                    sleep 10
                '''
            }
        }

        stage('Test') {
            steps {
                sh 'npm run test:e2e'
            }
        }
    }

    post {
        always {
            archiveArtifacts artifacts: 'test-screenshots/**/*', allowEmptyArchive: true
        }
    }
}
```

## Environment Configuration

### Required Variables

```bash
# Browser mode (use chromium for CI)
BROWSER_DEFAULT_MODE=chromium

# Always headless in CI
HEADLESS_DEFAULT=true

# Logging
LOG_LEVEL=info

# Optional: Task system
TASKS_ENABLED=false  # Disable if not needed
```

### Testing Mode

Use `testing` mode for isolated tests:

```bash
BROWSER_DEFAULT_MODE=testing
```

This creates fresh browser profiles for each instance.

## Test Framework Integration

### Jest Example

```javascript
// jest.setup.js
const { MoonsurfClient } = require('./moonsurf-client');

let client;

beforeAll(async () => {
  client = new MoonsurfClient('http://localhost:3300');
  await client.connect();
  global.moonsurf = client;
});

afterAll(async () => {
  await client.callTool('browser_instance', { action: 'close_all' });
  client.disconnect();
});

// test.js
describe('E2E Tests', () => {
  let instanceId;

  beforeEach(async () => {
    const result = await moonsurf.callTool('browser_instance', {
      action: 'launch',
      mode: 'testing'
    });
    instanceId = result.instanceId;
  });

  afterEach(async () => {
    await moonsurf.callTool('browser_instance', {
      action: 'close',
      instanceId
    });
  });

  test('homepage loads', async () => {
    await moonsurf.callTool('browser_navigate', {
      action: 'goto',
      url: process.env.APP_URL,
      instanceId
    });

    const content = await moonsurf.callTool('browser_content', {
      action: 'text',
      instanceId
    });

    expect(content).toContain('Welcome');
  });
});
```

### Mocha Example

```javascript
const { expect } = require('chai');
const { MoonsurfClient } = require('./moonsurf-client');

describe('E2E Tests', function() {
  this.timeout(60000);

  let client;

  before(async () => {
    client = new MoonsurfClient();
    await client.connect();
    await client.callTool('browser_instance', { action: 'launch' });
  });

  after(async () => {
    await client.callTool('browser_instance', { action: 'close' });
    client.disconnect();
  });

  it('should load homepage', async () => {
    await client.callTool('browser_navigate', {
      action: 'goto',
      url: 'http://localhost:3000'
    });

    const content = await client.callTool('browser_content', {
      action: 'text'
    });

    expect(content).to.include('Welcome');
  });
});
```

## Debugging CI Failures

### Capture Screenshots on Failure

```javascript
afterEach(async function() {
  if (this.currentTest.state === 'failed') {
    const screenshot = await moonsurf.callTool('browser_content', {
      action: 'screenshot',
      fullPage: true
    });

    // Save screenshot with test name
    const filename = `failure-${this.currentTest.title}.png`;
    fs.writeFileSync(`test-screenshots/${filename}`, screenshot, 'base64');
  }
});
```

### Increase Timeouts

```yaml
# In CI config
env:
  TASKS_COMMAND_TIMEOUT: 120000  # 2 minutes per command
```

### Enable Debug Logging

```yaml
env:
  LOG_LEVEL: debug
```

### Save Full Logs

```yaml
- name: Run tests
  run: npm run test:e2e 2>&1 | tee test.log

- name: Upload logs
  if: failure()
  uses: actions/upload-artifact@v4
  with:
    name: test-logs
    path: test.log
```

## Best Practices

### 1. Use Headless Mode

Always enable headless in CI:

```bash
HEADLESS_DEFAULT=true
```

### 2. Use Testing Mode

For clean state in each test:

```bash
BROWSER_DEFAULT_MODE=testing
```

### 3. Add Health Checks

Wait for services before testing:

```bash
npx wait-on http://localhost:3300/health
```

### 4. Set Appropriate Timeouts

Browser operations can be slow in CI:

```javascript
// Increase wait times
{ timeout: 30000 }
```

### 5. Capture Artifacts

Always save screenshots and logs:

```yaml
artifacts:
  when: always
  paths:
    - test-screenshots/
```

### 6. Parallelize When Possible

Run independent tests in parallel:

```yaml
strategy:
  matrix:
    test-suite: [auth, checkout, search]
```

### 7. Cache Dependencies

```yaml
- name: Cache node modules
  uses: actions/cache@v3
  with:
    path: node_modules
    key: ${{ runner.os }}-node-${{ hashFiles('package-lock.json') }}
```

## Related

- [Testing Workflows](../guides/testing-workflows.md) - Testing patterns
- [Docker Deployment](../configuration/remote-mode.md#docker-deployment) - Docker setup
- [Configuration](../configuration/README.md) - Environment variables
