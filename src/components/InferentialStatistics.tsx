import React, { useState } from 'react';
import { Form, Button, Card, Row, Col, Alert, Tabs, Tab } from 'react-bootstrap';
import * as math from 'mathjs';

const InferentialStatistics: React.FC = () => {
  const [activeTab, setActiveTab] = useState<string>('confidence');
  
  return (
    <div>
      <Tabs
        activeKey={activeTab}
        onSelect={(k) => k && setActiveTab(k)}
        className="mb-4"
      >
        <Tab eventKey="confidence" title="Confidence Intervals">
          <ConfidenceIntervalCalculator />
        </Tab>
        <Tab eventKey="hypothesis" title="Hypothesis Testing">
          <HypothesisTestingCalculator />
        </Tab>
        <Tab eventKey="chi-square" title="Chi-Square Test">
          <ChiSquareTestCalculator />
        </Tab>
      </Tabs>
    </div>
  );
};

// Confidence Interval Calculator
const ConfidenceIntervalCalculator: React.FC = () => {
  const [data, setData] = useState<string>('');
  const [confidenceLevel, setConfidenceLevel] = useState<number>(95);
  const [testType, setTestType] = useState<string>('z');
  const [results, setResults] = useState<any>(null);
  const [error, setError] = useState<string>('');

  const parseData = (inputData: string): number[] => {
    try {
      return inputData.split(/[,;\s]+/)
        .filter(val => val.trim() !== '')
        .map(val => {
          const num = parseFloat(val);
          if (isNaN(num)) throw new Error(`Invalid number: ${val}`);
          return num;
        });
    } catch (err: any) {
      setError(err.message || 'Error parsing data');
      return [];
    }
  };

  const calculateConfidenceInterval = () => {
    setError('');
    try {
      const parsedData = parseData(data);
      
      if (parsedData.length === 0) {
        setError('Please enter valid numeric data separated by commas or spaces');
        return;
      }

      const n = parsedData.length;
      const mean = Number(math.mean(parsedData));
      const stdDev = Number(math.std(parsedData));
      const stderr = stdDev / Math.sqrt(n);
      
      // Convert confidence level to alpha
      const alpha = 1 - (confidenceLevel / 100);
      
      let criticalValue: number;
      let dfValue: number | null = null;
      
      if (testType === 'z') {
        // Z-test (normal distribution)
        criticalValue = math.abs(normalQuantile(alpha / 2));
      } else {
        // T-test (t-distribution)
        dfValue = n - 1; // Degrees of freedom
        criticalValue = math.abs(quantileT(alpha / 2, dfValue));
      }
      
      const margin = criticalValue * stderr;
      const lowerBound = mean - margin;
      const upperBound = mean + margin;
      
      setResults({
        n,
        mean,
        stdDev,
        stderr,
        criticalValue,
        margin,
        lowerBound,
        upperBound,
        confidenceLevel,
        dfValue,
        testType
      });
    } catch (err: any) {
      setError(err.message || 'Error calculating confidence interval');
    }
  };

  return (
    <div>
      <Card className="mb-4">
        <Card.Body>
          <Card.Title>Confidence Interval Calculator</Card.Title>
          <Form>
            <Form.Group className="mb-3">
              <Form.Label>Enter your data (comma or space separated numbers)</Form.Label>
              <Form.Control
                as="textarea"
                rows={3}
                value={data}
                onChange={(e) => setData(e.target.value)}
                placeholder="Example: 12, 15, 18, 22, 30, 31, 35, 40, 41, 42"
              />
            </Form.Group>
            <Row>
              <Col md={6}>
                <Form.Group className="mb-3">
                  <Form.Label>Confidence Level (%)</Form.Label>
                  <Form.Control
                    type="number"
                    value={confidenceLevel}
                    onChange={(e) => setConfidenceLevel(parseFloat(e.target.value) || 95)}
                    min="1"
                    max="99.9"
                    step="0.1"
                  />
                </Form.Group>
              </Col>
              <Col md={6}>
                <Form.Group className="mb-3">
                  <Form.Label>Test Type</Form.Label>
                  <Form.Select
                    value={testType}
                    onChange={(e) => setTestType(e.target.value)}
                  >
                    <option value="z">Z-test (known population std or n {'\u2265'} 30)</option>
                    <option value="t">T-test (unknown population std and n {'<'} 30)</option>
                  </Form.Select>
                </Form.Group>
              </Col>
            </Row>
            <Button variant="primary" onClick={calculateConfidenceInterval}>
              Calculate Confidence Interval
            </Button>
          </Form>
        </Card.Body>
      </Card>

      {error && <Alert variant="danger">{error}</Alert>}

      {results && (
        <>
          <Card className="result-card mb-4">
            <Card.Body>
              <Card.Title>Results</Card.Title>
              <Row>
                <Col md={6}>
                  <p><strong>Sample Size (n):</strong> {results.n}</p>
                  <p><strong>Sample Mean:</strong> {results.mean.toFixed(4)}</p>
                  <p><strong>Sample Standard Deviation:</strong> {results.stdDev.toFixed(4)}</p>
                  <p><strong>Standard Error:</strong> {results.stderr.toFixed(4)}</p>
                </Col>
                <Col md={6}>
                  <p><strong>Critical Value:</strong> {results.criticalValue.toFixed(4)}</p>
                  <p><strong>Margin of Error:</strong> {results.margin.toFixed(4)}</p>
                  <p><strong>{results.confidenceLevel}% Confidence Interval:</strong></p>
                  <p className="ms-3">({results.lowerBound.toFixed(4)}, {results.upperBound.toFixed(4)})</p>
                </Col>
              </Row>
            </Card.Body>
          </Card>

          <Card className="explanation">
            <Card.Body>
              <Card.Title>Explanation</Card.Title>
              <p>We can be {results.confidenceLevel}% confident that the true population mean falls within the interval ({results.lowerBound.toFixed(4)}, {results.upperBound.toFixed(4)}).</p>
              
              <div className="step-container mt-3">
                <p><strong>Step 1:</strong> Calculate the sample mean: x̄ = {results.mean.toFixed(4)}</p>
                <p><strong>Step 2:</strong> Calculate the sample standard deviation: s = {results.stdDev.toFixed(4)}</p>
                <p><strong>Step 3:</strong> Calculate the standard error: SE = s / √n = {results.stdDev.toFixed(4)} / √{results.n} = {results.stderr.toFixed(4)}</p>
                <p><strong>Step 4:</strong> Find the critical value for {results.confidenceLevel}% confidence level:</p>
                <p className="ms-3">
                  {results.testType === 'z' ? 
                    `z(α/2) = ${results.criticalValue.toFixed(4)} (from standard normal distribution)` : 
                    `t(α/2, df=${results.dfValue}) = ${results.criticalValue.toFixed(4)} (from t-distribution with ${results.dfValue} degrees of freedom)`}
                </p>
                <p><strong>Step 5:</strong> Calculate the margin of error: E = {results.criticalValue.toFixed(4)} × {results.stderr.toFixed(4)} = {results.margin.toFixed(4)}</p>
                <p><strong>Step 6:</strong> Construct the confidence interval: x̄ ± E = {results.mean.toFixed(4)} ± {results.margin.toFixed(4)} = ({results.lowerBound.toFixed(4)}, {results.upperBound.toFixed(4)})</p>
              </div>
            </Card.Body>
          </Card>
        </>
      )}
    </div>
  );
};

