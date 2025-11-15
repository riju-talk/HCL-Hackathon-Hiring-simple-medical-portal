import { useState, useEffect } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { Navbar } from "@/components/Navbar";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { toast } from "sonner";
import { Calendar, Clock, Loader2, Plus, User, Activity, Moon, Heart, Search, CheckCircle } from "lucide-react";
import { getPatientAppointments, getMyAppointments, getAllDoctors, getAvailableSlots, bookAppointment, getTodaysPatientGoals, createPatientGoal, updatePatientGoal, completePatientGoal, deletePatientGoal } from "@/lib/api";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";

const PatientDashboard = () => {
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [appointments, setAppointments] = useState([]);
  const [doctors, setDoctors] = useState([]);
  const [selectedDate, setSelectedDate] = useState("");
  const [selectedDoctor, setSelectedDoctor] = useState("");
  const [availableSlots, setAvailableSlots] = useState([]);
  const [selectedSlot, setSelectedSlot] = useState("");
  const [reason, setReason] = useState("");
  const [bookingLoading, setBookingLoading] = useState(false);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [loadingSlots, setLoadingSlots] = useState(false);
  const [selectedDoctorDetails, setSelectedDoctorDetails] = useState(null);
  const [weekDates, setWeekDates] = useState([]);
  const [slotsMap, setSlotsMap] = useState({});
  const [goals, setGoals] = useState([]);
  const [goalDialogOpen, setGoalDialogOpen] = useState(false);
  const [newGoal, setNewGoal] = useState({
    title: '',
    description: '',
    category: 'other',
    targetValue: '',
    unit: 'count',
    frequency: 'once',
    reminderTime: ''
  });

  useEffect(() => {
    fetchData();
    generateWeekDates();
  }, []);

  const generateWeekDates = () => {
    const dates = [];
    const today = new Date();
    for (let i = 0; i < 7; i++) {
      const date = new Date(today);
      date.setDate(today.getDate() + i);
      dates.push(date);
    }
    setWeekDates(dates);
  };

  const fetchData = async () => {
    try {
      setLoading(true);
      const [appointmentsRes, doctorsRes, goalsRes] = await Promise.all([
        getMyAppointments(),
        getAllDoctors(),
        getTodaysPatientGoals()
      ]);

      if (appointmentsRes.success) {
        setAppointments(appointmentsRes.appointments || []);
      }
      if (doctorsRes.success) {
        setDoctors(doctorsRes.doctors || []);
      }
      if (goalsRes.success) {
        setGoals(goalsRes.goals || []);
      }
    } catch (error) {
      console.error('Error fetching data:', error);
      toast.error('Failed to load dashboard data');
    } finally {
      setLoading(false);
    }
  };

  const handleDoctorSelect = async (doctor) => {
    setSelectedDoctor(doctor._id);
    setSelectedDoctorDetails(doctor);
    setSelectedDate("");
    setSelectedSlot("");
    setSlotsMap({});
    setDialogOpen(true);

    // Fetch availability for the next 7 days
    try {
      setLoadingSlots(true);
      const slotsData = {};
      
      for (const date of weekDates) {
        const dateStr = date.toISOString().split('T')[0];
        try {
          const response = await getAvailableSlots(doctor._id, dateStr);
          if (response.success) {
            slotsData[dateStr] = response.slots || [];
          }
        } catch (err) {
          console.error(`Error fetching slots for ${dateStr}:`, err);
          slotsData[dateStr] = [];
        }
      }
      
      setSlotsMap(slotsData);
    } catch (error) {
      console.error('Error fetching week slots:', error);
      toast.error('Failed to load available time slots');
    } finally {
      setLoadingSlots(false);
    }
  };

  const handleDateSelect = (date) => {
    const dateStr = date.toISOString().split('T')[0];
    setSelectedDate(dateStr);
    setSelectedSlot("");
    setAvailableSlots(slotsMap[dateStr] || []);
  };

  const handleCreateGoal = async () => {
    if (!newGoal.title) {
      toast.error('Please enter a goal title');
      return;
    }

    try {
      const today = new Date();
      today.setHours(23, 59, 59, 999);
      
      const response = await createPatientGoal({
        ...newGoal,
        targetDate: today.toISOString(),
        targetValue: newGoal.targetValue ? Number(newGoal.targetValue) : undefined
      });

      if (response.success) {
        toast.success('Goal created successfully!');
        setGoalDialogOpen(false);
        setNewGoal({
          title: '',
          description: '',
          category: 'other',
          targetValue: '',
          unit: 'count',
          frequency: 'once',
          reminderTime: ''
        });
        fetchData();
      } else {
        toast.error(response.message || 'Failed to create goal');
      }
    } catch (error) {
      console.error('Error creating goal:', error);
      toast.error('Failed to create goal');
    }
  };

  const handleCompleteGoal = async (goalId) => {
    try {
      const response = await completePatientGoal(goalId);
      if (response.success) {
        toast.success('Goal completed!');
        fetchData();
      } else {
        toast.error(response.message || 'Failed to complete goal');
      }
    } catch (error) {
      console.error('Error completing goal:', error);
      toast.error('Failed to complete goal');
    }
  };

  const getCategoryIcon = (category) => {
    switch (category) {
      case 'medication': return 'Rx';
      case 'exercise': return 'Ex';
      case 'nutrition': return 'Nu';
      case 'hydration': return 'Hy';
      case 'sleep': return 'Sl';
      case 'appointment': return 'Ap';
      default: return '';
    }
  };

  const handleBookAppointment = async () => {
    if (!selectedDoctor || !selectedDate || !selectedSlot) {
      toast.error('Please select doctor, date, and time slot');
      return;
    }

    try {
      setBookingLoading(true);
      const response = await bookAppointment({
        doctorId: selectedDoctor,
        appointmentDate: selectedDate,
        appointmentTime: selectedSlot,
        reasonForVisit: reason || 'General consultation'
      });

      if (response.success) {
        toast.success('Appointment booked successfully!');
        setDialogOpen(false);
        setSelectedDoctor("");
        setSelectedDate("");
        setSelectedSlot("");
        setReason("");
        setAvailableSlots([]);
        fetchData();
      } else {
        toast.error(response.message || 'Failed to book appointment');
      }
    } catch (error) {
      console.error('Error booking appointment:', error);
      toast.error('Failed to book appointment. Please try again.');
    } finally {
      setBookingLoading(false);
    }
  };

  const getStatusBadgeVariant = (status) => {
    switch (status) {
      case 'confirmed': return 'default';
      case 'pending': return 'secondary';
      case 'completed': return 'outline';
      case 'cancelled': return 'destructive';
      default: return 'secondary';
    }
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      weekday: 'short',
      month: 'short',
      day: 'numeric',
      year: 'numeric'
    });
  };

  const formatTime = (timeString) => {
    return timeString;
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-background">
        <Navbar />
        <div className="flex items-center justify-center h-[calc(100vh-4rem)]">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <div className="container mx-auto px-4 py-8 max-w-7xl">
        <div className="mb-8">
          <h1 className="text-3xl font-bold mb-2">Welcome back, {user?.fullName || user?.name}!</h1>
          <p className="text-muted-foreground">Manage your appointments and find doctors</p>
        </div>

        {/* Stats Cards */}
        <div className="grid gap-4 md:grid-cols-4 mb-6">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Appointments</CardTitle>
              <Calendar className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{appointments.length}</div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Upcoming</CardTitle>
              <Clock className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {appointments.filter(a => a.status === 'pending' || a.status === 'confirmed').length}
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Completed</CardTitle>
              <Activity className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {appointments.filter(a => a.status === 'completed').length}
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Today's Goals</CardTitle>
              <CheckCircle className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {goals.filter(g => g.isCompleted).length}/{goals.length}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Today's Goals Section */}
        <Card className="mb-6">
          <CardHeader className="flex flex-row items-center justify-between">
            <div>
              <CardTitle>Today's Health Goals</CardTitle>
              <CardDescription>
                {new Date().toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' })}
              </CardDescription>
            </div>
            <Dialog open={goalDialogOpen} onOpenChange={setGoalDialogOpen}>
              <DialogTrigger asChild>
                <Button size="sm">
                  <Plus className="h-4 w-4 mr-1" />
                  Add Goal
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Add Today's Goal</DialogTitle>
                  <DialogDescription>Create a health goal to track for today</DialogDescription>
                </DialogHeader>
                <div className="space-y-4 py-4">
                  <div className="space-y-2">
                    <Label htmlFor="goalTitle">Goal Title *</Label>
                    <Input
                      id="goalTitle"
                      placeholder="e.g., Take morning medication"
                      value={newGoal.title}
                      onChange={(e) => setNewGoal({ ...newGoal, title: e.target.value })}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="goalCategory">Category</Label>
                    <Select value={newGoal.category} onValueChange={(value) => setNewGoal({ ...newGoal, category: value })}>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="medication">Medication</SelectItem>
                        <SelectItem value="exercise">Exercise</SelectItem>
                        <SelectItem value="nutrition">Nutrition</SelectItem>
                        <SelectItem value="hydration">Hydration</SelectItem>
                        <SelectItem value="sleep">Sleep</SelectItem>
                        <SelectItem value="appointment">Appointment</SelectItem>
                        <SelectItem value="other">Other</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <div className="space-y-2">
                      <Label htmlFor="goalTarget">Target (Optional)</Label>
                      <Input
                        id="goalTarget"
                        type="number"
                        placeholder="e.g., 8"
                        value={newGoal.targetValue}
                        onChange={(e) => setNewGoal({ ...newGoal, targetValue: e.target.value })}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="goalUnit">Unit</Label>
                      <Input
                        id="goalUnit"
                        placeholder="e.g., glasses, steps"
                        value={newGoal.unit}
                        onChange={(e) => setNewGoal({ ...newGoal, unit: e.target.value })}
                      />
                    </div>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="goalDescription">Description (Optional)</Label>
                    <Textarea
                      id="goalDescription"
                      placeholder="Add more details about your goal"
                      value={newGoal.description}
                      onChange={(e) => setNewGoal({ ...newGoal, description: e.target.value })}
                      rows={2}
                    />
                  </div>
                  <Button onClick={handleCreateGoal} className="w-full">Create Goal</Button>
                </div>
              </DialogContent>
            </Dialog>
          </CardHeader>
          <CardContent>
            {goals.length === 0 ? (
              <p className="text-center text-muted-foreground py-8">
                No goals set for today. Click "Add Goal" to create one!
              </p>
            ) : (
              <div className="space-y-3">
                {goals.map((goal) => (
                  <div
                    key={goal._id}
                    className={`flex items-center justify-between p-4 border rounded-lg transition-all ${
                      goal.isCompleted ? 'bg-muted/50 border-green-200' : 'hover:border-primary'
                    }`}
                  >
                    <div className="flex items-start gap-3 flex-1">
                      <div className="text-2xl mt-0.5">{getCategoryIcon(goal.category)}</div>
                      <div className="flex-1">
                        <div className="flex items-center gap-2">
                          <p className={`font-medium ${goal.isCompleted ? 'line-through text-muted-foreground' : ''}`}>
                            {goal.title}
                          </p>
                          <Badge variant={goal.isCompleted ? 'default' : 'secondary'} className="text-xs">
                            {goal.category}
                          </Badge>
                        </div>
                        {goal.description && (
                          <p className="text-sm text-muted-foreground mt-1">{goal.description}</p>
                        )}
                        {goal.targetValue && (
                          <p className="text-sm mt-1">
                            Target: {goal.targetValue} {goal.unit}
                          </p>
                        )}
                        {goal.reminderTime && (
                          <p className="text-xs text-muted-foreground mt-1">
                            ⏰ Reminder: {goal.reminderTime}
                          </p>
                        )}
                      </div>
                    </div>
                    <div>
                      {!goal.isCompleted ? (
                        <Button size="sm" variant="outline" onClick={() => handleCompleteGoal(goal._id)}>
                          <CheckCircle className="h-4 w-4 mr-1" />
                          Complete
                        </Button>
                      ) : (
                        <Badge variant="default" className="bg-green-600">
                          Completed
                        </Badge>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Main Content Tabs */}
        <Tabs defaultValue="appointments" className="space-y-4">
          <TabsList>
            <TabsTrigger value="appointments">My Appointments</TabsTrigger>
            <TabsTrigger value="find-doctors">Find Doctors</TabsTrigger>
          </TabsList>

          {/* My Appointments Tab */}
          <TabsContent value="appointments" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Your Appointments</CardTitle>
                <CardDescription>View and manage your scheduled appointments</CardDescription>
              </CardHeader>
              <CardContent>
                {appointments.length === 0 ? (
                  <p className="text-center text-muted-foreground py-8">No appointments yet. Book your first appointment in the "Find Doctors" tab!</p>
                ) : (
                  <div className="space-y-4">
                    {appointments.map((appointment) => (
                      <div key={appointment._id} className="flex items-center justify-between p-4 border rounded-lg">
                        <div className="space-y-1">
                          <div className="flex items-center gap-2">
                            <User className="h-4 w-4 text-muted-foreground" />
                            <p className="font-medium">
                              Dr. {appointment.doctorId?.fullName || 'Unknown'}
                            </p>
                            <Badge variant={getStatusBadgeVariant(appointment.status)}>
                              {appointment.status}
                            </Badge>
                          </div>
                          <div className="flex items-center gap-4 text-sm text-muted-foreground">
                            <span className="flex items-center gap-1">
                              <Calendar className="h-3 w-3" />
                              {formatDate(appointment.date)}
                            </span>
                            <span className="flex items-center gap-1">
                              <Clock className="h-3 w-3" />
                              {formatTime(appointment.time)}
                            </span>
                          </div>
                          {appointment.reason && (
                            <p className="text-sm text-muted-foreground">Reason: {appointment.reason}</p>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* Find Doctors Tab */}
          <TabsContent value="find-doctors" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Find & Book Doctors</CardTitle>
                <CardDescription>Browse doctors and view their available time slots</CardDescription>
              </CardHeader>
              <CardContent>
                {doctors.length === 0 ? (
                  <p className="text-center text-muted-foreground py-8">No doctors available at the moment.</p>
                ) : (
                  <div className="grid gap-4">
                    {doctors.map((doctor) => (
                      <div key={doctor._id} className="p-4 border rounded-lg hover:border-primary transition-colors">
                        <div className="flex items-start justify-between mb-4">
                          <div className="space-y-1 flex-1">
                            <div className="flex items-center gap-2">
                              <User className="h-5 w-5 text-primary" />
                              <p className="font-semibold text-lg">Dr. {doctor.fullName}</p>
                            </div>
                            <p className="text-sm text-muted-foreground flex items-center gap-2">
                              <Badge variant="outline">{doctor.specialization || 'General Practitioner'}</Badge>
                            </p>
                            <p className="text-xs text-muted-foreground">{doctor.email}</p>
                            {doctor.phoneNumber && (
                              <p className="text-xs text-muted-foreground">📞 {doctor.phoneNumber}</p>
                            )}
                          </div>
                          <Button 
                            size="sm"
                            onClick={() => handleDoctorSelect(doctor)}
                          >
                            <Calendar className="h-4 w-4 mr-1" />
                            View Calendar
                          </Button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}

                {/* Calendar Dialog */}
                <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
                  <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
                    <DialogHeader>
                      <DialogTitle>
                        Book Appointment with Dr. {selectedDoctorDetails?.fullName}
                      </DialogTitle>
                      <DialogDescription>
                        {selectedDoctorDetails?.specialization || 'General Practitioner'} - Select a date and time slot
                      </DialogDescription>
                    </DialogHeader>

                    {loadingSlots ? (
                      <div className="flex items-center justify-center py-12">
                        <Loader2 className="h-8 w-8 animate-spin text-primary" />
                        <span className="ml-3">Loading available slots...</span>
                      </div>
                    ) : (
                      <div className="space-y-6 py-4">
                        {/* Week Calendar View */}
                        <div>
                          <Label className="text-base font-semibold mb-3 block">Select a Date</Label>
                          <div className="grid grid-cols-7 gap-2">
                            {weekDates.map((date) => {
                              const dateStr = date.toISOString().split('T')[0];
                              const daySlots = slotsMap[dateStr] || [];
                              const isSelected = selectedDate === dateStr;
                              const isToday = dateStr === new Date().toISOString().split('T')[0];

                              return (
                                <button
                                  key={dateStr}
                                  onClick={() => handleDateSelect(date)}
                                  className={`p-3 rounded-lg border-2 transition-all text-center ${
                                    isSelected 
                                      ? 'border-primary bg-primary text-primary-foreground shadow-md' 
                                      : daySlots.length > 0 
                                        ? 'border-border hover:border-primary bg-background' 
                                        : 'border-border bg-muted text-muted-foreground cursor-not-allowed'
                                  }`}
                                  disabled={daySlots.length === 0}
                                >
                                  <div className="text-xs font-medium">
                                    {date.toLocaleDateString('en-US', { weekday: 'short' })}
                                  </div>
                                  <div className="text-lg font-bold mt-1">
                                    {date.getDate()}
                                  </div>
                                  <div className="text-xs mt-1">
                                    {isToday ? (
                                      <Badge variant="secondary" className="text-[10px] px-1 py-0">Today</Badge>
                                    ) : (
                                      date.toLocaleDateString('en-US', { month: 'short' })
                                    )}
                                  </div>
                                  <div className="text-xs mt-2">
                                    {daySlots.length > 0 ? (
                                      <span className="text-green-600 font-semibold">{daySlots.length} slots</span>
                                    ) : (
                                      <span className="text-muted-foreground">No slots</span>
                                    )}
                                  </div>
                                </button>
                              );
                            })}
                          </div>
                        </div>

                        {/* Time Slots */}
                        {selectedDate && (
                          <div>
                            <Label className="text-base font-semibold mb-3 block">
                              Available Time Slots - {new Date(selectedDate).toLocaleDateString('en-US', { 
                                weekday: 'long', 
                                month: 'long', 
                                day: 'numeric' 
                              })}
                            </Label>
                            {availableSlots.length === 0 ? (
                              <p className="text-center text-muted-foreground py-8 border rounded-lg">
                                No time slots available for this date
                              </p>
                            ) : (
                              <div className="grid grid-cols-4 gap-2 max-h-60 overflow-y-auto p-2 border rounded-lg">
                                {availableSlots.map((slot) => (
                                  <button
                                    key={slot}
                                    onClick={() => setSelectedSlot(slot)}
                                    className={`p-3 rounded-md border-2 text-center font-medium transition-all ${
                                      selectedSlot === slot
                                        ? 'border-primary bg-primary text-primary-foreground shadow-md'
                                        : 'border-border hover:border-primary bg-background'
                                    }`}
                                  >
                                    <Clock className="h-4 w-4 mx-auto mb-1" />
                                    {slot}
                                  </button>
                                ))}
                              </div>
                            )}
                          </div>
                        )}

                        {/* Reason for Visit */}
                        {selectedSlot && (
                          <div className="space-y-2">
                            <Label htmlFor="reason">Reason for Visit (Optional)</Label>
                            <Textarea
                              id="reason"
                              placeholder="Brief description of your concern or symptoms"
                              value={reason}
                              onChange={(e) => setReason(e.target.value)}
                              rows={3}
                            />
                          </div>
                        )}

                        {/* Action Buttons */}
                        <div className="flex gap-3 pt-4 border-t">
                          <Button 
                            variant="outline"
                            onClick={() => {
                              setDialogOpen(false);
                              setSelectedDate("");
                              setSelectedSlot("");
                              setReason("");
                            }}
                            className="flex-1"
                          >
                            Cancel
                          </Button>
                          <Button 
                            onClick={handleBookAppointment} 
                            disabled={!selectedSlot || bookingLoading}
                            className="flex-1"
                          >
                            {bookingLoading ? (
                              <>
                                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                Booking...
                              </>
                            ) : (
                              <>
                                <CheckCircle className="mr-2 h-4 w-4" />
                                Confirm Booking
                              </>
                            )}
                          </Button>
                        </div>
                      </div>
                    )}
                  </DialogContent>
                </Dialog>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
};

export default PatientDashboard;
