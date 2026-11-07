import React, { useState } from 'react';
import { Form, Button, Card, Row, Col, Alert } from 'react-bootstrap';
import * as math from 'mathjs';

const BasicStatistics: React.FC = () => {
  const [data, setData] = useState<string>('');
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
      
      // Calculate mode
      const frequency: Record<number, number> = {};
      let maxFreq = 0;
      let modes: number[] = [];
      
      parsedData.forEach(num => {
        frequency[num] = (frequency[num] || 0) + 1;
        if (frequency[num] > maxFreq) {
          maxFreq = frequency[num];
          modes = [num];
        } else if (frequency[num] === maxFreq) {
          modes.push(num);
        }
      });

      // Calculate quartiles
      const q1 = calculateQuartile(sortedData, 0.25);
      const q3 = calculateQuartile(sortedData, 0.75);
      
      const stats = {
        count: parsedData.length,
        mean: math.mean(parsedData),
        median: math.median(parsedData),
        mode: maxFreq > 1 ? modes : 'No mode',
        range: math.max(parsedData) - math.min(parsedData),
        min: math.min(parsedData),
        max: math.max(parsedData),
        variance: math.variance(parsedData),
        stdDev: math.std(parsedData),
        q1: q1,
        q3: q3,
        iqr: q3 - q1
      };

      setResults(stats);
    } catch (err: any) {
      setError(err.message || 'Error calculating statistics');
    }
  };

  const calculateQuartile = (sortedData: number[], quartile: number): number => {
    const pos = (sortedData.length - 1) * quartile;
    const base = Math.floor(pos);
    const rest = pos - base;
    
    if (sortedData[base + 1] !== undefined) {
      return sortedData[base] + rest * (sortedData[base + 1] - sortedData[base]);
    } else {
      return sortedData[base];
    }
  };

  return (
    <div>
      <Card className="mb-4">
        <Card.Body>
          <Card.Title>Data Input</Card.Title>
          <Form>
            <Form.Group className="mb-3">
              <Form.Label>Enter your data (comma or space separated numbers)</Form.Label>
              <Form.Control
                as="textarea"
                rows={3}
                value={data}
                onChange={(e) => setData(e.target.value)}
                placeholder="Example: 12, 15, 18, 22, 30, 31, 35, 40, 41, 42, 43, 55"
              />
            </Form.Group>
            <Button variant="primary" onClick={calculateStats}>
              Calculate Statistics
            </Button>
          </Form>
        </Card.Body>
      </Card>

      {error && <Alert variant="danger">{error}</Alert>}

      {results && (
        <Card className="result-card">
          <Card.Body>
            <Card.Title>Results</Card.Title>
            <Row>
              <Col md={6}>
                <p><strong>Count:</strong> {results.count}</p>
                <p><strong>Mean:</strong> {results.mean.toFixed(4)}</p>
                <p><strong>Median:</strong> {results.median.toFixed(4)}</p>
                <p><strong>Mode:</strong> {Array.isArray(results.mode) ? results.mode.join(', ') : results.mode}</p>
                <p><strong>Range:</strong> {results.range.toFixed(4)}</p>
                <p><strong>Minimum:</strong> {results.min.toFixed(4)}</p>
              </Col>
              <Col md={6}>
                <p><strong>Maximum:</strong> {results.max.toFixed(4)}</p>
                <p><strong>Variance:</strong> {results.variance.toFixed(4)}</p>
                <p><strong>Standard Deviation:</strong> {results.stdDev.toFixed(4)}</p>
                <p><strong>Q1 (25%):</strong> {results.q1.toFixed(4)}</p>
                <p><strong>Q3 (75%):</strong> {results.q3.toFixed(4)}</p>
                <p><strong>IQR:</strong> {results.iqr.toFixed(4)}</p>
              </Col>
            </Row>
          </Card.Body>
        </Card>
      )}

      {results && (
        <Card className="mt-4 explanation">
          <Card.Body>
            <Card.Title>Explanations</Card.Title>
            <p><strong>Mean:</strong> The average of all values = sum of all values / number of values.</p>
            <p><strong>Median:</strong> The middle value when the data is sorted.</p>
            <p><strong>Mode:</strong> The value(s) that appear most frequently.</p>
            <p><strong>Range:</strong> The difference between the maximum and minimum values.</p>
            <p><strong>Variance:</strong> A measure of how spread out the data is from the mean.</p>
            <p><strong>Standard Deviation:</strong> Square root of variance, measuring the amount of variation in the dataset.</p>
            <p><strong>IQR (Interquartile Range):</strong> The difference between the 75th (Q3) and 25th (Q1) percentiles.</p>
          </Card.Body>
        </Card>
      )}
    </div>
  );
};

export default BasicStatistics; 