import { useState, useEffect } from 'react';
import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';
import AdminNavigation from '@/components/admin/AdminNavigation';
import { ApiClient } from '@/lib/api-client';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/hooks/use-toast';
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
import { DateRange } from "react-day-picker";
import { Line, Bar } from 'react-chartjs-2';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  Title,
  Tooltip,
  Legend,
} from 'chart.js';

ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  Title,
  Tooltip,
  Legend
);

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
  ordersByStatus?: any[];
  paymentMethods?: any[];
}

const AdminAnalytics = () => {
  const [salesData, setSalesData] = useState<SalesData | null>(null);
  const [dateRange, setDateRange] = useState<DateRange | undefined>();
  const [timePeriod, setTimePeriod] = useState('all');
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();
  const { token } = useAuth();

  useEffect(() => {
    loadSalesData();
  }, [dateRange, timePeriod]);

  const loadSalesData = async () => {
    try {
      setLoading(true);
      
      let days = 30;
      
      switch (timePeriod) {
        case 'today':
          days = 1;
          break;
        case 'week':
          days = 7;
          break;
        case 'month':
          days = 30;
          break;
        case 'quarter':
          days = 90;
          break;
        case 'all':
          days = 365;
          break;
        case 'custom':
          if (dateRange?.from && dateRange?.to) {
            days = Math.ceil((dateRange.to.getTime() - dateRange.from.getTime()) / (1000 * 60 * 60 * 24));
          }
          break;
      }

      try {
        const response = await ApiClient.adminGetSalesReport(days, token);
        
        const transformedData: SalesData = {
          totalSales: response.summary.total_orders || 0,
          totalRevenue: response.summary.total_sales || 0,
          averageOrderValue: response.summary.avg_order_value || 0,
          topProducts: (response.top_perfumes || []).map((p: any) => ({
            id: p.id,
            name: p.name,
            sales: p.total_quantity || 0,
            revenue: p.total_revenue || 0,
          })),
          salesByDate: (response.daily_sales || []).map((d: any) => ({
            date: d.date,
            sales: d.orders || 0,
            revenue: d.revenue || 0,
          })),
          ordersByStatus: response.orders_by_status || [],
          paymentMethods: response.payment_methods || [],
        };
        
        setSalesData(transformedData);
      } catch (apiErr) {
        console.warn('Sales report API error:', apiErr);
        const mockData: SalesData = {
          totalSales: 245,
          totalRevenue: 89750,
          averageOrderValue: 3654.28,
          topProducts: [
            { id: 1, name: 'Guerlain La Petite Robe Noire', sales: 45, revenue: 22500 },
            { id: 2, name: 'Chanel No. 5', sales: 38, revenue: 19000 },
            { id: 3, name: 'Dior Miss Dior', sales: 32, revenue: 16000 },
            { id: 4, name: 'Fendi Absolutely Fabulous', sales: 28, revenue: 14000 },
            { id: 5, name: 'Lancome La Vie Est Belle', sales: 25, revenue: 12500 },
          ],
          salesByDate: [
            { date: '2025-11-08', sales: 12, revenue: 4200 },
            { date: '2025-11-09', sales: 18, revenue: 6500 },
            { date: '2025-11-10', sales: 15, revenue: 5800 },
            { date: '2025-11-11', sales: 22, revenue: 8100 },
            { date: '2025-11-12', sales: 19, revenue: 7200 },
            { date: '2025-11-13', sales: 25, revenue: 9500 },
            { date: '2025-11-14', sales: 28, revenue: 10450 },
          ],
        };
        setSalesData(mockData);
        toast({
          title: 'Info',
          description: 'Using sample data. Backend API not available.',
          variant: 'default',
        });
      }
    } catch (err) {
      console.error('Failed to load sales data:', err);
      toast({
        title: 'Error',
        description: 'Failed to load sales analytics.',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex flex-col bg-background">
      <Navbar />
      <main className="flex-1">
        <div className="container mx-auto px-4 py-8">
          <div className="mb-8">
            <h1 className="text-3xl md:text-4xl font-bold mb-2">Admin Dashboard</h1>
            <p className="text-muted-foreground">Sales Analytics & Reports</p>
          </div>

          {/* Admin Navigation */}
          <AdminNavigation />

          {/* Filters */}
          <div className="flex flex-col md:flex-row items-start md:items-center gap-4 mb-8">
            <div className="w-full md:w-auto">
              <Select value={timePeriod} onValueChange={setTimePeriod}>
                <SelectTrigger className="w-full md:w-48">
                  <SelectValue placeholder="Select period" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="today">Today</SelectItem>
                  <SelectItem value="week">Last 7 Days</SelectItem>
                  <SelectItem value="month">Last 30 Days</SelectItem>
                  <SelectItem value="quarter">Last 90 Days</SelectItem>
                  <SelectItem value="all">All Time</SelectItem>
                  <SelectItem value="custom">Custom Range</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {timePeriod === 'custom' && (
              <DatePickerWithRange
                date={dateRange}
                onDateChange={setDateRange}
              />
            )}
          </div>

          {/* Loading State */}
          {loading && (
            <div className="flex items-center justify-center py-12">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
              <p className="ml-3 text-muted-foreground">Loading analytics...</p>
            </div>
          )}

          {/* Content */}
          {!loading && salesData && (
            <div className="space-y-6">
              {/* Overview Cards */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <Card>
                  <CardHeader>
                    <CardTitle>Total Sales</CardTitle>
                    <CardDescription>Number of items sold</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <p className="text-3xl font-bold text-primary">{salesData.totalSales}</p>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle>Total Revenue</CardTitle>
                    <CardDescription>Gross revenue</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <p className="text-3xl font-bold text-green-600">₹{salesData.totalRevenue.toLocaleString()}</p>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle>Average Order Value</CardTitle>
                    <CardDescription>Revenue per order</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <p className="text-3xl font-bold text-blue-600">₹{salesData.averageOrderValue.toFixed(2)}</p>
                  </CardContent>
                </Card>
              </div>

              {/* Sales Trends Chart */}
              {salesData.salesByDate.length > 0 && (
                <Card>
                  <CardHeader>
                    <CardTitle>Sales Trends</CardTitle>
                    <CardDescription>Sales and revenue over time</CardDescription>
                  </CardHeader>
                  <CardContent className="w-full h-80">
                    <Line
                      data={{
                        labels: salesData.salesByDate.map(d => d.date),
                        datasets: [
                          {
                            label: 'Sales (Units)',
                            data: salesData.salesByDate.map(d => d.sales),
                            borderColor: 'rgb(59, 130, 246)',
                            backgroundColor: 'rgba(59, 130, 246, 0.1)',
                            tension: 0.3,
                            yAxisID: 'y',
                          },
                          {
                            label: 'Revenue (₹)',
                            data: salesData.salesByDate.map(d => d.revenue),
                            borderColor: 'rgb(16, 185, 129)',
                            backgroundColor: 'rgba(16, 185, 129, 0.1)',
                            tension: 0.3,
                            yAxisID: 'y1',
                          }
                        ]
                      }}
                      options={{
                        responsive: true,
                        maintainAspectRatio: false,
                        interaction: {
                          mode: 'index',
                          intersect: false,
                        },
                        scales: {
                          y: {
                            type: 'linear',
                            display: true,
                            position: 'left',
                            title: {
                              display: true,
                              text: 'Sales (Units)',
                            },
                            beginAtZero: true,
                          },
                          y1: {
                            type: 'linear',
                            display: true,
                            position: 'right',
                            title: {
                              display: true,
                              text: 'Revenue (₹)',
                            },
                            beginAtZero: true,
                            grid: {
                              drawOnChartArea: false,
                            },
                          },
                        },
                      }}
                    />
                  </CardContent>
                </Card>
              )}

              {/* Top Products Chart */}
              {salesData.topProducts.length > 0 && (
                <Card>
                  <CardHeader>
                    <CardTitle>Top Products</CardTitle>
                    <CardDescription>Best performing products by sales</CardDescription>
                  </CardHeader>
                  <CardContent className="w-full h-80">
                    <Bar
                      data={{
                        labels: salesData.topProducts.map(p => p.name),
                        datasets: [
                          {
                            label: 'Units Sold',
                            data: salesData.topProducts.map(p => p.sales),
                            backgroundColor: 'rgba(59, 130, 246, 0.7)',
                            borderColor: 'rgb(59, 130, 246)',
                            borderWidth: 1,
                          },
                          {
                            label: 'Revenue (₹)',
                            data: salesData.topProducts.map(p => p.revenue),
                            backgroundColor: 'rgba(16, 185, 129, 0.7)',
                            borderColor: 'rgb(16, 185, 129)',
                            borderWidth: 1,
                          }
                        ]
                      }}
                      options={{
                        responsive: true,
                        maintainAspectRatio: false,
                        scales: {
                          y: {
                            beginAtZero: true,
                            title: {
                              display: true,
                              text: 'Amount',
                            },
                          }
                        },
                        plugins: {
                          legend: {
                            display: true,
                            position: 'top',
                          },
                        },
                      }}
                    />
                  </CardContent>
                </Card>
              )}

              {/* Top Products Table */}
              {salesData.topProducts.length > 0 && (
                <Card>
                  <CardHeader>
                    <CardTitle>Top Products Details</CardTitle>
                    <CardDescription>Detailed view of best performing products</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="w-full overflow-x-auto">
                      <table className="w-full">
                        <thead>
                          <tr className="border-b">
                            <th className="text-left py-3 px-4">Product Name</th>
                            <th className="text-left py-3 px-4">Units Sold</th>
                            <th className="text-left py-3 px-4">Revenue</th>
                            <th className="text-left py-3 px-4">Avg Price</th>
                          </tr>
                        </thead>
                        <tbody>
                          {salesData.topProducts.map((product) => (
                            <tr key={product.id} className="border-b hover:bg-muted/50">
                              <td className="py-3 px-4">{product.name}</td>
                              <td className="py-3 px-4">{product.sales}</td>
                              <td className="py-3 px-4">₹{product.revenue.toLocaleString()}</td>
                              <td className="py-3 px-4">₹{(product.revenue / product.sales).toFixed(2)}</td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </CardContent>
                </Card>
              )}
            </div>
          )}
        </div>
      </main>
      <Footer />
    </div>
  );
};

export default AdminAnalytics;
