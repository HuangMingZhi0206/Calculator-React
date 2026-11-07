import React, { useState } from 'react';
import { Form, Button, Card, Row, Col, Alert, Tabs, Tab } from 'react-bootstrap';
import * as math from 'mathjs';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';

const ProbabilityDistributions: React.FC = () => {
  const [distribution, setDistribution] = useState<string>('binomial');
  
  return (
    <div>
      <Tabs
        activeKey={distribution}
        onSelect={(k) => k && setDistribution(k)}
        className="mb-4"
      >
        <Tab eventKey="binomial" title="Binomial">
          <BinomialCalculator />
        </Tab>
        <Tab eventKey="poisson" title="Poisson">
          <PoissonCalculator />
        </Tab>
        <Tab eventKey="normal" title="Normal">
          <NormalCalculator />
        </Tab>
        <Tab eventKey="exponential" title="Exponential">
          <ExponentialCalculator />
        </Tab>
      </Tabs>
    </div>
  );
};

// Binomial Distribution Calculator
const BinomialCalculator: React.FC = () => {
  const [n, setN] = useState<number>(10);
  const [p, setP] = useState<number>(0.5);
  const [x, setX] = useState<number>(5);
  const [calculationType, setCalculationType] = useState<string>('exactly');
  const [results, setResults] = useState<any>(null);
  const [error, setError] = useState<string>('');
  const [chartData, setChartData] = useState<any[]>([]);

  const calculateBinomial = () => {
    setError('');
    try {
      if (n <= 0 || n > 1000 || !Number.isInteger(n)) {
        setError('n must be a positive integer less than or equal to 1000');
        return;
      }
      if (p < 0 || p > 1) {
        setError('p must be between 0 and 1');
        return;
      }
      if (x < 0 || x > n || !Number.isInteger(x)) {
        setError(`x must be a non-negative integer less than or equal to n (${n})`);
        return;
      }

      // PMF - Probability Mass Function
      const binomialPMF = (n: number, p: number, k: number): number => {
        return math.combinations(n, k) * Math.pow(p, k) * Math.pow(1 - p, n - k);
      };

      // CDF - Cumulative Distribution Function
      const binomialCDF = (n: number, p: number, k: number): number => {
        let cumulative = 0;
        for (let i = 0; i <= k; i++) {
          cumulative += binomialPMF(n, p, i);
        }
        return cumulative;
      };

      let probability: number;
      let explanation: string;

      switch (calculationType) {
        case 'exactly':
          probability = binomialPMF(n, p, x);
          explanation = `P(X = ${x}) = C(${n}, ${x}) × ${p}^${x} × (1-${p})^${n-x}`;
          break;
        case 'lessThan':
          probability = binomialCDF(n, p, x - 1);
          explanation = `P(X < ${x}) = P(X ≤ ${x-1}) = ∑(k=0 to ${x-1}) C(${n}, ${x-1}) × ${p}^${x-1} × (1-${p})^${n-(x-1)}`;
          break;
        case 'lessOrEqual':
          probability = binomialCDF(n, p, x);
          explanation = `P(X ≤ ${x}) = ∑(k=0 to ${x}) C(${n}, ${x}) × ${p}^${x} × (1-${p})^${n-x}`;
          break;
        case 'greaterThan':
          probability = 1 - binomialCDF(n, p, x);
          explanation = `P(X > ${x}) = 1 - P(X ≤ ${x}) = 1 - ∑(k=0 to ${x}) C(${n}, ${x}) × ${p}^${x} × (1-${p})^${n-x}`;
          break;
        case 'greaterOrEqual':
          probability = 1 - binomialCDF(n, p, x - 1);
          explanation = `P(X ≥ ${x}) = 1 - P(X ≤ ${x-1}) = 1 - ∑(k=0 to ${x-1}) C(${n}, ${x-1}) × ${p}^${x-1} × (1-${p})^${n-(x-1)}`;
          break;
        default:
          probability = 0;
          explanation = '';
      }

      // Calculate mean, variance, standard deviation
      const mean = n * p;
      const variance = n * p * (1 - p);
      const stdDev = Math.sqrt(variance);

      // Generate chart data for PMF
      const chartData = [];
      for (let k = 0; k <= n; k++) {
        chartData.push({
          x: k,
          pmf: binomialPMF(n, p, k)
        });
      }

      setResults({ probability, mean, variance, stdDev });
      setChartData(chartData);
    } catch (err: any) {
      setError(err.message || 'Error calculating binomial distribution');
    }
  };

  return (
    <div>
      <Card className="mb-4">
        <Card.Body>
          <Card.Title>Binomial Distribution Calculator</Card.Title>
          <Form>
            <Row>
              <Col md={6}>
                <Form.Group className="mb-3">
                  <Form.Label>Number of trials (n)</Form.Label>
                  <Form.Control 
                    type="number"
                    value={n}
                    onChange={(e) => setN(parseInt(e.target.value) || 0)}
                    min="1"
                    max="1000"
                  />
                  <Form.Text className="text-muted">
                    Enter the number of independent trials
                  </Form.Text>
                </Form.Group>
              </Col>
              <Col md={6}>
                <Form.Group className="mb-3">
                  <Form.Label>Probability of success (p)</Form.Label>
                  <Form.Control 
                    type="number"
                    value={p}
                    onChange={(e) => setP(parseFloat(e.target.value) || 0)}
                    step="0.01"
                    min="0"
                    max="1"
                  />
                  <Form.Text className="text-muted">
                    Enter a probability between 0 and 1
                  </Form.Text>
                </Form.Group>
              </Col>
            </Row>
            <Row>
              <Col md={6}>
                <Form.Group className="mb-3">
                  <Form.Label>Number of successes (x)</Form.Label>
                  <Form.Control 
                    type="number"
                    value={x}
                    onChange={(e) => setX(parseInt(e.target.value) || 0)}
                    min="0"
                  />
                </Form.Group>
              </Col>
              <Col md={6}>
                <Form.Group className="mb-3">
                  <Form.Label>Calculation Type</Form.Label>
                  <Form.Select
                    value={calculationType}
                    onChange={(e) => setCalculationType(e.target.value)}
                  >
                    <option value="exactly">P(X = x)</option>
                    <option value="lessThan">P(X &lt; x)</option>
                    <option value="lessOrEqual">P(X ≤ x)</option>
                    <option value="greaterThan">P(X &gt; x)</option>
                    <option value="greaterOrEqual">P(X ≥ x)</option>
                  </Form.Select>
                </Form.Group>
              </Col>
            </Row>
            <Button variant="primary" onClick={calculateBinomial}>
              Calculate
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
                  <p><strong>Probability:</strong> {results.probability.toFixed(6)}</p>
                  <p><strong>Mean (μ):</strong> {results.mean.toFixed(4)}</p>
                </Col>
                <Col md={6}>
                  <p><strong>Variance (σ²):</strong> {results.variance.toFixed(4)}</p>
                  <p><strong>Standard Deviation (σ):</strong> {results.stdDev.toFixed(4)}</p>
                </Col>
              </Row>
            </Card.Body>
          </Card>

          <Card className="mb-4">
            <Card.Body>
              <Card.Title>Probability Mass Function</Card.Title>
              <div className="chart-container">
                <ResponsiveContainer width="100%" height={400}>
                  <LineChart data={chartData} margin={{ top: 5, right: 30, left: 20, bottom: 5 }}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis 
                      dataKey="x"
                      label={{ value: 'Number of Successes (X)', position: 'insideBottomRight', offset: -10 }}
                    />
                    <YAxis 
                      label={{ value: 'Probability P(X = x)', angle: -90, position: 'insideLeft' }}
                    />
                    <Tooltip />
                    <Legend />
                    <Line type="stepAfter" dataKey="pmf" stroke="#8884d8" name="P(X = x)" />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            </Card.Body>
          </Card>

          <Card className="explanation">
            <Card.Body>
              <Card.Title>Formulas and Explanations</Card.Title>
              <p><strong>Binomial Distribution:</strong> Models the number of successes in a fixed number of independent trials with the same probability of success.</p>
              <p><strong>PMF:</strong> P(X = k) = C(n,k) × p^k × (1-p)^(n-k)</p>
              <p><strong>Mean:</strong> μ = n × p</p>
              <p><strong>Variance:</strong> σ² = n × p × (1-p)</p>
              <p><strong>Standard Deviation:</strong> σ = √(n × p × (1-p))</p>
            </Card.Body>
          </Card>
        </>
      )}
    </div>
  );
};