// Hypothesis Testing Calculator
const HypothesisTestingCalculator: React.FC = () => {
  const [data, setData] = useState<string>('');
  const [nullHypothesis, setNullHypothesis] = useState<number>(0);
  const [alternative, setAlternative] = useState<string>('twoTailed');
  const [testType, setTestType] = useState<string>('z');
  const [significanceLevel, setSignificanceLevel] = useState<number>(0.05);
  const [results, setResults] = useState<any>(null);
  const [error, setError] = useState<string>('');

  const parseData = (inputData: string): number[] => {
    try {
      return inputData.split(/[,;\s]+/)
        .filter(val => val.trim() !== '')
        .map(val => {
          const num = parseFloat(val);
          if (isNaN(num)) throw new Error(`Invalid number: ${val}`);
          return num;
        });
    } catch (err: any) {
      setError(err.message || 'Error parsing data');
      return [];
    }
  };

  const performHypothesisTest = () => {
    setError('');
    try {
      const parsedData = parseData(data);
      
      if (parsedData.length === 0) {
        setError('Please enter valid numeric data separated by commas or spaces');
        return;
      }

      const n = parsedData.length;
      const mean = Number(math.mean(parsedData));
      const stdDev = Number(math.std(parsedData));
      const stderr = stdDev / Math.sqrt(n);
      
      // Calculate test statistic
      const testStatistic = (mean - nullHypothesis) / stderr;
      
      // Calculate p-value based on alternative hypothesis
      let pValue: number;
      let criticalValue: number;
      let dfValue: number | null = null;
      
      if (testType === 'z') {
        // Z-test (normal distribution)
        if (alternative === 'twoTailed') {
          pValue = 2 * (1 - cdfNormal(Math.abs(testStatistic)));
          criticalValue = math.abs(normalQuantile(significanceLevel / 2));
        } else if (alternative === 'lessThan') {
          pValue = cdfNormal(testStatistic);
          criticalValue = normalQuantile(significanceLevel);
        } else { // greaterThan
          pValue = 1 - cdfNormal(testStatistic);
          criticalValue = normalQuantile(1 - significanceLevel);
        }
      } else {
        // T-test (t-distribution)
        dfValue = n - 1; // Degrees of freedom
        
        if (alternative === 'twoTailed') {
          pValue = 2 * (1 - cdfT(Math.abs(testStatistic), dfValue));
          criticalValue = math.abs(quantileT(significanceLevel / 2, dfValue));
        } else if (alternative === 'lessThan') {
          pValue = cdfT(testStatistic, dfValue);
          criticalValue = quantileT(significanceLevel, dfValue);
        } else { // greaterThan
          pValue = 1 - cdfT(testStatistic, dfValue);
          criticalValue = quantileT(1 - significanceLevel, dfValue);
        }
      }
      
      // Determine if we reject the null hypothesis
      let rejectNull: boolean;
      
      if (alternative === 'twoTailed') {
        rejectNull = Math.abs(testStatistic) > criticalValue;
      } else if (alternative === 'lessThan') {
        rejectNull = testStatistic < criticalValue;
      } else { // greaterThan
        rejectNull = testStatistic > criticalValue;
      }
      
      setResults({
        n,
        mean,
        stdDev,
        stderr,
        testStatistic,
        pValue,
        criticalValue,
        rejectNull,
        nullHypothesis,
        alternative,
        significanceLevel,
        testType,
        dfValue
      });
    } catch (err: any) {
      setError(err.message || 'Error performing hypothesis test');
    }
  };

  return (
    <div>
      <Card className="mb-4">
        <Card.Body>
          <Card.Title>Hypothesis Testing Calculator</Card.Title>
          <Form>
            <Form.Group className="mb-3">
              <Form.Label>Enter your data (comma or space separated numbers)</Form.Label>
              <Form.Control
                as="textarea"
                rows={3}
                value={data}
                onChange={(e) => setData(e.target.value)}
                placeholder="Example: 12, 15, 18, 22, 30, 31, 35, 40, 41, 42"
              />
            </Form.Group>
            <Row>
              <Col md={6}>
                <Form.Group className="mb-3">
                  <Form.Label>Null Hypothesis (H₀: μ =)</Form.Label>
                  <Form.Control
                    type="number"
                    value={nullHypothesis}
                    onChange={(e) => setNullHypothesis(parseFloat(e.target.value) || 0)}
                    step="0.1"
                  />
                </Form.Group>
              </Col>
              <Col md={6}>
                <Form.Group className="mb-3">
                  <Form.Label>Alternative Hypothesis</Form.Label>
                  <Form.Select
                    value={alternative}
                    onChange={(e) => setAlternative(e.target.value)}
                  >
                    <option value="twoTailed">Two-tailed (H₁: μ ≠ μ₀)</option>
                    <option value="lessThan">Left-tailed (H₁: μ &lt; μ₀)</option>
                    <option value="greaterThan">Right-tailed (H₁: μ &gt; μ₀)</option>
                  </Form.Select>
                </Form.Group>
              </Col>
            </Row>
            <Row>
              <Col md={6}>
                <Form.Group className="mb-3">
                  <Form.Label>Test Type</Form.Label>
                  <Form.Select
                    value={testType}
                    onChange={(e) => setTestType(e.target.value)}
                  >
                    <option value="z">Z-test (known population std or n {'\u2265'} 30)</option>
                    <option value="t">T-test (unknown population std and n {'<'} 30)</option>
                  </Form.Select>
                </Form.Group>
              </Col>
              <Col md={6}>
                <Form.Group className="mb-3">
                  <Form.Label>Significance Level (α)</Form.Label>
                  <Form.Control
                    type="number"
                    value={significanceLevel}
                    onChange={(e) => setSignificanceLevel(parseFloat(e.target.value) || 0.05)}
                    min="0.001"
                    max="0.5"
                    step="0.001"
                  />
                </Form.Group>
              </Col>
            </Row>
            <Button variant="primary" onClick={performHypothesisTest}>
              Perform Hypothesis Test
            </Button>
          </Form>
        </Card.Body>
      </Card>

      {error && <Alert variant="danger">{error}</Alert>}

      {results && (
        <>
          <Card className="result-card mb-4">
            <Card.Body>
              <Card.Title>Results</Card.Title>
              <Row>
                <Col md={6}>
                  <p><strong>Sample Size (n):</strong> {results.n}</p>
                  <p><strong>Sample Mean:</strong> {results.mean.toFixed(4)}</p>
                  <p><strong>Sample Standard Deviation:</strong> {results.stdDev.toFixed(4)}</p>
                  <p><strong>Standard Error:</strong> {results.stderr.toFixed(4)}</p>
                </Col>
                <Col md={6}>
                  <p><strong>Test Statistic:</strong> {results.testType === 'z' ? 'z' : 't'} = {results.testStatistic.toFixed(4)}</p>
                  <p><strong>Critical Value:</strong> {results.criticalValue.toFixed(4)}</p>
                  <p><strong>P-value:</strong> {results.pValue.toFixed(4)}</p>
                  <p><strong>Decision:</strong> {results.rejectNull ? 
                    <span className="text-danger">Reject H₀</span> : 
                    <span className="text-success">Fail to reject H₀</span>}
                  </p>
                </Col>
              </Row>
            </Card.Body>
          </Card>

          <Card className="explanation">
            <Card.Body>
              <Card.Title>Explanation</Card.Title>
              
              <p><strong>Null Hypothesis (H₀):</strong> μ = {results.nullHypothesis}</p>
              <p><strong>Alternative Hypothesis (H₁):</strong> 
                {results.alternative === 'twoTailed' ? 
                  ` μ ≠ ${results.nullHypothesis}` : 
                  results.alternative === 'lessThan' ? 
                    ` μ < ${results.nullHypothesis}` : 
                    ` μ > ${results.nullHypothesis}`}
              </p>
              
              <div className="step-container mt-3">
                <p><strong>Step 1:</strong> Calculate the test statistic:</p>
                <p className="ms-3">{results.testType === 'z' ? 'z' : 't'} = (x̄ - μ₀) / (s / √n) = ({results.mean.toFixed(4)} - {results.nullHypothesis}) / ({results.stdDev.toFixed(4)} / √{results.n}) = {results.testStatistic.toFixed(4)}</p>
                
                <p><strong>Step 2:</strong> Calculate the p-value:</p>
                <p className="ms-3">
                  {results.alternative === 'twoTailed' ? 
                    `P(|${results.testType === 'z' ? 'Z' : 'T'}| > |${results.testStatistic.toFixed(4)}|) = ${results.pValue.toFixed(4)}` : 
                    results.alternative === 'lessThan' ? 
                      `P(${results.testType === 'z' ? 'Z' : 'T'} < ${results.testStatistic.toFixed(4)}) = ${results.pValue.toFixed(4)}` : 
                      `P(${results.testType === 'z' ? 'Z' : 'T'} > ${results.testStatistic.toFixed(4)}) = ${results.pValue.toFixed(4)}`}
                </p>
                
                <p><strong>Step 3:</strong> Compare p-value with significance level:</p>
                <p className="ms-3">
                  {results.pValue < results.significanceLevel ? 
                    `${results.pValue.toFixed(4)} < ${results.significanceLevel} → Reject H₀` : 
                    `${results.pValue.toFixed(4)} > ${results.significanceLevel} → Fail to reject H₀`}
                </p>
                
                <p><strong>Conclusion:</strong> {results.rejectNull ? 
                  `We reject the null hypothesis. There is sufficient evidence to suggest that the population mean is ${results.alternative === 'twoTailed' ? 'different from' : results.alternative === 'lessThan' ? 'less than' : 'greater than'} ${results.nullHypothesis}.` : 
                  `We fail to reject the null hypothesis. There is insufficient evidence to suggest that the population mean is ${results.alternative === 'twoTailed' ? 'different from' : results.alternative === 'lessThan' ? 'less than' : 'greater than'} ${results.nullHypothesis}.`}
                </p>
              </div>
            </Card.Body>
          </Card>
        </>
      )}
    </div>
  );
};

