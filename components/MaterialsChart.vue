<template>
  <div class="w-full h-full">
    <div v-if="!isValidChartData" class="flex items-center justify-center h-full">
      <p class="text-gray-500">No data available for chart</p>
    </div>
    <!-- Usage Chart -->
    <Bar
      v-else-if="chartType === 'usage'"
      :chart-options="chartOptions"
      :chart-data="chartData"
    />
    <!-- Balance Chart -->
    <Bar
      v-else
      :chart-options="chartOptions"
      :chart-data="chartData"
    />
  </div>
</template>
<script setup>
import { computed } from 'vue';
import {
  Chart as ChartJS,
  Title,
  Tooltip,
  Legend,
  BarElement,
  LineElement,
  CategoryScale,
  LinearScale,
  PointElement
} from 'chart.js';
import { Bar } from 'vue-chartjs';

ChartJS.register(
  CategoryScale,
  LinearScale,
  BarElement,
  LineElement,
  PointElement,
  Title,
  Tooltip,
  Legend
);

const props = defineProps({
  chartType: {
    type: String,
    default: 'usage',
    validator: value => ['usage', 'balance', 'movement'].includes(value)
  },
  chartData: {
    type: Object,
    required: true,
    default: () => ({
      labels: [],
      datasets: []
    })
  },
  height: {
    type: Number,
    default: 300
  }
});

// Check if the chart data is valid
const isValidChartData = computed(() => {
  return props.chartData && 
         props.chartData.labels && 
         Array.isArray(props.chartData.labels) && 
         props.chartData.datasets && 
         Array.isArray(props.chartData.datasets) &&
         props.chartData.datasets.length > 0;
});

const chartOptions = computed(() => {
  const baseOptions = {
    responsive: true,
    maintainAspectRatio: false,
    animation: {
      duration: 800
    },
    plugins: {
      legend: {
        position: 'top',
        align: 'end',
        labels: {
          boxWidth: 12,
          padding: 15,
          usePointStyle: true
        }
      },
      tooltip: {
        mode: 'index',
        intersect: false,
        padding: 10,
        callbacks: {
          label: (context) => {
            const label = context.dataset.label || '';
            const value = context.parsed.y;
            return `${label}: ${new Intl.NumberFormat().format(value)}`;
          }
        }
      }
    },
    scales: {
      x: {
        grid: {
          display: false,
          drawBorder: false
        },
        ticks: {
          maxRotation: 45,
          minRotation: 45
        }
      },
      y: {
        beginAtZero: true,
        grid: {
          drawBorder: false,
          color: '#e5e7eb'
        },
        ticks: {
          callback: (value) => new Intl.NumberFormat().format(value),
          padding: 10
        }
      }
    },
    interaction: {
      mode: 'nearest',
      axis: 'x',
      intersect: false
    }
  };

  // Add chart type specific options
  if (props.chartType === 'balance') {
    baseOptions.plugins.tooltip.callbacks.label = (context) => {
      const label = context.dataset.label;
      const value = context.parsed.y;
      const formattedValue = new Intl.NumberFormat().format(value);
      
      if (label === 'Minimum Stock') {
        return `${label}: ${formattedValue}`;
      }
      return `Stock Level: ${formattedValue}`;
    };
  }

  if (props.chartType === 'usage') {
    baseOptions.scales.y.stacked = false;
    baseOptions.plugins.tooltip.callbacks.label = (context) => {
      const label = context.dataset.label;
      const value = context.parsed.y;
      const formattedValue = new Intl.NumberFormat().format(value);
      return `${label}: ${formattedValue}`;
    };
  }

  if (props.chartType === 'movement') {
    baseOptions.scales.y.stacked = true;
    baseOptions.plugins.tooltip.callbacks.label = (context) => {
      const label = context.dataset.label;
      const value = context.parsed.y;
      const formattedValue = new Intl.NumberFormat().format(Math.abs(value));
      return `${label}: ${formattedValue}`;
    };
  }

  return baseOptions;
});
</script>