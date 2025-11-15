import { useState, useEffect } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { Navbar } from "@/components/Navbar";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { toast } from "sonner";
import { User, Mail, Phone, MapPin, FileText, Loader2, Clock, Calendar, Trash2, Plus, CheckCircle } from "lucide-react";
import { updatePatientProfile, updateDoctorProfile, getPatientProfile, getDoctorById, getDoctorAvailability, getMyDoctorAvailability, setDoctorAvailability } from "@/lib/api";

const Profile = () => {
  const { user, updateProfile } = useAuth();
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  
  // Basic Information
  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [phoneNumber, setPhoneNumber] = useState("");
  const [address, setAddress] = useState("");
  
  // Health Information (for patients)
  const [dateOfBirth, setDateOfBirth] = useState("");
  const [bloodType, setBloodType] = useState("");
  const [allergies, setAllergies] = useState("");
  const [currentMedications, setCurrentMedications] = useState("");
  const [medicalHistory, setMedicalHistory] = useState("");
  
  // Doctor Information
  const [specialization, setSpecialization] = useState("");
  const [startTime, setStartTime] = useState("09:00");
  const [endTime, setEndTime] = useState("17:00");
  const [hasAvailability, setHasAvailability] = useState(false);

  useEffect(() => {
    const fetchProfile = async () => {
      if (!user) return;
      
      setLoading(true);
      try {
        // Set basic info from auth context
        setFullName(user.name || "");
        setEmail(user.email || "");
        
        // Fetch additional profile data for patients
        if (user.role === "patient") {
          const response = await getPatientProfile(user.id);
          if (response.success) {
            const userData = response.patient;
            const profileData = response.profile;
            
            setPhoneNumber(userData.phoneNumber || "");
            setAddress(userData.address || "");
            setDateOfBirth(userData.dateOfBirth?.split('T')[0] || "");
            
            if (profileData) {
              setBloodType(profileData.bloodType || "");
              setAllergies(profileData.allergies?.join(", ") || "");
              setCurrentMedications(profileData.currentMedications?.join(", ") || "");
              setMedicalHistory(profileData.medicalHistory?.join(", ") || "");
            }
          }
        } else if (user.role === "doctor") {
          // Fetch doctor profile from backend
          const doctorResponse = await getDoctorById(user.id);
          if (doctorResponse.success && doctorResponse.doctor) {
            const doctorData = doctorResponse.doctor;
            setPhoneNumber(doctorData.phoneNumber || "");
            setAddress(doctorData.address || "");
            setSpecialization(doctorData.specialization || "");
          }
          
          // Fetch doctor availability
          try {
            const availResponse = await getMyDoctorAvailability();
            if (availResponse.success && availResponse.availability && availResponse.availability.slots && availResponse.availability.slots.length > 0) {
              const firstSlot = availResponse.availability.slots[0];
              setStartTime(firstSlot.startTime || "09:00");
              setEndTime(firstSlot.endTime || "17:00");
              setHasAvailability(true);
            }
          } catch (err) {
            console.error('Error fetching availability:', err);
            // Continue without availability
          }
        }
      } catch (error) {
        console.error("Error fetching profile:", error);
        toast.error("Failed to load profile data");
      } finally {
        setLoading(false);
      }
    };

    fetchProfile();
  }, [user]);

  const handleSave = async (e) => {
    e.preventDefault();
    if (!user) return;
    
    setSaving(true);
    try {
      const profileData = {
        fullName,
        email,
        phoneNumber,
        address
      };

      if (user.role === "patient") {
        // Add patient-specific fields
        profileData.dateOfBirth = dateOfBirth;
        profileData.bloodType = bloodType;
        profileData.allergies = allergies.split(",").map(a => a.trim()).filter(Boolean);
        profileData.currentMedications = currentMedications.split(",").map(m => m.trim()).filter(Boolean);
        profileData.medicalHistory = medicalHistory.split(",").map(h => h.trim()).filter(Boolean);
        
        const response = await updatePatientProfile(profileData);
        if (response.success) {
          updateProfile({ name: fullName, email });
          toast.success("Profile updated successfully!");
        }
      } else if (user.role === "doctor") {
        profileData.specialization = specialization;
        
        const response = await updateDoctorProfile(profileData);
        if (response.success) {
          updateProfile({ name: fullName, email });
          toast.success("Profile updated successfully!");
        }
      }
    } catch (error) {
      console.error("Error updating profile:", error);
      toast.error(error.response?.data?.message || "Failed to update profile");
    } finally {
      setSaving(false);
    }
  };

  const calculateAppointmentsPerDay = (start, end) => {
    if (!start || !end) return 0;
    const [startHour, startMin] = start.split(':').map(Number);
    const [endHour, endMin] = end.split(':').map(Number);
    const startMinutes = startHour * 60 + startMin;
    const endMinutes = endHour * 60 + endMin;
    const totalMinutes = endMinutes - startMinutes;
    return Math.floor(totalMinutes / 30); // 30-minute slots
  };

  const handleSaveAvailability = async () => {
    if (!startTime || !endTime) {
      toast.error('Please set start and end time');
      return;
    }

    const [startHour, startMin] = startTime.split(':').map(Number);
    const [endHour, endMin] = endTime.split(':').map(Number);
    
    if (startHour * 60 + startMin >= endHour * 60 + endMin) {
      toast.error('End time must be after start time');
      return;
    }

    try {
      setSaving(true);
      
      // Create slots for all 7 days with the same time
      const slots = [
        'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday'
      ].map(day => ({
        dayOfWeek: day,
        startTime: startTime,
        endTime: endTime,
        isActive: true
      }));

      const response = await setDoctorAvailability(slots);
      if (response.success) {
        setHasAvailability(true);
        toast.success('Availability updated successfully!');
      } else {
        toast.error(response.message || 'Failed to update availability');
      }
    } catch (error) {
      console.error('Error saving availability:', error);
      toast.error('Failed to save availability');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-background">
        <Navbar />
        <div className="flex items-center justify-center min-h-[60vh]">
          <div className="text-center">
            <Loader2 className="h-8 w-8 animate-spin mx-auto mb-4 text-primary" />
            <p className="text-muted-foreground">Loading profile...</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <div className="container mx-auto px-4 py-8 max-w-3xl">
        <div className="mb-8">
          <h1 className="text-3xl font-bold mb-2">Profile Settings</h1>
          <p className="text-muted-foreground">Manage your personal information and health details</p>
        </div>

        <form onSubmit={handleSave} className="space-y-6">
          {/* Basic Information */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <User className="h-5 w-5" />
                Basic Information
              </CardTitle>
              <CardDescription>Your personal details</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="fullName">Full Name</Label>
                <Input
                  id="fullName"
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  placeholder="Rijusmit Biswas"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="email">Email</Label>
                <div className="flex items-center gap-2">
                  <Mail className="h-4 w-4 text-muted-foreground" />
                  <Input
                    id="email"
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="rijusmit.biswas@gmail.com"
                  />
                </div>
              </div>
              <div className="space-y-2">
                <Label htmlFor="phoneNumber">Phone Number</Label>
                <div className="flex items-center gap-2">
                  <Phone className="h-4 w-4 text-muted-foreground" />
                  <Input
                    id="phoneNumber"
                    type="tel"
                    value={phoneNumber}
                    onChange={(e) => setPhoneNumber(e.target.value)}
                    placeholder="+1 (555) 000-0000"
                  />
                </div>
              </div>
              <div className="space-y-2">
                <Label htmlFor="address">Address</Label>
                <div className="flex items-center gap-2">
                  <MapPin className="h-4 w-4 text-muted-foreground" />
                  <Input
                    id="address"
                    value={address}
                    onChange={(e) => setAddress(e.target.value)}
                    placeholder="123 Main St, City, State"
                  />
                </div>
              </div>
              {user?.role === "patient" && (
                <>
                  <div className="space-y-2">
                    <Label htmlFor="dateOfBirth">Date of Birth</Label>
                    <Input
                      id="dateOfBirth"
                      type="date"
                      value={dateOfBirth}
                      onChange={(e) => setDateOfBirth(e.target.value)}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="bloodType">Blood Type</Label>
                    <Input
                      id="bloodType"
                      value={bloodType}
                      onChange={(e) => setBloodType(e.target.value)}
                      placeholder="A+, B+, O+, etc."
                    />
                  </div>
                </>
              )}
              {user?.role === "doctor" && (
                <div className="space-y-2">
                  <Label htmlFor="specialization">Specialization</Label>
                  <Input
                    id="specialization"
                    value={specialization}
                    onChange={(e) => setSpecialization(e.target.value)}
                    placeholder="Cardiology, Pediatrics, etc."
                  />
                </div>
              )}
            </CardContent>
          </Card>

          {/* Health Information - Only for Patients */}
          {user?.role === "patient" && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <FileText className="h-5 w-5" />
                  Health Information
                </CardTitle>
                <CardDescription>Important medical details</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="allergies">Allergies</Label>
                  <Textarea
                    id="allergies"
                    value={allergies}
                    onChange={(e) => setAllergies(e.target.value)}
                    placeholder="List any allergies, separated by commas..."
                    rows={3}
                  />
                  <p className="text-xs text-muted-foreground">Separate multiple allergies with commas</p>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="currentMedications">Current Medications</Label>
                  <Textarea
                    id="currentMedications"
                    value={currentMedications}
                    onChange={(e) => setCurrentMedications(e.target.value)}
                    placeholder="List current medications, separated by commas..."
                    rows={3}
                  />
                  <p className="text-xs text-muted-foreground">Separate multiple medications with commas</p>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="medicalHistory">Medical History</Label>
                  <Textarea
                    id="medicalHistory"
                    value={medicalHistory}
                    onChange={(e) => setMedicalHistory(e.target.value)}
                    placeholder="List medical history items, separated by commas..."
                    rows={3}
                  />
                  <p className="text-xs text-muted-foreground">Separate multiple items with commas</p>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Availability Settings - Only for Doctors */}
          {user?.role === "doctor" && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Clock className="h-5 w-5" />
                  Working Hours
                </CardTitle>
                <CardDescription>
                  Set your daily working hours (same for all days). Each appointment is 30 minutes.
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="workStartTime">Start Time</Label>
                    <Input
                      id="workStartTime"
                      type="time"
                      value={startTime}
                      onChange={(e) => setStartTime(e.target.value)}
                      className="text-lg"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="workEndTime">End Time</Label>
                    <Input
                      id="workEndTime"
                      type="time"
                      value={endTime}
                      onChange={(e) => setEndTime(e.target.value)}
                      className="text-lg"
                    />
                  </div>
                </div>

                {startTime && endTime && calculateAppointmentsPerDay(startTime, endTime) > 0 && (
                  <div className="p-4 bg-primary/10 border border-primary/20 rounded-lg">
                    <div className="flex items-center gap-2 text-sm">
                      <Calendar className="h-5 w-5 text-primary" />
                      <div>
                        <p className="font-semibold">Appointments per day: {calculateAppointmentsPerDay(startTime, endTime)}</p>
                        <p className="text-muted-foreground text-xs mt-1">
                          Working hours: {startTime} - {endTime} (30-minute slots)
                        </p>
                      </div>
                    </div>
                  </div>
                )}

                {hasAvailability && (
                  <div className="flex items-center gap-2 text-sm text-green-600">
                    <CheckCircle className="h-4 w-4" />
                    <span>Availability is configured. Update times above and save to change.</span>
                  </div>
                )}

                <Button
                  type="button"
                  onClick={handleSaveAvailability}
                  variant="default"
                  className="w-full"
                  disabled={saving}
                >
                  {saving ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Saving...
                    </>
                  ) : (
                    <>
                      <Clock className="mr-2 h-4 w-4" />
                      {hasAvailability ? 'Update Working Hours' : 'Set Working Hours'}
                    </>
                  )}
                </Button>
              </CardContent>
            </Card>
          )}

          <div className="flex gap-4">
            <Button type="submit" className="flex-1" disabled={saving}>
              {saving ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Saving...
                </>
              ) : (
                "Save Changes"
              )}
            </Button>
            <Button 
              type="button" 
              variant="outline" 
              className="flex-1"
              onClick={() => window.history.back()}
            >
              Cancel
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default Profile;