// Chi-Square Test Calculator
const ChiSquareTestCalculator: React.FC = () => {
  const [observedValues, setObservedValues] = useState<string>('');
  const [expectedValues, setExpectedValues] = useState<string>('');
  const [significanceLevel, setSignificanceLevel] = useState<number>(0.05);
  const [results, setResults] = useState<any>(null);
  const [error, setError] = useState<string>('');

  const parseData = (inputData: string): number[] => {
    try {
      return inputData.split(/[,;\s]+/)
        .filter(val => val.trim() !== '')
        .map(val => {
          const num = parseFloat(val);
          if (isNaN(num)) throw new Error(`Invalid number: ${val}`);
          if (num < 0) throw new Error('Values must be non-negative');
          return num;
        });
    } catch (err: any) {
      setError(err.message || 'Error parsing data');
      return [];
    }
  };

  const performChiSquareTest = () => {
    setError('');
    try {
      const observed = parseData(observedValues);
      const expected = expectedValues ? parseData(expectedValues) : null;
      
      if (observed.length === 0) {
        setError('Please enter valid observed frequencies');
        return;
      }
      
      if (expected && observed.length !== expected.length) {
        setError('Observed and expected frequencies must have the same length');
        return;
      }
      
      // If expected frequencies are not provided, assume uniform distribution
      const expectedFreq = expected || observed.map(() => math.sum(observed) / observed.length);
      
      // Calculate chi-square statistic
      let chiSquare = 0;
      for (let i = 0; i < observed.length; i++) {
        chiSquare += Math.pow(observed[i] - expectedFreq[i], 2) / expectedFreq[i];
      }
      
      // Degrees of freedom
      const df = observed.length - 1;
      
      // Calculate p-value
      const pValue = 1 - cdfChiSquare(chiSquare, df);
      
      // Critical value
      const criticalValue = quantileChiSquare(1 - significanceLevel, df);
      
      // Determine if we reject the null hypothesis
      const rejectNull = chiSquare > criticalValue;
      
      setResults({
        observed,
        expected: expectedFreq,
        chiSquare,
        df,
        pValue,
        criticalValue,
        rejectNull,
        significanceLevel
      });
    } catch (err: any) {
      setError(err.message || 'Error performing chi-square test');
    }
  };

  return (
    <div>
      <Card className="mb-4">
        <Card.Body>
          <Card.Title>Chi-Square Test for Independence</Card.Title>
          <Form>
            <Form.Group className="mb-3">
              <Form.Label>Observed Frequencies (comma or space separated)</Form.Label>
              <Form.Control
                as="textarea"
                rows={2}
                value={observedValues}
                onChange={(e) => setObservedValues(e.target.value)}
                placeholder="Example: 10, 15, 20, 25, 30"
              />
            </Form.Group>
            <Form.Group className="mb-3">
              <Form.Label>Expected Frequencies (optional, leave blank for uniform distribution)</Form.Label>
              <Form.Control
                as="textarea"
                rows={2}
                value={expectedValues}
                onChange={(e) => setExpectedValues(e.target.value)}
                placeholder="Example: 20, 20, 20, 20, 20"
              />
            </Form.Group>
            <Form.Group className="mb-3">
              <Form.Label>Significance Level (α)</Form.Label>
              <Form.Control
                type="number"
                value={significanceLevel}
                onChange={(e) => setSignificanceLevel(parseFloat(e.target.value) || 0.05)}
                min="0.001"
                max="0.5"
                step="0.001"
              />
            </Form.Group>
            <Button variant="primary" onClick={performChiSquareTest}>
              Perform Chi-Square Test
            </Button>
          </Form>
        </Card.Body>
      </Card>

      {error && <Alert variant="danger">{error}</Alert>}

      {results && (
        <>
          <Card className="result-card mb-4">
            <Card.Body>
              <Card.Title>Results</Card.Title>
              <Row>
                <Col md={6}>
                  <p><strong>Chi-Square Statistic (χ²):</strong> {results.chiSquare.toFixed(4)}</p>
                  <p><strong>Degrees of Freedom (df):</strong> {results.df}</p>
                  <p><strong>P-value:</strong> {results.pValue.toFixed(4)}</p>
                </Col>
                <Col md={6}>
                  <p><strong>Critical Value:</strong> {results.criticalValue.toFixed(4)}</p>
                  <p><strong>Significance Level (α):</strong> {results.significanceLevel}</p>
                  <p><strong>Decision:</strong> {results.rejectNull ? 
                    <span className="text-danger">Reject H₀</span> : 
                    <span className="text-success">Fail to reject H₀</span>}
                  </p>
                </Col>
              </Row>
            </Card.Body>
          </Card>

          <Card className="explanation">
            <Card.Body>
              <Card.Title>Explanation</Card.Title>
              
              <p><strong>Null Hypothesis (H₀):</strong> The observed frequencies match the expected frequencies (no association).</p>
              <p><strong>Alternative Hypothesis (H₁):</strong> The observed frequencies differ from the expected frequencies (there is an association).</p>
              
              <div className="step-container mt-3">
                <p><strong>Step 1:</strong> Calculate the chi-square statistic:</p>
                <p className="ms-3">χ² = Σ [(O - E)² / E] = {results.chiSquare.toFixed(4)}</p>
                <p><strong>Step 2:</strong> Determine the degrees of freedom:</p>
                <p className="ms-3">df = n - 1 = {results.df}</p>
                <p><strong>Step 3:</strong> Calculate the p-value:</p>
                <p className="ms-3">P(χ² {'>'} {results.chiSquare.toFixed(4)}) = {results.pValue.toFixed(4)}</p>
                <p><strong>Step 4:</strong> Compare p-value with significance level:</p>
                <p className="ms-3">
                  {results.pValue < results.significanceLevel ? 
                    `${results.pValue.toFixed(4)} < ${results.significanceLevel} → Reject H₀` : 
                    `${results.pValue.toFixed(4)} > ${results.significanceLevel} → Fail to reject H₀`}
                </p>
                
                <p><strong>Conclusion:</strong> {results.rejectNull ? 
                  'We reject the null hypothesis. There is sufficient evidence to suggest that the observed frequencies differ significantly from the expected frequencies.' : 
                  'We fail to reject the null hypothesis. There is insufficient evidence to suggest that the observed frequencies differ significantly from the expected frequencies.'}
                </p>
              </div>
            </Card.Body>
          </Card>
        </>
      )}
    </div>
  );
};