// Poisson Distribution Calculator
const PoissonCalculator: React.FC = () => {
  const [lambda, setLambda] = useState<number>(5);
  const [x, setX] = useState<number>(3);
  const [calculationType, setCalculationType] = useState<string>('exactly');
  const [results, setResults] = useState<any>(null);
  const [error, setError] = useState<string>('');
  const [chartData, setChartData] = useState<any[]>([]);

  const calculatePoisson = () => {
    setError('');
    try {
      if (lambda <= 0) {
        setError('Lambda must be positive');
        return;
      }
      if (x < 0 || !Number.isInteger(x)) {
        setError('x must be a non-negative integer');
        return;
      }

      // PMF - Probability Mass Function
      const poissonPMF = (lambda: number, k: number): number => {
        return Math.exp(-lambda) * Math.pow(lambda, k) / math.factorial(k);
      };

      // CDF - Cumulative Distribution Function
      const poissonCDF = (lambda: number, k: number): number => {
        let cumulative = 0;
        for (let i = 0; i <= k; i++) {
          cumulative += poissonPMF(lambda, i);
        }
        return cumulative;
      };

      let probability: number;
      let explanation: string;

      switch (calculationType) {
        case 'exactly':
          probability = poissonPMF(lambda, x);
          explanation = `P(X = ${x}) = e^(-${lambda}) × ${lambda}^${x} / ${x}!`;
          break;
        case 'lessThan':
          probability = poissonCDF(lambda, x - 1);
          explanation = `P(X < ${x}) = P(X ≤ ${x-1}) = ∑(k=0 to ${x-1}) e^(-${lambda}) × ${lambda}^k / k!`;
          break;
        case 'lessOrEqual':
          probability = poissonCDF(lambda, x);
          explanation = `P(X ≤ ${x}) = ∑(k=0 to ${x}) e^(-${lambda}) × ${lambda}^k / k!`;
          break;
        case 'greaterThan':
          probability = 1 - poissonCDF(lambda, x);
          explanation = `P(X > ${x}) = 1 - P(X ≤ ${x}) = 1 - ∑(k=0 to ${x}) e^(-${lambda}) × ${lambda}^k / k!`;
          break;
        case 'greaterOrEqual':
          probability = 1 - poissonCDF(lambda, x - 1);
          explanation = `P(X ≥ ${x}) = 1 - P(X ≤ ${x-1}) = 1 - ∑(k=0 to ${x-1}) e^(-${lambda}) × ${lambda}^k / k!`;
          break;
        default:
          probability = 0;
          explanation = '';
      }

      // Mean, variance, and standard deviation for Poisson
      const mean = lambda;
      const variance = lambda;
      const stdDev = Math.sqrt(lambda);

      // Generate chart data for PMF
      const maxX = Math.min(Math.max(20, x + 10), Math.ceil(lambda * 3));
      const chartData = [];
      for (let k = 0; k <= maxX; k++) {
        chartData.push({
          x: k,
          pmf: poissonPMF(lambda, k)
        });
      }

      setResults({ probability, mean, variance, stdDev });
      setChartData(chartData);
    } catch (err: any) {
      setError(err.message || 'Error calculating Poisson distribution');
    }
  };

  return (
    <div>
      <Card className="mb-4">
        <Card.Body>
          <Card.Title>Poisson Distribution Calculator</Card.Title>
          <Form>
            <Row>
              <Col md={6}>
                <Form.Group className="mb-3">
                  <Form.Label>Rate parameter (λ)</Form.Label>
                  <Form.Control 
                    type="number"
                    value={lambda}
                    onChange={(e) => setLambda(parseFloat(e.target.value) || 0)}
                    step="0.1"
                    min="0.1"
                  />
                  <Form.Text className="text-muted">
                    Average rate of events per unit time/space
                  </Form.Text>
                </Form.Group>
              </Col>
              <Col md={6}>
                <Form.Group className="mb-3">
                  <Form.Label>Number of events (x)</Form.Label>
                  <Form.Control 
                    type="number"
                    value={x}
                    onChange={(e) => setX(parseInt(e.target.value) || 0)}
                    min="0"
                  />
                </Form.Group>
              </Col>
            </Row>
            <Form.Group className="mb-3">
              <Form.Label>Calculation Type</Form.Label>
              <Form.Select
                value={calculationType}
                onChange={(e) => setCalculationType(e.target.value)}
              >
                <option value="exactly">P(X = x)</option>
                <option value="lessThan">P(X &lt; x)</option>
                <option value="lessOrEqual">P(X ≤ x)</option>
                <option value="greaterThan">P(X &gt; x)</option>
                <option value="greaterOrEqual">P(X ≥ x)</option>
              </Form.Select>
            </Form.Group>
            <Button variant="primary" onClick={calculatePoisson}>
              Calculate
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
                  <p><strong>Probability:</strong> {results.probability.toFixed(6)}</p>
                  <p><strong>Mean (μ):</strong> {results.mean.toFixed(4)}</p>
                </Col>
                <Col md={6}>
                  <p><strong>Variance (σ²):</strong> {results.variance.toFixed(4)}</p>
                  <p><strong>Standard Deviation (σ):</strong> {results.stdDev.toFixed(4)}</p>
                </Col>
              </Row>
            </Card.Body>
          </Card>

          <Card className="mb-4">
            <Card.Body>
              <Card.Title>Probability Mass Function</Card.Title>
              <div className="chart-container">
                <ResponsiveContainer width="100%" height={400}>
                  <LineChart data={chartData} margin={{ top: 5, right: 30, left: 20, bottom: 5 }}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis 
                      dataKey="x"
                      label={{ value: 'Number of Events (X)', position: 'insideBottomRight', offset: -10 }}
                    />
                    <YAxis 
                      label={{ value: 'Probability P(X = x)', angle: -90, position: 'insideLeft' }}
                    />
                    <Tooltip />
                    <Legend />
                    <Line type="stepAfter" dataKey="pmf" stroke="#82ca9d" name="P(X = x)" />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            </Card.Body>
          </Card>

          <Card className="explanation">
            <Card.Body>
              <Card.Title>Formulas and Explanations</Card.Title>
              <p><strong>Poisson Distribution:</strong> Models the number of events occurring in a fixed interval of time or space, with events occurring independently at a constant rate.</p>
              <p><strong>PMF:</strong> P(X = k) = e^(-λ) × λ^k / k!</p>
              <p><strong>Mean:</strong> μ = λ</p>
              <p><strong>Variance:</strong> σ² = λ</p>
              <p><strong>Standard Deviation:</strong> σ = √λ</p>
            </Card.Body>
          </Card>
        </>
      )}
    </div>
  );
};

