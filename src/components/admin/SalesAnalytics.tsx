import { useState, useEffect } from 'react';
import { ApiClient } from '@/lib/api-client';
import { DateRange } from "react-day-picker";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { DatePickerWithRange } from '@/components/ui/date-range-picker';
import { useToast } from '@/hooks/use-toast';
import { Line, Bar } from 'react-chartjs-2';

interface SalesData {
  totalSales: number;
  totalRevenue: number;
  averageOrderValue: number;
  topProducts: {
    id: number;
    name: string;
    sales: number;
    revenue: number;
  }[];
  salesByDate: {
    date: string;
    sales: number;
    revenue: number;
  }[];
}

const SalesAnalytics = () => {
  const [salesData, setSalesData] = useState<SalesData | null>(null);
  const [dateRange, setDateRange] = useState<DateRange | undefined>();
  const { toast } = useToast();

  useEffect(() => {
    loadSalesData();
  }, [dateRange]);

  const loadSalesData = async () => {
    try {
      const startDate = dateRange?.from?.toISOString().split('T')[0];
      const endDate = dateRange?.to?.toISOString().split('T')[0];
      
      const data = await ApiClient.adminGetSalesReport(startDate, endDate);
      setSalesData(data);
    } catch (err) {
      console.error('Failed to load sales data:', err);
      toast({
        title: 'Error',
        description: 'Failed to load sales analytics.',
        variant: 'destructive',
      });
    }
  };

  if (!salesData) {
    return <div>Loading...</div>;
  }

  return (
    <div className="space-y-6">
      {/* Filters */}
      <div className="flex items-center gap-4">
        <DatePickerWithRange
          date={dateRange}
          onDateChange={setDateRange}
        />
      </div>

      {/* Overview Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card>
          <CardHeader>
            <CardTitle>Total Sales</CardTitle>
            <CardDescription>Number of items sold</CardDescription>
          </CardHeader>
          <CardContent>
            <p className="text-3xl font-bold">{salesData.totalSales}</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle>Total Revenue</CardTitle>
            <CardDescription>Gross revenue</CardDescription>
          </CardHeader>
          <CardContent>
            <p className="text-3xl font-bold">₹{salesData.totalRevenue}</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle>Average Order Value</CardTitle>
            <CardDescription>Revenue per order</CardDescription>
          </CardHeader>
          <CardContent>
            <p className="text-3xl font-bold">₹{salesData.averageOrderValue}</p>
          </CardContent>
        </Card>
      </div>

      {/* Sales Trends */}
      <Card>
        <CardHeader>
          <CardTitle>Sales Trends</CardTitle>
          <CardDescription>Sales and revenue over time</CardDescription>
        </CardHeader>
        <CardContent>
          <Line
            data={{
              labels: salesData.salesByDate.map(d => d.date),
              datasets: [
                {
                  label: 'Sales',
                  data: salesData.salesByDate.map(d => d.sales),
                  borderColor: 'rgb(59, 130, 246)',
                  tension: 0.1,
                },
                {
                  label: 'Revenue',
                  data: salesData.salesByDate.map(d => d.revenue),
                  borderColor: 'rgb(16, 185, 129)',
                  tension: 0.1,
                }
              ]
            }}
            options={{
              responsive: true,
              interaction: {
                mode: 'index',
                intersect: false,
              },
              scales: {
                y: {
                  beginAtZero: true,
                },
              },
            }}
          />
        </CardContent>
      </Card>

      {/* Top Products */}
      <Card>
        <CardHeader>
          <CardTitle>Top Products</CardTitle>
          <CardDescription>Best performing products by sales</CardDescription>
        </CardHeader>
        <CardContent>
          <Bar
            data={{
              labels: salesData.topProducts.map(p => p.name),
              datasets: [{
                label: 'Sales',
                data: salesData.topProducts.map(p => p.sales),
                backgroundColor: 'rgba(59, 130, 246, 0.5)',
              }]
            }}
            options={{
              responsive: true,
              scales: {
                y: {
                  beginAtZero: true,
                }
              }
            }}
          />
        </CardContent>
      </Card>
    </div>
  );
};

export default SalesAnalytics;