// Helper function for normal distribution quantile (inverse CDF)
function normalQuantile(p: number, mu: number = 0, sigma: number = 1): number {
  if (p <= 0 || p >= 1) {
    return NaN;
  }
  
  // Coefficients for the rational approximation
  const a1 = -3.969683028665376e+01;
  const a2 = 2.209460984245205e+02;
  const a3 = -2.759285104469687e+02;
  const a4 = 1.383577518672690e+02;
  const a5 = -3.066479806614716e+01;
  const a6 = 2.506628277459239e+00;
  
  const b1 = -5.447609879822406e+01;
  const b2 = 1.615858368580409e+02;
  const b3 = -1.556989798598866e+02;
  const b4 = 6.680131188771972e+01;
  const b5 = -1.328068155288572e+01;
  
  const c1 = -7.784894002430293e-03;
  const c2 = -3.223964580411365e-01;
  const c3 = -2.400758277161838e+00;
  const c4 = -2.549732539343734e+00;
  const c5 = 4.374664141464968e+00;
  const c6 = 2.938163982698783e+00;
  
  const d1 = 7.784695709041462e-03;
  const d2 = 3.224671290700398e-01;
  const d3 = 2.445134137142996e+00;
  const d4 = 3.754408661907416e+00;
  
  // Define break-points
  const plow = 0.02425;
  const phigh = 1 - plow;
  
  let q, r;
  
  // Rational approximation for lower region
  if (p < plow) {
    q = Math.sqrt(-2 * Math.log(p));
    r = (((((c1 * q + c2) * q + c3) * q + c4) * q + c5) * q + c6) /
        ((((d1 * q + d2) * q + d3) * q + d4) * q + 1);
  }
  // Rational approximation for central region
  else if (p <= phigh) {
    q = p - 0.5;
    r = q * q;
    r = q * (((((a1 * r + a2) * r + a3) * r + a4) * r + a5) * r + a6) /
        (((((b1 * r + b2) * r + b3) * r + b4) * r + b5) * r + 1);
  }
  // Rational approximation for upper region
  else {
    q = Math.sqrt(-2 * Math.log(1 - p));
    r = -(((((c1 * q + c2) * q + c3) * q + c4) * q + c5) * q + c6) /
         ((((d1 * q + d2) * q + d3) * q + d4) * q + 1);
  }
  
  // Apply scaling
  return mu + sigma * r;
}