// Normal Distribution Calculator
const NormalCalculator: React.FC = () => {
  const [mean, setMean] = useState<number>(0);
  const [stdDev, setStdDev] = useState<number>(1);
  const [x, setX] = useState<number>(0);
  const [calculationType, setCalculationType] = useState<string>('lessThan');
  const [results, setResults] = useState<any>(null);
  const [error, setError] = useState<string>('');
  const [chartData, setChartData] = useState<any[]>([]);

  const calculateNormal = () => {
    setError('');
    try {
      if (stdDev <= 0) {
        setError('Standard deviation must be positive');
        return;
      }

      // Standard normal CDF (using error function approximation)
      const normalCDF = (z: number): number => {
        return 0.5 * (1 + math.erf(z / Math.sqrt(2)));
      };

      // Normal PDF
      const normalPDF = (x: number, mean: number, stdDev: number): number => {
        return (1 / (stdDev * Math.sqrt(2 * Math.PI))) * 
               Math.exp(-0.5 * Math.pow((x - mean) / stdDev, 2));
      };

      // Z-score
      const zScore = (x - mean) / stdDev;
      
      let probability: number;
      let explanation: string;

      switch (calculationType) {
        case 'lessThan':
          probability = normalCDF(zScore);
          explanation = `P(X < ${x}) = Φ((${x} - ${mean}) / ${stdDev}) = Φ(${zScore.toFixed(4)})`;
          break;
        case 'greaterThan':
          probability = 1 - normalCDF(zScore);
          explanation = `P(X > ${x}) = 1 - Φ((${x} - ${mean}) / ${stdDev}) = 1 - Φ(${zScore.toFixed(4)})`;
          break;
        case 'between':
          const x2 = parseFloat(prompt('Enter the upper bound for the range:', '1') || '1');
          const z2 = (x2 - mean) / stdDev;
          probability = normalCDF(z2) - normalCDF(zScore);
          explanation = `P(${x} < X < ${x2}) = Φ((${x2} - ${mean}) / ${stdDev}) - Φ((${x} - ${mean}) / ${stdDev}) = Φ(${z2.toFixed(4)}) - Φ(${zScore.toFixed(4)})`;
          break;
        default:
          probability = 0;
          explanation = '';
      }

      // Generate chart data for PDF
      const chartData = [];
      const rangeMin = mean - 4 * stdDev;
      const rangeMax = mean + 4 * stdDev;
      const step = (rangeMax - rangeMin) / 100;
      
      for (let i = 0; i <= 100; i++) {
        const xVal = rangeMin + i * step;
        chartData.push({
          x: xVal,
          pdf: normalPDF(xVal, mean, stdDev)
        });
      }

      setResults({ probability, zScore, mean, variance: stdDev * stdDev });
      setChartData(chartData);
    } catch (err: any) {
      setError(err.message || 'Error calculating normal distribution');
    }
  };

  return (
    <div>
      <Card className="mb-4">
        <Card.Body>
          <Card.Title>Normal Distribution Calculator</Card.Title>
          <Form>
            <Row>
              <Col md={6}>
                <Form.Group className="mb-3">
                  <Form.Label>Mean (μ)</Form.Label>
                  <Form.Control 
                    type="number"
                    value={mean}
                    onChange={(e) => setMean(parseFloat(e.target.value) || 0)}
                    step="0.1"
                  />
                </Form.Group>
              </Col>
              <Col md={6}>
                <Form.Group className="mb-3">
                  <Form.Label>Standard Deviation (σ)</Form.Label>
                  <Form.Control 
                    type="number"
                    value={stdDev}
                    onChange={(e) => setStdDev(parseFloat(e.target.value) || 0.1)}
                    step="0.1"
                    min="0.1"
                  />
                </Form.Group>
              </Col>
            </Row>
            <Row>
              <Col md={6}>
                <Form.Group className="mb-3">
                  <Form.Label>X value</Form.Label>
                  <Form.Control 
                    type="number"
                    value={x}
                    onChange={(e) => setX(parseFloat(e.target.value) || 0)}
                    step="0.1"
                  />
                </Form.Group>
              </Col>
              <Col md={6}>
                <Form.Group className="mb-3">
                  <Form.Label>Calculation Type</Form.Label>
                  <Form.Select
                    value={calculationType}
                    onChange={(e) => setCalculationType(e.target.value)}
                  >
                    <option value="lessThan">P(X &lt; x)</option>
                    <option value="greaterThan">P(X &gt; x)</option>
                    <option value="between">P(x &lt; X &lt; y)</option>
                  </Form.Select>
                </Form.Group>
              </Col>
            </Row>
            <Button variant="primary" onClick={calculateNormal}>
              Calculate
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
                  <p><strong>Probability:</strong> {results.probability.toFixed(6)}</p>
                  <p><strong>Z-score:</strong> {results.zScore.toFixed(4)}</p>
                </Col>
                <Col md={6}>
                  <p><strong>Mean (μ):</strong> {results.mean.toFixed(4)}</p>
                  <p><strong>Variance (σ²):</strong> {results.variance.toFixed(4)}</p>
                </Col>
              </Row>
            </Card.Body>
          </Card>

          <Card className="mb-4">
            <Card.Body>
              <Card.Title>Probability Density Function</Card.Title>
              <div className="chart-container">
                <ResponsiveContainer width="100%" height={400}>
                  <LineChart data={chartData} margin={{ top: 5, right: 30, left: 20, bottom: 5 }}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis 
                      dataKey="x"
                      domain={['dataMin', 'dataMax']} 
                      label={{ value: 'X', position: 'insideBottomRight', offset: -10 }}
                    />
                    <YAxis 
                      label={{ value: 'Density', angle: -90, position: 'insideLeft' }}
                    />
                    <Tooltip />
                    <Legend />
                    <Line type="monotone" dataKey="pdf" stroke="#8884d8" name="f(x)" dot={false} />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            </Card.Body>
          </Card>

          <Card className="explanation">
            <Card.Body>
              <Card.Title>Formulas and Explanations</Card.Title>
              <p><strong>Normal Distribution:</strong> A continuous probability distribution where data clusters around the mean.</p>
              <p><strong>PDF:</strong> f(x) = (1 / (σ√2π)) × e^(-(x-μ)²/2σ²)</p>
              <p><strong>Z-score:</strong> z = (x - μ) / σ</p>
              <p><strong>Mean:</strong> μ</p>
              <p><strong>Variance:</strong> σ²</p>
              <p><strong>Standard Deviation:</strong> σ</p>
              <p><strong>CDF:</strong> P(X ≤ x) = Φ((x - μ) / σ)</p>
            </Card.Body>
          </Card>
        </>
      )}
    </div>
  );
};

