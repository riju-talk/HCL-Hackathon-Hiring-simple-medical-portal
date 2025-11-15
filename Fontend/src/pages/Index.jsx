import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Heart, Target, Bell, Users, FileText, Lock, ArrowRight } from "lucide-react";
import heroImage from "@/assets/hero-illustration.png";
import { Navbar } from "@/components/Navbar";

const Index = () => {
  const navigate = useNavigate();

  const services = [
    {
      icon: Target,
      title: "Track Wellness Goals",
      description: "Monitor your daily health metrics including steps, sleep, and active minutes to stay on track with your wellness journey.",
      bgColor: "bg-card",
    },
    {
      icon: Bell,
      title: "Preventive Care Reminders",
      description: "Never miss important checkups and vaccinations with personalized reminders for your preventive care needs.",
      bgColor: "bg-primary",
      textColor: "text-primary-foreground",
    },
    {
      icon: Users,
      title: "Provider Connection",
      description: "Seamlessly connect with healthcare providers who can monitor your progress and provide guidance.",
      bgColor: "bg-dark-card",
      textColor: "text-dark-card-foreground",
    },
    {
      icon: FileText,
      title: "Progress Insights",
      description: "Get detailed insights into your health trends and compliance rates to make informed decisions.",
      bgColor: "bg-card",
    },
    {
      icon: FileText,
      title: "Health Records",
      description: "Maintain comprehensive health records including allergies, medications, and medical history in one secure place.",
      bgColor: "bg-primary",
      textColor: "text-primary-foreground",
    },
    {
      icon: Lock,
      title: "Privacy First",
      description: "Your health data is protected with industry-leading security measures and strict privacy protocols.",
      bgColor: "bg-dark-card",
      textColor: "text-dark-card-foreground",
    },
  ];

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      
      {/* Hero Section */}
      <section className="container mx-auto px-4 py-16 lg:py-24">
        <div className="grid lg:grid-cols-2 gap-12 items-center">
          <div className="space-y-6">
            <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold leading-tight">
              Your Wellness Companion
            </h1>
            <p className="text-lg text-muted-foreground leading-relaxed">
              Track your health goals, stay on top of preventive care, and connect with healthcare providers — all in one secure platform.
            </p>
            <Button onClick={() => navigate("/auth")} size="lg" className="group">
              Start Your Journey
              <ArrowRight className="ml-2 h-4 w-4 transition-transform group-hover:translate-x-1" />
            </Button>
          </div>
          <div className="relative">
            <img 
              src={heroImage} 
              alt="Healthcare wellness illustration" 
              className="w-full h-auto rounded-2xl"
            />
          </div>
        </div>
      </section>

      {/* Services Section */}
      <section className="bg-health-light py-16">
        <div className="container mx-auto px-4">
          <div className="mb-12">
            <div className="inline-block px-4 py-1.5 bg-primary text-primary-foreground rounded-full text-sm font-semibold mb-4">
              Services
            </div>
            <p className="text-muted-foreground max-w-3xl">
              Creating a robust patient and provider portal requires a blend of intuitive design and stringent security. Our focus is on creating a seamless experience while prioritizing data protection and user engagement.
            </p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {services.map((service, index) => {
              const Icon = service.icon;
              return (
                <Card 
                  key={index} 
                  className={`${service.bgColor} border-0 hover:shadow-lg transition-shadow`}
                >
                  <CardHeader>
                    <div className="flex items-start justify-between mb-2">
                      <CardTitle className={service.textColor || "text-card-foreground"}>
                        {service.title}
                      </CardTitle>
                      <Icon className={`h-5 w-5 ${service.textColor || "text-foreground"}`} />
                    </div>
                  </CardHeader>
                  <CardContent>
                    <CardDescription className={service.textColor ? "text-primary-foreground/80" : ""}>
                      {service.description}
                    </CardDescription>
                    <Button 
                      variant="link" 
                      className={`mt-4 p-0 h-auto ${service.textColor || "text-foreground"}`}
                    >
                      Learn more <ArrowRight className="ml-1 h-4 w-4" />
                    </Button>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        </div>
      </section>
    </div>
  );
};

export default Index;