// Helper function for Student's t-distribution quantile
function quantileT(p: number, df: number): number {
  if (p <= 0 || p >= 1) {
    return NaN;
  }
  
  // For p > 0.5, we use symmetry of the t-distribution
  let neg = false;
  if (p > 0.5) {
    p = 1 - p;
    neg = true;
  }
  
  // Approximation for small df
  if (df < 1) {
    return NaN;
  } else if (df === 1) {
    // Cauchy distribution
    const q = Math.tan(Math.PI * (p - 0.5));
    return neg ? -q : q;
  } else if (df === 2) {
    // Simple formula for df = 2
    const q = Math.sqrt(2 / (p * (2 - p)) - 2);
    return neg ? -q : q;
  }
  
  // Initial approximation using normal distribution
  let x = normalQuantile(p, 0, 1);
  let y = x * x;
  
  // Improve approximation for df between 2 and infinity
  if (df < 4) {
    // Approximation for small df
    x += (x * y - x) / (4 * df);
  } else if (df <= 6) {
    // Approximation for medium df
    x += (x * (y - 3) + y - 1) / (2 * df);
  } else {
    // Approximation for large df
    x += ((y - 3) * x + (y - 1)) / (2 * df);
  }
  
  // Apply sign
  return neg ? -x : x;
}

