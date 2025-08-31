import React, { useEffect, useState } from 'react';
import axios from 'axios';
import {
  LineChart, Line, XAxis, YAxis,
  CartesianGrid, Tooltip, Legend, ResponsiveContainer
} from 'recharts';

const TrendDashboard = () => {
  const [trendData, setTrendData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState(null);

  useEffect(() => {
    const fetchTrend = async () => {
      try {
        const response = await axios.get('/api/trend');
        setTrendData(response.data);
        setErrorMessage(null);
      } catch (error) {
        setErrorMessage('Erro ao buscar dados.');
      } finally {
        setLoading(false);
      }
    };
    fetchTrend();
  }, []);

  if (loading) return <p>Carregando tendências...</p>;
  if (errorMessage) return <p className="text-red-600">{errorMessage}</p>;
  if (!trendData || trendData.length === 0) return <p>Nenhuma tendência disponível.</p>;

  const chartData = trendData.map(f => ({ date: f.ds, value: f.yhat }));

  const first = trendData[0].yhat;
  const last = trendData[trendData.length - 1].yhat;
  const percentual = (((last - first)/Math.abs(first||1))*100).toFixed(2);
  let analise = "Tendência estável.";
  if (percentual > 5) analise = `A tendência é crescer ${percentual}% nos próximos dias.`;
  if (percentual < -5) analise = `A tendência é cair ${Math.abs(percentual)}% nos próximos dias.`;

  return (
    <div className="p-6 space-y-6">
      <h1 className="text-3xl font-bold">Tendência de Vulnerabilidades Críticas</h1>

      <ResponsiveContainer width="100%" height={300}>
        <LineChart data={chartData}>
          <CartesianGrid strokeDasharray="3 3" />
          <XAxis dataKey="date" />
          <YAxis />
          <Tooltip />
          <Legend />
          <Line type="monotone" dataKey="value" stroke="#ff0000" name="Previsão" />
        </LineChart>
      </ResponsiveContainer>

      <div className="p-4 bg-gray-100 rounded-lg">
        <p>{analise}</p>
      </div>
    </div>
  );
};

export default TrendDashboard;