// Exponential Distribution Calculator
const ExponentialCalculator: React.FC = () => {
  const [rate, setRate] = useState<number>(0.5);
  const [x, setX] = useState<number>(2);
  const [calculationType, setCalculationType] = useState<string>('lessThan');
  const [results, setResults] = useState<any>(null);
  const [error, setError] = useState<string>('');
  const [chartData, setChartData] = useState<any[]>([]);

  const calculateExponential = () => {
    setError('');
    try {
      if (rate <= 0) {
        setError('Rate parameter must be positive');
        return;
      }
      if (x < 0) {
        setError('x must be non-negative for exponential distributions');
        return;
      }

      // PDF - Probability Density Function
      const exponentialPDF = (lambda: number, x: number): number => {
        return lambda * Math.exp(-lambda * x);
      };

      // CDF - Cumulative Distribution Function
      const exponentialCDF = (lambda: number, x: number): number => {
        return 1 - Math.exp(-lambda * x);
      };

      let probability: number;
      let explanation: string;

      switch (calculationType) {
        case 'lessThan':
          probability = exponentialCDF(rate, x);
          explanation = `P(X < ${x}) = 1 - e^(-${rate} × ${x})`;
          break;
        case 'greaterThan':
          probability = 1 - exponentialCDF(rate, x);
          explanation = `P(X > ${x}) = e^(-${rate} × ${x})`;
          break;
        case 'between':
          const x2 = parseFloat(prompt('Enter the upper bound for the range:', '3') || '3');
          probability = exponentialCDF(rate, x2) - exponentialCDF(rate, x);
          explanation = `P(${x} < X < ${x2}) = (1 - e^(-${rate} × ${x2})) - (1 - e^(-${rate} × ${x})) = e^(-${rate} × ${x}) - e^(-${rate} × ${x2})`;
          break;
        default:
          probability = 0;
          explanation = '';
      }

      // Mean, variance, and standard deviation for exponential
      const mean = 1 / rate;
      const variance = 1 / (rate * rate);
      const stdDev = Math.sqrt(variance);

      // Generate chart data for PDF
      const chartData = [];
      const maxX = Math.min(20, x + 10);
      const step = maxX / 100;
      
      for (let i = 0; i <= 100; i++) {
        const xVal = i * step;
        chartData.push({
          x: xVal,
          pdf: exponentialPDF(rate, xVal)
        });
      }

      setResults({ probability, mean, variance, stdDev });
      setChartData(chartData);
    } catch (err: any) {
      setError(err.message || 'Error calculating exponential distribution');
    }
  };

  return (
    <div>
      <Card className="mb-4">
        <Card.Body>
          <Card.Title>Exponential Distribution Calculator</Card.Title>
          <Form>
            <Row>
              <Col md={6}>
                <Form.Group className="mb-3">
                  <Form.Label>Rate parameter (λ)</Form.Label>
                  <Form.Control 
                    type="number"
                    value={rate}
                    onChange={(e) => setRate(parseFloat(e.target.value) || 0.1)}
                    step="0.1"
                    min="0.1"
                  />
                  <Form.Text className="text-muted">
                    Rate parameter (events per unit time)
                  </Form.Text>
                </Form.Group>
              </Col>
              <Col md={6}>
                <Form.Group className="mb-3">
                  <Form.Label>X value</Form.Label>
                  <Form.Control 
                    type="number"
                    value={x}
                    onChange={(e) => setX(parseFloat(e.target.value) || 0)}
                    step="0.1"
                    min="0"
                  />
                  <Form.Text className="text-muted">
                    Time or distance until event occurs
                  </Form.Text>
                </Form.Group>
              </Col>
            </Row>
            <Form.Group className="mb-3">
              <Form.Label>Calculation Type</Form.Label>
              <Form.Select
                value={calculationType}
                onChange={(e) => setCalculationType(e.target.value)}
              >
                <option value="lessThan">P(X &lt; x)</option>
                <option value="greaterThan">P(X &gt; x)</option>
                <option value="between">P(x &lt; X &lt; y)</option>
              </Form.Select>
            </Form.Group>
            <Button variant="primary" onClick={calculateExponential}>
              Calculate
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
                  <p><strong>Probability:</strong> {results.probability.toFixed(6)}</p>
                  <p><strong>Mean (μ):</strong> {results.mean.toFixed(4)}</p>
                </Col>
                <Col md={6}>
                  <p><strong>Variance (σ²):</strong> {results.variance.toFixed(4)}</p>
                  <p><strong>Standard Deviation (σ):</strong> {results.stdDev.toFixed(4)}</p>
                </Col>
              </Row>
            </Card.Body>
          </Card>

          <Card className="mb-4">
            <Card.Body>
              <Card.Title>Probability Density Function</Card.Title>
              <div className="chart-container">
                <ResponsiveContainer width="100%" height={400}>
                  <LineChart data={chartData} margin={{ top: 5, right: 30, left: 20, bottom: 5 }}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis 
                      dataKey="x"
                      label={{ value: 'X', position: 'insideBottomRight', offset: -10 }}
                    />
                    <YAxis 
                      label={{ value: 'Density', angle: -90, position: 'insideLeft' }}
                    />
                    <Tooltip />
                    <Legend />
                    <Line type="monotone" dataKey="pdf" stroke="#ff7300" name="f(x)" dot={false} />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            </Card.Body>
          </Card>

          <Card className="explanation">
            <Card.Body>
              <Card.Title>Formulas and Explanations</Card.Title>
              <p><strong>Exponential Distribution:</strong> Models the time between events in a Poisson process, or the time until an event occurs.</p>
              <p><strong>PDF:</strong> f(x) = λe^(-λx) for x ≥ 0</p>
              <p><strong>CDF:</strong> F(x) = 1 - e^(-λx) for x ≥ 0</p>
              <p><strong>Mean:</strong> μ = 1/λ</p>
              <p><strong>Variance:</strong> σ² = 1/λ²</p>
              <p><strong>Standard Deviation:</strong> σ = 1/λ</p>
            </Card.Body>
          </Card>
        </>
      )}
    </div>
  );
};

export default ProbabilityDistributions; 