// Helper function for normal distribution CDF
function cdfNormal(x: number, mu: number = 0, sigma: number = 1): number {
  // Standardize the value
  const z = (x - mu) / sigma;
  
  // For large negative values, return close to 0
  if (z < -6) {
    return 0;
  }
  
  // For large positive values, return close to 1
  if (z > 6) {
    return 1;
  }
  
  // For values close to 0, use a Taylor series approximation
  if (Math.abs(z) < 0.001) {
    return 0.5 + z * 0.3989422804;
  }
  
  // Use approximation for standard normal CDF
  let p = 0.5;
  const y = Math.abs(z) / Math.sqrt(2);
  
  // Approximation using error function
  p = 0.5 * (1 + math.erf(y));
  
  // Adjust for negative z
  return z < 0 ? 1 - p : p;
}

// Helper function for Student's t-distribution CDF
function cdfT(x: number, df: number): number {
  // For x = 0, CDF = 0.5 due to symmetry
  if (x === 0) {
    return 0.5;
  }
  
  // For negative x, use symmetry: CDF(-x) = 1 - CDF(x)
  if (x < 0) {
    return 1 - cdfT(-x, df);
  }
  
  // For df = 1, this is a Cauchy distribution
  if (df === 1) {
    return 0.5 + Math.atan(x) / Math.PI;
  }
  
  // For df = 2, there's a simple formula
  if (df === 2) {
    return 0.5 + x / (2 * Math.sqrt(x * x + 2));
  }
  
  // For large df, approximate with normal distribution
  if (df > 100) {
    return cdfNormal(x);
  }
  
  // For other cases, use incomplete beta function approximation
  // This is a simplified approximation
  const a = df / 2;
  const b = 0.5;
  const z = df / (df + x * x);
  
  // Regularized incomplete beta function approximation
  // This is a very rough approximation
  let betaInc = 0;
  if (z < 0.7) {
    betaInc = Math.pow(1 - z, b) * Math.pow(z, a) / (a * Math.pow(1 - z, b));
  } else {
    betaInc = 1 - Math.pow(z, a) * Math.pow(1 - z, b) / (b * Math.pow(z, a));
  }
  
  return 1 - 0.5 * betaInc;
}

