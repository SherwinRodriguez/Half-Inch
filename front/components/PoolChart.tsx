'use client';

import { 
  ResponsiveContainer, 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  Legend,
  PieChart,
  Pie,
  Cell,
  LineChart,
  Line
} from 'recharts';

interface PoolChartProps {
  title: string;
  data: any[];
  timeframe: string;
  type?: 'bar' | 'pie' | 'line';
}

export function PoolChart({ title, data, timeframe, type = 'bar' }: PoolChartProps) {
  const colors = [
    '#3B82F6', // blue-500
    '#8B5CF6', // violet-500
    '#10B981', // emerald-500
    '#F59E0B', // amber-500
    '#EF4444', // red-500
    '#6366F1', // indigo-500
    '#EC4899', // pink-500
    '#14B8A6', // teal-500
  ];

  const renderBarChart = () => (
    <ResponsiveContainer width="100%" height={300}>
      <BarChart data={data} margin={{ top: 20, right: 30, left: 20, bottom: 5 }}>
        <CartesianGrid strokeDasharray="3 3" className="stroke-gray-200 dark:stroke-gray-700" />
        <XAxis 
          dataKey="name" 
          className="text-gray-600 dark:text-gray-400"
          tick={{ fontSize: 12 }}
        />
        <YAxis className="text-gray-600 dark:text-gray-400" tick={{ fontSize: 12 }} />
        <Tooltip
          contentStyle={{
            backgroundColor: 'rgb(255 255 255 / 0.95)',
            border: '1px solid rgb(229 231 235)',
            borderRadius: '8px',
            fontSize: '12px',
          }}
          className="dark:bg-gray-800 dark:border-gray-700"
        />
        <Legend />
        <Bar 
          dataKey="value" 
          fill={colors[0]}
          radius={[4, 4, 0, 0]}
          name={title.includes('TVL') ? 'TVL ($)' : 'Ratio'}
        />
        {data[0]?.target !== undefined && (
          <Bar 
            dataKey="target" 
            fill={colors[1]}
            radius={[4, 4, 0, 0]}
            name="Target Ratio"
          />
        )}
      </BarChart>
    </ResponsiveContainer>
  );

  const renderPieChart = () => (
    <ResponsiveContainer width="100%" height={300}>
      <PieChart>
        <Pie
          data={data}
          cx="50%"
          cy="50%"
          labelLine={false}
          label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
          outerRadius={80}
          fill="#8884d8"
          dataKey="value"
        >
          {data.map((entry, index) => (
            <Cell key={`cell-${index}`} fill={colors[index % colors.length]} />
          ))}
        </Pie>
        <Tooltip
          contentStyle={{
            backgroundColor: 'rgb(255 255 255 / 0.95)',
            border: '1px solid rgb(229 231 235)',
            borderRadius: '8px',
            fontSize: '12px',
          }}
        />
      </PieChart>
    </ResponsiveContainer>
  );

  const renderLineChart = () => (
    <ResponsiveContainer width="100%" height={300}>
      <LineChart data={data} margin={{ top: 20, right: 30, left: 20, bottom: 5 }}>
        <CartesianGrid strokeDasharray="3 3" className="stroke-gray-200 dark:stroke-gray-700" />
        <XAxis 
          dataKey="name" 
          className="text-gray-600 dark:text-gray-400"
          tick={{ fontSize: 12 }}
        />
        <YAxis className="text-gray-600 dark:text-gray-400" tick={{ fontSize: 12 }} />
        <Tooltip
          contentStyle={{
            backgroundColor: 'rgb(255 255 255 / 0.95)',
            border: '1px solid rgb(229 231 235)',
            borderRadius: '8px',
            fontSize: '12px',
          }}
        />
        <Legend />
        <Line 
          type="monotone" 
          dataKey="value" 
          stroke={colors[0]} 
          strokeWidth={2}
          dot={{ fill: colors[0], strokeWidth: 2, r: 4 }}
          name="Current Ratio"
        />
        {data[0]?.target !== undefined && (
          <Line 
            type="monotone" 
            dataKey="target" 
            stroke={colors[1]} 
            strokeWidth={2}
            strokeDasharray="5 5"
            dot={{ fill: colors[1], strokeWidth: 2, r: 4 }}
            name="Target Ratio"
          />
        )}
      </LineChart>
    </ResponsiveContainer>
  );

  const renderChart = () => {
    switch (type) {
      case 'pie':
        return renderPieChart();
      case 'line':
        return renderLineChart();
      case 'bar':
      default:
        return renderBarChart();
    }
  };

  if (!data || data.length === 0) {
    return (
      <div className="chart-container">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100">
            {title}
          </h3>
          <span className="text-sm text-gray-500 dark:text-gray-400">
            {timeframe}
          </span>
        </div>
        <div className="flex items-center justify-center h-64 text-gray-500 dark:text-gray-400">
          <div className="text-center">
            <div className="w-16 h-16 bg-gray-200 dark:bg-gray-700 rounded-full mx-auto mb-4 flex items-center justify-center">
              <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
              </svg>
            </div>
            <p className="text-sm">No data available</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="chart-container">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100">
          {title}
        </h3>
        <span className="text-sm text-gray-500 dark:text-gray-400">
          {timeframe}
        </span>
      </div>
      
      {renderChart()}
      
      {/* Legend for imbalanced pools */}
      {data.some(item => item.imbalanced !== undefined) && (
        <div className="mt-4 flex items-center justify-center space-x-4">
          <div className="flex items-center space-x-2">
            <div className="w-3 h-3 bg-green-500 rounded-full"></div>
            <span className="text-xs text-gray-600 dark:text-gray-400">Balanced</span>
          </div>
          <div className="flex items-center space-x-2">
            <div className="w-3 h-3 bg-red-500 rounded-full"></div>
            <span className="text-xs text-gray-600 dark:text-gray-400">Imbalanced</span>
          </div>
        </div>
      )}
    </div>
  );
}
