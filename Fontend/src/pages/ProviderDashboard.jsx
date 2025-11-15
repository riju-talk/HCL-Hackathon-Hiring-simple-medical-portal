import { useState, useEffect } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { Navbar } from "@/components/Navbar";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { toast } from "sonner";
import { 
  Calendar, 
  Clock, 
  Users, 
  CheckCircle, 
  AlertCircle,
  Loader2,
  ChevronLeft,
  ChevronRight
} from "lucide-react";
import { 
  getDoctorAppointments, 
  getDoctorPatients, 
  getMyDoctorAppointments,
  getMyDoctorPatients,
  updateAppointmentStatus,
  getTodaysGoals,
  createGoal,
  updateGoal,
  completeGoal
} from "@/lib/api";

const ProviderDashboard = () => {
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [appointments, setAppointments] = useState([]);
  const [patients, setPatients] = useState([]);
  const [goals, setGoals] = useState([]);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const [appointmentsPerPage] = useState(10);
  const [newGoal, setNewGoal] = useState({
    title: '',
    description: '',
    category: 'patients'
  });
  const [stats, setStats] = useState({
    total: 0,
    pending: 0,
    confirmed: 0,
    completed: 0
  });

  useEffect(() => {
    if (user) {
      fetchData();
    }
  }, [user]);

  const fetchData = async () => {
    setLoading(true);
    try {
      const [appointmentsRes, patientsRes, goalsRes] = await Promise.all([
        getMyDoctorAppointments(),
        getMyDoctorPatients(),
        getTodaysGoals()
      ]);

      if (appointmentsRes.success) {
        setAppointments(appointmentsRes.appointments);
        calculateStats(appointmentsRes.appointments);
      }

      if (patientsRes.success) {
        setPatients(patientsRes.patients);
      }

      if (goalsRes.success) {
        setGoals(goalsRes.goals);
      }
    } catch (error) {
      console.error("Error fetching data:", error);
      toast.error("Failed to load dashboard data");
    } finally {
      setLoading(false);
    }
  };

  const calculateStats = (appointments) => {
    const newStats = {
      total: appointments.length,
      pending: appointments.filter(a => a.status === 'pending').length,
      confirmed: appointments.filter(a => a.status === 'confirmed').length,
      completed: appointments.filter(a => a.status === 'completed').length
    };
    setStats(newStats);
  };

  const handleStatusUpdate = async (appointmentId, newStatus) => {
    try {
      const response = await updateAppointmentStatus(appointmentId, { status: newStatus });
      if (response.success) {
        toast.success("Appointment status updated");
        fetchData();
      }
    } catch (error) {
      console.error("Error updating status:", error);
      toast.error("Failed to update appointment status");
    }
  };

  const getStatusBadge = (status) => {
    const variants = {
      pending: "secondary",
      confirmed: "default",
      completed: "outline",
      cancelled: "destructive",
      "no-show": "destructive"
    };
    return <Badge variant={variants[status] || "secondary"}>{status}</Badge>;
  };

  const formatDate = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', { 
      weekday: 'short', 
      year: 'numeric', 
      month: 'short', 
      day: 'numeric' 
    });
  };

  const getTodayAppointments = () => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);
    
    return appointments.filter(apt => {
      const aptDate = new Date(apt.appointmentDateTime);
      return aptDate >= today && aptDate < tomorrow;
    }).sort((a, b) => new Date(a.appointmentDateTime) - new Date(b.appointmentDateTime));
  };

  const getAllAppointments = () => {
    return appointments
      .filter(apt => apt.status !== 'cancelled')
      .sort((a, b) => new Date(a.appointmentDateTime) - new Date(b.appointmentDateTime));
  };

  const getPaginatedAppointments = () => {
    const allAppointments = getAllAppointments();
    const indexOfLastAppointment = currentPage * appointmentsPerPage;
    const indexOfFirstAppointment = indexOfLastAppointment - appointmentsPerPage;
    return allAppointments.slice(indexOfFirstAppointment, indexOfLastAppointment);
  };

  const totalPages = Math.ceil(getAllAppointments().length / appointmentsPerPage);

  const handlePageChange = (pageNumber) => {
    setCurrentPage(pageNumber);
  };

  const handleCreateGoal = async () => {
    if (!newGoal.title) {
      toast.error("Goal title is required");
      return;
    }

    try {
      const today = new Date();
      today.setHours(23, 59, 59, 999);
      
      const response = await createGoal({
        ...newGoal,
        targetDate: today.toISOString()
      });

      if (response.success) {
        toast.success("Goal created successfully!");
        setDialogOpen(false);
        setNewGoal({
          title: '',
          description: '',
          category: 'patients'
        });
        fetchData();
      }
    } catch (error) {
      console.error("Error creating goal:", error);
      toast.error("Failed to create goal");
    }
  };

  const handleCompleteGoal = async (goalId) => {
    try {
      const response = await completeGoal(goalId);
      if (response.success) {
        toast.success("Goal marked as completed!");
        fetchData();
      }
    } catch (error) {
      console.error("Error completing goal:", error);
      toast.error("Failed to complete goal");
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-background">
        <Navbar />
        <div className="flex items-center justify-center min-h-[60vh]">
          <div className="text-center">
            <Loader2 className="h-8 w-8 animate-spin mx-auto mb-4 text-primary" />
            <p className="text-muted-foreground">Loading dashboard...</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      
      <div className="container mx-auto px-4 py-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold mb-2">Provider Dashboard</h1>
          <p className="text-muted-foreground">Welcome back, Dr. {user?.name}</p>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Patients</CardTitle>
              <Users className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{patients.length}</div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Pending</CardTitle>
              <AlertCircle className="h-4 w-4 text-yellow-500" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.pending}</div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Confirmed</CardTitle>
              <CheckCircle className="h-4 w-4 text-green-500" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.confirmed}</div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Completed</CardTitle>
              <CheckCircle className="h-4 w-4 text-blue-500" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.completed}</div>
            </CardContent>
          </Card>
        </div>

        {/* Today's Goals */}
        <Card className="mb-6">
          <CardHeader className="flex flex-row items-center justify-between">
            <div>
              <CardTitle>Today's Goals</CardTitle>
              <CardDescription>{new Date().toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' })}</CardDescription>
            </div>
            <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
              <DialogTrigger asChild>
                <Button size="sm">+ Add Goal</Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Set Today's Goal</DialogTitle>
                  <DialogDescription>Create a goal for today</DialogDescription>
                </DialogHeader>
                <div className="space-y-4 py-4">
                  <div className="space-y-2">
                    <Label htmlFor="title">Goal Title *</Label>
                    <Input
                      id="title"
                      placeholder="e.g., See 10 patients"
                      value={newGoal.title}
                      onChange={(e) => setNewGoal({...newGoal, title: e.target.value})}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="category">Category</Label>
                    <Select value={newGoal.category} onValueChange={(value) => setNewGoal({...newGoal, category: value})}>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="patients">Patients</SelectItem>
                        <SelectItem value="consultations">Consultations</SelectItem>
                        <SelectItem value="learning">Learning</SelectItem>
                        <SelectItem value="research">Research</SelectItem>
                        <SelectItem value="other">Other</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="description">Description</Label>
                    <Textarea
                      id="description"
                      placeholder="Optional details about your goal"
                      value={newGoal.description}
                      onChange={(e) => setNewGoal({...newGoal, description: e.target.value})}
                    />
                  </div>
                  <Button onClick={handleCreateGoal} className="w-full">Create Goal</Button>
                </div>
              </DialogContent>
            </Dialog>
          </CardHeader>
          <CardContent>
            {goals.length === 0 ? (
              <p className="text-center text-muted-foreground py-8">No goals set for today. Click "Add Goal" to create one!</p>
            ) : (
              <div className="space-y-3">
                {goals.map((goal) => (
                  <div key={goal._id} className="flex items-center justify-between p-4 border rounded-lg">
                    <div className="flex-1">
                      <div className="flex items-center gap-2">
                        <p className="font-medium">{goal.title}</p>
                        <Badge variant={goal.isCompleted ? "default" : "secondary"}>
                          {goal.category}
                        </Badge>
                      </div>
                      {goal.description && (
                        <p className="text-sm text-muted-foreground mt-1">{goal.description}</p>
                      )}
                    </div>
                    {!goal.isCompleted && (
                      <Button 
                        size="sm" 
                        variant="outline"
                        onClick={() => handleCompleteGoal(goal._id)}
                      >
                        Mark Complete
                      </Button>
                    )}
                    {goal.isCompleted && (
                      <Badge variant="default">Completed</Badge>
                    )}
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Main Content */}
        <Tabs defaultValue="appointments" className="space-y-4">
          <TabsList>
            <TabsTrigger value="appointments">Appointments</TabsTrigger>
            <TabsTrigger value="today">Today's Schedule</TabsTrigger>
            <TabsTrigger value="patients">Patients</TabsTrigger>
          </TabsList>

          <TabsContent value="appointments" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>All Appointments</CardTitle>
                <CardDescription>Manage your appointment schedule (Page {currentPage} of {totalPages})</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {getAllAppointments().length === 0 ? (
                    <p className="text-center text-muted-foreground py-8">No appointments</p>
                  ) : (
                    getPaginatedAppointments().map((appointment) => (
                      <div key={appointment._id} className="flex items-center justify-between p-4 border rounded-lg">
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-1">
                            <p className="font-medium">{appointment.patientId?.fullName}</p>
                            {getStatusBadge(appointment.status)}
                          </div>
                          <div className="flex items-center gap-4 text-sm text-muted-foreground">
                            <span className="flex items-center gap-1">
                              <Calendar className="h-3 w-3" />
                              {formatDate(appointment.appointmentDateTime)}
                            </span>
                            <span className="flex items-center gap-1">
                              <Clock className="h-3 w-3" />
                              {appointment.appointmentTime}
                            </span>
                          </div>
                          <p className="text-sm mt-1">{appointment.reason}</p>
                        </div>
                        <div className="flex gap-2">
                          {appointment.status === 'pending' && (
                            <Button 
                              size="sm" 
                              onClick={() => handleStatusUpdate(appointment._id, 'confirmed')}
                            >
                              Confirm
                            </Button>
                          )}
                          {appointment.status === 'confirmed' && (
                            <Button 
                              size="sm" 
                              variant="outline"
                              onClick={() => handleStatusUpdate(appointment._id, 'completed')}
                            >
                              Complete
                            </Button>
                          )}
                          {(appointment.status === 'pending' || appointment.status === 'confirmed') && (
                            <Button 
                              size="sm" 
                              variant="destructive"
                              onClick={() => handleStatusUpdate(appointment._id, 'cancelled')}
                            >
                              Cancel
                            </Button>
                          )}
                        </div>
                      </div>
                    ))
                  )}
                </div>
                {totalPages > 1 && (
                  <div className="flex items-center justify-center gap-2 mt-6">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handlePageChange(currentPage - 1)}
                      disabled={currentPage === 1}
                    >
                      <ChevronLeft className="h-4 w-4" />
                      Previous
                    </Button>
                    <div className="flex items-center gap-1">
                      {[...Array(totalPages)].map((_, index) => {
                        const pageNumber = index + 1;
                        // Show first page, last page, current page, and pages around current
                        if (
                          pageNumber === 1 ||
                          pageNumber === totalPages ||
                          (pageNumber >= currentPage - 1 && pageNumber <= currentPage + 1)
                        ) {
                          return (
                            <Button
                              key={pageNumber}
                              variant={currentPage === pageNumber ? "default" : "outline"}
                              size="sm"
                              onClick={() => handlePageChange(pageNumber)}
                              className="w-10"
                            >
                              {pageNumber}
                            </Button>
                          );
                        } else if (
                          pageNumber === currentPage - 2 ||
                          pageNumber === currentPage + 2
                        ) {
                          return <span key={pageNumber} className="px-1">...</span>;
                        }
                        return null;
                      })}
                    </div>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handlePageChange(currentPage + 1)}
                      disabled={currentPage === totalPages}
                    >
                      Next
                      <ChevronRight className="h-4 w-4" />
                    </Button>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="today" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Today's Schedule</CardTitle>
                <CardDescription>{new Date().toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {getTodayAppointments().length === 0 ? (
                    <p className="text-center text-muted-foreground py-8">No appointments today</p>
                  ) : (
                    getTodayAppointments().map((appointment) => (
                      <div key={appointment._id} className="flex items-center justify-between p-4 border rounded-lg">
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-1">
                            <p className="font-medium">{appointment.patientId?.fullName}</p>
                            {getStatusBadge(appointment.status)}
                          </div>
                          <div className="flex items-center gap-4 text-sm text-muted-foreground">
                            <span className="flex items-center gap-1">
                              <Clock className="h-3 w-3" />
                              {appointment.appointmentTime} ({appointment.duration} min)
                            </span>
                          </div>
                          <p className="text-sm mt-1"><strong>Reason:</strong> {appointment.reason}</p>
                        </div>
                        <div className="flex gap-2">
                          {appointment.status === 'pending' && (
                            <Button 
                              size="sm" 
                              onClick={() => handleStatusUpdate(appointment._id, 'confirmed')}
                            >
                              Confirm
                            </Button>
                          )}
                          {appointment.status === 'confirmed' && (
                            <Button 
                              size="sm" 
                              variant="outline"
                              onClick={() => handleStatusUpdate(appointment._id, 'completed')}
                            >
                              Complete
                            </Button>
                          )}
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="patients" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>My Patients</CardTitle>
                <CardDescription>Patients you've treated</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {patients.length === 0 ? (
                    <p className="text-center text-muted-foreground py-8">No patients yet</p>
                  ) : (
                    patients.map((patient) => (
                      <div key={patient._id} className="flex items-center justify-between p-4 border rounded-lg">
                        <div>
                          <p className="font-medium">{patient.fullName}</p>
                          <p className="text-sm text-muted-foreground">{patient.email}</p>
                          {patient.phoneNumber && (
                            <p className="text-sm text-muted-foreground">{patient.phoneNumber}</p>
                          )}
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
};

export default ProviderDashboard;