// Helper function for Chi-Square distribution CDF
function cdfChiSquare(x: number, k: number): number {
  if (x <= 0) {
    return 0;
  }
  
  // For k = 1, chi-square is related to normal distribution
  if (k === 1) {
    return 2 * cdfNormal(Math.sqrt(x)) - 1;
  }
  
  // For k = 2, there's a simple formula
  if (k === 2) {
    return 1 - Math.exp(-x / 2);
  }
  
  // For larger k, use incomplete gamma function approximation
  // This is a simplified approximation
  const a = k / 2;
  const z = x / 2;
  
  // Very rough approximation of regularized lower incomplete gamma function
  let sum = 0;
  let term = Math.exp(-z) * Math.pow(z, a) / math.gamma(a + 1);
  
  for (let i = 0; i < 100; i++) {
    sum += term;
    term = term * z / (a + i + 1);
    if (term < 1e-10) break;
  }
  
  return sum;
}

// Helper function for Chi-Square distribution quantile
function quantileChiSquare(p: number, k: number): number {
  if (p <= 0 || p >= 1) {
    return NaN;
  }
  
  // For k = 1, chi-square is related to normal distribution
  if (k === 1) {
    const z = normalQuantile(1 - p / 2, 0, 1);
    return z * z;
  }
  
  // For k = 2, there's a simple formula
  if (k === 2) {
    return -2 * Math.log(1 - p);
  }
  
  // For larger k, use approximation
  // Wilson-Hilferty approximation
  const z = normalQuantile(p, 0, 1);
  const x = k * Math.pow(1 - 2 / (9 * k) + z * Math.sqrt(2 / (9 * k)), 3);
  
  return x;
}

export default InferentialStatistics; 