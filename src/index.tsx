import React, { useState } from 'react';
import ReactDOM from 'react-dom/client';
import './index.css';
import 'bootstrap/dist/css/bootstrap.min.css';
import 'bootstrap-icons/font/bootstrap-icons.css';
import { Container, Tabs, Tab, Form, Button, Card, Row, Col, Alert, Badge } from 'react-bootstrap';
import * as math from 'mathjs';
import { BarChart, Bar, LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, PieChart, Pie, Cell, ScatterChart, Scatter } from 'recharts';

// Modern color palette
const COLORS = ['#3366CC', '#DC3912', '#FF9900', '#109618', '#990099', '#0099C6', '#DD4477', '#66AA00'];

// Gradient backgrounds
const GRADIENTS = {
  primary: 'linear-gradient(135deg, #6a11cb 0%, #2575fc 100%)',
  secondary: 'linear-gradient(135deg, #f093fb 0%, #f5576c 100%)',
  success: 'linear-gradient(135deg, #43e97b 0%, #38f9d7 100%)',
  info: 'linear-gradient(135deg, #0acffe 0%, #495aff 100%)',
  warning: 'linear-gradient(135deg, #f6d365 0%, #fda085 100%)',
};

function SimpleStatistics() {
  const [data, setData] = useState<string>('');
  const [results, setResults] = useState<any>(null);
  const [error, setError] = useState<string>('');
  const [chartType, setChartType] = useState<string>('histogram');

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

  const calculateStats = () => {
    setError('');
    try {
      const parsedData = parseData(data);
      
      if (parsedData.length === 0) {
        setError('Please enter valid numeric data separated by commas or spaces');
        return;
      }

      // Sort data for calculations
      const sortedData = [...parsedData].sort((a, b) => a - b);
      
      // Calculate basic statistics using math.js
      const sum = Number(math.sum(parsedData));
      const mean = Number(math.mean(parsedData));
      const median = Number(math.median(parsedData));
      const min = Number(math.min(parsedData));
      const max = Number(math.max(parsedData));
      const variance = Number(math.variance(parsedData, 'uncorrected'));
      const stdDev = Number(math.std(parsedData, 'uncorrected'));

      // Calculate mode
      const freqMap: Record<number, number> = {};
      let maxFreq = 0;
      let modes: number[] = [];
      parsedData.forEach(num => {
        freqMap[num] = (freqMap[num] || 0) + 1;
        if (freqMap[num] > maxFreq) {
          maxFreq = freqMap[num];
          modes = [num];
        } else if (freqMap[num] === maxFreq) {
          modes.push(num);
        }
      });

      // Calculate quartiles
      const q1Index = Math.floor(sortedData.length * 0.25);
      const q3Index = Math.floor(sortedData.length * 0.75);
      const q1 = sortedData.length % 4 === 0 
        ? (sortedData[q1Index - 1] + sortedData[q1Index]) / 2 
        : sortedData[q1Index];
      const q3 = sortedData.length % 4 === 0 
        ? (sortedData[q3Index - 1] + sortedData[q3Index]) / 2 
        : sortedData[q3Index];
      const iqr = q3 - q1;

      // Prepare histogram data
      const histogramData = prepareHistogramData(parsedData);
      
      // Prepare box plot data
      const boxPlotData = [
        { name: "Min", value: min },
        { name: "Q1", value: q1 },
        { name: "Median", value: median },
        { name: "Q3", value: q3 },
        { name: "Max", value: max }
      ];

      // Prepare normal distribution data for visualization
      const normalDistData = generateNormalDistribution(mean, stdDev, min, max);

      setResults({
        count: parsedData.length,
        sum,
        mean,
        median,
        mode: modes.length > 0 && maxFreq > 1 ? modes : 'No mode',
        min,
        max,
        range: max - min,
        variance,
        stdDev,
        q1,
        q3,
        iqr,
        histogramData,
        boxPlotData,
        normalDistData,
        rawData: parsedData
      });
    } catch (err: any) {
      setError(err.message || 'Error calculating statistics');
    }
  };

  // Create histogram data
  const prepareHistogramData = (data: number[]): any[] => {
    const min = math.min(data);
    const max = math.max(data);
    const range = max - min;
    // Calculate optimal bin count using Sturges' formula
    const binCount = Math.ceil(Math.log2(data.length)) + 1;
    const binWidth = range / binCount;
    
    // Initialize bins
    const bins: number[] = Array(binCount).fill(0);
    const binLabels: string[] = Array(binCount).fill('');
    
    // Fill bins
    for (let i = 0; i < binCount; i++) {
      const lowerBound = min + i * binWidth;
      const upperBound = lowerBound + binWidth;
      binLabels[i] = `${lowerBound.toFixed(1)}-${upperBound.toFixed(1)}`;
    }
    
    // Count values in each bin
    data.forEach(value => {
      if (value === max) { // Handle the maximum value
        bins[binCount - 1]++;
      } else {
        const binIndex = Math.floor((value - min) / binWidth);
        bins[binIndex]++;
      }
    });
    
    // Create data for chart
    return bins.map((count, index) => ({
      bin: binLabels[index],
      count: count
    }));
  };

  // Generate normal distribution curve data
  const generateNormalDistribution = (mean: number, stdDev: number, min: number, max: number): any[] => {
    const points = 100;
    const data = [];
    const range = max - min;
    const step = range / points;
    
    for (let i = 0; i <= points; i++) {
      const x = min + i * step;
      const y = (1 / (stdDev * Math.sqrt(2 * Math.PI))) * 
                Math.exp(-0.5 * Math.pow((x - mean) / stdDev, 2));
      data.push({ x, y });
    }
    
    return data;
  };

  // Format number for display
  const formatNumber = (num: number): string => {
    return num.toFixed(4);
  };

  // Render the appropriate chart based on user selection
  const renderChart = () => {
    if (!results) return null;
    
    switch (chartType) {
      case 'histogram':
        return (
          <div className="chart-container">
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={results.histogramData} margin={{ top: 20, right: 30, left: 20, bottom: 50 }}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis 
                  dataKey="bin" 
                  angle={-45} 
                  textAnchor="end" 
                  height={70} 
                  tick={{ fontSize: 12 }}
                  label={{ value: "Value Range", position: "insideBottom", offset: -5 }}
                />
                <YAxis label={{ value: "Frequency", angle: -90, position: "insideLeft" }} />
                <Tooltip formatter={(value: any) => [`Frequency: ${value}`, ""]} />
                <Legend />
                <Bar dataKey="count" name="Frequency" fill="#8884d8">
                  {
                    results.histogramData.map((_: any, index: number) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))
                  }
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        );
        
      case 'boxplot':
        return (
          <div className="chart-container">
            <ResponsiveContainer width="100%" height={300}>
              <BarChart 
                layout="vertical"
                data={results.boxPlotData} 
                margin={{ top: 20, right: 30, left: 80, bottom: 20 }}
              >
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis type="number" domain={[results.min - (results.range * 0.1), results.max + (results.range * 0.1)]} />
                <YAxis 
                  type="category" 
                  dataKey="name" 
                  tick={{ fontSize: 14 }}
                  width={80}
                />
                <Tooltip formatter={(value: any) => [`${value}`, ""]} />
                <Legend />
                <Bar dataKey="value" name="Value" fill="#82ca9d" barSize={30} />
              </BarChart>
            </ResponsiveContainer>
            
            <div className="text-center mt-3">
              <p><strong>Box Plot Elements:</strong> Min, Q1 (25%), Median (50%), Q3 (75%), Max</p>
            </div>
          </div>
        );
        
      case 'normal':
        return (
          <div className="chart-container">
            <ResponsiveContainer width="100%" height={300}>
              <LineChart data={results.normalDistData} margin={{ top: 20, right: 30, left: 20, bottom: 20 }}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="x" label={{ value: "Value", position: "insideBottom", offset: -5 }} />
                <YAxis label={{ value: "Density", angle: -90, position: "insideLeft" }} />
                <Tooltip formatter={(value: any) => [value.toFixed(6), "Density"]} />
                <Legend />
                <Line type="monotone" dataKey="y" name="Normal Distribution" stroke="#FF8042" dot={false} />
              </LineChart>
            </ResponsiveContainer>
            
            <div className="text-center mt-3">
              <p className="formula">
                <strong>Normal Distribution Formula:</strong> f(x) = (1/σ√2π) · e<sup>-(x-μ)²/2σ²</sup>
              </p>
            </div>
          </div>
        );
        
      case 'pie':
        // Group data into bins for the pie chart
        const bins = 5;
        const range = results.max - results.min;
        const binWidth = range / bins;
        const pieData = Array(bins).fill(0).map((_, i) => {
          const lowerBound = results.min + i * binWidth;
          const upperBound = lowerBound + binWidth;
          const count = results.rawData.filter(
            (val: number) => val >= lowerBound && (i === bins - 1 ? val <= upperBound : val < upperBound)
          ).length;
          return {
            name: `${lowerBound.toFixed(2)} - ${upperBound.toFixed(2)}`,
            value: count
          };
        });
        
        return (
          <div className="chart-container">
            <ResponsiveContainer width="100%" height={300}>
              <PieChart>
                <Pie
                  data={pieData}
                  cx="50%"
                  cy="50%"
                  outerRadius={100}
                  fill="#8884d8"
                  dataKey="value"
                  nameKey="name"
                  label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
                >
                  {
                    pieData.map((_: any, index: number) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))
                  }
                </Pie>
                <Tooltip formatter={(value: any) => [`Count: ${value}`, ""]} />
                <Legend layout="vertical" align="right" verticalAlign="middle" />
              </PieChart>
            </ResponsiveContainer>
          </div>
        );
        
      default:
        return null;
    }
  };

  return (
    <div>
      <Card className="mb-4 shadow-sm">
        <Card.Body>
          <Card.Title className="d-flex align-items-center">
            <i className="bi bi-calculator-fill me-2 text-primary"></i>
            <span>Basic Statistics Calculator</span>
          </Card.Title>
          
          <Form className="mt-3">
            <Form.Group className="mb-3">
              <Form.Label>
                <i className="bi bi-input-cursor-text me-2"></i>
                Enter your data (comma or space separated numbers)
              </Form.Label>
              <Form.Control
                as="textarea"
                rows={3}
                value={data}
                onChange={(e) => setData(e.target.value)}
                placeholder="Example: 12, 15, 18, 22, 30, 31, 35, 40, 41, 42, 43, 55"
                className="shadow-sm"
              />
              <Form.Text className="text-muted">
                <i className="bi bi-info-circle me-1"></i>
                Enter numeric values separated by commas, spaces, or line breaks
              </Form.Text>
            </Form.Group>
            <div className="d-grid gap-2 d-md-flex justify-content-md-end">
              <Button variant="primary" onClick={calculateStats} className="px-4">
                <i className="bi bi-lightning-fill me-2"></i>
                Calculate Statistics
              </Button>
            </div>
          </Form>
        </Card.Body>
      </Card>

      {error && (
        <Alert variant="danger" className="shadow-sm">
          <i className="bi bi-exclamation-triangle-fill me-2"></i>
          {error}
        </Alert>
      )}

      {results && (
        <>
          <Card className="result-card mb-4 shadow-sm">
            <Card.Header style={{ background: 'linear-gradient(90deg, #6a11cb, #2575fc)', color: 'white', borderRadius: '10px 10px 0 0' }}>
              <h5 className="mb-0">
                <i className="bi bi-clipboard-data me-2"></i>
                Summary Statistics
              </h5>
            </Card.Header>
            <Card.Body>
              <Row>
                <Col md={6}>
                  <p><i className="bi bi-hash me-2 text-primary"></i><strong>Count:</strong> {results.count}</p>
                  <p><i className="bi bi-plus me-2 text-primary"></i><strong>Sum:</strong> {formatNumber(results.sum)}</p>
                  <p><i className="bi bi-calculator me-2 text-primary"></i><strong>Mean (μ):</strong> {formatNumber(results.mean)}</p>
                  <p><i className="bi bi-arrow-down-up me-2 text-primary"></i><strong>Median:</strong> {formatNumber(results.median)}</p>
                  <p><i className="bi bi-bar-chart-line me-2 text-primary"></i><strong>Mode:</strong> {Array.isArray(results.mode) ? results.mode.map(formatNumber).join(', ') : results.mode}</p>
                </Col>
                <Col md={6}>
                  <p><i className="bi bi-caret-down me-2 text-primary"></i><strong>Minimum:</strong> {formatNumber(results.min)}</p>
                  <p><i className="bi bi-caret-up me-2 text-primary"></i><strong>Maximum:</strong> {formatNumber(results.max)}</p>
                  <p><i className="bi bi-arrows-expand me-2 text-primary"></i><strong>Range:</strong> {formatNumber(results.range)}</p>
                  <p><i className="bi bi-distribute-vertical me-2 text-primary"></i><strong>Variance (σ²):</strong> {formatNumber(results.variance)}</p>
                  <p><i className="bi bi-diagram-3 me-2 text-primary"></i><strong>Standard Deviation (σ):</strong> {formatNumber(results.stdDev)}</p>
                </Col>
              </Row>

              <div className="mt-3 pt-3" style={{ borderTop: '1px solid #eee' }}>
                <Card.Subtitle className="mb-2">
                  <i className="bi bi-box me-2"></i>
                  Quartiles & Interquartile Range
                </Card.Subtitle>
                <Row className="mt-3">
                  <Col md={6}>
                    <p><i className="bi bi-arrow-bar-down me-2 text-primary"></i><strong>Q1 (25%):</strong> {formatNumber(results.q1)}</p>
                    <p><i className="bi bi-arrow-bar-up me-2 text-primary"></i><strong>Q3 (75%):</strong> {formatNumber(results.q3)}</p>
                  </Col>
                  <Col md={6}>
                    <p><i className="bi bi-arrows-collapse me-2 text-primary"></i><strong>IQR:</strong> {formatNumber(results.iqr)}</p>
                  </Col>
                </Row>
              </div>
            </Card.Body>
          </Card>

          <Card className="mb-4 shadow-sm">
            <Card.Header style={{ background: 'linear-gradient(90deg, #FF8042, #FFC107)', color: 'white', borderRadius: '10px 10px 0 0' }}>
              <h5 className="mb-0 d-flex align-items-center justify-content-between">
                <span>
                  <i className="bi bi-bar-chart me-2"></i>
                  Data Visualization
                </span>
                <div>
                  <Button 
                    variant={chartType === 'histogram' ? 'light' : 'outline-light'} 
                    size="sm"
                    className="me-2"
                    onClick={() => setChartType('histogram')}
                  >
                    <i className="bi bi-bar-chart-steps me-1"></i>
                    Histogram
                  </Button>
                  <Button 
                    variant={chartType === 'boxplot' ? 'light' : 'outline-light'} 
                    size="sm"
                    className="me-2"
                    onClick={() => setChartType('boxplot')}
                  >
                    <i className="bi bi-box me-1"></i>
                    Box Plot
                  </Button>
                  <Button 
                    variant={chartType === 'normal' ? 'light' : 'outline-light'} 
                    size="sm"
                    className="me-2"
                    onClick={() => setChartType('normal')}
                  >
                    <i className="bi bi-activity me-1"></i>
                    Normal Curve
                  </Button>
                  <Button 
                    variant={chartType === 'pie' ? 'light' : 'outline-light'} 
                    size="sm"
                    onClick={() => setChartType('pie')}
                  >
                    <i className="bi bi-pie-chart me-1"></i>
                    Pie Chart
                  </Button>
                </div>
              </h5>
            </Card.Header>
            <Card.Body>
              <div className="mt-2">
                {renderChart()}
              </div>
            </Card.Body>
          </Card>

          <Card className="mb-4 shadow-sm">
            <Card.Header style={{ background: 'linear-gradient(90deg, #43e97b, #38f9d7)', color: 'white', borderRadius: '10px 10px 0 0' }}>
              <h5 className="mb-0">
                <i className="bi bi-journal-code me-2"></i>
                Formulas Used
              </h5>
            </Card.Header>
            <Card.Body className="bg-light">
              <Row>
                <Col md={6}>
                  <div className="formula-card p-3 mb-3">
                    <Badge bg="primary" className="mb-2">Mean</Badge>
                    <p className="formula">μ = ∑x<sub>i</sub> / n</p>
                  </div>
                  <div className="formula-card p-3 mb-3">
                    <Badge bg="primary" className="mb-2">Variance</Badge>
                    <p className="formula">σ² = ∑(x<sub>i</sub> - μ)² / n</p>
                  </div>
                  <div className="formula-card p-3 mb-3">
                    <Badge bg="primary" className="mb-2">Standard Deviation</Badge>
                    <p className="formula">σ = √σ²</p>
                  </div>
                </Col>
                <Col md={6}>
                  <div className="formula-card p-3 mb-3">
                    <Badge bg="primary" className="mb-2">Median</Badge>
                    <p className="formula">Middle value of the ordered data</p>
                  </div>
                  <div className="formula-card p-3 mb-3">
                    <Badge bg="primary" className="mb-2">Interquartile Range</Badge>
                    <p className="formula">IQR = Q3 - Q1</p>
                  </div>
                  <div className="formula-card p-3 mb-3">
                    <Badge bg="primary" className="mb-2">Normal Distribution</Badge>
                    <p className="formula">f(x) = (1/σ√2π) · e<sup>-(x-μ)²/2σ²</sup></p>
                  </div>
                </Col>
              </Row>
            </Card.Body>
          </Card>
        </>
      )}
    </div>
  );
}

