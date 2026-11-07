import React, { useState } from 'react';
import { Form, Button, Card, Row, Col, Alert } from 'react-bootstrap';
import * as math from 'mathjs';
import { ScatterChart, Scatter, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, Line } from 'recharts';

const RegressionCorrelation: React.FC = () => {
  const [xValues, setXValues] = useState<string>('');
  const [yValues, setYValues] = useState<string>('');
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

  const calculateRegression = () => {
    setError('');
    try {
      const xData = parseData(xValues);
      const yData = parseData(yValues);
      
      if (xData.length === 0 || yData.length === 0) {
        setError('Please enter valid numeric data for both X and Y');
        return;
      }
      
      if (xData.length !== yData.length) {
        setError('X and Y must have the same number of values');
        return;
      }

      // Calculate means
      const xMean = math.mean(xData);
      const yMean = math.mean(yData);
      
      // Calculate sums for regression formula
      let sumXY = 0;
      let sumXSquared = 0;
      let sumYSquared = 0;
      
      for (let i = 0; i < xData.length; i++) {
        sumXY += xData[i] * yData[i];
        sumXSquared += xData[i] * xData[i];
        sumYSquared += yData[i] * yData[i];
      }
      
      // Calculate slope (b1)
      const numerator = sumXY - xData.length * xMean * yMean;
      const denominator = sumXSquared - xData.length * xMean * xMean;
      const slope = numerator / denominator;
      
      // Calculate y-intercept (b0)
      const intercept = yMean - slope * xMean;
      
      // Calculate correlation coefficient (r)
      const SSxy = sumXY - xData.length * xMean * yMean;
      const SSxx = sumXSquared - xData.length * xMean * xMean;
      const SSyy = sumYSquared - yData.length * yMean * yMean;
      const r = SSxy / Math.sqrt(SSxx * SSyy);
      
      // Calculate coefficient of determination (r-squared)
      const rSquared = r * r;
      
      // Calculate standard error of estimate
      let sumSquaredResiduals = 0;
      for (let i = 0; i < xData.length; i++) {
        const predicted = intercept + slope * xData[i];
        sumSquaredResiduals += Math.pow(yData[i] - predicted, 2);
      }
      const standardError = Math.sqrt(sumSquaredResiduals / (xData.length - 2));
      
      // Prepare data for scatter plot
      const scatterData = xData.map((x, i) => ({ x, y: yData[i] }));
      
      // Prepare data for regression line
      const minX = Math.min(...xData);
      const maxX = Math.max(...xData);
      const lineData = [
        { x: minX, y: intercept + slope * minX },
        { x: maxX, y: intercept + slope * maxX }
      ];
      
      setResults({
        n: xData.length,
        xMean,
        yMean,
        slope,
        intercept,
        r,
        rSquared,
        standardError,
        scatterData,
        lineData,
        equation: `y = ${slope.toFixed(4)}x + ${intercept.toFixed(4)}`
      });
    } catch (err: any) {
      setError(err.message || 'Error calculating regression');
    }
  };

  return (
    <div>
      <Card className="mb-4">
        <Card.Body>
          <Card.Title>Linear Regression & Correlation Calculator</Card.Title>
          <Form>
            <Row>
              <Col md={6}>
                <Form.Group className="mb-3">
                  <Form.Label>X Values (comma or space separated)</Form.Label>
                  <Form.Control
                    as="textarea"
                    rows={3}
                    value={xValues}
                    onChange={(e) => setXValues(e.target.value)}
                    placeholder="Example: 1, 2, 3, 4, 5"
                  />
                </Form.Group>
              </Col>
              <Col md={6}>
                <Form.Group className="mb-3">
                  <Form.Label>Y Values (comma or space separated)</Form.Label>
                  <Form.Control
                    as="textarea"
                    rows={3}
                    value={yValues}
                    onChange={(e) => setYValues(e.target.value)}
                    placeholder="Example: 2, 4, 5, 4, 5"
                  />
                </Form.Group>
              </Col>
            </Row>
            <Button variant="primary" onClick={calculateRegression}>
              Calculate Regression
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
                  <p><strong>Mean of X:</strong> {results.xMean.toFixed(4)}</p>
                  <p><strong>Mean of Y:</strong> {results.yMean.toFixed(4)}</p>
                  <p><strong>Regression Equation:</strong> {results.equation}</p>
                </Col>
                <Col md={6}>
                  <p><strong>Slope (b₁):</strong> {results.slope.toFixed(4)}</p>
                  <p><strong>Y-intercept (b₀):</strong> {results.intercept.toFixed(4)}</p>
                  <p><strong>Correlation Coefficient (r):</strong> {results.r.toFixed(4)}</p>
                  <p><strong>Coefficient of Determination (r²):</strong> {results.rSquared.toFixed(4)}</p>
                  <p><strong>Standard Error of Estimate:</strong> {results.standardError.toFixed(4)}</p>
                </Col>
              </Row>
            </Card.Body>
          </Card>

          <Card className="mb-4">
            <Card.Body>
              <Card.Title>Scatter Plot with Regression Line</Card.Title>
              <div className="chart-container">
                <ResponsiveContainer width="100%" height={400}>
                  <ScatterChart margin={{ top: 20, right: 20, bottom: 20, left: 20 }}>
                    <CartesianGrid />
                    <XAxis 
                      type="number" 
                      dataKey="x" 
                      name="X" 
                      label={{ value: 'X', position: 'insideBottomRight', offset: -10 }} 
                    />
                    <YAxis 
                      type="number" 
                      dataKey="y" 
                      name="Y" 
                      label={{ value: 'Y', angle: -90, position: 'insideLeft' }} 
                    />
                    <Tooltip cursor={{ strokeDasharray: '3 3' }} />
                    <Scatter name="Data Points" data={results.scatterData} fill="#8884d8" />
                    <Line 
                      type="monotone" 
                      dataKey="y" 
                      data={results.lineData} 
                      stroke="#ff7300" 
                      dot={false} 
                      activeDot={false}
                      name="Regression Line"
                    />
                  </ScatterChart>
                </ResponsiveContainer>
              </div>
            </Card.Body>
          </Card>

          <Card className="explanation">
            <Card.Body>
              <Card.Title>Interpretation</Card.Title>
              
              <p><strong>Regression Equation:</strong> {results.equation}</p>
              <p>This means that for each unit increase in X, Y is expected to change by {results.slope.toFixed(4)} units.</p>
              
              <p><strong>Correlation Coefficient (r):</strong> {results.r.toFixed(4)}</p>
              <p>
                {Math.abs(results.r) < 0.3 ? 
                  'This indicates a weak linear relationship between X and Y.' : 
                  Math.abs(results.r) < 0.7 ? 
                    'This indicates a moderate linear relationship between X and Y.' : 
                    'This indicates a strong linear relationship between X and Y.'}
                {results.r > 0 ? 
                  ' As X increases, Y tends to increase.' : 
                  ' As X increases, Y tends to decrease.'}
              </p>
              
              <p><strong>Coefficient of Determination (r²):</strong> {results.rSquared.toFixed(4)}</p>
              <p>This means that approximately {(results.rSquared * 100).toFixed(2)}% of the variation in Y can be explained by the linear relationship with X.</p>
              
              <div className="step-container mt-3">
                <p><strong>How to use the regression equation for prediction:</strong></p>
                <p>To predict Y for a given X value, substitute X into the equation:</p>
                <p className="ms-3">Y = {results.slope.toFixed(4)} × X + {results.intercept.toFixed(4)}</p>
                <p>For example, if X = 10:</p>
                <p className="ms-3">Y = {results.slope.toFixed(4)} × 10 + {results.intercept.toFixed(4)} = {(results.slope * 10 + results.intercept).toFixed(4)}</p>
              </div>
            </Card.Body>
          </Card>
        </>
      )}
    </div>
  );
};

export default RegressionCorrelation; 