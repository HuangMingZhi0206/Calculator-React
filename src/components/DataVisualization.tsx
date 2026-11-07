import React, { useState } from 'react';
import { Form, Button, Card, Row, Col, Alert } from 'react-bootstrap';
import * as math from 'mathjs';
import {
  BarChart, Bar, LineChart, Line, PieChart, Pie, ScatterChart, Scatter,
  XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, Cell
} from 'recharts';

const DataVisualization: React.FC = () => {
  const [data, setData] = useState<string>('');
  const [labels, setLabels] = useState<string>('');
  const [chartType, setChartType] = useState<string>('bar');
  const [title, setTitle] = useState<string>('');
  const [xAxisLabel, setXAxisLabel] = useState<string>('X-Axis');
  const [yAxisLabel, setYAxisLabel] = useState<string>('Y-Axis');
  const [results, setResults] = useState<any>(null);
  const [error, setError] = useState<string>('');

  const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884d8', '#82ca9d', '#ffc658', '#8dd1e1'];

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

  const parseLabels = (inputLabels: string): string[] => {
    return inputLabels.split(/[,;\s]+/)
      .filter(val => val.trim() !== '');
  };

  const generateChart = () => {
    setError('');
    try {
      const parsedData = parseData(data);
      
      if (parsedData.length === 0) {
        setError('Please enter valid numeric data');
        return;
      }

      let parsedLabels = labels ? parseLabels(labels) : [];
      
      // If no labels provided or not enough labels, generate default labels
      if (parsedLabels.length < parsedData.length) {
        parsedLabels = Array.from({ length: parsedData.length }, (_, i) => `Item ${i + 1}`);
      }
      
      // Prepare chart data
      const chartData = parsedData.map((value, index) => ({
        name: parsedLabels[index],
        value
      }));
      
      // Calculate basic statistics
      const min = math.min(parsedData);
      const max = math.max(parsedData);
      const mean = math.mean(parsedData);
      const median = math.median(parsedData);
      const stdDev = math.std(parsedData);
      const sum = math.sum(parsedData);
      
      setResults({
        chartData,
        min,
        max,
        mean,
        median,
        stdDev,
        sum,
        chartType,
        title: title || 'Data Visualization',
        xAxisLabel: xAxisLabel || 'X-Axis',
        yAxisLabel: yAxisLabel || 'Y-Axis'
      });
    } catch (err: any) {
      setError(err.message || 'Error generating chart');
    }
  };

  const renderChart = () => {
    if (!results) return null;
    
    switch (results.chartType) {
      case 'bar':
        return (
          <ResponsiveContainer width="100%" height={400}>
            <BarChart data={results.chartData} margin={{ top: 20, right: 30, left: 20, bottom: 40 }}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis 
                dataKey="name" 
                label={{ value: results.xAxisLabel, position: 'insideBottomRight', offset: -10 }} 
              />
              <YAxis 
                label={{ value: results.yAxisLabel, angle: -90, position: 'insideLeft' }} 
              />
              <Tooltip />
              <Legend />
              <Bar dataKey="value" fill="#8884d8">
                {results.chartData.map((entry: any, index: number) => (
                  <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        );
      
      case 'line':
        return (
          <ResponsiveContainer width="100%" height={400}>
            <LineChart data={results.chartData} margin={{ top: 20, right: 30, left: 20, bottom: 40 }}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis 
                dataKey="name" 
                label={{ value: results.xAxisLabel, position: 'insideBottomRight', offset: -10 }} 
              />
              <YAxis 
                label={{ value: results.yAxisLabel, angle: -90, position: 'insideLeft' }} 
              />
              <Tooltip />
              <Legend />
              <Line type="monotone" dataKey="value" stroke="#8884d8" activeDot={{ r: 8 }} />
            </LineChart>
          </ResponsiveContainer>
        );
      
      case 'pie':
        return (
          <ResponsiveContainer width="100%" height={400}>
            <PieChart margin={{ top: 20, right: 30, left: 20, bottom: 20 }}>
              <Pie
                data={results.chartData}
                cx="50%"
                cy="50%"
                labelLine={true}
                outerRadius={150}
                fill="#8884d8"
                dataKey="value"
                nameKey="name"
                label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
              >
                {results.chartData.map((entry: any, index: number) => (
                  <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                ))}
              </Pie>
              <Tooltip formatter={(value) => [`${value}`, 'Value']} />
              <Legend />
            </PieChart>
          </ResponsiveContainer>
        );
      
      case 'scatter':
        // For scatter plot, we need x and y coordinates
        const scatterData = results.chartData.map((item: any, index: number) => ({
          x: index + 1, // Using index as x-coordinate
          y: item.value,
          name: item.name
        }));
        
        return (
          <ResponsiveContainer width="100%" height={400}>
            <ScatterChart margin={{ top: 20, right: 30, left: 20, bottom: 40 }}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis 
                type="number" 
                dataKey="x" 
                name="Index" 
                label={{ value: results.xAxisLabel, position: 'insideBottomRight', offset: -10 }} 
              />
              <YAxis 
                type="number" 
                dataKey="y" 
                name="Value" 
                label={{ value: results.yAxisLabel, angle: -90, position: 'insideLeft' }} 
              />
              <Tooltip cursor={{ strokeDasharray: '3 3' }} formatter={(value, name, props) => {
                const item = scatterData[props.payload.x - 1];
                return [value, `${item.name}: ${name}`];
              }} />
              <Legend />
              <Scatter name="Values" data={scatterData} fill="#8884d8">
                {scatterData.map((entry: any, index: number) => (
                  <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                ))}
              </Scatter>
            </ScatterChart>
          </ResponsiveContainer>
        );
      
      default:
        return null;
    }
  };

  return (
    <div>
      <Card className="mb-4">
        <Card.Body>
          <Card.Title>Data Visualization</Card.Title>
          <Form>
            <Form.Group className="mb-3">
              <Form.Label>Enter your data (comma or space separated numbers)</Form.Label>
              <Form.Control
                as="textarea"
                rows={3}
                value={data}
                onChange={(e) => setData(e.target.value)}
                placeholder="Example: 12, 15, 18, 22, 30, 31, 35, 40"
              />
            </Form.Group>
            <Form.Group className="mb-3">
              <Form.Label>Enter labels (optional, comma separated)</Form.Label>
              <Form.Control
                as="textarea"
                rows={2}
                value={labels}
                onChange={(e) => setLabels(e.target.value)}
                placeholder="Example: Jan, Feb, Mar, Apr, May, Jun, Jul, Aug"
              />
            </Form.Group>
            <Row>
              <Col md={6}>
                <Form.Group className="mb-3">
                  <Form.Label>Chart Type</Form.Label>
                  <Form.Select
                    value={chartType}
                    onChange={(e) => setChartType(e.target.value)}
                  >
                    <option value="bar">Bar Chart</option>
                    <option value="line">Line Chart</option>
                    <option value="pie">Pie Chart</option>
                    <option value="scatter">Scatter Plot</option>
                  </Form.Select>
                </Form.Group>
              </Col>
              <Col md={6}>
                <Form.Group className="mb-3">
                  <Form.Label>Chart Title</Form.Label>
                  <Form.Control
                    type="text"
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    placeholder="Enter chart title"
                  />
                </Form.Group>
              </Col>
            </Row>
            <Row>
              <Col md={6}>
                <Form.Group className="mb-3">
                  <Form.Label>X-Axis Label</Form.Label>
                  <Form.Control
                    type="text"
                    value={xAxisLabel}
                    onChange={(e) => setXAxisLabel(e.target.value)}
                    placeholder="X-Axis"
                  />
                </Form.Group>
              </Col>
              <Col md={6}>
                <Form.Group className="mb-3">
                  <Form.Label>Y-Axis Label</Form.Label>
                  <Form.Control
                    type="text"
                    value={yAxisLabel}
                    onChange={(e) => setYAxisLabel(e.target.value)}
                    placeholder="Y-Axis"
                  />
                </Form.Group>
              </Col>
            </Row>
            <Button variant="primary" onClick={generateChart}>
              Generate Chart
            </Button>
          </Form>
        </Card.Body>
      </Card>

      {error && <Alert variant="danger">{error}</Alert>}

      {results && (
        <>
          <Card className="mb-4">
            <Card.Body>
              <Card.Title>{results.title}</Card.Title>
              <div className="chart-container">
                {renderChart()}
              </div>
            </Card.Body>
          </Card>

          <Card className="result-card">
            <Card.Body>
              <Card.Title>Data Statistics</Card.Title>
              <Row>
                <Col md={6}>
                  <p><strong>Count:</strong> {results.chartData.length}</p>
                  <p><strong>Sum:</strong> {results.sum.toFixed(4)}</p>
                  <p><strong>Minimum:</strong> {results.min.toFixed(4)}</p>
                </Col>
                <Col md={6}>
                  <p><strong>Maximum:</strong> {results.max.toFixed(4)}</p>
                  <p><strong>Mean:</strong> {results.mean.toFixed(4)}</p>
                  <p><strong>Median:</strong> {results.median.toFixed(4)}</p>
                  <p><strong>Standard Deviation:</strong> {results.stdDev.toFixed(4)}</p>
                </Col>
              </Row>
            </Card.Body>
          </Card>
        </>
      )}
    </div>
  );
};

export default DataVisualization; 