import React, { useState } from 'react';
import { Container, Tabs, Tab } from 'react-bootstrap';
import BasicStatistics from './components/BasicStatistics';
import ProbabilityDistributions from './components/ProbabilityDistributions';
import InferentialStatistics from './components/InferentialStatistics';
import RegressionCorrelation from './components/RegressionCorrelation';
import DataVisualization from './components/DataVisualization';

function App() {
  const [key, setKey] = useState('basic');
  
  return (
    <Container className="calculator">
      <h1 className="text-center mb-4">Statistical and Probability Calculator</h1>
      
      <Tabs
        activeKey={key}
        onSelect={(k) => k && setKey(k)}
        className="mb-4"
      >
        <Tab eventKey="basic" title="Basic Statistics">
          <BasicStatistics />
        </Tab>
        <Tab eventKey="probability" title="Probability Distributions">
          <ProbabilityDistributions />
        </Tab>
        <Tab eventKey="inferential" title="Inferential Statistics">
          <InferentialStatistics />
        </Tab>
        <Tab eventKey="regression" title="Regression & Correlation">
          <RegressionCorrelation />
        </Tab>
        <Tab eventKey="visualization" title="Data Visualization">
          <DataVisualization />
        </Tab>
      </Tabs>
    </Container>
  );
}

export default App; 