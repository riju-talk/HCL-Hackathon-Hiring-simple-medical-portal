import { useAuth } from "@/contexts/AuthContext";
import { Navbar } from "@/components/Navbar";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Users, TrendingUp, AlertCircle, CheckCircle2 } from "lucide-react";

const ProviderDashboard = () => {
  const { user } = useAuth();

  const patients = [
    { 
      id: "1", 
      name: "Sarah Johnson", 
      compliance: 92, 
      nextVisit: "March 15, 2024",
      alerts: 0,
      status: "excellent" 
    },
    { 
      id: "2", 
      name: "Michael Chen", 
      compliance: 78, 
      nextVisit: "March 18, 2024",
      alerts: 1,
      status: "good" 
    },
    { 
      id: "3", 
      name: "Emma Williams", 
      compliance: 95, 
      nextVisit: "March 20, 2024",
      alerts: 0,
      status: "excellent" 
    },
    { 
      id: "4", 
      name: "James Brown", 
      compliance: 65, 
      nextVisit: "March 22, 2024",
      alerts: 2,
      status: "needs-attention" 
    },
  ];

  const stats = [
    { label: "Total Patients", value: "48", icon: Users, color: "text-primary" },
    { label: "Avg Compliance", value: "82%", icon: TrendingUp, color: "text-green-500" },
    { label: "Pending Alerts", value: "3", icon: AlertCircle, color: "text-orange-500" },
    { label: "Completed Goals", value: "156", icon: CheckCircle2, color: "text-blue-500" },
  ];

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <div className="container mx-auto px-4 py-8 max-w-7xl">
        <div className="mb-8">
          <h1 className="text-3xl font-bold mb-2">Provider Dashboard</h1>
          <p className="text-muted-foreground">Welcome back, Dr. {user?.name}</p>
        </div>

        {/* Stats Overview */}
        <div className="grid gap-4 md:grid-cols-4 mb-8">
          {stats.map((stat) => {
            const Icon = stat.icon;
            return (
              <Card key={stat.label}>
                <CardHeader className="flex flex-row items-center justify-between pb-2">
                  <CardTitle className="text-sm font-medium text-muted-foreground">
                    {stat.label}
                  </CardTitle>
                  <Icon className={`h-4 w-4 ${stat.color}`} />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{stat.value}</div>
                </CardContent>
              </Card>
            );
          })}
        </div>

        {/* Patient List */}
        <div>
          <h2 className="text-2xl font-bold mb-4">Patient Overview</h2>
          <div className="grid gap-4">
            {patients.map((patient) => (
              <Card key={patient.id} className="hover:shadow-md transition-shadow">
                <CardHeader>
                  <div className="flex items-start justify-between">
                    <div>
                      <CardTitle className="text-xl">{patient.name}</CardTitle>
                      <CardDescription className="mt-1">
                        Next visit: {patient.nextVisit}
                      </CardDescription>
                    </div>
                    <div className="flex gap-2">
                      {patient.alerts > 0 && (
                        <Badge variant="destructive" className="flex items-center gap-1">
                          <AlertCircle className="h-3 w-3" />
                          {patient.alerts} alert{patient.alerts > 1 ? 's' : ''}
                        </Badge>
                      )}
                      <Badge 
                        variant={
                          patient.status === "excellent" ? "default" : 
                          patient.status === "good" ? "secondary" : 
                          "outline"
                        }
                      >
                        {patient.status === "excellent" ? "Excellent" : 
                         patient.status === "good" ? "Good" : 
                         "Needs Attention"}
                      </Badge>
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2">
                    <div className="flex justify-between text-sm">
                      <span className="text-muted-foreground">Compliance Rate</span>
                      <span className="font-semibold">{patient.compliance}%</span>
                    </div>
                    <div className="w-full bg-secondary rounded-full h-2">
                      <div 
                        className={`h-2 rounded-full ${
                          patient.compliance >= 90 ? 'bg-green-500' :
                          patient.compliance >= 75 ? 'bg-blue-500' :
                          'bg-orange-500'
                        }`}
                        style={{ width: `${patient.compliance}%` }}
                      />
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

export default ProviderDashboard;
