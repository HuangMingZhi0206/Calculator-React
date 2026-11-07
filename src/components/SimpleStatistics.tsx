import React, { useState } from 'react';
import { Form, Button, Card, Row, Col, Alert } from 'react-bootstrap';

const SimpleStatistics: React.FC = () => {
  const [data, setData] = useState<string>('');
  const [results, setResults] = useState<any>(null);
  const [error, setError] = useState<string>('');

  const parseData = (inputData: string): number[] => {
    return inputData.split(/[,;\s]+/)
      .filter(val => val.trim() !== '')
      .map(val => {
        const num = parseFloat(val);
        if (isNaN(num)) throw new Error(`Invalid number: ${val}`);
        return num;
      });
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
      
      const sum = parsedData.reduce((acc, val) => acc + val, 0);
      const mean = sum / parsedData.length;

      // Calculate median
      let median: number;
      const mid = Math.floor(sortedData.length / 2);
      median = sortedData.length % 2 === 0
        ? (sortedData[mid - 1] + sortedData[mid]) / 2
        : sortedData[mid];

      // Calculate variance and standard deviation
      const variance = parsedData.reduce((acc, val) => acc + Math.pow(val - mean, 2), 0) / parsedData.length;
      const stdDev = Math.sqrt(variance);
      
      setResults({
        count: parsedData.length,
        sum,
        mean,
        median,
        min: sortedData[0],
        max: sortedData[sortedData.length - 1],
        range: sortedData[sortedData.length - 1] - sortedData[0],
        variance,
        stdDev
      });
    } catch (err: any) {
      setError(err.message || 'Error calculating statistics');
    }
  };

  return (
    <div>
      <Card className="mb-4">
        <Card.Body>
          <Card.Title>Basic Statistics Calculator</Card.Title>
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
                <p><strong>Sum:</strong> {results.sum.toFixed(4)}</p>
                <p><strong>Mean:</strong> {results.mean.toFixed(4)}</p>
                <p><strong>Median:</strong> {results.median.toFixed(4)}</p>
                <p><strong>Range:</strong> {results.range.toFixed(4)}</p>
              </Col>
              <Col md={6}>
                <p><strong>Minimum:</strong> {results.min.toFixed(4)}</p>
                <p><strong>Maximum:</strong> {results.max.toFixed(4)}</p>
                <p><strong>Variance:</strong> {results.variance.toFixed(4)}</p>
                <p><strong>Standard Deviation:</strong> {results.stdDev.toFixed(4)}</p>
              </Col>
            </Row>
          </Card.Body>
        </Card>
      )}
    </div>
  );
};

export default SimpleStatistics; 