// Probability Distribution Component
function ProbabilityDistribution() {
  const [selectedDistribution, setSelectedDistribution] = useState<string>('');
  const [showContent, setShowContent] = useState<boolean>(false);
  const [results, setResults] = useState<any>(null);
  const [showCDF, setShowCDF] = useState<boolean>(false);
  
  // Parameters for different distributions
  const [binomialParams, setBinomialParams] = useState({ n: 10, p: 0.5 });
  const [poissonParams, setPoissonParams] = useState({ lambda: 5 });
  const [normalParams, setNormalParams] = useState({ mean: 0, stdDev: 1 });
  const [exponentialParams, setExponentialParams] = useState({ lambda: 1 });
  
  const handleDistributionSelect = (distribution: string) => {
    setSelectedDistribution(distribution);
    setShowContent(true);
    setResults(null);
  };
  
  const calculateDistribution = () => {
    try {
      if (selectedDistribution === 'binomial') {
        const { n, p } = binomialParams;
        
        // Calculate PMF for values 0 to n
        const pmfData = [];
        let cumulativeProb = 0;
        
        for (let k = 0; k <= n; k++) {
          const probability = math.combinations(n, k) * Math.pow(p, k) * Math.pow(1 - p, n - k);
          cumulativeProb += probability;
          
          pmfData.push({
            x: k,
            pmf: probability,
            cdf: cumulativeProb
          });
        }
        
        // Calculate mean and variance
        const mean = n * p;
        const variance = n * p * (1 - p);
        
        setResults({
          pmfData,
          mean,
          variance,
          stdDev: Math.sqrt(variance)
        });
      } 
      else if (selectedDistribution === 'poisson') {
        const { lambda } = poissonParams;
        
        // Calculate PMF for reasonable range (up to lambda + 3*sqrt(lambda))
        const maxX = Math.ceil(lambda + 3 * Math.sqrt(lambda));
        const pmfData = [];
        let cumulativeProb = 0;
        
        for (let k = 0; k <= maxX; k++) {
          const probability = Math.exp(-lambda) * Math.pow(lambda, k) / math.factorial(k);
          cumulativeProb += probability;
          
          pmfData.push({
            x: k,
            pmf: probability,
            cdf: cumulativeProb
          });
        }
        
        setResults({
          pmfData,
          mean: lambda,
          variance: lambda,
          stdDev: Math.sqrt(lambda)
        });
      } 
      else if (selectedDistribution === 'normal') {
        const { mean, stdDev } = normalParams;
        
        // Create points for the normal distribution curve
        const pdfData = [];
        const min = mean - 4 * stdDev;
        const max = mean + 4 * stdDev;
        const step = (max - min) / 100;
        
        for (let x = min; x <= max; x += step) {
          const z = (x - mean) / stdDev;
          const pdf = (1 / (stdDev * Math.sqrt(2 * Math.PI))) * 
                    Math.exp(-0.5 * z * z);
          
          // Using math.js erf for the CDF computation
          const cdf = 0.5 * (1 + math.erf((x - mean) / (stdDev * Math.sqrt(2))));
          
          pdfData.push({
            x,
            pdf,
            cdf
          });
        }
        
        setResults({
          pdfData,
          mean,
          variance: stdDev * stdDev,
          stdDev
        });
      } 
      else if (selectedDistribution === 'exponential') {
        const { lambda } = exponentialParams;
        
        // Create points for the exponential distribution curve
        const pdfData = [];
        const max = 5 / lambda; // Display about 5 times the mean (1/lambda)
        const step = max / 100;
        
        for (let x = 0; x <= max; x += step) {
          const pdf = lambda * Math.exp(-lambda * x);
          const cdf = 1 - Math.exp(-lambda * x);
          
          pdfData.push({
            x,
            pdf,
            cdf
          });
        }
        
        setResults({
          pdfData,
          mean: 1 / lambda,
          variance: 1 / (lambda * lambda),
          stdDev: 1 / lambda
        });
      }
    } catch (err: any) {
      console.error('Calculation error:', err);
    }
  };
  
  const renderDistributionChart = () => {
    if (!results) return null;
    
    const toggleButtons = (
      <div className="text-center mb-4">
        <div className="btn-group">
          <Button 
            variant={!showCDF ? "primary" : "outline-primary"} 
            onClick={() => setShowCDF(false)}
          >
            {selectedDistribution === 'normal' || selectedDistribution === 'exponential' ? 
              'Probability Density Function' : 'Probability Mass Function'}
          </Button>
          <Button 
            variant={showCDF ? "primary" : "outline-primary"} 
            onClick={() => setShowCDF(true)}
          >
            Cumulative Distribution Function
          </Button>
        </div>
      </div>
    );
    
    switch (selectedDistribution) {
      case 'binomial':
      case 'poisson':
        return (
          <div className="chart-container">
            {toggleButtons}
            
            {!showCDF ? (
              // Show PMF
              <>
                <h5 className="text-center mb-3">Probability Mass Function</h5>
                <ResponsiveContainer width="100%" height={300}>
                  <BarChart data={results.pmfData} margin={{ top: 20, right: 30, left: 20, bottom: 20 }}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="x" label={{ value: "k", position: "insideBottom", offset: -5 }} />
                    <YAxis label={{ value: "Probability", angle: -90, position: "insideLeft" }} />
                    <Tooltip
                      formatter={(value: any) => [value.toFixed(6), "Probability"]}
                      labelFormatter={(label) => `k = ${label}`}
                    />
                    <Bar dataKey="pmf" name="P(X = k)" fill="#8884d8" />
                  </BarChart>
                </ResponsiveContainer>
              </>
            ) : (
              // Show CDF
              <>
                <h5 className="text-center mb-3">Cumulative Distribution Function</h5>
                <ResponsiveContainer width="100%" height={300}>
                  <LineChart data={results.pmfData} margin={{ top: 20, right: 30, left: 20, bottom: 20 }}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="x" label={{ value: "k", position: "insideBottom", offset: -5 }} />
                    <YAxis domain={[0, 1]} label={{ value: "Probability", angle: -90, position: "insideLeft" }} />
                    <Tooltip 
                      formatter={(value: any) => [value.toFixed(6), "Probability"]}
                      labelFormatter={(label) => `k ≤ ${label}`}
                    />
                    <Line type="stepAfter" dataKey="cdf" name="P(X ≤ k)" stroke="#82ca9d" dot={false} />
                  </LineChart>
                </ResponsiveContainer>
              </>
            )}
          </div>
        );
      
      case 'normal':
      case 'exponential':
        const dataKey = selectedDistribution === 'normal' ? 'pdfData' : 'pdfData';
        return (
          <div className="chart-container">
            {toggleButtons}
            
            {!showCDF ? (
              // Show PDF
              <>
                <h5 className="text-center mb-3">Probability Density Function</h5>
                <ResponsiveContainer width="100%" height={300}>
                  <LineChart data={results[dataKey]} margin={{ top: 20, right: 30, left: 20, bottom: 20 }}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="x" label={{ value: "x", position: "insideBottom", offset: -5 }} />
                    <YAxis label={{ value: "Density", angle: -90, position: "insideLeft" }} />
                    <Tooltip 
                      formatter={(value: any) => [value.toFixed(6), "Density"]}
                    />
                    <Line type="monotone" dataKey="pdf" name="f(x)" stroke="#8884d8" dot={false} />
                  </LineChart>
                </ResponsiveContainer>
              </>
            ) : (
              // Show CDF
              <>
                <h5 className="text-center mb-3">Cumulative Distribution Function</h5>
                <ResponsiveContainer width="100%" height={300}>
                  <LineChart data={results[dataKey]} margin={{ top: 20, right: 30, left: 20, bottom: 20 }}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="x" label={{ value: "x", position: "insideBottom", offset: -5 }} />
                    <YAxis domain={[0, 1]} label={{ value: "Probability", angle: -90, position: "insideLeft" }} />
                    <Tooltip 
                      formatter={(value: any) => [value.toFixed(6), "Probability"]}
                    />
                    <Line type="monotone" dataKey="cdf" name="F(x)" stroke="#82ca9d" dot={false} />
                  </LineChart>
                </ResponsiveContainer>
              </>
            )}
          </div>
        );
      
      default:
        return null;
    }
  };
  
  const renderSummaryStats = () => {
    if (!results) return null;
    
    return (
      <Card className="mb-4 shadow-sm">
        <Card.Header style={{ background: GRADIENTS.secondary, color: 'white', borderRadius: '10px 10px 0 0' }}>
          <h5 className="mb-0">
            <i className="bi bi-clipboard-data me-2"></i>
            Distribution Summary Statistics
          </h5>
        </Card.Header>
        <Card.Body>
          <Row>
            <Col md={4}>
              <p><i className="bi bi-calculator me-2 text-primary"></i><strong>Mean (μ):</strong> {results.mean.toFixed(4)}</p>
            </Col>
            <Col md={4}>
              <p><i className="bi bi-distribute-vertical me-2 text-primary"></i><strong>Variance (σ²):</strong> {results.variance.toFixed(4)}</p>
            </Col>
            <Col md={4}>
              <p><i className="bi bi-diagram-3 me-2 text-primary"></i><strong>Standard Deviation (σ):</strong> {results.stdDev.toFixed(4)}</p>
            </Col>
          </Row>
        </Card.Body>
      </Card>
    );
  };
  
  return (
    <div>
      <div className="feature-card" style={{ background: GRADIENTS.secondary, padding: '2rem', color: 'white', borderRadius: '8px', marginBottom: '1rem' }}>
        <h3>Probability Distributions</h3>
        <p>Calculate probabilities and visualize distributions</p>
      </div>
      
      <Card className="shadow-sm mb-4">
        <Card.Body>
          <Card.Title>Select a Distribution</Card.Title>
          <Card.Text>
            Choose from various distributions:
          </Card.Text>
          <Row className="feature-grid">
            <Col md={6} className="mb-3">
              <Card 
                className={`h-100 feature-item ${selectedDistribution === 'binomial' ? 'border-primary' : ''}`}
                onClick={() => handleDistributionSelect('binomial')}
                style={{ cursor: 'pointer', borderWidth: selectedDistribution === 'binomial' ? '2px' : '1px' }}
              >
                <Card.Body className="d-flex flex-column">
                  <h5 className="d-flex align-items-center">
                    <i className={`bi bi-dice-6-fill me-2 ${selectedDistribution === 'binomial' ? 'text-primary' : ''}`}></i>
                    Binomial Distribution
                  </h5>
                  <p>Discrete probability distribution of the number of successes in a sequence of independent trials</p>
                  {selectedDistribution === 'binomial' && 
                    <Badge bg="primary" className="align-self-start mt-auto">Selected</Badge>
                  }
                </Card.Body>
              </Card>
            </Col>
            <Col md={6} className="mb-3">
              <Card 
                className={`h-100 feature-item ${selectedDistribution === 'poisson' ? 'border-primary' : ''}`}
                onClick={() => handleDistributionSelect('poisson')}
                style={{ cursor: 'pointer', borderWidth: selectedDistribution === 'poisson' ? '2px' : '1px' }}
              >
                <Card.Body className="d-flex flex-column">
                  <h5 className="d-flex align-items-center">
                    <i className={`bi bi-lightning-fill me-2 ${selectedDistribution === 'poisson' ? 'text-primary' : ''}`}></i>
                    Poisson Distribution
                  </h5>
                  <p>Expresses the probability of events occurring in a fixed interval of time or space</p>
                  {selectedDistribution === 'poisson' && 
                    <Badge bg="primary" className="align-self-start mt-auto">Selected</Badge>
                  }
                </Card.Body>
              </Card>
            </Col>
            <Col md={6} className="mb-3">
              <Card 
                className={`h-100 feature-item ${selectedDistribution === 'normal' ? 'border-primary' : ''}`}
                onClick={() => handleDistributionSelect('normal')}
                style={{ cursor: 'pointer', borderWidth: selectedDistribution === 'normal' ? '2px' : '1px' }}
              >
                <Card.Body className="d-flex flex-column">
                  <h5 className="d-flex align-items-center">
                    <i className={`bi bi-bell-fill me-2 ${selectedDistribution === 'normal' ? 'text-primary' : ''}`}></i>
                    Normal Distribution
                  </h5>
                  <p>Continuous probability distribution with bell-shaped probability density function</p>
                  {selectedDistribution === 'normal' && 
                    <Badge bg="primary" className="align-self-start mt-auto">Selected</Badge>
                  }
                </Card.Body>
              </Card>
            </Col>
            <Col md={6} className="mb-3">
              <Card 
                className={`h-100 feature-item ${selectedDistribution === 'exponential' ? 'border-primary' : ''}`}
                onClick={() => handleDistributionSelect('exponential')}
                style={{ cursor: 'pointer', borderWidth: selectedDistribution === 'exponential' ? '2px' : '1px' }}
              >
                <Card.Body className="d-flex flex-column">
                  <h5 className="d-flex align-items-center">
                    <i className={`bi bi-graph-down me-2 ${selectedDistribution === 'exponential' ? 'text-primary' : ''}`}></i>
                    Exponential Distribution
                  </h5>
                  <p>Models the time between events in a Poisson point process</p>
                  {selectedDistribution === 'exponential' && 
                    <Badge bg="primary" className="align-self-start mt-auto">Selected</Badge>
                  }
                </Card.Body>
              </Card>
            </Col>
          </Row>
        </Card.Body>
      </Card>
      
      {showContent && (
        <Card className="shadow-sm">
          <Card.Header style={{ background: GRADIENTS.secondary, color: 'white', borderRadius: '10px 10px 0 0' }}>
            <h5 className="mb-0">
              <i className="bi bi-calculator-fill me-2"></i>
              {selectedDistribution.charAt(0).toUpperCase() + selectedDistribution.slice(1)} Distribution Calculator
            </h5>
          </Card.Header>
          <Card.Body>
            <Form className="mb-3">
              <Row>
                {selectedDistribution === 'binomial' && (
                  <>
                    <Col md={6}>
                      <Form.Group className="mb-3">
                        <Form.Label>Number of trials (n)</Form.Label>
                        <Form.Control 
                          type="number" 
                          placeholder="Enter number of trials" 
                          value={binomialParams.n} 
                          min={1}
                          max={100}
                          onChange={(e) => setBinomialParams({...binomialParams, n: parseInt(e.target.value) || 0})} 
                        />
                      </Form.Group>
                    </Col>
                    <Col md={6}>
                      <Form.Group className="mb-3">
                        <Form.Label>Success probability (p)</Form.Label>
                        <Form.Control 
                          type="number" 
                          step="0.01" 
                          placeholder="Enter success probability"
                          value={binomialParams.p} 
                          min={0}
                          max={1}
                          onChange={(e) => setBinomialParams({...binomialParams, p: parseFloat(e.target.value) || 0})}
                        />
                      </Form.Group>
                    </Col>
                  </>
                )}
                
                {selectedDistribution === 'poisson' && (
                  <Col md={6}>
                    <Form.Group className="mb-3">
                      <Form.Label>Mean number of events (λ)</Form.Label>
                      <Form.Control 
                        type="number" 
                        step="0.1" 
                        placeholder="Enter lambda value"
                        value={poissonParams.lambda} 
                        min={0.1}
                        max={100}
                        onChange={(e) => setPoissonParams({...poissonParams, lambda: parseFloat(e.target.value) || 0})}
                      />
                    </Form.Group>
                  </Col>
                )}
                
                {selectedDistribution === 'normal' && (
                  <>
                    <Col md={6}>
                      <Form.Group className="mb-3">
                        <Form.Label>Mean (μ)</Form.Label>
                        <Form.Control 
                          type="number" 
                          step="0.1" 
                          placeholder="Enter mean value"
                          value={normalParams.mean}
                          onChange={(e) => setNormalParams({...normalParams, mean: parseFloat(e.target.value) || 0})}
                        />
                      </Form.Group>
                    </Col>
                    <Col md={6}>
                      <Form.Group className="mb-3">
                        <Form.Label>Standard Deviation (σ)</Form.Label>
                        <Form.Control 
                          type="number" 
                          step="0.1" 
                          placeholder="Enter standard deviation"
                          value={normalParams.stdDev}
                          min={0.1}
                          onChange={(e) => setNormalParams({...normalParams, stdDev: parseFloat(e.target.value) || 0.1})}
                        />
                      </Form.Group>
                    </Col>
                  </>
                )}
                
                {selectedDistribution === 'exponential' && (
                  <Col md={6}>
                    <Form.Group className="mb-3">
                      <Form.Label>Rate parameter (λ)</Form.Label>
                      <Form.Control 
                        type="number" 
                        step="0.1" 
                        placeholder="Enter rate parameter"
                        value={exponentialParams.lambda}
                        min={0.1}
                        onChange={(e) => setExponentialParams({...exponentialParams, lambda: parseFloat(e.target.value) || 0.1})}
                      />
                    </Form.Group>
                  </Col>
                )}
              </Row>
              
              <div className="d-grid gap-2 d-md-flex justify-content-md-end">
                <Button variant="primary" className="px-4" onClick={calculateDistribution}>
                  <i className="bi bi-calculator me-2"></i>
                  Calculate
                </Button>
              </div>
            </Form>
            
            {!results && (
              <div className="chart-placeholder bg-light p-5 text-center rounded">
                <i className="bi bi-graph-up display-1 text-primary opacity-50"></i>
                <h5 className="mt-3">Distribution Visualization</h5>
                <p className="text-muted">Enter parameters and click calculate to visualize the distribution</p>
              </div>
            )}
            
            {results && renderSummaryStats()}
            {results && renderDistributionChart()}
          </Card.Body>
        </Card>
      )}
    </div>
  );
}

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

