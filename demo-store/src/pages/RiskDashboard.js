import React, { useState, useEffect, useMemo } from 'react';
import { Chart as ChartJS, CategoryScale, LinearScale, PointElement, LineElement, BarElement, Title, Tooltip, Legend, ArcElement } from 'chart.js';
import { Line, Bar, Doughnut } from 'react-chartjs-2';
import { useIdRock } from '../contexts/IdRockContext';
import './RiskDashboard.css';

// Register Chart.js components
ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  Title,
  Tooltip,
  Legend,
  ArcElement
);

function RiskDashboard() {
  const { sessionId, isInitialized, trackEvent, RISK_LEVELS, assessRisk } = useIdRock();
  const [dashboardData, setDashboardData] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedTimeframe, setSelectedTimeframe] = useState('24h');
  const [realTimeData, setRealTimeData] = useState(null);

  // Generate mock historical data for demonstration
  const generateMockData = () => {
    const timeframes = {
      '1h': { points: 12, label: 'Last Hour', unit: '5m' },
      '24h': { points: 24, label: 'Last 24 Hours', unit: '1h' },
      '7d': { points: 7, label: 'Last 7 Days', unit: '1d' },
      '30d': { points: 30, label: 'Last 30 Days', unit: '1d' }
    };

    const { points, label } = timeframes[selectedTimeframe];
    const now = new Date();
    
    // Generate timestamps
    const timestamps = Array.from({ length: points }, (_, i) => {
      const time = new Date(now);
      if (selectedTimeframe === '1h') time.setMinutes(now.getMinutes() - (points - 1 - i) * 5);
      else if (selectedTimeframe === '24h') time.setHours(now.getHours() - (points - 1 - i));
      else if (selectedTimeframe === '7d') time.setDate(now.getDate() - (points - 1 - i));
      else time.setDate(now.getDate() - (points - 1 - i));
      
      return selectedTimeframe === '1h' ? 
        time.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) :
        selectedTimeframe === '24h' ?
        time.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) :
        time.toLocaleDateString([], { month: 'short', day: 'numeric' });
    });

    // Generate risk scores with realistic patterns
    const riskScores = Array.from({ length: points }, (_, i) => {
      const baseScore = 25 + Math.sin(i / points * Math.PI * 2) * 15;
      const randomVariation = (Math.random() - 0.5) * 20;
      const timeOfDayFactor = selectedTimeframe === '24h' ? 
        Math.sin((i / points) * Math.PI * 2) * 10 : 0;
      
      return Math.max(0, Math.min(100, baseScore + randomVariation + timeOfDayFactor));
    });

    // Generate transaction counts
    const transactionCounts = Array.from({ length: points }, () => 
      Math.floor(Math.random() * 50) + 10
    );

    // Calculate risk distribution
    const lowRisk = riskScores.filter(score => score < 30).length;
    const mediumRisk = riskScores.filter(score => score >= 30 && score < 70).length;
    const highRisk = riskScores.filter(score => score >= 70).length;

    // Generate threat types
    const threatTypes = [
      { name: 'Velocity Checks', count: Math.floor(Math.random() * 15) + 5, severity: 'medium' },
      { name: 'Geolocation Anomalies', count: Math.floor(Math.random() * 10) + 2, severity: 'high' },
      { name: 'Device Fingerprint Mismatch', count: Math.floor(Math.random() * 8) + 1, severity: 'low' },
      { name: 'Payment Method Flags', count: Math.floor(Math.random() * 6) + 1, severity: 'high' },
      { name: 'Behavioral Analysis', count: Math.floor(Math.random() * 12) + 3, severity: 'medium' }
    ];

    return {
      timeframe: label,
      timestamps,
      riskScores,
      transactionCounts,
      riskDistribution: { low: lowRisk, medium: mediumRisk, high: highRisk },
      threatTypes,
      totalTransactions: transactionCounts.reduce((a, b) => a + b, 0),
      averageRiskScore: Math.round(riskScores.reduce((a, b) => a + b, 0) / riskScores.length * 10) / 10,
      flaggedTransactions: Math.floor(Math.random() * 15) + 3,
      blockedTransactions: Math.floor(Math.random() * 5) + 1
    };
  };

  // Load dashboard data
  useEffect(() => {
    const loadDashboardData = async () => {
      setIsLoading(true);
      
      try {
        await trackEvent('page_view', {
          page: 'risk_dashboard',
          timeframe: selectedTimeframe
        });

        // Simulate API call delay
        await new Promise(resolve => setTimeout(resolve, 1000));
        
        const mockData = generateMockData();
        setDashboardData(mockData);
      } catch (error) {
        console.error('Error loading dashboard data:', error);
      } finally {
        setIsLoading(false);
      }
    };

    if (isInitialized) {
      loadDashboardData();
    }
  }, [selectedTimeframe, isInitialized, trackEvent]);

  // Simulate real-time risk assessment
  useEffect(() => {
    if (!isInitialized) return;

    const interval = setInterval(async () => {
      try {
        const mockTransactionData = {
          event: 'live_transaction',
          amount: Math.floor(Math.random() * 1000) + 50,
          metadata: {
            simulatedTransaction: true,
            timestamp: new Date().toISOString()
          }
        };

        const riskResult = await assessRisk(mockTransactionData);
        setRealTimeData({
          ...riskResult,
          timestamp: new Date().toLocaleTimeString()
        });
      } catch (error) {
        console.error('Error in real-time assessment:', error);
      }
    }, 15000); // Update every 15 seconds

    return () => clearInterval(interval);
  }, [isInitialized, assessRisk]);

  // Chart configurations
  const riskTrendChartData = useMemo(() => {
    if (!dashboardData) return null;

    return {
      labels: dashboardData.timestamps,
      datasets: [
        {
          label: 'Risk Score',
          data: dashboardData.riskScores,
          borderColor: 'rgb(102, 126, 234)',
          backgroundColor: 'rgba(102, 126, 234, 0.1)',
          borderWidth: 2,
          fill: true,
          tension: 0.4,
          pointBackgroundColor: dashboardData.riskScores.map(score => {
            if (score < 30) return '#10b981';
            if (score < 70) return '#f59e0b';
            return '#ef4444';
          }),
          pointBorderColor: '#ffffff',
          pointBorderWidth: 2,
          pointRadius: 4
        }
      ]
    };
  }, [dashboardData]);

  const transactionVolumeChartData = useMemo(() => {
    if (!dashboardData) return null;

    return {
      labels: dashboardData.timestamps,
      datasets: [
        {
          label: 'Transactions',
          data: dashboardData.transactionCounts,
          backgroundColor: 'rgba(16, 185, 129, 0.6)',
          borderColor: 'rgb(16, 185, 129)',
          borderWidth: 1,
          borderRadius: 4
        }
      ]
    };
  }, [dashboardData]);

  const riskDistributionChartData = useMemo(() => {
    if (!dashboardData) return null;

    return {
      labels: ['Low Risk', 'Medium Risk', 'High Risk'],
      datasets: [
        {
          data: [dashboardData.riskDistribution.low, dashboardData.riskDistribution.medium, dashboardData.riskDistribution.high],
          backgroundColor: [
            'rgba(16, 185, 129, 0.8)',
            'rgba(245, 158, 11, 0.8)',
            'rgba(239, 68, 68, 0.8)'
          ],
          borderColor: [
            'rgb(16, 185, 129)',
            'rgb(245, 158, 11)',
            'rgb(239, 68, 68)'
          ],
          borderWidth: 2
        }
      ]
    };
  }, [dashboardData]);

  const chartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        display: true,
        position: 'top',
        labels: {
          usePointStyle: true,
          padding: 20,
          font: {
            size: 12,
            weight: 'bold'
          }
        }
      }
    },
    scales: {
      x: {
        grid: {
          display: false
        },
        ticks: {
          font: {
            size: 11
          }
        }
      },
      y: {
        grid: {
          color: 'rgba(0, 0, 0, 0.05)'
        },
        ticks: {
          font: {
            size: 11
          }
        }
      }
    }
  };

  const getRiskLevelDisplay = (score, level) => {
    const config = RISK_LEVELS[level] || RISK_LEVELS.MEDIUM;
    return (
      <div className={`risk-indicator-dashboard risk-${level.toLowerCase()}`}>
        <div className="risk-score-large">{score}</div>
        <div className="risk-level-text">{level} Risk</div>
      </div>
    );
  };

  if (!isInitialized) {
    return (
      <div className="dashboard-page">
        <div className="dashboard-container">
          <div className="initialization-message">
            <div className="init-icon">🔄</div>
            <h2>Initializing Security Dashboard</h2>
            <p>Setting up fraud detection monitoring...</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="dashboard-page">
      <div className="dashboard-container">
        {/* Dashboard Header */}
        <div className="dashboard-header">
          <div className="header-title-section">
            <h1 className="dashboard-title">Security Dashboard</h1>
            <p className="dashboard-subtitle">
              Real-time fraud detection monitoring and analytics
            </p>
          </div>
          
          <div className="header-controls">
            <div className="session-info">
              <span className="session-label">Session:</span>
              <code className="session-id">{sessionId?.slice(-8) || 'N/A'}</code>
            </div>
            
            <div className="timeframe-selector">
              <label htmlFor="timeframe">Timeframe:</label>
              <select 
                id="timeframe"
                value={selectedTimeframe}
                onChange={(e) => setSelectedTimeframe(e.target.value)}
                className="timeframe-select"
              >
                <option value="1h">Last Hour</option>
                <option value="24h">Last 24 Hours</option>
                <option value="7d">Last 7 Days</option>
                <option value="30d">Last 30 Days</option>
              </select>
            </div>
          </div>
        </div>

        {isLoading ? (
          <div className="dashboard-loading">
            <div className="loading-spinner-dashboard">
              <div className="spinner-large"></div>
              <p>Loading security analytics...</p>
            </div>
          </div>
        ) : (
          <>
            {/* Real-time Status */}
            {realTimeData && (
              <div className="realtime-section">
                <div className="realtime-header">
                  <h3>Live Transaction Analysis</h3>
                  <span className="realtime-timestamp">Last update: {realTimeData.timestamp}</span>
                </div>
                <div className="realtime-display">
                  {getRiskLevelDisplay(realTimeData.riskScore, realTimeData.riskLevel)}
                  <div className="realtime-details">
                    <div className="live-indicator">
                      <div className="pulse-dot"></div>
                      <span>Live Monitoring</span>
                    </div>
                    <div className="session-data">
                      Session: {realTimeData.sessionId?.slice(-8)}
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Key Metrics */}
            <div className="metrics-section">
              <div className="metric-card">
                <div className="metric-icon">📊</div>
                <div className="metric-content">
                  <div className="metric-value">{dashboardData?.totalTransactions || 0}</div>
                  <div className="metric-label">Total Transactions</div>
                </div>
              </div>
              
              <div className="metric-card">
                <div className="metric-icon">⚡</div>
                <div className="metric-content">
                  <div className="metric-value">{dashboardData?.averageRiskScore || 0}</div>
                  <div className="metric-label">Avg Risk Score</div>
                </div>
              </div>
              
              <div className="metric-card warning">
                <div className="metric-icon">🚩</div>
                <div className="metric-content">
                  <div className="metric-value">{dashboardData?.flaggedTransactions || 0}</div>
                  <div className="metric-label">Flagged Transactions</div>
                </div>
              </div>
              
              <div className="metric-card danger">
                <div className="metric-icon">🚫</div>
                <div className="metric-content">
                  <div className="metric-value">{dashboardData?.blockedTransactions || 0}</div>
                  <div className="metric-label">Blocked Transactions</div>
                </div>
              </div>
            </div>

            {/* Charts Section */}
            <div className="charts-section">
              {/* Risk Trend Chart */}
              <div className="chart-container large">
                <div className="chart-header">
                  <h3>Risk Score Trend</h3>
                  <span className="chart-subtitle">{dashboardData?.timeframe}</span>
                </div>
                <div className="chart-content">
                  {riskTrendChartData && (
                    <Line data={riskTrendChartData} options={chartOptions} />
                  )}
                </div>
              </div>

              {/* Transaction Volume Chart */}
              <div className="chart-container medium">
                <div className="chart-header">
                  <h3>Transaction Volume</h3>
                  <span className="chart-subtitle">{dashboardData?.timeframe}</span>
                </div>
                <div className="chart-content">
                  {transactionVolumeChartData && (
                    <Bar data={transactionVolumeChartData} options={chartOptions} />
                  )}
                </div>
              </div>

              {/* Risk Distribution Chart */}
              <div className="chart-container small">
                <div className="chart-header">
                  <h3>Risk Distribution</h3>
                  <span className="chart-subtitle">Current Period</span>
                </div>
                <div className="chart-content">
                  {riskDistributionChartData && (
                    <Doughnut 
                      data={riskDistributionChartData} 
                      options={{
                        responsive: true,
                        maintainAspectRatio: false,
                        plugins: {
                          legend: {
                            position: 'bottom',
                            labels: {
                              padding: 15,
                              usePointStyle: true,
                              font: { size: 11, weight: 'bold' }
                            }
                          }
                        }
                      }} 
                    />
                  )}
                </div>
              </div>
            </div>

            {/* Threat Analysis */}
            <div className="threat-analysis-section">
              <h3 className="section-title">Threat Type Analysis</h3>
              <div className="threat-list">
                {dashboardData?.threatTypes.map((threat, index) => (
                  <div key={index} className={`threat-item ${threat.severity}`}>
                    <div className="threat-info">
                      <div className="threat-name">{threat.name}</div>
                      <div className="threat-count">{threat.count} detections</div>
                    </div>
                    <div className={`severity-badge ${threat.severity}`}>
                      {threat.severity.toUpperCase()}
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Security Status */}
            <div className="security-status-section">
              <h3 className="section-title">System Security Status</h3>
              <div className="status-grid">
                <div className="status-item active">
                  <div className="status-icon">🔒</div>
                  <div className="status-info">
                    <div className="status-label">Fraud Detection</div>
                    <div className="status-value">Active</div>
                  </div>
                </div>
                
                <div className="status-item active">
                  <div className="status-icon">🛡️</div>
                  <div className="status-info">
                    <div className="status-label">Real-time Monitoring</div>
                    <div className="status-value">Online</div>
                  </div>
                </div>
                
                <div className="status-item active">
                  <div className="status-icon">🔍</div>
                  <div className="status-info">
                    <div className="status-label">Risk Assessment</div>
                    <div className="status-value">Operational</div>
                  </div>
                </div>
                
                <div className="status-item active">
                  <div className="status-icon">⚡</div>
                  <div className="status-info">
                    <div className="status-label">Response Time</div>
                    <div className="status-value">&lt; 50ms</div>
                  </div>
                </div>
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  );
}

export default RiskDashboard;