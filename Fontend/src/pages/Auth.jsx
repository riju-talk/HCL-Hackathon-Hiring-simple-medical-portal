import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Checkbox } from "@/components/ui/checkbox";
import { toast } from "sonner";
import { Heart } from "lucide-react";

const Auth = () => {
  const navigate = useNavigate();
  const { login, register } = useAuth();
  
  const [loginEmail, setLoginEmail] = useState("");
  const [loginPassword, setLoginPassword] = useState("");
  const [loginRole, setLoginRole] = useState("patient");
  
  const [registerEmail, setRegisterEmail] = useState("");
  const [registerPassword, setRegisterPassword] = useState("");
  const [registerName, setRegisterName] = useState("");
  const [registerRole, setRegisterRole] = useState("patient");
  const [consentAgreed, setConsentAgreed] = useState(false);

  const handleLogin = async (e) => {
    e.preventDefault();
    try {
      await login(loginEmail, loginPassword, loginRole);
      toast.success("Login successful!");
      navigate(loginRole === "provider" ? "/provider-dashboard" : "/patient-dashboard");
    } catch (error) {
      toast.error("Login failed. Please try again.");
    }
  };

  const handleRegister = async (e) => {
    e.preventDefault();
    if (!consentAgreed) {
      toast.error("Please agree to the consent terms");
      return;
    }
    try {
      await register(registerEmail, registerPassword, registerName, registerRole);
      toast.success("Registration successful!");
      navigate(registerRole === "provider" ? "/provider-dashboard" : "/patient-dashboard");
    } catch (error) {
      toast.error("Registration failed. Please try again.");
    }
  };

  return (
    <div className="min-h-screen bg-health-light flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <div className="flex items-center justify-center gap-2 mb-2">
            <Heart className="h-10 w-10 text-primary" fill="currentColor" />
            <h1 className="text-3xl font-bold">HealthPartner</h1>
          </div>
          <p className="text-muted-foreground">Your wellness companion</p>
        </div>

        <Tabs defaultValue="login" className="w-full">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="login">Login</TabsTrigger>
            <TabsTrigger value="register">Register</TabsTrigger>
          </TabsList>

          <TabsContent value="login">
            <Card>
              <CardHeader>
                <CardTitle>Welcome back</CardTitle>
                <CardDescription>Login to your account</CardDescription>
              </CardHeader>
              <CardContent>
                <form onSubmit={handleLogin} className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="login-email">Email</Label>
                    <Input
                      id="login-email"
                      type="email"
                      placeholder="you@example.com"
                      value={loginEmail}
                      onChange={(e) => setLoginEmail(e.target.value)}
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="login-password">Password</Label>
                    <Input
                      id="login-password"
                      type="password"
                      value={loginPassword}
                      onChange={(e) => setLoginPassword(e.target.value)}
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Role</Label>
                    <RadioGroup value={loginRole} onValueChange={(value) => setLoginRole(value)}>
                      <div className="flex items-center space-x-2">
                        <RadioGroupItem value="patient" id="login-patient" />
                        <Label htmlFor="login-patient" className="font-normal">Patient</Label>
                      </div>
                      <div className="flex items-center space-x-2">
                        <RadioGroupItem value="provider" id="login-provider" />
                        <Label htmlFor="login-provider" className="font-normal">Healthcare Provider</Label>
                      </div>
                    </RadioGroup>
                  </div>
                  <Button type="submit" className="w-full">Login</Button>
                </form>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="register">
            <Card>
              <CardHeader>
                <CardTitle>Create an account</CardTitle>
                <CardDescription>Get started with HealthPartner</CardDescription>
              </CardHeader>
              <CardContent>
                <form onSubmit={handleRegister} className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="register-name">Full Name</Label>
                    <Input
                      id="register-name"
                      type="text"
                      placeholder="John Doe"
                      value={registerName}
                      onChange={(e) => setRegisterName(e.target.value)}
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="register-email">Email</Label>
                    <Input
                      id="register-email"
                      type="email"
                      placeholder="you@example.com"
                      value={registerEmail}
                      onChange={(e) => setRegisterEmail(e.target.value)}
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="register-password">Password</Label>
                    <Input
                      id="register-password"
                      type="password"
                      value={registerPassword}
                      onChange={(e) => setRegisterPassword(e.target.value)}
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Role</Label>
                    <RadioGroup value={registerRole} onValueChange={(value) => setRegisterRole(value)}>
                      <div className="flex items-center space-x-2">
                        <RadioGroupItem value="patient" id="register-patient" />
                        <Label htmlFor="register-patient" className="font-normal">Patient</Label>
                      </div>
                      <div className="flex items-center space-x-2">
                        <RadioGroupItem value="provider" id="register-provider" />
                        <Label htmlFor="register-provider" className="font-normal">Healthcare Provider</Label>
                      </div>
                    </RadioGroup>
                  </div>
                  <div className="flex items-start space-x-2">
                    <Checkbox 
                      id="consent" 
                      checked={consentAgreed}
                      onCheckedChange={(checked) => setConsentAgreed(!!checked)}
                    />
                    <Label htmlFor="consent" className="text-sm font-normal leading-relaxed">
                      I agree to the privacy policy and consent to the collection and use of my health data
                    </Label>
                  </div>
                  <Button type="submit" className="w-full">Create Account</Button>
                </form>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
};

export default Auth;
