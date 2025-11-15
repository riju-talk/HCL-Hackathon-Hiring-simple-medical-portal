import { useAuth } from "@/contexts/AuthContext";
import { Navbar } from "@/components/Navbar";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { Activity, Heart, Moon, Calendar, Lightbulb, CheckCircle2 } from "lucide-react";

const PatientDashboard = () => {
  const { user } = useAuth();

  const wellnessGoals = [
    { name: "Daily Steps", current: 7842, goal: 10000, icon: Activity, color: "text-primary" },
    { name: "Sleep Hours", current: 7.2, goal: 8, icon: Moon, color: "text-purple-500" },
    { name: "Active Minutes", current: 45, goal: 60, icon: Heart, color: "text-red-500" },
  ];

  const reminders = [
    { title: "Annual Checkup", date: "March 15, 2024", status: "upcoming" },
    { title: "Flu Vaccination", date: "March 20, 2024", status: "upcoming" },
    { title: "Blood Pressure Check", date: "Completed", status: "completed" },
  ];

  const healthTip = "Stay hydrated! Aim for 8 glasses of water daily to support overall health and wellness.";

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <div className="container mx-auto px-4 py-8 max-w-7xl">
        <div className="mb-8">
          <h1 className="text-3xl font-bold mb-2">Welcome back, {user?.name}!</h1>
          <p className="text-muted-foreground">Track your wellness journey and stay on top of preventive care</p>
        </div>

        {/* Health Tip of the Day */}
        <Card className="mb-6 border-primary/20 bg-primary/5">
          <CardContent className="flex items-start gap-3 pt-6">
            <Lightbulb className="h-6 w-6 text-primary flex-shrink-0 mt-0.5" />
            <div>
              <h3 className="font-semibold mb-1">Health Tip of the Day</h3>
              <p className="text-sm text-muted-foreground">{healthTip}</p>
            </div>
          </CardContent>
        </Card>

        {/* Wellness Goals */}
        <div className="mb-8">
          <h2 className="text-2xl font-bold mb-4">Wellness Goals</h2>
          <div className="grid gap-4 md:grid-cols-3">
            {wellnessGoals.map((goal) => {
              const percentage = (goal.current / goal.goal) * 100;
              const Icon = goal.icon;
              return (
                <Card key={goal.name}>
                  <CardHeader>
                    <div className="flex items-center justify-between">
                      <CardTitle className="text-lg">{goal.name}</CardTitle>
                      <Icon className={`h-5 w-5 ${goal.color}`} />
                    </div>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-2">
                      <div className="flex justify-between text-sm">
                        <span className="font-semibold">{goal.current}</span>
                        <span className="text-muted-foreground">/ {goal.goal}</span>
                      </div>
                      <Progress value={percentage} className="h-2" />
                      <p className="text-xs text-muted-foreground">{percentage.toFixed(0)}% complete</p>
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        </div>

        {/* Preventive Care Reminders */}
        <div>
          <h2 className="text-2xl font-bold mb-4">Preventive Care Reminders</h2>
          <div className="grid gap-4 md:grid-cols-2">
            {reminders.map((reminder, index) => (
              <Card key={index}>
                <CardHeader>
                  <div className="flex items-start justify-between">
                    <div className="flex items-start gap-3">
                      {reminder.status === "completed" ? (
                        <CheckCircle2 className="h-5 w-5 text-green-500 mt-0.5" />
                      ) : (
                        <Calendar className="h-5 w-5 text-primary mt-0.5" />
                      )}
                      <div>
                        <CardTitle className="text-lg">{reminder.title}</CardTitle>
                        <CardDescription className="mt-1">{reminder.date}</CardDescription>
                      </div>
                    </div>
                    <Badge variant={reminder.status === "completed" ? "secondary" : "default"}>
                      {reminder.status}
                    </Badge>
                  </div>
                </CardHeader>
              </Card>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

export default PatientDashboard;