function InferentialStatistics() {
  const [selectedTest, setSelectedTest] = useState<string>('');
  const [showContent, setShowContent] = useState<boolean>(false);
  const [results, setResults] = useState<any>(null);
  
  // Parameters for different tests
  const [confidenceParams, setConfidenceParams] = useState({
    testType: 'zTest',
    confidenceLevel: 0.95,
    sampleSize: 30,
    sampleMean: 0,
    populationMean: 0,
    stdDev: 1
  });
  
  const [hypothesisParams, setHypothesisParams] = useState({
    testType: 'oneSample',
    significanceLevel: 0.05,
    testDirection: 'twoTailed',
    sampleSize: 30,
    sampleMean: 0,
    populationMean: 0,
    sampleStdDev: 1
  });
  
  const [chiSquareParams, setChiSquareParams] = useState({
    rows: 2,
    columns: 2,
    observed: [[5, 10], [20, 15]]
  });
  
  const handleTestSelect = (test: string) => {
    setSelectedTest(test);
    setShowContent(true);
    setResults(null);
  };
  
  const calculateConfidenceInterval = () => {
    const { testType, confidenceLevel, sampleSize, sampleMean, stdDev } = confidenceParams;
    
    try {
      // Calculate critical value
      const alpha = 1 - confidenceLevel;
      let criticalValue;
      
      if (testType === 'zTest') {
        // For Z-test, use the normal distribution quantile
        criticalValue = math.abs(normalQuantile(1 - alpha / 2));
      } else {
        // For T-test, use the t distribution quantile
        const degreesOfFreedom = sampleSize - 1;
        criticalValue = math.abs(quantileT(alpha / 2, degreesOfFreedom));
      }
      
      // Calculate standard error
      const standardError = stdDev / Math.sqrt(sampleSize);
      
      // Calculate margin of error
      const marginOfError = criticalValue * standardError;
      
      // Calculate confidence interval
      const lowerBound = sampleMean - marginOfError;
      const upperBound = sampleMean + marginOfError;
      
      setResults({
        confidenceLevel,
        testType,
        sampleMean,
        stdDev,
        sampleSize,
        criticalValue,
        standardError,
        marginOfError,
        lowerBound,
        upperBound
      });
    } catch (error) {
      console.error('Error in confidence interval calculation:', error);
    }
  };
  
  const calculateHypothesisTest = () => {
    const { 
      testType, significanceLevel, testDirection, 
      sampleSize, sampleMean, populationMean, sampleStdDev 
    } = hypothesisParams;
    
    try {
      // Calculate test statistic
      const standardError = sampleStdDev / Math.sqrt(sampleSize);
      const testStatistic = (sampleMean - populationMean) / standardError;
      
      // Determine critical values and p-value based on test direction
      let pValue, criticalValue, reject;
      
      if (testType === 'oneSample') {
        // One-sample t-test
        const df = sampleSize - 1;
        
        if (testDirection === 'twoTailed') {
          // Two-tailed test
          pValue = 2 * (1 - cdfT(Math.abs(testStatistic), df));
          criticalValue = math.abs(quantileT(significanceLevel / 2, df));
          reject = Math.abs(testStatistic) > criticalValue;
        } else if (testDirection === 'leftTailed') {
          // Left-tailed test
          pValue = cdfT(testStatistic, df);
          criticalValue = quantileT(significanceLevel, df);
          reject = testStatistic < criticalValue;
        } else {
          // Right-tailed test
          pValue = 1 - cdfT(testStatistic, df);
          criticalValue = quantileT(1 - significanceLevel, df);
          reject = testStatistic > criticalValue;
        }
      } else {
        // Z-test (approximation)
        if (testDirection === 'twoTailed') {
          // Two-tailed test
          pValue = 2 * (1 - cdfNormal(Math.abs(testStatistic)));
          criticalValue = math.abs(normalQuantile(1 - significanceLevel / 2));
          reject = Math.abs(testStatistic) > criticalValue;
        } else if (testDirection === 'leftTailed') {
          // Left-tailed test
          pValue = cdfNormal(testStatistic);
          criticalValue = normalQuantile(significanceLevel);
          reject = testStatistic < criticalValue;
        } else {
          // Right-tailed test
          pValue = 1 - cdfNormal(testStatistic);
          criticalValue = normalQuantile(1 - significanceLevel);
          reject = testStatistic > criticalValue;
        }
      }
      
      setResults({
        testType,
        testDirection,
        significanceLevel,
        sampleMean,
        populationMean,
        sampleStdDev,
        sampleSize,
        testStatistic,
        pValue,
        criticalValue,
        reject
      });
    } catch (error) {
      console.error('Error in hypothesis test calculation:', error);
    }
  };
  
  const calculateChiSquare = () => {
    const { rows, columns, observed } = chiSquareParams;
    
    try {
      // Calculate row and column totals
      const rowTotals = [];
      for (let i = 0; i < rows; i++) {
        let rowSum = 0;
        for (let j = 0; j < columns; j++) {
          rowSum += observed[i][j];
        }
        rowTotals.push(rowSum);
      }
      
      const colTotals = [];
      for (let j = 0; j < columns; j++) {
        let colSum = 0;
        for (let i = 0; i < rows; i++) {
          colSum += observed[i][j];
        }
        colTotals.push(colSum);
      }
      
      const grandTotal = rowTotals.reduce((sum, val) => sum + val, 0);
      
      // Calculate expected values
      const expected: number[][] = [];
      let chiSquareValue = 0;
      
      for (let i = 0; i < rows; i++) {
        expected[i] = [];
        for (let j = 0; j < columns; j++) {
          const expectedValue = (rowTotals[i] * colTotals[j]) / grandTotal;
          expected[i][j] = expectedValue;
          
          // Calculate chi-square component
          const observedValue = observed[i][j];
          chiSquareValue += Math.pow(observedValue - expectedValue, 2) / expectedValue;
        }
      }
      
      // Calculate degrees of freedom
      const degreesOfFreedom = (rows - 1) * (columns - 1);
      
      // Calculate p-value
      const pValue = 1 - cdfChiSquare(chiSquareValue, degreesOfFreedom);
      
      // Set significance level
      const significanceLevel = 0.05;
      
      // Calculate critical value
      const criticalValue = quantileChiSquare(1 - significanceLevel, degreesOfFreedom);
      
      // Determine if null hypothesis should be rejected
      const reject = chiSquareValue > criticalValue;
      
      setResults({
        observed,
        expected,
        rows,
        columns,
        rowTotals,
        colTotals,
        grandTotal,
        chiSquareValue,
        degreesOfFreedom,
        pValue,
        significanceLevel,
        criticalValue,
        reject
      });
    } catch (error) {
      console.error('Error in chi-square calculation:', error);
    }
  };
  
  const handleCalculate = () => {
    if (selectedTest === 'confidence') {
      calculateConfidenceInterval();
    } else if (selectedTest === 'hypothesis') {
      calculateHypothesisTest();
    } else if (selectedTest === 'chi-square') {
      calculateChiSquare();
    }
  };
  
  const renderConfidenceIntervalForm = () => (
    <>
      <Col md={4}>
        <Form.Group className="mb-3">
          <Form.Label>Test Type</Form.Label>
          <Form.Select 
            value={confidenceParams.testType}
            onChange={(e) => setConfidenceParams({...confidenceParams, testType: e.target.value})}
          >
            <option value="zTest">Z-Test</option>
            <option value="tTest">T-Test</option>
          </Form.Select>
        </Form.Group>
      </Col>
      <Col md={4}>
        <Form.Group className="mb-3">
          <Form.Label>Confidence Level</Form.Label>
          <Form.Select
            value={confidenceParams.confidenceLevel}
            onChange={(e) => setConfidenceParams({...confidenceParams, confidenceLevel: parseFloat(e.target.value)})}
          >
            <option value="0.90">90%</option>
            <option value="0.95">95%</option>
            <option value="0.99">99%</option>
          </Form.Select>
        </Form.Group>
      </Col>
      <Col md={4}>
        <Form.Group className="mb-3">
          <Form.Label>Sample Size</Form.Label>
          <Form.Control 
            type="number" 
            placeholder="Enter sample size"
            value={confidenceParams.sampleSize}
            min={1}
            onChange={(e) => setConfidenceParams({...confidenceParams, sampleSize: parseInt(e.target.value) || 1})}
          />
        </Form.Group>
      </Col>
      <Col md={6}>
        <Form.Group className="mb-3">
          <Form.Label>Sample Mean</Form.Label>
          <Form.Control 
            type="number" 
            step="0.1"
            placeholder="Enter sample mean"
            value={confidenceParams.sampleMean}
            onChange={(e) => setConfidenceParams({...confidenceParams, sampleMean: parseFloat(e.target.value) || 0})}
          />
        </Form.Group>
      </Col>
      <Col md={6}>
        <Form.Group className="mb-3">
          <Form.Label>Standard Deviation</Form.Label>
          <Form.Control 
            type="number" 
            step="0.1"
            placeholder="Enter standard deviation"
            value={confidenceParams.stdDev}
            min={0.1}
            onChange={(e) => setConfidenceParams({...confidenceParams, stdDev: parseFloat(e.target.value) || 0.1})}
          />
        </Form.Group>
      </Col>
    </>
  );
  
  const renderHypothesisTestForm = () => (
    <>
      <Col md={4}>
        <Form.Group className="mb-3">
          <Form.Label>Test Type</Form.Label>
          <Form.Select
            value={hypothesisParams.testType}
            onChange={(e) => setHypothesisParams({...hypothesisParams, testType: e.target.value})}
          >
            <option value="oneSample">One Sample Test</option>
            <option value="twoSample">Two Sample Test</option>
          </Form.Select>
        </Form.Group>
      </Col>
      <Col md={4}>
        <Form.Group className="mb-3">
          <Form.Label>Significance Level (α)</Form.Label>
          <Form.Select
            value={hypothesisParams.significanceLevel}
            onChange={(e) => setHypothesisParams({...hypothesisParams, significanceLevel: parseFloat(e.target.value)})}
          >
            <option value="0.01">0.01</option>
            <option value="0.05">0.05</option>
            <option value="0.10">0.10</option>
          </Form.Select>
        </Form.Group>
      </Col>
      <Col md={4}>
        <Form.Group className="mb-3">
          <Form.Label>Test Direction</Form.Label>
          <Form.Select
            value={hypothesisParams.testDirection}
            onChange={(e) => setHypothesisParams({...hypothesisParams, testDirection: e.target.value})}
          >
            <option value="twoTailed">Two-tailed</option>
            <option value="leftTailed">Left-tailed</option>
            <option value="rightTailed">Right-tailed</option>
          </Form.Select>
        </Form.Group>
      </Col>
      <Col md={3}>
        <Form.Group className="mb-3">
          <Form.Label>Sample Size</Form.Label>
          <Form.Control 
            type="number"
            placeholder="Enter sample size"
            value={hypothesisParams.sampleSize}
            min={2}
            onChange={(e) => setHypothesisParams({...hypothesisParams, sampleSize: parseInt(e.target.value) || 2})}
          />
        </Form.Group>
      </Col>
      <Col md={3}>
        <Form.Group className="mb-3">
          <Form.Label>Sample Mean</Form.Label>
          <Form.Control 
            type="number"
            step="0.1" 
            placeholder="Enter sample mean"
            value={hypothesisParams.sampleMean}
            onChange={(e) => setHypothesisParams({...hypothesisParams, sampleMean: parseFloat(e.target.value) || 0})}
          />
        </Form.Group>
      </Col>
      <Col md={3}>
        <Form.Group className="mb-3">
          <Form.Label>Population Mean (H₀)</Form.Label>
          <Form.Control 
            type="number"
            step="0.1" 
            placeholder="Enter population mean"
            value={hypothesisParams.populationMean}
            onChange={(e) => setHypothesisParams({...hypothesisParams, populationMean: parseFloat(e.target.value) || 0})}
          />
        </Form.Group>
      </Col>
      <Col md={3}>
        <Form.Group className="mb-3">
          <Form.Label>Sample Std. Dev.</Form.Label>
          <Form.Control 
            type="number"
            step="0.1" 
            placeholder="Enter std dev"
            value={hypothesisParams.sampleStdDev}
            min={0.1}
            onChange={(e) => setHypothesisParams({...hypothesisParams, sampleStdDev: parseFloat(e.target.value) || 0.1})}
          />
        </Form.Group>
      </Col>
    </>
  );
  
  const renderChiSquareForm = () => (
    <>
      <Col md={6}>
        <Form.Group className="mb-3">
          <Form.Label>Number of Rows</Form.Label>
          <Form.Control 
            type="number"
            placeholder="Enter number of rows" 
            value={chiSquareParams.rows}
            min={2}
            max={5}
            onChange={(e) => {
              const newRows = parseInt(e.target.value) || 2;
              const newObserved = Array(newRows).fill(0).map((_, i) => 
                i < chiSquareParams.observed.length ? 
                  [...chiSquareParams.observed[i]] : 
                  Array(chiSquareParams.columns).fill(0)
              );
              setChiSquareParams({...chiSquareParams, rows: newRows, observed: newObserved});
            }}
          />
        </Form.Group>
      </Col>
      <Col md={6}>
        <Form.Group className="mb-3">
          <Form.Label>Number of Columns</Form.Label>
          <Form.Control 
            type="number"
            placeholder="Enter number of columns" 
            value={chiSquareParams.columns}
            min={2}
            max={5}
            onChange={(e) => {
              const newCols = parseInt(e.target.value) || 2;
              const newObserved = chiSquareParams.observed.map(row => {
                const newRow = [...row];
                while (newRow.length < newCols) newRow.push(0);
                return newRow.slice(0, newCols);
              });
              setChiSquareParams({...chiSquareParams, columns: newCols, observed: newObserved});
            }}
          />
        </Form.Group>
      </Col>
      <Col xs={12}>
        <Form.Group className="mb-3">
          <Form.Label>Observed Values</Form.Label>
          <div className="table-responsive">
            <table className="table table-bordered">
              <tbody>
                {Array.from({ length: chiSquareParams.rows }).map((_, rowIndex) => (
                  <tr key={rowIndex}>
                    {Array.from({ length: chiSquareParams.columns }).map((_, colIndex) => (
                      <td key={colIndex}>
                        <Form.Control 
                          type="number" 
                          min={0}
                          value={chiSquareParams.observed[rowIndex][colIndex]}
                          onChange={(e) => {
                            const newValue = parseInt(e.target.value) || 0;
                            const newObserved = [...chiSquareParams.observed];
                            newObserved[rowIndex][colIndex] = newValue;
                            setChiSquareParams({...chiSquareParams, observed: newObserved});
                          }}
                        />
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Form.Group>
      </Col>
    </>
  );
  
  const renderResults = () => {
    if (!results) return null;
    
    if (selectedTest === 'confidence') {
      return (
        <Card className="mb-4 shadow-sm">
          <Card.Header style={{ background: GRADIENTS.info, color: 'white', borderRadius: '10px 10px 0 0' }}>
            <h5 className="mb-0">
              <i className="bi bi-clipboard-data me-2"></i>
              Confidence Interval Results
            </h5>
          </Card.Header>
          <Card.Body>
            <Row>
              <Col md={6}>
                <h5 className="border-bottom pb-2">Inputs</h5>
                <p><strong>Test Type:</strong> {results.testType === 'zTest' ? 'Z-Test' : 'T-Test'}</p>
                <p><strong>Confidence Level:</strong> {(results.confidenceLevel * 100).toFixed(0)}%</p>
                <p><strong>Sample Size:</strong> {results.sampleSize}</p>
                <p><strong>Sample Mean:</strong> {results.sampleMean.toFixed(4)}</p>
                <p><strong>Standard Deviation:</strong> {results.stdDev.toFixed(4)}</p>
              </Col>
              <Col md={6}>
                <h5 className="border-bottom pb-2">Results</h5>
                <p><strong>Critical Value:</strong> {results.criticalValue.toFixed(4)}</p>
                <p><strong>Standard Error:</strong> {results.standardError.toFixed(4)}</p>
                <p><strong>Margin of Error:</strong> {results.marginOfError.toFixed(4)}</p>
                <p><strong>Confidence Interval:</strong> ({results.lowerBound.toFixed(4)}, {results.upperBound.toFixed(4)})</p>
              </Col>
            </Row>
            <div className="mt-3 p-3 bg-light rounded">
              <h6>Interpretation:</h6>
              <p>With {(results.confidenceLevel * 100).toFixed(0)}% confidence, the true population mean lies between {results.lowerBound.toFixed(4)} and {results.upperBound.toFixed(4)}.</p>
            </div>
          </Card.Body>
        </Card>
      );
    } else if (selectedTest === 'hypothesis') {
      return (
        <Card className="mb-4 shadow-sm">
          <Card.Header style={{ background: GRADIENTS.info, color: 'white', borderRadius: '10px 10px 0 0' }}>
            <h5 className="mb-0">
              <i className="bi bi-clipboard-data me-2"></i>
              Hypothesis Test Results
            </h5>
          </Card.Header>
          <Card.Body>
            <Row>
              <Col md={6}>
                <h5 className="border-bottom pb-2">Inputs</h5>
                <p><strong>Test Type:</strong> {results.testType === 'oneSample' ? 'One Sample T-Test' : 'Two Sample T-Test'}</p>
                <p><strong>Significance Level (α):</strong> {results.significanceLevel}</p>
                <p><strong>Direction:</strong> {
                  results.testDirection === 'twoTailed' ? 'Two-tailed' : 
                  results.testDirection === 'leftTailed' ? 'Left-tailed' : 'Right-tailed'
                }</p>
                <p><strong>Sample Mean:</strong> {results.sampleMean.toFixed(4)}</p>
                <p><strong>Population Mean (H₀):</strong> {results.populationMean.toFixed(4)}</p>
              </Col>
              <Col md={6}>
                <h5 className="border-bottom pb-2">Results</h5>
                <p><strong>Test Statistic:</strong> {results.testStatistic.toFixed(4)}</p>
                <p><strong>Critical Value:</strong> {
                  results.testDirection === 'twoTailed' ? 
                  `±${Math.abs(results.criticalValue).toFixed(4)}` : 
                  results.criticalValue.toFixed(4)
                }</p>
                <p><strong>P-Value:</strong> {results.pValue.toFixed(4)}</p>
                <p><strong>Decision:</strong> {
                  results.reject ? 
                  <span className="text-danger">Reject H₀</span> : 
                  <span className="text-success">Fail to reject H₀</span>
                }</p>
              </Col>
            </Row>
            <div className="mt-3 p-3 bg-light rounded">
              <h6>Interpretation:</h6>
              <p>
                {results.reject ? 
                  `There is sufficient evidence to reject the null hypothesis at the ${results.significanceLevel} significance level.` : 
                  `There is insufficient evidence to reject the null hypothesis at the ${results.significanceLevel} significance level.`
                }
              </p>
            </div>
          </Card.Body>
        </Card>
      );
    } else if (selectedTest === 'chi-square') {
      return (
        <Card className="mb-4 shadow-sm">
          <Card.Header style={{ background: GRADIENTS.info, color: 'white', borderRadius: '10px 10px 0 0' }}>
            <h5 className="mb-0">
              <i className="bi bi-clipboard-data me-2"></i>
              Chi-Square Test Results
            </h5>
          </Card.Header>
          <Card.Body>
            <Row>
              <Col md={6}>
                <h5 className="border-bottom pb-2">Inputs</h5>
                <p><strong>Table Size:</strong> {results.rows} × {results.columns}</p>
                <p><strong>Degrees of Freedom:</strong> {results.degreesOfFreedom}</p>
                <p><strong>Significance Level (α):</strong> {results.significanceLevel}</p>
              </Col>
              <Col md={6}>
                <h5 className="border-bottom pb-2">Results</h5>
                <p><strong>Chi-Square Value:</strong> {results.chiSquareValue.toFixed(4)}</p>
                <p><strong>Critical Value:</strong> {results.criticalValue.toFixed(4)}</p>
                <p><strong>P-Value:</strong> {results.pValue.toFixed(4)}</p>
                <p><strong>Decision:</strong> {
                  results.reject ? 
                  <span className="text-danger">Reject H₀</span> : 
                  <span className="text-success">Fail to reject H₀</span>
                }</p>
              </Col>
            </Row>
            <div className="mt-3 p-3 bg-light rounded">
              <h6>Interpretation:</h6>
              <p>
                {results.reject ? 
                  'There is significant evidence of association between the row and column variables.' : 
                  'There is no significant evidence of association between the row and column variables.'
                }
              </p>
            </div>
          </Card.Body>
        </Card>
      );
    }
    
    return null;
  };
  
  return (
    <div>
      <div className="feature-card" style={{ background: GRADIENTS.info, padding: '2rem', color: 'white', borderRadius: '8px', marginBottom: '1rem' }}>
        <h3>Inferential Statistics</h3>
        <p>Perform statistical inference and hypothesis testing</p>
      </div>
      
      <Card className="shadow-sm mb-4">
        <Card.Body>
          <Card.Title>Select a Statistical Test</Card.Title>
          <Card.Text>
            Available statistical tests:
          </Card.Text>
          <Row className="feature-grid">
            <Col md={4} className="mb-3">
              <Card 
                className={`h-100 feature-item ${selectedTest === 'confidence' ? 'border-primary' : ''}`}
                onClick={() => handleTestSelect('confidence')}
                style={{ cursor: 'pointer', borderWidth: selectedTest === 'confidence' ? '2px' : '1px' }}
              >
                <Card.Body className="d-flex flex-column">
                  <h5 className="d-flex align-items-center">
                    <i className={`bi bi-percent me-2 ${selectedTest === 'confidence' ? 'text-primary' : ''}`}></i>
                    Confidence Intervals
                  </h5>
                  <p>Z-test & T-test based confidence interval estimation</p>
                  {selectedTest === 'confidence' && 
                    <Badge bg="primary" className="align-self-start mt-auto">Selected</Badge>
                  }
                </Card.Body>
              </Card>
            </Col>
            <Col md={4} className="mb-3">
              <Card 
                className={`h-100 feature-item ${selectedTest === 'hypothesis' ? 'border-primary' : ''}`}
                onClick={() => handleTestSelect('hypothesis')}
                style={{ cursor: 'pointer', borderWidth: selectedTest === 'hypothesis' ? '2px' : '1px' }}
              >
                <Card.Body className="d-flex flex-column">
                  <h5 className="d-flex align-items-center">
                    <i className={`bi bi-check2-circle me-2 ${selectedTest === 'hypothesis' ? 'text-primary' : ''}`}></i>
                    Hypothesis Testing
                  </h5>
                  <p>One-sample, two-sample, and paired tests</p>
                  {selectedTest === 'hypothesis' && 
                    <Badge bg="primary" className="align-self-start mt-auto">Selected</Badge>
                  }
                </Card.Body>
              </Card>
            </Col>
            <Col md={4} className="mb-3">
              <Card 
                className={`h-100 feature-item ${selectedTest === 'chi-square' ? 'border-primary' : ''}`}
                onClick={() => handleTestSelect('chi-square')}
                style={{ cursor: 'pointer', borderWidth: selectedTest === 'chi-square' ? '2px' : '1px' }}
              >
                <Card.Body className="d-flex flex-column">
                  <h5 className="d-flex align-items-center">
                    <i className={`bi bi-grid-3x3-gap me-2 ${selectedTest === 'chi-square' ? 'text-primary' : ''}`}></i>
                    Chi-Square Test
                  </h5>
                  <p>Test for independence between categorical variables</p>
                  {selectedTest === 'chi-square' && 
                    <Badge bg="primary" className="align-self-start mt-auto">Selected</Badge>
                  }
                </Card.Body>
              </Card>
            </Col>
          </Row>
        </Card.Body>
      </Card>
      
      {showContent && (
        <Card className="shadow-sm">
          <Card.Header style={{ background: GRADIENTS.info, color: 'white', borderRadius: '10px 10px 0 0' }}>
            <h5 className="mb-0">
              <i className="bi bi-calculator-fill me-2"></i>
              {selectedTest === 'confidence' ? 'Confidence Interval' : 
                selectedTest === 'hypothesis' ? 'Hypothesis Test' : 'Chi-Square Test'} Calculator
            </h5>
          </Card.Header>
          <Card.Body>
            <Form className="mb-3">
              <Row>
                {selectedTest === 'confidence' && renderConfidenceIntervalForm()}
                
                {selectedTest === 'hypothesis' && renderHypothesisTestForm()}
                
                {selectedTest === 'chi-square' && renderChiSquareForm()}
              </Row>
              
              <div className="d-grid gap-2 d-md-flex justify-content-md-end">
                <Button variant="primary" className="px-4" onClick={handleCalculate}>
                  <i className="bi bi-calculator me-2"></i>
                  Calculate
                </Button>
              </div>
            </Form>
            
            {!results && (
              <div className="chart-placeholder bg-light p-5 text-center rounded">
                <i className="bi bi-bar-chart display-1 text-primary opacity-50"></i>
                <h5 className="mt-3">Test Results Visualization</h5>
                <p className="text-muted">Enter parameters and click calculate to see test results</p>
              </div>
            )}
            
            {results && renderResults()}
          </Card.Body>
        </Card>
      )}
    </div>
  );
}

// Regression Component
function RegressionAnalysis() {
  const [selectedAnalysis, setSelectedAnalysis] = useState<string>('');
  const [showContent, setShowContent] = useState<boolean>(false);
  const [results, setResults] = useState<any>(null);
  const [xValues, setXValues] = useState<string>('1, 2, 3, 4, 5');
  const [yValues, setYValues] = useState<string>('2, 3, 5, 4, 6');
  const [error, setError] = useState<string>('');
  
  const handleAnalysisSelect = (analysis: string) => {
    setSelectedAnalysis(analysis);
    setShowContent(true);
    setResults(null);
    setError('');
  };
  
  const parseData = (input: string): number[] => {
    return input.split(/[,;\s]+/)
      .filter(val => val.trim() !== '')
      .map(val => {
        const num = parseFloat(val);
        if (isNaN(num)) throw new Error(`Invalid number: ${val}`);
        return num;
      });
  };
  
  const calculateRegression = () => {
    setError('');
    try {
      // Parse input values
      const xData = parseData(xValues);
      const yData = parseData(yValues);
      
      // Check if arrays have the same length
      if (xData.length !== yData.length) {
        setError('X and Y data must have the same length');
        return;
      }
      
      if (xData.length < 2) {
        setError('At least two data points are required');
        return;
      }
      
      // Calculate means
      const n = xData.length;
      const xMean = math.mean(xData);
      const yMean = math.mean(yData);
      
      // Calculate slope (m) and y-intercept (b)
      let sumXY = 0;
      let sumXSquared = 0;
      
      for (let i = 0; i < n; i++) {
        sumXY += xData[i] * yData[i];
        sumXSquared += xData[i] * xData[i];
      }
      
      const slope = (n * sumXY - math.sum(xData) * math.sum(yData)) / 
                   (n * sumXSquared - math.sum(xData) * math.sum(xData));
      
      const intercept = yMean - slope * xMean;
      
      // Calculate predicted values
      const yPredicted = xData.map(x => slope * x + intercept);
      
      // Calculate coefficient of determination (R-squared)
      const ssTot = math.sum(yData.map(y => Math.pow(y - yMean, 2)));
      const ssRes = math.sum(yData.map((y, i) => Math.pow(y - yPredicted[i], 2)));
      const rSquared = 1 - (ssRes / ssTot);
      
      // Calculate standard error of estimate
      const standardError = Math.sqrt(ssRes / (n - 2));
      
      // Create data for chart
      const chartData = xData.map((x, i) => ({
        x,
        y: yData[i],
        yPredicted: yPredicted[i]
      }));
      
      // Find min/max x values for regression line
      const minX = math.min(xData);
      const maxX = math.max(xData);
      
      // Create regression line data
      const regressionLineData = [
        { x: minX, y: slope * minX + intercept },
        { x: maxX, y: slope * maxX + intercept }
      ];
      
      // Store results
      setResults({
        chartData,
        regressionLineData,
        slope,
        intercept,
        rSquared,
        standardError,
        equation: `y = ${slope.toFixed(4)}x + ${intercept.toFixed(4)}`,
        n
      });
      
    } catch (err: any) {
      setError(err.message || 'Error calculating regression');
    }
  };
  
  const calculateCorrelation = () => {
    setError('');
    try {
      // Parse input values
      const xData = parseData(xValues);
      const yData = parseData(yValues);
      
      // Check if arrays have the same length
      if (xData.length !== yData.length) {
        setError('X and Y data must have the same length');
        return;
      }
      
      if (xData.length < 2) {
        setError('At least two data points are required');
        return;
      }
      
      // Calculate means
      const n = xData.length;
      const xMean = math.mean(xData);
      const yMean = math.mean(yData);
      
      // Calculate correlation coefficient (Pearson's r)
      let sumXY = 0;
      let sumXSquared = 0;
      let sumYSquared = 0;
      
      for (let i = 0; i < n; i++) {
        const xDiff = xData[i] - xMean;
        const yDiff = yData[i] - yMean;
        sumXY += xDiff * yDiff;
        sumXSquared += xDiff * xDiff;
        sumYSquared += yDiff * yDiff;
      }
      
      const r = sumXY / (Math.sqrt(sumXSquared) * Math.sqrt(sumYSquared));
      const rSquared = r * r;
      
      // Create data for scatter plot
      const chartData = xData.map((x, i) => ({
        x,
        y: yData[i]
      }));
      
      // Store results
      setResults({
        chartData,
        r,
        rSquared,
        n,
        xMean,
        yMean,
        interpretation: interpretCorrelation(r)
      });
      
    } catch (err: any) {
      setError(err.message || 'Error calculating correlation');
    }
  };
  
  const interpretCorrelation = (r: number) => {
    const absR = Math.abs(r);
    
    if (absR < 0.2) return 'Very weak';
    if (absR < 0.4) return 'Weak';
    if (absR < 0.6) return 'Moderate';
    if (absR < 0.8) return 'Strong';
    return 'Very strong';
  };
  
  const handleCalculate = () => {
    if (selectedAnalysis === 'regression') {
      calculateRegression();
    } else if (selectedAnalysis === 'correlation') {
      calculateCorrelation();
    }
  };
  
  const renderRegressionChart = () => {
    if (!results) return null;
    
    return (
      <div className="chart-container">
        <ResponsiveContainer width="100%" height={400}>
          <ScatterChart margin={{ top: 20, right: 30, left: 20, bottom: 20 }}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis 
              dataKey="x" 
              name="X" 
              label={{ value: "X", position: "insideBottomRight", offset: 0 }}
            />
            <YAxis 
              dataKey="y" 
              name="Y" 
              label={{ value: "Y", angle: -90, position: "insideLeft" }}
            />
            <Tooltip cursor={{ strokeDasharray: '3 3' }} />
            <Legend />
            <Scatter 
              name="Data Points" 
              data={results.chartData} 
              fill="#8884d8"
            />
            {selectedAnalysis === 'regression' && (
              <Scatter
                name="Regression Line"
                data={results.regressionLineData}
                line={{ stroke: '#ff7300', strokeWidth: 2 }}
                shape={<div style={{display: 'none'}} />}
                legendType="line"
              />
            )}
          </ScatterChart>
        </ResponsiveContainer>
      </div>
    );
  };
  
  const renderRegressionResults = () => {
    if (!results) return null;
    
    return (
      <Card className="mb-4 shadow-sm">
        <Card.Header style={{ background: GRADIENTS.success, color: 'white', borderRadius: '10px 10px 0 0' }}>
          <h5 className="mb-0">
            <i className="bi bi-clipboard-data me-2"></i>
            Linear Regression Results
          </h5>
        </Card.Header>
        <Card.Body>
          <Row>
            <Col md={6}>
              <h5 className="border-bottom pb-2">Regression Equation</h5>
              <p className="formula">
                <strong>Y = {results.slope.toFixed(4)} X + {results.intercept.toFixed(4)}</strong>
              </p>
              <p><strong>Slope (m):</strong> {results.slope.toFixed(4)}</p>
              <p><strong>Y-Intercept (b):</strong> {results.intercept.toFixed(4)}</p>
            </Col>
            <Col md={6}>
              <h5 className="border-bottom pb-2">Model Quality</h5>
              <p><strong>R-squared:</strong> {results.rSquared.toFixed(4)}</p>
              <p><strong>Standard Error:</strong> {results.standardError.toFixed(4)}</p>
              <p><strong>Sample Size:</strong> {results.n}</p>
            </Col>
          </Row>
          <div className="mt-3 p-3 bg-light rounded">
            <h6>Interpretation:</h6>
            <p>
              The R-squared value of {results.rSquared.toFixed(4)} means that approximately {(results.rSquared * 100).toFixed(2)}% of the 
              variation in Y can be explained by the linear relationship with X.
            </p>
            <p>
              For each unit increase in X, Y changes by {results.slope.toFixed(4)} units.
            </p>
          </div>
        </Card.Body>
      </Card>
    );
  };
  
  const renderCorrelationResults = () => {
    if (!results) return null;
    
    const correlationStrength = results.interpretation;
    const correlationDirection = results.r > 0 ? 'positive' : 'negative';
    
    return (
      <Card className="mb-4 shadow-sm">
        <Card.Header style={{ background: GRADIENTS.success, color: 'white', borderRadius: '10px 10px 0 0' }}>
          <h5 className="mb-0">
            <i className="bi bi-clipboard-data me-2"></i>
            Correlation Analysis Results
          </h5>
        </Card.Header>
        <Card.Body>
          <Row>
            <Col md={6}>
              <h5 className="border-bottom pb-2">Correlation Measures</h5>
              <p><strong>Pearson's r:</strong> {results.r.toFixed(4)}</p>
              <p><strong>r<sup>2</sup>:</strong> {results.rSquared.toFixed(4)}</p>
            </Col>
            <Col md={6}>
              <h5 className="border-bottom pb-2">Data Summary</h5>
              <p><strong>Sample Size:</strong> {results.n}</p>
              <p><strong>Mean of X:</strong> {results.xMean.toFixed(4)}</p>
              <p><strong>Mean of Y:</strong> {results.yMean.toFixed(4)}</p>
            </Col>
          </Row>
          <div className="mt-3 p-3 bg-light rounded">
            <h6>Interpretation:</h6>
            <p>
              The correlation coefficient (r = {results.r.toFixed(4)}) indicates a <strong>{correlationStrength} {correlationDirection}</strong> linear relationship between the variables.
            </p>
            <p>
              {results.rSquared.toFixed(4) * 100}% of the variation in one variable can be explained by the other variable.
            </p>
          </div>
        </Card.Body>
      </Card>
    );
  };
  
  return (
    <div>
      <div className="feature-card" style={{ background: GRADIENTS.success, padding: '2rem', color: 'white', borderRadius: '8px', marginBottom: '1rem' }}>
        <h3>Regression & Correlation</h3>
        <p>Analyze relationships between variables</p>
      </div>
      
      <Card className="shadow-sm mb-4">
        <Card.Body>
          <Card.Title>Select Analysis Type</Card.Title>
          <Row className="feature-grid">
            <Col md={6} className="mb-3">
              <Card 
                className={`h-100 feature-item ${selectedAnalysis === 'regression' ? 'border-primary' : ''}`}
                onClick={() => handleAnalysisSelect('regression')}
                style={{ cursor: 'pointer', borderWidth: selectedAnalysis === 'regression' ? '2px' : '1px' }}
              >
                <Card.Body className="d-flex flex-column">
                  <h5 className="d-flex align-items-center">
                    <i className={`bi bi-graph-up-arrow me-2 ${selectedAnalysis === 'regression' ? 'text-primary' : ''}`}></i>
                    Linear Regression
                  </h5>
                  <p>Least squares method for finding the best-fitting line</p>
                  {selectedAnalysis === 'regression' && 
                    <Badge bg="primary" className="align-self-start mt-auto">Selected</Badge>
                  }
                </Card.Body>
              </Card>
            </Col>
            <Col md={6} className="mb-3">
              <Card 
                className={`h-100 feature-item ${selectedAnalysis === 'correlation' ? 'border-primary' : ''}`}
                onClick={() => handleAnalysisSelect('correlation')}
                style={{ cursor: 'pointer', borderWidth: selectedAnalysis === 'correlation' ? '2px' : '1px' }}
              >
                <Card.Body className="d-flex flex-column">
                  <h5 className="d-flex align-items-center">
                    <i className={`bi bi-link-45deg me-2 ${selectedAnalysis === 'correlation' ? 'text-primary' : ''}`}></i>
                    Correlation Analysis
                  </h5>
                  <p>Pearson's correlation coefficient calculation and visualization</p>
                  {selectedAnalysis === 'correlation' && 
                    <Badge bg="primary" className="align-self-start mt-auto">Selected</Badge>
                  }
                </Card.Body>
              </Card>
            </Col>
          </Row>
        </Card.Body>
      </Card>
      
      {showContent && (
        <Card className="shadow-sm">
          <Card.Header style={{ background: GRADIENTS.success, color: 'white', borderRadius: '10px 10px 0 0' }}>
            <h5 className="mb-0">
              <i className="bi bi-calculator-fill me-2"></i>
              {selectedAnalysis === 'regression' ? 'Linear Regression' : 'Correlation'} Analysis
            </h5>
          </Card.Header>
          <Card.Body>
            {error && <Alert variant="danger">{error}</Alert>}
            
            <Form className="mb-3">
              <Row>
                <Col md={6}>
                  <Form.Group className="mb-3">
                    <Form.Label>X Values (Independent Variable)</Form.Label>
                    <Form.Control 
                      as="textarea" 
                      rows={3} 
                      placeholder="Enter comma-separated X values"
                      value={xValues}
                      onChange={(e) => setXValues(e.target.value)}
                    />
                  </Form.Group>
                </Col>
                <Col md={6}>
                  <Form.Group className="mb-3">
                    <Form.Label>Y Values (Dependent Variable)</Form.Label>
                    <Form.Control 
                      as="textarea" 
                      rows={3} 
                      placeholder="Enter comma-separated Y values"
                      value={yValues}
                      onChange={(e) => setYValues(e.target.value)}
                    />
                  </Form.Group>
                </Col>
              </Row>
              
              <div className="d-grid gap-2 d-md-flex justify-content-md-end">
                <Button variant="primary" className="px-4" onClick={handleCalculate}>
                  <i className="bi bi-calculator me-2"></i>
                  Analyze
                </Button>
              </div>
            </Form>
            
            {!results && (
              <div className="chart-placeholder bg-light p-5 text-center rounded">
                <i className="bi bi-graph-up-arrow display-1 text-primary opacity-50"></i>
                <h5 className="mt-3">{selectedAnalysis === 'regression' ? 'Regression Line' : 'Correlation'} Visualization</h5>
                <p className="text-muted">Enter data and click analyze to visualize the results</p>
              </div>
            )}
            
            {results && (selectedAnalysis === 'regression' ? renderRegressionResults() : renderCorrelationResults())}
            {results && renderRegressionChart()}
          </Card.Body>
        </Card>
      )}
    </div>
  );
}

// Data Visualization Component
function DataVisualization() {
  const [selectedChart, setSelectedChart] = useState<string>('');
  const [showContent, setShowContent] = useState<boolean>(false);
  const [results, setResults] = useState<any>(null);
  const [chartTitle, setChartTitle] = useState<string>('');
  const [xAxisLabel, setXAxisLabel] = useState<string>('');
  const [yAxisLabel, setYAxisLabel] = useState<string>('');
  const [dataLabels, setDataLabels] = useState<string>('Category A, Category B, Category C, Category D');
  const [dataValues, setDataValues] = useState<string>('25, 35, 15, 25');
  const [error, setError] = useState<string>('');
  
  const handleChartSelect = (chart: string) => {
    setSelectedChart(chart);
    setShowContent(true);
    setResults(null);
    setError('');
  };
  
  const parseLabels = (input: string): string[] => {
    return input.split(/[,;\n]+/)
      .map(label => label.trim())
      .filter(label => label !== '');
  };
  
  const parseValues = (input: string): number[] => {
    return input.split(/[,;\s]+/)
      .filter(val => val.trim() !== '')
      .map(val => {
        const num = parseFloat(val);
        if (isNaN(num)) throw new Error(`Invalid number: ${val}`);
        return num;
      });
  };
  
  const generateChart = () => {
    setError('');
    try {
      const labels = parseLabels(dataLabels);
      const values = parseValues(dataValues);
      
      if (labels.length === 0 || values.length === 0) {
        setError('Please enter valid labels and values');
        return;
      }
      
      if (labels.length !== values.length) {
        setError('The number of labels must match the number of values');
        return;
      }
      
      // Create chart data
      const chartData = labels.map((label, i) => ({
        name: label,
        value: values[i]
      }));
      
      // Calculate sum for pie chart percentages
      const sum = values.reduce((acc, val) => acc + val, 0);
      
      // Create pie chart data with percentages
      const pieData = chartData.map(item => ({
        ...item,
        percent: (item.value / sum) * 100
      }));
      
      setResults({
        chartData,
        pieData,
        sum,
        min: math.min(values),
        max: math.max(values),
        mean: math.mean(values),
        title: chartTitle || 'Data Visualization',
        xLabel: xAxisLabel || 'Categories',
        yLabel: yAxisLabel || 'Values'
      });
      
    } catch (err: any) {
      setError(err.message || 'Error generating chart');
    }
  };
  
  const renderChart = () => {
    if (!results) return null;
    
    switch (selectedChart) {
      case 'bar':
        return (
          <div className="chart-container">
            <ResponsiveContainer width="100%" height={400}>
              <BarChart data={results.chartData} margin={{ top: 20, right: 30, left: 20, bottom: 50 }}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis 
                  dataKey="name" 
                  label={{ value: results.xLabel, position: "insideBottom", offset: -10 }}
                  interval={0}
                  tick={(props) => {
                    const { x, y, payload } = props;
                    return (
                      <g transform={`translate(${x},${y})`}>
                        <text 
                          x={0} 
                          y={0} 
                          dy={16} 
                          textAnchor="end" 
                          fill="#666" 
                          transform="rotate(-45)"
                        >
                          {payload.value}
                        </text>
                      </g>
                    );
                  }}
                  height={70}
                />
                <YAxis label={{ value: results.yLabel, angle: -90, position: "insideLeft", offset: -5 }} />
                <Tooltip formatter={(value: any) => [`${value}`, results.yLabel]} />
                <Legend wrapperStyle={{ paddingTop: '10px' }} />
                <Bar dataKey="value" name={results.yLabel} fill="#8884d8">
                  {
                    results.chartData.map((_: any, index: number) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))
                  }
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        );
      
      case 'pie':
        return (
          <div className="chart-container">
            <ResponsiveContainer width="100%" height={400}>
              <PieChart margin={{ top: 20, right: 30, left: 20, bottom: 20 }}>
                <Pie
                  data={results.pieData}
                  cx="50%"
                  cy="50%"
                  labelLine={true}
                  outerRadius={150}
                  fill="#8884d8"
                  dataKey="value"
                  nameKey="name"
                  label={({ name, percent }) => `${name}: ${percent.toFixed(1)}%`}
                >
                  {
                    results.pieData.map((_: any, index: number) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))
                  }
                </Pie>
                <Tooltip formatter={(value: any, name: any) => [`${value} (${((value / results.sum) * 100).toFixed(1)}%)`, name]} />
                <Legend layout="vertical" verticalAlign="middle" align="right" />
              </PieChart>
            </ResponsiveContainer>
          </div>
        );
      
      case 'line':
        return (
          <div className="chart-container">
            <ResponsiveContainer width="100%" height={400}>
              <LineChart data={results.chartData} margin={{ top: 20, right: 30, left: 20, bottom: 50 }}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis 
                  dataKey="name" 
                  label={{ value: results.xLabel, position: "insideBottom", offset: -10 }}
                  interval={0}
                  tick={(props) => {
                    const { x, y, payload } = props;
                    return (
                      <g transform={`translate(${x},${y})`}>
                        <text 
                          x={0} 
                          y={0} 
                          dy={16} 
                          textAnchor="end" 
                          fill="#666" 
                          transform="rotate(-45)"
                        >
                          {payload.value}
                        </text>
                      </g>
                    );
                  }}
                  height={70}
                />
                <YAxis label={{ value: results.yLabel, angle: -90, position: "insideLeft", offset: -5 }} />
                <Tooltip formatter={(value: any) => [`${value}`, results.yLabel]} />
                <Legend wrapperStyle={{ paddingTop: '10px' }} />
                <Line 
                  type="monotone" 
                  dataKey="value" 
                  name={results.yLabel} 
                  stroke="#8884d8" 
                  activeDot={{ r: 8 }} 
                  strokeWidth={2}
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
        );
      
      case 'scatter':
        // For scatter plot, generate some random spread around the values
        const scatterData = results.chartData.map((item: any, index: number) => ({
          x: index + 1,
          y: item.value,
          name: item.name
        }));
        
        return (
          <div className="chart-container">
            <ResponsiveContainer width="100%" height={400}>
              <ScatterChart margin={{ top: 20, right: 30, left: 20, bottom: 50 }}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis 
                  type="number" 
                  dataKey="x" 
                  name="Index" 
                  label={{ value: results.xLabel, position: "insideBottom", offset: -10 }}
                />
                <YAxis 
                  type="number" 
                  dataKey="y" 
                  name="Value" 
                  label={{ value: results.yLabel, angle: -90, position: "insideLeft", offset: -5 }}
                />
                <Tooltip 
                  formatter={(value: any, name: any, props: any) => {
                    const item = scatterData.find((d: any) => d.x === props.payload.x);
                    return [value, item ? item.name : name];
                  }}
                />
                <Legend />
                <Scatter 
                  name="Values" 
                  data={scatterData} 
                  fill="#8884d8"
                >
                  {
                    scatterData.map((_: any, index: number) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))
                  }
                </Scatter>
              </ScatterChart>
            </ResponsiveContainer>
          </div>
        );
      
      default:
        return null;
    }
  };
  
  const renderDataTable = () => {
    if (!results) return null;
    
    return (
      <Card className="mb-4 shadow-sm">
        <Card.Header style={{ background: GRADIENTS.warning, color: 'white', borderRadius: '10px 10px 0 0' }}>
          <h5 className="mb-0">
            <i className="bi bi-table me-2"></i>
            Data Summary
          </h5>
        </Card.Header>
        <Card.Body>
          <div className="table-responsive">
            <table className="table table-striped table-hover">
              <thead>
                <tr>
                  <th>Category</th>
                  <th>Value</th>
                  {selectedChart === 'pie' && <th>Percentage</th>}
                </tr>
              </thead>
              <tbody>
                {results.chartData.map((item: any, index: number) => (
                  <tr key={index}>
                    <td>{item.name}</td>
                    <td>{item.value}</td>
                    {selectedChart === 'pie' && (
                      <td>{((item.value / results.sum) * 100).toFixed(2)}%</td>
                    )}
                  </tr>
                ))}
              </tbody>
              <tfoot className="table-primary">
                <tr>
                  <th>Total</th>
                  <th>{results.sum}</th>
                  {selectedChart === 'pie' && <th>100.00%</th>}
                </tr>
              </tfoot>
            </table>
          </div>
          
          <div className="mt-3 p-3 bg-light rounded">
            <h6>Summary Statistics</h6>
            <Row>
              <Col md={4}><strong>Total:</strong> {results.sum}</Col>
              <Col md={4}><strong>Mean:</strong> {results.mean.toFixed(2)}</Col>
              <Col md={4}><strong>Range:</strong> {results.min} - {results.max}</Col>
            </Row>
          </div>
        </Card.Body>
      </Card>
    );
  };
  
  return (
    <div>
      <div className="feature-card" style={{ background: GRADIENTS.warning, padding: '2rem', color: 'white', borderRadius: '8px', marginBottom: '1rem' }}>
        <h3>Data Visualization</h3>
        <p>Create dynamic charts and visualize your data</p>
      </div>
      
      <Card className="shadow-sm mb-4">
        <Card.Body>
          <Card.Title>Select Chart Type</Card.Title>
          <Row className="feature-grid">
            <Col md={3} className="mb-3">
              <Card 
                className={`h-100 feature-item ${selectedChart === 'bar' ? 'border-primary' : ''}`}
                onClick={() => handleChartSelect('bar')}
                style={{ cursor: 'pointer', borderWidth: selectedChart === 'bar' ? '2px' : '1px' }}
              >
                <Card.Body className="text-center d-flex flex-column">
                  <h5>Bar Chart</h5>
                  <i className={`bi bi-bar-chart-fill fs-1 ${selectedChart === 'bar' ? 'text-primary' : 'text-secondary'}`}></i>
                  {selectedChart === 'bar' && 
                    <Badge bg="primary" className="align-self-center mt-3">Selected</Badge>
                  }
                </Card.Body>
              </Card>
            </Col>
            <Col md={3} className="mb-3">
              <Card 
                className={`h-100 feature-item ${selectedChart === 'pie' ? 'border-primary' : ''}`}
                onClick={() => handleChartSelect('pie')}
                style={{ cursor: 'pointer', borderWidth: selectedChart === 'pie' ? '2px' : '1px' }}
              >
                <Card.Body className="text-center d-flex flex-column">
                  <h5>Pie Chart</h5>
                  <i className={`bi bi-pie-chart-fill fs-1 ${selectedChart === 'pie' ? 'text-primary' : 'text-secondary'}`}></i>
                  {selectedChart === 'pie' && 
                    <Badge bg="primary" className="align-self-center mt-3">Selected</Badge>
                  }
                </Card.Body>
              </Card>
            </Col>
            <Col md={3} className="mb-3">
              <Card 
                className={`h-100 feature-item ${selectedChart === 'line' ? 'border-primary' : ''}`}
                onClick={() => handleChartSelect('line')}
                style={{ cursor: 'pointer', borderWidth: selectedChart === 'line' ? '2px' : '1px' }}
              >
                <Card.Body className="text-center d-flex flex-column">
                  <h5>Line Chart</h5>
                  <i className={`bi bi-graph-up fs-1 ${selectedChart === 'line' ? 'text-primary' : 'text-secondary'}`}></i>
                  {selectedChart === 'line' && 
                    <Badge bg="primary" className="align-self-center mt-3">Selected</Badge>
                  }
                </Card.Body>
              </Card>
            </Col>
            <Col md={3} className="mb-3">
              <Card 
                className={`h-100 feature-item ${selectedChart === 'scatter' ? 'border-primary' : ''}`}
                onClick={() => handleChartSelect('scatter')}
                style={{ cursor: 'pointer', borderWidth: selectedChart === 'scatter' ? '2px' : '1px' }}
              >
                <Card.Body className="text-center d-flex flex-column">
                  <h5>Scatter Plot</h5>
                  <i className={`bi bi-diagram-3 fs-1 ${selectedChart === 'scatter' ? 'text-primary' : 'text-secondary'}`}></i>
                  {selectedChart === 'scatter' && 
                    <Badge bg="primary" className="align-self-center mt-3">Selected</Badge>
                  }
                </Card.Body>
              </Card>
            </Col>
          </Row>
        </Card.Body>
      </Card>
      
      {showContent && (
        <Card className="shadow-sm">
          <Card.Header style={{ background: GRADIENTS.warning, color: 'white', borderRadius: '10px 10px 0 0' }}>
            <h5 className="mb-0">
              <i className="bi bi-palette-fill me-2"></i>
              {selectedChart.charAt(0).toUpperCase() + selectedChart.slice(1)} Chart Creator
            </h5>
          </Card.Header>
          <Card.Body>
            {error && <Alert variant="danger">{error}</Alert>}
            
            <Form className="mb-3">
              <Row>
                <Col md={4}>
                  <Form.Group className="mb-3">
                    <Form.Label>Chart Title</Form.Label>
                    <Form.Control 
                      type="text" 
                      placeholder="Enter chart title"
                      value={chartTitle}
                      onChange={(e) => setChartTitle(e.target.value)}
                    />
                  </Form.Group>
                </Col>
                <Col md={4}>
                  <Form.Group className="mb-3">
                    <Form.Label>X-Axis Label</Form.Label>
                    <Form.Control 
                      type="text" 
                      placeholder="Enter X-axis label"
                      value={xAxisLabel}
                      onChange={(e) => setXAxisLabel(e.target.value)}
                    />
                  </Form.Group>
                </Col>
                <Col md={4}>
                  <Form.Group className="mb-3">
                    <Form.Label>Y-Axis Label</Form.Label>
                    <Form.Control 
                      type="text" 
                      placeholder="Enter Y-axis label"
                      value={yAxisLabel}
                      onChange={(e) => setYAxisLabel(e.target.value)}
                    />
                  </Form.Group>
                </Col>
              </Row>
              
              <Row>
                <Col md={6}>
                  <Form.Group className="mb-3">
                    <Form.Label>Data Labels</Form.Label>
                    <Form.Control 
                      as="textarea" 
                      rows={3} 
                      placeholder="Enter labels separated by commas"
                      value={dataLabels}
                      onChange={(e) => setDataLabels(e.target.value)}
                    />
                    <Form.Text className="text-muted">
                      Example: Category A, Category B, Category C
                    </Form.Text>
                  </Form.Group>
                </Col>
                <Col md={6}>
                  <Form.Group className="mb-3">
                    <Form.Label>Data Values</Form.Label>
                    <Form.Control 
                      as="textarea" 
                      rows={3} 
                      placeholder="Enter values separated by commas"
                      value={dataValues}
                      onChange={(e) => setDataValues(e.target.value)}
                    />
                    <Form.Text className="text-muted">
                      Example: 25, 35, 40
                    </Form.Text>
                  </Form.Group>
                </Col>
              </Row>
              
              <div className="d-grid gap-2 d-md-flex justify-content-md-end">
                <Button variant="primary" className="px-4" onClick={generateChart}>
                  <i className="bi bi-bar-chart me-2"></i>
                  Generate Chart
                </Button>
              </div>
            </Form>
            
            {!results && (
              <div className="chart-placeholder bg-light p-5 text-center rounded">
                <i className={`bi bi-${
                  selectedChart === 'bar' ? 'bar-chart-fill' :
                  selectedChart === 'pie' ? 'pie-chart-fill' :
                  selectedChart === 'line' ? 'graph-up' : 'diagram-3'
                } display-1 text-primary opacity-50`}></i>
                <h5 className="mt-3">{selectedChart.charAt(0).toUpperCase() + selectedChart.slice(1)} Chart Preview</h5>
                <p className="text-muted">Enter data and click generate to create your chart</p>
              </div>
            )}
            
            {results && (
              <>
                <Card className="mb-4 shadow-sm">
                  <Card.Header style={{ background: GRADIENTS.warning, color: 'white', borderRadius: '10px 10px 0 0' }}>
                    <h5 className="mb-0">{results.title}</h5>
                  </Card.Header>
                  <Card.Body>
                    {renderChart()}
                  </Card.Body>
                </Card>
                
                {renderDataTable()}
              </>
            )}
          </Card.Body>
        </Card>
      )}
    </div>
  );
}

function App() {
  const [key, setKey] = useState('basic');

  return (
    <Container className="calculator">
      <div className="app-header mb-4" style={{ background: GRADIENTS.primary, borderRadius: '8px', padding: '1.5rem', marginBottom: '2rem', boxShadow: '0 4px 20px rgba(0,0,0,0.15)' }}>
        <h1 className="text-center text-white mb-3">Statistical and Probability Calculator</h1>
        <p className="text-white text-center mb-0">Comprehensive statistical analysis and visualization tools</p>
      </div>
      
      <Tabs
        activeKey={key}
        onSelect={(k) => k && setKey(k)}
        className="mb-4 custom-tabs"
        fill
      >
        <Tab eventKey="basic" title={
          <div className="d-flex align-items-center">
            <i className="bi bi-calculator me-2"></i>
            <span>Basic Statistics</span>
          </div>
        }>
          <SimpleStatistics />
        </Tab>
        
        <Tab eventKey="probability" title={
          <div className="d-flex align-items-center">
            <i className="bi bi-graph-up me-2"></i>
            <span>Probability Distributions</span>
          </div>
        }>
          <ProbabilityDistribution />
        </Tab>
        
        <Tab eventKey="inferential" title={
          <div className="d-flex align-items-center">
            <i className="bi bi-bar-chart me-2"></i>
            <span>Inferential Statistics</span>
          </div>
        }>
          <InferentialStatistics />
        </Tab>
        
        <Tab eventKey="regression" title={
          <div className="d-flex align-items-center">
            <i className="bi bi-graph-up-arrow me-2"></i>
            <span>Regression</span>
          </div>
        }>
          <RegressionAnalysis />
        </Tab>
        
        <Tab eventKey="visualization" title={
          <div className="d-flex align-items-center">
            <i className="bi bi-pie-chart me-2"></i>
            <span>Visualization</span>
          </div>
        }>
          <DataVisualization />
        </Tab>
        
        <Tab eventKey="about" title={
          <div className="d-flex align-items-center">
            <i className="bi bi-info-circle me-2"></i>
            <span>About</span>
          </div>
        }>
          <div className="mt-4">
            <div className="feature-card mb-4" style={{ background: GRADIENTS.secondary, padding: '2rem', color: 'white', borderRadius: '8px', marginBottom: '1rem' }}>
              <h3><i className="bi bi-people-fill me-2"></i>Created by Group 8</h3>
              <p className="mb-0">A comprehensive statistical analysis and calculator tool</p>
            </div>
            
            <Card className="mb-4 shadow-sm">
              <Card.Header style={{ background: GRADIENTS.info, color: 'white', borderRadius: '10px 10px 0 0' }}>
                <h5 className="mb-0"><i className="bi bi-person-badge me-2"></i>Team Members</h5>
              </Card.Header>
              <Card.Body>
                <Row className="mb-2">
                  <Col md={4}>
                    <div className="d-flex align-items-center">
                      <div className="rounded-circle bg-primary text-white p-3 me-3 text-center" style={{width: "50px", height: "50px"}}>
                        <i className="bi bi-person"></i>
                      </div>
                      <div>
                        <h5 className="mb-0">Kevin Syonin</h5>
                      </div>
                    </div>
                  </Col>
                  <Col md={4}>
                    <div className="d-flex align-items-center">
                      <div className="rounded-circle bg-success text-white p-3 me-3 text-center" style={{width: "50px", height: "50px"}}>
                        <i className="bi bi-person"></i>
                      </div>
                      <div>
                        <h5 className="mb-0">Excel Viryan</h5>
                      </div>
                    </div>
                  </Col>
                  <Col md={4}>
                    <div className="d-flex align-items-center">
                      <div className="rounded-circle bg-warning text-white p-3 me-3 text-center" style={{width: "50px", height: "50px"}}>
                        <i className="bi bi-person"></i>
                      </div>
                      <div>
                        <h5 className="mb-0">Gerald Darrly Joseph Manurung</h5>
                      </div>
                    </div>
                  </Col>
                </Row>
              </Card.Body>
            </Card>

            <Card className="shadow-sm">
              <Card.Header style={{ background: GRADIENTS.warning, color: 'white', borderRadius: '10px 10px 0 0' }}>
                <h5 className="mb-0"><i className="bi bi-list-check me-2"></i>Application Features</h5>
              </Card.Header>
              <Card.Body>
                <ul className="list-group list-group-flush">
                  <li className="list-group-item d-flex align-items-center">
                    <i className="bi bi-calculator me-3 text-primary fs-4"></i>
                    <div>
                      <h5 className="mb-1">Basic Statistics</h5>
                      <p className="mb-0 text-muted">Calculate mean, median, mode, variance, standard deviation, and more</p>
                    </div>
                  </li>
                  <li className="list-group-item d-flex align-items-center">
                    <i className="bi bi-graph-up me-3 text-success fs-4"></i>
                    <div>
                      <h5 className="mb-1">Probability Distributions</h5>
                      <p className="mb-0 text-muted">Work with binomial, Poisson, normal, and exponential distributions</p>
                    </div>
                  </li>
                  <li className="list-group-item d-flex align-items-center">
                    <i className="bi bi-bar-chart me-3 text-danger fs-4"></i>
                    <div>
                      <h5 className="mb-1">Inferential Statistics</h5>
                      <p className="mb-0 text-muted">Calculate confidence intervals, perform hypothesis testing, and chi-square tests</p>
                    </div>
                  </li>
                  <li className="list-group-item d-flex align-items-center">
                    <i className="bi bi-graph-up-arrow me-3 text-info fs-4"></i>
                    <div>
                      <h5 className="mb-1">Regression & Correlation</h5>
                      <p className="mb-0 text-muted">Analyze relationships between variables with regression analysis</p>
                    </div>
                  </li>
                  <li className="list-group-item d-flex align-items-center">
                    <i className="bi bi-pie-chart me-3 text-warning fs-4"></i>
                    <div>
                      <h5 className="mb-1">Data Visualization</h5>
                      <p className="mb-0 text-muted">Create bar charts, pie charts, line charts, and scatter plots</p>
                    </div>
                  </li>
                </ul>
              </Card.Body>
            </Card>
          </div>
        </Tab>
      </Tabs>
    </Container>
  );
}

const root = ReactDOM.createRoot(
  document.getElementById('root') as HTMLElement
);
root.render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
); 